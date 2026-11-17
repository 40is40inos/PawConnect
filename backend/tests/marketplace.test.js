const { sequelize, Booking, Pet, Review } = require('../models');
const {
  createApp,
  request,
  resetDB,
  loggedInAgent,
  adminAgent,
  day,
  addPet,
  setKeeperProfile,
  marketplace,
} = require('./helpers');

let app;
beforeAll(() => {
  app = createApp();
});
beforeEach(resetDB);
afterAll(() => sequelize.close());

const requestBooking = (agent, body) => agent.post('/api/bookings').send(body);

describe('pets', () => {
  test('owners manage their own pets', async () => {
    const { agent } = await loggedInAgent(app, { type: 'PETOWNER' });
    const pet = await addPet(agent, { name: 'Luna', species: 'CAT', weightKg: 4.5 });
    expect(pet).toMatchObject({ name: 'Luna', species: 'CAT', weightKg: 4.5 });

    await agent.patch(`/api/pets/${pet.id}`).send({ careNotes: 'Wet food twice a day' }).expect(200);
    const list = await agent.get('/api/pets').expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].careNotes).toBe('Wet food twice a day');

    await agent.delete(`/api/pets/${pet.id}`).expect(204);
    expect((await agent.get('/api/pets')).body).toHaveLength(0);
  });

  test("another owner's pet looks like it doesn't exist", async () => {
    const alice = await loggedInAgent(app, { type: 'PETOWNER' });
    const bob = await loggedInAgent(app, { type: 'PETOWNER' });
    const pet = await addPet(alice.agent);

    await bob.agent.patch(`/api/pets/${pet.id}`).send({ name: 'Mine now' }).expect(404);
    await bob.agent.delete(`/api/pets/${pet.id}`).expect(404);
    expect((await bob.agent.get('/api/pets')).body).toHaveLength(0);
  });

  test('keepers and guests cannot add pets', async () => {
    const { agent } = await loggedInAgent(app, { type: 'PETKEEPER' });
    await agent.post('/api/pets').send({ name: 'Rex', species: 'DOG' }).expect(403);
    await request(app).post('/api/pets').send({ name: 'Rex', species: 'DOG' }).expect(401);
  });

  test('rejects invalid pets', async () => {
    const { agent } = await loggedInAgent(app, { type: 'PETOWNER' });
    await agent.post('/api/pets').send({ name: 'Rex', species: 'DRAGON' }).expect(400);
    await agent.post('/api/pets').send({ name: '', species: 'DOG' }).expect(400);
    await agent.post('/api/pets').send({ name: 'Rex', species: 'DOG', ownerUserName: 'x' }).expect(400);
  });

  test('a pet with an upcoming booking cannot be deleted', async () => {
    const { owner, keeper, pet } = await marketplace(app);
    await requestBooking(owner.agent, {
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      startDate: day(3),
      endDate: day(5),
    }).expect(201);

    const res = await owner.agent.delete(`/api/pets/${pet.id}`).expect(409);
    expect(res.body.error).toMatch(/upcoming bookings/);
  });
});

describe('keeper profiles and search', () => {
  test('keepers without a profile are not listed', async () => {
    await loggedInAgent(app, { type: 'PETKEEPER' });
    const res = await request(app).get('/api/keepers').expect(200);
    expect(res.body).toEqual([]);
  });

  test('only keepers can save a keeper profile', async () => {
    const { agent } = await loggedInAgent(app, { type: 'PETOWNER' });
    await agent
      .put('/api/keeper-profile')
      .send({ bio: 'x'.repeat(30), dailyRate: 20, acceptedSpecies: ['DOG'] })
      .expect(403);
  });

  test('saving twice updates the same profile', async () => {
    const { agent } = await loggedInAgent(app, { type: 'PETKEEPER' });
    await setKeeperProfile(agent, { dailyRate: 20 });
    await setKeeperProfile(agent, { dailyRate: 30, acceptedSpecies: ['BIRD', 'BIRD'] });

    const profile = (await agent.get('/api/keeper-profile').expect(200)).body;
    expect(profile.dailyRate).toBe(30);
    expect(profile.acceptedSpecies).toEqual(['BIRD']);
  });

  test('filters by city (any case), species and maximum rate', async () => {
    const a = await loggedInAgent(app, { type: 'PETKEEPER', city: 'Heraklion' });
    await setKeeperProfile(a.agent, { dailyRate: 15, acceptedSpecies: ['CAT'] });
    const b = await loggedInAgent(app, { type: 'PETKEEPER', city: 'Heraklion' });
    await setKeeperProfile(b.agent, { dailyRate: 40, acceptedSpecies: ['DOG', 'CAT'] });
    const c = await loggedInAgent(app, { type: 'PETKEEPER', city: 'Chania' });
    await setKeeperProfile(c.agent, { dailyRate: 10, acceptedSpecies: ['DOG'] });

    const names = async (query) =>
      (await request(app).get('/api/keepers').query(query).expect(200)).body.map((k) => k.userName);

    expect(await names({})).toEqual([c.user.userName, a.user.userName, b.user.userName]); // cheapest first
    expect(await names({ city: 'heraklion' })).toEqual([a.user.userName, b.user.userName]);
    expect(await names({ species: 'DOG' })).toEqual([c.user.userName, b.user.userName]);
    expect(await names({ city: 'Heraklion', species: 'CAT', maxRate: 20 })).toEqual([a.user.userName]);
  });

  test('rejects an unknown species filter', async () => {
    await request(app).get('/api/keepers').query({ species: 'DRAGON' }).expect(400);
  });

  test('guests see no contact details in search results', async () => {
    await marketplace(app);
    const [guestView] = (await request(app).get('/api/keepers')).body;
    expect(guestView).toHaveProperty('dailyRate', 25);
    expect(guestView).not.toHaveProperty('email');
    expect(guestView).not.toHaveProperty('phoneNumber');
    expect(guestView.rating).toEqual({ average: null, count: 0 });
  });
});

describe('booking requests', () => {
  test('an owner requests a booking and the price is fixed at request time', async () => {
    const { owner, keeper, pet } = await marketplace(app, { profile: { dailyRate: 22.5 } });

    const res = await requestBooking(owner.agent, {
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      startDate: day(10),
      endDate: day(13),
      message: 'Rex loves long walks',
    }).expect(201);

    expect(res.body).toMatchObject({ status: 'REQUESTED', totalPrice: 90 }); // 4 days x 22.50
    expect(res.body.pet.name).toBe('Rex');
    // No contact details before the keeper accepts.
    expect(res.body.otherParty).not.toHaveProperty('phoneNumber');

    await setKeeperProfile(keeper.agent, { dailyRate: 100 });
    const later = await owner.agent.get(`/api/bookings/${res.body.id}`).expect(200);
    expect(later.body.totalPrice).toBe(90);
  });

  test.each([
    ['start date in the past', { startDate: day(-1), endDate: day(2) }, 'startDate'],
    ['end before start', { startDate: day(5), endDate: day(4) }, 'endDate'],
    ['stay longer than 30 days', { startDate: day(1), endDate: day(31) }, 'endDate'],
  ])('rejects %s', async (_label, dates, field) => {
    const { owner, keeper, pet } = await marketplace(app);
    const res = await requestBooking(owner.agent, {
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      ...dates,
    }).expect(400);
    expect(res.body.details[0].field).toBe(field);
  });

  test("cannot book someone else's pet", async () => {
    const { keeper, pet } = await marketplace(app);
    const stranger = await loggedInAgent(app, { type: 'PETOWNER' });
    await requestBooking(stranger.agent, {
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      startDate: day(1),
      endDate: day(2),
    }).expect(404);
  });

  test('cannot book a keeper who does not accept the species', async () => {
    const { owner, keeper } = await marketplace(app, { profile: { acceptedSpecies: ['DOG'] } });
    const cat = await addPet(owner.agent, { name: 'Luna', species: 'CAT' });
    const res = await requestBooking(owner.agent, {
      keeperUserName: keeper.user.userName,
      petId: cat.id,
      startDate: day(1),
      endDate: day(2),
    }).expect(422);
    expect(res.body.error).toMatch(/does not look after cats/);
  });

  test('cannot double-book the same pet for overlapping dates', async () => {
    const { owner, keeper, pet } = await marketplace(app);
    const body = { keeperUserName: keeper.user.userName, petId: pet.id };
    await requestBooking(owner.agent, { ...body, startDate: day(5), endDate: day(8) }).expect(201);
    await requestBooking(owner.agent, { ...body, startDate: day(8), endDate: day(9) }).expect(409);
    await requestBooking(owner.agent, { ...body, startDate: day(9), endDate: day(10) }).expect(201);
  });

  test('keepers cannot request bookings', async () => {
    const { keeper, pet } = await marketplace(app);
    await requestBooking(keeper.agent, {
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      startDate: day(1),
      endDate: day(2),
    }).expect(403);
  });
});

describe('booking lifecycle', () => {
  async function requested(dates = { startDate: day(5), endDate: day(7) }) {
    const setup = await marketplace(app);
    const res = await requestBooking(setup.owner.agent, {
      keeperUserName: setup.keeper.user.userName,
      petId: setup.pet.id,
      ...dates,
    }).expect(201);
    return { ...setup, booking: res.body };
  }

  test('the keeper sees the request with pet details and accepts it', async () => {
    const { owner, keeper, booking } = await requested();

    const inbox = (await keeper.agent.get('/api/bookings').expect(200)).body;
    expect(inbox).toHaveLength(1);
    expect(inbox[0].pet.breed).toBe('Labrador');
    expect(inbox[0].otherParty.userName).toBe(owner.user.userName);

    const accepted = await keeper.agent.post(`/api/bookings/${booking.id}/accept`).expect(200);
    expect(accepted.body.status).toBe('ACCEPTED');
    // Both sides now see each other's contact details.
    expect(accepted.body.otherParty.phoneNumber).toBe(owner.user.phoneNumber);
    const ownerView = await owner.agent.get(`/api/bookings/${booking.id}`).expect(200);
    expect(ownerView.body.otherParty.email).toBe(keeper.user.email);
  });

  test('only the booked keeper can accept or decline', async () => {
    const { owner, booking } = await requested();
    const otherKeeper = await loggedInAgent(app, { type: 'PETKEEPER' });

    await otherKeeper.agent.post(`/api/bookings/${booking.id}/accept`).expect(404);
    await otherKeeper.agent.post(`/api/bookings/${booking.id}/decline`).expect(404);
    await owner.agent.post(`/api/bookings/${booking.id}/accept`).expect(403);
  });

  test('a declined booking cannot be accepted afterwards', async () => {
    const { keeper, booking } = await requested();
    await keeper.agent.post(`/api/bookings/${booking.id}/decline`).expect(200);
    const res = await keeper.agent.post(`/api/bookings/${booking.id}/accept`).expect(409);
    expect(res.body.error).toBe('This booking is already declined');
  });

  test('a keeper cannot accept two bookings for overlapping dates', async () => {
    const { owner, keeper, pet, booking } = await requested({ startDate: day(5), endDate: day(7) });
    const pet2 = await addPet(owner.agent, { name: 'Max' });
    const second = await requestBooking(owner.agent, {
      keeperUserName: keeper.user.userName,
      petId: pet2.id,
      startDate: day(7),
      endDate: day(9),
    }).expect(201);
    expect(pet.id).not.toBe(pet2.id);

    await keeper.agent.post(`/api/bookings/${booking.id}/accept`).expect(200);
    const res = await keeper.agent.post(`/api/bookings/${second.body.id}/accept`).expect(409);
    expect(res.body.error).toMatch(/overlapping dates/);
    // Declining is still possible.
    await keeper.agent.post(`/api/bookings/${second.body.id}/decline`).expect(200);
  });

  test('the owner can cancel a request or an accepted booking before it starts', async () => {
    const { owner, keeper, booking } = await requested();
    await keeper.agent.post(`/api/bookings/${booking.id}/accept`).expect(200);
    const res = await owner.agent.post(`/api/bookings/${booking.id}/cancel`).expect(200);
    expect(res.body.status).toBe('CANCELLED');
    await owner.agent.post(`/api/bookings/${booking.id}/cancel`).expect(409);
  });

  test('an accepted booking that has started cannot be cancelled', async () => {
    const { owner, keeper, pet } = await marketplace(app);
    const started = await Booking.create({
      ownerUserName: owner.user.userName,
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      startDate: day(-1),
      endDate: day(2),
      status: 'ACCEPTED',
      totalPrice: 100,
    });
    await owner.agent.post(`/api/bookings/${started.id}/cancel`).expect(409);
  });

  test("users cannot see other people's bookings", async () => {
    const { booking } = await requested();
    const stranger = await loggedInAgent(app, { type: 'PETOWNER' });
    await stranger.agent.get(`/api/bookings/${booking.id}`).expect(404);
    expect((await stranger.agent.get('/api/bookings')).body).toEqual([]);
    await request(app).get('/api/bookings').expect(401);
  });

  test('non-numeric booking ids are a 404', async () => {
    const { owner } = await requested();
    await owner.agent.get('/api/bookings/abc').expect(404);
  });
});

describe('reviews', () => {
  async function pastBooking(status = 'ACCEPTED') {
    const setup = await marketplace(app);
    const booking = await Booking.create({
      ownerUserName: setup.owner.user.userName,
      keeperUserName: setup.keeper.user.userName,
      petId: setup.pet.id,
      startDate: day(-10),
      endDate: day(-7),
      status,
      totalPrice: 100,
    });
    return { ...setup, booking };
  }

  test('the owner reviews a completed stay and the keeper rating updates', async () => {
    const { owner, keeper, booking } = await pastBooking();

    const list = (await owner.agent.get('/api/bookings')).body;
    expect(list[0]).toMatchObject({ completed: true, canReview: true });

    const res = await owner.agent
      .post(`/api/bookings/${booking.id}/review`)
      .send({ rating: 4, comment: 'Rex came back happy' })
      .expect(201);
    expect(res.body.review.rating).toBe(4);
    expect(res.body.canReview).toBe(false);

    const page = (await request(app).get(`/api/keepers/${keeper.user.userName}`).expect(200)).body;
    expect(page.rating).toEqual({ average: 4, count: 1 });
    expect(page.reviews[0]).toMatchObject({ rating: 4, comment: 'Rex came back happy', ownerFirstName: 'Maria' });
  });

  test('one review per booking', async () => {
    const { owner, booking } = await pastBooking();
    await owner.agent.post(`/api/bookings/${booking.id}/review`).send({ rating: 5 }).expect(201);
    await owner.agent.post(`/api/bookings/${booking.id}/review`).send({ rating: 1 }).expect(409);
  });

  test('cannot review a stay that has not ended or was not accepted', async () => {
    const { owner, keeper, pet } = await marketplace(app);
    const upcoming = await requestBooking(owner.agent, {
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      startDate: day(2),
      endDate: day(3),
    });
    await keeper.agent.post(`/api/bookings/${upcoming.body.id}/accept`).expect(200);
    await owner.agent.post(`/api/bookings/${upcoming.body.id}/review`).send({ rating: 5 }).expect(409);

    const declined = await Booking.create({
      ownerUserName: owner.user.userName,
      keeperUserName: keeper.user.userName,
      petId: pet.id,
      startDate: day(-10),
      endDate: day(-8),
      status: 'DECLINED',
      totalPrice: 50,
    });
    await owner.agent.post(`/api/bookings/${declined.id}/review`).send({ rating: 5 }).expect(409);
  });

  test('ratings must be whole numbers from 1 to 5', async () => {
    const { owner, booking } = await pastBooking();
    for (const rating of [0, 6, 3.5]) {
      await owner.agent.post(`/api/bookings/${booking.id}/review`).send({ rating }).expect(400);
    }
  });

  test('search results include the average rating', async () => {
    const { owner, booking } = await pastBooking();
    await owner.agent.post(`/api/bookings/${booking.id}/review`).send({ rating: 5 }).expect(201);
    const [card] = (await request(app).get('/api/keepers')).body;
    expect(card.rating).toEqual({ average: 5, count: 1 });
  });

  test('a deleted pet still shows in past bookings', async () => {
    const { owner, pet } = await pastBooking();
    await owner.agent.delete(`/api/pets/${pet.id}`).expect(204);
    const [booking] = (await owner.agent.get('/api/bookings')).body;
    expect(booking.pet.name).toBe('Rex');
  });
});

describe('deleting a user', () => {
  test('removes their pets, bookings and reviews', async () => {
    const { owner, booking } = await (async () => {
      const setup = await marketplace(app);
      const b = await Booking.create({
        ownerUserName: setup.owner.user.userName,
        keeperUserName: setup.keeper.user.userName,
        petId: setup.pet.id,
        startDate: day(-5),
        endDate: day(-3),
        status: 'ACCEPTED',
        totalPrice: 75,
      });
      await setup.owner.agent.post(`/api/bookings/${b.id}/review`).send({ rating: 5 }).expect(201);
      return { ...setup, booking: b };
    })();

    const admin = await adminAgent(app);
    await admin.delete(`/api/admin/users/${owner.user.userName}`).expect(204);

    expect(await Pet.count({ paranoid: false })).toBe(0);
    expect(await Booking.findByPk(booking.id)).toBeNull();
    expect(await Review.count()).toBe(0);
  });
});
