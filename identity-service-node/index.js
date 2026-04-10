const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const { Pool } = require('pg'); // Importamos el cliente de Postgres

const app = express();
app.use(express.json());
app.use(cors());

// Configuración de la base de datos (Ajusta el password si es diferente)
const pool = new Pool({
    user: 'user_inv',
    host: 'localhost',
    database: 'inventory_db',
    password: 'password_inv',
    port: 5432,
});

const SECRET_KEY = "Firma_Secreta_Arro_2026"; 

app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Buscar al usuario en la base de datos real
        const result = await pool.query(
            'SELECT * FROM empleados WHERE email = $1 AND password = $2',
            [email, password]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ mensaje: "Credenciales inválidas" });
        }

        const usuario = result.rows[0];

        // 2. Fabricar el JWT
        const payload = {
            id_empleado: usuario.id_empleado,
            rol: usuario.rol
        };

        const token = jwt.sign(payload, SECRET_KEY, { expiresIn: '8h' });

        // 3. Entregar el token
        res.json({
            mensaje: "Autenticación exitosa",
            token: token,
            usuario: { nombre: usuario.nombre, rol: usuario.rol }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ mensaje: "Error interno del servidor" });
    }
});

const PORT = 8002;
app.listen(PORT, () => {
    console.log(`Microservicio de Identidad conectado a BD y corriendo en el puerto ${PORT}`);
});