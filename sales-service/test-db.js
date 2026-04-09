const mysql = require('mysql2/promise');

async function probarConexion() {
    try {
        console.log("Intentando conectar a MySQL...");
        const conn = await mysql.createConnection({
            host: '127.0.0.1',
            port: 3306,
            user: 'root',
            password: 'root_password', // Pon EXACTAMENTE la que usas en la extensión
            database: 'shoe_track_sales'
        });
        console.log("✅ ¡Conexión Exitosa desde Node.js!");
        await conn.end();
    } catch (error) {
        console.error("❌ Falló la conexión. El error exacto es:");
        console.error(error.message);
    }
}

probarConexion();