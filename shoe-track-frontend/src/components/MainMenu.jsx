import React from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Truck, ClipboardCheck, Tags, Search } from 'lucide-react';


const MainMenu = () => {
    // Arreglo con los módulos principales para dibujarlos rápido
    const modulos = [
        { titulo: 'Buscador de Stock', desc: 'Consulta rápida de existencias, tallas y colores', icono: <Search size={40} className="text-danger mb-3" />, ruta: '/panel/buscador' },
        { titulo: 'Punto de Venta', desc: 'Registro de ventas y tickets', icono: <ShoppingCart size={40} className="text-primary mb-3" />, ruta: '/panel/ventas' },
        { titulo: 'Ingreso de Mercancía', desc: 'Recepción de stock a bodegas', icono: <Truck size={40} className="text-success mb-3" />, ruta: '/panel/ingresos' },
        { titulo: 'Auditorías', desc: 'Revisión de stock físico vs sistema', icono: <ClipboardCheck size={40} className="text-warning mb-3" />, ruta: '/panel/auditorias' },
        { titulo: 'Catálogos base', desc: 'Categorías, marcas y sucursales', icono: <Tags size={40} className="text-info mb-3" />, ruta: '/panel/catalogos' }
    ];

    return (
        <div className="container mt-4">
            <div className="row g-4">
                {modulos.map((mod, index) => (
                    <div className="col-12 col-md-6 col-lg-3" key={index}>
                        {/* Hacemos que toda la tarjeta sea un enlace de React Router */}
                        <Link to={mod.ruta} className="text-decoration-none">
                            <div className="card h-100 border-0 shadow-sm rounded-4 text-center p-4 table-hover">
                                <div className="card-body">
                                    {mod.icono}
                                    <h5 className="card-title fw-bold text-dark">{mod.titulo}</h5>
                                    <p className="card-text text-muted small">{mod.desc}</p>
                                </div>
                            </div>
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MainMenu;