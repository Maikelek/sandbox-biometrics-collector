const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);

const TEMP_DIR = path.join(__dirname, '..', 'temp');

const runCode = async (req, res) => {
  const { code, language } = req.body;
  const id = Date.now();
  let extension, dockerfile, imageName, filename;

  console.log(`Running code for language: ${language}, ID: ${id}`);

  try {
    if (language === 'python') {
      extension = 'py';
      dockerfile = 'Dockerfile.py';
      imageName = 'py-runner';
    } else {
      return res.status(400).json({ error: 'Unsupported language' });
    }

    filename = `temp-${id}.${extension}`;
    const filepath = path.join(TEMP_DIR, filename);
    const containerFile = `temp.${extension}`;
    const containerPath = path.join(TEMP_DIR, containerFile);

    fs.writeFileSync(filepath, code);
    fs.copyFileSync(filepath, containerPath);

    await execAsync(`docker build -f ${dockerfile} -t ${imageName} .`, {
      cwd: path.join(__dirname, '..'),
    });

    const { stdout, stderr } = await execAsync(`docker run --rm ${imageName}`, {
      cwd: path.join(__dirname, '..'),
      timeout: 10000,
    });

    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    if (fs.existsSync(containerPath)) fs.unlinkSync(containerPath);

    return res.json({ output: stderr || stdout });
  } catch (err) {
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    if (fs.existsSync(containerPath)) fs.unlinkSync(containerPath);

    console.error('Error:', err);
    return res.status(500).json({ error: 'Execution failed', details: err.message });
  }
};

module.exports = { runCode };
