const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const MentorSession = require('../models/MentorSession');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

const mentorFields = 'name bio expertise experienceYears';

// Public directory: only verified (active) mentors are visible.
router.get('/', async (req, res, next) => {
  try {
    const mentors = await User.find({ role: 'mentor', status: 'active' }).select(mentorFields);
    res.json({ mentors });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Mentor not found.' });
    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor', status: 'active' }).select(mentorFields);
    if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });
    res.json({ mentor });
  } catch (err) {
    next(err);
  }
});

// Request a session with a mentor.
router.post(
  '/:id/sessions',
  requireAuth,
  [body('message').trim().isLength({ min: 5, max: 1000 }).withMessage('Message must be 5-1000 characters.')],
  handleValidation,
  async (req, res, next) => {
    try {
      if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Mentor not found.' });
      const mentor = await User.findOne({ _id: req.params.id, role: 'mentor', status: 'active' });
      if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });

      await MentorSession.create({
        mentor: mentor.id,
        mentee: req.user.id,
        topic: req.body.topic || null,
        message: req.body.message,
      });
      res.status(201).json({ message: 'Session request sent.' });
    } catch (err) {
      next(err);
    }
  }
);

// Mentor's own view of incoming/managed sessions.
router.get('/me/sessions', requireAuth, requireRole('mentor'), async (req, res, next) => {
  try {
    const sessions = await MentorSession.find({ mentor: req.user.id }).sort({ createdAt: -1 }).populate('mentee', 'name');
    res.json({
      sessions: sessions.map((s) => ({ ...s.toJSON(), mentee_name: s.mentee ? s.mentee.name : null })),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/me/sessions/:sessionId', requireAuth, requireRole('mentor'), async (req, res, next) => {
  try {
    const status = req.body.status;
    if (!['accepted', 'completed', 'declined'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status.' });
    }
    if (!mongoose.isValidObjectId(req.params.sessionId)) return res.status(404).json({ error: 'Session not found.' });

    const session = await MentorSession.findOne({ _id: req.params.sessionId, mentor: req.user.id });
    if (!session) return res.status(404).json({ error: 'Session not found.' });

    session.status = status;
    await session.save();
    res.json({ message: 'Session updated.' });
  } catch (err) {
    next(err);
  }
});

// Mentee's own view of sessions they've requested.
router.get('/me/requests', requireAuth, async (req, res, next) => {
  try {
    const sessions = await MentorSession.find({ mentee: req.user.id }).sort({ createdAt: -1 }).populate('mentor', 'name');
    res.json({
      sessions: sessions.map((s) => ({ ...s.toJSON(), mentor_name: s.mentor ? s.mentor.name : null })),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
