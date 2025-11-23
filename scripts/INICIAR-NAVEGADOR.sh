#!/bin/bash

echo "===================================================="
echo "  Sistema de Gestão de Bicicletário"
echo "  BICICLETARIO SHOP. BOULEVARD V.V."
echo "===================================================="
echo ""

# Verificar se Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "[ERRO] Python 3 não encontrado!"
    echo ""
    echo "Instale o Python 3:"
    echo "  Ubuntu/Debian: sudo apt install python3"
    echo "  Fedora: sudo dnf install python3"
    echo "  macOS: brew install python3"
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi

echo "[OK] Python 3 encontrado!"

# Verificar se está na pasta correta
if [ ! -f "server.py" ]; then
    echo "[ERRO] Arquivo server.py não encontrado!"
    echo ""
    echo "Execute este script dentro da pasta do projeto."
    echo ""
    read -p "Pressione Enter para sair..."
    exit 1
fi

echo "[OK] Pasta do projeto correta!"
echo ""
echo "Iniciando servidor..."
echo ""

# Matar qualquer instância anterior na porta 5000
lsof -ti:5000 | xargs kill -9 2>/dev/null

# Iniciar o servidor Python
python3 server.py &
SERVER_PID=$!

# Aguardar o servidor iniciar
sleep 5

# Verificar se o servidor está rodando
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null ; then
    echo "[OK] Servidor iniciado com sucesso!"
    echo ""
    echo "Abrindo navegador..."
    sleep 2
    
    # Detectar sistema operacional e abrir navegador
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        xdg-open http://localhost:5000 2>/dev/null || echo "Abra manualmente: http://localhost:5000"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        open http://localhost:5000
    else
        echo "Abra manualmente: http://localhost:5000"
    fi
else
    echo "[ERRO] Servidor não conseguiu iniciar!"
    echo ""
    echo "Verifique se a porta 5000 está disponível."
    echo ""
fi

echo ""
echo "===================================================="
echo "Sistema rodando em: http://localhost:5000"
echo ""
echo "Dados salvos em: dados/navegador/"
echo "  - Clientes: dados/navegador/clientes/"
echo "  - Registros: dados/navegador/registros/"
echo ""
echo "Para fechar o servidor, pressione Ctrl+C"
echo "===================================================="
echo ""

# Aguardar até que o usuário encerre
wait $SERVER_PID
