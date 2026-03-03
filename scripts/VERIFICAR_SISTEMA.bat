@echo off
title DIAGNOSTICO DE SISTEMA - BICICLETARIO
cls
echo Iniciando verificacao de integridade...
node scripts/check-system.js
echo.
echo Pressione qualquer tecla para sair...
pause >nul
