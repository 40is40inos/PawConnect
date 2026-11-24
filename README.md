# PawConnect

[![CI](https://github.com/40is40inos/PawConnect/actions/workflows/ci.yml/badge.svg)](https://github.com/40is40inos/PawConnect/actions/workflows/ci.yml)

**Live demo: https://pawconnect-l8w5.onrender.com**. Log in as owner `maria_o` or keeper `eleni_k` with the password `demo-password`. The free server sleeps when idle, so the first visit can take about a minute. The demo resets to fresh data each time it wakes up.

A marketplace where pet owners find pet keepers (sitters) and book stays for their pets. Keepers set their price and the animals they look after. Owners search, send booking requests and review keepers after a stay.

It started as a two-person project with Kiriaki Dimopoulou for the Internet-Centric Computing course (HY359) at the University of Crete. I later rebuilt the backend security and added the marketplace features (pets, keeper profiles, search, bookings and reviews), automated tests, Docker and the deployment, then redesigned the interface around the golden ratio, with motion throughout.

![PawConnect landing page](docs/screenshots/landing.jpg)

## Features

**Pet owners**
- Add pets with species, breed, age, weight and care notes for the keeper.
- Search keepers by city, species and maximum daily price, with average ratings.
- Request a booking for a pet and dates. The price (days × daily rate) is shown before sending and fixed at request time.
- Withdraw a request, or cancel an accepted booking before it starts.
- Review the keeper (1–5 stars and a comment) after an accepted stay has ended.

**Pet keepers**
- Set a profile: bio, daily rate and the species they look after. Keepers appear in search only once this is filled in.
- Accept or decline requests, with the pet's care notes in view.

**Everyone**
- Contact details stay private until it makes sense to share them. Guests see none. Logged-in users see a keeper's email and phone. The owner and the keeper see each other's details only after a booking is accepted.
- Admins can list and delete users. Deleting a user removes their pets, bookings and reviews.

## Screenshots

| Searching for a keeper | A keeper's profile, with dates picked |
|---|---|
| ![Keeper search with sorting and a grid/list toggle](docs/screenshots/find-a-keeper.jpg) | ![Keeper profile with rating ring and booking calendar](docs/screenshots/keeper-page.jpg) |
| **Owner's bookings** | **Keeper's requests** |
| ![Owner dashboard with stat tiles and bookings](docs/screenshots/owner-bookings.jpg) | ![Keeper dashboard with requests waiting](docs/screenshots/keeper-requests.jpg) |
| **Log in** | **Owner's pets** |
| ![Login page with a golden-ratio photo split](docs/screenshots/login.jpg) | ![Owner's pets](docs/screenshots/my-pets.jpg) |

<p>
  <img src="docs/screenshots/phone-landing.jpg" width="260" alt="Landing page on a phone">
  &nbsp;
  <img src="docs/screenshots/phone-keeper-page.jpg" width="260" alt="Keeper profile on a phone">
</p>

The screenshots are taken by a script, so they can be retaken after UI changes: build the frontend, then run `npm run screenshots` in `e2e/`.

## Design and motion

The interface was redesigned to feel warm and alive: dark navy with peach, orange and pink, a serif display face, depth from glass panels and soft shadows, and motion that explains what just happened. The [live demo](https://pawconnect-l8w5.onrender.com) shows it best.

**Built on the golden ratio (φ ≈ 1.618).** All sizes come from CSS custom properties in [`styles/tokens.css`](frontend/src/styles/tokens.css):
- Font sizes are steps of √φ from 16px, so every second step is ×φ (16, 20, 26, 33, 42, 68, 110px).
- Spacing and corner radii follow the Fibonacci sequence (8, 13, 21, 34, 55, 89, 144), whose neighbours approach φ.
- Two-column layouts split 61.8% / 38.2% (`1.618fr 1fr`): the login and sign-up pages, and the keeper profile.
- The landing hero's arch is 1 : √φ, with a golden spiral drawn from its golden point. A faint spiral also turns slowly behind every app page.
- Timings borrow it too: count-ups last φ seconds and the keeper carousel advances every ~φ³ seconds.

**Motion, page by page** (with [Motion](https://motion.dev) for React):
- **Landing page:** the headline rises word by word, and the photo, cut-out cat and badges move at different depths with the cursor. Sections parallax on scroll, and a statement lights up word by word as you scroll through it. "How it works" cards stack and sink, and keepers sit in a 3D carousel you can drag. Text bands drift sideways and speed up and lean with scroll speed. A puppy rises into the final call to action. Scrolling is smoothed with Lenis.
- **Across the app:** a floating nav with a highlight that slides to the current page and turns frosted once you scroll. Pages fade and lift between routes, and warm glows drift behind them.
- **Search:** cards tilt in 3D towards the cursor with a light glare. Results stagger in and rearrange smoothly when you sort or filter, the sort control's pill slides between options, and skeleton cards show while loading.
- **Keeper profile:** the cover photo wipes open and parallaxes, and the rating draws itself as a ring while the number counts up. In the calendar, months slide and the start and end markers glide to the days you pick. The booking panel stays in view as you scroll.
- **Login and sign-up:** labels float up as you type, the photo follows the cursor, the password has a strength meter, and the form shakes on a wrong password.
- **Dashboard:** stat tiles count to their values and a pulsing dot marks requests that need an answer. Accept or Decline shows a spinner, then a tick that draws itself and a coloured flash. The card then flies into its new section ("Waiting" → "Upcoming" or "Past").

**Smaller tricks:**
- **Reduced motion:** with "reduce motion" turned on in the operating system, animations end in their final state, CSS animations stop, and the shake, smooth scrolling and drifting bands are switched off.
- **Touch screens:** 3D tilt and cursor parallax run only on devices with a mouse or trackpad, so phones don't get stuck mid-tilt.
- **Shared elements:** the nav highlight, tab indicator, sort pill, calendar markers and booking cards each use a shared `layoutId`. Motion then animates one element between two places instead of fading two separate ones.
- **Leaving pages:** pages that redirect (login, sign-up, the dashboard after logging out) check `useIsPresent`, so a page on its way out doesn't redirect or flash the landing page mid-animation.
- **Colour:** every tint is derived from the palette with `color-mix()`. Glass panels use `backdrop-filter`. When a booking form opens, CSS `:has()` lets that card span the full grid row.
- **Self-hosted assets:** fonts and photos are served from the app itself, because the server's Content Security Policy only allows same-origin images. Fraunces and Inter are variable fonts from Fontsource. The photos are WebP, and two have their backgrounds removed so the animals can sit in front of other elements.

## Business rules

These rules are enforced on the server and covered by the tests:

- A booking can only be for one of your own pets, with a keeper who accepts that species.
- Stays start today or later and last at most 30 days.
- A pet can't have two active bookings on overlapping dates.
- A keeper takes one stay at a time, so they can't accept two bookings with overlapping dates. Accepting runs in a database transaction that locks the keeper's row, so two simultaneous accepts can't both succeed.
- Booking status only moves forward: `REQUESTED → ACCEPTED | DECLINED` (keeper) and `REQUESTED | ACCEPTED → CANCELLED` (owner, before the stay starts). Any other change returns `409 Conflict`.
- One review per booking, and only after an accepted stay has ended.
- A pet with upcoming bookings can't be deleted. Deleted pets are soft-deleted, so past bookings still show them.
- Other people's pets and bookings answer `404`, so their ids can't be probed.

## Tech stack

| Part | Technology |
|---|---|
| Frontend | React 18, React Router 6, Axios |
| Design and motion | Motion (motion/react) for animation, Lenis for smooth scrolling, Fraunces and Inter variable fonts (Fontsource), golden-ratio design tokens in plain CSS |
| Backend | Node.js, Express 5, Sequelize ORM |
| Database | MySQL or Postgres, with versioned migrations (Umzug); SQLite for quick runs |
| Security | bcrypt, JWT in an httpOnly cookie, Zod validation, Helmet, express-rate-limit |
| Testing and CI | Jest + Supertest (on SQLite, MySQL and Postgres), Playwright browser tests, GitHub Actions |
| Deployment | Docker (multi-stage image), Docker Compose, Render + Neon |

## How authentication works

- **Passwords** are hashed with bcrypt (cost 12). The hash is excluded from every query result by default.
- **Sessions** use a signed JWT (HS256, 1 hour) in an `httpOnly`, `SameSite=Lax` cookie, marked `Secure` in production. It holds only the username and role.
- **Authorization** is checked on the server for every request with `requireAuth` and `requireRole`. The current user always comes from the session, never from the URL or the body.
- **Input validation** uses strict Zod schemas, so unknown fields (`type`, `passwordHash`, `ownerUserName`…) are rejected. This blocks mass assignment.
- **Login** returns the same error for an unknown user and a wrong password, and is limited to 10 attempts per IP every 15 minutes.

## API

All endpoints are under `/api`.

| Method | Path | Access | Description |
|---|---|---|---|
| POST | `/auth/register` | Public | Create an owner or keeper account |
| POST | `/auth/login` | Public, rate limited | Log in |
| POST | `/auth/logout` | Public | Log out |
| GET | `/auth/me` | Logged in | Current profile |
| PATCH | `/users/me` | Owner, keeper | Update own details |
| GET | `/users/owners` | Keeper, admin | List pet owners |
| GET | `/keepers?city=&species=&maxRate=` | Public | Search keepers |
| GET | `/keepers/:userName` | Public | Keeper profile and reviews |
| GET, PUT | `/keeper-profile` | Keeper | Read or save own keeper profile |
| GET, POST | `/pets` | Owner | List or add own pets |
| PATCH, DELETE | `/pets/:id` | Owner | Edit or remove own pet |
| GET | `/bookings`, `/bookings/:id` | Owner, keeper | Own bookings |
| POST | `/bookings` | Owner | Request a booking |
| POST | `/bookings/:id/accept`, `/decline` | Keeper | Answer a request |
| POST | `/bookings/:id/cancel` | Owner | Cancel |
| POST | `/bookings/:id/review` | Owner | Review a completed stay |
| GET | `/admin/users` | Admin | List all users |
| DELETE | `/admin/users/:username` | Admin | Delete a user and their data |

## Running locally

### With Docker (recommended)

Requires Docker Desktop. This one command starts MySQL and the app with demo data:

```bash
docker compose up --build
```

Then open http://localhost:5000. Stop with `Ctrl+C`; `docker compose down -v` also deletes the data.

### Without Docker

Requires Node.js 20+ and MySQL 8 or Postgres. You can also use SQLite: see `backend/.env.example`.

```bash
# 1. Backend
cd backend
cp .env.example .env        # choose a database, set JWT_SECRET
npm install
npm run seed-demo           # optional: applies migrations and adds demo data
npm start                   # http://localhost:5000, applies pending migrations on start

# 2. Frontend, in a second terminal
cd frontend
npm install
npm start                   # http://localhost:3000, proxies /api to the backend
```

If the frontend fails with `options.allowedHosts[0] should be a non-empty string`, a known Create React App bug, start it with `DANGEROUSLY_DISABLE_HOST_CHECK=true npm start`.

### Demo accounts

All demo accounts use the password `demo-password`:
- owners: `maria_o`, `kostas_d`
- keepers: `eleni_k`, `giorgos_p`, `anna_m`, `nikos_t`
- admin: `demo_admin` (local Docker and test runs only; the public demo has no admin)

To create a real admin account:

```bash
ADMIN_USERNAME=admin_name ADMIN_PASSWORD='a-long-password' npm run create-admin
```

## Database migrations

The schema is defined by versioned migration files in `backend/db/migrations/`, run with [Umzug](https://github.com/sequelize/umzug). Applied migrations are recorded in the `SequelizeMeta` table, so each one runs once per database. The server applies pending migrations when it starts.

```bash
npm run migrate          # apply pending migrations
npm run migrate:undo     # undo the last one
npm run migrate:status   # list applied and pending
```

To change the schema, add a new file such as `20270101-0002-add-pet-photos.js` with `up` and `down` functions. Never edit a migration that has already run. A test fails if the migrated tables and the Sequelize models ever disagree.

## Tests

```bash
cd backend && npm test                  # 79 API tests on in-memory SQLite
TEST_DATABASE_URL=postgres://user:pass@localhost:5432/pawtest npm test   # same tests on a real server

cd frontend && npm run build            # the browser tests use the production build
cd e2e && npm install && npx playwright install chromium && npm test     # 14 browser tests
npm run screenshots                     # in e2e/: retake the README screenshots
```

**API tests (Jest + Supertest).** They cover:
- authentication, role checks, forged cookies and mass-assignment attempts;
- every booking rule and status change;
- search, reviews and cascading deletes;
- migrations (columns match the models, undo and redo work);
- production settings such as static files, caching and HTTPS cookies.

**Browser tests (Playwright).** They click through the real UI:
- a guest searches and opens keeper pages;
- an owner books, withdraws, manages pets and reviews a keeper;
- a keeper accepts and declines requests;
- a brand-new user goes from registration to an accepted booking;
- an admin deletes an account;
- pages fit a phone screen without sideways scrolling.

**CI (GitHub Actions)**, on every push and pull request:
1. API tests on SQLite, MySQL 8.4 and Postgres 16.
2. A production build of the frontend that fails on lint warnings.
3. The Docker Compose stack (the production image plus MySQL), with the browser tests run against it.

## Deployment

The public demo runs on [Render](https://render.com) (free plan, Docker), with a [Neon](https://neon.tech) Postgres database. `render.yaml` describes the service:
- Render builds the same `Dockerfile` as Docker Compose.
- It checks `/api/health`, which also pings the database.
- It is set to deploy a new commit after CI passes (`autoDeployTrigger: checksPass`). Until Render's GitHub connection is set up for the repo, deploys are started with **Manual Deploy** in the Render dashboard.
- The free instance sleeps when idle. Each time it wakes, the demo resets to fresh demo data with current dates.

The production image serves the React build and the API from one origin. The session cookie therefore stays first-party, `Secure` and `SameSite=Lax`, with no cross-site CORS setup.

## Project structure

```text
backend/
├── app.js              # Express app (no listen), used by server.js and the tests
├── server.js           # Entry point: migrate, then listen
├── routes/             # URL → controller, with the access rule for each route
├── controllers/        # HTTP layer: read the request, call a service, send JSON
├── services/           # Business rules and database queries
├── models/             # Sequelize models and relationships
├── db/migrations/      # Versioned schema migrations
├── middleware/         # Session, role checks, validation, error handling
├── validation/         # Zod request schemas
├── scripts/            # migrate, create-admin, seed-demo
└── tests/              # Jest + Supertest
frontend/src/
├── api/                # Axios client and API calls
├── components/         # Keeper search, calendar, booking form, pets, bookings
│   ├── shell/          # Floating nav, page transitions, animated backdrop
│   └── auth/           # Login/sign-up layout and floating-label fields
├── pages/              # landing, login, register, dashboard, guest, keeper page, admin
├── motion/kit.jsx      # Shared motion pieces: reveal, tilt, count-up, marquee, parallax
├── styles/             # Golden-ratio design tokens and shared UI styles
├── session.jsx         # Logged-in user, fetched once and shared by every page
└── utils/              # Labels, date and price formatting, avatars
e2e/                    # Playwright browser tests and the screenshot script
Dockerfile              # Multi-stage build: React app + API in one image
docker-compose.yml      # App + MySQL with demo data
render.yaml             # Render deployment
```

## Not built yet

- Messaging between owners and keepers inside the app.
- Payments: prices are shown but not charged.
- Email notifications, email verification and password reset.
- Keeper availability calendars and multi-pet bookings.
