const DAY_MS = 24 * 60 * 60 * 1000;

// Today's date (server time zone) as YYYY-MM-DD, the format of DATEONLY columns.
// ISO date strings compare correctly as plain strings.
function todayISO() {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60 * 1000).toISOString().slice(0, 10);
}

// Number of days a stay covers, counting both the first and the last day.
function daysInclusive(startDate, endDate) {
  return Math.round((Date.parse(endDate) - Date.parse(startDate)) / DAY_MS) + 1;
}

module.exports = { todayISO, daysInclusive };
