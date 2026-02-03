@echo off
title DIAGNOSTICO DE SISTEMA - BICICLETARIO
cd /d "%~dp0..\.."
cls
echo Iniciando verificacao de integridade...
node scripts/check-system.js
echo.
echo Pressione qualquer tecla para sair...
pause >nul
