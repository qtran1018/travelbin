import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

// Create an axios instance with interceptors to automatically attach JWT tokens
const apiClient = axios.create({
    baseURL: API_BASE_URL,
});

// Request interceptor to add Authorization header if token exists
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("access");
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Ensure Content-Type is set for requests with data
        if (config.data && !config.headers['Content-Type']) {
            config.headers['Content-Type'] = 'application/json';
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration (optional - for future use)
apiClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Handle 401 errors (unauthorized) - could refresh token here if needed
        if (error.response?.status === 401) {
            // Token might be expired, but we'll let the component handle it
            console.error("Unauthorized request - token may be expired");
        }
        return Promise.reject(error);
    }
);

export default API_BASE_URL;
export { apiClient };