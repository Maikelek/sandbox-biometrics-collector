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

const getProblemWithExamples = (req, res) => {
  const problemId = req.params.problemId;
  const lang = req.query.lang;

  const problemQuerySK = `
    SELECT
      problems.id,
      problems.name AS name,
      problems.difficulty,
      problems.problem,
      problem_details.description,
      problem_details.input,
      problem_details.output,
      starter_code.starter_code_py,
      starter_code.starter_code_java,
      starter_code.starter_code_c
    FROM problems
    JOIN problem_details ON problem_details.id = problems.id
    LEFT JOIN problem_starter_code AS starter_code ON starter_code.problem_id = problems.id
    WHERE problems.id = ?;
  `;

  const problemQueryEN = `
    SELECT
      problems.id,
      problems.name AS name,
      problems.difficulty,
      problems.problem,
      problem_details_en.description,
      problem_details_en.input,
      problem_details_en.output,
      starter_code.starter_code_py,
      starter_code.starter_code_java,
      starter_code.starter_code_c
    FROM problems
    JOIN problem_details_en ON problem_details_en.id = problems.id
    LEFT JOIN problem_starter_code AS starter_code ON starter_code.problem_id = problems.id
    WHERE problems.id = ?;
  `;

  const examplesQuery = `
    SELECT
      example_input AS input,
      example_output AS output
    FROM problem_examples
    WHERE problem_id = ?;
  `;

  db.query(lang === "en" ? problemQueryEN : problemQuerySK, [problemId], (err, problemResult) => {
    if (err) {
      console.error("Error loading problem:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (problemResult.length === 0) {
      return res.status(404).json({ message: "Problem not found" });
    }

    db.query(examplesQuery, [problemId], (err, examplesResult) => {
      if (err) {
        console.error("Error loading examples:", err);
        return res.status(500).json({ message: "Database error" });
      }

      const fullResult = {
        ...problemResult[0],
        examples: examplesResult
      };

      res.status(200).json(fullResult);
    });
  });
};


module.exports = {
    getUserProblems,
    getProblemWithExamples
};
