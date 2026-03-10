import axios from 'axios';

const baseURL = process.env.REACT_APP_API_BASE_URL

if (typeof process.env.REACT_APP_API_BASE_URL === 'undefined') {
  // Handle the missing variable case
  throw new Error("Missing env REACT_APP_API_BASE_URL, please check .env configuration");
}

const API = axios.create({ baseURL });
const REQUEST_TIMEOUT_MS = 10000;

// Countries API
export const getCountries = (params) => API.get('/countries', { params });
export const getCountry = (code) => API.get(`/countries/${code}`);
export const createCountry = (data) =>
  API.post('/countries', data, { timeout: REQUEST_TIMEOUT_MS });
export const updateCountry = (code, data) => API.put(`/countries/${code}`, data);
export const deleteCountry = (code) => API.delete(`/countries/${code}`);

// States API
export const getStates = (params) => API.get('/states', { params });
export const getStatesAll = () => API.get('/states');
export const getState = (code) => API.get(`/states/${code}`);
export const createState = (data) => API.post('/states', data);
export const updateState = (code, data) => API.put(`/states/${code}`, data);
export const deleteState = (code) => API.delete(`/states/${code}`);

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
