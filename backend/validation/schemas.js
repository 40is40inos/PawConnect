// Request body schemas. Strict objects reject unknown fields, so a client
// cannot slip in fields like "type" or "passwordHash" (mass assignment).
const { z } = require('zod');
const { USER_TYPES, SEXES, SPECIES } = require('../models');
const { todayISO, daysInclusive } = require('../utils/dates');

const name = z.string().trim().min(1).max(50);
const place = z.string().trim().min(1).max(60);
// bcrypt only uses the first 72 bytes of a password.
const password = z.string().min(8, 'must be at least 8 characters').max(72);
const birthdate = z.iso
  .date()
  .refine((d) => new Date(d) < new Date(), 'must be in the past');
const phoneNumber = z
  .string()
  .trim()
  .regex(/^\+?[0-9]{7,15}$/, 'must be 7-15 digits, optionally starting with +');

const registerSchema = z.strictObject({
  userName: z
    .string()
    .trim()
    .regex(/^[A-Za-z0-9_]{3,30}$/, 'must be 3-30 letters, digits or underscores'),
  password,
  email: z.email().max(255).toLowerCase(),
  firstName: name,
  lastName: name,
  birthdate,
  sex: z.enum(SEXES),
  type: z.enum(USER_TYPES),
  country: place,
  city: place,
  address: z.string().trim().min(1).max(120),
  phoneNumber,
});

const loginSchema = z.strictObject({
  username: z.string().trim().min(1).max(30),
  password: z.string().min(1).max(72),
});

// Username, email and account type cannot be changed after registration.
const updateProfileSchema = z
  .strictObject({
    firstName: name,
    lastName: name,
    birthdate,
    sex: z.enum(SEXES),
    country: place,
    city: place,
    address: z.string().trim().min(1).max(120),
    phoneNumber,
    password,
    currentPassword: z.string().min(1).max(72),
  })
  .partial()
  .refine((d) => !d.password || d.currentPassword, {
    message: 'is required to set a new password',
    path: ['currentPassword'],
  });

// ---- marketplace ----

const optionalText = (max) => z.string().trim().max(max).nullable().optional();

const petFields = {
  name: z.string().trim().min(1).max(40),
  species: z.enum(SPECIES),
  breed: optionalText(60),
  birthYear: z.number().int().min(1980).max(new Date().getFullYear()).nullable().optional(),
  weightKg: z.number().positive().max(200).nullable().optional(),
  careNotes: optionalText(1000),
};
const petSchema = z.strictObject(petFields);
const petUpdateSchema = z.strictObject(petFields).partial();

const keeperProfileSchema = z.strictObject({
  bio: z.string().trim().min(20, 'must be at least 20 characters').max(1000),
  dailyRate: z.number().min(1).max(500).multipleOf(0.01),
  acceptedSpecies: z
    .array(z.enum(SPECIES))
    .min(1, 'choose at least one species')
    .transform((list) => [...new Set(list)]),
});

const MAX_STAY_DAYS = 30;

const bookingSchema = z
  .strictObject({
    keeperUserName: z.string().trim().min(1).max(30),
    petId: z.number().int().positive(),
    startDate: z.iso.date(),
    endDate: z.iso.date(),
    message: optionalText(500),
  })
  .refine((b) => b.startDate >= todayISO(), {
    message: 'cannot be in the past',
    path: ['startDate'],
  })
  .refine((b) => b.endDate >= b.startDate, {
    message: 'must be on or after the start date',
    path: ['endDate'],
  })
  .refine((b) => daysInclusive(b.startDate, b.endDate) <= MAX_STAY_DAYS, {
    message: `a stay can be at most ${MAX_STAY_DAYS} days`,
    path: ['endDate'],
  });

const reviewSchema = z.strictObject({
  rating: z.number().int().min(1).max(5),
  comment: optionalText(1000),
});

// Query strings arrive as text, so numbers are coerced.
const keeperSearchSchema = z.object({
  city: z.string().trim().max(60).optional().transform((c) => c || undefined),
  species: z.enum(SPECIES).optional(),
  maxRate: z.coerce.number().positive().optional(),
});

module.exports = {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  petSchema,
  petUpdateSchema,
  keeperProfileSchema,
  bookingSchema,
  reviewSchema,
  keeperSearchSchema,
};
