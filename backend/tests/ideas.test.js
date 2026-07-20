const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Interest = require('../models/Interest');
const BusinessIdea = require('../models/BusinessIdea');
const bcrypt = require('bcryptjs');

describe('Business Ideas & Recommendations Endpoints', () => {
  let token;
  let user;
  let skillTailoring;
  let skillMarketing;
  let skillAccounting;
  let interestWorkFromHome;
  let interestSellingOnline;

  beforeEach(async () => {
    // Create reference skills
    skillTailoring = await Skill.create({ name: 'Tailoring', category: 'Crafts' });
    skillMarketing = await Skill.create({ name: 'Marketing', category: 'Business' });
    skillAccounting = await Skill.create({ name: 'Accounting', category: 'Finance' });

    // Create reference interests
    interestWorkFromHome = await Interest.create({ name: 'Working from home' });
    interestSellingOnline = await Interest.create({ name: 'Selling online' });

    // Create a user with expert Tailoring, beginner Marketing, and two interests
    user = await User.create({
      name: 'Asha User',
      email: 'asha@entreskill.dev',
      passwordHash: bcrypt.hashSync('User@1234', 10),
      role: 'user',
      status: 'active',
      skills: [
        { skill: skillTailoring._id, proficiency: 'expert' },
        { skill: skillMarketing._id, proficiency: 'beginner' }
      ],
      interests: [interestWorkFromHome._id, interestSellingOnline._id]
    });

    // Log in to get JWT token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'asha@entreskill.dev', password: 'User@1234' });
    token = loginRes.body.token;
  });

  describe('GET /api/business-ideas', () => {
    it('should return published business ideas, but not draft business ideas', async () => {
      await BusinessIdea.create({
        title: 'Published Custom Tailoring Shop',
        summary: 'Tailoring services for weddings.',
        category: 'Services',
        status: 'published',
        skills: [skillTailoring._id]
      });

      await BusinessIdea.create({
        title: 'Draft Financial Advisory',
        summary: 'A financial advisory firm.',
        category: 'Finance',
        status: 'draft',
        skills: [skillAccounting._id]
      });

      const res = await request(app).get('/api/business-ideas');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('ideas');
      expect(res.body.ideas).toHaveLength(1);
      expect(res.body.ideas[0].title).toBe('Published Custom Tailoring Shop');
    });
  });

  describe('GET /api/business-ideas/recommendations/for-me', () => {
    it('should rank ideas by the proficiency-weighted skill + interest score', async () => {
      // Idea A: Requires expert Tailoring (user skill at expert=1.0) + both interest matches.
      // Skill score: 1.0/1 = 1.0; interest score: 2/2 = 1.0; total = 0.8*1.0 + 0.2*1.0 = 1.0 = 100%
      const ideaA = await BusinessIdea.create({
        title: 'Expert Tailoring Studio',
        status: 'published',
        skills: [skillTailoring._id],
        interests: [interestWorkFromHome._id, interestSellingOnline._id]
      });

      // Idea B: Requires beginner Marketing only (user skill at beginner=0.5). No matching interests.
      // Skill score: 0.5/1 = 0.5; interest score: 0; total = 0.8*0.5 + 0.2*0 = 0.4 = 40%
      const ideaB = await BusinessIdea.create({
        title: 'Basic Marketing Agency',
        status: 'published',
        skills: [skillMarketing._id],
        interests: []
      });

      // Idea C: Requires Accounting (user doesn't have it). No interests.
      // Skill score: 0; interest score: 0; total = 0%
      const ideaC = await BusinessIdea.create({
        title: 'Pure Accounting Advisory',
        status: 'published',
        skills: [skillAccounting._id],
        interests: []
      });

      const res = await request(app)
        .get('/api/business-ideas/recommendations/for-me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('recommendations');

      const recs = res.body.recommendations;
      expect(recs).toHaveLength(3);

      // Verify sorting: highest score first
      expect(recs[0].title).toBe(ideaA.title);
      expect(recs[0].match_score).toBe(100);

      expect(recs[1].title).toBe(ideaB.title);
      expect(recs[1].match_score).toBe(40);

      expect(recs[2].title).toBe(ideaC.title);
      expect(recs[2].match_score).toBe(0);
    });

    it('should include a human-readable match_reason for each recommendation', async () => {
      await BusinessIdea.create({
        title: 'Tailoring & Brand Shop',
        status: 'published',
        skills: [skillTailoring._id],
        interests: [interestWorkFromHome._id]
      });

      const res = await request(app)
        .get('/api/business-ideas/recommendations/for-me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const rec = res.body.recommendations[0];
      expect(rec).toHaveProperty('match_reason');
      expect(typeof rec.match_reason).toBe('string');
      expect(rec.match_reason.length).toBeGreaterThan(0);

      // Verify it mentions the correct proficiency level
      expect(rec.match_reason).toContain('expert');
      // Verify it mentions the interest
      expect(rec.match_reason).toContain('Working from home');
    });

    it('should give no match_reason mentioning skills when user has none of the required skills', async () => {
      await BusinessIdea.create({
        title: 'Pure Accounting Firm',
        status: 'published',
        skills: [skillAccounting._id],
        interests: []
      });

      const res = await request(app)
        .get('/api/business-ideas/recommendations/for-me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const rec = res.body.recommendations[0];
      expect(rec.match_reason).toContain('Matches 0 of');
    });

    it('should weight expert skill more than beginner skill', async () => {
      // Idea A: needs Tailoring (user=expert, weight=1.0). Score = 0.8*1.0 = 80
      const ideaA = await BusinessIdea.create({
        title: 'Expert Tailoring Only',
        status: 'published',
        skills: [skillTailoring._id],
        interests: []
      });

      // Idea B: needs Marketing (user=beginner, weight=0.5). Score = 0.8*0.5 = 40
      const ideaB = await BusinessIdea.create({
        title: 'Beginner Marketing Only',
        status: 'published',
        skills: [skillMarketing._id],
        interests: []
      });

      const res = await request(app)
        .get('/api/business-ideas/recommendations/for-me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      const recs = res.body.recommendations;
      expect(recs[0].title).toBe(ideaA.title);
      expect(recs[0].match_score).toBe(80);
      expect(recs[1].title).toBe(ideaB.title);
      expect(recs[1].match_score).toBe(40);
    });
  });
});
