const { sequelize, User, Admin, Pet, KeeperProfile, Booking, Review } = require('../models');
const { migrator } = require('../db/migrator');

const MODELS = [User, Admin, Pet, KeeperProfile, Booking, Review];

const tableNames = async () =>
  (await sequelize.getQueryInterface().showAllTables())
    .map((t) => (typeof t === 'string' ? t : t.tableName))
    .filter((name) => name !== 'SequelizeMeta');

beforeAll(async () => {
  await migrator.down({ to: 0 });
  await migrator.up();
});
afterAll(() => sequelize.close());

test('migrations create exactly the columns the models expect', async () => {
  const qi = sequelize.getQueryInterface();
  for (const model of MODELS) {
    const columns = Object.keys(await qi.describeTable(model.getTableName())).sort();
    const expected = Object.values(model.rawAttributes)
      .map((attr) => attr.field)
      .sort();
    expect({ table: model.getTableName(), columns }).toEqual({ table: model.getTableName(), columns: expected });
  }
});

test('nothing is pending after migrating', async () => {
  expect(await migrator.pending()).toEqual([]);
});

test('migrations can be undone and re-applied', async () => {
  await migrator.down({ to: 0 });
  expect(await tableNames()).toEqual([]);

  await migrator.up();
  expect((await tableNames()).sort()).toEqual(MODELS.map((m) => m.getTableName()).sort());
});

test('foreign keys cascade when a user is deleted', async () => {
  await User.create({
    userName: 'cascade_owner',
    email: 'c@example.com',
    passwordHash: 'x'.repeat(60),
    firstName: 'C',
    lastName: 'O',
    birthdate: '1990-01-01',
    sex: 'O',
    country: 'Greece',
    city: 'Heraklion',
    address: 'Street 1',
    phoneNumber: '+306900000000',
    type: 'PETOWNER',
  });
  await Pet.create({ ownerUserName: 'cascade_owner', name: 'Rex', species: 'DOG' });

  // Delete through raw SQL so only the database's ON DELETE CASCADE can remove the pet.
  await sequelize.getQueryInterface().bulkDelete('users', { userName: 'cascade_owner' });
  expect(await Pet.count({ paranoid: false })).toBe(0);
});
