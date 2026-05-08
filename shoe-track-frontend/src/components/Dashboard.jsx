import { useState, useEffect } from 'react';
import { 
    Calendar, DollarSign, CreditCard, 
    Smartphone, Receipt, TrendingUp 
} from 'lucide-react';

export default function Dashboard() {
    // Por defecto, iniciamos con la fecha en la que sabemos que tienes datos de prueba
    const [fecha, setFecha] = useState('2026-04-09'); 
    const [corteDiario, setCorteDiario] = useState(null);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const cargarCorteDiario = async () => {
        setCargando(true);
        setError('');
        try {
            const token = localStorage.getItem('token');
            
            // IMPORTANTE: Le pegamos al API GATEWAY (puerto 8080), no a C# directamente
            const res = await fetch(`http://localhost:8080/api/reports/corte-diario?fecha=${fecha}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!res.ok) throw new Error("Error al obtener los datos del servidor");
            
            const json = await res.json();
            setCorteDiario(json.datos); // .datos en minúscula porque así lo manda Node/C# en la envoltura
        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    // Cargar los datos automáticamente al entrar o al cambiar la fecha
    useEffect(() => {
        cargarCorteDiario();
    }, [fecha]);

    // Función auxiliar para formatear dinero
    const formatearDinero = (monto) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto || 0);
    };

    return (
        <div className="container-fluid mt-4">
            <div className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="fw-bold d-flex align-items-center">
                    <TrendingUp className="me-3 text-primary" size={32} />
                    Dashboard Gerencial
                </h2>
                
                <div className="d-flex align-items-center bg-white p-2 border rounded shadow-sm">
                    <Calendar className="me-2 text-secondary" size={20} />
                    <input 
                        type="date" 
                        className="form-control form-control-sm border-0 bg-transparent fw-bold text-dark"
                        value={fecha}
                        onChange={(e) => setFecha(e.target.value)}
                        style={{ outline: 'none', boxShadow: 'none' }}
                    />
                </div>
            </div>

            {error && (
                <div className="alert alert-danger shadow-sm border-0 border-start border-danger border-4">
                    <strong>Error:</strong> {error}
                </div>
            )}

            {cargando ? (
                <div className="text-center my-5">
                    <div className="spinner-border text-primary" role="status"></div>
                    <p className="mt-2 text-muted fw-bold">Calculando Corte de Caja...</p>
                </div>
            ) : corteDiario ? (
                <div className="row g-4">
                    {/* Tarjeta Principal: Ingreso Total */}
                    <div className="col-12">
                        <div className="card bg-dark text-white border-0 shadow-sm h-100 rounded-4 overflow-hidden">
                            <div className="card-body p-4 d-flex align-items-center justify-content-between position-relative">
                                <div>
                                    <h5 className="text-uppercase text-secondary fw-bold mb-1" style={{ letterSpacing: '1px' }}>Ingreso Total del Día</h5>
                                    <h1 className="display-4 fw-black mb-0 text-success">
                                        {/* CORREGIDO A MAYÚSCULA INICIAL */}
                                        {formatearDinero(corteDiario.TotalIngresos)}
                                    </h1>
                                </div>
                                <DollarSign size={80} className="text-white opacity-25 position-absolute end-0 me-4" />
                            </div>
                        </div>
                    </div>

                    {/* Desglose: Efectivo */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100 rounded-4">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-success bg-opacity-10 p-3 rounded-circle text-success me-3">
                                        <DollarSign size={24} />
                                    </div>
                                    <h5 className="mb-0 fw-bold text-dark">Efectivo en Caja</h5>
                                </div>
                                {/* CORREGIDO A MAYÚSCULA INICIAL */}
                                <h3 className="fw-bold mb-0">{formatearDinero(corteDiario.IngresoEfectivo)}</h3>
                                <small className="text-muted">Dinero físico a entregar</small>
                            </div>
                        </div>
                    </div>

                    {/* Desglose: Tarjeta */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100 rounded-4">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-primary bg-opacity-10 p-3 rounded-circle text-primary me-3">
                                        <CreditCard size={24} />
                                    </div>
                                    <h5 className="mb-0 fw-bold text-dark">Terminal (TDD/TDC)</h5>
                                </div>
                                {/* CORREGIDO A MAYÚSCULA INICIAL */}
                                <h3 className="fw-bold mb-0">{formatearDinero(corteDiario.IngresoTarjeta)}</h3>
                                <small className="text-muted">Acreditado directo a banco</small>
                            </div>
                        </div>
                    </div>

                    {/* Desglose: Transferencias */}
                    <div className="col-md-4">
                        <div className="card border-0 shadow-sm h-100 rounded-4">
                            <div className="card-body p-4">
                                <div className="d-flex align-items-center mb-3">
                                    <div className="bg-info bg-opacity-10 p-3 rounded-circle text-info me-3">
                                        <Smartphone size={24} />
                                    </div>
                                    <h5 className="mb-0 fw-bold text-dark">Transferencias</h5>
                                </div>
                                {/* CORREGIDO A MAYÚSCULA INICIAL */}
                                <h3 className="fw-bold mb-0">{formatearDinero(corteDiario.IngresoTransferencia)}</h3>
                                <small className="text-muted">Acreditado directo a banco</small>
                            </div>
                        </div>
                    </div>

                    {/* Resumen Operativo */}
                    <div className="col-md-6 mt-4">
                        <div className="card border-0 shadow-sm rounded-4 border-start border-warning border-4">
                            <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted fw-bold mb-1">Total de Tickets Emitidos</h6>
                                    {/* CORREGIDO A MAYÚSCULA INICIAL */}
                                    <h3 className="fw-bold mb-0">{corteDiario.TotalTickets} ventas</h3>
                                </div>
                                <div className="bg-light p-3 rounded-circle text-warning">
                                    <Receipt size={32} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="col-md-6 mt-4">
                        <div className="card border-0 shadow-sm rounded-4 border-start border-danger border-4">
                            <div className="card-body p-4 d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted fw-bold mb-1">Descuentos Aplicados</h6>
                                    {/* CORREGIDO A MAYÚSCULA INICIAL */}
                                    <h3 className="fw-bold text-danger mb-0">-{formatearDinero(corteDiario.TotalDescuentos)}</h3>
                                </div>
                                <div className="bg-light p-3 rounded-circle text-danger">
                                    <TrendingUp size={32} style={{ transform: 'rotate(180deg)' }} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="alert alert-info border-0 shadow-sm">
                    No se encontraron datos de ventas para la fecha seleccionada.
                </div>
            )}
        </div>
    );
}