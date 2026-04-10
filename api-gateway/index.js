const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const jwt = require('jsonwebtoken'); // <-- 1. Importamos la librería JWT

const app = express();
const PORT = 8080; 

app.use(cors());

// ==========================================
// MIDDLEWARE DE SEGURIDAD (JWT)
// ==========================================
const SECRET_KEY = "Firma_Secreta_Arro_2026_ShoeTrack_Enterprise_Security"; // Debe coincidir con el microservicio de Identidad

const verificarToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(403).json({ mensaje: "Acceso denegado: Token requerido en las cabeceras" });
    }

    // Extraemos el token quitando la palabra "Bearer "
    const token = authHeader.split(' ')[1];

    if (!token) {
        return res.status(403).json({ mensaje: "Acceso denegado: Formato de token inválido" });
    }

    // Verificamos la firma
    jwt.verify(token, SECRET_KEY, (err, decoded) => {
        if (err) {
            return res.status(401).json({ mensaje: "Acceso denegado: Token inválido o expirado" });
        }
        
        // El token es válido, guardamos la info del empleado y dejamos pasar
        req.usuario = decoded;
        next();
    });
};

// ==========================================
// CONFIGURACIÓN DE RUTAS (PROXIES)
// ==========================================

// 0. Identidad / Login (PÚBLICA - No lleva verificarToken)
app.use('/api/auth', createProxyMiddleware({ 
    target: 'http://localhost:8002', 
    changeOrigin: true,
    pathRewrite: {
        '^/api/auth': '',
    },
}));

// 1. Inventario (PROTEGIDA)
app.use('/api/inventory', verificarToken, createProxyMiddleware({
    target: 'http://localhost:8001/api/inventory', 
    changeOrigin: true,
}));

// 2. Ventas (PROTEGIDA)
app.use('/api/sales', verificarToken, createProxyMiddleware({
    target: 'http://localhost:3000',
    changeOrigin: true,
    pathRewrite: {
        '^/api/sales': '',
    },
}));

// 3. Reportes (PROTEGIDA)
app.use('/api/reports', verificarToken, createProxyMiddleware({
    target: 'http://localhost:8083',
    changeOrigin: true,
    pathRewrite: {
        '^/api/reports': '',
    },
}));

// ==========================================
// RUTA DE PRUEBA DEL GATEWAY
// ==========================================
app.get('/', (req, res) => {
    res.send('API Gateway del ShoeTrack ERP Operativo y Protegido por JWT');
});

// Arrancar el Gateway
app.listen(PORT, () => {
    console.log(`[API Gateway] Escuchando tráfico seguro en http://localhost:${PORT}`);
});