import { buildSearchFromFilters, parseFiltersFromSearch } from './urlFilters';

describe('urlFilters', () => {
  describe('parseFiltersFromSearch', () => {
    it('preserves defaults and only reads known keys from the query string', () => {
      const defaults = {
        stateCode: '',
        minPopulation: '1000',
        sortBy: 'name',
      };

      expect(
        parseFiltersFromSearch(
          '?stateCode=CA&unknown=value&sortBy=population',
          defaults
        )
      ).toEqual({
        stateCode: 'CA',
        minPopulation: '1000',
        sortBy: 'population',
      });
    });

    it('treats present empty params as empty strings', () => {
      const defaults = {
        search: 'Austin',
        minPopulation: '5000',
      };

      expect(parseFiltersFromSearch('?search=&minPopulation=', defaults)).toEqual({
        search: '',
        minPopulation: '',
      });
    });
  });

  describe('buildSearchFromFilters', () => {
    it('omits empty values and stringifies kept values', () => {
      expect(
        buildSearchFromFilters({
          search: 'Austin',
          stateCode: '',
          minPopulation: 0,
          page: null,
          sortBy: undefined,
        })
      ).toBe('?search=Austin&minPopulation=0');
    });

    it('returns an empty string when every filter is omitted', () => {
      expect(
        buildSearchFromFilters({
          search: '',
          stateCode: null,
          sortBy: undefined,
        })
      ).toBe('');
    });

    it('preserves whitespace in non-empty values', () => {
      expect(
        buildSearchFromFilters({
          search: '  New York  ',
        })
      ).toBe('?search=++New+York++');
    });
  });
});
