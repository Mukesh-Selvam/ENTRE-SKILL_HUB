const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const BusinessIdea = require('../models/BusinessIdea');
const Roadmap = require('../models/Roadmap');
const Progress = require('../models/Progress');
const Bookmark = require('../models/Bookmark');
const bcrypt = require('bcryptjs');

describe('Progress Tracking Endpoints', () => {
  let token;
  let user;
  let idea;
  let roadmap;
  let step1Id;
  let step2Id;

  beforeEach(async () => {
    // Create user
    user = await User.create({
      name: 'Asha User',
      email: 'asha@entreskill.dev',
      passwordHash: bcrypt.hashSync('User@1234', 10),
      role: 'user',
      status: 'active'
    });

    // Log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@entreskill.dev', password: 'User@1234' });
    token = loginRes.body.token;

    // Create business idea
    idea = await BusinessIdea.create({
      title: 'Tailoring Shop',
      status: 'published'
    });

    // Create roadmap with steps
    roadmap = await Roadmap.create({
      idea: idea._id,
      title: 'Tailoring Startup Roadmap',
      steps: [
        {
          stepOrder: 1,
          stage: 'idea_validation',
          title: 'Validate Tailoring Demand',
          content: 'Ask 10 potential customers.'
        },
        {
          stepOrder: 2,
          stage: 'skills_tools',
          title: 'Buy a sewing machine',
          content: 'Find a sewing machine in budget.'
        }
      ]
    });

    step1Id = roadmap.steps[0]._id.toString();
    step2Id = roadmap.steps[1]._id.toString();
  });

  describe('PUT /api/progress/step/:stepId', () => {
    it('should successfully mark a step complete and persist it', async () => {
      const res = await request(app)
        .put(`/api/progress/step/${step1Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('Progress updated.');

      // Check step status directly from GET /api/progress/roadmap/:roadmapId
      const getRes = await request(app)
        .get(`/api/progress/roadmap/${roadmap._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.steps[0].completed).toBe(true);
      expect(getRes.body.steps[1].completed).toBe(false);
    });

    it('should successfully mark a step incomplete when completed is false', async () => {
      // First, complete the step
      await Progress.create({
        user: user._id,
        roadmap: roadmap._id,
        step: step1Id,
        completed: true,
        completedAt: new Date()
      });

      // Now set completed to false
      const res = await request(app)
        .put(`/api/progress/step/${step1Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: false });

      expect(res.status).toBe(200);

      // Verify step is incomplete
      const getRes = await request(app)
        .get(`/api/progress/roadmap/${roadmap._id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(getRes.status).toBe(200);
      expect(getRes.body.steps[0].completed).toBe(false);
    });
  });

  describe('GET /api/progress', () => {
    it('should return aggregated completed step counts per roadmap', async () => {
      // Complete step 1
      await request(app)
        .put(`/api/progress/step/${step1Id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ completed: true });

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress).toHaveLength(1);
      expect(res.body.progress[0].roadmap_id).toBe(roadmap._id.toString());
      expect(res.body.progress[0].total_steps).toBe(2);
      expect(res.body.progress[0].completed_steps).toBe(1);
      expect(res.body.progress[0].idea_title).toBe(idea.title);
    });

    it('should return empty list if user has no progress or bookmarks', async () => {
      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress).toEqual([]);
    });

    it('should include bookmarked ideas with zero completed steps', async () => {
      await Bookmark.create({ user: user._id, idea: idea._id });

      const res = await request(app)
        .get('/api/progress')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body.progress).toHaveLength(1);
      expect(res.body.progress[0].completed_steps).toBe(0);
      expect(res.body.progress[0].idea_title).toBe(idea.title);
    });
  });
});
