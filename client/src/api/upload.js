import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('jixozmed_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export async function uploadPhoto(file) {
  const formData = new FormData();
  formData.append('photo', file);

  const { data } = await api.post('/upload/photo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return data;
}

export async function deletePhoto(filename) {
  const { data } = await api.delete(`/upload/photo/${filename}`);
  return data;
}
