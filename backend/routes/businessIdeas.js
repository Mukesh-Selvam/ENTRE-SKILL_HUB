const express = require('express');
const mongoose = require('mongoose');
const BusinessIdea = require('../models/BusinessIdea');
const Roadmap = require('../models/Roadmap');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', async (req, res, next) => {
  try {
    const ideas = await BusinessIdea.find({ status: 'published' }).sort({ createdAt: -1 }).populate('skills');
    res.json({ ideas });
  } catch (err) {
    next(err);
  }
});

// IMPORTANT: this must be registered before '/:id' so 'recommendations' isn't
// swallowed by the dynamic id route.
router.get('/recommendations/for-me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('skills.skill')
      .populate('interests');

    const userSkillMap = new Map();
    if (user && user.skills) {
      user.skills.forEach((s) => {
        if (s.skill) {
          const idStr = s.skill._id ? s.skill._id.toString() : s.skill.toString();
          userSkillMap.set(idStr, s.proficiency || 'beginner');
        }
      });
    }

    const userInterestIds = new Set(
      (user?.interests || []).map((interest) =>
        interest._id ? interest._id.toString() : interest.toString()
      )
    );

    const ideas = await BusinessIdea.find({ status: 'published' })
      .populate('skills')
      .populate('interests');

    const scored = ideas.map((idea) => {
      // 1. Calculate Skill Match (80% weight)
      let skillScore = 0;
      let matchedSkillNames = [];
      let highestProficiencySkill = null;
      let highestProficiencyVal = 0;

      const proficiencyValues = { beginner: 0.5, intermediate: 0.75, expert: 1.0 };

      const totalRequiredSkills = idea.skills.length;
      if (totalRequiredSkills > 0) {
        let totalUserWeightedScore = 0;
        idea.skills.forEach((skill) => {
          const skillIdStr = skill.id || skill._id.toString();
          if (userSkillMap.has(skillIdStr)) {
            const prof = userSkillMap.get(skillIdStr);
            const weight = proficiencyValues[prof] || 0.5;
            totalUserWeightedScore += weight;

            matchedSkillNames.push(skill.name);

            if (weight > highestProficiencyVal) {
              highestProficiencyVal = weight;
              highestProficiencySkill = { name: skill.name, level: prof };
            }
          }
        });
        skillScore = totalUserWeightedScore / totalRequiredSkills;
      }

      // 2. Calculate Interest Match (20% weight)
      let interestScore = 0;
      let matchedInterestNames = [];
      const ideaInterests = idea.interests || [];
      const totalIdeaInterests = ideaInterests.length;

      ideaInterests.forEach((interest) => {
        const interestIdStr = interest.id || interest._id.toString();
        if (userInterestIds.has(interestIdStr)) {
          interestScore += 1;
          matchedInterestNames.push(interest.name);
        }
      });

      if (totalIdeaInterests > 0) {
        interestScore = interestScore / totalIdeaInterests;
      } else {
        interestScore = 0;
      }

      // Calculate final match score
      const matchScore = Math.round((skillScore * 0.8 + interestScore * 0.2) * 100);

      // 3. Generate human-readable match reason
      let matchReason = '';
      const matchedSkillsCount = matchedSkillNames.length;

      if (totalRequiredSkills > 0) {
        if (matchedSkillsCount > 0 && highestProficiencySkill) {
          matchReason += `Matches ${matchedSkillsCount} of ${totalRequiredSkills} required skills, including ${highestProficiencySkill.level}-level ${highestProficiencySkill.name}.`;
        } else {
          matchReason += `Matches 0 of ${totalRequiredSkills} required skills.`;
        }
      } else {
        matchReason += `Requires no specific skills.`;
      }

      if (matchedInterestNames.length > 0) {
        matchReason += ` Aligns with your interest in ${matchedInterestNames[0]}.`;
      }

      return {
        ...idea.toJSON(),
        match_score: matchScore,
        match_reason: matchReason
      };
    });

    scored.sort((a, b) => b.match_score - a.match_score);
    res.json({ recommendations: scored });
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Business idea not found.' });
    const idea = await BusinessIdea.findById(req.params.id).populate('skills');
    if (!idea) return res.status(404).json({ error: 'Business idea not found.' });

    const roadmap = await Roadmap.findOne({ idea: idea.id });
    res.json({ idea, roadmap: roadmap || null });
  } catch (err) {
    next(err);
  }
});

// Smart Startup Advisor (template-based guidance)
router.post('/:id/ai-coach', requireAuth, async (req, res, next) => {
  try {
    const { message } = req.body;
    if (!message || message.trim().length < 2) {
      return res.status(400).json({ error: 'Please enter a valid question.' });
    }
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ error: 'Business idea not found.' });

    const idea = await BusinessIdea.findById(req.params.id);
    if (!idea) return res.status(404).json({ error: 'Business idea not found.' });

    const text = message.toLowerCase();
    let reply = '';

    if (text.includes('name') || text.includes('slogan') || text.includes('brand')) {
      reply = `Here are 3 premium brand name concepts for a "${idea.title}" venture:
1. **Zenith ${idea.category || 'Venture'}** — Modern and professional.
2. **NovaCraft ${idea.title.split(' ')[0]}** — Dynamic, showing handcrafted skill.
3. **The Local ${idea.title.split(' ')[0]} Co.** — Hyperlocal and trustworthy.
Which one matches your style?`;
    } else if (text.includes('market') || text.includes('customer') || text.includes('sell') || text.includes('promote')) {
      reply = `To launch a "${idea.title}" successfully in your local community:
1. **WhatsApp Broadcast Catalog:** Compile high-quality images of your initial work and share with friends/family.
2. **Local Partners:** Pair up with a complementary business (e.g. coffee shop or grocery store) to place pamphlets.
3. **Launch Incentive:** Offer a "First 10 Clients" discount (20% off) to secure reviews and word-of-mouth.`;
    } else if (text.includes('cost') || text.includes('budget') || text.includes('price') || text.includes('expensive') || text.includes('money')) {
      reply = `To optimize startup capital for a "${idea.title}" business:
1. **Start from Home:** Saves immediate commercial rent deposit (saving ₹15,000+ per month).
2. **Tool Rental/Secondhand:** Source sewing machines, repair kits, or ovens secondhand instead of brand new.
3. **Take Advances:** Always request a 40-50% upfront deposit on custom orders to fund raw materials.`;
    } else {
      reply = `That's a great question regarding "${idea.title}". I suggest focusing on Stage 1 of your roadmap (Idea Validation). Talk directly to 10 potential customers this week. Let me know if you need help drafting a customer questionnaire!`;
    }

    res.json({ response: reply });
  } catch (err) {
    next(err);
  }
});

// AI Business Idea & Roadmap Generator
router.post('/generate', requireAuth, async (req, res, next) => {
  try {
    const { prompt } = req.body;
    if (!prompt || prompt.trim().length < 5) {
      return res.status(400).json({ error: 'Please describe your skills and interests in more detail.' });
    }

    const text = prompt.toLowerCase();
    let title = 'Custom Service Business';
    let summary = 'A personalized service business built around your unique practical skills.';
    let category = 'Services';
    let skillsList = ['Tutoring & Teaching'];

    if (text.includes('bake') || text.includes('bread') || text.includes('cake') || text.includes('pastry')) {
      title = 'Artisan Micro-Bakery';
      summary = 'Bake and deliver customized fresh bread, celebration cakes, and healthy snacks directly to subscription customers.';
      category = 'Food';
      skillsList = ['Baking'];
    } else if (text.includes('garden') || text.includes('plant') || text.includes('farm') || text.includes('flower') || text.includes('green')) {
      title = 'Urban Micro-Farm & Nursery';
      summary = 'Cultivate rare potted plants, organic greens, and fresh kitchen herbs to supply directly to green households.';
      category = 'Agriculture';
      skillsList = ['Farming & Agriculture'];
    } else if (text.includes('sew') || text.includes('tailor') || text.includes('stitch') || text.includes('dress')) {
      title = 'Custom Apparel Alterations Lab';
      summary = 'A tech-enabled alteration studio focusing on fit customization and wardrobe upcycling.';
      category = 'Craft';
      skillsList = ['Tailoring & Stitching'];
    } else if (text.includes('design') || text.includes('logo') || text.includes('web') || text.includes('social')) {
      title = 'Brand Identity Studio';
      summary = 'Provide bespoke logo assets, social media branding packages, and templates to local businesses.';
      category = 'Digital';
      skillsList = ['Graphic Design'];
    }

    const Skill = require('../models/Skill');
    const matchedSkills = await Skill.find({ name: { $in: skillsList } });
    const skillIds = matchedSkills.map(s => s._id);

    const newIdea = await BusinessIdea.create({
      title,
      summary,
      category,
      lowInvestment: true,
      status: 'draft',
      createdBy: req.user.id,
      skills: skillIds,
      interests: [],
    });

    await Roadmap.create({
      idea: newIdea.id,
      title: `${title} — Roadmap`,
      steps: [
        {
          stepOrder: 1,
          stage: 'idea_validation',
          title: `Validate demand for ${title}`,
          content: `Present your concept to 10 target buyers and document pricing expectations.`,
          estCostMin: 0,
          estCostMax: 500,
        },
        {
          stepOrder: 2,
          stage: 'skills_tools',
          title: `Procure production tools`,
          content: `List the minimum tools needed to start production (under ₹10k).`,
          estCostMin: 2000,
          estCostMax: 8000,
        },
        {
          stepOrder: 3,
          stage: 'legal_registration',
          title: `Obtain MSME registration`,
          content: `Register for Udyam / local authority permissions if relevant.`,
          estCostMin: 0,
          estCostMax: 1000,
        },
        {
          stepOrder: 4,
          stage: 'cost_estimation',
          title: `Set up unit pricing model`,
          content: `Calculate costs of goods and target markup percentage.`,
          estCostMin: 500,
          estCostMax: 2000,
        },
        {
          stepOrder: 5,
          stage: 'marketing_basics',
          title: `Launch WhatsApp Business catalog`,
          content: `Create digital brochure images and push to local user groups.`,
          estCostMin: 0,
          estCostMax: 1000,
        },
      ],
    });

    res.status(201).json({ id: newIdea.id, status: 'draft', message: 'Your startup plan was created and is pending admin review.' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
