const db = require("../db");
const bcrypt = require("bcryptjs");

/* USERS */

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


/* PROBLEMS */

const getAllProblems = (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 8;
  const offset = (page - 1) * limit;

  const problemsQuery = `
    SELECT 
      problems.id,
      problems.name, 
      problems.difficulty, 
      IFNULL(GROUP_CONCAT(tags.name ORDER BY tags.name SEPARATOR ', '), '') AS tags
    FROM problems
    LEFT JOIN problem_tags ON problems.id = problem_tags.problem_id
    LEFT JOIN tags ON tags.id = problem_tags.tag_id
    GROUP BY problems.id
    LIMIT ? OFFSET ?;
  `;

  const countQuery = `
    SELECT COUNT(DISTINCT problems.id) AS total 
    FROM problems
    LEFT JOIN problem_tags ON problems.id = problem_tags.problem_id
    LEFT JOIN tags ON tags.id = problem_tags.tag_id;
  `;

  db.query(problemsQuery, [limit, offset], (err, problemsResult) => {
    if (err) {
      console.error("Error loading problems:", err);
      return res.status(500).json({ message: "Database error" });
    }

    db.query(countQuery, (err, countResult) => {
      if (err) {
        console.error("Error loading problems count:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const total = countResult[0].total;

      res.status(200).json({
        problems: problemsResult,
        total,
      });
    });
  });
};

const deleteProblem = (req, res) => {
  const problemId = req.body.id;

  if (!problemId) {
    return res.status(400).json({ message: "Missing problem ID" });
  }

  const queries = [
    { sql: "DELETE FROM problem_starter_code WHERE problem_id = ?", values: [problemId] },
    { sql: "DELETE FROM problem_examples WHERE problem_id = ?", values: [problemId] },
    { sql: "DELETE FROM problem_details_en WHERE id = ?", values: [problemId] },
    { sql: "DELETE FROM problem_details WHERE id = ?", values: [problemId] },
    { sql: "DELETE FROM problems WHERE id = ?", values: [problemId] }
  ];

  const runQueriesSequentially = (index = 0) => {
    if (index >= queries.length) {
      return res.status(200).json({ message: "Problem deleted successfully" });
    }

    const { sql, values } = queries[index];

    db.query(sql, values, (err) => {
      if (err) {
        console.error("Error executing query:", sql, err);
        return res.status(500).json({ message: "Database error during deletion" });
      }
      runQueriesSequentially(index + 1);
    });
  };

  runQueriesSequentially();
};


module.exports = {
  getAllUsers,
  updateUser,
  getUserById,
  deleteUser,
  getAllProblems,
  deleteProblem
};
