const fs = require('fs');
const db = require('../db')
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const TEMP_DIR = path.join(__dirname, '..', 'temp');
const TESTCASE_DIR = path.join(__dirname, '..', 'testcases');

const runCode = async (req, res) => {
  const { code, language, problem, problemId, userId } = req.body;
  const id = Date.now();
  let extension, dockerfile, imageName, filename;

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

    extension = 'py';
    dockerfile = 'Dockerfile.py';
    imageName = 'py-runner';
    filename = `temp-${id}.${extension}`;
    const filepath = path.join(TEMP_DIR, filename);
    const containerFile = `temp.${extension}`;
    const containerPath = path.join(TEMP_DIR, containerFile);

    const testData = JSON.parse(fs.readFileSync(testcaseFile));
    const tests = testData.tests;

    let results = [];

    for (let test of tests) {
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
      fs.copyFileSync(filepath, containerPath);

      await execAsync(`docker build -f ${dockerfile} -t ${imageName} .`, {
        cwd: path.join(__dirname, '..'),
      });

      const { stdout, stderr } = await execAsync(`docker run --rm ${imageName}`, {
        cwd: path.join(__dirname, '..'),
        timeout: 10000,
      });

      const output = (stderr || stdout).trim();

      results.push({
        input,
        expected,
        output,
        passed: output === expected,
      });

      fs.unlinkSync(filepath);
      fs.unlinkSync(containerPath);
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

module.exports = { 
  runCode
 };
