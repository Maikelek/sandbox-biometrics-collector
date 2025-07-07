const db = require("../db");
const bcrypt = require("bcryptjs");

const getAllUsers = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;

  const usersQuery = `
    SELECT
      users.user_id AS id,
      users.user_name AS name,
      users.user_isAdmin AS isAdmin
    FROM users
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT users.user_id) AS total
    FROM users;
  `;

  db.query(usersQuery, [limit, offset], (err, usersResult) => {
    if (err) {
      console.error("Error loading users:", err);
      return res.status(500).json({ message: "Database error" });
    }

    db.query(countQuery, (err, countResult) => {
      if (err) {
        console.error("Error loading user count:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const total = countResult[0].total;

      res.status(200).json({
        users: usersResult,
        total,
      });
    });
  });
};

const getUserById = (req, res) => {
  const userId = req.params.id;

  if (!userId) {
    return res.status(400).json({ message: "Missing user ID" });
  }

  const query = `SELECT * FROM users WHERE user_id = ?`;

  db.query(query, [userId], (err, result) => {
    if (err) {
      console.error("Error fetching user:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(result[0]);
  });
};

const addUser = async (req, res) => {
  const {
    user_name,
    user_email,
    user_isAdmin,
    user_isValid,
    user_consent,
    user_password,
  } = req.body;

  if (
    user_name === undefined ||
    user_email === undefined ||
    user_isAdmin === undefined ||
    user_isValid === undefined ||
    user_consent === undefined ||
    !user_password
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const hashedPassword = await bcrypt.hash(user_password, 8);

    const sql = `
      INSERT INTO users (
        user_name,
        user_email,
        user_password,
        user_isAdmin,
        user_isValid,
        user_consent,
        user_registration_date,
        user_consent_change_date
      ) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW());
    `;

    const params = [
      user_name,
      user_email,
      hashedPassword,
      user_isAdmin,
      user_isValid,
      user_consent
    ];

    db.query(sql, params, (err, result) => {
      if (err) {
        console.error("Error adding user:", err);
        return res.status(500).json({ message: "Database error during insert" });
      }

      res.status(201).json({ message: "User created successfully", userId: result.insertId });
    });

  } catch (err) {
    console.error("Error hashing password:", err);
    res.status(500).json({ message: "Server error during password hashing" });
  }
};

const updateUser = async (req, res) => {
  const userId = parseInt(req.params.id);
  if (!userId) return res.status(400).json({ message: "Missing or invalid user ID" });

  const {
    user_name,
    user_email,
    user_isAdmin,
    user_isValid,
    user_consent,
    user_password
  } = req.body;

  if (
    user_name === undefined ||
    user_email === undefined ||
    user_isAdmin === undefined ||
    user_isValid === undefined ||
    user_consent === undefined
  ) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  const updates = [];
  const params = [];

  updates.push("user_name = ?");
  params.push(user_name);
  updates.push("user_email = ?");
  params.push(user_email);

  updates.push("user_isAdmin = ?");
  params.push(user_isAdmin);
  updates.push("user_isValid = ?");
  params.push(user_isValid);

  updates.push("user_consent = ?");
  params.push(user_consent);
  if (user_consent === 1 || user_consent === 0) {
    updates.push("user_consent_change_date = NOW()");
  }

  if (user_password) {
    const hashed = await bcrypt.hash(user_password, 8);
    updates.push("user_password = ?");
    params.push(hashed);
  }

  const sql = `
    UPDATE users
    SET ${updates.join(", ")}
    WHERE user_id = ?;
  `;
  params.push(userId);

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error("Error updating user:", err);
      return res.status(500).json({ message: "Database error during update" });
    }

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "User updated successfully" });
  });
};



const deleteUser = (req, res) => {
  const userId = req.body.id;

  if (!userId) {
    return res.status(400).json({ message: "Missing user ID" });
  }

  const deleteUserStatusQuery = `
    DELETE FROM user_problem_status WHERE user_id = ?;
  `;

  const deleteUserQuery = `
    DELETE FROM users WHERE user_id = ?;
  `;

  db.query(deleteUserStatusQuery, [userId], (err1) => {
    if (err1) {
      console.error("Error deleting user_problem_status:", err1);
      return res.status(500).json({ message: "Error deleting user_problem_status" });
    }

    db.query(deleteUserQuery, [userId], (err2) => {
      if (err2) {
        console.error("Error deleting user:", err2);
        return res.status(500).json({ message: "Error deleting user" });
      }

      res.status(200).json({ message: "User deleted successfully" });
    });
  });
};

module.exports = {
    getAllUsers,
    getUserById,
    addUser,
    updateUser,
    deleteUser
  };
  
