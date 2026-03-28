/**
 * ============================================================
 *  ARQUIVO: app-modular.js
 *  DESCRIÇÃO: Arquivo principal da aplicação — ponto de entrada do sistema
 *
 *  FUNÇÃO: Orquestra todos os módulos do sistema de bicicletário.
 *          É aqui que os gerenciadores de cada seção (clientes, registros,
 *          configuração, etc.) são criados e conectados.
 *
 *  ARQUITETURA:
 *  - Este arquivo define a classe App (aplicação principal).
 *  - Cada aba do sistema tem seu próprio Manager (gerenciador):
 *      • ClientesManager     → aba de clientes cadastrados (carrega imediato)
 *      • BicicletasManager   → painel de bicicletas do cliente selecionado (carrega imediato)
 *      • RegistrosManager    → aba de registros diários (carrega imediato)
 *      • ConfiguracaoManager → aba de configurações (lazy load: 1.5s)
 *      • DadosManager        → aba de exportação/importação (lazy load: 3s)
 *      • Usuarios            → aba de gerenciamento de usuários (lazy load: 4.5s)
 *      • JogosManager        → aba de jogos (lazy load: ao clicar na aba)
 *  - Módulos compartilhados ficam em js/shared/ (auth, storage, debug, etc.)
 *
 *  LAZY LOADING ESCALONADO (lazyLoadDeferred):
 *  - ConfiguracaoManager, DadosManager e Usuarios são carregados em background
 *    com intervalos de 1.5s, 3s e 4.5s para evitar pico de CPU
 *  - JogosManager (~360KB) só é carregado via import() dinâmico ao clicar na aba
 *  - Cada manager começa como null e é instanciado via ensure*() na primeira necessidade
 *
 *  FLUXO DE INICIALIZAÇÃO:
 *  1. DOMContentLoaded → inicia Debug, ícones Lucide e SystemLoader
 *  2. SystemLoader verifica o sistema (backend, dados, usuários)
 *  3. App.init() verifica autenticação e redireciona se necessário
 *  4. Se autenticado, carrega dados e inicializa managers imediatos
 *  5. lazyLoadDeferred() agenda carregamento escalonado dos managers restantes
 *
 *  PARA INICIANTES:
 *  - Este arquivo é carregado automaticamente pelo index.html
 *  - A instância global do app fica em: window.app
 *  - Para trocar de aba via console: window.app.switchTab('clientes')
 * ============================================================
 */

import { ClientesManager } from './cadastros/clientes.js';
import { BicicletasManager } from './cadastros/bicicletas.js';
import { RegistrosManager } from './registros/registros-diarios.js';
import { Storage } from './shared/storage.js';
import { Debug } from './shared/debug.js';
import { Auth } from './shared/auth.js';
import { Utils } from './shared/utils.js';
import { SystemLoader } from './shared/system-loader.js';
import { getJobMonitor } from './shared/job-monitor.js';
import { Config } from './shared/config.js';
import { Hotkeys } from './shared/hotkeys.js';
import { HelpGuide } from './shared/help-guide.js';

class App {
    constructor() {
        this.data = {
            clients: [],
            registros: [],
            selectedClientId: null,
            activeTab: 'clientes',
            currentDailyRecords: [],
        };

        this.elements = {
            clientesTab: document.getElementById('clientes-tab'),
            registrosDiariosTab: document.getElementById('registros-diarios-tab'),
            dadosTab: document.getElementById('dados-tab'),
            configuracaoTab: document.getElementById('configuracao-tab'),

            jogosTab: document.getElementById('jogos-tab'),
            clientesTabContent: document.getElementById('clientes-tab-content'),
            registrosDiariosTabContent: document.getElementById('registros-diarios-tab-content'),
            dadosTabContent: document.getElementById('dados-tab-content'),
            configuracaoTabContent: document.getElementById('configuracao-tab-content'),

            jogosTabContent: document.getElementById('jogos-tab-content'),
        };
    }

    async init() {
        try {
            await Config.load();
        } catch (e) {
            console.error('Erro ao carregar configuração:', e);
        }
        try {
            await Auth.init();
        } catch (e) {
            console.error('Erro ao inicializar autenticação:', e);
        }

        if (!Auth.isLoggedIn()) {
            this.showLoginScreen();
            this.setupLoginForm();
            return;
        }

        const session = Auth.getCurrentSession();
        if (session && session.requirePasswordChange) {
            this.showPasswordChangeModal();
            return;
        }

        this.showMainApp();
        await this.loadData();

        this.clientesManager = new ClientesManager(this);
        this.bicicletasManager = new BicicletasManager(this);
        this.registrosManager = new RegistrosManager(this);
        this.configuracaoManager = null;
        this.dadosManager = null;
        this.jogosManager = null;
        this.usuariosManager = null;

        this.lazyLoadDeferred();


        this.clientesManager.renderClientList();
        this.addEventListeners();
        this.updateUserInfo();
        this.applyPermissions();

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        this.registrosManager.elements.dailyRecordsDateInput.value = `${year}-${month}-${day}`;
        this.registrosManager.renderDailyRecords();

        this.initJobMonitor();
        this.hotkeys = new Hotkeys(this);
        this.helpGuide = new HelpGuide(this);

        // Ligar o ícone da bicicleta ao guia de atalhos
        const bikeLogoBtn = document.querySelector('.bike-logo-btn');
        if (bikeLogoBtn) {
            bikeLogoBtn.addEventListener('click', () => this.helpGuide.openGuide());
        }
    }

    lazyLoadDeferred() {
        setTimeout(() => this.ensureConfiguracao(), 1500);
        setTimeout(() => this.ensureDados(), 3000);
        setTimeout(() => this.ensureUsuarios(), 4500);
    }

    initJobMonitor() {
        this.jobMonitor = getJobMonitor();

        this.jobMonitor.onChanges((changes) => {
            console.log('📡 Mudanças detectadas pelo monitor de jobs:', changes);

            if (changes.clients) {
                this.refreshClients();
            }

            if (changes.registros) {
                this.refreshRegistros();
            }

            if (changes.usuarios) {
                this.refreshUsuarios();
            }

            if (changes.categorias) {
                this.refreshCategorias();
            }
        });
    }

    async refreshClients() {
        try {
            this.data.clients = await Storage.loadClients();
            if (this.clientesManager) {
                this.clientesManager.renderClientList();
            }
            this.jobMonitor.showToast('Lista de clientes atualizada', 'success');
        } catch (e) {
            console.warn('Erro ao atualizar clientes:', e);
        }
    }

    async refreshRegistros() {
        try {
            this.data.registros = await Storage.loadRegistros();
            if (this.registrosManager) {
                this.registrosManager.renderDailyRecords();
            }
            this.jobMonitor.showToast('Registros atualizados', 'success');
        } catch (e) {
            console.warn('Erro ao atualizar registros:', e);
        }
    }

    refreshUsuarios() {
        if (this.usuariosManager && typeof this.usuariosManager.render === 'function') {
            this.usuariosManager.render();
        }
        this.jobMonitor.showToast('Lista de usuários atualizada', 'success');
    }

    refreshCategorias() {
        if (this.configuracaoManager) {
            this.configuracaoManager.loadCategorias();
        }
        this.jobMonitor.showToast('Categorias atualizadas', 'success');
    }

    setupLoginForm() {
        const loginForm = document.getElementById('login-form');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }
    }

    showLoginScreen() {
        document.getElementById('app-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden');
    }

    showMainApp() {
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('app-container').classList.remove('hidden');
    }

    updateUserInfo() {
        const session = Auth.getCurrentSession();
        if (session) {
            const userInfoEl = document.getElementById('user-info');
            if (userInfoEl) {
                userInfoEl.textContent = session.nome;
            }
        }
    }

    applyPermissions() {
        const session = Auth.getCurrentSession();
        if (!session) return;

        const clientesTab = document.getElementById('clientes-tab');
        if (clientesTab && !Auth.hasPermission('clientes', 'ver')) {
            clientesTab.classList.add('hidden');
        }

        const registrosDiariosTab = document.getElementById('registros-diarios-tab');
        if (registrosDiariosTab && !Auth.hasPermission('registros', 'ver')) {
            registrosDiariosTab.classList.add('hidden');
        }

        const dadosTab = document.getElementById('dados-tab');
        if (dadosTab && !Auth.hasPermission('dados', 'ver')) {
            dadosTab.classList.add('hidden');
        }

        const configuracaoTab = document.getElementById('configuracao-tab');
        if (configuracaoTab && !Auth.hasPermission('configuracao', 'ver')) {
            configuracaoTab.classList.add('hidden');
        }

        const usuariosTab = document.getElementById('usuarios-tab');
        if (usuariosTab) {
            if (Auth.hasPermission('configuracao', 'gerenciarUsuarios')) {
                usuariosTab.classList.remove('hidden');
            } else {
                usuariosTab.classList.add('hidden');
            }
        }

        const jogosTab = document.getElementById('jogos-tab');
        if (jogosTab) {
            if (Auth.hasPermission('jogos', 'ver')) {
                jogosTab.classList.remove('hidden');
            } else {
                jogosTab.classList.add('hidden');
            }
        }

        const adminMobileBtn = document.getElementById('admin-mobile-btn');
        if (adminMobileBtn) {
            if (Auth.hasPermission('configuracao', 'adminMobile')) {
                adminMobileBtn.style.display = '';
            } else {
                adminMobileBtn.style.display = 'none';
            }
        }

        const mobileAccessBtn = document.getElementById('mobile-access-btn');
        if (mobileAccessBtn) {
            if (Auth.hasPermission('configuracao', 'acessoCelular')) {
                mobileAccessBtn.style.display = '';
            } else {
                mobileAccessBtn.style.display = 'none';
            }
        }

        this.selectFirstVisibleTab();

        if (this.clientesManager) {
            this.clientesManager.applyPermissionsToUI();
        }
        if (this.bicicletasManager) {
            this.bicicletasManager.applyPermissionsToUI();
        }
        if (this.registrosManager) {
            this.registrosManager.applyPermissionsToUI();
        }
        if (this.configuracaoManager) {
            this.configuracaoManager.applyPermissionsToUI();
        }
        if (this.dadosManager) {
            this.dadosManager.applyPermissionsToUI();
        }
        if (this.jogosManager && this.jogosManager.applyPermissionsToUI) {
            this.jogosManager.applyPermissionsToUI();
        }
    }

    selectFirstVisibleTab() {
        const tabs = ['clientes', 'registros-diarios', 'dados', 'configuracao', 'usuarios', 'jogos'];
        const permissions = {
            'clientes': () => Auth.hasPermission('clientes', 'ver'),
            'registros-diarios': () => Auth.hasPermission('registros', 'ver'),
            'dados': () => Auth.hasPermission('dados', 'ver'),
            'configuracao': () => Auth.hasPermission('configuracao', 'ver'),
            'usuarios': () => Auth.hasPermission('configuracao', 'gerenciarUsuarios'),

            'jogos': () => Auth.hasPermission('jogos', 'ver')
        };

        for (const tabName of tabs) {
            if (permissions[tabName]()) {
                this.switchTab(tabName);
                break;
            }
        }
    }

    handleLogout() {
        Auth.logout();
        // Sinaliza para o próximo carregamento pular a tela de splash/loading
        // (evita mostrar a tela de carregamento desnecessariamente ao trocar de usuário)
        sessionStorage.setItem('skipLoadingScreen', 'true');
        window.location.reload();
    }

    addEventListeners() {
        this.elements.clientesTab.addEventListener('click', () => this.switchTab('clientes'));
        this.elements.registrosDiariosTab.addEventListener('click', () => this.switchTab('registros-diarios'));
        this.elements.dadosTab.addEventListener('click', () => this.switchTab('dados'));
        this.elements.configuracaoTab.addEventListener('click', () => this.switchTab('configuracao'));

        const usuariosTab = document.getElementById('usuarios-tab');
        if (usuariosTab) {
            usuariosTab.addEventListener('click', () => this.switchTab('usuarios'));
        }

        if (this.elements.jogosTab) {
            this.elements.jogosTab.addEventListener('click', () => this.switchTab('jogos'));
        }



        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.handleLogout());
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
        const errorEl = document.getElementById('login-error');
        const submitBtn = e.target.querySelector('button[type="submit"]');

        submitBtn.disabled = true;
        submitBtn.textContent = 'Entrando...';

        try {
            const result = await Auth.login(username, password);
            if (result.success) {
                // Login bem-sucedido: recarrega a página sem mostrar tela de carregamento
                sessionStorage.setItem('skipLoadingScreen', 'true');
                window.location.reload();
            } else {
                errorEl.textContent = result.message;
                errorEl.classList.remove('hidden');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Entrar';
            }
        } catch (error) {
            errorEl.textContent = 'Erro ao fazer login. Tente novamente.';
            errorEl.classList.remove('hidden');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Entrar';
        }
    }

    showPasswordChangeModal() {
        const session = Auth.getCurrentSession();
        const html = `
            <div id="password-change-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6 w-full max-w-md">
                    <h2 class="text-xl font-semibold mb-4 text-slate-800 dark:text-slate-100">Mudança de Senha Obrigatória</h2>
                    <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">Por segurança, você deve alterar sua senha antes de continuar.</p>
                    <form id="password-change-form">
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nova Senha</label>
                            <input type="password" id="new-password" required minlength="6" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white">
                            <p class="text-xs text-slate-500 dark:text-slate-400 mt-1">Mínimo de 6 caracteres</p>
                        </div>
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Confirmar Nova Senha</label>
                            <input type="password" id="confirm-password" required minlength="6" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-slate-700 dark:text-white">
                        </div>
                        <div id="password-change-error" class="hidden text-red-600 dark:text-red-400 text-sm mb-3"></div>
                        <div class="flex gap-3">
                            <button type="submit" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors">
                                Alterar Senha
                            </button>
                            <button type="button" id="modal-logout-btn" class="px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                                Sair
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('password-change-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;
            const errorEl = document.getElementById('password-change-error');

            if (newPassword !== confirmPassword) {
                errorEl.textContent = 'As senhas não coincidem';
                errorEl.classList.remove('hidden');
                return;
            }

            if (newPassword.length < 6) {
                errorEl.textContent = 'A senha deve ter no mínimo 6 caracteres';
                errorEl.classList.remove('hidden');
                return;
            }

            const result = await Auth.changePassword(session.userId, newPassword);
            if (result.success) {
                document.getElementById('password-change-modal').remove();
                // Senha alterada com sucesso: recarrega sem tela de loading
                sessionStorage.setItem('skipLoadingScreen', 'true');
                window.location.reload();
            } else {
                errorEl.textContent = result.message;
                errorEl.classList.remove('hidden');
            }
        });

        document.getElementById('modal-logout-btn').addEventListener('click', () => {
            Auth.logout();
            // Usuário optou por sair durante a troca de senha obrigatória
            sessionStorage.setItem('skipLoadingScreen', 'true');
            window.location.reload();
        });
    }

    async loadData() {
        const migrated = Storage.migrateOldData();
        if (migrated) {
            this.data.clients = migrated.clients;
            this.data.registros = migrated.registros;
        } else {
            this.data.clients = await Storage.loadClients();
            this.data.registros = await Storage.loadRegistros();
        }

        let needsSave = false;
        this.data.clients.forEach(client => {
            if (!client.categoria) {
                client.categoria = '';
                needsSave = true;
            }
            if (!client.comentarios) {
                client.comentarios = [];
                needsSave = true;
            }
        });

        if (needsSave) {
            await Storage.saveClients(this.data.clients);
        }
    }

    switchTab(tabName) {
        this.data.activeTab = tabName;

        const tabs = {
            clientes: { btn: this.elements.clientesTab, content: this.elements.clientesTabContent },
            'registros-diarios': { btn: this.elements.registrosDiariosTab, content: this.elements.registrosDiariosTabContent },
            'dados': { btn: this.elements.dadosTab, content: this.elements.dadosTabContent },
            'configuracao': { btn: this.elements.configuracaoTab, content: this.elements.configuracaoTabContent },
            'usuarios': { btn: document.getElementById('usuarios-tab'), content: document.getElementById('usuarios-tab-content') },

            'jogos': { btn: this.elements.jogosTab, content: this.elements.jogosTabContent },
        };

        Object.values(tabs).forEach(tab => {
            if (tab.btn && tab.content) {
                tab.btn.classList.remove('active');
                tab.content.classList.add('hidden');
            }
        });

        const active = tabs[tabName];
        if (active && active.btn && active.content) {
            active.btn.classList.add('active');
            active.content.classList.remove('hidden');
        }

        if (tabName === 'registros-diarios') {
            this.registrosManager.renderDailyRecords();
        } else if (tabName === 'dados') {
            this.ensureDados().then(() => lucide.createIcons());
        } else if (tabName === 'usuarios') {
            this.ensureUsuarios().then(m => m.init());
        } else if (tabName === 'jogos') {
            this.loadJogos();
        } else if (tabName === 'configuracao') {
            this.ensureConfiguracao();
        }
    }

    async ensureConfiguracao() {
        if (!this.configuracaoManager) {
            const { ConfiguracaoManager } = await import('./configuracao/configuracao.js');
            this.configuracaoManager = new ConfiguracaoManager(this);
            this.configuracaoManager.applyPermissionsToUI();
        }
        return this.configuracaoManager;
    }

    async ensureDados() {
        if (!this.dadosManager) {
            const { DadosManager } = await import('./dados/dados.js');
            this.dadosManager = new DadosManager(this);
            this.dadosManager.applyPermissionsToUI();
        }
        return this.dadosManager;
    }

    async ensureUsuarios() {
        if (!this.usuariosManager) {
            const { Usuarios } = await import('./usuarios/usuarios.js');
            this.usuariosManager = Usuarios;
        }
        return this.usuariosManager;
    }

    async loadJogos() {
        if (!this.jogosManager) {
            const { JogosManager } = await import('./jogos/jogos.js?v=5');
            this.jogosManager = new JogosManager(this);
        }
        this.jogosManager.init();
        lucide.createIcons();
    }

    toggleModal(modalId, show) {
        const modal = document.getElementById(modalId);
        const modalContent = modal.querySelector('.modal-content');
        if (show) {
            modal.classList.remove('hidden');
            setTimeout(() => {
                modal.classList.add('opacity-100');
                modalContent.classList.replace('scale-95', 'scale-100');
            }, 10);
        } else {
            modal.classList.remove('opacity-100');
            modalContent.classList.replace('scale-100', 'scale-95');
            setTimeout(() => { modal.classList.add('hidden'); }, 300);
        }
    }

    openCommentsModal(clientId, refreshCallback) {
        const client = this.data.clients.find(c => c.id === clientId);
        if (!client) return;

        const modal = document.getElementById('comments-modal');
        const clientName = document.getElementById('comments-modal-client-name');
        const clientCpf = document.getElementById('comments-modal-client-cpf');
        const commentsList = document.getElementById('comments-modal-list');
        const commentInput = document.getElementById('comments-modal-input');
        const addCommentBtn = document.getElementById('comments-modal-add-btn');
        const closeBtn = document.getElementById('close-comments-modal-btn');

        if (!modal || !clientName || !clientCpf || !commentsList || !commentInput || !addCommentBtn || !closeBtn) {
            console.error('Elementos do modal de comentários não encontrados no DOM — verifique o HTML do modal #comments-modal');
            return;
        }

        clientName.textContent = client.nome.replace(/^"|"$/g, '');
        clientCpf.textContent = Utils.formatCPF(client.cpf) + (client.telefone ? ' • ' + Utils.formatTelefone(client.telefone) : '');

        const renderCommentsList = () => {
            let comentarios = client.comentarios || [];
            if (typeof comentarios === 'string') {
                try { comentarios = JSON.parse(comentarios); } catch (e) { comentarios = []; }
            }
            if (!Array.isArray(comentarios)) { comentarios = []; }
            const currentSession = Auth.getCurrentSession();
            const currentUsername = currentSession?.username || '';
            const canEditClients = Auth.hasPermission('clientes', 'editar');

            if (comentarios.length === 0) {
                commentsList.innerHTML = '<p class="text-sm text-slate-400 dark:text-slate-400 text-center py-3">Nenhum comentário adicionado</p>';
            } else {
                commentsList.innerHTML = comentarios.map(comment => {
                    const commentDate = new Date(comment.data);
                    const isOwner = currentUsername && comment.usuario === currentUsername;
                    const canDeleteComment = isOwner || canEditClients;
                    return `
                        <div class="flex gap-3 p-3 rounded-lg bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                            <div class="flex-shrink-0">
                                <div class="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full">
                                    <i data-lucide="user" class="w-4 h-4 text-amber-600 dark:text-amber-400"></i>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <div class="flex items-center justify-between mb-1">
                                    <p class="text-xs font-medium text-amber-700 dark:text-amber-200">${comment.usuario}</p>
                                    <div class="flex items-center gap-2">
                                        <p class="text-xs text-amber-600 dark:text-amber-400">${commentDate.toLocaleDateString('pt-BR')} ${commentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                                        ${canDeleteComment ? `
                                        <button class="delete-modal-comment-btn text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300" data-comment-id="${comment.id}" title="Excluir comentário">
                                            <i data-lucide="trash-2" class="w-3 h-3"></i>
                                        </button>
                                        ` : ''}
                                    </div>
                                </div>
                                <p class="text-sm text-slate-700 dark:text-slate-100 break-words">${comment.texto}</p>
                            </div>
                        </div>
                    `;
                }).join('');

                lucide.createIcons();

                commentsList.querySelectorAll('.delete-modal-comment-btn').forEach(btn => {
                    btn.onclick = () => {
                        const commentId = btn.dataset.commentId;
                        this.clientesManager.deleteComment(client.id, commentId);
                        renderCommentsList();
                        if (refreshCallback) refreshCallback();
                    };
                });
            }
        };

        renderCommentsList();

        const addCommentHandler = () => {
            const comentario = commentInput.value.trim();
            if (comentario) {
                this.clientesManager.addComment(client.id, comentario);
                commentInput.value = '';
                renderCommentsList();
                if (refreshCallback) refreshCallback();
            }
        };

        addCommentBtn.onclick = addCommentHandler;

        commentInput.onkeypress = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                addCommentHandler();
            }
        };

        closeBtn.onclick = () => {
            this.toggleModal('comments-modal', false);
        };

        this.toggleModal('comments-modal', true);
        lucide.createIcons();
    }
}

/**
 * Ponto de entrada da aplicação.
 * Executado automaticamente quando o HTML termina de carregar.
 *
 * Ordem de execução:
 * 1. Debug.init()       — inicializa o sistema de debug (lê preferência do LocalStorage)
 * 2. lucide.createIcons() — renderiza todos os ícones SVG na página
 * 3. SystemLoader.start() — executa a tela de carregamento e verifica o sistema
 * 4. App.init()         — inicializa o app com autenticação e dados
 */
document.addEventListener('DOMContentLoaded', async () => {
    Debug.init();
    lucide.createIcons();

    // Executa a tela de splash/carregamento e verifica se o sistema está pronto
    const systemLoader = new SystemLoader();
    const systemReady = await systemLoader.start();

    if (systemReady) {
        // Cria a instância global do app e inicia a aplicação
        window.app = new App();
        window.app.init();
    } else {
        // Erros críticos na verificação do sistema (backend inacessível, dados corrompidos, etc.)
        console.error('Sistema não pôde ser iniciado devido a erros críticos');
    }
});
