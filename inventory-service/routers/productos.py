from fastapi import APIRouter, HTTPException
import psycopg2.errors
from psycopg2.extras import RealDictCursor
from typing import List
from database import get_db_connection
from schemas import NuevoZapato
from schemas import NuevoZapatoMatriz, EntradaMasiva, RestarStockRequest

router = APIRouter(prefix="/api/inventory", tags=["Productos"])

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
                i.id_inventario,
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

@router.get("/catalogo/buscar")
def buscar_catalogo_zapatos(modelo: str):
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # Buscamos en los zapatos, sin importar si tienen inventario o no
        query = """
            SELECT z.id_zapato, z.modelo, z.precio_base, 
                   m.nombre AS marca, col.nombre AS color
            FROM zapatos z
            INNER JOIN marcas m ON z.id_marca = m.id_marca
            INNER JOIN colores col ON z.id_color = col.id_color
            WHERE z.modelo ILIKE %s
            ORDER BY m.nombre, col.nombre;
        """
        cur.execute(query, (f"%{modelo}%",))
        return cur.fetchall()
    finally:
        cur.close()
        conn.close()

@router.get("/categorias")
def get_categorias():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM categorias ORDER BY nombre;")
    res = cur.fetchall()
    cur.close(); conn.close()
    return res

@router.get("/colores")
def get_colores():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM colores ORDER BY nombre;")
    res = cur.fetchall()
    cur.close(); conn.close()
    return res

@router.get("/tallas")
def get_tallas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM tallas ORDER BY numero;")
    res = cur.fetchall()
    cur.close(); conn.close()
    return res

@router.get("/bodegas")
def get_bodegas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM bodegas ORDER BY nombre;")
    res = cur.fetchall()
    cur.close(); conn.close()
    return res



# ENDPOINT MODAL 1: ALTA DE MODELO Y CORRIDA INICIAL
@router.post("/alta")
def registrar_zapato(datos: NuevoZapatoMatriz):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        # 1. Insertamos el modelo maestro
        cur.execute("""
            INSERT INTO zapatos (modelo, id_marca, id_categoria, id_color, precio_base)
            VALUES (%s, %s, %s, %s, %s) RETURNING id_zapato;
        """, (datos.modelo, datos.id_marca, datos.id_categoria, datos.id_color, datos.precio_base))
        nuevo_id_zapato = cur.fetchone()[0]

        # 2. Iteramos el arreglo de la matriz para inyectar cada talla
        for item in datos.corrida:
            cur.execute("""
                INSERT INTO inventario (id_zapato, id_talla, id_bodega, stock_existente)
                VALUES (%s, %s, %s, %s) RETURNING id_inventario;
            """, (nuevo_id_zapato, item.id_talla, datos.id_bodega, item.cantidad))
            id_inv = cur.fetchone()[0]

            cur.execute("""
                INSERT INTO movimientos_inv (id_inventario, tipo_movimiento, cantidad, motivo)
                VALUES (%s, 'ENTRADA', %s, 'Carga inicial de modelo nuevo');
            """, (id_inv, item.cantidad))

        # Confirmamos toda la transacción
        conn.commit()
        return {"mensaje": "Modelo y corrida registrados con éxito", "id_zapato": nuevo_id_zapato}
    except Exception as e:
        conn.rollback() # Si algo explota, no guardamos datos a medias
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# ENDPOINT MODAL 2: INGRESO DE CORRIDA A MODELO EXISTENTE
@router.post("/entrada-masiva")
def entrada_masiva(datos: List[EntradaMasiva]):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        for item in datos:
            # Primero revisamos si esa talla específica ya existe en esa bodega
            cur.execute("""
                SELECT id_inventario FROM inventario
                WHERE id_zapato = %s AND id_talla = %s AND id_bodega = %s;
            """, (item.id_zapato, item.id_talla, item.id_bodega))
            row = cur.fetchone()

            if row:
                # Si la caja ya existe en el anaquel, le sumamos la cantidad
                id_inv = row[0]
                cur.execute("""
                    UPDATE inventario SET stock_existente = stock_existente + %s
                    WHERE id_inventario = %s;
                """, (item.cantidad, id_inv))
            else:
                # Si esa talla no la tenían antes, abrimos un registro nuevo
                cur.execute("""
                    INSERT INTO inventario (id_zapato, id_talla, id_bodega, stock_existente)
                    VALUES (%s, %s, %s, %s) RETURNING id_inventario;
                """, (item.id_zapato, item.id_talla, item.id_bodega, item.cantidad))
                id_inv = cur.fetchone()[0]

            # Registramos en el historial
            cur.execute("""
                INSERT INTO movimientos_inv (id_inventario, tipo_movimiento, cantidad, motivo)
                VALUES (%s, 'ENTRADA', %s, 'Ingreso de corrida existente');
            """, (id_inv, item.cantidad))

        conn.commit()
        return {"mensaje": "Corrida de tallas ingresada con éxito"}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/restar-stock")
def restar_stock(datos: RestarStockRequest):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        for item in datos.articulos:
            # 1. Intentamos restar el stock SOLO si hay suficiente
            cur.execute("""
                UPDATE inventario
                SET stock_existente = stock_existente - %s
                WHERE id_inventario = %s AND stock_existente >= %s
                RETURNING id_inventario;
            """, (item.cantidad, item.id_inventario, item.cantidad))
            
            # Si cur.fetchone() es None, significa que no se actualizó nada (por falta de stock o ID falso)
            if cur.fetchone() is None:
                raise Exception(f"Stock insuficiente o producto no encontrado para el ID {item.id_inventario}")

            # 2. Registramos el movimiento para tu historial de auditoría
            cur.execute("""
                INSERT INTO movimientos_inv (id_inventario, tipo_movimiento, cantidad, motivo)
                VALUES (%s, 'SALIDA', %s, 'Venta realizada en Punto de Venta');
            """, (item.id_inventario, item.cantidad))

        conn.commit()
        return {"mensaje": "Stock descontado exitosamente en Postgres"}
    
    except Exception as e:
        conn.rollback() # Cancelamos si no hay stock
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()