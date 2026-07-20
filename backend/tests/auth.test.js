const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const bcrypt = require('bcryptjs');

describe('Auth Endpoints', () => {
  const testUser = {
    name: 'Asha Test',
    email: 'asha.test@entreskill.dev',
    password: 'Password@1234',
    role: 'user'
  };

  describe('POST /api/auth/register', () => {
    it('should successfully register a new user with valid fields', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body).toHaveProperty('token');
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.email).toBe(testUser.email);
      expect(res.body.user.role).toBe('user');
      expect(res.body.user.status).toBe('active');
    });

    it('should reject registration if the email already exists', async () => {
      // Pre-create the user
      await User.create({
        name: testUser.name,
        email: testUser.email,
        passwordHash: bcrypt.hashSync(testUser.password, 10),
        role: testUser.role,
        status: 'active'
      });

      const res = await request(app)
        .post('/api/auth/register')
        .send(testUser);

      expect(res.status).toBe(409);
      expect(res.body).toHaveProperty('error');
    });

    it('should reject registration if the password is too weak', async () => {
      const weakUser = {
        ...testUser,
        email: 'weak@entreskill.dev',
        password: 'weak' // Less than 8 chars, no digit
      };

      const res = await request(app)
        .post('/api/auth/register')
        .send(weakUser);

      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      await User.create({
        name: testUser.name,
        email: testUser.email,
        passwordHash: bcrypt.hashSync(testUser.password, 10),
        role: testUser.role,
        status: 'active'
      });
    });

    it('should log in successfully with correct credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('token');
      expect(res.body.user.email).toBe(testUser.email);
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: 'WrongPassword'
        });

      expect(res.status).toBe(401);
      expect(res.body).toHaveProperty('error');
    });

    it('should block suspended accounts from logging in', async () => {
      await User.findOneAndUpdate(
        { email: testUser.email },
        { status: 'suspended' }
      );

      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('suspended');
    });
  });

  describe('GET /api/auth/me', () => {
    let token;
    let userId;

    beforeEach(async () => {
      const user = await User.create({
        name: testUser.name,
        email: testUser.email,
        passwordHash: bcrypt.hashSync(testUser.password, 10),
        role: testUser.role,
        status: 'active'
      });
      userId = user.id;

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: testUser.email,
          password: testUser.password
        });
      token = loginRes.body.token;
    });

    it('should return user info when called with a valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${token}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('user');
      expect(res.body.user.id).toBe(userId);
    });

    it('should return 401 when Authorization header is missing', async () => {
      const res = await request(app)
        .get('/api/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Missing or malformed Authorization header');
    });

    it('should return 401 when token is invalid', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid_token');

      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Invalid or expired token');
    });
  });
});
