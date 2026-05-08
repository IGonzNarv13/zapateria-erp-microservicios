from fastapi import FastAPI
from database import get_db_connection
from fastapi.middleware.cors import CORSMiddleware
from routers import catalogos, productos

app = FastAPI(title="Microservicio de Inventario - Arro")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup_event():
    pass

app.include_router(catalogos.router)
app.include_router(productos.router)

@app.get("/")
def read_root():
    return {"service": "Inventory", "status": "Online"}