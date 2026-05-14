import axios from 'axios';
import keycloak from '../keycloak';

const API_BASE_URL = import.meta.env.VITE_API_URL;

const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

apiClient.interceptors.request.use(
    async (config) => {
        if (keycloak.authenticated) {
            // Refresh token if it expires within 30s
            await keycloak.updateToken(30).catch(() => keycloak.login());
            config.headers.Authorization = `Bearer ${keycloak.token}`;
        }
        if (config.data && !config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }
        return config;
    },
    (error) => Promise.reject(error)
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            keycloak.login();
        }
        return Promise.reject(error);
    }
);

export default API_BASE_URL;
export { apiClient };
