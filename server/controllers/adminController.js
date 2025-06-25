const db = require("../db");

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

module.exports = {
  getAllUsers,
};
