const db = require("../db");
const bcrypt = require("bcryptjs");
const emailSender = require("../mailer"); 

const generateResetCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

const requestPasswordReset = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ message: "Email is required" });
  }

  db.query("SELECT * FROM users WHERE user_email = ?", [email], (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: "Database error" });
    }

    if (results.length === 0) {
      return res.status(200).json({ message: "If email exists, reset code sent" });
    }

    const resetCode = generateResetCode();

    db.query(
      "INSERT INTO password_resets (email, reset_code) VALUES (?, ?)",
      [email, resetCode],
      (err) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: "Database error" });
        }

        emailSender(email, 'Sandbox Biometrics Collector - Password Reset', `This is your verification code: ${resetCode}.\nEnter it and change your password. \n\nAdmin and Developer of SBC website`);
        console.log(`Password reset code for ${email}: ${resetCode}`);

        return res.status(200).json({ message: "Reset code sent if email exists" });
      }
    );
  });
};

const resetPassword = (req, res) => {
  const { email, resetCode, newPassword, confirmPassword } = req.body;

  if (!email || !resetCode || !newPassword || !confirmPassword) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  db.query(
    "SELECT * FROM password_resets WHERE email = ? AND reset_code = ? AND is_used = 0 ORDER BY created_at DESC LIMIT 1",
    [email, resetCode],
    async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Database error" });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: "Invalid or used reset code" });
      }

      const resetRecord = results[0];

      const hashedPassword = await bcrypt.hash(newPassword, 10);

      db.query(
        "UPDATE users SET user_password = ? WHERE user_email = ?",
        [hashedPassword, email],
        (err) => {
          if (err) {
            console.error(err);
            return res.status(500).json({ message: "Database error" });
          }

          db.query(
            "UPDATE password_resets SET is_used = 1 WHERE reset_id = ?",
            [resetRecord.reset_id],
            (err) => {
              if (err) {
                console.error(err);
              }
              return res.status(200).json({ message: "Password updated successfully" });
            }
          );
        }
      );
    }
  );
};

module.exports = {
  requestPasswordReset,
  resetPassword,
};
