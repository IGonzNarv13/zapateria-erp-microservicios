import React, { useState, useEffect } from 'react';
import { Search, Plus, Package } from 'lucide-react';
import { 
    obtenerMarcas, obtenerCategorias, obtenerColores, 
    obtenerTallas, obtenerBodegas, registrarZapato 
} from '../services/inventoryService';

const Zapatos = () => {
    // Estados para los catálogos (Listas desplegables)
    const [marcas, setMarcas] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [colores, setColores] = useState([]);
    const [tallas, setTallas] = useState([]);
    const [bodegas, setBodegas] = useState([]);

    // Estado del formulario
    const estadoInicialFormulario = {
        modelo: '',
        id_marca: '',
        id_categoria: '',
        id_color: '',
        id_talla: '',
        id_bodega: '',
        precio_base: '',
        stock_inicial: ''
    };
    const [formulario, setFormulario] = useState(estadoInicialFormulario);
    const [guardando, setGuardando] = useState(false);

    // Cargar catálogos al montar el componente
    useEffect(() => {
        const cargarCatalogos = async () => {
            try {
                setMarcas(await obtenerMarcas());
                setCategorias(await obtenerCategorias());
                setColores(await obtenerColores());
                setTallas(await obtenerTallas());
                setBodegas(await obtenerBodegas());
            } catch (error) {
                console.error("Error al cargar los catálogos");
            }
        };
        cargarCatalogos();
    }, []);

    // Manejar cambios en los inputs
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormulario({ ...formulario, [name]: value });
    };

    // Función para enviar el formulario a la API
    const handleSubmit = async (e) => {
        e.preventDefault();
        setGuardando(true);
        try {
            // Convertimos a números los IDs y valores numéricos para Pydantic en Python
            const datosAEnviar = {
                modelo: formulario.modelo,
                id_marca: parseInt(formulario.id_marca),
                id_categoria: parseInt(formulario.id_categoria),
                id_color: parseInt(formulario.id_color),
                id_talla: parseInt(formulario.id_talla),
                id_bodega: parseInt(formulario.id_bodega),
                precio_base: parseFloat(formulario.precio_base),
                stock_inicial: parseInt(formulario.stock_inicial)
            };

            await registrarZapato(datosAEnviar);
            
            alert("¡Zapato registrado exitosamente!");
            setFormulario(estadoInicialFormulario); // Limpiar formulario
            
            // Cerrar el modal usando la API de Bootstrap
            const modalElement = document.getElementById('modalNuevoZapato');
            const modal = window.bootstrap.Modal.getInstance(modalElement);
            modal.hide();

        } catch (error) {
            alert("Error al registrar el zapato. Revisa la consola.");
            console.error(error);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="container mt-4">
            {/* Cabecera y Botón de Alta */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h3 className="fw-bold mb-0">Gestión de Zapatos</h3>
                    <p className="text-muted small">Administración del catálogo maestro</p>
                </div>
                <button 
                    className="btn btn-dark fw-bold px-4 py-2" 
                    data-bs-toggle="modal" 
                    data-bs-target="#modalNuevoZapato"
                >
                    <Plus size={20} className="me-2" />
                    Nuevo Ingreso
                </button>
            </div>

            {/* Aquí iría tu tabla de zapatos actual (la puedes mantener debajo) */}
            <div className="card shadow-sm border-0 rounded-4 p-5 text-center bg-light">
                <Package size={48} className="text-muted mx-auto mb-3 opacity-50" />
                <h5 className="fw-bold text-dark">Área de Trabajo</h5>
                <p className="text-muted">Haz clic en "Nuevo Ingreso" para probar el formulario modal.</p>
            </div>

            {/* ======================================================== */}
            {/* MODAL DE ALTA DE ZAPATO */}
            {/* ======================================================== */}
            <div className="modal fade" id="modalNuevoZapato" tabIndex="-1" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered">
                    <div className="modal-content rounded-4 border-0 shadow-lg">
                        <div className="modal-header border-bottom-0 pb-0 pt-4 px-4">
                            <h5 className="modal-title fw-bold">Registrar Nueva Mercancía</h5>
                            <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    {/* Modelo y Precio */}
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">Modelo / Estilo *</label>
                                        <input type="text" name="modelo" value={formulario.modelo} onChange={handleChange} className="form-control" required placeholder="Ej. 5003" />
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small fw-bold text-muted">Precio Base ($) *</label>
                                        <input type="number" step="0.01" name="precio_base" value={formulario.precio_base} onChange={handleChange} className="form-control" required placeholder="0.00" />
                                    </div>

                                    {/* Catálogos del Zapato */}
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Marca *</label>
                                        <select name="id_marca" value={formulario.id_marca} onChange={handleChange} className="form-select" required>
                                            <option value="">Seleccione...</option>
                                            {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Categoría *</label>
                                        <select name="id_categoria" value={formulario.id_categoria} onChange={handleChange} className="form-select" required>
                                            <option value="">Seleccione...</option>
                                            {categorias.map(c => <option key={c.id_categoria} value={c.id_categoria}>{c.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Color *</label>
                                        <select name="id_color" value={formulario.id_color} onChange={handleChange} className="form-select" required>
                                            <option value="">Seleccione...</option>
                                            {colores.map(c => <option key={c.id_color} value={c.id_color}>{c.nombre}</option>)}
                                        </select>
                                    </div>

                                    {/* Detalles de Inventario Inicial */}
                                    <div className="col-12 mt-4">
                                        <h6 className="fw-bold border-bottom pb-2 text-primary">Carga de Inventario Inicial</h6>
                                    </div>
                                    
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Talla *</label>
                                        <select name="id_talla" value={formulario.id_talla} onChange={handleChange} className="form-select" required>
                                            <option value="">Seleccione...</option>
                                            {tallas.map(t => <option key={t.id_talla} value={t.id_talla}>{t.numero}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Bodega/Sucursal *</label>
                                        <select name="id_bodega" value={formulario.id_bodega} onChange={handleChange} className="form-select" required>
                                            <option value="">Seleccione...</option>
                                            {bodegas.map(b => <option key={b.id_bodega} value={b.id_bodega}>{b.nombre}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-md-4">
                                        <label className="form-label small fw-bold text-muted">Cantidad Inicial *</label>
                                        <input type="number" name="stock_inicial" value={formulario.stock_inicial} onChange={handleChange} className="form-control" required min="1" placeholder="Pares" />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer border-top-0 px-4 pb-4 pt-0">
                                <button type="button" className="btn btn-light fw-bold" data-bs-dismiss="modal" disabled={guardando}>Cancelar</button>
                                <button type="submit" className="btn btn-dark fw-bold px-4" disabled={guardando}>
                                    {guardando ? 'Guardando...' : 'Registrar Mercancía'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
            {/* FIN DEL MODAL */}

        </div>
    );
};

export default Zapatos;