const express = require('express');
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const Skill = require('../models/Skill');
const Interest = require('../models/Interest');
const User = require('../models/User');
const BusinessIdea = require('../models/BusinessIdea');
const Bookmark = require('../models/Bookmark');
const Progress = require('../models/Progress');
const MentorSession = require('../models/MentorSession');
const LearningResource = require('../models/LearningResource');
const BudgetPlan = require('../models/BudgetPlan');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });
  next();
};

const isValidId = (id) => mongoose.isValidObjectId(id);

router.get('/skills', async (req, res, next) => {
  try {
    const skills = await Skill.find().sort({ category: 1, name: 1 });
    res.json({ skills });
  } catch (err) {
    next(err);
  }
});

router.get('/interests', async (req, res, next) => {
  try {
    const interests = await Interest.find().sort({ name: 1 });
    res.json({ interests });
  } catch (err) {
    next(err);
  }
});

// Get the current user's skill/interest profile.
router.get('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).populate('skills.skill').populate('interests');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    const skills = user.skills
      .filter((s) => s.skill)
      .map((s) => ({ id: s.skill.id, name: s.skill.name, category: s.skill.category, proficiency: s.proficiency }));
    const interests = user.interests.map((i) => ({ id: i.id, name: i.name }));

    res.json({ skills, interests });
  } catch (err) {
    next(err);
  }
});

// Full profile — skills, interests, stats, achievements, for any role
router.get('/me/full-profile', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('skills.skill', 'name category')
      .populate('interests', 'name');
    if (!user) return res.status(404).json({ error: 'User not found.' });

    // Core stats for all roles
    const [progressDocs, bookmarkCount] = await Promise.all([
      Progress.find({ user: user._id }).populate({ path: 'roadmap', populate: { path: 'idea', select: 'title category' } }),
      Bookmark.countDocuments({ user: user._id }),
    ]);

    const completedSteps    = progressDocs.filter(p => p.completed).length;
    const totalSteps        = progressDocs.length;
    const roadmapsStarted   = [...new Set(progressDocs.map(p => p.roadmap?._id?.toString()).filter(Boolean))].length;

    // Per-roadmap breakdown
    const roadmapMap = {};
    for (const p of progressDocs) {
      if (!p.roadmap) continue;
      const key = p.roadmap._id.toString();
      if (!roadmapMap[key]) {
        roadmapMap[key] = {
          id: key,
          idea_title: p.roadmap.idea?.title || 'Unknown',
          category: p.roadmap.idea?.category || null,
          total: 0, completed: 0,
        };
      }
      roadmapMap[key].total += 1;
      if (p.completed) roadmapMap[key].completed += 1;
    }

    // Mentor-specific or user-specific session data
    let sessionStats = null;
    let resourcesSubmitted = 0;

    if (user.role === 'mentor') {
      const sessions = await MentorSession.find({ mentor: user._id });
      resourcesSubmitted = await LearningResource.countDocuments({ uploadedBy: user._id });
      sessionStats = {
        total:     sessions.length,
        requested: sessions.filter(s => s.status === 'requested').length,
        accepted:  sessions.filter(s => s.status === 'accepted').length,
        completed: sessions.filter(s => s.status === 'completed').length,
        declined:  sessions.filter(s => s.status === 'declined').length,
      };
    } else {
      const sessionsRequested = await MentorSession.countDocuments({ mentee: user._id });
      sessionStats = { requested: sessionsRequested };
    }

    // Compute achievements
    const achievements = [];
    if (roadmapsStarted >= 1)   achievements.push({ id: 'first_roadmap',   icon: '🗺️',  label: 'Roadmap Pioneer',      desc: 'Started your first business roadmap' });
    if (roadmapsStarted >= 3)   achievements.push({ id: 'explorer',         icon: '🧭',  label: 'Explorer',             desc: 'Started 3 or more roadmaps' });
    if (completedSteps >= 1)    achievements.push({ id: 'first_step',       icon: '✅',  label: 'First Step',           desc: 'Completed your first roadmap step' });
    if (completedSteps >= 5)    achievements.push({ id: 'momentum',         icon: '🚀',  label: 'Building Momentum',    desc: 'Completed 5 roadmap steps' });
    if (completedSteps >= 10)   achievements.push({ id: 'achiever',         icon: '🏆',  label: 'Achiever',             desc: 'Completed 10 roadmap steps' });
    if (bookmarkCount >= 3)     achievements.push({ id: 'curator',          icon: '🔖',  label: 'Idea Curator',         desc: 'Bookmarked 3+ business ideas' });
    if (user.skills?.length >= 1) achievements.push({ id: 'skilled',        icon: '⭐',  label: 'Skill Registered',     desc: 'Added your first skill to your profile' });
    if (user.skills?.length >= 3) achievements.push({ id: 'multi_skilled',  icon: '💫',  label: 'Multi-talented',       desc: 'Added 3 or more skills' });
    if (user.role === 'mentor')  achievements.push({ id: 'mentor_badge',    icon: '🎓',  label: 'Verified Mentor',      desc: 'Approved as a platform mentor' });
    if (user.role === 'admin')   achievements.push({ id: 'admin_badge',     icon: '🛡️',  label: 'Platform Admin',       desc: 'Manages the EntreSkill Hub platform' });
    if (sessionStats?.completed >= 1) achievements.push({ id: 'first_session', icon: '🤝', label: 'Session Completed', desc: 'Completed a mentoring session' });
    if (sessionStats?.completed >= 5) achievements.push({ id: 'mentor_pro',   icon: '🌟', label: 'Mentor Pro',          desc: 'Completed 5 mentoring sessions' });
    if (resourcesSubmitted >= 1) achievements.push({ id: 'contributor',     icon: '📚',  label: 'Resource Contributor', desc: 'Submitted a learning resource' });

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        status: user.status,
        bio: user.bio,
        expertise: user.expertise,
        experience_years: user.experienceYears,
        created_at: user.createdAt,
        dob: user.dob,
        phone: user.phone,
        address: user.address,
        gender: user.gender,
        profile_picture: user.profilePicture,
        github_url: user.githubUrl,
        linkedin_url: user.linkedinUrl,
        skills: user.skills.filter(s => s.skill).map(s => ({ id: s.skill.id, name: s.skill.name, category: s.skill.category, proficiency: s.proficiency })),
        interests: user.interests.map(i => ({ id: i.id, name: i.name })),
      },
      stats: {
        roadmaps_started:   roadmapsStarted,
        steps_completed:    completedSteps,
        total_steps:        totalSteps,
        bookmarks:          bookmarkCount,
        resources_submitted: resourcesSubmitted,
        sessions:           sessionStats,
      },
      progress_breakdown: Object.values(roadmapMap),
      achievements,
    });
  } catch (err) {
    next(err);
  }
});

// Update personal details
router.put(
  '/me/personal-details',
  requireAuth,
  [
    body('name').optional().trim().isLength({ min: 2, max: 80 }),
    body('dob').optional({ nullable: true }).isISO8601().toDate(),
    body('phone').optional({ nullable: true }).trim(),
    body('address').optional({ nullable: true }).trim(),
    body('gender').optional({ nullable: true }).isIn(['male', 'female', 'other', 'prefer_not_to_say', null]),
    body('profile_picture').optional({ nullable: true }).trim(),
    body('github_url').optional({ nullable: true }).trim(),
    body('linkedin_url').optional({ nullable: true }).trim(),
    body('bio').optional({ nullable: true }).trim(),
    body('expertise').optional({ nullable: true }).trim(),
    body('experience_years').optional({ nullable: true }).isInt({ min: 0 }),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const updates = {};
      const fields = [
        'name', 'dob', 'phone', 'address', 'gender', 'bio', 'expertise'
      ];
      for (const field of fields) {
        if (req.body[field] !== undefined) {
          updates[field] = req.body[field];
        }
      }

      if (req.body.profile_picture !== undefined) updates.profilePicture = req.body.profile_picture;
      if (req.body.github_url !== undefined)       updates.githubUrl = req.body.github_url;
      if (req.body.linkedin_url !== undefined)     updates.linkedinUrl = req.body.linkedin_url;
      if (req.body.experience_years !== undefined) updates.experienceYears = req.body.experience_years;

      const user = await User.findByIdAndUpdate(req.user.id, updates, { new: true });
      res.json({ message: 'Personal details updated.', user });
    } catch (err) {
      next(err);
    }
  }
);

// Replace the current user's skill/interest profile in one call.
router.put(
  '/me/profile',
  requireAuth,
  [
    body('skill_ids').optional().isArray().withMessage('skill_ids must be an array.'),
    body('interest_ids').optional().isArray().withMessage('interest_ids must be an array.'),
    body('skills').optional().isArray().withMessage('skills must be an array.'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { skill_ids: skillIds, interest_ids: interestIds, skills: skillEntries } = req.body;

      const updates = {};

      if (skillEntries && Array.isArray(skillEntries)) {
        updates.skills = skillEntries
          .filter((s) => isValidId(s.id))
          .map((s) => ({
            skill: s.id,
            proficiency: ['beginner', 'intermediate', 'expert'].includes(s.proficiency) ? s.proficiency : 'beginner',
          }));
      } else if (skillIds) {
        const cleanSkillIds = [...new Set(skillIds.filter(isValidId))];
        const existing = await User.findById(req.user.id).select('skills');
        const profMap = new Map(
          (existing?.skills || []).map((s) => [s.skill.toString(), s.proficiency || 'beginner'])
        );
        updates.skills = cleanSkillIds.map((id) => ({
          skill: id,
          proficiency: profMap.get(id) || 'beginner',
        }));
      }

      if (interestIds) {
        updates.interests = [...new Set(interestIds.filter(isValidId))];
      }

      await User.findByIdAndUpdate(req.user.id, updates);

      res.json({ message: 'Profile updated.' });
    } catch (err) {
      next(err);
    }
  }
);

// Bookmarks
router.get('/me/bookmarks', requireAuth, async (req, res, next) => {
  try {
    const rows = await Bookmark.find({ user: req.user.id }).sort({ createdAt: -1 }).populate('idea');
    res.json({ bookmarks: rows.filter((b) => b.idea).map((b) => b.idea) });
  } catch (err) {
    next(err);
  }
});

router.post('/me/bookmarks/:ideaId', requireAuth, async (req, res, next) => {
  try {
    if (!isValidId(req.params.ideaId)) return res.status(404).json({ error: 'Business idea not found.' });
    const idea = await BusinessIdea.findById(req.params.ideaId);
    if (!idea) return res.status(404).json({ error: 'Business idea not found.' });

    await Bookmark.updateOne(
      { user: req.user.id, idea: req.params.ideaId },
      { $setOnInsert: { user: req.user.id, idea: req.params.ideaId } },
      { upsert: true }
    );
    res.status(201).json({ message: 'Bookmarked.' });
  } catch (err) {
    next(err);
  }
});

router.delete('/me/bookmarks/:ideaId', requireAuth, async (req, res, next) => {
  try {
    await Bookmark.deleteOne({ user: req.user.id, idea: req.params.ideaId });
    res.json({ message: 'Bookmark removed.' });
  } catch (err) {
    next(err);
  }
});

// Budget planner persistence per user + idea
router.get('/me/budget/:ideaId', requireAuth, async (req, res, next) => {
  try {
    if (!isValidId(req.params.ideaId)) return res.status(404).json({ error: 'Budget plan not found.' });

    const plan = await BudgetPlan.findOne({ user: req.user.id, idea: req.params.ideaId });
    if (!plan) return res.json({ budget: null });

    res.json({
      budget: {
        step_costs: Object.fromEntries(plan.stepCosts || []),
        custom_items: (plan.customItems || []).map((item) => ({
          id: item.id,
          label: item.label,
          cost: item.cost,
        })),
      },
    });
  } catch (err) {
    next(err);
  }
});

router.put('/me/budget/:ideaId', requireAuth, async (req, res, next) => {
  try {
    if (!isValidId(req.params.ideaId)) return res.status(400).json({ error: 'Invalid idea id.' });

    const { step_costs: stepCosts, custom_items: customItems } = req.body;
    const stepCostMap = new Map();

    if (stepCosts && typeof stepCosts === 'object') {
      Object.entries(stepCosts).forEach(([key, val]) => {
        if (isValidId(key)) stepCostMap.set(key, Number(val) || 0);
      });
    }

    const items = Array.isArray(customItems)
      ? customItems
          .filter((item) => item?.label?.trim())
          .map((item) => ({ label: item.label.trim(), cost: Number(item.cost) || 0 }))
      : [];

    await BudgetPlan.findOneAndUpdate(
      { user: req.user.id, idea: req.params.ideaId },
      { stepCosts: stepCostMap, customItems: items },
      { upsert: true, new: true }
    );

    res.json({ message: 'Budget saved.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
