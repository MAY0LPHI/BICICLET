@echo off
REM Iniciar aplicação desktop - versão super rápida
cd /d "%~dp0..\.."
if not exist node_modules npm install
npm start
pause
