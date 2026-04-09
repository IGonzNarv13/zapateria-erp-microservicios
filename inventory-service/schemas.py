from pydantic import BaseModel
from typing import List


class NuevoZapato(BaseModel):
    modelo: str
    id_marca: int
    id_categoria: int
    id_talla: int
    id_bodega: int
    precio_base: float
    stock_inicial: int
    id_color: int

class NuevaMarca(BaseModel):
    nombre: str

class NuevaCategoria(BaseModel):
    nombre: str

class NuevaTalla(BaseModel):
    numero: float

class NuevaBodega(BaseModel):
    nombre: str
    ubicacion: str

class ItemAuditoria(BaseModel):
    id_inventario: int
    stock_fisico: int

class ReporteAuditoria(BaseModel):
    responsable: str   
    conteo: List[ItemAuditoria]

class NuevoColor(BaseModel):
    nombre: str

class ItemCorrida(BaseModel):
    id_talla: int
    cantidad: int

# Esquema para el MODAL 1 (Alta Nueva)
class NuevoZapatoMatriz(BaseModel):
    modelo: str
    id_marca: int
    id_categoria: int
    id_color: int
    precio_base: float
    id_bodega: int
    corrida: List[ItemCorrida]

# Esquema para el MODAL 2 (Ingreso Masivo)
class EntradaMasiva(BaseModel):
    id_zapato: int
    id_talla: int
    id_bodega: int
    cantidad: int


class ItemVendido(BaseModel):
    id_inventario: int
    cantidad: int

class RestarStockRequest(BaseModel):
    articulos: List[ItemVendido]