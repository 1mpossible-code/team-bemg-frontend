import axios from 'axios';

const baseURL =
  process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

const API = axios.create({ baseURL });

export const getCountries = () => API.get('/countries');

export const getStates = (countryCode) =>
  API.get(`/states?country_code=${countryCode}`);

export const getCities = (stateCode) =>
  API.get(`/cities?state_code=${stateCode}`);

export default API;