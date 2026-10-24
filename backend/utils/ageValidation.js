const moment = require('moment-timezone');

const isColombianCalendarDate = (value) =>
  typeof value === 'string' &&
  moment(value, 'YYYY-MM-DD', true).isValid();

const isAdult = (value) => {
  let birthDate;

  if (typeof value === 'string') {
    if (!isColombianCalendarDate(value)) return false;
    birthDate = moment.tz(value, 'YYYY-MM-DD', 'America/Bogota');
  } else if (value instanceof Date && !Number.isNaN(value.getTime())) {
    // Legacy date-only forms were stored at midnight UTC. Preserve their UTC
    // calendar components rather than shifting the birthday to the prior day.
    birthDate = moment.utc(value);
  } else {
    return false;
  }

  const today = moment.tz('America/Bogota');
  let age = today.year() - birthDate.year();
  if (
    today.month() < birthDate.month() ||
    (today.month() === birthDate.month() && today.date() < birthDate.date())
  ) {
    age -= 1;
  }
  return age >= 18;
};

const toColombianCalendarDate = (value) =>
  isColombianCalendarDate(value)
    ? moment.tz(value, 'YYYY-MM-DD', 'America/Bogota').toDate()
    : null;

module.exports = { isColombianCalendarDate, isAdult, toColombianCalendarDate };
