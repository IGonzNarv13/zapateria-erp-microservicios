@echo off
title Finalizador ShoeTrack ERP (V2 - FORZADO)
echo ====================================================
echo Deteniendo el ecosistema ShoeTrack ERP de forma agresiva...
echo ====================================================

:: 1. Detener Node.js (Gateway, Sales, Frontend)
echo [1/5] Limpiando Node.js y Vite...
taskkill /F /FI "IMAGENAME eq node*" /T >nul 2>&1

:: 2. Detener Java (Identity Service)
:: Usamos comodín para atrapar java.exe y javaw.exe
echo [2/5] Eliminando procesos Java (JVM)...
taskkill /F /FI "IMAGENAME eq java*" /T >nul 2>&1

:: 3. Detener .NET (Report Service)
:: A veces el proceso se llama como el proyecto (report-service.exe)
echo [3/5] Eliminando procesos .NET y compiladores...
taskkill /F /FI "IMAGENAME eq dotnet*" /T >nul 2>&1
taskkill /F /IM VBCSCompiler.exe /T >nul 2>&1

:: 4. Detener Python (Inventory)
echo [4/5] Eliminando procesos Python y Uvicorn...
taskkill /F /FI "IMAGENAME eq python*" /T >nul 2>&1

:: 5. Docker (Bases de Datos)
echo [5/5] Bajando contenedores de Docker...
docker-compose down

:: EXTRA: Cerrar todas las ventanas de CMD que tengan los títulos que pusimos
echo [*] Cerrando ventanas de terminal colgadas...
taskkill /F /FI "WINDOWTITLE eq JAVA-Auth*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq CSHARP-Reports*" >nul 2>&1
taskkill /F /FI "WINDOWTITLE eq PYTHON-Inventory*" >nul 2>&1

echo ====================================================
echo ¡Limpieza total completada!
echo ====================================================
pause