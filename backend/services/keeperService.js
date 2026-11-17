const { Op, fn, col, where } = require('sequelize');
const { User, KeeperProfile, Review } = require('../models');
const { PUBLIC_FIELDS, MEMBER_FIELDS } = require('./userService');
const { HttpError } = require('../utils/httpError');

const PROFILE_FIELDS = ['bio', 'dailyRate', 'acceptedSpecies'];

async function getOwnProfile(userName) {
  const profile = await KeeperProfile.findByPk(userName);
  return profile ? profile.get({ plain: true }) : null;
}

async function saveOwnProfile(userName, data) {
  const existing = await KeeperProfile.findByPk(userName);
  const profile = existing
    ? await existing.update(data)
    : await KeeperProfile.create({ ...data, userName });
  return profile.get({ plain: true });
}

// { userName: { average, count } } for the given keepers, in one grouped query.
async function ratingsFor(userNames) {
  if (userNames.length === 0) return {};
  const rows = await Review.findAll({
    attributes: [
      'keeperUserName',
      [fn('AVG', col('rating')), 'average'],
      [fn('COUNT', col('id')), 'count'],
    ],
    where: { keeperUserName: { [Op.in]: userNames } },
    group: ['keeperUserName'],
    raw: true,
  });
  return Object.fromEntries(
    rows.map((r) => [
      r.keeperUserName,
      { average: Math.round(Number(r.average) * 10) / 10, count: Number(r.count) },
    ])
  );
}

const NO_RATING = { average: null, count: 0 };

function toKeeperCard(user, ratings) {
  const { keeperProfile, ...person } = user.get({ plain: true });
  return { ...person, ...keeperProfile, rating: ratings[person.userName] || NO_RATING };
}

const profileInclude = (profileWhere = {}) => ({
  model: KeeperProfile,
  as: 'keeperProfile',
  required: true, // keepers without a profile are not listed
  where: profileWhere,
  attributes: PROFILE_FIELDS,
});

// Public keeper search. Contact details are included only for logged-in viewers.
async function search({ city, species, maxRate }, viewer) {
  const userWhere = { type: 'PETKEEPER' };
  if (city) userWhere[Op.and] = [where(fn('LOWER', col('city')), city.toLowerCase())];

  const profileWhere = {};
  if (species) profileWhere.acceptedSpecies = { [Op.like]: `%,${species},%` };
  if (maxRate != null) profileWhere.dailyRate = { [Op.lte]: maxRate };

  const keepers = await User.findAll({
    where: userWhere,
    attributes: viewer ? MEMBER_FIELDS : PUBLIC_FIELDS,
    include: [profileInclude(profileWhere)],
    order: [
      [{ model: KeeperProfile, as: 'keeperProfile' }, 'dailyRate', 'ASC'],
      ['lastName', 'ASC'],
    ],
  });

  const ratings = await ratingsFor(keepers.map((k) => k.userName));
  return keepers.map((k) => toKeeperCard(k, ratings));
}

// One keeper's public page: profile, rating and reviews.
async function getKeeper(userName, viewer) {
  const keeper = await User.findOne({
    where: { userName, type: 'PETKEEPER' },
    attributes: viewer ? MEMBER_FIELDS : PUBLIC_FIELDS,
    include: [profileInclude()],
  });
  if (!keeper) throw new HttpError(404, 'Keeper not found');

  const [ratings, reviews] = await Promise.all([
    ratingsFor([userName]),
    Review.findAll({
      where: { keeperUserName: userName },
      attributes: ['id', 'rating', 'comment', 'createdAt'],
      include: [{ model: User, as: 'owner', attributes: ['firstName'] }],
      order: [['createdAt', 'DESC']],
    }),
  ]);

  return {
    ...toKeeperCard(keeper, ratings),
    reviews: reviews.map((r) => {
      const { owner, ...review } = r.get({ plain: true });
      return { ...review, ownerFirstName: owner?.firstName ?? 'Former user' };
    }),
  };
}

module.exports = { getOwnProfile, saveOwnProfile, search, getKeeper };
