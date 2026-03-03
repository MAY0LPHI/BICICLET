/**
 * ============================================================
 *  ARQUIVO: hotkeys.js
 *  DESCRIÇÃO: Gerenciador de atalhos de teclado do sistema
 *
 *  FUNÇÃO: Define e gerencia todos os atalhos de teclado
 *          disponíveis na interface principal do sistema.
 *          Permite que operadores usem o teclado para navegar
 *          rapidamente entre abas e acionar funções comuns.
 *
 *  ATALHOS DISPONÍVEIS:
 *  ┌──────────────────────────────────────────────────────────┐
 *  │  Tecla         │  Ação                                   │
 *  ├──────────────────────────────────────────────────────────┤
 *  │  ESC           │  Fecha modais e dropdowns abertos       │
 *  │  Alt + N       │  Foca no campo Nome (novo cliente)      │
 *  │  Alt + L       │  Faz logout do usuário atual            │
 *  │  Alt + M       │  Foca na busca de registros diários     │
 *  │  Alt + B       │  Foca na busca de clientes              │
 *  │  Alt + 1       │  Vai para aba Clientes                  │
 *  │  Alt + 2       │  Vai para aba Registros Diários         │
 *  │  Alt + 3       │  Vai para aba Usuários                  │
 *  │  Alt + 4       │  Vai para aba Dados                     │
 *  │  Alt + 5       │  Vai para aba Configuração              │
 *  │  Alt + 6       │  Vai para aba Jogos                     │
 *  │  /  ou  F2     │  Foca no campo de busca da aba atual    │
 *  └──────────────────────────────────────────────────────────┘
 *
 *  PARA INICIANTES:
 *  - Esta classe é instanciada automaticamente pelo app principal.
 *  - Para usar: const hotkeys = new Hotkeys(appInstance);
 * ============================================================
 */

import { Auth } from './auth.js';
import { Modals } from './modals.js';

export class Hotkeys {

    /**
     * Cria o gerenciador de atalhos de teclado.
     *
     * @param {Object} app - Instância principal do aplicativo (app-modular.js).
     *                       Necessário para chamar app.switchTab() e outros métodos.
     */
    constructor(app) {
        this.app = app;
        this.setupListeners(); // Registra os ouvintes de teclado imediatamente
    }

    /**
     * Registra o ouvinte global de teclas pressionadas (keydown).
     * Captura todas as teclas do documento e decide qual ação executar.
     *
     * IMPORTANTE: Este listener está ativo em todas as páginas enquanto
     * o app estiver aberto. Ele ignora atalhos quando o usuário está
     * digitando em campos de texto (INPUT, TEXTAREA, SELECT).
     */
    setupListeners() {
        document.addEventListener('keydown', (e) => {
            // Verifica se o usuário está digitando em um campo de formulário.
            // Se estiver, a maioria dos atalhos deve ser ignorada para não
            // interferir com a digitação normal.
            const isInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName);

            // ── ESC: Fecha modais e dropdowns abertos ────────────────────────
            // ESC funciona mesmo dentro de campos de texto
            if (e.key === 'Escape') {
                this.handleEscape();
                return; // Para aqui, não processa outros atalhos
            }

            // ── Atalhos combinados com a tecla Alt ───────────────────────────
            // Alt + outra tecla: funciona em qualquer contexto (inclusive em inputs)
            if (e.altKey) {
                switch (e.key.toLowerCase()) {
                    case 'n':
                        e.preventDefault(); // Impede ação padrão do navegador
                        this.handleNewClientFocus();
                        break;
                    case 'l':
                        e.preventDefault();
                        this.handleLogout();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.handleRegistrosSearchFocus();
                        break;
                    case 'b':
                        e.preventDefault();
                        this.handleClientesSearchFocus();
                        break;
                    case '1':
                        e.preventDefault();
                        this.app.switchTab('clientes');
                        break;
                    case '2':
                        e.preventDefault();
                        this.app.switchTab('registros-diarios');
                        break;
                    case '3':
                        e.preventDefault();
                        this.app.switchTab('usuarios');
                        break;
                    case '4':
                        e.preventDefault();
                        this.app.switchTab('dados');
                        break;
                    case '5':
                        e.preventDefault();
                        this.app.switchTab('configuracao');
                        break;
                    case '6':
                        e.preventDefault();
                        this.app.switchTab('jogos');
                        break;
                }
                return;
            }

            // ── Atalhos sem modificadores (apenas quando NÃO estiver digitando) ──
            // Só ativa se: não está em input, não está com Ctrl/Alt/Meta pressionado
            if (!isInput && !e.ctrlKey && !e.altKey && !e.metaKey) {
                if (e.key === '/' || e.key === 'F2') {
                    e.preventDefault();
                    this.handleSearchFocus(); // Foca no campo de busca da aba atual
                }
            }
        });
    }

    /**
     * Trata o pressionamento da tecla ESC.
     * Ordem de prioridade:
     *   1. Tenta fechar modais via Modals.close()
     *   2. Se nenhum modal formal foi fechado, procura e oculta modais pelo DOM
     *   3. Fecha dropdowns abertos
     *   4. Remove o foco do campo de texto atual
     */
    handleEscape() {
        // Tenta fechar modais gerenciados pelo módulo Modals
        if (Modals.close()) return;

        // Fallback: procura todos os elementos que terminam com "-modal" e não estão ocultos
        const modaisAbertos = document.querySelectorAll('[id$="-modal"]:not(.hidden)');
        modaisAbertos.forEach(modal => {
            modal.classList.add('hidden'); // Oculta o modal
        });

        // Fecha dropdowns abertos (menus customizados)
        document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(menu => {
            menu.classList.add('hidden');
            // Remove o estado "ativo" do botão que abriu o dropdown
            const btn = menu.closest('.custom-dropdown')?.querySelector('.dropdown-button');
            if (btn) btn.classList.remove('active');
        });

        // Remove o foco do campo de texto atual (deseleciona o input)
        if (document.activeElement && document.activeElement.tagName === 'INPUT') {
            document.activeElement.blur();
        }
    }

    /**
     * Atalho Alt+N — Navega para a aba de Clientes e foca no campo de nome.
     * Permite iniciar o cadastro de um cliente rapidamente sem usar o mouse.
     *
     * Verificação de permissão: só funciona se o usuário tiver permissão
     * para adicionar clientes (funcionários não podem cadastrar).
     */
    handleNewClientFocus() {
        // Verifica se o usuário tem permissão para adicionar clientes
        if (!Auth.hasPermission('clientes', 'adicionar')) return;

        // Navega para a aba de clientes
        this.app.switchTab('clientes');

        // Localiza o campo de nome e dá foco a ele
        const nomeInput = document.getElementById('nome');
        if (nomeInput) {
            nomeInput.focus();
            // Rola a tela suavemente para garantir que o campo está visível
            const card = nomeInput.closest('.bg-white, .dark\\:bg-slate-800');
            if (card) {
                card.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }

    /**
     * Atalho / ou F2 — Foca no campo de busca da aba atualmente visível.
     * Permite pesquisar rapidamente sem precisar clicar no input com o mouse.
     *
     * Fallback: se não encontrar o input de busca na aba atual,
     * vai para a aba de Clientes e foca no input principal de busca.
     */
    handleSearchFocus() {
        // Procura o input de busca dentro do conteúdo da aba visível no momento
        const abaAtiva = document.querySelector('.tab-content:not(.hidden)');
        if (abaAtiva) {
            const searchInput = abaAtiva.querySelector('input[type="text"][id*="search"]');
            if (searchInput) {
                searchInput.focus();
                searchInput.select(); // Seleciona o texto para sobrescrever ao digitar
                return;
            }
        }

        // Fallback: usa o input de busca principal da aba de clientes
        const mainSearch = document.getElementById('search');
        if (mainSearch) {
            this.app.switchTab('clientes');
            mainSearch.focus();
            mainSearch.select();
        }
    }

    /**
     * Atalho Alt+L — Pergunta confirmação e faz o logout do usuário.
     * Usa o modal de confirmação customizado para não usar o alert nativo.
     * Chama o botão de logout existente para garantir que o fluxo
     * normal seja respeitado (incluindo o log de auditoria).
     */
    async handleLogout() {
        const confirmado = await Modals.showConfirm(
            'Deseja realmente sair da conta do usuário atual?',
            'Sair do Sistema'
        );

        if (confirmado) {
            // Prefere clicar no botão de logout existente na UI (mantém fluxo de auditoria)
            const logoutBtn = document.getElementById('logout-btn');
            if (logoutBtn) {
                logoutBtn.click();
            } else if (this.app.handleLogout) {
                // Fallback: chama o método de logout do app diretamente
                this.app.handleLogout();
            }
        }
    }

    /**
     * Atalho Alt+M — Navega para Registros Diários e foca na busca.
     * Usa setTimeout com 80ms para aguardar a aba terminar de renderizar
     * antes de tentar focar no input (que pode não existir ainda no DOM).
     */
    handleRegistrosSearchFocus() {
        this.app.switchTab('registros-diarios');
        setTimeout(() => {
            const searchInput = document.getElementById('daily-records-search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }, 80); // 80ms é suficiente para a aba carregar antes de focar
    }

    /**
     * Atalho Alt+B — Navega para Clientes e foca na busca.
     * Também usa setTimeout de 80ms para aguardar a renderização da aba.
     */
    handleClientesSearchFocus() {
        this.app.switchTab('clientes');
        setTimeout(() => {
            const searchInput = document.getElementById('search');
            if (searchInput) {
                searchInput.focus();
                searchInput.select();
            }
        }, 80);
    }
}
