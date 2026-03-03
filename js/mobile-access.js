/**
 * ============================================================
 *  ARQUIVO: mobile-access.js
 *  DESCRIÇÃO: Sistema de Autoatendimento Mobile (Totem QR)
 *
 *  FUNÇÃO:
 *  Controla a interface do totem de autoatendimento (mobile-access.html),
 *  utilizada pela tela sensível ao toque na entrada do bicicletário.
 *  Permite que clientes se identifiquem por CPF, selecionem a bicicleta
 *  e enviem solicitações de entrada/saída para aprovação do atendente.
 *
 *  CLASSE: MobileAccess
 *  Singleton — instanciada em window.app ao carregar o HTML
 *
 *  FLUXO DE USO:
 *  1. Cliente digita CPF → handleIdentify() busca em Storage.loadClients()
 *  2. Se encontrado: showActions() exibe as bicicletas cadastradas
 *  3. Se não encontrado: showRegisterClient() permite novo cadastro
 *  4. Após cadastro do cliente: showRegisterBike() para adicionar bicicleta
 *  5. Cliente seleciona bicicleta e clica Entrada/Saída → handleRequest()
 *  6. Solicitação vai para localStorage 'bicicletario_requests' com status 'pendente'
 *  7. Atendente aprova/rejeita via RegistrosManager.openSolicitacoesModal()
 *  8. showSuccess() exibe tela de sucesso e reseta após 5 segundos
 *
 *  SELEÇÃO DE BICICLETA (Custom Dropdown):
 *  - Substituição do <select> nativo por botão + lista customizada
 *  - toggleCustomSelect() abre/fecha o dropdown
 *  - selectBike(id, nome) preenche o campo oculto e atualiza o texto
 *  - Clique fora do dropdown fecha automaticamente (listener no document)
 *
 *  BOTÕES ENTRADA/SAÍDA (Inteligentes):
 *  - updateActionButtons() verifica se a bike está dentro ou fora
 *  - Busca em Storage.loadRegistros() por registro ativo (sem saída)
 *  - Mostra apenas o botão relevante para evitar erros do cliente
 *
 *  NOTIFICAÇÕES:
 *  - showNotification(titulo, msg, tipo) abre modal #custom-notification-modal
 *  - Tipos: 'error' (vermelho), 'warning' (âmbar), 'info' (azul)
 *  - Fallback para alert() se modal não existir no HTML (compatibilidade)
 *
 *  DEPENDÊNCIAS:
 *  - utils.js   → Utils.formatCPF(), formatTelefone(), validateCPF(), generateUUID()
 *  - storage.js → Storage.loadClients(), loadRegistros(), saveClient()
 *
 *  PARA INICIANTES:
 *  Este arquivo é carregado APENAS pelo mobile-access.html, não pelo index.html.
 *  O index.html usa app-modular.js. São sistemas separados que compartilham
 *  apenas o localStorage para comunicação (via 'bicicletario_requests').
 * ============================================================
 */

import { Utils } from './shared/utils.js';
import { Storage } from './shared/storage.js';

class MobileAccess {
    constructor() {
        this.elements = {
            cpfInput: document.getElementById('cpf-input'),
            btnIdentificar: document.getElementById('btn-identificar'),
            btnCadastrarInit: document.getElementById('btn-cadastrar-init'),
            loginError: document.getElementById('login-error'),

            // Steps
            loginForm: document.getElementById('login-form'),
            stepActions: document.getElementById('step-actions'),
            stepSuccess: document.getElementById('step-success'),
            stepRegisterClient: document.getElementById('step-register-client'),
            stepRegisterBike: document.getElementById('step-register-bike'),

            // Register Client
            registerClientForm: document.getElementById('register-client-form'),
            regNome: document.getElementById('reg-nome'),
            regCpf: document.getElementById('reg-cpf'),
            regTelefone: document.getElementById('reg-telefone'),
            btnCancelClientRegister: document.getElementById('btn-cancel-client-register'),

            // Register Bike
            registerBikeForm: document.getElementById('register-bike-form'),
            btnCancelBikeRegister: document.getElementById('btn-cancel-bike-register'),

            // Actions
            clientName: document.getElementById('client-name'),
            bikeSelectionContainer: document.getElementById('bike-selection-container'),

            // Custom Select
            bikeSelect: document.getElementById('bike-select'), // Now hidden input
            customSelectBtn: document.getElementById('custom-select-btn'),
            customSelectText: document.getElementById('custom-select-text'),
            customSelectIcon: document.getElementById('custom-select-icon'),
            customSelectDropdown: document.getElementById('custom-select-dropdown'),
            customSelectList: document.getElementById('custom-select-list'),

            btnAddAnotherBike: document.getElementById('btn-add-another-bike'),
            noBikeContainer: document.getElementById('no-bike-container'),
            btnNewBike: document.getElementById('btn-new-bike'),
            btnEntrada: document.getElementById('btn-entrada'),
            btnSaida: document.getElementById('btn-saida'),
            btnVoltar: document.getElementById('btn-voltar'),
            btnReset: document.getElementById('btn-reset'),
            loadingOverlay: document.getElementById('loading-overlay'),

            // Custom Notification
            notificationModal: document.getElementById('custom-notification-modal'),
            notificationTitle: document.getElementById('notification-title'),
            notificationMessage: document.getElementById('notification-message'),
            notificationIcon: document.getElementById('notification-icon'),
            notificationIconContainer: document.getElementById('notification-icon-container'),
            btnCloseNotification: document.getElementById('btn-close-notification')
        };

        this.currentClient = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.startClock();
    }

    setupEventListeners() {
        // CPF Formatting
        this.elements.cpfInput.addEventListener('input', (e) => {
            e.target.value = Utils.formatCPF(e.target.value);
            this.elements.loginError.classList.add('hidden');
        });

        this.elements.regCpf.addEventListener('input', (e) => {
            e.target.value = Utils.formatCPF(e.target.value);
        });

        this.elements.regTelefone.addEventListener('input', (e) => {
            e.target.value = Utils.formatTelefone(e.target.value);
        });

        // Main Actions
        this.elements.btnIdentificar.addEventListener('click', () => this.handleIdentify());
        this.elements.btnCadastrarInit.addEventListener('click', () => this.showRegisterClient());

        // Registration
        this.elements.registerClientForm.addEventListener('submit', (e) => this.handleRegisterClient(e));
        this.elements.btnCancelClientRegister.addEventListener('click', () => this.showLogin());

        this.elements.registerBikeForm.addEventListener('submit', (e) => this.handleRegisterBike(e));
        this.elements.btnCancelBikeRegister.addEventListener('click', () => {
            // Se veio do login (novo cliente), volta pro login. Se veio do dashboard, volta pro dashboard
            if (this.currentClient) {
                this.showActions();
            } else {
                this.showRegisterClient();
            }
        });

        // Custom Select Logic
        if (this.elements.customSelectBtn) {
            this.elements.customSelectBtn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.toggleCustomSelect();
            });

            // Close dropdown when clicking outside
            document.addEventListener('click', (e) => {
                if (this.elements.customSelectDropdown &&
                    !this.elements.customSelectDropdown.classList.contains('hidden') &&
                    !this.elements.customSelectDropdown.contains(e.target) &&
                    !this.elements.customSelectBtn.contains(e.target)) {
                    this.closeCustomSelect();
                }
            });
        }

        // Dashboard Actions
        this.elements.btnEntrada.addEventListener('click', () => this.handleRequest('entrada'));
        this.elements.btnSaida.addEventListener('click', () => this.handleRequest('saida'));
        this.elements.btnVoltar.addEventListener('click', () => this.showLogin());
        this.elements.btnReset.addEventListener('click', () => this.showLogin());

        this.elements.btnNewBike.addEventListener('click', () => this.showRegisterBike());
        this.elements.btnAddAnotherBike.addEventListener('click', () => this.showRegisterBike());

        this.elements.btnCloseNotification.addEventListener('click', () => {
            if (this.elements.notificationModal) {
                this.elements.notificationModal.classList.add('hidden');
            }
        });
        this.elements.btnVoltar.addEventListener('click', () => this.showLogin());
        this.elements.btnReset.addEventListener('click', () => this.showLogin());

        this.elements.btnNewBike.addEventListener('click', () => this.showRegisterBike());
        this.elements.btnAddAnotherBike.addEventListener('click', () => this.showRegisterBike());

        // Desabilita botões se nenhuma bike estiver selecionada
    }

    toggleCustomSelect() {
        if (!this.elements.customSelectDropdown) return;
        const isHidden = this.elements.customSelectDropdown.classList.contains('hidden');
        if (isHidden) {
            this.elements.customSelectDropdown.classList.remove('hidden');
            this.elements.customSelectIcon.classList.add('rotate-180');
        } else {
            this.closeCustomSelect();
        }
    }

    closeCustomSelect() {
        if (!this.elements.customSelectDropdown) return;
        this.elements.customSelectDropdown.classList.add('hidden');
        this.elements.customSelectIcon.classList.remove('rotate-180');
    }

    selectBike(bikeId, bikeName) {
        this.elements.bikeSelect.value = bikeId;
        this.elements.customSelectText.textContent = bikeName;
        this.closeCustomSelect();
        this.updateActionButtons();
    }

    startClock() {
        // Optional: Keep clock updated if displayed
    }

    toggleLoading(show) {
        if (show) this.elements.loadingOverlay.classList.remove('hidden');
        else this.elements.loadingOverlay.classList.add('hidden');
    }

    async handleIdentify() {
        const cpf = this.elements.cpfInput.value;
        if (!Utils.validateCPF(cpf)) {
            this.showError('CPF inválido. Verifique e tente novamente.');
            return;
        }

        this.toggleLoading(true);

        try {
            const clients = await Storage.loadClients();
            const client = clients.find(c => c.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''));

            if (client) {
                this.currentClient = client;
                this.showActions();
            } else {
                this.showError('CPF não encontrado. Faça seu cadastro.');
            }
        } catch (error) {
            console.error(error);
            this.showError('Erro ao buscar dados. Tente novamente.');
        } finally {
            this.toggleLoading(false);
        }
    }

    showError(msg) {
        if (this.elements.loginError) {
            this.elements.loginError.textContent = msg;
            this.elements.loginError.classList.remove('hidden');
        } else {
            this.showNotification('Erro', msg, 'error');
        }
    }

    showNotification(title, message, type = 'info') {
        if (!this.elements.notificationTitle || !this.elements.notificationModal) {
            console.warn('Notification elements missing - HTML might be cached. Falling back to alert.');
            alert(`${title}\n\n${message.replace(/<br>/g, '\n').replace(/<[^>]*>/g, '')}`);
            return;
        }

        this.elements.notificationTitle.textContent = title;
        this.elements.notificationMessage.innerHTML = message;

        const icon = this.elements.notificationIcon;
        const container = this.elements.notificationIconContainer;

        // Reset classes
        container.className = 'mb-4 w-16 h-16 rounded-full flex items-center justify-center';
        icon.className = 'w-8 h-8';

        if (type === 'error') {
            container.classList.add('bg-red-100');
            icon.classList.add('text-red-600');
            icon.setAttribute('data-lucide', 'alert-circle');
            this.elements.btnCloseNotification.className = 'w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-4 rounded-xl transition-colors active:scale-95 shadow-md';
        } else if (type === 'warning') {
            container.classList.add('bg-amber-100');
            icon.classList.add('text-amber-600');
            icon.setAttribute('data-lucide', 'alert-triangle');
            this.elements.btnCloseNotification.className = 'w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-4 rounded-xl transition-colors active:scale-95 shadow-md';
        } else {
            container.classList.add('bg-blue-100');
            icon.classList.add('text-blue-600');
            icon.setAttribute('data-lucide', 'info');
            this.elements.btnCloseNotification.className = 'w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl transition-colors active:scale-95 shadow-md';
        }

        if (window.lucide) {
            lucide.createIcons();
        }
        this.elements.notificationModal.classList.remove('hidden');
    }

    showLogin() {
        this.currentClient = null;
        this.elements.cpfInput.value = '';
        this.elements.loginError.classList.add('hidden');

        this.hideAllSteps();
        this.elements.loginForm.parentElement.classList.remove('hidden'); // Elemento pai do formulário de login
        this.elements.loginForm.classList.remove('hidden');
        // Ensure header is visible if we hid it
    }

    hideAllSteps() {
        this.elements.loginForm.classList.add('hidden');
        this.elements.stepActions.classList.add('hidden');
        this.elements.stepSuccess.classList.add('hidden');
        this.elements.stepRegisterClient.classList.add('hidden');
        this.elements.stepRegisterBike.classList.add('hidden');
    }

    async showActions() {
        this.hideAllSteps();
        this.elements.stepActions.classList.remove('hidden');

        this.elements.clientName.textContent = this.currentClient.nome.split(' ')[0];

        const bikes = this.currentClient.bicicletas || [];

        if (bikes.length === 0) {
            this.elements.noBikeContainer.classList.remove('hidden');
            this.elements.bikeSelectionContainer.classList.add('hidden');
        } else {
            this.elements.noBikeContainer.classList.add('hidden');
            this.elements.bikeSelectionContainer.classList.remove('hidden');

            // Populate Custom Dropdown
            if (this.elements.customSelectList) {
                this.elements.customSelectList.innerHTML = bikes.map(bike => {
                    const displayName = `${bike.modelo} - ${bike.cor} (${bike.marca})`;
                    // We map the click to the global window.app instance
                    return `
                    <li>
                        <button type="button" class="w-full text-left px-4 py-4 text-white hover:bg-white/10 active:bg-white/20 transition-colors flex items-center gap-3 border-b border-white/5 last:border-0"
                            onclick="window.app.selectBike('${bike.id}', '${displayName}')">
                            <div class="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 shadow-inner">
                                <i data-lucide="bike" class="w-5 h-5 text-white"></i>
                            </div>
                            <span class="font-medium text-sm truncate flex-1">${displayName}</span>
                        </button>
                    </li>`;
                }).join('');

                // Select first by default
                const first = bikes[0];
                this.elements.bikeSelect.value = first.id;
                this.elements.customSelectText.textContent = `${first.modelo} - ${first.cor} (${first.marca})`;

                if (window.lucide) {
                    lucide.createIcons();
                }
            } else {
                // Fallback for old HTML just in case
                this.elements.bikeSelect.innerHTML = bikes.map(bike =>
                    `<option value="${bike.id}" class="bg-blue-900 text-white py-2">${bike.modelo} - ${bike.cor} (${bike.marca})</option>`
                ).join('');
                this.elements.bikeSelect.onchange = () => this.updateActionButtons();
            }

            // Initial check for buttons
            await this.updateActionButtons();
        }
    }

    async updateActionButtons() {
        const bikeId = this.elements.bikeSelect.value;
        if (!bikeId) return;

        this.toggleLoading(true);
        try {
            // Load records to check status
            const allRegistros = await Storage.loadRegistros();

            // Find active record for this bike (Entry without Exit)
            const activeRecord = allRegistros.find(r =>
                r.bikeId === bikeId &&
                r.dataHoraEntrada &&
                !r.dataHoraSaida
            );

            if (activeRecord) {
                // Bike is INSIDE -> Show ONLY Exit
                this.elements.btnEntrada.classList.add('hidden');
                this.elements.btnSaida.classList.remove('hidden');
            } else {
                // Bike is OUTSIDE -> Show ONLY Entry
                this.elements.btnEntrada.classList.remove('hidden');
                this.elements.btnSaida.classList.add('hidden');
            }
        } catch (error) {
            console.error('Erro ao verificar status da bicicleta:', error);
            // Fallback: show both? or default to Entry? 
            // Showing both is safer if error, but might confuse. Let's show Entry.
            this.elements.btnEntrada.classList.remove('hidden');
            this.elements.btnSaida.classList.add('hidden');
        } finally {
            this.toggleLoading(false);
        }
    }

    showRegisterClient() {
        this.hideAllSteps();
        this.elements.stepRegisterClient.classList.remove('hidden');

        // Auto-fill CPF if typed
        const typedCpf = this.elements.cpfInput.value;
        if (typedCpf) {
            this.elements.regCpf.value = typedCpf;
        }
    }

    showRegisterBike() {
        this.hideAllSteps();
        this.elements.stepRegisterBike.classList.remove('hidden');
    }

    async handleRegisterClient(e) {
        e.preventDefault();

        const nome = this.elements.regNome.value.toUpperCase();
        const cpf = this.elements.regCpf.value;
        const telefone = this.elements.regTelefone.value;

        if (!Utils.validateCPF(cpf)) {
            this.showNotification('CPF Inválido', 'Por favor, digite um CPF válido.', 'error');
            return;
        }

        this.toggleLoading(true);

        try {
            const clients = await Storage.loadClients();

            if (clients.some(c => c.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''))) {
                const existing = clients.find(c => c.cpf.replace(/\D/g, '') === cpf.replace(/\D/g, ''));
                this.showNotification(
                    'Cliente Já Cadastrado',
                    `Este CPF já pertence ao cliente:<br><strong class="text-slate-800">${existing.nome}</strong>`,
                    'warning'
                );
                this.toggleLoading(false);
                return;
            }

            const newClient = {
                id: Utils.generateUUID(),
                nome,
                cpf,
                telefone,
                dataCadastro: new Date().toISOString(),
                bicicletas: [], // Will add bike next
                comentarios: []
            };

            await Storage.saveClient(newClient);
            this.currentClient = newClient;

            // Force reload to ensure persistence
            // clients.push(newClient); 

            this.toggleLoading(false);
            this.showRegisterBike(); // Go directly to bike registration

        } catch (error) {
            console.error(error);
            this.showNotification('Erro no Cadastro', 'Não foi possível realizar o cadastro. Tente novamente.', 'error');
            this.toggleLoading(false);
        }
    }

    async handleRegisterBike(e) {
        e.preventDefault();

        if (!this.currentClient) return;

        const marca = document.getElementById('reg-bike-marca').value.toUpperCase();
        const modelo = document.getElementById('reg-bike-modelo').value.toUpperCase();
        const cor = document.getElementById('reg-bike-cor').value.toUpperCase();

        // Photo handling would go here (need to process file input)

        const newBike = {
            id: Utils.generateUUID(),
            marca,
            modelo,
            cor,
            dataCadastro: new Date().toISOString()
        };

        this.currentClient.bicicletas.push(newBike);

        this.toggleLoading(true);
        try {
            await Storage.saveClient(this.currentClient);
            this.toggleLoading(false);
            this.showActions();
        } catch (error) {
            console.error(error);
            this.showNotification('Erro', 'Erro ao salvar bicicleta.', 'error');
            this.toggleLoading(false);
        }
    }

    async handleRequest(type) {
        if (!this.currentClient) return;

        const bikeId = this.elements.bikeSelect.value;
        if (!bikeId) return;

        const bike = this.currentClient.bicicletas.find(b => b.id === bikeId);

        // Create Request Object
        const request = {
            id: Utils.generateUUID(),
            tipo: type, // 'entrada' or 'saida'
            clientId: this.currentClient.id,
            clientName: this.currentClient.nome,
            bikeId: bike.id,
            bikeInfo: `${bike.modelo} - ${bike.cor}`,
            timestamp: new Date().toISOString(),
            status: 'pendente' // pendente, aprovado, rejeitado
        };

        this.toggleLoading(true);

        try {
            // We need a specific storage for requests. 
            // For now, let's append to a 'requests' list in localStorage.
            // In a real backend, this would be a specific endpoint.
            let requests = JSON.parse(localStorage.getItem('bicicletario_requests') || '[]');
            requests.push(request);
            localStorage.setItem('bicicletario_requests', JSON.stringify(requests));

            // Trigger a custom event or letting the admin dashboard know via polling/storage event
            // The admin dashboard (registros-diarios.js) needs to listen to this.

            this.toggleLoading(false);
            this.showSuccess();

        } catch (error) {
            console.error(error);
            this.showNotification('Erro', 'Erro ao enviar solicitação.', 'error');
            this.toggleLoading(false);
        }
    }

    showSuccess() {
        this.hideAllSteps();
        this.elements.stepSuccess.classList.remove('hidden');

        // Auto reset after 5 seconds
        setTimeout(() => {
            if (!this.elements.stepSuccess.classList.contains('hidden')) {
                this.showLogin();
            }
        }, 5000);
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.app = new MobileAccess();
});
