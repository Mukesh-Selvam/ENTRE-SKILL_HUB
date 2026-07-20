const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const LearningResource = require('../models/LearningResource');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

router.get('/', async (req, res, next) => {
  try {
    const skillId = req.query.skill_id;
    const filter = { status: 'approved' };
    if (skillId && mongoose.isValidObjectId(skillId)) filter.skill = skillId;

    const resources = await LearningResource.find(filter).sort({ createdAt: -1 });
    res.json({ resources });
  } catch (err) {
    next(err);
  }
});

// Mentors/trainers can upload resources; they enter a pending queue for admin approval.
router.post(
  '/',
  requireAuth,
  requireRole('mentor', 'admin'),
  [
    body('title').trim().isLength({ min: 3, max: 150 }),
    body('type').isIn(['video', 'article', 'checklist']),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { title, type, url, body: content, skill_id: skillId } = req.body;
      const status = req.user.role === 'admin' ? 'approved' : 'pending';

      const resource = await LearningResource.create({
        title,
        type,
        url: url || null,
        body: content || null,
        skill: skillId && mongoose.isValidObjectId(skillId) ? skillId : null,
        status,
        uploadedBy: req.user.id,
      });
      res.status(201).json({ id: resource.id, status: resource.status });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
