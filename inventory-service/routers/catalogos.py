from fastapi import APIRouter, HTTPException
import psycopg2.errors
from psycopg2.extras import RealDictCursor
from database import get_db_connection
from schemas import NuevaMarca, NuevaCategoria, NuevaTalla, NuevaBodega

router = APIRouter(prefix="/api/inventory", tags=["Catalogos"])

# --- ENDPOINTS PARA MARCA ---
# -- Agregar marca --
@router.post("/marcas")
def agregar_marca(marca: NuevaMarca):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO marcas (nombre) VALUES (%s) RETURNING id_marca;", (marca.nombre,))
        id_marca = cur.fetchone()[0]
        conn.commit()
        return {"mensaje": "Marca registrada con éxito", "id_marca": id_marca}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Error: Esta marca ya existe.")
    finally:
        cur.close()
        conn.close()

# -- Obtener marca --
@router.get("/marcas")
def obtener_marcas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM marcas;")
    resultado = cur.fetchall()
    cur.close()
    conn.close()
    return resultado

# -- Actualizar marca --
@router.put("/marcas/{id_marca}")
def actualizar_marca(id_marca: int, marca: NuevaMarca):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE marcas SET nombre = %s WHERE id_marca = %s RETURNING id_marca;", 
            (marca.nombre, id_marca)
        )
        resultado = cur.fetchone()
        
        if not resultado:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Error: Marca no encontrada.")
            
        conn.commit()
        return {"mensaje": "Marca actualizada con éxito", "id_marca": resultado[0]}
        
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Error: Ya existe otra marca con ese nombre.")
    finally:
        cur.close()
        conn.close()

# --- ENDPOINTS PARA CATEGORÍAS ---
# -- Nueva categoria --
@router.post("/categorias")
def agregar_categoria(categoria: NuevaCategoria):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO categorias (nombre) VALUES (%s) RETURNING id_categoria;", (categoria.nombre,))
        id_categoria = cur.fetchone()[0]
        conn.commit()
        return {"mensaje": "Categoría registrada", "id_categoria": id_categoria}
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Error: Esta categoría ya existe.")
    finally:
        cur.close()
        conn.close()

@router.get("/categorias")
def obtener_categorias():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM categorias;")
    resultado = cur.fetchall()
    cur.close()
    conn.close()
    return resultado

# -- Modificar categoria -- 
@router.put("/categorias/{id_categoria}")
def actualizar_categoria(id_categoria: int, categoria: NuevaCategoria):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute(
            "UPDATE categorias SET nombre = %s WHERE id_categoria = %s RETURNING id_categoria;", 
            (categoria.nombre, id_categoria)
        )
        resultado = cur.fetchone()
        
        if not resultado:
            conn.rollback()
            raise HTTPException(status_code=404, detail="Error: Categoría no encontrada.")
            
        conn.commit()
        return {"mensaje": "Categoría actualizada con éxito", "id_categoria": resultado[0]}
        
    except psycopg2.errors.UniqueViolation:
        conn.rollback()
        raise HTTPException(status_code=400, detail="Error: Ya existe otra categoría con ese nombre.")
    finally:
        cur.close()
        conn.close()

# --- ENDPOINTS PARA TALLAS ---
# -- Nueva talla --
@router.post("/tallas")
def agregar_talla(talla: NuevaTalla):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO tallas (numero) VALUES (%s) RETURNING id_talla;", (talla.numero,))
        id_talla = cur.fetchone()[0]
        conn.commit()
        return {"mensaje": "Talla registrada", "id_talla": id_talla}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

# -- Modificar tallas --
@router.get("/tallas")
def obtener_talla():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM tallas;")
    resultado = cur.fetchall()
    cur.close()
    conn.close()
    return resultado

# --- ENDPOINTS PARA BODEGAS ---
# -- Nueva bodega --
@router.post("/bodegas")
def agregar_bodega(bodega: NuevaBodega):
    conn = get_db_connection()
    cur = conn.cursor()
    try:
        cur.execute("INSERT INTO bodegas (nombre, ubicacion) VALUES (%s, %s) RETURNING id_bodega;", 
                    (bodega.nombre, bodega.ubicacion))
        id_bodega = cur.fetchone()[0]
        conn.commit()
        return {"mensaje": "Bodega registrada", "id_bodega": id_bodega}
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        cur.close()
        conn.close()

#-- Consultar bodegas --
@router.get("/bodegas")
def obtener_bodegas():
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("SELECT * FROM bodegas;")
    resultado = cur.fetchall()
    cur.close()
    conn.close()
    return resultado
