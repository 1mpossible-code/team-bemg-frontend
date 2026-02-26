export const normalizeQueryParams = (params = {}, numericKeys = []) => {
  const cleaned = {};

  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    let nextValue = value;

    if (numericKeys.includes(key) && typeof value === 'string') {
      const trimmed = value.trim();

      if (trimmed === '') {
        return;
      }

      const parsed = Number(trimmed);
      if (!Number.isNaN(parsed)) {
        nextValue = parsed;
      }
    }

    cleaned[key] = nextValue;
  });

  return cleaned;
};
