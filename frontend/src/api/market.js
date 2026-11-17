import { api } from './client';

const data = (res) => res.data;

// Keepers
export const searchKeepers = (filters = {}) => {
  // Drop empty filters so they don't end up as ?city=
  const params = Object.fromEntries(Object.entries(filters).filter(([, v]) => v !== '' && v != null));
  return api.get('/keepers', { params }).then(data);
};
export const getKeeper = (userName) => api.get(`/keepers/${encodeURIComponent(userName)}`).then(data);
export const getKeeperProfile = () => api.get('/keeper-profile').then(data);
export const saveKeeperProfile = (profile) => api.put('/keeper-profile', profile).then(data);

// Pets
export const getPets = () => api.get('/pets').then(data);
export const createPet = (pet) => api.post('/pets', pet).then(data);
export const updatePet = (id, changes) => api.patch(`/pets/${id}`, changes).then(data);
export const deletePet = (id) => api.delete(`/pets/${id}`);

// Bookings
export const getBookings = () => api.get('/bookings').then(data);
export const requestBooking = (booking) => api.post('/bookings', booking).then(data);
export const acceptBooking = (id) => api.post(`/bookings/${id}/accept`).then(data);
export const declineBooking = (id) => api.post(`/bookings/${id}/decline`).then(data);
export const cancelBooking = (id) => api.post(`/bookings/${id}/cancel`).then(data);
export const reviewBooking = (id, review) => api.post(`/bookings/${id}/review`, review).then(data);
