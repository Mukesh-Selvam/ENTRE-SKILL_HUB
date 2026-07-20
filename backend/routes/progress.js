const express = require('express');
const mongoose = require('mongoose');
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');
const Bookmark = require('../models/Bookmark');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Dashboard: roadmaps the user has started (any progress record or bookmarked idea).
router.get('/', requireAuth, async (req, res, next) => {
  try {
    const [allProgress, bookmarks] = await Promise.all([
      Progress.find({ user: req.user.id }),
      Bookmark.find({ user: req.user.id }).populate('idea'),
    ]);

    const completedByRoadmap = new Map();
    const touchedRoadmaps = new Set();

    allProgress.forEach((p) => {
      const key = p.roadmap.toString();
      touchedRoadmaps.add(key);
      if (p.completed) {
        completedByRoadmap.set(key, (completedByRoadmap.get(key) || 0) + 1);
      }
    });

    const bookmarkedIdeaIds = bookmarks.filter((b) => b.idea).map((b) => b.idea.id);
    const bookmarkedRoadmaps = bookmarkedIdeaIds.length
      ? await Roadmap.find({ idea: { $in: bookmarkedIdeaIds } })
      : [];

    bookmarkedRoadmaps.forEach((r) => touchedRoadmaps.add(r.id));

    if (touchedRoadmaps.size === 0) return res.json({ progress: [] });

    const roadmaps = await Roadmap.find({ _id: { $in: [...touchedRoadmaps] } }).populate('idea');

    const progress = roadmaps
      .map((r) => ({
        roadmap_id: r.id,
        title: r.title,
        idea_id: r.idea ? r.idea.id : null,
        idea_title: r.idea ? r.idea.title : null,
        total_steps: r.steps.length,
        completed_steps: completedByRoadmap.get(r.id) || 0,
      }))
      .sort((a, b) => b.completed_steps - a.completed_steps);

    res.json({ progress });
  } catch (err) {
    next(err);
  }
});

router.get('/roadmap/:roadmapId', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.roadmapId)) return res.json({ steps: [] });

    const roadmap = await Roadmap.findById(req.params.roadmapId);
    if (!roadmap) return res.status(404).json({ error: 'Roadmap not found.' });

    const stepIds = roadmap.steps.map((s) => s._id);
    const progressDocs = await Progress.find({ user: req.user.id, step: { $in: stepIds } });
    const progressByStep = new Map(progressDocs.map((p) => [p.step.toString(), p]));

    const steps = [...roadmap.steps]
      .sort((a, b) => a.stepOrder - b.stepOrder)
      .map((s) => {
        const p = progressByStep.get(s._id.toString());
        return {
          ...Roadmap.transformStep(s),
          roadmap_id: roadmap.id,
          completed: p ? p.completed : false,
          completed_at: p ? p.completedAt : null,
        };
      });

    res.json({ steps });
  } catch (err) {
    next(err);
  }
});

router.put('/step/:stepId', requireAuth, async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.stepId)) return res.status(404).json({ error: 'Roadmap step not found.' });

    const roadmap = await Roadmap.findOne({ 'steps._id': req.params.stepId });
    if (!roadmap) return res.status(404).json({ error: 'Roadmap step not found.' });

    const completed = Boolean(req.body.completed);
    const completedAt = completed ? new Date() : null;

    await Progress.findOneAndUpdate(
      { user: req.user.id, step: req.params.stepId },
      { user: req.user.id, roadmap: roadmap.id, step: req.params.stepId, completed, completedAt },
      { upsert: true, setDefaultsOnInsert: true }
    );

    res.json({ message: 'Progress updated.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
