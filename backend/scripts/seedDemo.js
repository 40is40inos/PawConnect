// Fills an EMPTY database with demo keepers, owners, pets, bookings and reviews,
// so the app can be tried without creating accounts by hand.
// Every demo account uses the password "demo-password".
//
//   npm run seed-demo                          empty database only
//   node scripts/seedDemo.js --if-empty        skip quietly if there is data (Docker)
//   node scripts/seedDemo.js --reset-everything  DELETE ALL DATA, then seed (public demo)
//
// A demo admin is created only when DEMO_ADMIN_PASSWORD is set, so a public
// demo never has an admin with a published password.
require('dotenv').config();

const bcrypt = require('bcryptjs');
const { migrate, migrator } = require('../db/migrator');
const { sequelize, User, Admin, KeeperProfile, Pet, Booking, Review } = require('../models');
const { todayISO } = require('../utils/dates');

const PASSWORD = 'demo-password';

const day = (offset) => {
  const d = new Date(`${todayISO()}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + offset);
  return d.toISOString().slice(0, 10);
};

const person = (userName, firstName, lastName, type, city, extra = {}) => ({
  userName,
  firstName,
  lastName,
  type,
  city,
  email: `${userName}@example.com`,
  country: 'Greece',
  address: 'Demo street 1',
  birthdate: '1995-05-05',
  sex: 'O',
  phoneNumber: '+306900000000',
  ...extra,
});

const KEEPERS = [
  [person('eleni_k', 'Eleni', 'Kostaki', 'PETKEEPER', 'Heraklion', { sex: 'F' }),
    { bio: 'Vet nursing student with a fenced garden. Happy with energetic dogs and shy cats alike.', dailyRate: 22, acceptedSpecies: ['DOG', 'CAT'] }],
  [person('giorgos_p', 'Giorgos', 'Papadakis', 'PETKEEPER', 'Heraklion', { sex: 'M' }),
    { bio: 'Retired teacher, home all day. I keep birds myself and know my way around cages and feeding plans.', dailyRate: 15, acceptedSpecies: ['BIRD', 'RABBIT', 'RODENT', 'FISH'] }],
  [person('anna_m', 'Anna', 'Mavraki', 'PETKEEPER', 'Thessaloniki', { sex: 'F' }),
    { bio: 'Dog trainer for 6 years. Daily long walks, photo updates every evening, medication no problem.', dailyRate: 30, acceptedSpecies: ['DOG'] }],
  [person('nikos_t', 'Nikos', 'Tzanakis', 'PETKEEPER', 'Chania', { sex: 'M' }),
    { bio: 'Quiet apartment, cat lover. I work from home and can give insulin or other daily meds.', dailyRate: 18, acceptedSpecies: ['CAT', 'REPTILE'] }],
];

const OWNERS = [
  person('maria_o', 'Maria', 'Oikonomou', 'PETOWNER', 'Heraklion', { sex: 'F' }),
  person('kostas_d', 'Kostas', 'Dimitriou', 'PETOWNER', 'Thessaloniki', { sex: 'M' }),
];

async function main() {
  if (process.argv.includes('--reset-everything')) {
    console.log('Resetting the database to fresh demo data.');
    await migrator.down({ to: 0 });
  }
  await migrate();
  if ((await User.count()) > 0) {
    // --if-empty (used by Docker on every start) makes this a quiet no-op.
    if (process.argv.includes('--if-empty')) return console.log('Database already has data; skipping demo seed.');
    throw new Error('The database already has users. Seed only an empty database.');
  }

  const passwordHash = await bcrypt.hash(PASSWORD, Number(process.env.BCRYPT_ROUNDS) || 12);

  await sequelize.transaction(async (transaction) => {
    const opts = { transaction };
    for (const [keeper, profile] of KEEPERS) {
      await User.create({ ...keeper, passwordHash }, opts);
      await KeeperProfile.create({ ...profile, userName: keeper.userName }, opts);
    }
    for (const owner of OWNERS) await User.create({ ...owner, passwordHash }, opts);
    if (process.env.DEMO_ADMIN_PASSWORD) {
      const adminHash = await bcrypt.hash(process.env.DEMO_ADMIN_PASSWORD, Number(process.env.BCRYPT_ROUNDS) || 12);
      await Admin.create({ userName: 'demo_admin', passwordHash: adminHash }, opts);
    }

    const rex = await Pet.create({ ownerUserName: 'maria_o', name: 'Rex', species: 'DOG', breed: 'Labrador', birthYear: 2019, weightKg: 31, careNotes: 'Two walks a day. Dry food morning and evening, no chicken (allergy).' }, opts);
    const luna = await Pet.create({ ownerUserName: 'maria_o', name: 'Luna', species: 'CAT', breed: 'Tabby', birthYear: 2021, weightKg: 4.2, careNotes: 'Hides under the bed for the first day. Wet food twice a day.' }, opts);
    const kiwi = await Pet.create({ ownerUserName: 'kostas_d', name: 'Kiwi', species: 'BIRD', breed: 'Budgie', birthYear: 2023, careNotes: 'Cover the cage at night.' }, opts);
    const bruno = await Pet.create({ ownerUserName: 'kostas_d', name: 'Bruno', species: 'DOG', breed: 'Beagle', birthYear: 2020, weightKg: 12 }, opts);

    const booking = (data) => Booking.create(data, opts);
    const past1 = await booking({ ownerUserName: 'maria_o', keeperUserName: 'eleni_k', petId: rex.id, startDate: day(-40), endDate: day(-36), status: 'ACCEPTED', totalPrice: 110 });
    const past2 = await booking({ ownerUserName: 'kostas_d', keeperUserName: 'anna_m', petId: bruno.id, startDate: day(-20), endDate: day(-18), status: 'ACCEPTED', totalPrice: 90 });
    const past3 = await booking({ ownerUserName: 'kostas_d', keeperUserName: 'eleni_k', petId: bruno.id, startDate: day(-12), endDate: day(-10), status: 'ACCEPTED', totalPrice: 66 });
    await booking({ ownerUserName: 'maria_o', keeperUserName: 'nikos_t', petId: luna.id, startDate: day(-8), endDate: day(-5), status: 'ACCEPTED', totalPrice: 72 });
    await booking({ ownerUserName: 'maria_o', keeperUserName: 'eleni_k', petId: rex.id, startDate: day(14), endDate: day(17), status: 'ACCEPTED', totalPrice: 88, message: 'Going to Athens for a wedding.' });
    await booking({ ownerUserName: 'maria_o', keeperUserName: 'eleni_k', petId: luna.id, startDate: day(25), endDate: day(28), status: 'REQUESTED', totalPrice: 88, message: 'Luna is shy but sweet. Could you visit once before?' });
    await booking({ ownerUserName: 'kostas_d', keeperUserName: 'eleni_k', petId: bruno.id, startDate: day(30), endDate: day(31), status: 'REQUESTED', totalPrice: 44 });
    await booking({ ownerUserName: 'kostas_d', keeperUserName: 'giorgos_p', petId: kiwi.id, startDate: day(5), endDate: day(9), status: 'REQUESTED', totalPrice: 75 });

    const review = (b, rating, comment) =>
      Review.create({ bookingId: b.id, ownerUserName: b.ownerUserName, keeperUserName: b.keeperUserName, rating, comment }, opts);
    await review(past1, 5, 'Rex came back tired and happy. Eleni sent photos every evening.');
    await review(past2, 4, 'Great walks, Bruno loved her. Slightly late reply to messages.');
    await review(past3, 5, 'Second time with Eleni, just as good.');
  });

  console.log('Demo data created. Log in with any of these (password "demo-password"):');
  console.log('  owners:  maria_o, kostas_d');
  console.log('  keepers: eleni_k, giorgos_p, anna_m, nikos_t');
  if (process.env.DEMO_ADMIN_PASSWORD) console.log('  admin:   demo_admin (password from DEMO_ADMIN_PASSWORD)');
}

main()
  .catch((err) => {
    console.error(err.message);
    process.exitCode = 1;
  })
  .finally(() => sequelize.close());
