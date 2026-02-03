@echo off
echo ========================================
echo   Build do Bicicletario Desktop
echo ========================================
echo.

echo Verificando Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado!
    echo Por favor, instale o Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js encontrado!
echo.

echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo [ERRO] Falha ao instalar dependencias
    pause
    exit /b 1
)

echo.
echo Dependencias instaladas com sucesso!
echo.

echo Gerando executavel (.exe)...
echo Isso pode demorar alguns minutos...
echo.

call npm run build
if errorlevel 1 (
    echo [ERRO] Falha ao gerar executavel
    pause
    exit /b 1
)

echo.
echo ========================================
echo   Build concluido com sucesso!
echo ========================================
echo.
echo O instalador esta em: dist\Gestao de Bicicletario Setup 2.1.0.exe
echo.
pause
