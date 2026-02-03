@echo off
cd /d "%~dp0..\.."
REM Limpar dados corrompidos do desktop
chcp 65001 > nul
setlocal enabledelayedexpansion

cls
echo.
echo ╔════════════════════════════════════════════════════════════╗
echo ║   LIMPEZA DE DADOS - VERSÃO DESKTOP                       ║
echo ╚════════════════════════════════════════════════════════════╝
echo.
echo ⚠️  AVISO: Isto vai deletar todos os dados locais!
echo.
echo Dados a serem deletados:
echo  • dados/desktop/clientes.json
echo  • dados/desktop/registros.json
echo  • dados/desktop/usuarios.json
echo  • dados/desktop/auditoria.json
echo  • dados/desktop/categorias.json
echo.
pause /prompt "Pressione ENTER para continuar ou Ctrl+C para cancelar..."

REM Deletar pasta de dados
if exist dados\desktop (
    echo Deletando pasta dados\desktop...
    rmdir /s /q dados\desktop
    echo ✅ Pasta deletada
) else (
    echo ℹ️  Pasta não existe
)

echo.
echo ════════════════════════════════════════════════════════════
echo ✅ Limpeza concluída!
echo.
echo Os dados padrão serão recriados automaticamente ao iniciar:
echo  • admin / admin123
echo  • CELO123 / CELO123
echo.
echo Agora execute: scripts\batch\INICIAR.bat
echo ════════════════════════════════════════════════════════════
echo.
pause
