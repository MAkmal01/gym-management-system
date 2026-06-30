// routes/trainers.js

const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

// ── GET /api/trainers ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [trainers] = await db.query('SELECT * FROM trainers ORDER BY name ASC');

    // Also attach number of assigned members to each trainer
    const [counts] = await db.query(`
      SELECT trainer_id, COUNT(*) AS member_count
      FROM members WHERE trainer_id IS NOT NULL
      GROUP BY trainer_id
    `);
    const countMap = {};
    counts.forEach(c => countMap[c.trainer_id] = c.member_count);

    const data = trainers.map(t => ({ ...t, member_count: countMap[t.id] || 0 }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/trainers/:id ─────────────────────────────────────────
router.get('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM trainers WHERE id = ?', [req.params.id]);
      if (!rows.length)
        return res.status(404).json({ success: false, message: 'Trainer not found' });

      // Get trainer's classes
      const [classes] = await db.query(
        'SELECT id, name, day, time, duration, level, total_slots FROM classes WHERE trainer_id = ?',
        [req.params.id]
      );

      res.json({ success: true, data: { ...rows[0], classes } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/trainers ────────────────────────────────────────────
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Trainer name is required'),
    body('specialization').optional().trim(),
    body('experience_yrs').optional().isInt({ min: 0 }),
    body('rating').optional().isFloat({ min: 0, max: 5 }),
    body('email').optional().isEmail().normalizeEmail(),
    body('phone').optional().trim(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, specialization, experience_yrs, rating, email, phone } = req.body;
      const [result] = await db.query(
        'INSERT INTO trainers (name, specialization, experience_yrs, rating, email, phone) VALUES (?, ?, ?, ?, ?, ?)',
        [name, specialization || null, experience_yrs || 0, rating || 0, email || null, phone || null]
      );
      res.status(201).json({ success: true, message: 'Trainer added', data: { id: result.insertId } });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(409).json({ success: false, message: 'Email already exists' });
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── PUT /api/trainers/:id ─────────────────────────────────────────
router.put('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const allowed = ['name','specialization','experience_yrs','rating','email','phone'];
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
      const [result] = await db.query(`UPDATE trainers SET ${fields.join(', ')} WHERE id = ?`, values);
      if (!result.affectedRows)
        return res.status(404).json({ success: false, message: 'Trainer not found' });

      res.json({ success: true, message: 'Trainer updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/trainers/:id ──────────────────────────────────────
router.delete('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM trainers WHERE id = ?', [req.params.id]);
      if (!result.affectedRows)
        return res.status(404).json({ success: false, message: 'Trainer not found' });
      res.json({ success: true, message: 'Trainer deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
