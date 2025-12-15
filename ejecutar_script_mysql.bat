@echo off
REM Script para ejecutar alter_denuncias_add_municipio.sql en MySQL
REM 
REM INSTRUCCIONES:
REM 1. Modifica las siguientes variables según tu configuración:
REM    - MYSQL_USER: tu usuario de MySQL
REM    - MYSQL_PASSWORD: tu contraseña de MySQL
REM    - MYSQL_DATABASE: nombre de tu base de datos
REM
REM 2. Ejecuta este archivo .bat

set MYSQL_USER=root
set MYSQL_PASSWORD=tu_contraseña
set MYSQL_DATABASE=nombre_de_tu_base_de_datos

echo Ejecutando script SQL...
mysql -u %MYSQL_USER% -p%MYSQL_PASSWORD% %MYSQL_DATABASE% < alter_denuncias_add_municipio.sql

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Script ejecutado exitosamente!
    echo ========================================
) else (
    echo.
    echo ========================================
    echo Error al ejecutar el script
    echo ========================================
)

pause

