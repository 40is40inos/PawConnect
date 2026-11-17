import { api } from './client';

export const getAllUsers = () => api.get('/admin/users').then((res) => res.data);

export const deleteUser = (username) =>
  api.delete(`/admin/users/${encodeURIComponent(username)}`);
