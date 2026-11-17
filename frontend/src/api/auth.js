import { api } from './client';

export const login = (username, password) =>
  api.post('/auth/login', { username, password }).then((res) => res.data);

export const register = (data) => api.post('/auth/register', data).then((res) => res.data);

export const logout = () => api.post('/auth/logout');

// Resolves to the logged-in profile, or null when there is no session.
export const getMe = () =>
  api
    .get('/auth/me')
    .then((res) => res.data)
    .catch((err) => {
      if (err?.response?.status === 401) return null;
      throw err;
    });
