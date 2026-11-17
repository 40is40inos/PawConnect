const request = require('supertest');
const { createApp } = require('../app');
const { sequelize } = require('../models');
const userService = require('../services/userService');

const resetDB = () => sequelize.sync({ force: true });

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

module.exports = { createApp, request, resetDB, newUser, loggedInAgent, adminAgent };
