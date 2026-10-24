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
    // Compatibility for legacy dates already stored as Date objects.
    birthDate = moment(value).tz('America/Bogota');
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
