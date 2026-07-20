const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Role Enforcement Endpoints', () => {
  let userToken;

  beforeEach(async () => {
    // Create a regular user
    await User.create({
      name: 'Regular User',
      email: 'user@entreskill.dev',
      passwordHash: bcrypt.hashSync('User@1234', 10),
      role: 'user',
      status: 'active'
    });

    // Log in as regular user
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'user@entreskill.dev', password: 'User@1234' });
    userToken = loginRes.body.token;
  });

  describe('Admin-only route protection', () => {
    it('should return 403 Forbidden for user role accessing GET /api/admin/users', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('permission');
    });

    it('should return 403 Forbidden for user role accessing POST /api/admin/business-ideas', async () => {
      const res = await request(app)
        .post('/api/admin/business-ideas')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ title: 'New Franchise Idea' });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('permission');
    });
  });

  describe('Mentor-only route protection', () => {
    it('should return 403 Forbidden for user role accessing GET /api/mentors/me/sessions', async () => {
      const res = await request(app)
        .get('/api/mentors/me/sessions')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('permission');
    });
  });
});
