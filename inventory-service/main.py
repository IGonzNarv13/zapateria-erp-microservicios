from fastapi import FastAPI
from database import get_db_connection
from fastapi.middleware.cors import CORSMiddleware
from routers import catalogos, productos

app = FastAPI(title="Microservicio de Inventario - Arro")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # El puerto exacto de tu React
    allow_credentials=True,
    allow_methods=["*"], # Permite todos los métodos (GET, POST, etc.)
    allow_headers=["*"], # Permite todos los headers
)

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