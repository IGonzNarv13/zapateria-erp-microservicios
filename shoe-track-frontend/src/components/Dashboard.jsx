import React, { useState, useEffect } from 'react';
import { obtenerCategorias } from '../services/inventoryService';
import { LogOut, Package } from 'lucide-react'; // Iconos

const Dashboard = ({ onLogout }) => {
    const [categorias, setCategorias] = useState([]);
    const [cargando, setCargando] = useState(true);

    // useEffect se ejecuta automáticamente cuando entramos a la pantalla
    useEffect(() => {
        const cargarDatos = async () => {
            try {
                const datos = await obtenerCategorias();
                setCategorias(datos);
            } catch (error) {
                alert("Hubo un problema al cargar el inventario");
            } finally {
                setCargando(false);
            }
        };

        cargarDatos();
    }, []);

    return (
        <div className="bg-light min-vh-100">
            {/* Navbar superior */}
            <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm">
                <div className="container px-4">
                    <a className="navbar-brand d-flex align-items-center fw-bold" href="#">
                        <Package className="me-2" size={24} />
                        ShoeTrack ERP
                    </a>
                    <div className="d-flex">
                        <button onClick={onLogout} className="btn btn-outline-light btn-sm d-flex align-items-center">
                            <LogOut size={16} className="me-2" /> Salir
                        </button>
                    </div>
                </div>
            </nav>

            {/* Contenido Principal */}
            <div className="container mt-5 px-4">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2 className="fw-bold mb-0">Catálogo de Categorías</h2>
                        <p className="text-muted small">Información obtenida desde PostgreSQL vía API Gateway</p>
                    </div>
                </div>

                {/* Tarjeta con la Tabla */}
                <div className="card border-0 shadow-sm rounded-4">
                    <div className="card-body p-0">
                        {cargando ? (
                            <div className="text-center p-5">
                                <div className="spinner-border text-primary" role="status"></div>
                                <p className="mt-2 text-muted small">Consultando microservicio...</p>
                            </div>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover align-middle mb-0">
                                    <thead className="table-light">
                                        <tr>
                                            <th className="px-4 py-3 text-muted small fw-semibold">ID</th>
                                            <th className="px-4 py-3 text-muted small fw-semibold">NOMBRE DE CATEGORÍA</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {categorias.map((cat) => (
                                            <tr key={cat.id_categoria}>
                                                <td className="px-4 py-3 fw-medium text-dark">#{cat.id_categoria}</td>
                                                <td className="px-4 py-3">{cat.nombre}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;