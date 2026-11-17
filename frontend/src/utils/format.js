export const SPECIES = ['DOG', 'CAT', 'BIRD', 'RABBIT', 'RODENT', 'REPTILE', 'FISH', 'OTHER'];

export const SPECIES_LABELS = {
  DOG: 'Dog',
  CAT: 'Cat',
  BIRD: 'Bird',
  RABBIT: 'Rabbit',
  RODENT: 'Rodent',
  REPTILE: 'Reptile',
  FISH: 'Fish',
  OTHER: 'Other',
};

export const STATUS_LABELS = {
  REQUESTED: 'Waiting for keeper',
  ACCEPTED: 'Accepted',
  DECLINED: 'Declined',
  CANCELLED: 'Cancelled',
};

const DAY_MS = 24 * 60 * 60 * 1000;

// Today in the browser's time zone, as YYYY-MM-DD.
export function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);
}

export const daysInclusive = (start, end) =>
  Math.round((Date.parse(end) - Date.parse(start)) / DAY_MS) + 1;

const dateFormat = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
export const formatDate = (iso) => dateFormat.format(new Date(`${iso}T12:00:00`));

const money = new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' });
export const formatPrice = (amount) => money.format(amount);

export const stars = (rating) => '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating));
