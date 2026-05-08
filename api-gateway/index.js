const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = 8080; 

app.use(cors());

// ==========================================
// MIDDLEWARE DE SEGURIDAD (JWT)
// ==========================================
const SECRET_KEY = "Firma_Secreta_Arro_2026_ShoeTrack_Enterprise_Security"; 

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ mensaje: "Acceso denegado: Token requerido en las cabeceras" });
    }

    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ mensaje: "Acceso denegado: Formato de token inválido" });
    }

    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            console.log("=== ERROR DE JWT DETECTADO ===");
            console.log("Motivo exacto:", err.message);
            console.log("Token recibido:", token);
            return res.status(401).json({ mensaje: "Acceso denegado: Token inválido o expirado" });
        }
        
        req.usuario = decoded;
        next();
    });
};

// ==========================================
// CONFIGURACIÓN DE RUTAS (PROXIES)
// ==========================================

app.use('/api/auth', createProxyMiddleware({ 
    target: 'http://localhost:8002', 
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '',
    },
}));

// 1. Inventario
app.use('/api/inventory', verificarToken, createProxyMiddleware({
    target: 'http://localhost:8001/api/inventory', 
    changeOrigin: true,
}));

// 2. Ventas
app.use('/api/sales', verificarToken, createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/sales': '',
    },
}));

// 3. Reportes
// app.use('/api/reports', verificarToken, createProxyMiddleware({
//     target: 'http://localhost:8083',
//     changeOrigin: true,
//     pathRewrite: {
//         '^/api/reports': '',
//     },
// }));

// 4. Analitica
app.use('/api/reports', verificarToken, createProxyMiddleware({
    target: 'http://localhost:5224', 
    changeOrigin: true,
    pathRewrite: {
        '^/api/reports': '', // Tu truco maestro para limpiar la ruta
    },
    onError: (err, req, res) => {
        console.error("Error al conectar con Report Service (C#):", err.message);
        res.status(500).json({ error: "El servicio de analítica no está disponible en este momento." });
    }
}));

// ==========================================
// RUTA DE PRUEBA DEL GATEWAY
// ==========================================
app.get('/', (req, res) => {
    res.send('API Gateway del ShoeTrack ERP Operativo y Protegido por JWT');
});

app.listen(PORT, () => {
    console.log(`[API Gateway] Escuchando tráfico seguro en http://localhost:${PORT}`);
});