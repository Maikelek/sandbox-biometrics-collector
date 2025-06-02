const bcrypt = require("bcryptjs");
const db = require("../db");
const emailSender = require("../mailer"); 

const userRegister = (req, res) => {
  const { name, email, password, passwordRepeat, biometricConsent } = req.body;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!name) return res.status(401).json({ message: "Insert nick !" });
  if (!email) return res.status(401).json({ message: "Insert email !" });
  if (!emailRegex.test(email)) return res.status(401).json({ message: "Wrong email format !" });
  if (!password || !passwordRepeat) return res.status(401).json({ message: "Insert password !" });
  if (password.length < 6) return res.status(401).json({ message: "Password must have 6+ chars" });
  if (password !== passwordRepeat) return res.status(401).json({ message: "Passwords are not matching !" });
  if (biometricConsent !== true) return res.status(401).json({ message: "You must agree with biometric consent !" });

  db.query('SELECT user_email FROM users WHERE user_email = ?', [email], async (error, results) => {
      if (error) return res.status(500).json({ message: "Database error." });
      if (results.length > 0) return res.status(401).json({ message: "Email is already used !" });

      const hashedPassword = await bcrypt.hash(passwordRepeat, 8);

      db.query(
          'INSERT INTO users (`user_name`, `user_email`, `user_password`, `user_consent`, `user_consent_change_date`, `user_registration_date`, `user_isValid`) VALUES (?, ?, ?, ?, NOW(), NOW(), ?)',
          [name, email, hashedPassword, 1, 0],
          (error, results) => {
              if (error) {
                  console.log(error);
                  return res.status(500).json({ message: "Error during registration." });
              }

              const userId = results.insertId;
              const code = generateValidationCode(12);

              db.query(
                'INSERT INTO validation_codes (`validation_code`, `validation_isUsed`, `validation_forUser`) VALUES (?, ?, ?)',
                [code, 0, userId],
                (err) => {
                  if (err) {
                    console.log(err);
                    return res.status(500).json({ message: "User created, but error while assigning validation code." });
                  }
                  emailSender(email, 'Sandbox Biometrics Collector - Email Validation', `Hi ${name}! Your account has been succesfully registered.\nThis is your verification code: ${code}. You will be prompted to enter it during your first login. \n\nAdmin and Developer of SBC website`);
                  return res.status(200).json();
                }
              );  
          }
      );
  });
};

const generateValidationCode = (length) => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

module.exports = {
    userRegister
};