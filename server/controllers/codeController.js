const fs = require('fs');
const db = require('../db');
const path = require('path');
const util = require('util');
const execAsync = util.promisify(require('child_process').exec);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const TESTCASE_DIR = path.join(__dirname, '..', 'testcases');

const runCode = async (req, res) => {
  const { code, language, problem, problemId, userId } = req.body;

  try {
    if (language !== 'python') {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    if (!problem) {
      return res.status(400).json({ error: 'Missing problem name' });
    }

    const testcaseFile = path.join(TESTCASE_DIR, `${problem}.json`);
    if (!fs.existsSync(testcaseFile)) {
      return res.status(404).json({ error: `Testcases for problem '${problem}' not found.` });
    }

    const testData = JSON.parse(fs.readFileSync(testcaseFile));
    const tests = testData.tests;

    const results = [];
    const uniqueId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const filename = `temp-${uniqueId}.py`;
    const filepath = path.join(TEMP_DIR, filename);

    for (const test of tests) {
      const input = test.input;
      const expected = String(test.expected).trim();

      const callArgs = Array.isArray(input)
        ? input.map(i => JSON.stringify(i)).join(', ')
        : JSON.stringify(input);

      const codeWithInput = `
${code}

print(${problem}(${callArgs}))
      `;

      fs.writeFileSync(filepath, codeWithInput);

      const { stdout, stderr } = await execAsync(
        `docker run --rm -v ${TEMP_DIR}:/app py-runner python3 /app/${filename}`,
        { timeout: 10000 }
      );

      const output = (stderr || stdout).trim();

      results.push({
        input,
        expected,
        output,
        passed: output === expected,
      });
    }

    if (fs.existsSync(filepath)) {
      fs.unlinkSync(filepath);
    }

    const passedAll = results.every(r => r.passed);

    if (passedAll && userId && problemId) {
      try {
        await db.query(
          'INSERT INTO user_problem_status (user_id, problem_id, status, code) VALUES (?, ?, ?, ?)',
          [userId, problemId, 'Solved', code]
        );
      } catch (insertErr) {
        console.error('Failed to save problem status:', insertErr);
      }
    }

    return res.json({
      passedAll,
      results,
    });

  } catch (err) {
    console.error('Error during execution:', err);
    return res.status(500).json({ error: 'Execution failed', details: err.message });
  }
};

module.exports = { runCode };