# EntreSkill Hub — Skill-to-Startup Enablement Platform

A full-stack **MERN** (MongoDB, Express, React, Node.js) implementation of the EntreSkill Hub
PRD: skill/interest profiling, matched business idea recommendations, step-by-step business
roadmaps, mentor directory & session requests, learning resources, progress tracking,
bookmarks, and an admin console.

> This project was converted from an earlier SQLite-based prototype to a proper MERN stack.
> The API layer, data model, and routes below are built on **MongoDB + Mongoose**; the
> frontend and feature set are unchanged.

## Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 19 + Vite, React Router, Tailwind CSS v4 |
| Backend   | Node.js + Express 5 |
| Database  | **MongoDB** via Mongoose ODM |
| Auth      | JWT (8h expiry) + bcrypt password hashing |

## Project structure

```
entreskill-hub/
├── backend/
│   ├── server.js              # Express app, security middleware, route mounting
│   ├── db/connect.js          # Mongoose connection helper
│   ├── seed/seed.js           # Idempotent seed script (skills, ideas, roadmaps, demo users)
│   ├── models/
│   │   ├── User.js            # incl. embedded skill/interest profile
│   │   ├── Skill.js
│   │   ├── Interest.js
│   │   ├── BusinessIdea.js
│   │   ├── Roadmap.js         # roadmap steps embedded as subdocuments
│   │   ├── LearningResource.js
│   │   ├── Bookmark.js
│   │   ├── Progress.js        # per-step completion tracking
│   │   ├── BudgetPlan.js      # persisted capital budget per user/idea
│   │   ├── MentorSession.js
│   │   └── Feedback.js
│   ├── middleware/auth.js     # JWT sign/verify, requireAuth, requireRole (RBAC)
│   └── routes/
│       ├── auth.js            # register, login, /me
│       ├── users.js           # skill/interest profile, bookmarks, budget planner
│       ├── businessIdeas.js   # idea listing, detail, recommendations, idea generator, startup advisor
│       ├── progress.js        # per-step roadmap progress tracking
│       ├── mentors.js         # directory, session requests, mentor's session queue
│       ├── resources.js       # learning resource submission/listing
│       ├── admin.js           # user/mentor management, content approval, stats
│       └── feedback.js        # public feedback intake
└── frontend/
    └── src/
        ├── api/client.js          # fetch wrapper (attaches JWT, normalizes errors)
        ├── context/AuthContext.jsx
        ├── components/             # Navbar, Footer, ProtectedRoute, Toast, UI primitives
        └── pages/                  Home, Login, Register, Onboarding, Ideas,
                                     IdeaDetail (roadmap + budget + advisor), Mentors, MentorPanel,
                                     Resources, Dashboard, Profile, AdminPanel
```

## Data model (MongoDB / Mongoose)

- **User** — auth fields + `role` (`user`/`mentor`/`admin`), `status` (`active`/`pending`/
  `suspended`), and an embedded skill/interest profile (`skills: [{ skill, proficiency }]`,
  `interests: [ObjectId]`) — this replaces the old `user_skills`/`user_interests` join tables.
- **Skill** / **Interest** — simple reference collections.
- **BusinessIdea** — title, summary, category, `status` (`draft`/`published`), `skills`
  (array of Skill refs).
- **Roadmap** — one per business idea; `steps` is an array of embedded subdocuments
  (`stepOrder`, `stage`, `title`, `content`, `estCostMin`, `estCostMax`), each with its own
  stable `_id` used by the progress-tracking routes.
- **LearningResource** — video/article/checklist content with an approval `status`.
- **Bookmark** — unique compound index on `(user, idea)`.
- **Progress** — unique compound index on `(user, step)`; tracks completion of individual
  roadmap steps.
- **BudgetPlan** — persisted capital budget per user/idea (step cost overrides + custom line items).
- **MentorSession** — mentorship session requests between a mentee and a mentor.
- **Feedback** — public feedback/report intake, reviewable by admins.

Every model exposes a clean `id` (string) field in its JSON output instead of Mongo's raw
`_id`/`__v`, so the API and frontend never deal with ObjectId objects directly.

## Getting started

### 0. MongoDB

You need a MongoDB instance — either local or a free [MongoDB Atlas](https://www.mongodb.com/atlas)
cluster:

```bash
# Local (if you have MongoDB installed):
mongod --dbpath /path/to/data

# Or use Atlas and copy its connection string into MONGO_URI (see below).
```

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env:
#   MONGO_URI=mongodb://127.0.0.1:27017/entreskill   (or your Atlas connection string)
#   JWT_SECRET=<a strong random value, e.g. `openssl rand -hex 32`>
npm run seed        # populates skills, interests, 5 business ideas + roadmaps, demo users
npm start            # or: npm run dev (auto-restarts on change)
```

The API listens on `http://localhost:4000`.

**Demo accounts** (seeded, change/remove before any real deployment):

| Role   | Email                        | Password    |
|--------|-------------------------------|-------------|
| Admin  | admin@entreskill.dev          | Admin@123   |
| Mentor | meera.mentor@entreskill.dev   | Mentor@123  |
| User   | asha@entreskill.dev           | User@1234   |

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

`frontend/.env` points the app at `VITE_API_URL=http://localhost:4000/api` — update it if the
backend runs elsewhere.

## Security measures implemented

- **Password storage**: bcrypt (cost factor 10); the `passwordHash` field is `select: false`
  on the Mongoose schema so it's never returned by a normal query, and it's stripped again in
  the `toJSON` transform as a second layer of defense.
- **Authentication**: stateless JWTs signed with a secret loaded from the environment; the
  server refuses to start if `JWT_SECRET` is unset rather than falling back to a default.
- **Authorization**: role-based access control (`user` / `mentor` / `admin`) enforced in
  middleware on every sensitive route — e.g. only admins can reach `/api/admin/*`, only
  mentors can manage their session queue.
- **Mentor verification gate**: mentor accounts are created with `status: 'pending'` and are
  invisible in the public directory until an admin sets them to `active`.
- **Rate limiting**: a strict limiter on `/api/auth/*` (20 requests/15 min) to slow
  credential-stuffing, plus a global baseline limiter on the whole API.
- **Input validation**: `express-validator` on every write endpoint (email format, password
  strength, string length caps) — bad input is rejected with a 400 before touching the DB.
- **NoSQL injection protection**: all queries go through Mongoose's schema-typed query
  builders (`findOne`, `findById`, etc.) with values passed as parameters, never interpolated
  into raw query strings; route params are validated with `mongoose.isValidObjectId()` before
  being used in a query.
- **HTTP security headers**: `helmet()` sets sane defaults (CSP-adjacent headers, no
  `X-Powered-By`, etc.).
- **CORS**: locked to an explicit allow-list (`CORS_ORIGIN` env var) rather than `*`.
- **Body size limits**: JSON bodies capped at 100kb to reduce DoS surface.
- **Generic auth errors**: login failures return the same message whether the email doesn't
  exist or the password is wrong, so the API doesn't leak which emails are registered.
- **No stack traces to clients**: a central error handler logs the real error server-side and
  returns a generic message to the client.

## Mapping to the PRD

- **User features**: registration/login, skill & interest profiling with proficiency levels
  (`/onboarding`), business idea recommendations (skill-overlap match score), roadmaps with 5
  stages, learning resources, progress tracking dashboard (includes bookmarked ideas),
  bookmarks, user profile with achievements, persisted capital budget planner, template-based
  startup advisor chat — all implemented.
- **Mentor features**: registration with pending verification, profile (expertise/experience/
  bio), resource upload (queued for approval), session requests / accept / decline / complete.
- **Admin features**: user & mentor management (verify/suspend), business idea curation
  (draft/publish), learning resource approval queue, engagement stats, feedback triage.
- **Reference**: the roadmap structure (idea validation → skills & tools → legal &
  registration → cost estimation → marketing basics) mirrors the stage-based approach used by
  the U.S. Small Business Administration's own [business guide](https://www.sba.gov/business-guide)
  ("Plan → Launch → Manage → Grow"), which is also seeded into the platform as a learning
  resource.
- **Out of scope** (per PRD): native mobile apps, live funding/loan processing, real LLM-based
  AI coaching, government subsidy integrations — the startup advisor and idea generator use
  template-based logic; generated ideas require admin approval before public listing.

## Notes & next steps for production

- Add HTTPS termination (reverse proxy / load balancer) — the app assumes TLS is handled
  upstream in production.
- Add automated frontend tests (Vitest + React Testing Library).
- Add file/image upload support (e.g. mentor profile photos, business idea images) via S3 or
  similar — profile pictures currently use URL input.
- Consider adding Mongoose schema-level indexes for frequently-filtered fields (`role`,
  `status`, `category`) as data volume grows — a few are already in place (e.g. unique
  compound indexes on `Bookmark` and `Progress`).
