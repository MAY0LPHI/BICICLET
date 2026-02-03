@echo off
cd /d "%~dp0..\.."
chcp 65001 > nul
setlocal enabledelayedexpansion

REM Cores (para Windows 10+)
cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   GESTOR DE BICICLETÁRIO - VERSÃO DESKTOP                 ║
echo ║   Inicializador Automático                                ║
echo ╚════════════════════════════════════════════════════════════╝
echo.

REM Verificar se Node.js está instalado
echo [1/3] Verificando Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRO: Node.js não está instalado!
    echo.
    echo Baixe em: https://nodejs.org/
    echo Instale a versão LTS (recomendado)
    echo.
    pause
    exit /b 1
)

node --version
echo ✅ Node.js encontrado
echo.

REM Verificar se npm está instalado
echo [2/3] Verificando npm...
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ ERRO: npm não está instalado!
    pause
    exit /b 1
)

npm --version
echo ✅ npm encontrado
echo.

REM Instalar dependências
echo [3/3] Instalando dependências (primeira vez pode levar alguns minutos)...
echo.

if exist node_modules (
    echo ✓ Dependências já estão instaladas
) else (
    echo Instalando pacotes...
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ ERRO ao instalar dependências!
        pause
        exit /b 1
    )
    echo ✅ Dependências instaladas com sucesso
)

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Tudo pronto! Iniciando aplicação...
echo ════════════════════════════════════════════════════════════
echo.
echo Dados serão salvos em: dados\desktop\
echo.

REM Iniciar Electron
call npm start

pause
