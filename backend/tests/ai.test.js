const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const Skill = require('../models/Skill');
const BusinessIdea = require('../models/BusinessIdea');
const bcrypt = require('bcryptjs');

describe('Premium AI Features Endpoints', () => {
  let userToken;
  let user;
  let idea;

  beforeEach(async () => {
    // Create reference skill
    const skill = await Skill.create({ name: 'Baking', category: 'Food' });

    // Create a regular user
    user = await User.create({
      name: 'Simran User',
      email: 'simran@entreskill.dev',
      passwordHash: bcrypt.hashSync('User@1234', 10),
      role: 'user',
      status: 'active'
    });

    // Create reference business idea
    idea = await BusinessIdea.create({
      title: 'Artisan Baking Hub',
      category: 'Food',
      status: 'published',
      skills: [skill._id]
    });

    // Log in
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'simran@entreskill.dev', password: 'User@1234' });
    userToken = loginRes.body.token;
  });

  describe('POST /api/business-ideas/:id/ai-coach', () => {
    it('should generate a branding/naming concept response from AI coach', async () => {
      const res = await request(app)
        .post(`/api/business-ideas/${idea._id}/ai-coach`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'What is a good brand name for this business?' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
      expect(res.body.response).toContain('name');
      expect(res.body.response).toContain('Artisan');
    });

    it('should generate a marketing/customer reply from AI coach', async () => {
      const res = await request(app)
        .post(`/api/business-ideas/${idea._id}/ai-coach`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: 'How do I promote or sell to customers?' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('response');
      expect(res.body.response).toContain('WhatsApp');
    });

    it('should fail if the prompt is empty or too short', async () => {
      const res = await request(app)
        .post(`/api/business-ideas/${idea._id}/ai-coach`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ message: ' ' });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /api/business-ideas/generate', () => {
    it('should dynamically generate a custom business idea and 5-stage roadmap', async () => {
      const res = await request(app)
        .post('/api/business-ideas/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ prompt: 'I am looking to bake sourdough bread for local neighbors.' });

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('id');

      // Verify DB creation
      const createdIdea = await BusinessIdea.findById(res.body.id);
      expect(createdIdea).toBeTruthy();
      expect(createdIdea.title).toBe('Artisan Micro-Bakery');
      expect(createdIdea.category).toBe('Food');
      expect(createdIdea.status).toBe('draft');
      expect(res.body.status).toBe('draft');
    });

    it('should return 400 for a short prompt description', async () => {
      const res = await request(app)
        .post('/api/business-ideas/generate')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ prompt: 'bake' });

      expect(res.status).toBe(400);
    });
  });
});
