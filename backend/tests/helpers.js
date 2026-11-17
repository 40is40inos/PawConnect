const request = require('supertest');
const { createApp } = require('../app');
const { User, Admin, Pet, KeeperProfile, Booking, Review } = require('../models');
const { migrator } = require('../db/migrator');
const userService = require('../services/userService');

// The first call in a test file rebuilds the schema from the migrations
// (so the tests always run against the migrated schema). Later calls only
// delete rows, children first, which is much faster on MySQL/Postgres.
let schemaReady = false;
async function resetDB() {
  if (!schemaReady) {
    await migrator.down({ to: 0 });
    await migrator.up();
    schemaReady = true;
    return;
  }
  for (const model of [Review, Booking, Pet, KeeperProfile, User, Admin]) {
    await model.destroy({ where: {}, force: true });
  }
}

let counter = 0;
function newUser(overrides = {}) {
  counter += 1;
  return {
    userName: `user${counter}`,
    password: 'correct-horse-1',
    email: `user${counter}@example.com`,
    firstName: 'Maria',
    lastName: 'Papadopoulou',
    birthdate: '1998-04-12',
    sex: 'F',
    type: 'PETOWNER',
    country: 'Greece',
    city: 'Thessaloniki',
    address: 'Egnatia 1',
    phoneNumber: '+306900000000',
    ...overrides,
  };
}

// Registers a user and returns a Supertest agent that keeps the session cookie.
async function loggedInAgent(app, overrides = {}) {
  const user = newUser(overrides);
  const agent = request.agent(app);
  await agent.post('/api/auth/register').send(user).expect(201);
  return { agent, user };
}

async function adminAgent(app) {
  await userService.createAdmin('site_admin', 'admin-password-123');
  const agent = request.agent(app);
  await agent
    .post('/api/auth/login')
    .send({ username: 'site_admin', password: 'admin-password-123' })
    .expect(200);
  return agent;
}

// YYYY-MM-DD, `offset` days from today (negative for the past).
function day(offset) {
  const { todayISO } = require('../utils/dates');
  const d = new Date(`${todayISO()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
}

async function addPet(agent, overrides = {}) {
  const res = await agent
    .post('/api/pets')
    .send({ name: 'Rex', species: 'DOG', breed: 'Labrador', ...overrides })
    .expect(201);
  return res.body;
}

async function setKeeperProfile(agent, overrides = {}) {
  const res = await agent
    .put('/api/keeper-profile')
    .send({
      bio: 'Experienced dog walker with a big garden.',
      dailyRate: 25,
      acceptedSpecies: ['DOG', 'CAT'],
      ...overrides,
    })
    .expect(200);
  return res.body;
}

// An owner with a pet and a keeper with a profile, both logged in.
async function marketplace(app, { keeper: keeperOverrides = {}, profile = {} } = {}) {
  const owner = await loggedInAgent(app, { type: 'PETOWNER' });
  const keeper = await loggedInAgent(app, { type: 'PETKEEPER', city: 'Heraklion', ...keeperOverrides });
  await setKeeperProfile(keeper.agent, profile);
  const pet = await addPet(owner.agent);
  return { owner, keeper, pet };
}

module.exports = {
  createApp,
  request,
  resetDB,
  newUser,
  loggedInAgent,
  adminAgent,
  day,
  addPet,
  setKeeperProfile,
  marketplace,
};
