import axios from 'axios';

const API_BASE_URL = 'https://api.amsclubhub.com/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000, // 20 giây, tránh chờ vô hạn khi backend chậm/cold start
});

// Tự động đính kèm token vào header cho mọi request sau khi đăng nhập
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
	const token = localStorage.getItem('access_token');
	if (token) {
	  config.headers.Authorization = `Bearer ${token}`;
	}
  }
  return config;
});

export default api;