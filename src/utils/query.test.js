import { normalizeQueryParams } from './query';

describe('normalizeQueryParams', () => {
  it('omits empty null and undefined values', () => {
    expect(
      normalizeQueryParams({
        search: '',
        stateCode: null,
        sortBy: undefined,
        page: '2',
      })
    ).toEqual({
      page: '2',
    });
  });

  it('converts numeric string values for configured numeric keys', () => {
    expect(
      normalizeQueryParams(
        {
          minPopulation: ' 1200 ',
          page: '0',
          search: 'Austin',
        },
        ['minPopulation', 'page']
      )
    ).toEqual({
      minPopulation: 1200,
      page: 0,
      search: 'Austin',
    });
  });

  it('drops whitespace-only values for configured numeric keys', () => {
    expect(
      normalizeQueryParams(
        {
          minPopulation: '   ',
          search: '  Austin  ',
        },
        ['minPopulation']
      )
    ).toEqual({
      search: '  Austin  ',
    });
  });

  it('preserves whitespace for non-numeric keys', () => {
    expect(
      normalizeQueryParams(
        {
          search: '  Austin  ',
        },
        ['minPopulation']
      )
    ).toEqual({
      search: '  Austin  ',
    });
  });

  it('keeps original string values when numeric parsing fails', () => {
    expect(
      normalizeQueryParams(
        {
          minPopulation: '12abc',
          maxPopulation: '1,000',
        },
        ['minPopulation', 'maxPopulation']
      )
    ).toEqual({
      minPopulation: '12abc',
      maxPopulation: '1,000',
    });
  });
});
