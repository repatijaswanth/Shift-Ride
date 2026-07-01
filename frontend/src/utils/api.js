import axios from 'axios';

const api = axios.create({ baseURL: process.env.REACT_APP_BACKEND_URL });

api.interceptors.request.use(config => {
  const t = localStorage.getItem('token');
  if (t) config.headers.Authorization = `Bearer ${t}`;
  return config;
});

export const registerAPI       = d      => api.post('/api/auth/register', d);
export const loginAPI          = d      => api.post('/api/auth/login', d);
export const createRideAPI     = d      => api.post('/api/rides/create', d);
export const joinRideAPI       = d      => api.post('/api/rides/join', d);
export const getActiveRidesAPI = ()     => api.get('/api/rides/active');
export const findMatchAPI      = (a, o) => api.get(`/api/rides/match?latitude=${a}&longitude=${o}`);
export const getMyRidesAPI     = ()     => api.get('/api/rides/my-rides');
export const getSavingsAPI     = ()     => api.get('/api/rides/savings');
export const updateLocationAPI = d      => api.post('/api/rides/location', d);
export const completeRideAPI   = id     => api.patch(`/api/rides/complete/${id}`);

export default api;
