from fastapi import APIRouter, HTTPException
import psycopg2.errors
from psycopg2.extras import RealDictCursor
from database import get_db_connection
from schemas import NuevoZapato

router = APIRouter(prefix="/api/inventory", tags=["Productos"])

@router.post("/alta")
def alta_producto(zapato: NuevoZapato):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO zapatos (modelo, id_marca, id_categoria, precio_base, id_color) 
            VALUES (%s, %s, %s, %s, %s) RETURNING id_zapato;
        """, (zapato.modelo, zapato.id_marca, zapato.id_categoria, zapato.precio_base, zapato.id_color))
        id_zapato = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO inventario (id_zapato, id_talla, id_bodega, stock_existente)
            VALUES (%s, %s, %s, %s) RETURNING id_inventario;
        """, (id_zapato, zapato.id_talla, zapato.id_bodega, zapato.stock_inicial))
        id_inventario = cur.fetchone()[0]

        cur.execute("""
            INSERT INTO movimientos_inv (id_inventario, tipo_movimiento, cantidad, motivo)
            VALUES (%s, 'ENTRADA', %s, 'Alta inicial');
        """, (id_inventario, zapato.stock_inicial))

        conn.commit()
        return {"mensaje": "Producto registrado exitosamente.", "id_zapato": id_zapato}
    except psycopg2.errors.ForeignKeyViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Datos de catálogo inválidos.")
    finally:
        cur.close()
        conn.close()


# --- NUEVO ENDPOINT: Consultar catálogo de zapatos con JOINs ---
@router.get("/zapatos")
def obtener_zapatos():
    conn = get_db_connection()
    # Usamos RealDictCursor para que el resultado sea compatible con JSON
    cur = conn.cursor(cursor_factory=RealDictCursor) 
    
    try:
        cur.execute("""
            SELECT 
                z.id_zapato, 
                z.modelo, 
                m.nombre AS marca, 
                c.nombre AS categoria,
                col.nombre AS color, -- <--- Obtenemos el nombre del color
                z.material, 
                z.genero, 
                z.precio_base 
            FROM zapatos z
            INNER JOIN marcas m ON z.id_marca = m.id_marca
            INNER JOIN categorias c ON z.id_categoria = c.id_categoria
            INNER JOIN colores col ON z.id_color = col.id_color -- <--- NUEVO JOIN
            ORDER BY z.id_zapato DESC;
        """)
        resultado = cur.fetchall()
        return resultado
        
    except Exception as e:
        print(f"Error en BD: {e}")
        raise HTTPException(status_code=500, detail="Error al consultar el catálogo de zapatos")
        
    finally:
        cur.close()
        conn.close()
        
@router.get("/buscar")
def buscar_stock(modelo: str = "", id_marca: int = None):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        # La consulta maestra que une zapatos, colores, tallas e inventario
        query = """
            SELECT 
                z.modelo, 
                m.nombre AS marca, 
                col.nombre AS color, 
                t.numero AS talla, 
                i.stock_existente, 
                z.precio_base,
                b.nombre AS bodega
            FROM zapatos z
            INNER JOIN marcas m ON z.id_marca = m.id_marca
            INNER JOIN colores col ON z.id_color = col.id_color
            INNER JOIN inventario i ON z.id_zapato = i.id_zapato
            INNER JOIN tallas t ON i.id_talla = t.id_talla
            INNER JOIN bodegas b ON i.id_bodega = b.id_bodega
            WHERE 1=1
        """
        params = []
        
        # Filtros dinámicos (si el usuario escribe algo, lo agregamos al WHERE)
        if modelo:
            query += " AND z.modelo ILIKE %s" # ILIKE busca coincidencias sin importar mayúsculas/minúsculas
            params.append(f"%{modelo}%")
            
        if id_marca:
            query += " AND z.id_marca = %s"
            params.append(id_marca)
            
        query += " ORDER BY z.modelo, col.nombre, t.numero ASC;"
        
        cur.execute(query, tuple(params))
        return cur.fetchall()
        
    except Exception as e:
        print(f"Error en BD: {e}")
        raise HTTPException(status_code=500, detail="Error al buscar stock")
        
    finally:
        cur.close()
        conn.close()