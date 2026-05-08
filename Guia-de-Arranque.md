# Guía de Arranque - ShoeTrack ERP

Este documento detalla los pasos técnicos necesarios para poner en marcha el ecosistema de microservicios de la Zapatería "ARRO".

## Requisitos Previos
* **Docker Desktop:** Debe estar en ejecución para levantar las bases de datos.
* **Entornos:** Node.js, Java JDK 17+, .NET 8 SDK y Python 3.12+.
* **Entorno Virtual:** Asegúrate de que la carpeta `.venv` exista dentro de `inventory-service`.

---

## Paso 1: Infraestructura (Docker)
Inicia los contenedores de las bases de datos (PostgreSQL para Inventario y MySQL para Ventas). Espera aproximadamente 1 minuto para que la inicialización sea completa.

docker-compose up -d

## Paso 2: Orquestador (API Gateway)
El Gateway centraliza las peticiones y debe ser el primer servicio de software en levantarse.


cd api-gateway
node index.js

##  Paso 3: Microservicios de Lógica
A partir de aquí, el orden de arranque de estos servicios es indistinto. Se recomienda abrir una terminal independiente para cada uno.

* **Identity Service (Java / Spring Boot)**
Gestiona la autenticación y emisión de tokens JWT.

PowerShell
cd identity-service
.\mvnw.cmd clean spring-boot:run
Puerto: 8081

* **Inventory Service (Python / FastAPI)**
Controla el catálogo y el stock físico en PostgreSQL.

PowerShell
cd inventory-service

*Activación de entorno virtual (PowerShell)*
(Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned) ; (& .\.\.venv\Scripts\Activate.ps1)

uvicorn main:app --reload --port 8001
Puerto: 8001

* **Report Service (.NET 8 / C#)**
Genera analíticas de ventas mediante Dapper.

Bash
cd report-service
dotnet run
Puerto: 5000 / 5001

* **Sales Service (Node.js / Express)**
Procesa las transacciones en MySQL y descuenta stock en Python.

Bash
cd sales-service
node index.js
Puerto: 3000

## Paso 4: Interfaz de Usuario (React + Vite)
Por último, levanta el Frontend para interactuar con el sistema.

Bash
cd shoe-track-frontend
npm run dev
Puerto: 5173
 
