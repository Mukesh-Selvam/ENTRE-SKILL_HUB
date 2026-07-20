const express = require('express');
const { body, validationResult } = require('express-validator');
const Feedback = require('../models/Feedback');
const { optionalAuth } = require('../middleware/auth');

const router = express.Router();

router.post(
  '/',
  optionalAuth,
  [body('message').trim().isLength({ min: 5, max: 2000 }).withMessage('Message must be 5-2000 characters.')],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ error: errors.array()[0].msg });

      await Feedback.create({
        user: req.user ? req.user.id : null,
        subject: req.body.subject || null,
        message: req.body.message,
      });
      res.status(201).json({ message: "Thanks — your feedback has been submitted." });
    } catch (err) {
      next(err);
    }
  }
);

module.exports = router;
