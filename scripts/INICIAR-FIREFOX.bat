@echo off
cls
echo ==================================================
echo  Sistema de Bicicletario - Firefox
echo ==================================================
echo.

python --version >nul 2>&1
if errorlevel 1 (
    echo ERRO: Python nao instalado!
    pause
    exit /b 1
)

if not exist "server.py" (
    echo ERRO: Execute na pasta do projeto!
    pause
    exit /b 1
)

echo Iniciando servidor...

for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5001" ^| find "LISTENING"') do taskkill /F /PID %%a >nul 2>&1

start /B python server.py
timeout /t 6 /nobreak >nul

if exist "C:\Program Files\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files\Mozilla Firefox\firefox.exe" http://localhost:5000
) else if exist "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" (
    start "" "C:\Program Files (x86)\Mozilla Firefox\firefox.exe" http://localhost:5000
) else (
    start http://localhost:5000
)

echo.
echo Sistema em: http://localhost:5000
echo Dados em: dados\navegador\
pause
