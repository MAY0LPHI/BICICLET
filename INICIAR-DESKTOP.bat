@echo off
cls
echo ==================================================
echo  Sistema de Bicicletario - VERSAO DESKTOP
echo  BICICLETARIO SHOP. BOULEVARD V.V.
echo ==================================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js em: https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo [OK] Node.js encontrado!

echo Verificando dependencias...
if not exist "node_modules" (
    echo Instalando dependencias...
    call npm install
) else (
    echo [OK] Dependencias encontradas!
)
echo.

echo Iniciando aplicacao...
echo.
start /B npm start

echo.
echo ==================================================
echo Sistema Desktop iniciado!
echo.
echo Dados salvos em: dados\desktop\
echo.
echo Para fechar o sistema, feche a janela do aplicativo
echo ==================================================
echo.
pause
