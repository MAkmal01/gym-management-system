// routes/classes.js

const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const validate = require('../middleware/validate');
const { body, param, query } = require('express-validator');

// ── GET /api/classes ──────────────────────────────────────────────
// Query param: ?day=Mon
router.get('/', async (req, res) => {
  try {
    const { day } = req.query;
    let sql = `
      SELECT
        c.*, t.name AS trainer_name, t.specialization AS trainer_spec,
        (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status = 'Confirmed') AS filled_slots
      FROM classes c
      LEFT JOIN trainers t ON c.trainer_id = t.id
    `;
    const params = [];

    if (day) {
      sql += ' WHERE c.day = ?';
      params.push(day);
    }
    sql += ' ORDER BY FIELD(c.day,"Mon","Tue","Wed","Thu","Fri","Sat","Sun"), c.time ASC';

    const [rows] = await db.query(sql, params);
    res.json({ success: true, data: rows });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/classes/:id ──────────────────────────────────────────
router.get('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT c.*, t.name AS trainer_name,
          (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status = 'Confirmed') AS filled_slots
        FROM classes c
        LEFT JOIN trainers t ON c.trainer_id = t.id
        WHERE c.id = ?
      `, [req.params.id]);

      if (!rows.length)
        return res.status(404).json({ success: false, message: 'Class not found' });

      res.json({ success: true, data: rows[0] });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── POST /api/classes ─────────────────────────────────────────────
router.post('/',
  [
    body('name').trim().notEmpty().withMessage('Class name is required'),
    body('day').isIn(['Mon','Tue','Wed','Thu','Fri','Sat','Sun']).withMessage('Valid day required'),
    body('time').matches(/^\d{2}:\d{2}(:\d{2})?$/).withMessage('Time must be HH:MM'),
    body('duration').trim().notEmpty(),
    body('level').optional().isIn(['Low','Med','High']),
    body('total_slots').optional().isInt({ min: 1 }),
    body('trainer_id').optional({ nullable: true }).isInt({ min: 1 }),
  ],
  validate,
  async (req, res) => {
    try {
      const { name, day, time, duration, level, total_slots, trainer_id } = req.body;
      const [result] = await db.query(
        'INSERT INTO classes (name, day, time, duration, level, total_slots, trainer_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, day, time, duration, level || 'Med', total_slots || 20, trainer_id || null]
      );
      res.status(201).json({ success: true, message: 'Class created', data: { id: result.insertId } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ── DELETE /api/classes/:id ───────────────────────────────────────
router.delete('/:id',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [result] = await db.query('DELETE FROM classes WHERE id = ?', [req.params.id]);
      if (!result.affectedRows)
        return res.status(404).json({ success: false, message: 'Class not found' });
      res.json({ success: true, message: 'Class deleted' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// ────────────────────────────────────────────────────────────────
//  BOOKINGS  —  nested under /api/classes/:id/bookings
// ────────────────────────────────────────────────────────────────

// GET /api/classes/:id/bookings  — list who booked this class
router.get('/:id/bookings',
  [param('id').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [rows] = await db.query(`
        SELECT b.id, b.booked_at, b.status,
               m.id AS member_id, m.first_name, m.last_name, m.email
        FROM bookings b
        JOIN members m ON b.member_id = m.id
        WHERE b.class_id = ? AND b.status = 'Confirmed'
        ORDER BY b.booked_at ASC
      `, [req.params.id]);
      res.json({ success: true, count: rows.length, data: rows });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// POST /api/classes/:id/bookings  — book a class
router.post('/:id/bookings',
  [
    param('id').isInt({ min: 1 }),
    body('member_id').isInt({ min: 1 }).withMessage('member_id is required'),
  ],
  validate,
  async (req, res) => {
    try {
      const classId  = req.params.id;
      const memberId = req.body.member_id;

      // Check class exists and has slots
      const [classRows] = await db.query(`
        SELECT c.total_slots,
          (SELECT COUNT(*) FROM bookings b WHERE b.class_id = c.id AND b.status = 'Confirmed') AS filled
        FROM classes c WHERE c.id = ?
      `, [classId]);

      if (!classRows.length)
        return res.status(404).json({ success: false, message: 'Class not found' });

      const { total_slots, filled } = classRows[0];
      if (filled >= total_slots)
        return res.status(409).json({ success: false, message: 'Class is fully booked' });

      // Book (INSERT IGNORE handles duplicate gracefully)
      const [result] = await db.query(
        'INSERT IGNORE INTO bookings (member_id, class_id) VALUES (?, ?)',
        [memberId, classId]
      );

      if (result.affectedRows === 0)
        return res.status(409).json({ success: false, message: 'Member already booked this class' });

      res.status(201).json({ success: true, message: 'Class booked successfully', data: { id: result.insertId } });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

// DELETE /api/classes/:id/bookings/:bookingId  — cancel booking
router.delete('/:id/bookings/:bookingId',
  [param('id').isInt({ min: 1 }), param('bookingId').isInt({ min: 1 })],
  validate,
  async (req, res) => {
    try {
      const [result] = await db.query(
        "UPDATE bookings SET status = 'Cancelled' WHERE id = ? AND class_id = ?",
        [req.params.bookingId, req.params.id]
      );
      if (!result.affectedRows)
        return res.status(404).json({ success: false, message: 'Booking not found' });
      res.json({ success: true, message: 'Booking cancelled' });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
);

module.exports = router;
