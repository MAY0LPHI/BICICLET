@echo off
cd /d "%~dp0..\.."
REM Versão simplificada - rápida e direta
setlocal enabledelayedexpansion

if not exist node_modules (
    echo Instalando dependências...
    call npm install
)

echo Iniciando aplicação...
call npm start
pause
