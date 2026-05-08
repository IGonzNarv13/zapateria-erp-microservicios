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
                <Route path="/" element={<Login onLoginSuccess={() => window.location.href = '/panel'} />} />

                <Route path="/panel" element={
                    <RutaProtegida>
                        <Layout />
                    </RutaProtegida>
                }>
                    <Route index element={<MainMenu />} />
                    <Route path="buscador" element={<Buscador />} />
                    <Route path="catalogos" element={<Dashboard />} />
                    <Route path="ventas" element={<PuntoDeVenta />} />
                    <Route path="ingresos" element={<Ingresos />} />
                    <Route path="auditorias" element={<Dashboard />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;