const express = require('express');
const mongoose = require('mongoose');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const BusinessIdea = require('../models/BusinessIdea');
const LearningResource = require('../models/LearningResource');
const Progress = require('../models/Progress');
const MentorSession = require('../models/MentorSession');
const Feedback = require('../models/Feedback');
const Roadmap = require('../models/Roadmap');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();
// Every route in this file requires an authenticated admin.
router.use(requireAuth, requireRole('admin'));

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

const userFields = 'name email role status expertise experienceYears bio createdAt';

// --- Users & mentors ---
// Enhanced with search and status filtering
router.get('/users', async (req, res, next) => {
  try {
    const { role, status, search } = req.query;
    const filter = {};
    if (role) filter.role = role;
    if (status) filter.status = status;
    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ name: regex }, { email: regex }, { expertise: regex }];
    }
    const users = await User.find(filter).select(userFields).sort({ createdAt: -1 });
    res.json({ users });
  } catch (err) {
    next(err);
  }
});

// Full user detail profile — skills, interests, progress stats, session count
router.get('/users/:id/details', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });

    const user = await User.findById(req.params.id)
      .select(userFields + ' skills interests')
      .populate('skills.skill', 'name category')
      .populate('interests', 'name');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Progress stats: count unique roadmaps started + completed steps
    const [progressDocs, sessionCount, roadmapsStarted] = await Promise.all([
      Progress.find({ user: user._id }).populate({
        path: 'roadmap',
        populate: { path: 'idea', select: 'title' },
      }),
      MentorSession.countDocuments({ mentee: user._id }),
      Progress.distinct('roadmap', { user: user._id }),
    ]);

    const completedSteps = progressDocs.filter(p => p.completed).length;
    const totalStepsTracked = progressDocs.length;

    // Group by roadmap for per-idea breakdown
    const roadmapMap = {};
    for (const p of progressDocs) {
      if (!p.roadmap) continue;
      const key = p.roadmap._id.toString();
      if (!roadmapMap[key]) {
        roadmapMap[key] = {
          roadmap_id: key,
          idea_title: p.roadmap.idea?.title || 'Unknown idea',
          total: 0,
          completed: 0,
        };
      }
      roadmapMap[key].total += 1;
      if (p.completed) roadmapMap[key].completed += 1;
    }

    res.json({
      user,
      stats: {
        roadmaps_started: roadmapsStarted.length,
        steps_completed: completedSteps,
        total_steps_tracked: totalStepsTracked,
        mentor_sessions_requested: sessionCount,
      },
      progress_breakdown: Object.values(roadmapMap),
    });
  } catch (err) {
    next(err);
  }
});

router.put('/users/:id/status', [body('status').isIn(['active', 'pending', 'suspended'])], handleValidation, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'User not found.' });
    const user = await User.findByIdAndUpdate(req.params.id, { status: req.body.status });
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ message: 'User status updated.' });
  } catch (err) {
    next(err);
  }
});

// Full mentor detail profile — bio, expertise, session breakdown, resources count
router.get('/mentors/:id/details', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Mentor not found.' });

    const mentor = await User.findOne({ _id: req.params.id, role: 'mentor' })
      .select(userFields + ' skills interests');
    if (!mentor) return res.status(404).json({ error: 'Mentor not found.' });

    const [sessions, resourceCount] = await Promise.all([
      MentorSession.find({ mentor: mentor._id })
        .populate('mentee', 'name email')
        .sort({ createdAt: -1 })
        .limit(20),
      LearningResource.countDocuments({ uploadedBy: mentor._id }),
    ]);

    const sessionBreakdown = {
      requested: sessions.filter(s => s.status === 'requested').length,
      accepted: sessions.filter(s => s.status === 'accepted').length,
      completed: sessions.filter(s => s.status === 'completed').length,
      declined: sessions.filter(s => s.status === 'declined').length,
    };

    res.json({
      mentor,
      session_breakdown: sessionBreakdown,
      recent_sessions: sessions.map(s => ({
        id: s.id,
        mentee_name: s.mentee?.name || 'Unknown',
        mentee_email: s.mentee?.email || '',
        topic: s.topic,
        status: s.status,
        created_at: s.createdAt,
      })),
      resources_submitted: resourceCount,
    });
  } catch (err) {
    next(err);
  }
});

// --- Business ideas curation ---
router.get('/business-ideas', async (req, res, next) => {
  try {
    const ideas = await BusinessIdea.find().sort({ createdAt: -1 }).populate('skills');
    res.json({ ideas });
  } catch (err) {
    next(err);
  }
});

router.post(
  '/business-ideas',
  [body('title').trim().isLength({ min: 3, max: 150 }), body('category').optional().trim()],
  handleValidation,
  async (req, res, next) => {
    try {
      const { title, summary, category, skill_ids: skillIds } = req.body;
      const cleanSkillIds = Array.isArray(skillIds) ? skillIds.filter((id) => mongoose.isValidObjectId(id)) : [];

      const idea = await BusinessIdea.create({
        title,
        summary: summary || null,
        category: category || null,
        status: 'draft',
        createdBy: req.user.id,
        skills: cleanSkillIds,
      });
      res.status(201).json({ id: idea.id });
    } catch (err) {
      next(err);
    }
  }
);

router.put('/business-ideas/:id/status', [body('status').isIn(['draft', 'published'])], handleValidation, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Business idea not found.' });
    const idea = await BusinessIdea.findByIdAndUpdate(req.params.id, { status: req.body.status });
    if (!idea) return res.status(404).json({ error: 'Business idea not found.' });
    res.json({ message: 'Business idea status updated.' });
  } catch (err) {
    next(err);
  }
});

// Create a roadmap for an existing business idea (used after creating a draft idea).
router.post('/business-ideas/:id/roadmap', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Business idea not found.' });
    const idea = await BusinessIdea.findById(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Business idea not found.' });

    // Ensure there's no existing roadmap for this idea (unique constraint)
    const existing = await Roadmap.findOne({ idea: idea.id });
    if (existing) return res.status(409).json({ error: 'A roadmap already exists for this idea.' });

    const steps = Array.isArray(req.body.steps) ? req.body.steps : [];
    const VALID_STAGES = ['idea_validation', 'skills_tools', 'legal_registration', 'cost_estimation', 'marketing_basics'];

    const cleanSteps = steps
      .filter((s) => s.stage && VALID_STAGES.includes(s.stage) && s.title && s.content)
      .map((s, i) => ({
        stepOrder: i + 1,
        stage: s.stage,
        title: String(s.title).trim(),
        content: String(s.content).trim(),
        estCostMin: s.est_cost_min != null ? Number(s.est_cost_min) : null,
        estCostMax: s.est_cost_max != null ? Number(s.est_cost_max) : null,
      }));

    const roadmap = await Roadmap.create({
      idea: idea.id,
      title: req.body.title || `${idea.title} — Roadmap`,
      steps: cleanSteps,
    });

    res.status(201).json({ id: roadmap.id });
  } catch (err) {
    next(err);
  }
});

// --- Learning resource approval ---
router.get('/resources/pending', async (req, res, next) => {
  try {
    const resources = await LearningResource.find({ status: 'pending' });
    res.json({ resources });
  } catch (err) {
    next(err);
  }
});

router.put('/resources/:id/status', [body('status').isIn(['approved', 'rejected'])], handleValidation, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Resource not found.' });
    const resource = await LearningResource.findByIdAndUpdate(req.params.id, { status: req.body.status });
    if (!resource) return res.status(404).json({ error: 'Resource not found.' });
    res.json({ message: 'Resource status updated.' });
  } catch (err) {
    next(err);
  }
});

// --- Platform stats + recent activity feed ---
router.get('/stats', async (req, res, next) => {
  try {
    const [
      totalUsers,
      totalMentors,
      pendingMentors,
      publishedIdeas,
      completedSteps,
      totalSessions,
      openFeedback,
    ] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'mentor', status: 'active' }),
      User.countDocuments({ role: 'mentor', status: 'pending' }),
      BusinessIdea.countDocuments({ status: 'published' }),
      Progress.countDocuments({ completed: true }),
      MentorSession.countDocuments(),
      Feedback.countDocuments({ status: 'open' }),
    ]);

    res.json({ totalUsers, totalMentors, pendingMentors, publishedIdeas, completedSteps, totalSessions, openFeedback });
  } catch (err) {
    next(err);
  }
});

// Recent activity feed for admin dashboard
router.get('/activity', async (req, res, next) => {
  try {
    const limit = 15;

    const [recentUsers, recentSessions, recentFeedback, recentIdeas] = await Promise.all([
      User.find({ role: 'user' }).sort({ createdAt: -1 }).limit(5).select('name email createdAt'),
      MentorSession.find().sort({ createdAt: -1 }).limit(5)
        .populate('mentee', 'name')
        .populate('mentor', 'name'),
      Feedback.find().sort({ createdAt: -1 }).limit(3).select('subject status createdAt'),
      BusinessIdea.find({ status: 'published' }).sort({ createdAt: -1 }).limit(3).select('title category createdAt'),
    ]);

    const events = [
      ...recentUsers.map(u => ({
        type: 'user_joined',
        icon: '👤',
        label: `${u.name} joined the platform`,
        email: u.email,
        time: u.createdAt,
      })),
      ...recentSessions.map(s => ({
        type: 'session_requested',
        icon: '🤝',
        label: `${s.mentee?.name || 'A mentee'} requested a session with ${s.mentor?.name || 'a mentor'}`,
        status: s.status,
        time: s.createdAt,
      })),
      ...recentFeedback.map(f => ({
        type: 'feedback',
        icon: '💬',
        label: f.subject ? `Feedback: "${f.subject}"` : 'New feedback submitted',
        status: f.status,
        time: f.createdAt,
      })),
      ...recentIdeas.map(i => ({
        type: 'idea_published',
        icon: '💡',
        label: `Business idea published: "${i.title}"`,
        category: i.category,
        time: i.createdAt,
      })),
    ]
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, limit);

    res.json({ events });
  } catch (err) {
    next(err);
  }
});

// --- Feedback / reports ---
router.get('/feedback', async (req, res, next) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (err) {
    next(err);
  }
});

router.put('/feedback/:id/status', [body('status').isIn(['open', 'reviewed', 'resolved'])], handleValidation, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Feedback not found.' });
    await Feedback.findByIdAndUpdate(req.params.id, { status: req.body.status });
    res.json({ message: 'Feedback updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
