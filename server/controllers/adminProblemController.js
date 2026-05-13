const db = require('../db');
const fs = require('fs');
const path = require('path');

const TESTCASE_DIR = path.join(__dirname, '..', 'testcases');

const ensureTestcaseDirExists = () => {
  if (!fs.existsSync(TESTCASE_DIR)) {
    fs.mkdirSync(TESTCASE_DIR, { recursive: true });
  }
};

const normalizeTestcaseContent = (content, functionName) => {
  let parsed;

  if (!content || !String(content).trim()) {
    parsed = {
      name: functionName,
      tests: [],
    };
  } else {
    parsed = JSON.parse(content);
  }

  parsed.name = functionName;

  if (!Array.isArray(parsed.tests)) {
    parsed.tests = [];
  }

  return JSON.stringify(parsed, null, 2);
};

const getTestcaseByProblemId = (req, res) => {
  const id = req.params.id;

  if (!id) {
    return res.status(400).json({ error: 'Missing problem ID' });
  }

  db.query('SELECT problem FROM problems WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Problem not found in database' });
    }

    const functionName = results[0].problem;

    if (!functionName) {
      return res.status(400).json({ error: 'Missing function name' });
    }

    ensureTestcaseDirExists();

    const filePath = path.join(TESTCASE_DIR, `${functionName}.json`);

    fs.readFile(filePath, 'utf8', (err, data) => {
      if (err) {
        const defaultContent = JSON.stringify(
          {
            name: functionName,
            tests: [],
          },
          null,
          2
        );

        return res.json({ content: defaultContent });
      }

      try {
        const normalizedContent = normalizeTestcaseContent(data, functionName);
        return res.json({ content: normalizedContent });
      } catch (parseErr) {
        console.error(`Invalid testcase JSON in ${functionName}.json:`, parseErr);
        return res.json({ content: data });
      }
    });
  });
};

const updateTestcaseByProblemId = (req, res) => {
  const id = req.params.id;
  const { content } = req.body;

  if (!id) {
    return res.status(400).json({ error: 'Missing problem ID' });
  }

  if (content === undefined || content === null) {
    return res.status(400).json({ error: 'Missing testcase content' });
  }

  db.query('SELECT problem FROM problems WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Database error:', err);
      return res.status(500).json({ error: 'Database error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ error: 'Problem not found in database' });
    }

    const functionName = results[0].problem;

    if (!functionName) {
      return res.status(400).json({ error: 'Missing function name' });
    }

    let normalizedContent;

    try {
      normalizedContent = normalizeTestcaseContent(content, functionName);
    } catch (parseErr) {
      return res.status(400).json({ error: 'Invalid JSON content' });
    }

    ensureTestcaseDirExists();

    const filePath = path.join(TESTCASE_DIR, `${functionName}.json`);

    fs.writeFile(filePath, normalizedContent, 'utf8', (err) => {
      if (err) {
        console.error('Error saving testcase file:', err);
        return res.status(500).json({ error: 'Failed to save file' });
      }

      return res.json({
        success: true,
        content: normalizedContent,
      });
    });
  });
};

const getAllProblems = (req, res) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 8;
  const offset = (page - 1) * limit;

  const problemsQuery = `
    SELECT 
      problems.id,
      problems.name,
      problems.problem,
      problems.difficulty,
      IFNULL(GROUP_CONCAT(tags.name ORDER BY tags.name SEPARATOR ', '), '') AS tags
    FROM problems
    LEFT JOIN problem_tags ON problems.id = problem_tags.problem_id
    LEFT JOIN tags ON tags.id = problem_tags.tag_id
    GROUP BY problems.id
    ORDER BY problems.id DESC
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
      console.error('Error loading problems:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    db.query(countQuery, (err, countResult) => {
      if (err) {
        console.error('Error loading problems count:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      const total = countResult[0]?.total || 0;

      return res.status(200).json({
        problems: problemsResult,
        total,
      });
    });
  });
};

const getProblemById = (req, res) => {
  const problemId = req.params.id;

  if (!problemId) {
    return res.status(400).json({ message: 'Missing problem ID' });
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
      GROUP_CONCAT(tags.name ORDER BY tags.name SEPARATOR ', ') AS problem_tags
    FROM problems
    LEFT JOIN problem_details ON problems.id = problem_details.id
    LEFT JOIN problem_details_en ON problems.id = problem_details_en.id
    LEFT JOIN problem_examples ON problems.id = problem_examples.problem_id
    LEFT JOIN problem_starter_code ON problems.id = problem_starter_code.problem_id
    LEFT JOIN problem_tags ON problems.id = problem_tags.problem_id
    LEFT JOIN tags ON problem_tags.tag_id = tags.id
    WHERE problems.id = ?
    GROUP BY 
      problems.id,
      problems.name,
      problems.problem,
      problems.difficulty,
      problem_details.description,
      problem_details.input,
      problem_details.output,
      problem_details_en.description,
      problem_details_en.input,
      problem_details_en.output,
      problem_examples.example_input,
      problem_examples.example_output,
      problem_starter_code.starter_code_py,
      problem_starter_code.starter_code_java,
      problem_starter_code.starter_code_c;
  `;

  const allTagsQuery = `SELECT id, name FROM tags ORDER BY name ASC`;

  const problemTagsQuery = `
    SELECT tags.name
    FROM problem_tags
    JOIN tags ON tags.id = problem_tags.tag_id
    WHERE problem_tags.problem_id = ?
    ORDER BY tags.name ASC
  `;

  db.query(problemQuery, [problemId], (err, problemResult) => {
    if (err) {
      console.error('Error fetching problem:', err);
      return res.status(500).json({ message: 'Database error' });
    }

    if (problemResult.length === 0) {
      return res.status(404).json({ message: 'Problem not found' });
    }

    const problem = problemResult[0];

    db.query(allTagsQuery, (err, allTags) => {
      if (err) {
        console.error('Error fetching all tags:', err);
        return res.status(500).json({ message: 'Database error' });
      }

      db.query(problemTagsQuery, [problemId], (err, problemTags) => {
        if (err) {
          console.error('Error fetching problem tags:', err);
          return res.status(500).json({ message: 'Database error' });
        }

        return res.status(200).json({
          problem,
          allTags,
          selectedTags: problemTags.map((tag) => tag.name),
        });
      });
    });
  });
};

const getAllTags = (req, res) => {
  const allTagsQuery = `SELECT id, name FROM tags ORDER BY name ASC`;

  db.query(allTagsQuery, (err, results) => {
    if (err) {
      console.error('Error fetching tags:', err);
      return res.status(500).json({ message: 'Database error fetching tags' });
    }

    return res.status(200).json(results);
  });
};

const updateProblemTags = (problemId, problemTags, res, successMessage) => {
  const tagsArray = problemTags
    ? String(problemTags)
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];

  const deleteTagsQuery = `DELETE FROM problem_tags WHERE problem_id = ?`;

  db.query(deleteTagsQuery, [problemId], (err) => {
    if (err) {
      console.error('Error deleting problem tags:', err);
      return res.status(500).json({ message: 'Database error deleting problem_tags' });
    }

    if (tagsArray.length === 0) {
      return res.status(200).json({ message: successMessage });
    }

    const selectTagsIdsQuery = `SELECT id, name FROM tags WHERE name IN (?)`;

    db.query(selectTagsIdsQuery, [tagsArray], (err, tagsRows) => {
      if (err) {
        console.error('Error selecting tags:', err);
        return res.status(500).json({ message: 'Database error selecting tags' });
      }

      const tagIds = tagsRows.map((row) => row.id);

      if (tagIds.length === 0) {
        return res.status(200).json({ message: successMessage });
      }

      const insertValues = tagIds.map((tagId) => [problemId, tagId]);
      const insertTagsQuery = `INSERT INTO problem_tags (problem_id, tag_id) VALUES ?`;

      db.query(insertTagsQuery, [insertValues], (err) => {
        if (err) {
          console.error('Error inserting problem tags:', err);
          return res.status(500).json({ message: 'Database error inserting problem_tags' });
        }

        return res.status(200).json({ message: successMessage });
      });
    });
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
    return res.status(400).json({ message: 'Missing problem ID' });
  }

  const updateProblemQuery = `
    UPDATE problems
    SET name = ?, difficulty = ?
    WHERE id = ?
  `;

  const upsertDetailsSkQuery = `
    INSERT INTO problem_details (id, description, input, output)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      input = VALUES(input),
      output = VALUES(output)
  `;

  const upsertDetailsEnQuery = `
    INSERT INTO problem_details_en (id, description, input, output)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      description = VALUES(description),
      input = VALUES(input),
      output = VALUES(output)
  `;

  const deleteExamplesQuery = `
    DELETE FROM problem_examples
    WHERE problem_id = ?
  `;

  const insertExamplesQuery = `
    INSERT INTO problem_examples (problem_id, example_input, example_output)
    VALUES (?, ?, ?)
  `;

  const upsertStarterCodeQuery = `
    INSERT INTO problem_starter_code 
      (problem_id, starter_code_py, starter_code_java, starter_code_c)
    VALUES (?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE
      starter_code_py = VALUES(starter_code_py),
      starter_code_java = VALUES(starter_code_java),
      starter_code_c = VALUES(starter_code_c)
  `;

  db.query(updateProblemQuery, [name, difficulty, problemId], (err) => {
    if (err) {
      console.error('Error updating problems:', err);
      return res.status(500).json({ message: 'Database error updating problems' });
    }

    db.query(
      upsertDetailsSkQuery,
      [problemId, description_slovak, input_slovak, output_slovak],
      (err) => {
        if (err) {
          console.error('Error upserting problem_details:', err);
          return res.status(500).json({ message: 'Database error updating problem_details' });
        }

        db.query(
          upsertDetailsEnQuery,
          [problemId, description_english, input_english, output_english],
          (err) => {
            if (err) {
              console.error('Error upserting problem_details_en:', err);
              return res.status(500).json({ message: 'Database error updating problem_details_en' });
            }

            db.query(deleteExamplesQuery, [problemId], (err) => {
              if (err) {
                console.error('Error deleting old examples:', err);
                return res.status(500).json({ message: 'Database error updating examples' });
              }

              db.query(insertExamplesQuery, [problemId, example_input, example_output], (err) => {
                if (err) {
                  console.error('Error inserting example:', err);
                  return res.status(500).json({ message: 'Database error inserting example' });
                }

                db.query(
                  upsertStarterCodeQuery,
                  [problemId, starter_code_py, starter_code_java, starter_code_c],
                  (err) => {
                    if (err) {
                      console.error('Error upserting problem_starter_code:', err);
                      return res.status(500).json({
                        message: 'Database error updating problem_starter_code',
                      });
                    }

                    updateProblemTags(
                      problemId,
                      problem_tags,
                      res,
                      'Problem updated successfully'
                    );
                  }
                );
              });
            });
          }
        );
      }
    );
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

  if (!name || !problem || !difficulty) {
    return res.status(400).json({
      message: 'Missing required fields',
    });
  }

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
      INSERT INTO problem_starter_code 
        (problem_id, starter_code_py, starter_code_java, starter_code_c)
      VALUES (?, ?, ?, ?)
    `;

    db.query(
      insertDetailsSkQuery,
      [problemId, description_slovak, input_slovak, output_slovak],
      (err) => {
        if (err) {
          console.error('Error inserting SK details:', err);
          return res.status(500).json({ message: 'Error inserting problem_details' });
        }

        db.query(
          insertDetailsEnQuery,
          [problemId, description_english, input_english, output_english],
          (err) => {
            if (err) {
              console.error('Error inserting EN details:', err);
              return res.status(500).json({ message: 'Error inserting problem_details_en' });
            }

            db.query(insertExamplesQuery, [problemId, example_input, example_output], (err) => {
              if (err) {
                console.error('Error inserting examples:', err);
                return res.status(500).json({ message: 'Error inserting problem_examples' });
              }

              db.query(
                insertStarterCodeQuery,
                [problemId, starter_code_py, starter_code_java, starter_code_c],
                (err) => {
                  if (err) {
                    console.error('Error inserting starter code:', err);
                    return res.status(500).json({ message: 'Error inserting starter_code' });
                  }

                  const finishWithFile = () => {
                    ensureTestcaseDirExists();

                    const filePath = path.join(TESTCASE_DIR, `${problem}.json`);

                    const defaultContent = JSON.stringify(
                      {
                        name: problem,
                        tests: [],
                      },
                      null,
                      2
                    );

                    fs.writeFile(filePath, defaultContent, 'utf8', (err) => {
                      if (err) {
                        console.error('Error creating testcase file:', err);
                        return res.status(500).json({
                          message: 'Problem added, but failed to create testcase file',
                        });
                      }

                      return res.status(201).json({
                        message: 'Problem added successfully with testcase file',
                        problemId,
                      });
                    });
                  };

                  const tagsArray = problem_tags
                    ? String(problem_tags)
                        .split(',')
                        .map((tag) => tag.trim())
                        .filter(Boolean)
                    : [];

                  if (tagsArray.length === 0) {
                    return finishWithFile();
                  }

                  const selectTagsIdsQuery = `SELECT id FROM tags WHERE name IN (?)`;

                  db.query(selectTagsIdsQuery, [tagsArray], (err, tagsRows) => {
                    if (err) {
                      console.error('Error selecting tag IDs:', err);
                      return res.status(500).json({ message: 'Error selecting tag IDs' });
                    }

                    const insertValues = tagsRows.map((tag) => [problemId, tag.id]);

                    if (insertValues.length === 0) {
                      return finishWithFile();
                    }

                    const insertTagsQuery = `
                      INSERT INTO problem_tags (problem_id, tag_id)
                      VALUES ?
                    `;

                    db.query(insertTagsQuery, [insertValues], (err) => {
                      if (err) {
                        console.error('Error inserting problem_tags:', err);
                        return res.status(500).json({ message: 'Error inserting problem_tags' });
                      }

                      return finishWithFile();
                    });
                  });
                }
              );
            });
          }
        );
      }
    );
  });
};

const deleteProblem = (req, res) => {
  const problemId = req.body.id;

  if (!problemId) {
    return res.status(400).json({ message: 'Missing problem ID' });
  }

  db.query('SELECT problem FROM problems WHERE id = ?', [problemId], (err, results) => {
    if (err) {
      console.error('Error finding problem before delete:', err);
      return res.status(500).json({ message: 'Database error during deletion' });
    }

    const functionName = results[0]?.problem;

    const queries = [
      { sql: 'DELETE FROM problem_tags WHERE problem_id = ?', values: [problemId] },
      { sql: 'DELETE FROM problem_starter_code WHERE problem_id = ?', values: [problemId] },
      { sql: 'DELETE FROM problem_examples WHERE problem_id = ?', values: [problemId] },
      { sql: 'DELETE FROM problem_details_en WHERE id = ?', values: [problemId] },
      { sql: 'DELETE FROM problem_details WHERE id = ?', values: [problemId] },
      { sql: 'DELETE FROM problems WHERE id = ?', values: [problemId] },
    ];

    const runQueriesSequentially = (index = 0) => {
      if (index >= queries.length) {
        if (functionName) {
          const testcasePath = path.join(TESTCASE_DIR, `${functionName}.json`);

          fs.unlink(testcasePath, (unlinkErr) => {
            if (unlinkErr && unlinkErr.code !== 'ENOENT') {
              console.error('Problem deleted, but failed to delete testcase file:', unlinkErr);
            }

            return res.status(200).json({ message: 'Problem deleted successfully' });
          });
        } else {
          return res.status(200).json({ message: 'Problem deleted successfully' });
        }

        return;
      }

      const { sql, values } = queries[index];

      db.query(sql, values, (err) => {
        if (err) {
          console.error('Error executing query:', sql, err);
          return res.status(500).json({ message: 'Database error during deletion' });
        }

        runQueriesSequentially(index + 1);
      });
    };

    runQueriesSequentially();
  });
};

module.exports = {
  getTestcaseByProblemId,
  updateTestcaseByProblemId,
  getAllProblems,
  getProblemById,
  addProblem,
  getAllTags,
  updateProblem,
  deleteProblem,
};