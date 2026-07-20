// Idempotent seed script for local development / demos.
// Run with: npm run seed  (from the backend/ directory, with MONGO_URI set)
require('dotenv').config({ quiet: true });
const bcrypt = require('bcryptjs');
const connectDB = require('../db/connect');
const User = require('../models/User');
const Skill = require('../models/Skill');
const Interest = require('../models/Interest');
const BusinessIdea = require('../models/BusinessIdea');
const Roadmap = require('../models/Roadmap');
const LearningResource = require('../models/LearningResource');

const SKILLS = [
  // Craft
  ['Tailoring & Stitching', 'Craft'],
  ['Handicrafts', 'Craft'],
  ['Baking', 'Food'],
  // Food
  ['Food Preparation', 'Food'],
  ['Food Processing & Preservation', 'Food'],
  // Repair & Trade
  ['Mobile & Appliance Repair', 'Repair'],
  ['Carpentry', 'Trade'],
  ['Plumbing & Electrical', 'Trade'],
  // Digital
  ['Graphic Design', 'Digital'],
  ['Social Media Management', 'Digital'],
  ['Photography & Videography', 'Digital'],
  // Services
  ['Tutoring & Teaching', 'Services'],
  ['Beauty & Grooming', 'Services'],
  ['Event Planning', 'Services'],
  // Agriculture
  ['Farming & Agriculture', 'Agriculture'],
];

const INTERESTS = [
  'Working from home',
  'Selling online',
  'Serving local customers',
  'Teaching others',
  'Working with my hands',
  'Growing a team',
  'Working outdoors',
];

const IDEAS = [
  // ─── Original 5 ────────────────────────────────────────────────────────────
  {
    title: 'Custom Tailoring & Alterations Studio',
    summary: 'A home or small-shop tailoring service offering stitching, alterations, and made-to-order garments for local customers.',
    category: 'Craft',
    skills: ['Tailoring & Stitching'],
    interests: ['Working from home', 'Serving local customers', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Validate local demand', 'Survey 20 households or shopkeepers nearby about alteration and stitching needs, and check for existing competitors within 2 km.', null, null],
      ['skills_tools', 'Assess required tools', 'List core tools: sewing machine, measuring tape, iron, cutting table. Estimate what you already own vs. need to buy or rent.', 8000, 20000],
      ['legal_registration', 'Register the business', 'Register as a sole proprietorship (Udyam/MSME registration) and open a current bank account in the business name.', 0, 2000],
      ['cost_estimation', 'Estimate startup costs', 'Budget for machine, materials, signage, and first-month rent/utilities if operating outside the home.', 15000, 40000],
      ['marketing_basics', 'Reach first customers', 'Create a WhatsApp Business catalog, list on Google Business Profile, and offer a launch discount to the first 10 customers.', 0, 1000],
    ],
  },
  {
    title: 'Home-Based Tiffin & Catering Service',
    summary: 'Prepare and deliver daily meals or event catering using home cooking skills, targeting working professionals and students.',
    category: 'Food',
    skills: ['Food Preparation'],
    interests: ['Working from home', 'Serving local customers', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Test recipes and demand', 'Cook a sample menu for 5–10 potential customers and gather feedback on taste, price, and portion size.', null, null],
      ['skills_tools', 'Kitchen readiness check', 'Ensure the kitchen has adequate cooking capacity, storage, and hygiene setup for daily order volumes.', 5000, 15000],
      ['legal_registration', 'Get FSSAI registration', 'Apply for a basic FSSAI food license and a local trade license if needed.', 100, 3000],
      ['cost_estimation', 'Estimate ingredient & delivery costs', 'Calculate per-meal cost including ingredients, packaging, and delivery, then set a sustainable price point.', 3000, 10000],
      ['marketing_basics', 'Build a subscriber base', 'Start with a WhatsApp broadcast list, offer weekly subscription plans, and ask happy customers for referrals.', 0, 500],
    ],
  },
  {
    title: 'Handicraft & Décor E-commerce Shop',
    summary: 'Sell handmade décor, jewelry, or gift items through online marketplaces and social media.',
    category: 'Craft',
    skills: ['Handicrafts', 'Social Media Management'],
    interests: ['Working from home', 'Selling online', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Pick a niche and test products', 'Make 5–10 sample products and get informal feedback from friends, family, or a local craft fair.', null, null],
      ['skills_tools', 'Set up production basics', 'Identify raw-material suppliers and basic tools needed for consistent, repeatable production.', 3000, 12000],
      ['legal_registration', 'Register for online selling', 'Get Udyam/MSME registration and GST registration if selling through marketplaces that require it.', 0, 2000],
      ['cost_estimation', 'Price for materials, time, and platform fees', 'Include material cost, your time, packaging, and marketplace commission (typically 5–20%) in your price.', 2000, 8000],
      ['marketing_basics', 'List and promote online', 'Create profiles on Instagram and a marketplace (Etsy/Meesho/Amazon Karigar) and post product photos consistently.', 0, 2000],
    ],
  },
  {
    title: 'Mobile & Appliance Repair Service',
    summary: 'Offer doorstep or shop-based repair for phones, small appliances, and electronics.',
    category: 'Repair',
    skills: ['Mobile & Appliance Repair'],
    interests: ['Serving local customers', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Confirm local repair demand', 'Talk to 15–20 local residents or shopkeepers about what devices they struggle to get repaired nearby.', null, null],
      ['skills_tools', 'Build a toolkit', 'Assemble a basic repair toolkit: screwdriver sets, multimeter, soldering iron, spare common parts.', 4000, 15000],
      ['legal_registration', 'Register the business', 'Register as a sole proprietorship (Udyam/MSME) and consider a simple service-warranty policy.', 0, 2000],
      ['cost_estimation', 'Estimate parts inventory cost', 'Budget for an initial stock of common spare parts and tools.', 8000, 25000],
      ['marketing_basics', 'Get discovered locally', 'List on Google Maps, distribute flyers to nearby shops, and offer a free diagnostic for first-time customers.', 0, 1500],
    ],
  },
  {
    title: 'Freelance Graphic Design & Social Media Service',
    summary: 'Provide logo design, social posts, and basic branding for small local businesses.',
    category: 'Digital',
    skills: ['Graphic Design', 'Social Media Management'],
    interests: ['Working from home', 'Selling online'],
    roadmap: [
      ['idea_validation', 'Build a mini portfolio', 'Create 3–5 sample designs (even for fictional local businesses) to show prospective clients.', null, null],
      ['skills_tools', 'Set up your toolkit', 'Install free/low-cost design tools (Canva, GIMP) and ensure a reliable device and internet connection.', 0, 5000],
      ['legal_registration', 'Formalize as a freelancer', 'Optional Udyam registration once revenue grows; track income for tax purposes from day one.', 0, 1000],
      ['cost_estimation', 'Price your packages', 'Offer tiered packages (logo only, logo + 10 posts) rather than hourly billing when starting out.', 0, 3000],
      ['marketing_basics', 'Find first clients', 'Reach out directly to 20 local shop owners, post before/after work on Instagram, and ask for referrals.', 0, 500],
    ],
  },

  // ─── Education / Tutoring ───────────────────────────────────────────────────
  {
    title: 'Home Tuition & Academic Coaching',
    summary: 'Provide personalised one-on-one or small-group tuition for school or college students from home or at their premises.',
    category: 'Education',
    skills: ['Tutoring & Teaching'],
    interests: ['Working from home', 'Teaching others', 'Serving local customers'],
    roadmap: [
      ['idea_validation', 'Define your subject niche', 'Identify the subject(s) and grade levels you can teach confidently; survey parents in your locality about tutoring demand.', null, null],
      ['skills_tools', 'Prepare teaching materials', 'Collect textbooks, create a simple syllabus, and set up a whiteboard or digital teaching tools (tablet, Zoom/Google Meet).', 2000, 8000],
      ['legal_registration', 'Register as a service provider', 'Udyam/MSME registration is optional but adds credibility; keep income records from the first month.', 0, 1000],
      ['cost_estimation', 'Set your fee structure', 'Research local tutoring rates; price per hour or per month. Consider group discounts to fill more slots quickly.', 0, 2000],
      ['marketing_basics', 'Find your first students', 'Post flyers at schools and housing societies, ask for referrals from existing students, and list on platforms like UrbanPro or Superprof.', 0, 1000],
    ],
  },
  {
    title: 'Online Skill-Based Course Creator',
    summary: 'Record and sell short video courses on a practical skill (cooking, stitching, coding basics, art) via YouTube, Udemy, or your own website.',
    category: 'Education',
    skills: ['Tutoring & Teaching', 'Social Media Management'],
    interests: ['Working from home', 'Selling online', 'Teaching others'],
    roadmap: [
      ['idea_validation', 'Validate your course topic', 'Check search volumes on YouTube and Udemy for your topic; run a free live session on Instagram to gauge interest.', null, null],
      ['skills_tools', 'Set up a recording setup', 'You need a decent smartphone or camera, a ring light, a lapel mic, and free editing software (DaVinci Resolve / CapCut).', 3000, 15000],
      ['legal_registration', 'Create a seller account', 'Register on Udemy or Teachable; read their payment/GST requirements for Indian instructors.', 0, 500],
      ['cost_estimation', 'Price and structure the course', 'A 2–4 hour course priced ₹499–₹1499 is a strong starting point on Indian platforms; offer a free preview module.', 0, 2000],
      ['marketing_basics', 'Launch and promote', 'Build anticipation on Instagram Reels/YouTube Shorts, collect emails via a free mini-lesson, and ask early students for reviews.', 0, 3000],
    ],
  },

  // ─── Beauty & Grooming ──────────────────────────────────────────────────────
  {
    title: 'Home Beauty Parlour & Bridal Makeup',
    summary: 'Offer haircuts, threading, facials, and bridal makeup from a dedicated home salon space, catering to women in the neighbourhood.',
    category: 'Beauty',
    skills: ['Beauty & Grooming'],
    interests: ['Working from home', 'Serving local customers', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Assess local demand and competition', 'Count existing salons within 1 km and survey 20 women neighbours on willingness to pay for home-based services.', null, null],
      ['skills_tools', 'Equip your salon space', 'Buy a salon chair, trolley, basic equipment (steamer, wax heater), and professional-grade cosmetics.', 12000, 35000],
      ['legal_registration', 'Register and insure', 'Get a trade license from your municipality; Udyam/MSME registration and a basic professional-liability policy are advisable.', 500, 3000],
      ['cost_estimation', 'Calculate service costs and margins', 'List each service, its material cost, time, and a competitive price. Track monthly consumable spend.', 5000, 20000],
      ['marketing_basics', 'Get your first 20 clients', 'Create an Instagram business page with before/after photos, run a launch offer (20% off for the first month), and distribute cards in your building.', 0, 2000],
    ],
  },
  {
    title: 'Mobile Grooming & Spa-at-Home Service',
    summary: 'Visit clients at their homes or offices to deliver haircuts, massages, facials, and other grooming treatments on demand.',
    category: 'Beauty',
    skills: ['Beauty & Grooming'],
    interests: ['Serving local customers', 'Working with my hands', 'Growing a team'],
    roadmap: [
      ['idea_validation', 'Test the mobile-service concept', 'Offer free trial visits to 5 families in exchange for honest feedback on convenience, quality, and willingness to pay.', null, null],
      ['skills_tools', 'Build a portable kit', 'Invest in a professional travel case with all essentials: mini steamer, foldable chair, toiletries, and hygiene supplies.', 8000, 20000],
      ['legal_registration', 'Get a trade license & GST if needed', 'Obtain a local trade license; if annual revenue exceeds ₹20 lakh, GST registration is mandatory.', 500, 2500],
      ['cost_estimation', 'Set travel and service fees', 'Charge a flat travel fee (₹50–₹100) plus service price; calculate break-even bookings per day needed.', 2000, 5000],
      ['marketing_basics', 'Build an on-demand booking flow', 'Use WhatsApp Business for bookings; list on Urban Company / similar local apps; grow through referrals with a ₹100 credit-per-referral scheme.', 0, 1500],
    ],
  },

  // ─── Carpentry / Trade ──────────────────────────────────────────────────────
  {
    title: 'Custom Furniture & Woodwork Studio',
    summary: 'Design and build made-to-order wooden furniture — shelves, beds, dining tables — for homes and small offices.',
    category: 'Trade',
    skills: ['Carpentry'],
    interests: ['Serving local customers', 'Working with my hands', 'Growing a team'],
    roadmap: [
      ['idea_validation', 'Research demand and competition', 'Visit 10 furniture shops locally; ask interior designers and contractors about outsourcing custom work.', null, null],
      ['skills_tools', 'Equip a small workshop', 'Essential tools: circular saw, electric drill, sander, hand tools, measuring instruments, and workbench.', 20000, 60000],
      ['legal_registration', 'Register and comply', 'Udyam/MSME registration; if hiring workers, register under the Shops & Establishments Act.', 0, 3000],
      ['cost_estimation', 'Price furniture jobs', 'Estimate material (wood, hardware) + labour time + 20–30% margin. Always take a 40–50% advance on custom orders.', 10000, 40000],
      ['marketing_basics', 'Showcase and sell', 'Photograph completed pieces; list on Instagram, OLX, and IndiaMart; network with local interior designers for referrals.', 0, 3000],
    ],
  },
  {
    title: 'Plumbing, Tiling & Home Repairs Service',
    summary: 'Offer skilled plumbing, tiling, painting, or general repair services to homeowners and housing societies on call.',
    category: 'Trade',
    skills: ['Plumbing & Electrical'],
    interests: ['Serving local customers', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Identify your core trade', 'Pick 1–2 specialisations (e.g., plumbing + tiling) where you have the strongest skills and local demand is unmet.', null, null],
      ['skills_tools', 'Assemble your toolkit', 'Core plumbing tools: pipe cutters, wrenches, sealant gun; tiling tools: tile cutter, trowels, levels. Invest in quality.', 6000, 20000],
      ['legal_registration', 'Register and get insured', 'Udyam/MSME registration; consider a contractor-liability insurance policy; keep GST records if billing businesses.', 0, 3000],
      ['cost_estimation', 'Establish a rate card', 'Define clear per-job rates (e.g., toilet repair ₹500, pipe fitting ₹300) and a separate materials-markup policy.', 0, 2000],
      ['marketing_basics', 'Get found locally', 'List on JustDial, UrbanClap, and Google Maps; ask satisfied customers for Google Reviews; print visiting cards.', 0, 1000],
    ],
  },

  // ─── Event Services ─────────────────────────────────────────────────────────
  {
    title: 'Event Photography & Videography',
    summary: 'Capture weddings, birthdays, corporate events, and product launches with professional photography and video editing.',
    category: 'Events',
    skills: ['Photography & Videography', 'Social Media Management'],
    interests: ['Serving local customers', 'Selling online', 'Growing a team'],
    roadmap: [
      ['idea_validation', 'Audit your portfolio', 'Curate 10–15 of your best shots; ask 5 recent clients or friends for honest feedback on quality and turnaround time.', null, null],
      ['skills_tools', 'Upgrade essential gear', 'Priority: a reliable DSLR or mirrorless camera, 24–70 mm lens, a fast 50 mm lens, two batteries, and editing software (Lightroom + Premiere Pro).', 30000, 100000],
      ['legal_registration', 'Formalise and draft contracts', 'Udyam/MSME registration; use simple contracts that specify deliverables, timelines, and usage rights.', 0, 2000],
      ['cost_estimation', 'Set your package pricing', 'Offer tiered packages: event-only (₹5k), event + 100 edited photos (₹10k), event + full video (₹20k+). Include travel costs.', 0, 5000],
      ['marketing_basics', 'Build a visual brand', 'Create an Instagram and YouTube portfolio; collaborate with event venues and wedding planners; list on WedMeGood or similar.', 0, 3000],
    ],
  },
  {
    title: 'Wedding & Event Planning Service',
    summary: 'Plan and co-ordinate weddings, corporate events, and celebrations — from venue scouting and vendor management to day-of logistics.',
    category: 'Events',
    skills: ['Event Planning', 'Social Media Management'],
    interests: ['Serving local customers', 'Growing a team'],
    roadmap: [
      ['idea_validation', 'Shadow or assist at events', 'Offer to help an established planner at 2–3 events for free to understand workflows and build a portfolio entry.', null, null],
      ['skills_tools', 'Build a vendor network', 'Create a shortlist of reliable caterers, decorators, photographers, and AV suppliers in your city with verified pricing.', 0, 5000],
      ['legal_registration', 'Register and draft service agreements', 'Udyam/MSME registration; have a lawyer review your event-planning contract template to limit liability.', 0, 5000],
      ['cost_estimation', 'Price your planning packages', 'Charge 10–15% of total event budget as your fee, plus a planning retainer. Small events (₹10k flat), large weddings (₹30k+).', 0, 3000],
      ['marketing_basics', 'Show transformations', 'Document every event with photos/videos; build a portfolio on Instagram; ask clients for testimonials; list on Sulekha and WedMeGood.', 0, 2000],
    ],
  },

  // ─── Agriculture / Food Processing ─────────────────────────────────────────
  {
    title: 'Organic Kitchen Garden & Vegetable Supply',
    summary: 'Grow organic vegetables on a small plot or terrace garden and supply fresh produce to households, restaurants, or local markets.',
    category: 'Agriculture',
    skills: ['Farming & Agriculture'],
    interests: ['Working outdoors', 'Serving local customers', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Assess land and water resources', 'Measure your available growing area; test soil quality; identify 3–5 high-demand, fast-growing vegetables suited to your climate.', null, null],
      ['skills_tools', 'Set up the growing system', 'Buy seeds, compost, basic tools (trowel, hoe, watering can), and netting if needed. Consider drip irrigation for water efficiency.', 3000, 15000],
      ['legal_registration', 'Register as a farmer/producer', 'PM-KISAN registration (if eligible), Udyam/MSME for value-added sales; look into FPO (Farmer Producer Organisation) membership for collective bargaining.', 0, 2000],
      ['cost_estimation', 'Calculate cost per kg', 'Track seed, fertiliser, water, and labour costs per crop cycle. Compare your cost-per-kg to local mandi prices to set a sustainable margin.', 2000, 8000],
      ['marketing_basics', 'Build a direct buyer base', 'Offer a weekly veggie box subscription to 10 households; approach local organic cafés and restaurants; list on apps like FreshToHome or BigBasket local.', 0, 1000],
    ],
  },
  {
    title: 'Artisan Pickles, Jams & Preserved Foods',
    summary: 'Produce and sell traditional home-made pickles, jams, murabbas, and ready-to-cook spice mixes using local recipes and natural ingredients.',
    category: 'Agriculture',
    skills: ['Food Preparation', 'Food Processing & Preservation'],
    interests: ['Working from home', 'Selling online', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Test with a micro-batch', 'Make 20–30 jars of your best recipe; sell to friends, neighbours, or at a local farmers market and gather feedback on taste, labelling, and price.', null, null],
      ['skills_tools', 'Set up a safe production area', 'Ensure a clean, pest-free kitchen space; buy food-grade glass jars, vacuum sealer, labelling machine, and accurate weighing scale.', 5000, 18000],
      ['legal_registration', 'Get FSSAI & GST registration', 'Basic FSSAI license is mandatory; GST registration needed once turnover crosses ₹20 lakh or for inter-state sales.', 500, 3000],
      ['cost_estimation', 'Price per unit correctly', 'Include ingredients, packaging, labelling, FSSAI compliance, and a 40% gross margin minimum. Example: a 200g pickle jar costs ₹30 to make; sell at ₹90–₹120.', 3000, 10000],
      ['marketing_basics', 'Go online and hyperlocal', 'Open an Etsy or a Meesho shop; market on Instagram with recipe videos; approach gift shops and gourmet stores for consignment; offer gifting hampers.', 0, 3000],
    ],
  },

  // ─── Baking ─────────────────────────────────────────────────────────────────
  {
    title: 'Home Bakery & Custom Cake Studio',
    summary: 'Bake and sell custom cakes, cupcakes, cookies, and baked goods for birthdays, weddings, and corporate orders from a home kitchen.',
    category: 'Food',
    skills: ['Baking'],
    interests: ['Working from home', 'Selling online', 'Working with my hands'],
    roadmap: [
      ['idea_validation', 'Take test orders from family & friends', 'Bake 3–5 custom cakes for free or at cost for acquaintances; photograph everything and gather honest feedback on taste and decoration.', null, null],
      ['skills_tools', 'Equip your baking station', 'Essential: stand mixer, oven with accurate temperature control, baking tins in various sizes, fondant tools, food-colour set, and packaging materials.', 10000, 30000],
      ['legal_registration', 'Get FSSAI basic license', 'Apply for a basic FSSAI license; register under Udyam/MSME; use food-safe packaging and add required allergen labelling.', 100, 2000],
      ['cost_estimation', 'Price cakes profitably', 'Calculate per-cake ingredient cost, energy (oven), packaging, and your time. A 1-kg custom cake typically costs ₹300–₹500 to make; sell at ₹900–₹1500.', 5000, 15000],
      ['marketing_basics', 'Build a visual portfolio online', 'Post high-quality photos on Instagram, create a Google Business Profile, take orders via WhatsApp, and collaborate with event planners and corporates.', 0, 2000],
    ],
  },
];

// ─── Mentor profiles ────────────────────────────────────────────────────────
const MENTORS = [
  {
    email: 'meera.mentor@entreskill.dev',
    name: 'Meera Krishnan',
    password: 'Mentor@123',
    bio: 'Runs a tailoring co-op for 12 years, mentors first-time women entrepreneurs.',
    expertise: 'Tailoring & Stitching, Retail',
    experienceYears: 12,
  },
  {
    email: 'rajan.mentor@entreskill.dev',
    name: 'Rajan Kumar',
    password: 'Mentor@123',
    bio: 'Digital marketing consultant with a decade of experience helping small businesses build their online presence through design and social media.',
    expertise: 'Graphic Design, Social Media Marketing',
    experienceYears: 10,
  },
  {
    email: 'priya.mentor@entreskill.dev',
    name: 'Priya Sharma',
    password: 'Mentor@123',
    bio: 'Started a home tiffin service with 50 subscribers and scaled it to a 300-member catering operation in 3 years. Now mentors food entrepreneurs.',
    expertise: 'Food & Catering Business, FSSAI Compliance',
    experienceYears: 8,
  },
  {
    email: 'amit.mentor@entreskill.dev',
    name: 'Amit Singh',
    password: 'Mentor@123',
    bio: 'Runs a chain of 4 electronics repair shops across Mumbai. Experts in sourcing spare parts, pricing repair jobs, and hiring technicians.',
    expertise: 'Mobile & Appliance Repair, Operations',
    experienceYears: 14,
  },
  {
    email: 'sunita.mentor@entreskill.dev',
    name: 'Sunita Devi',
    password: 'Mentor@123',
    bio: 'Opened a home parlour with ₹8,000 and grew it into a 3-chair salon with a bridal-makeup team. Passionate about women-led beauty businesses.',
    expertise: 'Beauty & Grooming, Salon Management',
    experienceYears: 9,
  },
  {
    email: 'karthik.mentor@entreskill.dev',
    name: 'Karthik Nair',
    password: 'Mentor@123',
    bio: 'Master carpenter and furniture designer who supplies custom pieces to interior designers across Kerala and Tamil Nadu. Specialises in scaling artisan trades.',
    expertise: 'Carpentry, Woodwork, Trade Business',
    experienceYears: 16,
  },
];

async function seed() {
  await connectDB();

  // --- Skills ---
  const skillDocs = {};
  for (const [name, category] of SKILLS) {
    const doc = await Skill.findOneAndUpdate({ name }, { name, category }, { upsert: true, new: true });
    skillDocs[name] = doc;
  }

  // --- Interests ---
  const interestDocs = {};
  for (const name of INTERESTS) {
    const doc = await Interest.findOneAndUpdate({ name }, { name }, { upsert: true, new: true });
    interestDocs[name] = doc;
  }

  // --- Admin user ---
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const admin = await User.findOneAndUpdate(
    { email: 'admin@entreskill.dev' },
    {
      $setOnInsert: {
        name: 'Admin User',
        email: 'admin@entreskill.dev',
        passwordHash: hash('Admin@123'),
        role: 'admin',
        status: 'active',
      },
    },
    { upsert: true, new: true, select: '+passwordHash' }
  );

  // --- Mentor users (upsert, never overwrite existing) ---
  for (const m of MENTORS) {
    await User.findOneAndUpdate(
      { email: m.email },
      {
        $setOnInsert: {
          name: m.name,
          email: m.email,
          passwordHash: hash(m.password),
          role: 'mentor',
          status: 'active',
          bio: m.bio,
          expertise: m.expertise,
          experienceYears: m.experienceYears,
        },
      },
      { upsert: true, new: true }
    );
  }

  // --- Demo regular user (with pre-loaded profile) ---
  await User.findOneAndUpdate(
    { email: 'asha@entreskill.dev' },
    {
      $setOnInsert: {
        name: 'Asha Patel',
        email: 'asha@entreskill.dev',
        passwordHash: hash('User@1234'),
        role: 'user',
        status: 'active',
      },
      $set: {
        skills: [
          { skill: skillDocs['Tailoring & Stitching'].id, proficiency: 'expert' },
          { skill: skillDocs['Social Media Management'].id, proficiency: 'beginner' },
        ],
        interests: [
          interestDocs['Working from home'].id,
          interestDocs['Selling online'].id,
        ],
      },
    },
    { upsert: true, new: true }
  );

  // --- Business ideas + roadmaps (delete and re-seed each run) ---
  await BusinessIdea.deleteMany({});
  await Roadmap.deleteMany({});

  for (const idea of IDEAS) {
    const skillIds = idea.skills.map((name) => skillDocs[name].id);
    const interestIds = idea.interests ? idea.interests.map((name) => interestDocs[name].id) : [];

    const created = await BusinessIdea.create({
      title: idea.title,
      summary: idea.summary,
      category: idea.category,
      lowInvestment: true,
      status: 'published',
      createdBy: admin.id,
      skills: skillIds,
      interests: interestIds,
    });

    await Roadmap.create({
      idea: created.id,
      title: `${idea.title} — Roadmap`,
      steps: idea.roadmap.map(([stage, title, content, estCostMin, estCostMax], i) => ({
        stepOrder: i + 1,
        stage,
        title,
        content,
        estCostMin,
        estCostMax,
      })),
    });
  }
  console.log(`Seeded ${IDEAS.length} business ideas with roadmaps.`);

  // --- Learning resources (skip if already present) ---
  const existingResourceCount = await LearningResource.countDocuments();
  if (existingResourceCount === 0) {
    await LearningResource.insertMany([
      {
        title: 'How to Cost a Handmade Product',
        type: 'article',
        body: 'A short guide to pricing handmade goods: materials, time, overhead, and margin.',
        status: 'approved',
        uploadedBy: admin.id,
      },
      {
        title: 'MSME/Udyam Registration Checklist',
        type: 'checklist',
        body: 'Documents needed: Aadhaar, PAN, business address proof, bank details.',
        status: 'approved',
        uploadedBy: admin.id,
      },
      {
        title: 'Basics of WhatsApp Business for Local Selling',
        type: 'article',
        body: 'Setting up a catalog, broadcast lists, and quick replies for customer questions.',
        status: 'approved',
        uploadedBy: admin.id,
      },
      {
        title: 'U.S. Small Business Administration — Business Guide',
        type: 'article',
        url: 'https://www.sba.gov/business-guide',
        body: 'SBA\'s step-by-step guide to planning, launching, managing, and growing a small business.',
        status: 'approved',
        uploadedBy: admin.id,
      },
    ]);
    console.log('Seeded learning resources.');
  } else {
    console.log('Learning resources already present — skipping.');
  }

  console.log('\nSeed complete. Demo accounts:');
  console.log('  admin    -> admin@entreskill.dev / Admin@123');
  console.log('  mentor 1 -> meera.mentor@entreskill.dev / Mentor@123');
  console.log('  mentor 2 -> rajan.mentor@entreskill.dev / Mentor@123');
  console.log('  mentor 3 -> priya.mentor@entreskill.dev / Mentor@123');
  console.log('  mentor 4 -> amit.mentor@entreskill.dev / Mentor@123');
  console.log('  mentor 5 -> sunita.mentor@entreskill.dev / Mentor@123');
  console.log('  mentor 6 -> karthik.mentor@entreskill.dev / Mentor@123');
  console.log('  user     -> asha@entreskill.dev / User@1234');

  process.exit(0);
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
