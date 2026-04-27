import axios from 'axios';
import {
  ACCESS_TOKEN_STORAGE_KEY,
  applyAccessToken,
  clearAccessToken,
  deleteCountry,
  deleteState,
  getCountries,
  getCountryDeleteImpact,
  getStateDeleteImpact,
  getStates,
  getCities,
  getStoredAccessTokenRole,
  getStoredAccessToken,
  storeAccessToken
} from './api';

jest.mock('axios', () => {
  const mockGet = jest.fn().mockResolvedValue({ data: [] });
  const mockDelete = jest.fn().mockResolvedValue({ data: {} });
  const mockClient = {
    get: mockGet,
    delete: mockDelete,
    defaults: { headers: { common: {} } }
  };
  const mock = {
    create: jest.fn(() => mockClient)
  };
  mock.__mockGet = mockGet;
  mock.__mockDelete = mockDelete;
  mock.__mockClient = mockClient;
  return mock;
});


const mockGet = axios.__mockGet;
const mockDelete = axios.__mockDelete;
const mockClient = axios.__mockClient;

describe('api', () => {
  beforeEach(() => {
    mockGet.mockClear();
    mockDelete.mockClear();
    window.localStorage.clear();
    delete mockClient.defaults.headers.common.Authorization;
  });

  test('storeAccessToken persists token and applies authorization header', () => {
    storeAccessToken('abc123');

    expect(getStoredAccessToken()).toBe('abc123');
    expect(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY)).toBe('abc123');
    expect(mockClient.defaults.headers.common.Authorization).toBe('Bearer abc123');
  });

  test('clearAccessToken removes token and authorization header', () => {
    storeAccessToken('abc123');
    clearAccessToken();

    expect(getStoredAccessToken()).toBeNull();
    expect(mockClient.defaults.headers.common.Authorization).toBeUndefined();
  });

  test('applyAccessToken clears authorization header when token is empty', () => {
    applyAccessToken('abc123');
    applyAccessToken(null);

    expect(mockClient.defaults.headers.common.Authorization).toBeUndefined();
  });

  test('getStoredAccessTokenRole returns role from token payload', () => {
    const payload = window.btoa(JSON.stringify({ role: 'admin' }));
    const token = `header.${payload}.signature`;
    storeAccessToken(token);

    expect(getStoredAccessTokenRole()).toBe('admin');
  });

  test('getStoredAccessTokenRole returns null for malformed token payload', () => {
    storeAccessToken('bad-token');

    expect(getStoredAccessTokenRole()).toBeNull();
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
