const BOGOTA_TIME_ZONE = 'America/Bogota';

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const getBogotaDateParts = (date, includeTime, includeSeconds = false) => {
  const options = {
    timeZone: BOGOTA_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  };
  if (includeTime) {
    options.hour = '2-digit';
    options.minute = '2-digit';
    options.hourCycle = 'h23';
    if (includeSeconds) options.second = '2-digit';
  }

  return Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', options)
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map(({ type, value }) => [type, value])
  );
};

export const formatBogotaDate = (value, fallback = 'No definida') => {
  const date = parseDate(value);
  if (!date) return fallback;
  const { day, month, year } = getBogotaDateParts(date, false);
  return `${day}/${month}/${year}`;
};

export const formatBogotaDateTime = (
  value,
  { fallback = 'No disponible', includeSeconds = false, separator = ' · ' } = {}
) => {
  const date = parseDate(value);
  if (!date) return fallback;
  const { day, month, year, hour, minute, second } = getBogotaDateParts(date, true, includeSeconds);
  const time = [hour, minute, ...(includeSeconds ? [second] : [])].join(':');
  return `${day}/${month}/${year}${separator}${time}`;
};
