import { api } from './client';

export const getPetKeepers = () => api.get('/users/keepers').then((res) => res.data);

export const getPetOwners = () => api.get('/users/owners').then((res) => res.data);

export const updateMe = (changes) => api.patch('/users/me', changes).then((res) => res.data);
