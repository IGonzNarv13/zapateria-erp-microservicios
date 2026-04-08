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