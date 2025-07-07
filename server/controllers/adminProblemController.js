const db = require("../db");
const fs = require('fs');
const path = require('path');

const getTestcaseByProblemId = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ error: "Missing problem ID" });
  }

  db.query("SELECT problem FROM problems WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Problem not found in database" });
    }

    const problemFile = results[0].problem;

    if (!problemFile) {
      return res.status(400).json({ error: "Missing problem filename" });
    }

    const filePath = path.join(__dirname, "..", "testcases", `${problemFile}.json`);

    fs.readFile(filePath, "utf8", (err, data) => {
      if (err) {
        console.error(`Failed to read file ${problemFile}.json:`, err);
        return res.status(404).json({ error: "Testcase file not found" });
      }

      return res.json({ content: data });
    });
  });
};

const updateTestcaseByProblemId = (req, res) => {
  const id = req.params.id;
  const { content } = req.body;

  if (!id || !content) {
    return res.status(400).json({ error: "Missing problem ID or content" });
  }

  db.query("SELECT problem FROM problems WHERE id = ?", [id], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: "Problem not found in database" });
    }

    const fileName = results[0].problem;

    if (!fileName) {
      return res.status(400).json({ error: "Missing problem filename" });
    }

    const filePath = path.join(__dirname, "..", "testcases", `${fileName}.json`);

    fs.writeFile(filePath, content, "utf8", (err) => {
      if (err) {
        console.error("Error saving testcase file:", err);
        return res.status(500).json({ error: "Failed to save file" });
      }

      return res.json({ success: true });
    });
  });
};

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

const getProblemById = (req, res) => {
  const problemId = req.params.id;

  if (!problemId) {
    return res.status(400).json({ message: "Missing problem ID" });
  }

  const problemQuery = `
    SELECT
      problems.id,
      problems.name,
      problems.problem,
      problems.difficulty,
      problem_details.description AS description_slovak,
      problem_details.input AS input_slovak,
      problem_details.output AS output_slovak,
      problem_details_en.description AS description_english,
      problem_details_en.input AS input_english,
      problem_details_en.output AS output_english,
      problem_examples.example_input,
      problem_examples.example_output,
      problem_starter_code.starter_code_py,
      problem_starter_code.starter_code_java,
      problem_starter_code.starter_code_c,
      GROUP_CONCAT(tags.name SEPARATOR ', ') AS problem_tags
    FROM problems
    LEFT JOIN problem_details ON problems.id = problem_details.id
    LEFT JOIN problem_details_en ON problems.id = problem_details_en.id
    LEFT JOIN problem_examples ON problems.id = problem_examples.problem_id
    LEFT JOIN problem_starter_code ON problems.id = problem_starter_code.problem_id
    LEFT JOIN problem_tags ON problems.id = problem_tags.problem_id
    LEFT JOIN tags ON problem_tags.tag_id = tags.id
    WHERE problems.id = ?
    GROUP BY problems.id, problem_examples.id;
  `;

  const allTagsQuery = `SELECT id, name FROM tags`;
  const problemTagsQuery = `
    SELECT tags.name
    FROM problem_tags
    JOIN tags ON tags.id = problem_tags.tag_id
    WHERE problem_tags.problem_id = ?
  `;

  db.query(problemQuery, [problemId], (err, problemResult) => {
    if (err) {
      console.error("Error fetching problem:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (problemResult.length === 0) {
      return res.status(404).json({ message: "Problem not found" });
    }

    const problem = problemResult[0];

    db.query(allTagsQuery, (err, allTags) => {
      if (err) {
        console.error("Error fetching all tags:", err);
        return res.status(500).json({ message: "Database error" });
      }

      db.query(problemTagsQuery, [problemId], (err, problemTags) => {
        if (err) {
          console.error("Error fetching problem tags:", err);
          return res.status(500).json({ message: "Database error" });
        }

        res.status(200).json({
          problem,
          allTags,
          selectedTags: problemTags.map(t => t.name),
        });
      });
    });
  });
};

const getAllTags = (req, res) => {
  const allTagsQuery = `SELECT id, name FROM tags`;

  db.query(allTagsQuery, (err, results) => {
    if (err) {
      console.error('Error fetching tags:', err);
      return res.status(500).json({ message: 'Database error fetching tags' });
    }

    return res.status(200).json(results);
  });
};

const updateProblem = (req, res) => {
  const problemId = req.params.id;
  const {
    name,
    difficulty,
    description_slovak,
    input_slovak,
    output_slovak,
    description_english,
    input_english,
    output_english,
    example_input,
    example_output,
    starter_code_py,
    starter_code_java,
    starter_code_c,
    problem_tags,
  } = req.body;

  if (!problemId) {
    return res.status(400).json({ message: "Missing problem ID" });
  }

  const updateProblemQuery = `
    UPDATE problems
    SET name = ?, difficulty = ?
    WHERE id = ?
  `;

  const updateDetailsSkQuery = `
    UPDATE problem_details
    SET description = ?, input = ?, output = ?
    WHERE id = ?
  `;

  const updateDetailsEnQuery = `
    UPDATE problem_details_en
    SET description = ?, input = ?, output = ?
    WHERE id = ?
  `;

  const updateExamplesQuery = `
    UPDATE problem_examples
    SET example_input = ?, example_output = ?
    WHERE problem_id = ?
  `;

  const updateStarterCodeQuery = `
    UPDATE problem_starter_code
    SET starter_code_py = ?, starter_code_java = ?, starter_code_c = ?
    WHERE problem_id = ?
  `;

  db.query(updateProblemQuery, [name, difficulty, problemId], (err) => {
    if (err) {
      console.error('Error updating problems:', err);
      return res.status(500).json({ message: 'Database error updating problems' });
    }

    db.query(updateDetailsSkQuery, [description_slovak, input_slovak, output_slovak, problemId], (err) => {
      if (err) {
        console.error('Error updating problem_details:', err);
        return res.status(500).json({ message: 'Database error updating problem_details' });
      }

      db.query(updateDetailsEnQuery, [description_english, input_english, output_english, problemId], (err) => {
        if (err) {
          console.error('Error updating problem_details_en:', err);
          return res.status(500).json({ message: 'Database error updating problem_details_en' });
        }

        db.query(updateExamplesQuery, [example_input, example_output, problemId], (err) => {
          if (err) {
            console.error('Error updating problem_examples:', err);
            return res.status(500).json({ message: 'Database error updating problem_examples' });
          }

          db.query(updateStarterCodeQuery, [starter_code_py, starter_code_java, starter_code_c, problemId], (err) => {
            if (err) {
              console.error('Error updating problem_starter_code:', err);
              return res.status(500).json({ message: 'Database error updating problem_starter_code' });
            }

            const tagsArray = problem_tags ? problem_tags.split(',').map(t => t.trim()).filter(Boolean) : [];

            const selectTagsIdsQuery = `SELECT id, name FROM tags WHERE name IN (?)`;

            if (tagsArray.length === 0) {
              const deleteTagsQuery = `DELETE FROM problem_tags WHERE problem_id = ?`;
              db.query(deleteTagsQuery, [problemId], (err) => {
                if (err) {
                  console.error('Error deleting problem tags:', err);
                  return res.status(500).json({ message: 'Database error deleting problem_tags' });
                }
                return res.status(200).json({ message: 'Problem updated successfully without tags' });
              });
            } else {
              db.query(selectTagsIdsQuery, [tagsArray], (err, tagsRows) => {
                if (err) {
                  console.error('Error selecting tags:', err);
                  return res.status(500).json({ message: 'Database error selecting tags' });
                }

                const tagIds = tagsRows.map(row => row.id);

                const deleteTagsQuery = `DELETE FROM problem_tags WHERE problem_id = ?`;

                db.query(deleteTagsQuery, [problemId], (err) => {
                  if (err) {
                    console.error('Error deleting problem tags:', err);
                    return res.status(500).json({ message: 'Database error deleting problem_tags' });
                  }

                  if (tagIds.length === 0) {
                    return res.status(200).json({ message: 'Problem updated successfully (no tags matched)' });
                  }

                  const insertValues = tagIds.map(tagId => [problemId, tagId]);

                  const insertTagsQuery = `INSERT INTO problem_tags (problem_id, tag_id) VALUES ?`;

                  db.query(insertTagsQuery, [insertValues], (err) => {
                    if (err) {
                      console.error('Error inserting problem tags:', err);
                      return res.status(500).json({ message: 'Database error inserting problem_tags' });
                    }

                    return res.status(200).json({ message: 'Problem updated successfully' });
                  });
                });
              });
            }
          });
        });
      });
    });
  });
};

const addProblem = (req, res) => {
  const {
    name,
    problem,
    difficulty,
    description_slovak,
    input_slovak,
    output_slovak,
    description_english,
    input_english,
    output_english,
    example_input,
    example_output,
    starter_code_py,
    starter_code_java,
    starter_code_c,
    problem_tags,
  } = req.body;

  const insertProblemQuery = `
    INSERT INTO problems (name, problem, difficulty)
    VALUES (?, ?, ?)
  `;

  db.query(insertProblemQuery, [name, problem, difficulty], (err, result) => {
    if (err) {
      console.error('Error inserting into problems:', err);
      return res.status(500).json({ message: 'Database error inserting problem' });
    }

    const problemId = result.insertId;

    const insertDetailsSkQuery = `
      INSERT INTO problem_details (id, description, input, output)
      VALUES (?, ?, ?, ?)
    `;

    const insertDetailsEnQuery = `
      INSERT INTO problem_details_en (id, description, input, output)
      VALUES (?, ?, ?, ?)
    `;

    const insertExamplesQuery = `
      INSERT INTO problem_examples (problem_id, example_input, example_output)
      VALUES (?, ?, ?)
    `;

    const insertStarterCodeQuery = `
      INSERT INTO problem_starter_code (problem_id, starter_code_py, starter_code_java, starter_code_c)
      VALUES (?, ?, ?, ?)
    `;

    db.query(insertDetailsSkQuery, [problemId, description_slovak, input_slovak, output_slovak], (err) => {
      if (err) {
        console.error('Error inserting SK details:', err);
        return res.status(500).json({ message: 'Error inserting problem_details' });
      }

      db.query(insertDetailsEnQuery, [problemId, description_english, input_english, output_english], (err) => {
        if (err) {
          console.error('Error inserting EN details:', err);
          return res.status(500).json({ message: 'Error inserting problem_details_en' });
        }

        db.query(insertExamplesQuery, [problemId, example_input, example_output], (err) => {
          if (err) {
            console.error('Error inserting examples:', err);
            return res.status(500).json({ message: 'Error inserting problem_examples' });
          }

          db.query(insertStarterCodeQuery, [problemId, starter_code_py, starter_code_java, starter_code_c], (err) => {
            if (err) {
              console.error('Error inserting starter code:', err);
              return res.status(500).json({ message: 'Error inserting starter_code' });
            }

            const tagsArray = problem_tags
              ? problem_tags.split(',').map((t) => t.trim()).filter(Boolean)
              : [];

              const finishWithFile = () => {
                const filePath = path.join(__dirname, '..', 'testcases', `${problem}.json`);
                const defaultContent = JSON.stringify({ name: name, tests: [] }, null, 2);
              
                fs.writeFile(filePath, defaultContent, 'utf8', (err) => {
                  if (err) {
                    console.error('Error creating testcase file:', err);
                    return res.status(500).json({ message: 'Problem added, but failed to create testcase file' });
                  }
              
                  return res.status(201).json({ message: 'Problem added successfully with testcase file' });
                });
              };
              
            if (tagsArray.length === 0) {
              return finishWithFile();
            }

            const selectTagsIdsQuery = `SELECT id FROM tags WHERE name IN (?)`;

            db.query(selectTagsIdsQuery, [tagsArray], (err, tagsRows) => {
              if (err) {
                console.error('Error selecting tag IDs:', err);
                return res.status(500).json({ message: 'Error selecting tag IDs' });
              }

              const insertValues = tagsRows.map(tag => [problemId, tag.id]);
              if (insertValues.length === 0) {
                return finishWithFile();
              }

              const insertTagsQuery = `INSERT INTO problem_tags (problem_id, tag_id) VALUES ?`;

              db.query(insertTagsQuery, [insertValues], (err) => {
                if (err) {
                  console.error('Error inserting problem_tags:', err);
                  return res.status(500).json({ message: 'Error inserting problem_tags' });
                }

                return finishWithFile();
              });
            });
          });
        });
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
  getTestcaseByProblemId,
  updateTestcaseByProblemId,
  getAllProblems,
  getProblemById,
  addProblem,
  getAllTags,
  updateProblem,
  deleteProblem
};
