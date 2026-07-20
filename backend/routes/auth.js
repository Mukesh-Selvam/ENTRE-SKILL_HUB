const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { signToken, requireAuth } = require('../middleware/auth');

const router = express.Router();

// Stricter limiter on auth endpoints to slow down credential-stuffing / brute force attempts.
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many attempts. Please try again later.' },
});

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ error: errors.array()[0].msg });
  }
  next();
};

router.post(
  '/register',
  authLimiter,
  [
    body('name').trim().isLength({ min: 2, max: 80 }).withMessage('Name must be 2-80 characters.'),
    body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password')
      .isLength({ min: 8 })
      .withMessage('Password must be at least 8 characters.')
      .matches(/\d/)
      .withMessage('Password must contain at least one number.'),
    body('role').optional().isIn(['user', 'mentor']).withMessage('Invalid role.'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { name, email, password } = req.body;
      const role = req.body.role === 'mentor' ? 'mentor' : 'user';
      const { bio, expertise, experience_years: experienceYears } = req.body;

      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      const passwordHash = bcrypt.hashSync(password, 10);
      // Mentor accounts start as 'pending' until an admin verifies them.
      const status = role === 'mentor' ? 'pending' : 'active';

      const user = await User.create({
        name,
        email,
        passwordHash,
        role,
        status,
        bio: bio || null,
        expertise: expertise || null,
        experienceYears: experienceYears || null,
      });

      const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
      const token = signToken(safeUser);
      res.status(201).json({ user: safeUser, token });
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  '/login',
  authLimiter,
  [
    body('email').trim().isEmail().withMessage('A valid email is required.').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required.'),
  ],
  handleValidation,
  async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ email }).select('+passwordHash');

      // Use a generic error for both "no such user" and "wrong password" to avoid
      // leaking which emails are registered.
      if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
        return res.status(401).json({ error: 'Invalid email or password.' });
      }
      if (user.status === 'suspended') {
        return res.status(403).json({ error: 'This account has been suspended. Contact support.' });
      }

      const safeUser = { id: user.id, name: user.name, email: user.email, role: user.role, status: user.status };
      const token = signToken(safeUser);
      res.json({ user: safeUser, token });
    } catch (err) {
      next(err);
    }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
