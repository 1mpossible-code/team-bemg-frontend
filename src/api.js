import axios from 'axios';

const API = axios.create({
  baseURL: 'http://localhost:5000',
});

export const getCountries = () => API.get('/countries');
export const getStates = (countryCode) => API.get(`/states?country_code=${countryCode}`);
export const getCities = (stateCode) => API.get(`/cities?state_code=${stateCode}`);

export default API;