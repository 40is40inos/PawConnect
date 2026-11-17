import axios from 'axios';

// In development the CRA dev server proxies /api to the backend (see "proxy"
// in package.json), so the browser talks to one origin. Set REACT_APP_API_URL
// when the API is hosted elsewhere.
export const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  withCredentials: true, // send the httpOnly session cookie
});

// Turns an axios error into a message that can be shown to the user.
export const errorMessage = (err) =>
  err?.response?.data?.error || 'Could not reach the server, please try again';
