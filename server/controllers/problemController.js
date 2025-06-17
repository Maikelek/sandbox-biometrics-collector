const db = require("../db");

const getUserProblems = (req, res) => {
    const userId = req.params.userId;
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

            const doneQuery = `
                SELECT problem_id 
                FROM user_problem_status 
                WHERE user_id = ? AND status = 'Solved'
            `;

            db.query(doneQuery, [userId], (err, doneResult) => {
                if (err) {
                    console.error("Error loading done problems:", err);
                    return res.status(500).json({ message: "Database error" });
                }

                const doneIds = doneResult.map(row => row.problem_id);

                res.status(200).json({
                    total,
                    problems: problemsResult,
                    done: doneIds
                });
            });
        });
    });
};


module.exports = {
    getUserProblems
};
