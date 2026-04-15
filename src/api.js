import axios from 'axios';

const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8000/';
const baseURL = process.env.REACT_APP_API_BASE_URL?.trim() || DEFAULT_API_BASE_URL;

const API = axios.create({ baseURL });
const REQUEST_TIMEOUT_MS = 10000;
export const ACCESS_TOKEN_STORAGE_KEY = 'team-bemg-access-token';

export const applyAccessToken = (token) => {
  if (token) {
    API.defaults.headers.common.Authorization = `Bearer ${token}`;
    return;
  }

  delete API.defaults.headers.common.Authorization;
};

export const getStoredAccessToken = () => window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);

export const storeAccessToken = (token) => {
  window.localStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, token);
  applyAccessToken(token);
};

export const clearAccessToken = () => {
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  applyAccessToken(null);
};

applyAccessToken(getStoredAccessToken());

// Continents API
export const getContinents = () => API.get('/continents');

// Countries API
export const getCountries = (params) => API.get('/countries', { params });
export const getCountry = (code) => API.get(`/countries/${code}`);
export const createCountry = (data) =>
  API.post('/countries', data, { timeout: REQUEST_TIMEOUT_MS });
export const updateCountry = (code, data) => API.put(`/countries/${code}`, data);
export const getCountryDeleteImpact = (code) =>
  API.get(`/countries/${code}/delete-impact`);
export const deleteCountry = (code, options = {}) =>
  API.delete(`/countries/${code}`, { params: { cascade: options.cascade } });

// States API
export const getStates = (params) => API.get('/states', { params });
export const getStatesAll = () => API.get('/states');
export const getState = (code) => API.get(`/states/${code}`);
export const createState = (data) => API.post('/states', data);
export const updateState = (code, data) => API.put(`/states/${code}`, data);
export const getStateDeleteImpact = (code) =>
  API.get(`/states/${code}/delete-impact`);
export const deleteState = (code, options = {}) =>
  API.delete(`/states/${code}`, { params: { cascade: options.cascade } });

// Cities API
export const getCities = (params) => API.get('/cities', { params });
export const getCitiesAll = () => API.get('/cities');
export const getCity = (stateCode, cityName) =>
  API.get(`/cities/${stateCode}/${cityName}`);
export const createCity = (data) => API.post('/cities', data);
export const updateCity = (stateCode, cityName, data) =>
  API.put(`/cities/${stateCode}/${cityName}`, data);
export const deleteCity = (stateCode, cityName) =>
  API.delete(`/cities/${stateCode}/${cityName}`);

export default API;
