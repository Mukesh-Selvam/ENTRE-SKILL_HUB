const request = require('supertest');
const app = require('../server');
const User = require('../models/User');
const MentorSession = require('../models/MentorSession');
const bcrypt = require('bcryptjs');

describe('Mentor & Session Tracking Endpoints', () => {
  let userToken;
  let mentorToken;
  let mentor;
  let user;

  beforeEach(async () => {
    // Create a mentor
    mentor = await User.create({
      name: 'Meera Mentor',
      email: 'meera@entreskill.dev',
      passwordHash: bcrypt.hashSync('Mentor@123', 10),
      role: 'mentor',
      status: 'active',
      bio: 'Expert designer',
      expertise: 'Tailoring',
      experienceYears: 10
    });

    // Create a regular user
    user = await User.create({
      name: 'Rohan User',
      email: 'rohan@entreskill.dev',
      passwordHash: bcrypt.hashSync('User@1234', 10),
      role: 'user',
      status: 'active'
    });

    // Log in user
    const userLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'rohan@entreskill.dev', password: 'User@1234' });
    userToken = userLogin.body.token;

    // Log in mentor
    const mentorLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'meera@entreskill.dev', password: 'Mentor@123' });
    mentorToken = mentorLogin.body.token;
  });

  describe('GET /api/mentors', () => {
    it('should list all active mentors', async () => {
      const res = await request(app).get('/api/mentors');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('mentors');
      expect(res.body.mentors.length).toBe(1);
      expect(res.body.mentors[0].name).toBe('Meera Mentor');
    });
  });

  describe('POST /api/mentors/:id/sessions', () => {
    it('should successfully request a session with a mentor', async () => {
      const res = await request(app)
        .post(`/api/mentors/${mentor._id}/sessions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ topic: 'Pricing Strategy', message: 'Hello! I need help with costing products.' });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Session request sent.');

      const session = await MentorSession.findOne({ mentee: user._id });
      expect(session).toBeTruthy();
      expect(session.topic).toBe('Pricing Strategy');
      expect(session.status).toBe('requested');
    });

    it('should fail if message length is too short', async () => {
      const res = await request(app)
        .post(`/api/mentors/${mentor._id}/sessions`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({ topic: 'Pricing Strategy', message: 'Hi' });

      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/mentors/me/requests', () => {
    it('should return session requests list tracking for user', async () => {
      // Create session request directly
      await MentorSession.create({
        mentor: mentor._id,
        mentee: user._id,
        topic: 'Business model',
        message: 'Let us check business metrics.'
      });

      const res = await request(app)
        .get('/api/mentors/me/requests')
        .set('Authorization', `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('sessions');
      expect(res.body.sessions.length).toBe(1);
      expect(res.body.sessions[0].mentor_name).toBe('Meera Mentor');
      expect(res.body.sessions[0].topic).toBe('Business model');
    });
  });

  describe('PUT /api/mentors/me/sessions/:sessionId', () => {
    it('should allow mentor to accept and complete a session request', async () => {
      const session = await MentorSession.create({
        mentor: mentor._id,
        mentee: user._id,
        topic: 'Scale plan',
        message: 'How to hire team?'
      });

      // Accept
      let res = await request(app)
        .put(`/api/mentors/me/sessions/${session._id}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ status: 'accepted' });

      expect(res.status).toBe(200);
      let updated = await MentorSession.findById(session._id);
      expect(updated.status).toBe('accepted');

      // Complete
      res = await request(app)
        .put(`/api/mentors/me/sessions/${session._id}`)
        .set('Authorization', `Bearer ${mentorToken}`)
        .send({ status: 'completed' });

      expect(res.status).toBe(200);
      updated = await MentorSession.findById(session._id);
      expect(updated.status).toBe('completed');
    });
  });
});
