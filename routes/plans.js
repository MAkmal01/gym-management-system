// routes/plans.js

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const validate = require('../middleware/validate');
const { body, param } = require('express-validator');

// ── GET /api/plans ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM plans ORDER BY price ASC');
    // Parse features JSON
    const data = rows.map(r => ({ ...r, features: JSON.parse(r.features || '[]') }));
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/plans/:id ────────────────────────────────────────────
router.get('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.query('SELECT * FROM plans WHERE id = ?', [req.params.id]);
      if (!rows.length)
        return res.status(404).json({ success: false, message: 'Plan not found' });

      const plan = { ...rows[0], features: JSON.parse(rows[0].features || '[]') };
      res.json({ success: true, data: plan });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/plans ───────────────────────────────────────────────
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Plan name is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('features').optional().isArray(),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, price, duration, features } = req.body;
      const [result] = await db.query(
        'INSERT INTO plans (name, price, duration, features) VALUES (?, ?, ?, ?)',
        [name, price, duration || 'Monthly', JSON.stringify(features || [])]
      );
      res.status(201).json({ success: true, message: 'Plan created', data: { id: result.insertId } });
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY')
        return res.status(409).json({ success: false, message: 'Plan name already exists' });
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── PUT /api/plans/:id ────────────────────────────────────────────
router.put('/:id',
  [
    param('id').isInt({ min: 1 }),
    body('price').optional().isFloat({ min: 0 }),
  ],
  validate,
  async (req, res) => {
    try {
      const allowed = ['name','price','duration','features'];
      const fields = [];
      const values = [];

      allowed.forEach(key => {
        if (req.body[key] !== undefined) {
          fields.push(`${key} = ?`);
          values.push(key === 'features' ? JSON.stringify(req.body[key]) : req.body[key]);
        }
      });

      if (!fields.length)
        return res.status(400).json({ success: false, message: 'No fields to update' });

      values.push(req.params.id);
      await db.query(`UPDATE plans SET ${fields.join(', ')} WHERE id = ?`, values);
      res.json({ success: true, message: 'Plan updated' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/plans/:id ─────────────────────────────────────────
router.delete('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM plans WHERE id = ?', [req.params.id]);
      if (!result.affectedRows)
        return res.status(404).json({ success: false, message: 'Plan not found' });
      res.json({ success: true, message: 'Plan deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
