import axios from 'axios';

const API_URL = 'http://localhost:8080/api/auth'; // Apuntamos al Gateway

export const login = async (email, password) => {
    try {
        const response = await axios.post(`${API_URL}/login`, { email, password });
        if (response.data.token) {
            // Guardamos el token y los datos del usuario en el navegador
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('usuario', JSON.stringify(response.data.usuario));
        }
        return response.data;
    } catch (error) {
        throw error.response ? error.response.data : new Error("Error de conexión");
    }
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
};