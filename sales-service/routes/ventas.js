const express = require('express');
const router = express.Router();
const pool = require('../db'); 

router.post('/', async (req, res) => {
    // 1. Recibimos los nuevos campos
    const { 
        id_vendedor, total, descuento, motivo_descuento, 
        metodo_pago, referencia_pago, observaciones, detalles 
    } = req.body;
    
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 2. Modificamos el INSERT para guardar el descuento y la referencia
        const [resultVenta] = await connection.execute(
            `INSERT INTO ventas (id_vendedor, total, descuento, motivo_descuento, metodo_pago, referencia_pago, observaciones) 
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
                id_vendedor, 
                total, 
                descuento || 0, 
                motivo_descuento || null, 
                metodo_pago, 
                referencia_pago || null, 
                observaciones || null
            ]
        );
        const id_nueva_venta = resultVenta.insertId;

        for (const detalle of detalles) {
            await connection.execute(
                `INSERT INTO detalles_venta (id_venta, id_inventario, cantidad, precio_unitario, subtotal) VALUES (?, ?, ?, ?, ?)`,
                [id_nueva_venta, detalle.id_inventario, detalle.cantidad, detalle.precio_unitario, detalle.subtotal]
            );
        }

        const payloadInventario = {
            articulos: detalles.map(d => ({
                id_inventario: d.id_inventario,
                cantidad: d.cantidad
            }))
        };

        const respuestaPython = await fetch('http://127.0.0.1:8001/api/inventory/restar-stock', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadInventario)
        });

        if (!respuestaPython.ok) {
            const errorPython = await respuestaPython.json();
            throw new Error(`Rechazo del Inventario: ${errorPython.detail}`);
        }

        await connection.commit();
        
        res.status(201).json({
            mensaje: "Venta exitosa y stock descontado",
            id_venta: id_nueva_venta
        });

    } catch (error) {
        await connection.rollback();
        console.error("Transacción abortada:", error.message);
        res.status(400).json({ error: error.message });
    } finally {
        connection.release();
    }
});

module.exports = router;