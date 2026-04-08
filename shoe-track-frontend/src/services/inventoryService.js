import api from './api';

export const obtenerCategorias = async () => {
    try {
        const response = await api.get('/inventory/categorias');
        return response.data;
    } catch (error) {
        console.error("Error al obtener las categorías:", error);
        throw error;
    }
};

export const obtenerColores = async () => {
    try {
        const response = await api.get('/inventory/colores');
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

        const response = await api.get(`/inventory/buscar?${params.toString()}`);
        return response.data;
    } catch (error) {
        console.error("Error al buscar stock:", error);
        throw error;
    }
};


export const obtenerMarcas = async () => {
    try {
        const response = await api.get('/inventory/marcas');
        return response.data;
    } catch (error) {
        console.error("Error al obtener las marcas:", error);
        throw error;
    }
};

export const obtenerTallas = async () => {
    try {
        const response = await api.get('/inventory/tallas');
        return response.data;
    } catch (error) {
        console.error("Error al obtener tallas:", error);
        throw error;
    }
};

export const obtenerBodegas = async () => {
    try {
        const response = await api.get('/inventory/bodegas');
        return response.data;
    } catch (error) {
        console.error("Error al obtener bodegas:", error);
        throw error;
    }
};