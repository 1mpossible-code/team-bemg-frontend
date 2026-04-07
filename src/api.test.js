jest.mock('axios', () => {
  const mockGet = jest.fn().mockResolvedValue({ data: [] });
  const mockDelete = jest.fn().mockResolvedValue({ data: {} });
  const mock = {
    create: jest.fn(() => ({ get: mockGet, delete: mockDelete }))
  };
  mock.__mockGet = mockGet;
  mock.__mockDelete = mockDelete;
  return mock;
});

import axios from 'axios';
import {
  deleteCountry,
  deleteState,
  getCountries,
  getCountryDeleteImpact,
  getStateDeleteImpact,
  getStates,
  getCities
} from './api';

const mockGet = axios.__mockGet;
const mockDelete = axios.__mockDelete;

describe('api', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockDelete.mockClear();
  });

  test('getCountries calls /countries', () => {
    getCountries();
    expect(mockGet).toHaveBeenCalledWith('/countries', { params: undefined });
  });

  test('getCountryDeleteImpact calls /countries/:code/delete-impact', () => {
    getCountryDeleteImpact('US');
    expect(mockGet).toHaveBeenCalledWith('/countries/US/delete-impact');
  });

  test('deleteCountry calls /countries/:code without cascade by default', () => {
    deleteCountry('US');
    expect(mockDelete).toHaveBeenCalledWith('/countries/US', {
      params: { cascade: undefined }
    });
  });

  test('deleteCountry calls /countries/:code with cascade=true when requested', () => {
    deleteCountry('US', { cascade: true });
    expect(mockDelete).toHaveBeenCalledWith('/countries/US', {
      params: { cascade: true }
    });
  });

  test('getStates calls /states with params', () => {
    getStates({ country_code: 'US' });
    expect(mockGet).toHaveBeenCalledWith('/states', {
      params: { country_code: 'US' }
    });
  });

  test('getStateDeleteImpact calls /states/:code/delete-impact', () => {
    getStateDeleteImpact('CA');
    expect(mockGet).toHaveBeenCalledWith('/states/CA/delete-impact');
  });

  test('deleteState calls /states/:code without cascade by default', () => {
    deleteState('CA');
    expect(mockDelete).toHaveBeenCalledWith('/states/CA', {
      params: { cascade: undefined }
    });
  });

  test('deleteState calls /states/:code with cascade=true when requested', () => {
    deleteState('CA', { cascade: true });
    expect(mockDelete).toHaveBeenCalledWith('/states/CA', {
      params: { cascade: true }
    });
  });

  test('getCities calls /cities with params', () => {
    getCities({ state_code: 'CA' });
    expect(mockGet).toHaveBeenCalledWith('/cities', {
      params: { state_code: 'CA' }
    });
  });
});
