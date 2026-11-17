# PawConnect

[![CI](https://github.com/40is40inos/PawConnect/actions/workflows/ci.yml/badge.svg)](https://github.com/40is40inos/PawConnect/actions/workflows/ci.yml)

**Live demo: https://pawconnect-l8w5.onrender.com**. Log in as owner `maria_o` or keeper `eleni_k` with the password `demo-password`. The free server sleeps when idle, so the first visit can take about a minute. The demo resets to fresh data each time it wakes up.

A marketplace where pet owners find pet keepers (sitters) and book stays for their pets. Keepers set their price and the animals they look after. Owners search, send booking requests and review keepers after a stay.

It started as a team project for the Internet-Centric Computing course (HY359) at the University of Crete. I later rebuilt the backend security and added the marketplace features: pets, keeper profiles, search, bookings and reviews, all with automated tests.

![Owner searching for a keeper](docs/screenshots/find-a-keeper.png)

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

| Owner's bookings | Keeper's requests |
|---|---|
| ![Owner bookings](docs/screenshots/owner-bookings.png) | ![Keeper requests](docs/screenshots/keeper-requests.png) |

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
- It deploys a new commit only after CI passes.
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
├── components/         # Keeper search, booking form, pets, bookings, profiles
├── pages/              # login, register, dashboard, guest, keeper page, admin
└── utils/              # Labels, date and price formatting
e2e/                    # Playwright browser tests
Dockerfile              # Multi-stage build: React app + API in one image
docker-compose.yml      # App + MySQL with demo data
render.yaml             # Render deployment
```

## Not built yet

- Messaging between owners and keepers inside the app.
- Payments: prices are shown but not charged.
- Email notifications, email verification and password reset.
- Keeper availability calendars and multi-pet bookings.
