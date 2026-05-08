from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
import psycopg2.errors
from psycopg2.extras import RealDictCursor
from typing import List
from database import get_db_connection
from schemas import NuevoZapato, NuevoZapatoMatriz, EntradaMasiva, RestarStockRequest

# -------------------------------------------------------------
# CONFIGURACIÓN DE SEGURIDAD JWT PARA PYTHON
# -------------------------------------------------------------
security = HTTPBearer()
SECRET_KEY = "Firma_Secreta_Arro_2026_ShoeTrack_Enterprise_Security"
ALGORITHM = "HS256"

def verificar_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

router = APIRouter(
    prefix="/api/inventory", 
    tags=["Productos"], 
    dependencies=[Depends(verificar_token)]
)

def obtener_zapatos():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor) 
    try:
        cur.execute("""
            SELECT 
                z.id_zapato, z.modelo, m.nombre AS marca, c.nombre AS categoria,
                col.nombre AS color, z.material, z.genero, z.precio_base 
            FROM zapatos z
            INNER JOIN marcas m ON z.id_marca = m.id_marca
            INNER JOIN categorias c ON z.id_categoria = c.id_categoria
            INNER JOIN colores col ON z.id_color = col.id_color
            ORDER BY z.id_zapato DESC;
        """)
        return cur.fetchall()
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
        query = """
            SELECT 
                i.id_inventario, z.modelo, m.nombre AS marca, col.nombre AS color, 
                t.numero AS talla, i.stock_existente, z.precio_base, b.nombre AS bodega
            FROM zapatos z
            INNER JOIN marcas m ON z.id_marca = m.id_marca
            INNER JOIN colores col ON z.id_color = col.id_color
            INNER JOIN inventario i ON z.id_zapato = i.id_zapato
            INNER JOIN tallas t ON i.id_talla = t.id_talla
            INNER JOIN bodegas b ON i.id_bodega = b.id_bodega
            WHERE 1=1
        """
        params = []
        if modelo:
            query += " AND z.modelo ILIKE %s" 
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

@router.post("/alta")
def registrar_zapato(datos: NuevoZapatoMatriz):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("""
            INSERT INTO zapatos (modelo, id_marca, id_categoria, id_color, precio_base)
            VALUES (%s, %s, %s, %s, %s) RETURNING id_zapato;
        """, (datos.modelo, datos.id_marca, datos.id_categoria, datos.id_color, datos.precio_base))
        nuevo_id_zapato = cur.fetchone()[0]

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

        conn.commit()
        return {"mensaje": "Modelo y corrida registrados con éxito", "id_zapato": nuevo_id_zapato}
    except Exception as e:
        conn.rollback() 
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

@router.post("/entrada-masiva")
def entrada_masiva(datos: List[EntradaMasiva]):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        for item in datos:
            cur.execute("""
                SELECT id_inventario FROM inventario
                WHERE id_zapato = %s AND id_talla = %s AND id_bodega = %s;
            """, (item.id_zapato, item.id_talla, item.id_bodega))
            row = cur.fetchone()

            if row:
                id_inv = row[0]
                cur.execute("""
                    UPDATE inventario SET stock_existente = stock_existente + %s
                    WHERE id_inventario = %s;
                """, (item.cantidad, id_inv))
            else:
                cur.execute("""
                    INSERT INTO inventario (id_zapato, id_talla, id_bodega, stock_existente)
                    VALUES (%s, %s, %s, %s) RETURNING id_inventario;
                """, (item.id_zapato, item.id_talla, item.id_bodega, item.cantidad))
                id_inv = cur.fetchone()[0]

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
            cur.execute("""
                UPDATE inventario
                SET stock_existente = stock_existente - %s
                WHERE id_inventario = %s AND stock_existente >= %s
                RETURNING id_inventario;
            """, (item.cantidad, item.id_inventario, item.cantidad))
            
            if cur.fetchone() is None:
                raise Exception(f"Stock insuficiente o producto no encontrado para el ID {item.id_inventario}")

            cur.execute("""
                INSERT INTO movimientos_inv (id_inventario, tipo_movimiento, cantidad, motivo)
                VALUES (%s, 'SALIDA', %s, 'Venta realizada en Punto de Venta');
            """, (item.id_inventario, item.cantidad))

        conn.commit()
        return {"mensaje": "Stock descontado exitosamente en Postgres"}
    except Exception as e:
        conn.rollback() 
        raise HTTPException(status_code=400, detail=str(e))
    finally:
        cur.close()
        conn.close()