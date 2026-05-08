import React, { useState, useEffect } from 'react';
import { Search, Plus, PackagePlus, CheckCircle } from 'lucide-react';
import { Modal } from 'bootstrap'; 
import { 
    obtenerMarcas, obtenerCategorias, obtenerColores, 
    obtenerTallas, obtenerBodegas, registrarZapato, buscarCatalogo,
    registrarEntradaMasiva 
} from '../services/inventoryService';

const Ingresos = () => {
    const [modeloBusqueda, setModeloBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [buscando, setBuscando] = useState(false);
    const [busquedaRealizada, setBusquedaRealizada] = useState(false);
    const [zapatoSeleccionado, setZapatoSeleccionado] = useState(null);

    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [bodegas, setBodegas] = useState([]);

    const estadoInicialFormulario = {
        modelo: '', id_marca: '', id_categoria: '', id_color: '', precio_base: ''
    };
    const [formulario, setFormulario] = useState(estadoInicialFormulario);
    const [guardando, setGuardando] = useState(false);
    const [idBodegaDestino, setIdBodegaDestino] = useState('');
    const [cantidadesCorrida, setCantidadesCorrida] = useState({});

    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                const [m, c, col, tRaw, b] = await Promise.all([
                    obtenerMarcas(), obtenerCategorias(), obtenerColores(), 
                    obtenerTallas(), obtenerBodegas()
                ]);
                const tallasUnicas = Array.from(new Map(tRaw.map(item => [item.numero, item])).values())
                                        .sort((a, b) => parseFloat(a.numero) - parseFloat(b.numero));
                setMarcas(m); setCategorias(c); setColores(col); setTallas(tallasUnicas); setBodegas(b);
            } catch (error) { console.error("Error al cargar catálogos"); }
        };
        cargarCatalogos();
    }, []);
    
    const formatTalla = (n) => n.toString().endsWith('.5') ? `${Math.floor(n)} ½` : n;

    // --- FUNCIÓN DE LIMPIEZA DE MODALES (LA CLAVE) ---
    const limpiarInterfazPostModal = (idModal) => {
        const modalElement = document.getElementById(idModal);
        const instance = Modal.getInstance(modalElement);
        if (instance) instance.hide();

        // Limpieza forzosa del DOM que Bootstrap a veces olvida
        const backdrops = document.querySelectorAll('.modal-backdrop');
        backdrops.forEach(b => b.remove()); // Quita el fondo oscuro
        document.body.classList.remove('modal-open'); // Devuelve el scroll
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    };

    const handleBuscar = async (e) => {
        if (e) e.preventDefault();
        if (!modeloBusqueda.trim()) return;
        setBuscando(true);
        setBusquedaRealizada(true);
        try {
            const data = await buscarCatalogo(modeloBusqueda);
            setResultados(data.filter(item => item.modelo.toLowerCase() === modeloBusqueda.toLowerCase()));
        } catch (error) { console.error("Error al buscar"); } 
        finally { setBuscando(false); }
    };

    const handleAltaNueva = async (e) => {
        if (e) { e.preventDefault(); e.stopPropagation(); }
        if (guardando) return;

        const tallasAIngresar = Object.entries(cantidadesCorrida)
            .filter(([_, cantidad]) => parseInt(cantidad) > 0)
            .map(([id_talla, cantidad]) => ({
                id_talla: parseInt(id_talla),
                cantidad: parseInt(cantidad)
            }));

        if (tallasAIngresar.length === 0) return alert("Ingresa al menos un par.");
        if (!idBodegaDestino) return alert("Selecciona una bodega.");

        setGuardando(true);
        try {
            const datosAEnviar = {
                modelo: formulario.modelo,
                id_marca: parseInt(formulario.id_marca),
                id_categoria: parseInt(formulario.id_categoria),
                id_color: parseInt(formulario.id_color),
                precio_base: parseFloat(formulario.precio_base),
                id_bodega: parseInt(idBodegaDestino),
                corrida: tallasAIngresar
            };
            await registrarZapato(datosAEnviar);
            alert(`¡Éxito! Variante creada y corrida registrada.`);
            
            setFormulario(estadoInicialFormulario);
            setCantidadesCorrida({});
            setIdBodegaDestino('');

            // Cerramos y limpiamos
            limpiarInterfazPostModal('modalNuevoZapato');

            handleBuscar();
        } catch (error) {
            console.error("Error en alta:", error);
            alert("Error: " + (error.response?.data?.detail || "Falla de red"));
        } finally {
            setGuardando(false);
        }
    };

    const handleIngresoMasivo = async (e) => {
        if (e) e.preventDefault();
        if (guardando) return;
        if (!zapatoSeleccionado) return alert("Selecciona un producto primero.");
        if (!idBodegaDestino) return alert("Por favor, selecciona una bodega.");

        const tallasAIngresar = Object.entries(cantidadesCorrida)
            .filter(([_, cantidad]) => parseInt(cantidad) > 0)
            .map(([id_talla, cantidad]) => ({
                id_zapato: zapatoSeleccionado.id_zapato,
                id_talla: parseInt(id_talla),
                id_bodega: parseInt(idBodegaDestino),
                cantidad: parseInt(cantidad)
            }));

        if (tallasAIngresar.length === 0) return alert("Ingresa al menos un par.");
        
        setGuardando(true);
        try {
            await registrarEntradaMasiva(tallasAIngresar);
            alert(`¡Éxito! Inventario actualizado en PostgreSQL.`);
            
            setCantidadesCorrida({});
            setIdBodegaDestino('');

            // Cerramos y limpiamos
            limpiarInterfazPostModal('modalIngresoStock');

            handleBuscar();
        } catch (error) {
            console.error("ERROR TÉCNICO:", error);
            alert("Error al guardar: " + (error.response?.data?.detail || error.message));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="container mt-4 max-w-4xl mx-auto">
            <div className="mb-4">
                <h3 className="fw-bold text-dark">Ingreso de Mercancía</h3>
                <p className="text-muted small">Administración de entradas al inventario maestro.</p>
            </div>

            {/* BUSCADOR */}
            <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
                <form onSubmit={handleBuscar} className="d-flex gap-3 align-items-end">
                    <div className="flex-grow-1">
                        <label className="form-label text-muted small fw-semibold">Número de Modelo</label>
                        <div className="input-group">
                            <span className="input-group-text bg-light border-end-0 text-muted"><Search size={18}/></span>
                            <input type="text" className="form-control border-start-0 ps-0 bg-light" placeholder="Ej. 5003..." value={modeloBusqueda} onChange={(e) => setModeloBusqueda(e.target.value)} />
                        </div>
                    </div>
                    <button className="btn btn-dark px-5 py-2 fw-semibold" type="submit" disabled={buscando}>
                        {buscando ? 'Buscando...' : 'Verificar'}
                    </button>
                </form>
            </div>

            {/* RESULTADOS */}
            {busquedaRealizada && !buscando && (
                <div className="card shadow-sm border-0 rounded-4 p-4 mb-4 bg-white">
                    {resultados.length > 0 ? (
                        <>
                            <h5 className="fw-bold mb-3 text-dark">Variantes Disponibles ({resultados.length})</h5>
                            <div className="list-group mb-4">
                                {resultados.map((zapato) => (
                                    <div key={zapato.id_zapato} className="list-group-item d-flex justify-content-between align-items-center py-3 border-start-0 border-end-0">
                                        <div>
                                            <h6 className="mb-1 fw-bold">{zapato.modelo} - <span className="text-primary">{zapato.marca}</span></h6>
                                            <small className="text-muted">Color: <span className="fw-semibold">{zapato.color}</span></small>
                                        </div>
                                        <button className="btn btn-success btn-sm fw-bold px-3" data-bs-toggle="modal" data-bs-target="#modalIngresoStock"
                                            onClick={() => { setZapatoSeleccionado(zapato); setCantidadesCorrida({}); setIdBodegaDestino(''); }}>
                                            <Plus size={16} className="me-1"/> Ingresar Corrida
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="text-center mt-3 pt-3 border-top">
                                <button className="btn btn-outline-primary rounded-pill px-4 btn-sm fw-bold" data-bs-toggle="modal" data-bs-target="#modalNuevoZapato" 
                                    onClick={() => { setFormulario({...formulario, modelo: modeloBusqueda}); setCantidadesCorrida({}); setIdBodegaDestino(''); }}>
                                    + Registrar Nueva Marca/Color para este Modelo
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <PackagePlus size={48} className="mx-auto mb-3 text-primary opacity-50" />
                            <h5 className="fw-bold text-dark">Modelo no registrado</h5>
                            <p className="text-muted mb-4 small">Este modelo no existe en el catálogo. Debes crear su ficha técnica.</p>
                            <button className="btn btn-primary fw-bold rounded-pill px-5" data-bs-toggle="modal" data-bs-target="#modalNuevoZapato" 
                                onClick={() => { setFormulario({...formulario, modelo: modeloBusqueda}); setCantidadesCorrida({}); setIdBodegaDestino(''); }}>
                                Crear Ficha Técnica Nueva
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* MODAL 1: ALTA NUEVA */}
            <div className="modal fade" id="modalNuevoZapato" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content rounded-4 border-0 shadow-lg">
                        <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                            <h5 className="modal-title fw-bold">Nueva Ficha Técnica</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form onSubmit={handleAltaNueva}>
                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">Modelo</label>
                                        <input type="text" name="modelo" value={formulario.modelo} className="form-control bg-light" readOnly />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">Precio Sugerido ($)</label>
                                        <input type="number" step="0.01" name="precio_base" value={formulario.precio_base} onChange={(e) => setFormulario({...formulario, precio_base: e.target.value})} className="form-control" required />
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Marca</label>
                                        <select name="id_marca" value={formulario.id_marca} onChange={(e) => setFormulario({...formulario, id_marca: e.target.value})} className="form-select" required>
                                            <option value="">Selecciona...</option>
                                            {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Categoría</label>
                                        <select name="id_categoria" value={formulario.id_categoria} onChange={(e) => setFormulario({...formulario, id_categoria: e.target.value})} className="form-select" required>
                                            <option value="">Selecciona...</option>
                                            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Color</label>
                                        <select name="id_color" value={formulario.id_color} onChange={(e) => setFormulario({...formulario, id_color: e.target.value})} className="form-select" required>
                                            <option value="">Selecciona...</option>
                                            {colores.map(c => <option key={c.id_color} value={c.id_color}>{c.nombre}</option>)}
                                        </select>
                                    </div>

                                    <div className="col-12 mt-4"><h6 className="fw-bold border-bottom pb-2 text-primary">Carga de Corrida Inicial</h6></div>
                                    <div className="col-12 mb-3">
                                        <label className="form-label small fw-bold text-muted">Bodega Destino</label>
                                        <select value={idBodegaDestino} onChange={(e) => setIdBodegaDestino(e.target.value)} className="form-select shadow-sm" required>
                                            <option value="">Selecciona sucursal...</option>
                                            {bodegas.map(b => <option key={b.id_bodega} value={b.id_bodega}>{b.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-12">
                                        <div className="row g-2">
                                            {tallas.map(t => (
                                                <div className="col-3 col-md-2" key={t.id_talla}>
                                                    <div className="card border shadow-sm text-center">
                                                        <div className="card-header bg-light py-1 px-0 small fw-bold">{formatTalla(t.numero)}</div>
                                                        <input type="number" className="form-control border-0 text-center fw-bold py-2" min="0" placeholder="-" value={cantidadesCorrida[t.id_talla] || ''} onChange={(e) => setCantidadesCorrida({...cantidadesCorrida, [t.id_talla]: e.target.value})} />
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 px-4 pb-4">
                                <button type="submit" className="btn btn-primary w-100 fw-bold py-2" disabled={guardando}>
                                    {guardando ? 'Procesando...' : 'Guardar Ficha y Corrida'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>

            {/* MODAL 2: INGRESO CORRIDA EXISTENTE */}
            <div className="modal fade" id="modalIngresoStock" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content rounded-4 border-0 shadow">
                        <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                            <h5 className="modal-title fw-bold text-success">Ingreso de Mercancía</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <form onSubmit={handleIngresoMasivo}>
                            <div className="modal-body p-4">
                                {zapatoSeleccionado && (
                                    <div className="alert alert-success border-0 shadow-sm mb-4">
                                        <div className="small opacity-75">Ingresando stock para:</div>
                                        <div className="fw-bold fs-5">{zapatoSeleccionado.modelo} - {zapatoSeleccionado.marca} ({zapatoSeleccionado.color})</div>
                                    </div>
                                )}
                                <div className="mb-4">
                                    <label className="form-label small fw-bold text-muted">¿A qué bodega entra?</label>
                                    <select value={idBodegaDestino} onChange={(e) => setIdBodegaDestino(e.target.value)} className="form-select form-select-lg shadow-sm" required>
                                        <option value="">Selecciona el destino...</option>
                                        {bodegas.map(b => <option key={b.id_bodega} value={b.id_bodega}>{b.nombre}</option>)}
                                    </select>
                                </div>
                                <div className="row g-2">
                                    {tallas.map(t => (
                                        <div className="col-3 col-md-2" key={t.id_talla}>
                                            <div className="card border shadow-sm text-center">
                                                <div className="card-header bg-light py-1 px-0 small fw-bold">{formatTalla(t.numero)}</div>
                                                <input type="number" className="form-control border-0 text-center fw-bold py-2" min="0" placeholder="-" value={cantidadesCorrida[t.id_talla] || ''} onChange={(e) => setCantidadesCorrida({...cantidadesCorrida, [t.id_talla]: e.target.value})} />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 px-4 pb-4">
                                <button type="submit" className="btn btn-success w-100 fw-bold py-2" disabled={guardando}>
                                    {guardando ? 'Guardando...' : 'Confirmar Ingreso'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Ingresos;