const COORDINATE_FIELDS = new Set(['latitude', 'longitude', 'lat', 'lng']);
const TIMESTAMP_KEY_REGEX = /(_at|_on|timestamp|date)$/i;
const ISO_DATE_PREFIX = /^\d{4}-\d{2}-\d{2}T/;

const formatter = new Intl.DateTimeFormat('en-US', {
  dateStyle: 'medium',
  timeStyle: 'short'
});

const isTimestampKey = (key) => {
  if (!key) return false;
  return TIMESTAMP_KEY_REGEX.test(key);
};

const parseDate = (value) => {
  if (value instanceof Date) return value;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed;
};

const formatTimestamp = (value) => {
  const parsed = parseDate(value);
  if (!parsed) return String(value);
  return formatter.format(parsed);
};

const ONE_MILLION = 1_000_000;
const ONE_BILLION = 1_000_000_000;

export const formatPopulationSummary = (population) => {
  if (population >= ONE_BILLION) return `${(population / ONE_BILLION).toFixed(1)}B`;
  if (population >= ONE_MILLION) return `${(population / ONE_MILLION).toFixed(1)}M`;
  return population.toLocaleString();
};

export const formatCellValue = (value, key) => {
  if (value === null || value === undefined || value === '') return '-';

  if (typeof value === 'object') {
    if (value instanceof Date) return formatTimestamp(value);
    if (key === 'coordinates' && value !== null) {
      const lat = value.latitude ?? value.lat;
      const lng = value.longitude ?? value.lng;
      if (lat != null && lng != null) return `${lat}, ${lng}`;
      return '-';
    }
    return JSON.stringify(value);
  }

  if (typeof value === 'number') {
    if (COORDINATE_FIELDS.has(key)) return String(value);
    return value.toLocaleString();
  }

  const stringValue = String(value);
  if (isTimestampKey(key) || ISO_DATE_PREFIX.test(stringValue)) {
    return formatTimestamp(stringValue);
  }

  return stringValue;
};
