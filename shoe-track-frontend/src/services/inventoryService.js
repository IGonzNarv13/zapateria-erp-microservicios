import api from './api';

const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return {
        headers: {
            'Authorization': `Bearer ${token}`
        }
    };
};

export const obtenerCategorias = async () => {
    try {
        const response = await api.get('/inventory/categorias', getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al obtener las categorías:", error);
        throw error;
    }
};

export const obtenerColores = async () => {
    try {
        const response = await api.get('/inventory/colores', getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al obtener el catálogo de colores:", error);
        throw error;
    }
};

export const buscarStock = async (modelo, idMarca) => {
    try {
        const params = new URLSearchParams();
        if (modelo) params.append('modelo', modelo);
        if (idMarca) params.append('id_marca', idMarca);

        const response = await api.get(`/inventory/buscar?${params.toString()}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al buscar stock:", error);
        throw error;
    }
};

export const obtenerMarcas = async () => {
    try {
        const response = await api.get('/inventory/marcas', getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al obtener las marcas:", error);
        throw error;
    }
};

export const obtenerTallas = async () => {
    try {
        const response = await api.get('/inventory/tallas', getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al obtener tallas:", error);
        throw error;
    }
};

export const obtenerBodegas = async () => {
    try {
        const response = await api.get('/inventory/bodegas', getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al obtener bodegas:", error);
        throw error;
    }
};

export const registrarZapato = async (datosZapato) => {
    try {
        const response = await api.post('/inventory/alta', datosZapato, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al registrar el zapato:", error);
        throw error;
    }
};

export const buscarCatalogo = async (modelo) => {
    try {
        const response = await api.get(`/inventory/catalogo/buscar?modelo=${modelo}`, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al buscar en catálogo:", error);
        throw error;
    }
};

// CORRECCIÓN: Ahora utiliza la instancia 'api' y las cabeceras de seguridad
export const registrarEntradaMasiva = async (datos) => {
    try {
        const response = await api.post('/inventory/entrada-masiva', datos, getAuthHeaders());
        return response.data;
    } catch (error) {
        console.error("Error al registrar entrada masiva:", error);
        throw error;
    }
};