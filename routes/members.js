// routes/members.js

const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const validate = require('../middleware/validate');
const { body, param, query } = require('express-validator');

// ── GET /api/members ──────────────────────────────────────────────
// Query params: ?search=ahmed  ?plan=Premium  ?status=Active
router.get('/', async (req, res) => {
  try {
    const { search, plan, status } = req.query;

    let sql = `
      SELECT
        m.id, m.first_name, m.last_name, m.email, m.phone,
        m.dob, m.gender, m.address, m.notes, m.status, m.joined_at,
        p.name  AS plan_name,   p.price AS plan_price,
        t.name  AS trainer_name, t.specialization AS trainer_spec
      FROM members m
      LEFT JOIN plans    p ON m.plan_id    = p.id
      LEFT JOIN trainers t ON m.trainer_id = t.id
      WHERE 1=1
    `;
    const params = [];

    if (search) {
      sql += ` AND (m.first_name LIKE ? OR m.last_name LIKE ? OR m.email LIKE ?)`;
      const like = `%${search}%`;
      params.push(like, like, like);
    }
    if (plan) {
      sql += ` AND p.name = ?`;
      params.push(plan);
    }
    if (status) {
      sql += ` AND m.status = ?`;
      params.push(status);
    }

    sql += ` ORDER BY m.joined_at DESC`;

    const [rows] = await db.query(sql, params);
    res.json({ success: true, count: rows.length, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/members/:id ──────────────────────────────────────────
router.get('/:id',
  [param('id').isInt({ min: 1 }).withMessage('Invalid member ID')],
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT
          m.*, p.name AS plan_name, p.price AS plan_price,
          t.name AS trainer_name, t.specialization AS trainer_spec
        FROM members m
        LEFT JOIN plans    p ON m.plan_id    = p.id
        LEFT JOIN trainers t ON m.trainer_id = t.id
        WHERE m.id = ?
      `, [req.params.id]);

      if (!rows.length)
        return res.status(404).json({ success: false, message: 'Member not found' });

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/members ─────────────────────────────────────────────
router.post('/',
  [
    body('first_name').trim().notEmpty().withMessage('First name is required'),
    body('last_name').trim().notEmpty().withMessage('Last name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('phone').trim().notEmpty().withMessage('Phone is required'),
    body('plan_id').isInt({ min: 1 }).withMessage('Valid plan_id is required'),
    body('trainer_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('dob').optional({ nullable: true }).isDate(),
    body('gender').optional().isIn(['Male', 'Female', 'Prefer not to say']),
  ],
  validate,
  async (req, res) => {
    try {
      const { first_name, last_name, email, phone, dob, gender, address, plan_id, trainer_id, notes } = req.body;

      // Check duplicate email
      const [existing] = await db.query('SELECT id FROM members WHERE email = ?', [email]);
      if (existing.length)
        return res.status(409).json({ success: false, message: 'Email already registered' });

      const [result] = await db.query(
        `INSERT INTO members
          (first_name, last_name, email, phone, dob, gender, address, plan_id, trainer_id, notes)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [first_name, last_name, email, phone, dob || null, gender || null, address || null, plan_id, trainer_id || null, notes || null]
      );

      res.status(201).json({
        success: true,
        message: 'Member registered successfully',
        data: { id: result.insertId }
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── PUT /api/members/:id ──────────────────────────────────────────
router.put('/:id',
  [
    param('id').isInt({ min: 1 }),
    body('first_name').optional().trim().notEmpty(),
    body('last_name').optional().trim().notEmpty(),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim().notEmpty(),
    body('plan_id').optional().isInt({ min: 1 }),
    body('trainer_id').optional({ nullable: true }).isInt({ min: 1 }),
    body('status').optional().isIn(['Active', 'Inactive', 'Suspended']),
  ],
  validate,
  async (req, res) => {
    try {
      const allowed = ['first_name','last_name','email','phone','dob','gender','address','plan_id','trainer_id','notes','status'];
      const fields = [];
      const values = [];

      allowed.forEach(key => {
        if (req.body[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(req.body[key]);
        }
      });

      if (!fields.length)
        return res.status(400).json({ success: false, message: 'No fields to update' });

      values.push(req.params.id);
      const [result] = await db.query(
        `UPDATE members SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      if (!result.affectedRows)
        return res.status(404).json({ success: false, message: 'Member not found' });

      res.json({ success: true, message: 'Member updated successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/members/:id ───────────────────────────────────────
router.delete('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM members WHERE id = ?', [req.params.id]);
      if (!result.affectedRows)
        return res.status(404).json({ success: false, message: 'Member not found' });

      res.json({ success: true, message: 'Member deleted successfully' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
