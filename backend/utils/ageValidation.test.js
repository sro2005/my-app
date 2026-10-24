const test = require('node:test');
const assert = require('node:assert/strict');
const moment = require('moment-timezone');
const {
  isAdult,
  isColombianCalendarDate,
  toColombianCalendarDate
} = require('./ageValidation');

test('validates real YYYY-MM-DD calendar dates in Colombia', () => {
  assert.equal(isColombianCalendarDate('2000-01-01'), true);
  assert.equal(isColombianCalendarDate('2024-02-29'), true);
  assert.equal(isColombianCalendarDate('2025-02-29'), false);
  assert.equal(isColombianCalendarDate('2026-13-01'), false);
  assert.equal(isColombianCalendarDate('01/02/2000'), false);
});

test('evaluates legal age by the Colombia calendar date, including the birthday boundary', () => {
  const today = moment.tz('America/Bogota');
  const birthdayToday = today.clone().subtract(18, 'years').format('YYYY-MM-DD');
  const birthdayTomorrow = today.clone().subtract(18, 'years').add(1, 'day').format('YYYY-MM-DD');
  const bornYesterdayBeyond18 = today.clone().subtract(18, 'years').subtract(1, 'day').format('YYYY-MM-DD');

  assert.equal(isAdult(birthdayToday), true);
  assert.equal(isAdult(birthdayTomorrow), false);
  assert.equal(isAdult(bornYesterdayBeyond18), true);
  assert.equal(isAdult('invalid-date'), false);
});

test('stores date-of-birth values at midnight in Colombia without changing the calendar day', () => {
  const value = '2000-01-01';
  const stored = toColombianCalendarDate(value);
  assert.ok(stored instanceof Date);
  assert.equal(moment(stored).tz('America/Bogota').format('YYYY-MM-DD'), value);
  assert.equal(toColombianCalendarDate('2025-02-29'), null);
});
