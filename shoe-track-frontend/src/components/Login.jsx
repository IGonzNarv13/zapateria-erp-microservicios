import React, { useState } from 'react';
import { login } from '../services/authService';
import { Footprints } from 'lucide-react';

const Login = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            onLoginSuccess();
        } catch (err) {
            setError(err.mensaje || "Credenciales incorrectas. Verifica tu correo y contraseña.");
        } finally {
            setLoading(false);
        }
    };

    return (
        // Fondo gris muy claro para dar contraste
        <div className="bg-light min-vh-100 d-flex justify-content-center align-items-center p-3">
            
            {/* Tarjeta: Sin bordes, sombra suave, bordes MUY redondeados */}
            <div className="card border-0 shadow-lg rounded-4 p-2" style={{ maxWidth: '440px', width: '100%' }}>
                <div className="card-body p-4 p-md-5">
                    
                    {/* Header: Logo y Texto Minimalista */}
                    <div className="text-center mb-5">
                        <div className="d-inline-flex align-items-center justify-content-center bg-dark text-white rounded-circle shadow-sm mb-3" style={{ width: '64px', height: '64px' }}>
                            <Footprints size={32} />
                        </div>
                        <h2 className="fw-bold text-dark h3 mb-1">ShoeTrack <span className="text-muted fw-light">ERP</span></h2>
                        <p className="text-muted small">Plataforma Centralizada de Inventarios v2.0</p>
                    </div>
                    
                    {/* Alerta de Error: Soft UI style */}
                    {error && (
                        <div className="alert alert-danger border-0 rounded-3 small py-2 d-flex align-items-center mb-4 shadow-sm" role="alert">
                            <span className="me-2 fs-6">⚠️</span>
                            <div>{error}</div>
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {/* Campo Correo: Inputs con padding extra */}
                        <div className="mb-4">
                            <label className="form-label small fw-semibold text-muted mb-1">Correo Corporativo</label>
                            <input 
                                type="email" 
                                className="form-control form-control-lg fs-6 border-light-subtle rounded-3 shadow-none bg-white p-3"
                                placeholder="tu.nombre@arro.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required 
                            />
                        </div>

                        {/* Campo Contraseña: Inputs con padding extra */}
                        <div className="mb-4">
                            <div className="d-flex justify-content-between align-items-center mb-1">
                                <label className="form-label small fw-semibold text-muted mb-0">Contraseña</label>
                                <a href="#" className="text-decoration-none small text-primary fw-medium">¿Olvidaste tu contraseña?</a>
                            </div>
                            <input 
                                type="password" 
                                className="form-control form-control-lg fs-6 border-light-subtle rounded-3 shadow-none bg-white p-3"
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required 
                            />
                        </div>

                        {/* Botón: Negro Elegante, padding extra, sombra sutil */}
                        <button 
                            type="submit" 
                            className="btn btn-dark btn-lg w-100 rounded-3 shadow-sm p-3 mt-2 fw-semibold fs-6 d-flex align-items-center justify-content-center"
                            disabled={loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Validando credenciales...
                                </>
                            ) : 'Acceder al Panel'}
                        </button>
                    </form>
                </div>

                {/* Footer: Soft UI style (gris tenue) */}
                <div className="card-footer text-center py-4 bg-light border-0 rounded-bottom-4 mt-2">
                    <p className="text-muted small mb-0">© 2026 Arro Zapatería Distribuidora S.A. de C.V.</p>
                    <small className="text-muted fw-light">Desplegado en el Clúster de Producción - León, Gto.</small>
                </div>
            </div>
        </div>
    );
};

export default Login;