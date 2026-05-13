const fs = require('fs');
const db = require('../db');
const path = require('path');
const util = require('util');
const { execFile } = require('child_process');
const { analyzeSubmission } = require('../utils/anomalyDetection');

const execFileAsync = util.promisify(execFile);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const TESTCASE_DIR = path.join(__dirname, '..', 'testcases');

const RESULT_MARKER = '__SBC_RESULT__';

const ensureTempDir = () => {
  if (!fs.existsSync(TEMP_DIR)) {
    fs.mkdirSync(TEMP_DIR, { recursive: true });
  }
};

const safeJsonStringify = (value) => {
  try {
    return JSON.stringify(value || []);
  } catch {
    return JSON.stringify([]);
  }
};

const isValidProblemFunctionName = (name) => {
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(String(name || ''));
};

const toPythonLiteral = (value) => {
  if (value === null || value === undefined) {
    return 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (typeof value === 'number') {
    if (!Number.isFinite(value)) {
      return 'None';
    }

    return String(value);
  }

  if (typeof value === 'string') {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => toPythonLiteral(item)).join(', ')}]`;
  }

  if (typeof value === 'object') {
    const entries = Object.entries(value).map(([key, val]) => {
      return `${JSON.stringify(key)}: ${toPythonLiteral(val)}`;
    });

    return `{${entries.join(', ')}}`;
  }

  return JSON.stringify(String(value));
};

const formatValueForDisplay = (value) => {
  if (value === null || value === undefined) {
    return 'None';
  }

  if (typeof value === 'boolean') {
    return value ? 'True' : 'False';
  }

  if (typeof value === 'string') {
    return value;
  }

  if (typeof value === 'number') {
    return String(value);
  }

  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
};

const buildCallArgs = (input) => {
  if (Array.isArray(input)) {
    return input.map((item) => toPythonLiteral(item)).join(', ');
  }

  return toPythonLiteral(input);
};

const buildPythonTestFile = ({ code, functionName, input, expected }) => {
  const callArgs = buildCallArgs(input);
  const expectedLiteral = toPythonLiteral(expected);
  const expectedDisplay = formatValueForDisplay(expected);

  return `
${code}

import json as __sbc_json

def __sbc_display(value):
    if isinstance(value, str):
        return value

    if isinstance(value, bool):
        return "True" if value else "False"

    if value is None:
        return "None"

    return repr(value)

try:
    __sbc_expected = ${expectedLiteral}
    __sbc_expected_text = ${JSON.stringify(expectedDisplay)}
    __sbc_result = ${functionName}(${callArgs})

    __sbc_output_text = __sbc_display(__sbc_result)

    __sbc_passed = (
        __sbc_result == __sbc_expected
        or str(__sbc_output_text).strip() == str(__sbc_expected_text).strip()
    )

    print("${RESULT_MARKER}" + __sbc_json.dumps({
        "passed": bool(__sbc_passed),
        "output": __sbc_output_text
    }, ensure_ascii=False))

except Exception as __sbc_error:
    print("${RESULT_MARKER}" + __sbc_json.dumps({
        "passed": False,
        "output": type(__sbc_error).__name__ + ": " + str(__sbc_error)
    }, ensure_ascii=False))
`;
};

const parseDockerResult = ({ stdout, stderr }) => {
  const stdoutText = stdout || '';
  const stderrText = stderr || '';

  const resultLine = stdoutText
    .split(/\r?\n/)
    .reverse()
    .find((line) => line.startsWith(RESULT_MARKER));

  if (!resultLine) {
    return {
      passed: false,
      output: stderrText.trim() || stdoutText.trim() || 'Execution failed',
    };
  }

  try {
    const parsed = JSON.parse(resultLine.replace(RESULT_MARKER, ''));

    return {
      passed: Boolean(parsed.passed),
      output:
        parsed.output === undefined || parsed.output === null
          ? ''
          : String(parsed.output).trim(),
    };
  } catch {
    return {
      passed: false,
      output: stderrText.trim() || stdoutText.trim() || 'Failed to parse result',
    };
  }
};

const saveBiometrics = async ({
  otherEvents,
  mouseMoves,
  screenH,
  screenW,
  owner,
  challenge,
}) => {
  if (!owner) return;

  try {
    await db.query(
      `INSERT INTO biometrics
        (other_events, mouse_moves, screen_h, screen_w, biometrics_owner, biometrics_challenge)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        safeJsonStringify(otherEvents),
        safeJsonStringify(mouseMoves),
        screenH || 0,
        screenW || 0,
        owner,
        challenge || null,
      ]
    );
  } catch (err) {
    console.error('SQL error while saving biometrics:', err.sqlMessage || err);
  }
};

const saveFlaggedSubmission = async ({
  userId,
  problemId,
  language,
  code,
  anomaly,
  typingMetrics,
}) => {
  if (!anomaly?.flagged) return;

  try {
    await db.query(
      `INSERT INTO flagged_submissions
        (user_id, problem_id, language, submitted_code, anomaly_score, reasons, typing_metrics)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        userId || null,
        problemId || null,
        language,
        code,
        anomaly.score,
        JSON.stringify(anomaly.reasons || []),
        JSON.stringify(typingMetrics || {}),
      ]
    );
  } catch (err) {
    console.error(
      'SQL error while saving flagged submission:',
      err.sqlMessage || err
    );
  }
};

const saveSolvedStatus = async ({ userId, problemId, code }) => {
  if (!userId || !problemId) return;

  try {
    await db.query(
      `INSERT INTO user_problem_status (user_id, problem_id, status, code)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
        status = VALUES(status),
        code = VALUES(code),
        solved_on = CURRENT_TIMESTAMP`,
      [userId, problemId, 'Solved', code]
    );
  } catch (err) {
    console.error('Failed to save problem status:', err.sqlMessage || err);
  }
};

const runPythonInDocker = async (filename) => {
  const dockerArgs = [
    'run',
    '--rm',

    '--network',
    'none',

    '--memory',
    '128m',

    '--cpus',
    '0.5',

    '--pids-limit',
    '64',

    '--read-only',

    '--tmpfs',
    '/tmp:rw,noexec,nosuid,size=64m',

    '--cap-drop',
    'ALL',

    '--security-opt',
    'no-new-privileges',

    '-e',
    'PYTHONDONTWRITEBYTECODE=1',

    '-v',
    `${TEMP_DIR}:/app:ro`,

    'py-runner',
    'python3',
    `/app/${filename}`,
  ];

  return execFileAsync('docker', dockerArgs, {
    timeout: 10000,
    maxBuffer: 1024 * 1024,
  });
};

const runCode = async (req, res) => {
  const {
    code,
    language,
    problem,
    problemId,
    userId,

    metrics,

    mouse_moves: bodyMouseMoves,
    other_events: bodyOtherEvents,
    typing_metrics: bodyTypingMetrics,
    typing_sessions: bodyTypingSessions,

    screen_h: bodyScreenH,
    screen_w: bodyScreenW,

    biometrics_owner,
    biometrics_challenge,
  } = req.body;

  const mouse_moves = metrics?.mouse_moves || bodyMouseMoves || [];
  const other_events = metrics?.other_events || bodyOtherEvents || [];
  const typing_metrics = metrics?.typing_metrics || bodyTypingMetrics || {};
  const typing_sessions = metrics?.typing_sessions || bodyTypingSessions || [];

  const screen_h = metrics?.screen_h || bodyScreenH || 0;
  const screen_w = metrics?.screen_w || bodyScreenW || 0;

  const bio_owner = userId || biometrics_owner;
  const bio_challenge = problemId || biometrics_challenge;

  let filepath = null;

  try {
    ensureTempDir();

    if (!code || typeof code !== 'string') {
      return res.status(400).json({ error: 'Missing code' });
    }

    if (language !== 'python') {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    if (!problem) {
      return res.status(400).json({ error: 'Missing problem name' });
    }

    if (!isValidProblemFunctionName(problem)) {
      return res.status(400).json({ error: 'Invalid problem function name' });
    }

    await saveBiometrics({
      otherEvents: [
        ...other_events,
        {
          type: 'typing_summary',
          typing_metrics,
          typing_sessions_count: Array.isArray(typing_sessions)
            ? typing_sessions.length
            : 0,
        },
      ],
      mouseMoves: mouse_moves,
      screenH: screen_h,
      screenW: screen_w,
      owner: bio_owner,
      challenge: bio_challenge,
    });

    const testcaseFile = path.join(TESTCASE_DIR, `${problem}.json`);

    if (!fs.existsSync(testcaseFile)) {
      return res.status(404).json({
        error: `Testcases for problem '${problem}' not found.`,
      });
    }

    let testData;

    try {
      testData = JSON.parse(fs.readFileSync(testcaseFile, 'utf8'));
    } catch (err) {
      console.error('Invalid testcase JSON:', err);

      return res.status(500).json({
        error: `Invalid testcase file for problem '${problem}'.`,
      });
    }

    const tests = Array.isArray(testData.tests) ? testData.tests : [];

    if (tests.length === 0) {
      return res.status(500).json({
        error: `No testcases found for problem '${problem}'.`,
      });
    }

    const results = [];
    const uniqueId = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;

    const filename = `temp-${uniqueId}.py`;
    filepath = path.join(TEMP_DIR, filename);

    for (const test of tests) {
      const input = test.input;
      const expected = formatValueForDisplay(test.expected);

      const codeWithInput = buildPythonTestFile({
        code,
        functionName: problem,
        input,
        expected: test.expected,
      });

      fs.writeFileSync(filepath, codeWithInput, 'utf8');

      try {
        const { stdout, stderr } = await runPythonInDocker(filename);
        const parsed = parseDockerResult({ stdout, stderr });

        results.push({
          input,
          expected,
          output: parsed.output,
          passed: parsed.passed,
        });
      } catch (err) {
        const output =
          err.stderr?.trim() ||
          err.stdout?.trim() ||
          err.message ||
          'Execution failed';

        results.push({
          input,
          expected,
          output,
          passed: false,
        });

        break;
      }
    }

    const passedAll = results.every((result) => result.passed);

    const anomaly = analyzeSubmission({
      code,
      typingMetrics: typing_metrics,
      otherEvents: other_events || [],
    });

    await saveFlaggedSubmission({
      userId: userId || null,
      problemId: problemId || null,
      language,
      code,
      anomaly,
      typingMetrics: {
        ...typing_metrics,
        typing_sessions_count: Array.isArray(typing_sessions)
          ? typing_sessions.length
          : 0,
      },
    });

    if (passedAll) {
      await saveSolvedStatus({
        userId,
        problemId,
        code,
      });
    }

    return res.json({
      passedAll,
      results,
      anomaly: {
        flagged: anomaly.flagged,
        score: anomaly.score,
      },
    });
  } catch (err) {
    console.error('Error during execution:', err);

    return res.status(500).json({
      error: 'Execution failed',
      details: err.message,
    });
  } finally {
    if (filepath && fs.existsSync(filepath)) {
      try {
        fs.unlinkSync(filepath);
      } catch (cleanupErr) {
        console.error('Failed to remove temp file:', cleanupErr);
      }
    }
  }
};

module.exports = { runCode };