const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const jwt = require('jsonwebtoken'); // Importamos la librería de JWT

// Utilizamos la misma llave robusta de Spring Boot
const SECRET_KEY = "Firma_Secreta_Arro_2026_ShoeTrack_Enterprise_Security";

router.post('/', async (req, res) => {
    // -------------------------------------------------------------
    // VALIDACIÓN DE SEGURIDAD (JWT)
    // -------------------------------------------------------------
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ error: "Acceso denegado. No hay token." });
    }
    
    const token = authHeader.split(' ')[1];
    try {
        jwt.verify(token, SECRET_KEY); // Validamos que el token sea genuino
    } catch (error) {
        return res.status(401).json({ error: "Token inválido o expirado." });
    }
    // -------------------------------------------------------------

    const { 
        id_vendedor, total, descuento, motivo_descuento, 
        metodo_pago, referencia_pago, observaciones, detalles 
    } = req.body;
    
    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

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

        // LLamada a Python pasando el TOKEN de seguridad
        const respuestaPython = await fetch('http://127.0.0.1:8001/api/inventory/restar-stock', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` // Reenviamos el token para que Python lo acepte
            },
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