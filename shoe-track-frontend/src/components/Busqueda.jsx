import React, { useState, useEffect } from 'react';
import { obtenerMarcas, buscarStock } from '../services/inventoryService';
import { Search, MapPin, Package } from 'lucide-react';

const Buscador = () => {
    const [marcas, setMarcas] = useState([]);
    const [resultados, setResultados] = useState([]);
    const [modeloBusqueda, setModeloBusqueda] = useState('');
    const [marcaSeleccionada, setMarcaSeleccionada] = useState('');
    const [buscando, setBuscando] = useState(false);

    useEffect(() => {
        const fetchCatalogos = async () => {
            try { setMarcas(await obtenerMarcas()); } 
            catch (e) { console.error(e); }
        };
        fetchCatalogos();
    }, []);

    const handleBuscar = async (e) => {
        e.preventDefault();
        setBuscando(true);
        try { setResultados(await buscarStock(modeloBusqueda, marcaSeleccionada)); } 
        catch (e) { alert("Error en la consulta"); } 
        finally { setBuscando(false); }
    };

    const formatTalla = (n) => n.toString().endsWith('.5') ? `${Math.floor(n)} ½` : n;

    const procesarMatriz = () => {
        const bodegas = {};
        const tallasSet = new Set();

        resultados.forEach(item => {
            const numTalla = parseFloat(item.talla);
            tallasSet.add(numTalla);
            if (!bodegas[item.bodega]) bodegas[item.bodega] = {};
            const key = `${item.modelo}-${item.color}`;
            if (!bodegas[item.bodega][key]) {
                bodegas[item.bodega][key] = { ...item, tallas: {} };
            }
            bodegas[item.bodega][key].tallas[numTalla] = item.stock_existente;
        });

        return { bodegas, listaTallas: Array.from(tallasSet).sort((a, b) => a - b) };
    };

    const { bodegas, listaTallas } = procesarMatriz();

    return (
        <div className="container mt-4">
            <div className="card shadow-sm p-4 mb-4 border-0 rounded-4">
                <form onSubmit={handleBuscar} className="row g-3 align-items-end">
                    <div className="col-md-5">
                        <label className="small fw-bold text-muted">Modelo</label>
                        <input type="text" className="form-control" value={modeloBusqueda} onChange={e => setModeloBusqueda(e.target.value)} placeholder="Ej. 5003" />
                    </div>
                    <div className="col-md-5">
                        <label className="small fw-bold text-muted">Marca</label>
                        <select className="form-select" value={marcaSeleccionada} onChange={e => setMarcaSeleccionada(e.target.value)}>
                            <option value="">Todas</option>
                            {marcas.map(m => <option key={m.id_marca} value={m.id_marca}>{m.nombre}</option>)}
                        </select>
                    </div>
                    <div className="col-md-2">
                        <button className="btn btn-dark w-100 fw-bold"> <Search size={18} className="me-2"/> Buscar</button>
                    </div>
                </form>
            </div>

            {Object.keys(bodegas).length > 0 ? Object.keys(bodegas).map(name => (
                <div key={name} className="mb-5">
                    <h5 className="fw-bold text-primary mb-3"><MapPin size={20}/> {name.toUpperCase()}</h5>
                    <div className="table-responsive shadow-sm rounded-3">
                        <table className="table table-bordered text-center align-middle bg-white">
                            <thead className="table-dark">
                                <tr>
                                    <th>MODELO</th><th>COLOR</th>
                                    {listaTallas.map(t => <th key={t}>{formatTalla(t)}</th>)}
                                    <th>PRECIO</th>
                                </tr>
                            </thead>
                            <tbody>
                                {Object.values(bodegas[name]).map((p, i) => (
                                    <tr key={i}>
                                        <td className="fw-bold">
                                            {p.modelo} <br/>
                                            <small className="text-muted fw-normal">{p.marca}</small>
                                        </td>
                                        <td className="align-middle">{p.color}</td>
                                        {listaTallas.map(t => (
                                            <td key={t} className={p.tallas[t] > 0 ? "table-success fw-bold" : "text-muted"}>
                                                {p.tallas[t] || '-'}
                                            </td>
                                        ))}
                                        <td className="text-success fw-bold">${parseFloat(p.precio_base).toFixed(2)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )) : !buscando && <div className="text-center py-5"><Package size={40} className="text-muted mb-2"/><p>Sin resultados</p></div>}
        </div>
    );
};

export default Buscador;