import { useState, useMemo, Fragment } from 'react';

const FilaZapatoAgrupado = ({ zapatoInfo, agregarAlCarrito }) => {
    const [idSeleccionado, setIdSeleccionado] = useState(zapatoInfo.tallas[0]?.id_inventario || "");

    const handleAñadir = () => {
        const tallaSeleccionada = zapatoInfo.tallas.find(t => t.id_inventario.toString() === idSeleccionado.toString());
        if (tallaSeleccionada) {
            agregarAlCarrito({
                id_inventario: tallaSeleccionada.id_inventario,
                modelo: zapatoInfo.modelo,
                marca: zapatoInfo.marca,
                color: zapatoInfo.color,
                talla: tallaSeleccionada.talla,
                precio_base: zapatoInfo.precio_base,
                stock_existente: tallaSeleccionada.stock_existente
            });
        }
    };

    return (
        <tr>
            <td className="align-middle"><strong>{zapatoInfo.modelo}</strong></td>
            <td className="align-middle">{zapatoInfo.color}</td>
            <td className="align-middle">
                <select 
                    className="form-select form-select-sm border-dark" 
                    value={idSeleccionado} 
                    onChange={e => setIdSeleccionado(e.target.value)}
                >
                    {zapatoInfo.tallas.map(t => (
                        <option key={t.id_inventario} value={t.id_inventario} disabled={t.stock_existente <= 0}>
                            Talla {t.talla} - (Stock: {t.stock_existente})
                        </option>
                    ))}
                </select>
            </td>
            <td className="align-middle text-center fw-bold">${zapatoInfo.precio_base}</td>
            <td className="align-middle text-center">
                <button onClick={handleAñadir} className="btn btn-success btn-sm fw-bold">
                    + Añadir
                </button>
            </td>
        </tr>
    );
};

export default function PuntoDeVenta() {
    const [busqueda, setBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [carrito, setCarrito] = useState([]);
    
    // Nuevos estados para Pago y Descuentos
    const [metodoPago, setMetodoPago] = useState('Efectivo');
    const [referenciaPago, setReferenciaPago] = useState('');
    const [tipoDescuento, setTipoDescuento] = useState('Ninguno'); // 'Ninguno', 'Monto', 'Porcentaje'
    const [valorDescuento, setValorDescuento] = useState('');
    const [motivoDescuento, setMotivoDescuento] = useState('');

    const buscarZapato = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`http://localhost:8001/api/inventory/buscar?modelo=${busqueda}`);
            if (!res.ok) throw new Error("Error en servidor");
            const data = await res.json();
            setResultados(data);
        } catch (error) {
            alert("No se pudo conectar con el inventario.");
        }
    };

    const resultadosAgrupados = useMemo(() => {
        const grupos = {};
        resultados.forEach(zapato => {
            if (!grupos[zapato.marca]) grupos[zapato.marca] = {};
            const keyModeloColor = `${zapato.modelo}-${zapato.color}`;
            if (!grupos[zapato.marca][keyModeloColor]) {
                grupos[zapato.marca][keyModeloColor] = {
                    marca: zapato.marca, modelo: zapato.modelo,
                    color: zapato.color, precio_base: zapato.precio_base, tallas: []
                };
            }
            grupos[zapato.marca][keyModeloColor].tallas.push({
                id_inventario: zapato.id_inventario,
                talla: zapato.talla, stock_existente: zapato.stock_existente
            });
        });
        return grupos;
    }, [resultados]);

    const agregarAlCarrito = (zapato) => {
        if (zapato.stock_existente <= 0) return alert("¡No hay stock!");
        const existe = carrito.find(item => item.id_inventario === zapato.id_inventario);
        if (existe) {
            if (existe.cantidad >= zapato.stock_existente) return alert("Límite de stock alcanzado.");
            setCarrito(carrito.map(item => 
                item.id_inventario === zapato.id_inventario 
                ? { ...item, cantidad: item.cantidad + 1, subtotal: (item.cantidad + 1) * item.precio_base }
                : item
            ));
        } else {
            setCarrito([...carrito, { ...zapato, cantidad: 1, precio_unitario: zapato.precio_base, subtotal: zapato.precio_base }]);
        }
    };

    // Cálculos de Totales
    const subtotalCarrito = carrito.reduce((acc, item) => acc + item.subtotal, 0);
    
    let descuentoCalculado = 0;
    if (tipoDescuento === 'Monto') {
        descuentoCalculado = parseFloat(valorDescuento) || 0;
    } else if (tipoDescuento === 'Porcentaje') {
        descuentoCalculado = subtotalCarrito * ((parseFloat(valorDescuento) || 0) / 100);
    }
    
    // Evitamos totales negativos
    const totalFinal = Math.max(0, subtotalCarrito - descuentoCalculado);

    const cobrarVenta = async () => {
        if (carrito.length === 0) return alert("El carrito está vacío");
        
        // Validaciones estrictas de negocio
        if (tipoDescuento !== 'Ninguno' && (!valorDescuento || valorDescuento <= 0)) {
            return alert("Ingresa un valor válido para el descuento.");
        }
        if (tipoDescuento !== 'Ninguno' && !motivoDescuento.trim()) {
            return alert("Por políticas de auditoría, debes justificar el motivo del descuento.");
        }
        if (['Tarjeta', 'Transferencia'].includes(metodoPago) && !referenciaPago.trim()) {
            return alert(`Por favor ingresa el número de autorización o folio de la ${metodoPago}.`);
        }

        const payload = {
            id_vendedor: 1, 
            total: totalFinal,
            descuento: descuentoCalculado,
            motivo_descuento: tipoDescuento !== 'Ninguno' ? motivoDescuento : null,
            metodo_pago: metodoPago,
            referencia_pago: ['Tarjeta', 'Transferencia'].includes(metodoPago) ? referenciaPago : null,
            observaciones: "Venta desde POS",
            detalles: carrito.map(item => ({
                id_inventario: item.id_inventario, cantidad: item.cantidad,
                precio_unitario: item.precio_unitario, subtotal: item.subtotal
            }))
        };

        try {
            const res = await fetch('http://localhost:3000/api/ventas', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                const data = await res.json();
                alert(`¡Venta Exitosa! Ticket #${data.id_venta}`);
                // Limpiar todo después de cobrar
                setCarrito([]); setBusqueda(''); setResultados([]);
                setTipoDescuento('Ninguno'); setValorDescuento(''); setMotivoDescuento('');
                setMetodoPago('Efectivo'); setReferenciaPago('');
            } else {
                const error = await res.json();
                alert(`Error en la venta: ${error.error}`);
            }
        } catch (error) {
            alert("Fallo la conexión con el servidor de ventas.");
        }
    };

    return (
        <div className="container-fluid mt-4">
            <div className="row">
                {/* LADO IZQUIERDO: Buscador */}
                <div className="col-lg-8 mb-4">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-header bg-white border-bottom-0 pt-4 pb-0">
                            <h4 className="mb-0 fw-bold">Buscar Producto</h4>
                        </div>
                        <div className="card-body">
                            <form onSubmit={buscarZapato} className="mb-4">
                                <div className="input-group shadow-sm">
                                    <input 
                                        type="text" className="form-control form-control-lg border-primary" 
                                        placeholder="Ingresa el modelo o marca..."
                                        value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
                                    />
                                    <button type="submit" className="btn btn-primary btn-lg px-5">Buscar</button>
                                </div>
                            </form>
                            <div className="table-responsive border rounded">
                                <table className="table table-hover mb-0">
                                    <thead className="table-dark">
                                        <tr>
                                            <th>Modelo</th><th>Color</th><th>Talla / Stock</th>
                                            <th className="text-center">Precio</th><th className="text-center">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(resultadosAgrupados).length === 0 ? (
                                            <tr><td colSpan="5" className="text-center text-muted py-5">Realiza una búsqueda</td></tr>
                                        ) : (
                                            Object.keys(resultadosAgrupados).map(marca => (
                                                <Fragment key={marca}>
                                                    <tr className="table-light"><td colSpan="5" className="fw-bold fs-5 text-primary py-3"> Marca: {marca}</td></tr>
                                                    {Object.values(resultadosAgrupados[marca]).map((zapatoAgrupado, index) => (
                                                        <FilaZapatoAgrupado key={index} zapatoInfo={zapatoAgrupado} agregarAlCarrito={agregarAlCarrito} />
                                                    ))}
                                                </Fragment>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>

                {/* LADO DERECHO: Carrito y Cobro */}
                <div className="col-lg-4 mb-4">
                    <div className="card shadow-sm h-100 border-0">
                        <div className="card-header bg-dark text-white pt-3 pb-3">
                            <h4 className="mb-0 fw-bold">Carrito de Venta</h4>
                        </div>
                        <div className="card-body d-flex flex-column bg-light p-3">
                            
                            {/* Lista de productos */}
                            <div className="flex-grow-1 overflow-auto bg-white p-2 border rounded mb-3" style={{ maxHeight: '250px' }}>
                                {carrito.length === 0 ? (
                                    <div className="text-center text-muted mt-4">El carrito está vacío</div>
                                ) : (
                                    <ul className="list-group list-group-flush">
                                        {carrito.map((item, i) => (
                                            <li key={i} className="list-group-item d-flex justify-content-between px-1 border-bottom">
                                                <div>
                                                    <h6 className="my-0 fw-bold">{item.modelo} <small>({item.talla})</small></h6>
                                                    <small className="text-muted">{item.cantidad} x ${item.precio_unitario}</small>
                                                </div>
                                                <span className="fw-bold text-success">${item.subtotal}</span>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>

                            {/* Sección de Descuentos */}
                            <div className="bg-white border rounded p-3 mb-3 shadow-sm">
                                <label className="form-label fw-bold text-primary mb-1">Aplicar Descuento</label>
                                <select 
                                    className="form-select form-select-sm mb-2" 
                                    value={tipoDescuento} 
                                    onChange={e => {
                                        setTipoDescuento(e.target.value);
                                        setValorDescuento(''); setMotivoDescuento('');
                                    }}
                                >
                                    <option value="Ninguno">Sin Descuento</option>
                                    <option value="Monto">Descuento por Monto Fijo ($)</option>
                                    <option value="Porcentaje">Descuento por Porcentaje (%)</option>
                                </select>
                                
                                {tipoDescuento !== 'Ninguno' && (
                                    <div className="row g-2">
                                        <div className="col-4">
                                            <input 
                                                type="number" className="form-control form-control-sm" placeholder="Valor"
                                                value={valorDescuento} onChange={e => setValorDescuento(e.target.value)}
                                            />
                                        </div>
                                        <div className="col-8">
                                            <input 
                                                type="text" className="form-control form-control-sm" placeholder="Motivo (Ej. Buen Fin)"
                                                value={motivoDescuento} onChange={e => setMotivoDescuento(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Sección de Pago y Totales */}
                            <div className="bg-white border rounded p-3 shadow-sm">
                                <div className="d-flex justify-content-between text-muted mb-1">
                                    <span>Subtotal:</span>
                                    <span>${subtotalCarrito.toFixed(2)}</span>
                                </div>
                                {descuentoCalculado > 0 && (
                                    <div className="d-flex justify-content-between text-danger mb-1 fw-bold">
                                        <span>Descuento Aplicado:</span>
                                        <span>-${descuentoCalculado.toFixed(2)}</span>
                                    </div>
                                )}
                                <div className="d-flex justify-content-between align-items-center mt-2 pt-2 border-top mb-3">
                                    <span className="fs-5 fw-bold text-secondary">TOTAL:</span>
                                    <span className="fs-2 fw-black text-success">${totalFinal.toFixed(2)}</span>
                                </div>
                                
                                <label className="form-label fw-bold mb-1">Método de Pago</label>
                                <select 
                                    className="form-select mb-2 border-dark"
                                    value={metodoPago}
                                    onChange={(e) => {
                                        setMetodoPago(e.target.value);
                                        setReferenciaPago('');
                                    }}
                                >
                                    <option value="Efectivo">💵 Efectivo</option>
                                    <option value="Tarjeta">💳 Tarjeta (TDD/TDC)</option>
                                    <option value="Transferencia">📱 Transferencia (SPEI)</option>
                                </select>

                                {/* Input dinámico para referencia */}
                                {['Tarjeta', 'Transferencia'].includes(metodoPago) && (
                                    <input 
                                        type="text" className="form-control mb-3" 
                                        placeholder="Folio de autorización / Rastreo"
                                        value={referenciaPago} onChange={e => setReferenciaPago(e.target.value)}
                                    />
                                )}

                                <button 
                                    onClick={cobrarVenta} disabled={carrito.length === 0}
                                    className="btn btn-dark w-100 btn-lg fw-bold shadow mt-2"
                                >
                                    COBRAR ${totalFinal.toFixed(2)}
                                </button>
                            </div>
                            
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}