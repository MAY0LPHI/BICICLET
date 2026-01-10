# PowerShell script to start the desktop application
# Clique com botão direito e selecione "Run with PowerShell"

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   GESTOR DE BICICLETÁRIO - VERSÃO DESKTOP                 ║" -ForegroundColor Cyan
Write-Host "║   Inicializador Automático                                ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Verificar Node.js
Write-Host "[1/3] Verificando Node.js..." -ForegroundColor Yellow
$nodeCheck = node --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Node.js encontrado: $nodeCheck" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: Node.js não está instalado!" -ForegroundColor Red
    Write-Host "Baixe em: https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host ""

# Verificar npm
Write-Host "[2/3] Verificando npm..." -ForegroundColor Yellow
$npmCheck = npm --version
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ npm encontrado: $npmCheck" -ForegroundColor Green
} else {
    Write-Host "❌ ERRO: npm não está instalado!" -ForegroundColor Red
    Read-Host "Pressione ENTER para sair"
    exit 1
}

Write-Host ""

# Instalar dependências
Write-Host "[3/3] Verificando dependências..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ Dependências já estão instaladas" -ForegroundColor Green
} else {
    Write-Host "Instalando pacotes (primeira vez pode levar alguns minutos)..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Dependências instaladas com sucesso" -ForegroundColor Green
    } else {
        Write-Host "❌ ERRO ao instalar dependências!" -ForegroundColor Red
        Read-Host "Pressione ENTER para sair"
        exit 1
    }
}

Write-Host ""
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ Tudo pronto! Iniciando aplicação..." -ForegroundColor Green
Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Dados serão salvos em: dados\desktop\" -ForegroundColor Cyan
Write-Host ""

# Iniciar Electron
npm start

Read-Host "Pressione ENTER para sair"
