
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
            bikeSelect: document.getElementById('bike-select'),
            btnAddAnotherBike: document.getElementById('btn-add-another-bike'),
            noBikeContainer: document.getElementById('no-bike-container'),
            btnNewBike: document.getElementById('btn-new-bike'),
            btnEntrada: document.getElementById('btn-entrada'),
            btnSaida: document.getElementById('btn-saida'),
            btnVoltar: document.getElementById('btn-voltar'),
            btnReset: document.getElementById('btn-reset'),
            loadingOverlay: document.getElementById('loading-overlay')
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

        // Dashboard Actions
        this.elements.btnEntrada.addEventListener('click', () => this.handleRequest('entrada'));
        this.elements.btnSaida.addEventListener('click', () => this.handleRequest('saida'));
        this.elements.btnVoltar.addEventListener('click', () => this.showLogin());
        this.elements.btnReset.addEventListener('click', () => this.showLogin());

        this.elements.btnNewBike.addEventListener('click', () => this.showRegisterBike());
        this.elements.btnAddAnotherBike.addEventListener('click', () => this.showRegisterBike());

        // Disable buttons if no bike selected or invalid state
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
            // Use Backend API instead of local storage
            const response = await fetch('/api/mobile/identify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ cpf })
            });

            if (!response.ok) throw new Error('Erro na comunicação com servidor');

            const data = await response.json();

            if (data.found && data.client) {
                this.currentClient = data.client;
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
        this.elements.loginError.textContent = msg;
        this.elements.loginError.classList.remove('hidden');
    }

    showLogin() {
        this.currentClient = null;
        this.elements.cpfInput.value = '';
        this.elements.loginError.classList.add('hidden');

        this.hideAllSteps();
        this.elements.loginForm.parentElement.classList.remove('hidden'); // Parent includes header? No, just the form wrapper
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

            // Populate Dropdown
            this.elements.bikeSelect.innerHTML = bikes.map(bike =>
                `<option value="${bike.id}">${bike.modelo} - ${bike.cor} (${bike.marca})</option>`
            ).join('');

            // Initial check for buttons
            await this.updateActionButtons();

            // Add listener for change (remove old one if exists to avoid duplicates, though replacing innerHTML of parent might not be enough if element is static)
            // It's better to add the listener in setupEventListeners and just call a method here, 
            // but for now I will add a simple onchange here or ensuring updateActionButtons is called.
            this.elements.bikeSelect.onchange = () => this.updateActionButtons();
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
            alert('CPF inválido');
            return;
        }

        this.toggleLoading(true);

        try {
            const clients = await Storage.loadClients();

            if (clients.some(c => c.cpf === cpf)) {
                alert('CPF já cadastrado!');
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
            alert('Erro ao cadastrar. Tente novamente.');
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
            alert('Erro ao salvar bicicleta.');
            this.toggleLoading(false);
        }
    }

    async handleRequest(type) {
        if (!this.currentClient) return;

        const bikeId = this.elements.bikeSelect.value;
        if (!bikeId) return;

        const bike = this.currentClient.bicicletas.find(b => b.id === bikeId);

        // Create Request Object payload
        const requestData = {
            clientId: this.currentClient.id,
            clientName: this.currentClient.nome,
            bikeId: bike.id,
            bikeInfo: `${bike.modelo} - ${bike.cor}`,
            type: type // 'entrada' or 'saida'
        };

        this.toggleLoading(true);

        try {
            // Send to Backend API
            const response = await fetch('/api/mobile/request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestData)
            });

            if (!response.ok) throw new Error('Falha ao enviar solicitação');

            const result = await response.json();

            if (result.success) {
                this.showSuccess();
            } else {
                alert('Erro: ' + (result.error || 'Falha desconhecida'));
            }

        } catch (error) {
            console.error(error);
            alert('Erro ao enviar solicitação. Verifique sua conexão.');
        } finally {
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
    new MobileAccess();
});
