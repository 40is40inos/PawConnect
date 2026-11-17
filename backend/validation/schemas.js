// Request body schemas. Strict objects reject unknown fields, so a client
// cannot slip in fields like "type" or "passwordHash" (mass assignment).
const { z } = require('zod');
const { USER_TYPES, SEXES } = require('../models');

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

module.exports = { registerSchema, loginSchema, updateProfileSchema };
