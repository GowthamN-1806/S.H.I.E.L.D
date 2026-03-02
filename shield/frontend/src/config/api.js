import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const TWIN_BASE = import.meta.env.VITE_TWIN_URL || 'http://localhost:3002';

const api = axios.create({
    baseURL: `${API_BASE}/api`,
    timeout: 10000,
    headers: { 'Content-Type': 'application/json' },
});

// Attach token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('shield_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// Handle 401 → redirect to login
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.removeItem('shield_token');
            localStorage.removeItem('shield_user');
            window.location.href = '/login';
        }
        return Promise.reject(err);
    }
);

const twinApi = axios.create({ baseURL: `${TWIN_BASE}/api/twin`, timeout: 10000 });

export { API_BASE, TWIN_BASE };
export { twinApi };
export default api;
