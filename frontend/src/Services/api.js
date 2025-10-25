import axios from 'axios';

// Backend runs on port 3001
export const API_URL = 'http://localhost:3001/api';

export const api = {
  get: (url, token) => axios.get(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  post: (url, data, token) => axios.post(`${API_URL}${url}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  put: (url, data, token) => axios.put(`${API_URL}${url}`, data, {
    headers: { Authorization: `Bearer ${token}` }
  }),
  delete: (url, token) => axios.delete(`${API_URL}${url}`, {
    headers: { Authorization: `Bearer ${token}` }
  })
};