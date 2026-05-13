const db = require('../db');
const util = require('util');

const dbQuery = util.promisify(db.query).bind(db);

const parseJson = (value, fallback) => {
  if (!value) return fallback;

  if (typeof value === 'object') return value;

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const allowedStatuses = ['open', 'reviewed', 'approved', 'rejected'];

const getFlaggedSubmissions = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 10, 1), 100);
    const offset = (page - 1) * limit;

    const status = req.query.status;

    const whereParts = [];
    const params = [];

    if (status && allowedStatuses.includes(status)) {
      whereParts.push('fs.status = ?');
      params.push(status);
    }

    const whereSql = whereParts.length > 0
      ? `WHERE ${whereParts.join(' AND ')}`
      : '';

    const countRows = await dbQuery(
      `
      SELECT COUNT(*) AS total
      FROM flagged_submissions fs
      ${whereSql}
      `,
      params
    );

    const rows = await dbQuery(
      `
      SELECT
        fs.id,
        fs.user_id,
        fs.problem_id,
        fs.language,
        fs.anomaly_score,
        fs.reasons,
        fs.status,
        fs.created_at,
        fs.reviewed_at,
        fs.reviewed_by,

        u.user_name AS user_name,
        u.user_email AS user_email,

        p.name AS problem_name,
        p.problem AS problem_function,
        p.difficulty AS problem_difficulty
      FROM flagged_submissions fs
      LEFT JOIN users u ON u.user_id = fs.user_id
      LEFT JOIN problems p ON p.id = fs.problem_id
      ${whereSql}
      ORDER BY fs.created_at DESC
      LIMIT ? OFFSET ?
      `,
      [...params, limit, offset]
    );

    const flaggedSubmissions = rows.map((row) => ({
      ...row,
      reasons: parseJson(row.reasons, []),
    }));

    return res.json({
      flaggedSubmissions,
      total: countRows[0]?.total || 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('Error loading flagged submissions:', err);
    return res.status(500).json({
      message: 'Failed to load flagged submissions',
    });
  }
};

const getFlaggedSubmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const rows = await dbQuery(
      `
      SELECT
        fs.*,

        u.user_name AS user_name,
        u.user_email AS user_email,

        p.name AS problem_name,
        p.problem AS problem_function,
        p.difficulty AS problem_difficulty
      FROM flagged_submissions fs
      LEFT JOIN users u ON u.user_id = fs.user_id
      LEFT JOIN problems p ON p.id = fs.problem_id
      WHERE fs.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!rows.length) {
      return res.status(404).json({
        message: 'Flagged submission not found',
      });
    }

    const flaggedSubmission = {
      ...rows[0],
      reasons: parseJson(rows[0].reasons, []),
      typing_metrics: parseJson(rows[0].typing_metrics, {}),
    };

    return res.json(flaggedSubmission);
  } catch (err) {
    console.error('Error loading flagged submission detail:', err);
    return res.status(500).json({
      message: 'Failed to load flagged submission',
    });
  }
};

const updateFlaggedSubmission = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, admin_note } = req.body;

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        message: 'Invalid status',
      });
    }

    const reviewedBy =
      req.user?.user_id ||
      req.user?.id ||
      req.session?.user?.user_id ||
      req.session?.user?.id ||
      null;

    await dbQuery(
      `
      UPDATE flagged_submissions
      SET
        status = ?,
        admin_note = ?,
        reviewed_at = CASE
          WHEN ? = 'open' THEN NULL
          ELSE NOW()
        END,
        reviewed_by = CASE
          WHEN ? = 'open' THEN NULL
          ELSE ?
        END
      WHERE id = ?
      `,
      [
        status,
        admin_note || null,
        status,
        status,
        reviewedBy,
        id,
      ]
    );

    const updatedRows = await dbQuery(
      `
      SELECT
        fs.*,

        u.user_name AS user_name,
        u.user_email AS user_email,

        p.name AS problem_name,
        p.problem AS problem_function,
        p.difficulty AS problem_difficulty
      FROM flagged_submissions fs
      LEFT JOIN users u ON u.user_id = fs.user_id
      LEFT JOIN problems p ON p.id = fs.problem_id
      WHERE fs.id = ?
      LIMIT 1
      `,
      [id]
    );

    if (!updatedRows.length) {
      return res.status(404).json({
        message: 'Flagged submission not found',
      });
    }

    const updated = {
      ...updatedRows[0],
      reasons: parseJson(updatedRows[0].reasons, []),
      typing_metrics: parseJson(updatedRows[0].typing_metrics, {}),
    };

    return res.json({
      message: 'Flagged submission updated',
      flaggedSubmission: updated,
    });
  } catch (err) {
    console.error('Error updating flagged submission:', err);
    return res.status(500).json({
      message: 'Failed to update flagged submission',
    });
  }
};

module.exports = {
  getFlaggedSubmissions,
  getFlaggedSubmissionById,
  updateFlaggedSubmission,
};