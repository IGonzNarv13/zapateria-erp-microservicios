from fastapi import FastAPI
from database import get_db_connection
from routers import catalogos, productos

app = FastAPI(title="Microservicio de Inventario - Arro")

# Mantenemos tu script de creación de tablas al arrancar
@app.on_event("startup")
def startup_event():
    # ... (Aquí va todo tu script SQL del CREATE TABLE IF NOT EXISTS que ya teníamos) ...
    pass

# Conectar los routers (¡La magia de la modularidad!)
app.include_router(catalogos.router)
app.include_router(productos.router)

@app.get("/")
def read_root():
    return {"service": "Inventory", "status": "Online"}