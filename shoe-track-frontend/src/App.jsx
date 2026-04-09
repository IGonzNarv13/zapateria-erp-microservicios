import React from 'react';
import 'bootstrap/dist/js/bootstrap.bundle.min.js';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Layout from './components/Layout';
import MainMenu from './components/MainMenu';
import Dashboard from './components/Dashboard';
import Buscador from './components/Busqueda';
import Ingresos from './components/Ingresos';
import PuntoDeVenta from './components/PuntoDeVenta';

// Componente para proteger las rutas
const RutaProtegida = ({ children }) => {
    const isAuthenticated = !!localStorage.getItem('token');
    if (!isAuthenticated) {
        return <Navigate to="/" replace />;
    }
    return children;
};

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Ruta Pública */}
                <Route path="/" element={<Login onLoginSuccess={() => window.location.href = '/panel'} />} />

                {/* Rutas Protegidas que comparten el Layout */}
                <Route path="/panel" element={
                    <RutaProtegida>
                        <Layout />
                    </RutaProtegida>
                }>
                    {/* El Outlet cargará estas pantallas dependiendo de la URL */}
                    <Route index element={<MainMenu />} /> {/* Pantalla por defecto al entrar a /panel */}
                    <Route path="buscador" element={<Buscador />} />
                    <Route path="catalogos" element={<Dashboard />} />
                    <Route path="ventas" element={<PuntoDeVenta />} />
                    <Route path="ingresos" element={<Ingresos />} />
                    <Route path="auditorias" element={<div className="container mt-4"><h3>Módulo de Auditorías en construcción...</h3></div>} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;