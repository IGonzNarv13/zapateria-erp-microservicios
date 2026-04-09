// Archivo: index.js
const express = require('express');
const cors = require('cors');
const ventasRoutes = require('./routes/ventas'); // Importamos tus rutas

const app = express();
const PORT = 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Conectamos la ruta de ventas
app.use('/api/ventas', ventasRoutes);

// Ruta de prueba base
app.get('/', (req, res) => {
    res.json({ service: "Sales Service", status: "Activo" });
});

app.listen(PORT, () => {
    console.log(`Microservicio de Ventas corriendo en http://localhost:${PORT}`);
});