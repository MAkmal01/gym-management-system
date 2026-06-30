// routes/dashboard.js — summary stats for the frontend header

const express = require('express');
const router  = express.Router();
const db      = require('../config/db');

// GET /api/dashboard
router.get('/', async (req, res) => {
  try {
    const [[{ total_members }]]  = await db.query('SELECT COUNT(*) AS total_members FROM members');
    const [[{ active_members }]] = await db.query("SELECT COUNT(*) AS active_members FROM members WHERE status = 'Active'");
    const [[{ total_trainers }]] = await db.query('SELECT COUNT(*) AS total_trainers FROM trainers');
    const [[{ total_classes }]]  = await db.query('SELECT COUNT(*) AS total_classes FROM classes');
    const [[{ total_bookings }]] = await db.query("SELECT COUNT(*) AS total_bookings FROM bookings WHERE status = 'Confirmed'");

    // Plan distribution
    const [planDist] = await db.query(`
      SELECT p.name, COUNT(m.id) AS count
      FROM plans p
      LEFT JOIN members m ON m.plan_id = p.id
      GROUP BY p.id, p.name
    `);

    res.json({
      success: true,
      data: {
        total_members,
        active_members,
        total_trainers,
        total_classes,
        total_bookings,
        plan_distribution: planDist,
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
