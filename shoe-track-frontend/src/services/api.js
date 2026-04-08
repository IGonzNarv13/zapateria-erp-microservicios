import axios from 'axios';

// 1. Creamos una instancia "base" apuntando al Gateway
// Gracias a que configuramos el proxy en Vite, solo necesitamos poner '/api'
const api = axios.create({
    baseURL: '/api', 
});

// 2. Configuramos el Interceptor
api.interceptors.request.use(
    (config) => {
        // Buscamos la llave (token) que guardamos al hacer el Login
        const token = localStorage.getItem('token');
        
        // Si la encontramos, la pegamos en la cabecera Authorization con el formato Bearer
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;