import React, { useState, useEffect } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Package, LogOut, Home, ShoppingCart, ClipboardCheck, ChevronDown, ChevronRight, Tags, Menu, User, Search, Truck, PackagePlus} from 'lucide-react';

const Layout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [menuCatalogosAbierto, setMenuCatalogosAbierto] = useState(false);
    const [sidebarAbierta, setSidebarAbierta] = useState(true);
    const [usuario, setUsuario] = useState({ nombre: 'Usuario', rol: 'Administrador' });

    useEffect(() => {
        const usuarioGuardado = localStorage.getItem('usuario');
        if (usuarioGuardado) {
            setUsuario(JSON.parse(usuarioGuardado));
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('usuario');
        navigate('/'); 
        window.location.reload(); 
    };

    const isActive = (path) => location.pathname === path ? 'bg-primary text-white' : 'text-white-50 hover-text-white';

    // FUNCIÓN NUEVA: Define el título central dependiendo de la ruta
    const obtenerTituloSeccion = () => {
        switch (location.pathname) {
            case '/panel': return 'Panel Principal';
            case '/panel/ventas': return 'Punto de Venta';
            case '/panel/ingresos': return 'Ingreso de Mercancía';
            case '/panel/catalogos': return 'Catálogo de Categorías';
            case '/panel/marcas': return 'Catálogo de Marcas';
            case '/panel/bodegas': return 'Directorio de Bodegas';
            default: return '';
        }
    };

    return (
        <div className="d-flex vh-100 bg-light overflow-hidden">
            
            {/* ==========================================
                SIDEBAR (Ahora sin el logo, solo navegación)
            ========================================== */}
            <aside 
                className="bg-dark text-white d-flex flex-column shadow-lg transition-all" 
                style={{ 
                    width: sidebarAbierta ? '260px' : '0px', 
                    transition: 'width 0.3s ease-in-out',
                    borderRight: '1px solid rgba(255,255,255,0.1)'
                }}
            >
                <div style={{ opacity: sidebarAbierta ? 1 : 0, transition: 'opacity 0.2s', width: '260px' }} className="d-flex flex-column h-100">
                    
                    {/* Un poco de espacio arriba ya que quitamos el logo */}
                    <div className="flex-grow-1 overflow-auto py-4 px-3 mt-2">
                        <ul className="nav flex-column gap-2">
                            <li className="nav-item">
                                <Link to="/panel" className={`nav-link rounded-3 d-flex align-items-center px-3 py-2 ${isActive('/panel')}`}>
                                    <Home size={20} className="me-3"/> Inicio
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/panel/buscador" className={`nav-link rounded-3 d-flex align-items-center px-3 py-2 ${isActive('/panel/buscador')}`}>
                                    <Search size={20} className="me-3"/> Buscador Rápido
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/panel/ventas" className={`nav-link rounded-3 d-flex align-items-center px-3 py-2 ${isActive('/panel/ventas')}`}>
                                    <ShoppingCart size={20} className="me-3"/> Punto de Venta
                                </Link>
                            </li>
                            <li className="nav-item">
                                <Link to="/panel/ingresos" className={`nav-link rounded-3 d-flex align-items-center px-3 py-2 ${isActive('/panel/ingresos')}`}>
                                    <Truck size={20} className="me-3"/> Ingresos
                                </Link>
                            </li>
                            
                            <li className="nav-item mt-2">
                                <div 
                                    className="nav-link rounded-3 d-flex align-items-center justify-content-between px-3 py-2 text-white-50"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setMenuCatalogosAbierto(!menuCatalogosAbierto)}
                                >
                                    <div className="d-flex align-items-center">
                                        <ClipboardCheck size={20} className="me-3"/> Catálogos
                                    </div>
                                    {menuCatalogosAbierto ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                </div>
                                {menuCatalogosAbierto && (
                                    <ul className="nav flex-column ms-4 mt-1 border-start border-secondary ps-2">
                                        <li className="nav-item">
                                            <Link to="/panel/catalogos" className={`nav-link small py-1 ${isActive('/panel/catalogos')}`}>
                                                <Tags size={14} className="me-2"/> Categorías
                                            </Link>
                                        </li>
                                    </ul>
                                )}
                            </li>
                        </ul>
                    </div>
                </div>
            </aside>

            {/* ==========================================
                CONTENIDO PRINCIPAL
            ========================================== */}
            <main className="flex-grow-1 d-flex flex-column overflow-hidden position-relative">
                
                {/* TOPBAR OSCURA MEJORADA */}
                <header className="bg-dark text-white p-3 d-flex justify-content-between align-items-center shadow-sm border-bottom border-secondary position-relative">
                    
                    {/* IZQUIERDA: Botón Hamburguesa + Logo/Botón Inicio */}
                    <div className="d-flex align-items-center">
                        <button 
                            className="btn btn-dark border-0 shadow-none p-1 me-3 d-flex align-items-center hover-bg-secondary"
                            onClick={() => setSidebarAbierta(!sidebarAbierta)}
                        >
                            <Menu size={24} className="text-light" />
                        </button>
                        
                        {/* Logo como Link al Panel Principal */}
                        <Link to="/panel" className="text-white text-decoration-none d-flex align-items-center fw-bold fs-5">
                            <Package className="me-2 text-light" size={24} />
                            ShoeTrack <span className="fw-light ms-1 d-none d-md-inline">ERP</span>
                        </Link>
                    </div>

                    {/* CENTRO: Título Dinámico de la Sección */}
                    <div className="position-absolute start-50 translate-middle-x d-none d-lg-block fw-semibold fs-5 text-light opacity-75">
                        {obtenerTituloSeccion()}
                    </div>

                    {/* DERECHA: Perfil del Usuario */}
                    <div className="d-flex align-items-center">
                        <div className="text-end me-3 d-none d-sm-block">
                            <div className="fw-bold lh-1 text-light" style={{ fontSize: '0.95rem' }}>
                                {usuario.nombre || 'Administrador'}
                            </div>
                            <small className="text-white-50" style={{ fontSize: '0.75rem' }}>
                                {usuario.rol || 'Gerente de Sucursal'}
                            </small>
                        </div>
                        
                        <div className="dropdown">
                            <button className="btn btn-secondary rounded-circle d-flex justify-content-center align-items-center p-0 border-0" style={{width: '40px', height: '40px'}} data-bs-toggle="dropdown">
                                <User size={20} />
                            </button>
                            <ul className="dropdown-menu dropdown-menu-end shadow">
                                <li><button className="dropdown-item d-flex align-items-center text-danger" onClick={handleLogout}><LogOut size={16} className="me-2"/> Cerrar Sesión</button></li>
                            </ul>
                        </div>
                    </div>
                </header>

                {/* ÁREA DE RENDERIZADO DE COMPONENTES */}
                <div className="flex-grow-1 overflow-auto p-4 bg-light">
                    <Outlet /> 
                </div>
            </main>

        </div>
    );
};

export default Layout;