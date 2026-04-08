const express = require('express');
const mysql = require('mysql2');

const app = express();
const PORT = 3000;

// Middleware para que Node.js entienda el formato JSON
app.use(express.json());

// 1. Configurar la conexión a MySQL (con las credenciales de tu docker-compose)
const pool = mysql.createPool({
    host: 'localhost',
    user: 'user_sales',
    password: 'password_sales',
    database: 'sales_db',
    port: 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// 2. Crear la tabla de tickets si no existe al arrancar
pool.query(`
    CREATE TABLE IF NOT EXISTS tickets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        id_venta VARCHAR(50) UNIQUE,
        fecha TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        total DECIMAL(10, 2)
    )
`, (err) => {
    if (err) console.error("Error creando tabla en MySQL:", err);
    else console.log("Base de datos de ventas inicializada correctamente.");
});

// 3. Rutas del microservicio
app.get('/', (req, res) => {
    res.json({ service: "Sales", db_status: "Connected" });
});

app.listen(PORT, () => {
    console.log(`Microservicio de Ventas corriendo en http://localhost:${PORT}`);
});

// Endpoint principal: Procesar una venta
// Endpoint principal: Procesar una venta con validación síncrona
app.post('/checkout', async (req, res) => {
    const { total, articulos } = req.body;
    
    try {
        // 1. Tomamos el primer artículo que el cliente quiere comprar
        const productoRequerido = articulos[0];

        // 2. COMUNICACIÓN SÍNCRONA: Le preguntamos a Python por el catálogo
        const respuestaPython = await fetch('http://localhost:8001/items');
        
        if (!respuestaPython.ok) {
            throw new Error("El microservicio de inventario falló");
        }
        
        const inventario = await respuestaPython.json();

        // 3. Buscamos el zapato específico en lo que nos devolvió Python
        const zapato = inventario.find(item => item.id_producto === productoRequerido.id_producto);

        if (!zapato) {
            return res.status(404).json({ error: "Venta rechazada: El producto no existe en el catálogo." });
        }

        if (zapato.stock < productoRequerido.cantidad) {
            return res.status(400).json({ error: `Venta rechazada: Stock insuficiente. Solo quedan ${zapato.stock} pares.` });
        }

        // 4. Si hay stock, procedemos a guardar la venta en MySQL (Node.js)
        const id_venta = `V-${Math.floor(Math.random() * 10000)}`; 
        
        pool.query(
            'INSERT INTO tickets (id_venta, total) VALUES (?, ?)',
            [id_venta, total],
            (err, results) => {
                if (err) {
                    console.error("Error en MySQL:", err);
                    return res.status(500).json({ error: "Error interno al guardar el ticket" });
                }
                res.status(201).json({
                    mensaje: "Venta autorizada y registrada con éxito",
                    ticket: id_venta,
                    producto_validado: zapato.modelo,
                    total_pagado: total
                });
            }
        );

    } catch (error) {
        console.error("Fallo de red entre microservicios:", error);
        res.status(503).json({ error: "Servicio de inventario no disponible temporalmente. Venta cancelada." });
    }

});