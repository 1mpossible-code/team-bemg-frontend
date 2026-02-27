jest.mock('axios', () => {
  const mockGet = jest.fn().mockResolvedValue({ data: [] });
  const mock = { create: jest.fn(() => ({ get: mockGet })) };
  mock.__mockGet = mockGet;
  return mock;
});

import axios from 'axios';
import { getCountries, getStates, getCities } from './api';

const mockGet = axios.__mockGet;

describe('api', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  test('getCountries calls /countries', () => {
    getCountries();
    expect(mockGet).toHaveBeenCalledWith('/countries', { params: undefined });
  });

  test('getStates calls /states with params', () => {
    getStates({ country_code: 'US' });
    expect(mockGet).toHaveBeenCalledWith('/states', {
      params: { country_code: 'US' }
    });
  });

  test('getCities calls /cities with params', () => {
    getCities({ state_code: 'CA' });
    expect(mockGet).toHaveBeenCalledWith('/cities', {
      params: { state_code: 'CA' }
    });
  });
});
