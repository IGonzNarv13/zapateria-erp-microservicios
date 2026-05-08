using MySql.Data.MySqlClient;
using Dapper;
using System.Data;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options => {
    options.AddDefaultPolicy(policy => { 
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod(); 
    });
});

var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI();
app.UseCors(); 

string GetSalesDb(IConfiguration config) => config.GetConnectionString("SalesDb") ?? "";

// ==============================================================================
// MÓDULO 1: CORTE DE CAJA DIARIO
// ==============================================================================
app.MapGet("/corte-diario", async (IConfiguration config, string fecha) =>
{
    using IDbConnection db = new MySqlConnection(GetSalesDb(config));
    // Corrección: Se cambió DATE(fecha) por DATE(fecha_venta)
    string sql = @"
        SELECT 
            COUNT(id_venta) AS TotalTickets,
            COALESCE(SUM(total), 0) AS TotalIngresos,
            COALESCE(SUM(descuento), 0) AS TotalDescuentos,
            COALESCE(SUM(CASE WHEN metodo_pago = 'Efectivo' THEN total ELSE 0 END), 0) AS IngresoEfectivo,
            COALESCE(SUM(CASE WHEN metodo_pago = 'Tarjeta' THEN total ELSE 0 END), 0) AS IngresoTarjeta,
            COALESCE(SUM(CASE WHEN metodo_pago = 'Transferencia' THEN total ELSE 0 END), 0) AS IngresoTransferencia
        FROM ventas
        WHERE DATE(fecha_venta) = @FechaExacta;
    ";
    var reporte = await db.QueryFirstOrDefaultAsync(sql, new { FechaExacta = fecha });
    return Results.Ok(new { FechaCorte = fecha, Datos = reporte });
})
.WithName("ObtenerCorteDiario");


// ==============================================================================
// MÓDULO 2: RENDIMIENTO POR VENDEDOR
// ==============================================================================
app.MapGet("/rendimiento-vendedores", async (IConfiguration config, int mes, int anio) =>
{
    using IDbConnection db = new MySqlConnection(GetSalesDb(config));
    
    // Corrección: Se cambió MONTH(fecha) y YEAR(fecha) por fecha_venta
    string sql = @"
        SELECT 
            id_vendedor AS IdVendedor,
            COUNT(id_venta) AS TotalVentasRealizadas,
            COALESCE(SUM(total), 0) AS MontoTotalVendido
        FROM ventas
        WHERE MONTH(fecha_venta) = @Mes AND YEAR(fecha_venta) = @Anio
        GROUP BY id_vendedor
        ORDER BY MontoTotalVendido DESC;
    ";
    
    var reporte = await db.QueryAsync(sql, new { Mes = mes, Anio = anio });
    return Results.Ok(new { Periodo = $"{mes}/{anio}", TopVendedores = reporte });
})
.WithName("ObtenerRendimientoVendedores");


// ==============================================================================
// MÓDULO 3: TOP SELLERS
// ==============================================================================
app.MapGet("/top-sellers", async (IConfiguration config, int limite = 5) =>
{
    using IDbConnection db = new MySqlConnection(GetSalesDb(config));
    
    string sql = @"
        SELECT 
            id_inventario AS IdZapato,
            SUM(cantidad) AS UnidadesVendidas,
            SUM(subtotal) AS IngresoGenerado
        FROM detalles_venta
        GROUP BY id_inventario
        ORDER BY UnidadesVendidas DESC
        LIMIT @Limite;
    ";
    
    try {
        var reporte = await db.QueryAsync(sql, new { Limite = limite });
        return Results.Ok(new { Mensaje = $"Top {limite} productos más vendidos", Productos = reporte });
    } catch (Exception ex) {
        return Results.BadRequest(new { Error = "Verifica la estructura de la tabla detalles_venta.", Detalle = ex.Message });
    }
})
.WithName("ObtenerTopSellers");

app.Run();