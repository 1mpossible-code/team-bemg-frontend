import axios from 'axios';

const baseURL =
  process.env.REACT_APP_API_BASE_URL || 'http://127.0.0.1:3000/';

const API = axios.create({ baseURL });

// Countries API
export const getCountries = (params) => API.get('/countries', { params });
export const getCountry = (code) => API.get(`/countries/${code}`);
export const createCountry = (data) => API.post('/countries', data);
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
export const getCity = (code) => API.get(`/cities/${code}`);
export const createCity = (data) => API.post('/cities', data);
export const updateCity = (code, data) => API.put(`/cities/${code}`, data);
export const deleteCity = (code) => API.delete(`/cities/${code}`);

export default API;
