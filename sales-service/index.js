const express = require('express');
const cors = require('cors');
const ventasRoutes = require('./routes/ventas'); 

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/ventas', ventasRoutes);

app.get('/', (req, res) => {
    res.json({ service: "Sales Service", status: "Activo" });
});

app.listen(PORT, () => {
    console.log(`Microservicio de Ventas corriendo en http://localhost:${PORT}`);
});