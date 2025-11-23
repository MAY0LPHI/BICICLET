@echo off
cls
echo ==================================================
echo  Sistema de Bicicletario
echo ==================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao encontrado!
    echo.
    echo Instale o Python em: https://www.python.org/downloads/
    echo Marque a opcao "Add Python to PATH" na instalacao
    echo.
    pause
    exit /b 1
)

if not exist "server.py" (
    echo ERRO: Arquivo server.py nao encontrado!
    echo Execute este script dentro da pasta do projeto.
    echo.
    pause
    exit /b 1
)

echo Python OK
echo Pasta OK
echo.
echo Iniciando servidor...
echo.

for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

start /B python server.py

timeout /t 6 /nobreak >nul

echo Servidor iniciado!
echo.
echo Abrindo navegador em http://localhost:5000
echo.
start http://localhost:5000

echo.
echo ==================================================
echo Sistema rodando!
echo Servidor: http://localhost:5000
echo.
echo Dados salvos em: dados\navegador\
echo.
echo Para parar o servidor, feche esta janela
echo ==================================================
echo.
pause
