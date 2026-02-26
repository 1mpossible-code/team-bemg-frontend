export const parseFiltersFromSearch = (search, defaults) => {
  const params = new URLSearchParams(search);
  const nextFilters = { ...defaults };

  Object.keys(defaults).forEach((key) => {
    if (params.has(key)) {
      nextFilters[key] = params.get(key) || '';
    }
  });

  return nextFilters;
};

export const buildSearchFromFilters = (filters) => {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) {
      return;
    }

    params.set(key, String(value));
  });

  const queryString = params.toString();
  return queryString ? `?${queryString}` : '';
};
