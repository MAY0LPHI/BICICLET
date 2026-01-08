/**
 * System Loader - Verifica e inicializa componentes do sistema
 * Exibe uma tela de carregamento com etapas de validação
 */

import { Storage } from './storage.js';
import { Auth } from './auth.js';
import { Utils } from './utils.js';

export class SystemLoader {
    constructor() {
        this.steps = [
            { id: 'security', name: '🔒 Verificação de Segurança', handler: this.checkSecurity.bind(this) },
            { id: 'core', name: '⚙️ Inicialização do Núcleo', handler: this.checkCore.bind(this) },
            { id: 'protocols', name: '🌐 Carregamento de Protocolos', handler: this.checkProtocols.bind(this) },
            { id: 'modules', name: '📦 Ativação de Módulos', handler: this.checkModules.bind(this) }
        ];
        this.currentStepIndex = 0;
        
        // Configurações de delay (em ms) - pode ser ajustado ou removido em produção
        // Para produção, considere reduzir ou definir como 0 para inicialização mais rápida
        this.config = {
            stepDelay: 1200,      // Delay entre etapas para visualização
            errorDelay: 500,      // Delay após erro
            completionDelay: 800  // Delay antes de remover a tela
        };
    }

    /**
     * Cria e exibe a tela de carregamento
     */
    createLoadingScreen() {
        const loadingScreen = document.createElement('div');
        loadingScreen.id = 'system-loading-screen';
        loadingScreen.className = 'fixed inset-0 z-[10005] bg-gradient-to-br from-indigo-900/50 via-indigo-500/5 to-slate-900/40 backdrop-blur-md flex items-center justify-center';
        
        loadingScreen.innerHTML = `
            <div class="max-w-md w-full mx-4">
                <div class="bg-white/15 dark:bg-slate-800/40 backdrop-blur-xl rounded-2xl shadow-2xl p-8 border border-white/10 ring-1 ring-white/15">
                    <!-- Logo/Ícone -->
                    <div class="text-center mb-6">
                        <div class="inline-flex items-center justify-center w-16 h-16 bg-blue-500/60 rounded-full mb-4 ring-4 ring-blue-400/30">
                            <i data-lucide="bike" class="w-8 h-8 text-white"></i>
                        </div>
                        <h2 class="text-2xl font-bold text-white/95 mb-2">Sistema de Bicicletário</h2>
                        <p class="text-sm text-white/60">Verificando sistema...</p>
                    </div>

                    <!-- Progress Bar -->
                    <div class="mb-6">
                        <div class="h-2 bg-white/10 rounded-full overflow-hidden ring-1 ring-white/15">
                            <div id="system-progress-bar" class="h-full bg-gradient-to-r from-blue-400/80 to-blue-500/90 transition-all duration-500 ease-out" style="width: 0%"></div>
                        </div>
                        <div class="mt-2 text-center">
                            <span id="system-progress-text" class="text-xs text-white/80 font-medium">0%</span>
                        </div>
                    </div>

                    <!-- Steps List -->
                    <div id="system-steps-list" class="space-y-3">
                        ${this.steps.map(step => `
                            <div id="step-${step.id}" class="flex items-center space-x-3 p-3 bg-white/10 rounded-lg ring-1 ring-white/10 transition-all duration-300">
                                <div class="step-icon flex-shrink-0 w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
                                    <div class="w-2 h-2 rounded-full bg-white/40"></div>
                                </div>
                                <div class="flex-1">
                                    <div class="step-name text-sm text-white/80">${step.name}</div>
                                </div>
                                <div class="step-status">
                                    <i data-lucide="loader" class="w-4 h-4 text-white/40 animate-spin hidden"></i>
                                    <i data-lucide="check" class="w-4 h-4 text-emerald-400 hidden"></i>
                                    <i data-lucide="alert-circle" class="w-4 h-4 text-red-400 hidden"></i>
                                </div>
                            </div>
                        `).join('')}
                    </div>

                    <!-- Status Message -->
                    <div id="system-status-message" class="mt-4 text-center text-xs text-white/60 min-h-[20px]">
                        Preparando verificação...
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(loadingScreen);
        
        // Inicializar ícones do Lucide
        if (window.lucide) {
            window.lucide.createIcons();
        }

        return loadingScreen;
    }

    /**
     * Atualiza o status de uma etapa
     */
    updateStepStatus(stepId, status, message = '') {
        const stepElement = document.getElementById(`step-${stepId}`);
        if (!stepElement) return;

        const statusIcons = stepElement.querySelectorAll('.step-status i');
        statusIcons.forEach(icon => icon.classList.add('hidden'));

        if (status === 'loading') {
            stepElement.classList.add('ring-blue-400/30', 'bg-white/15');
            statusIcons[0]?.classList.remove('hidden'); // loader
        } else if (status === 'success') {
            stepElement.classList.remove('ring-blue-400/30');
            stepElement.classList.add('ring-emerald-500/25', 'bg-white/10', 'border-emerald-500/60');
            statusIcons[1]?.classList.remove('hidden'); // check
            
            const iconDiv = stepElement.querySelector('.step-icon');
            iconDiv.classList.remove('bg-white/20');
            iconDiv.classList.add('bg-emerald-500/60', 'completed');
            iconDiv.innerHTML = '<i data-lucide="check" class="w-3 h-3 text-white"></i>';
        } else if (status === 'error') {
            stepElement.classList.remove('ring-blue-400/30');
            stepElement.classList.add('ring-red-500/25', 'bg-red-500/20');
            statusIcons[2]?.classList.remove('hidden'); // alert-circle
            
            const iconDiv = stepElement.querySelector('.step-icon');
            iconDiv.classList.remove('bg-white/20');
            iconDiv.classList.add('bg-red-500/60');
        }

        if (window.lucide) {
            window.lucide.createIcons();
        }

        if (message) {
            document.getElementById('system-status-message').textContent = message;
        }
    }

    /**
     * Atualiza a barra de progresso
     */
    updateProgress(percentage) {
        const progressBar = document.getElementById('system-progress-bar');
        const progressText = document.getElementById('system-progress-text');
        
        if (progressBar) {
            progressBar.style.width = `${percentage}%`;
        }
        if (progressText) {
            progressText.textContent = `${percentage}%`;
        }
    }

    /**
     * Verifica segurança do sistema
     */
    async checkSecurity() {
        // Verificar se o módulo de autenticação está disponível
        if (typeof Auth === 'undefined') {
            throw new Error('Módulo de autenticação não encontrado');
        }

        // Verificar integridade do localStorage
        try {
            localStorage.setItem('_test', '1');
            localStorage.removeItem('_test');
        } catch (e) {
            throw new Error('Armazenamento local não disponível');
        }

        // Verificar se há dados corrompidos
        try {
            const testData = localStorage.getItem('bicicletario_clients');
            if (testData && testData !== 'undefined') {
                JSON.parse(testData);
            }
        } catch (e) {
            console.warn('Dados corrompidos detectados, será feita limpeza');
        }

        return true;
    }

    /**
     * Verifica inicialização do núcleo
     */
    async checkCore() {
        // Verificar dependências essenciais
        const essentialModules = [
            { name: 'Storage', module: Storage },
            { name: 'Auth', module: Auth },
            { name: 'Utils', module: Utils }
        ];

        for (const { name, module } of essentialModules) {
            if (typeof module === 'undefined') {
                throw new Error(`Módulo essencial ${name} não encontrado`);
            }
        }

        // Verificar APIs do navegador
        if (typeof window.localStorage === 'undefined') {
            throw new Error('localStorage não disponível');
        }

        // Verificar se o Lucide está carregado
        if (typeof window.lucide === 'undefined') {
            console.warn('Biblioteca de ícones não carregada completamente');
        }

        return true;
    }

    /**
     * Verifica protocolos de comunicação
     */
    async checkProtocols() {
        // Verificar se está em ambiente Electron ou navegador
        const isElectron = typeof window !== 'undefined' && window.electron;
        
        if (isElectron) {
            // Verificar APIs do Electron
            if (!window.electron.saveClients || !window.electron.loadClients) {
                throw new Error('APIs do Electron não disponíveis');
            }
        }

        // Verificar conectividade de armazenamento
        try {
            if (isElectron) {
                // Teste básico de acesso ao storage do Electron
                await window.electron.loadClients();
            } else {
                // Teste básico de acesso ao localStorage
                const testKey = '_protocol_test';
                localStorage.setItem(testKey, 'test');
                localStorage.getItem(testKey);
                localStorage.removeItem(testKey);
            }
        } catch (e) {
            throw new Error('Falha na comunicação com armazenamento');
        }

        return true;
    }

    /**
     * Verifica módulos do sistema
     */
    async checkModules() {
        // Inicializar Auth
        try {
            await Auth.init();
        } catch (e) {
            throw new Error('Falha ao inicializar autenticação');
        }

        // Verificar módulos de UI
        const uiElements = [
            'login-container',
            'app-container'
        ];

        for (const elementId of uiElements) {
            if (!document.getElementById(elementId)) {
                throw new Error(`Elemento de UI ${elementId} não encontrado`);
            }
        }

        return true;
    }

    /**
     * Executa todas as verificações
     */
    async runChecks() {
        const totalSteps = this.steps.length;
        
        for (let i = 0; i < this.steps.length; i++) {
            const step = this.steps[i];
            const percentage = Math.floor((i / totalSteps) * 100);
            
            this.updateProgress(percentage);
            this.updateStepStatus(step.id, 'loading', step.name);

            try {
                // Delay para visualização (configurável via this.config.stepDelay)
                await new Promise(resolve => setTimeout(resolve, this.config.stepDelay));
                
                // Executar a verificação
                await step.handler();
                
                this.updateStepStatus(step.id, 'success', `${step.name} - Concluído`);
            } catch (error) {
                console.error(`Erro na etapa ${step.id}:`, error);
                this.updateStepStatus(step.id, 'error', `${step.name} - Erro: ${error.message}`);
                
                // Delay após erro (configurável via this.config.errorDelay)
                await new Promise(resolve => setTimeout(resolve, this.config.errorDelay));
            }
        }

        // Completar 100%
        this.updateProgress(100);
        document.getElementById('system-status-message').textContent = 'Sistema pronto!';
        
        // Delay antes de remover a tela (configurável via this.config.completionDelay)
        await new Promise(resolve => setTimeout(resolve, this.config.completionDelay));
    }

    /**
     * Remove a tela de carregamento
     */
    removeLoadingScreen() {
        const loadingScreen = document.getElementById('system-loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            loadingScreen.style.transition = 'opacity 0.5s ease-out';
            
            setTimeout(() => {
                loadingScreen.remove();
            }, 500);
        }
    }

    /**
     * Inicia o processo de carregamento
     */
    async start() {
        // Verificar se é uma recarga após login/logout ou carga inicial
        const skipLoadingScreen = sessionStorage.getItem('skipLoadingScreen');
        
        if (skipLoadingScreen === 'true') {
            // Remover a flag e pular a tela de carregamento
            sessionStorage.removeItem('skipLoadingScreen');
            console.log('Pulando tela de carregamento (recarga do sistema)');
            return true;
        }
        
        // Primeira carga do sistema - mostrar tela de carregamento
        this.createLoadingScreen();
        
        try {
            await this.runChecks();
            this.removeLoadingScreen();
            return true;
        } catch (error) {
            console.error('Erro crítico durante inicialização:', error);
            document.getElementById('system-status-message').textContent = 
                'Erro crítico. Recarregue a página.';
            return false;
        }
    }
}
