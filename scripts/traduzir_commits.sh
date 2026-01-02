#!/bin/bash
# Script para traduzir mensagens de commits do inglês para o português
# 
# ⚠️  AVISO: Este script reescreve o histórico do Git!
# ⚠️  NÃO execute em repositórios públicos sem coordenação com todos os colaboradores!
# ⚠️  Faça backup antes de executar!
#
# Uso: ./traduzir_commits.sh

set -e

echo "═══════════════════════════════════════════════════════════════"
echo "  Script de Tradução de Mensagens de Commits"
echo "  "
echo "  AVISO: Este script irá REESCREVER o histórico do Git!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "Este script irá traduzir todas as mensagens de commits em inglês"
echo "para português usando git filter-branch."
echo ""
echo "IMPORTANTE:"
echo "  1. Isto irá modificar TODOS os hashes de commit"
echo "  2. Todos os colaboradores precisarão re-clonar o repositório"
echo "  3. Pull requests abertos serão afetados"
echo "  4. É necessário force-push para o remoto"
echo ""
read -p "Você tem certeza de que deseja continuar? (digite 'SIM' para confirmar): " confirm

if [ "$confirm" != "SIM" ]; then
    echo "Operação cancelada."
    exit 0
fi

echo ""
echo "Criando backup..."
BACKUP_DIR="../backup-bicicletario-$(date +%Y%m%d-%H%M%S).git"
git clone --mirror . "$BACKUP_DIR"
echo "Backup criado em $BACKUP_DIR"

echo ""
echo "Iniciando tradução de commits..."

# Função de tradução de mensagens
translate_message() {
    local msg="$1"
    
    case "$msg" in
        # Planejamento
        "Initial plan") echo "Plano inicial" ;;
        "Initial commit") echo "Commit inicial" ;;
        
        # Arquivos
        "Add files via upload") echo "Adicionar arquivos via upload" ;;
        "Delete attached_assets directory") echo "Excluir diretório attached_assets" ;;
        "Updated .gitignore") echo "Atualizar .gitignore" ;;
        "Add .gitignore file") echo "Adicionar arquivo .gitignore" ;;
        
        # README
        "Update README.md") echo "Atualizar README.md" ;;
        
        # Merges - mantém referência ao PR original
        "Merge pull request #1 from MAY0LPHI/copilot/improve-typing-game-functionality") 
            echo "Mesclar pull request #1 de MAY0LPHI/copilot/improve-typing-game-functionality" ;;
        "Merge pull request #3 from MAY0LPHI/copilot/fix-snake-game-issue")
            echo "Mesclar pull request #3 de MAY0LPHI/copilot/fix-snake-game-issue" ;;
        "Merge pull request #5 from MAY0LPHI/copilot/add-new-game-term-ooo")
            echo "Mesclar pull request #5 de MAY0LPHI/copilot/add-new-game-term-ooo" ;;
        "Merge pull request #6 from MAY0LPHI/copilot/random-theme-games-2-or-4")
            echo "Mesclar pull request #6 de MAY0LPHI/copilot/random-theme-games-2-or-4" ;;
        "Merge pull request #7 from MAY0LPHI/copilot/fix-doom-character-controls")
            echo "Mesclar pull request #7 de MAY0LPHI/copilot/fix-doom-character-controls" ;;
        "Merge pull request #8 from MAY0LPHI/copilot/setup-ci-cd-github-actions")
            echo "Mesclar pull request #8 de MAY0LPHI/copilot/setup-ci-cd-github-actions" ;;
        "Merge pull request #9 from MAY0LPHI/copilot/review-code-quality")
            echo "Mesclar pull request #9 de MAY0LPHI/copilot/review-code-quality" ;;
        "Merge pull request #10 from MAY0LPHI/copilot/restore-client-layout")
            echo "Mesclar pull request #10 de MAY0LPHI/copilot/restore-client-layout" ;;
        "Merge pull request #11 from MAY0LPHI/copilot/update-client-tab-layout")
            echo "Mesclar pull request #11 de MAY0LPHI/copilot/update-client-tab-layout" ;;
        "Merge pull request #12 from MAY0LPHI/copilot/add-trash-icon-to-interface")
            echo "Mesclar pull request #12 de MAY0LPHI/copilot/add-trash-icon-to-interface" ;;
        "Merge pull request #14 from MAY0LPHI/copilot/adjust-client-tab-layout-again")
            echo "Mesclar pull request #14 de MAY0LPHI/copilot/adjust-client-tab-layout-again" ;;
        
        # Jogos
        "Enhance TypingGame with MonkeyType-like features and Bicicletário theme")
            echo "Aprimorar TypingGame com recursos estilo MonkeyType e tema Bicicletário" ;;
        "Fix code review issues: extra char double-counting and refactor duplicate code")
            echo "Corrigir problemas de revisão de código: contagem dupla de caractere extra e refatorar código duplicado" ;;
        "Implement comprehensive game improvements")
            echo "Implementar melhorias abrangentes nos jogos" ;;
        "Add Termo Bike game - word guessing game with bicycle theme")
            echo "Adicionar jogo Termo Bike - jogo de adivinhação de palavras com tema de bicicleta" ;;
        "Fix word list to use only valid 5-letter bicycle-themed words")
            echo "Corrigir lista de palavras para usar apenas palavras válidas de 5 letras com tema de bicicleta" ;;
        "Changes before error encountered")
            echo "Alterações antes do erro encontrado" ;;
        "Update all Termo games to use random general Portuguese words like term.ooo")
            echo "Atualizar todos os jogos Termo para usar palavras portuguesas gerais aleatórias como term.ooo" ;;
        "Fix duplicate word ENTAO in word lists for TermoDuoGame and TermoQuartetGame")
            echo "Corrigir palavra duplicada ENTAO nas listas de palavras para TermoDuoGame e TermoQuartetGame" ;;
        "Replace EXCEL with Portuguese word EXAME in TermoDuoGame word list")
            echo "Substituir EXCEL pela palavra portuguesa EXAME na lista de palavras do TermoDuoGame" ;;
        "Fix snake game bug and replace Pac-Man with Doom game")
            echo "Corrigir bug do jogo da cobra e substituir Pac-Man pelo jogo Doom" ;;
        "Improve code formatting in DoomGame class for better readability")
            echo "Melhorar formatação de código na classe DoomGame para melhor legibilidade" ;;
        "Fix DOOM game: add keyboard preventDefault and wall visibility check")
            echo "Corrigir jogo DOOM: adicionar preventDefault do teclado e verificação de visibilidade de parede" ;;
        "Improve code readability with named constants in isEnemyVisible")
            echo "Melhorar legibilidade do código com constantes nomeadas em isEnemyVisible" ;;
        
        # CI/CD
        "Add CI/CD workflows, PWA configuration, and Capacitor setup for mobile")
            echo "Adicionar workflows CI/CD, configuração PWA e configuração Capacitor para mobile" ;;
        "Fix code review issues: null check in sw.js, race condition in index.html, and add workflow permissions")
            echo "Corrigir problemas de revisão de código: verificação de null em sw.js, condição de corrida em index.html e adicionar permissões de workflow" ;;
        "Fix CI: Use npm install instead of npm ci for lock file sync issue")
            echo "Corrigir CI: Usar npm install em vez de npm ci para problema de sincronização de arquivo de lock" ;;
        
        # Segurança
        "Add security improvements and centralized logging")
            echo "Adicionar melhorias de segurança e registro centralizado" ;;
        "Add validation module and address code review feedback")
            echo "Adicionar módulo de validação e abordar feedback de revisão de código" ;;
        "Fix CodeQL security vulnerabilities in sanitizer")
            echo "Corrigir vulnerabilidades de segurança CodeQL no sanitizador" ;;
        "Add comprehensive quality report and final documentation")
            echo "Adicionar relatório de qualidade abrangente e documentação final" ;;
        
        # Layout
        "Restore client tab layout with improved menu positioning")
            echo "Restaurar layout da aba de cliente com posicionamento de menu aprimorado" ;;
        "Add accessibility improvements and consistent breakpoints")
            echo "Adicionar melhorias de acessibilidade e pontos de quebra consistentes" ;;
        "Reorganize client tab layout to match design specification")
            echo "Reorganizar layout da aba de cliente para corresponder à especificação de design" ;;
        "Adjust padding alignment of client placeholder to match registration card")
            echo "Ajustar alinhamento de preenchimento do espaço reservado do cliente para corresponder ao cartão de registro" ;;
        "Add __pycache__ to .gitignore and remove from repository")
            echo "Adicionar __pycache__ ao .gitignore e remover do repositório" ;;
        "Remove duplicate __pycache__ entry from .gitignore")
            echo "Remover entrada duplicada __pycache__ do .gitignore" ;;
        
        # Exclusão de bicicletas
        "Add bike deletion feature with trash icon and delete button")
            echo "Adicionar recurso de exclusão de bicicleta com ícone de lixeira e botão de exclusão" ;;
        "Fix delete bike functionality to use showConfirm promise")
            echo "Corrigir funcionalidade de exclusão de bicicleta para usar promessa showConfirm" ;;
        "Complete bike deletion feature implementation")
            echo "Completar implementação do recurso de exclusão de bicicleta" ;;
        "Refactor modal delete button to reuse handleDeleteBikeClick method")
            echo "Refatorar botão de exclusão modal para reutilizar método handleDeleteBikeClick" ;;
        "Implement bicycle deletion feature with trash icon and modal delete button")
            echo "Implementar recurso de exclusão de bicicleta com ícone de lixeira e botão de exclusão modal" ;;
        "Optimize handleDeleteBike to avoid duplicate array traversal")
            echo "Otimizar handleDeleteBike para evitar travessia duplicada de array" ;;
        
        # Títulos de merge para PRs
        "Align client placeholder padding with registration card")
            echo "Alinhar preenchimento do espaço reservado do cliente com cartão de registro" ;;
        "Add bike deletion with trash icon and modal delete button")
            echo "Adicionar exclusão de bicicleta com ícone de lixeira e botão de exclusão modal" ;;
        "Reorganize client tab layout: registration form and list on left, details on right")
            echo "Reorganizar layout da aba de cliente: formulário de registro e lista à esquerda, detalhes à direita" ;;
        "Restore client tab layout: list left, form and details right")
            echo "Restaurar layout da aba de cliente: lista à esquerda, formulário e detalhes à direita" ;;
        "Add enterprise-grade security, centralized utilities, and comprehensive documentation")
            echo "Adicionar segurança de nível empresarial, utilitários centralizados e documentação abrangente" ;;
        "Add CI/CD workflows and Capacitor mobile configuration")
            echo "Adicionar workflows CI/CD e configuração Capacitor para mobile" ;;
        "Fix DOOM game controls and wall visibility")
            echo "Corrigir controles do jogo DOOM e visibilidade de paredes" ;;
        "Update Termo games to use random Portuguese words like term.ooo")
            echo "Atualizar jogos Termo para usar palavras portuguesas aleatórias como term.ooo" ;;
        "Add Termo Bike games - word guessing games with bicycle theme")
            echo "Adicionar jogos Termo Bike - jogos de adivinhação de palavras com tema de bicicleta" ;;
        "Fix snake game initialization bug and replace Pac-Man with Doom")
            echo "Corrigir bug de inicialização do jogo da cobra e substituir Pac-Man pelo Doom" ;;
        "Enhance TypingGame with MonkeyType-like features and Bicicletário theme")
            echo "Aprimorar TypingGame com recursos estilo MonkeyType e tema Bicicletário" ;;
        
        # Default: mantém a mensagem original se não houver tradução
        *) echo "$msg" ;;
    esac
}

export -f translate_message

# Aplica o filtro para traduzir mensagens de commit
# Nota: Isto manterá o corpo dos commits intacto, traduzindo apenas o assunto
# Exporta a função para uso no subshell do filter
env TRANSLATE_FUNC="$(declare -f translate_message)" \
git filter-branch -f --msg-filter '
    # Importa a função no subshell
    eval "$TRANSLATE_FUNC"
    
    # Lê a primeira linha (assunto)
    read -r subject
    # Lê o resto (corpo)
    body=$(cat)
    
    # Traduz o assunto
    translated_subject=$(translate_message "$subject")
    
    # Retorna assunto traduzido + corpo original
    echo "$translated_subject"
    if [ -n "$body" ]; then
        echo "$body"
    fi
' --tag-name-filter cat -- --all

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  Tradução concluída!"
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "PRÓXIMOS PASSOS:"
echo ""
echo "1. Revise as mudanças com: git log --oneline"
echo "2. Se estiver satisfeito, faça force-push:"
echo "   git push --force --all"
echo "   git push --force --tags"
echo ""
echo "3. Notifique TODOS os colaboradores para:"
echo "   - Fazer backup de suas branches locais"
echo "   - Re-clonar o repositório"
echo "   - Recriar suas branches de trabalho"
echo ""
echo "AVISO: Não faça force-push sem coordenação com a equipe!"
echo ""
