import { Utils } from '../shared/utils.js';
import { Modals } from '../shared/modals.js';
import { logAction } from '../shared/audit-logger.js';

export class ConexoesQRManager {
    constructor(app) {
        this.app = app;
        this.elements = {
            modal: document.getElementById('qr-connections-modal'),
            openButton: document.getElementById('open-qr-connections-modal-btn'),
            closeButton: document.querySelector('.close-qr-connections-modal'),
            container: document.getElementById('qr-connections-container'),
            searchInput: document.getElementById('qr-connections-search')
        };
        this.solicitacoes = [];
        this.filteredSolicitacoes = [];
        this.autoRefreshInterval = null;
        this.setupEventListeners();
    }

    setupEventListeners() {
        if (this.elements.openButton) {
            this.elements.openButton.addEventListener('click', () => this.open());
        }

        if (this.elements.closeButton) {
            this.elements.closeButton.addEventListener('click', () => this.close());
        }

        if (this.elements.searchInput) {
            this.elements.searchInput.addEventListener('input', () => this.filterSolicitacoes());
        }

        // Close on backdrop click
        if (this.elements.modal) {
            this.elements.modal.addEventListener('click', (e) => {
                if (e.target === this.elements.modal) {
                    this.close();
                }
            });
        }
    }

    async open() {
        if (this.elements.modal) {
            this.elements.modal.classList.remove('hidden');
            await this.loadSolicitacoes();
            this.startAutoRefresh();
        }
    }

    close() {
        if (this.elements.modal) {
            this.elements.modal.classList.add('hidden');
            this.stopAutoRefresh();
        }
    }

    startAutoRefresh() {
        // Refresh every 30 seconds
        this.autoRefreshInterval = setInterval(() => {
            this.loadSolicitacoes(true);
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.autoRefreshInterval) {
            clearInterval(this.autoRefreshInterval);
            this.autoRefreshInterval = null;
        }
    }

    async loadSolicitacoes(silent = false) {
        try {
            if (!silent) {
                this.renderLoading();
            }

            const response = await fetch('/api/qr/solicitacoes');
            if (!response.ok) {
                throw new Error('Erro ao carregar solicitações');
            }

            this.solicitacoes = await response.json();
            this.filteredSolicitacoes = this.solicitacoes;
            this.render();
        } catch (error) {
            console.error('Erro ao carregar solicitações QR:', error);
            this.renderError('Erro ao carregar solicitações. Verifique sua conexão.');
        }
    }

    filterSolicitacoes() {
        const searchTerm = this.elements.searchInput?.value.toUpperCase() || '';
        
        if (!searchTerm) {
            this.filteredSolicitacoes = this.solicitacoes;
        } else {
            this.filteredSolicitacoes = this.solicitacoes.filter(s => {
                const nome = s.nome?.toUpperCase() || '';
                const cpf = s.cpf?.replace(/\D/g, '') || '';
                const id = s.id?.toUpperCase() || '';
                const email = s.email?.toUpperCase() || '';
                
                return nome.includes(searchTerm) || 
                       cpf.includes(searchTerm) || 
                       id.includes(searchTerm) ||
                       email.includes(searchTerm);
            });
        }
        
        this.render();
    }

    renderLoading() {
        if (this.elements.container) {
            this.elements.container.innerHTML = `
                <div class="flex justify-center items-center py-8">
                    <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            `;
        }
    }

    renderError(message) {
        if (this.elements.container) {
            this.elements.container.innerHTML = `
                <div class="text-center py-8">
                    <i data-lucide="alert-circle" class="h-12 w-12 text-red-500 mx-auto mb-2"></i>
                    <p class="text-red-600 dark:text-red-400">${message}</p>
                    <button onclick="window.qrConnectionsManager.loadSolicitacoes()" 
                            class="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                        Tentar Novamente
                    </button>
                </div>
            `;
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
        }
    }

    render() {
        if (!this.elements.container) return;

        if (this.filteredSolicitacoes.length === 0) {
            if (this.solicitacoes.length === 0) {
                this.elements.container.innerHTML = `
                    <div class="text-center py-8">
                        <i data-lucide="inbox" class="h-12 w-12 text-slate-400 mx-auto mb-2"></i>
                        <p class="text-slate-500 dark:text-slate-400">Nenhuma solicitação pendente</p>
                    </div>
                `;
            } else {
                this.elements.container.innerHTML = `
                    <div class="text-center py-8">
                        <i data-lucide="search-x" class="h-12 w-12 text-slate-400 mx-auto mb-2"></i>
                        <p class="text-slate-500 dark:text-slate-400">Nenhuma solicitação encontrada</p>
                    </div>
                `;
            }
            if (typeof lucide !== 'undefined') {
                lucide.createIcons();
            }
            return;
        }

        const html = this.filteredSolicitacoes.map(s => this.renderSolicitacao(s)).join('');
        this.elements.container.innerHTML = html;
        
        // Re-initialize lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }

        // Add event listeners for action buttons
        this.attachActionListeners();
    }

    renderSolicitacao(s) {
        const dataFormatada = new Date(s.criado_em).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const statusClass = s.status === 'pendente' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' : 
                           s.status === 'aprovado' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                           'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';

        const statusText = s.status === 'pendente' ? 'Pendente' : 
                          s.status === 'aprovado' ? 'Aprovado' : 'Rejeitado';

        return `
            <div class="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 mb-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start">
                    <div class="flex-1">
                        <div class="flex items-center gap-2 mb-2">
                            <i data-lucide="user" class="h-5 w-5 text-blue-600 dark:text-blue-400"></i>
                            <h3 class="font-bold text-lg text-slate-800 dark:text-slate-100">${Utils.escapeHtml(s.nome)}</h3>
                            <span class="inline-block px-2 py-1 rounded-md text-xs font-medium ${statusClass}">
                                ${statusText}
                            </span>
                        </div>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 dark:text-slate-300">
                            <div class="flex items-center gap-2">
                                <i data-lucide="credit-card" class="h-4 w-4"></i>
                                <span>CPF: ${this.formatCPF(s.cpf)}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <i data-lucide="mail" class="h-4 w-4"></i>
                                <span>${Utils.escapeHtml(s.email)}</span>
                            </div>
                            ${s.telefone ? `
                            <div class="flex items-center gap-2">
                                <i data-lucide="phone" class="h-4 w-4"></i>
                                <span>${Utils.escapeHtml(s.telefone)}</span>
                            </div>
                            ` : ''}
                            <div class="flex items-center gap-2">
                                <i data-lucide="clock" class="h-4 w-4"></i>
                                <span>${dataFormatada}</span>
                            </div>
                            ${s.station_id ? `
                            <div class="flex items-center gap-2">
                                <i data-lucide="map-pin" class="h-4 w-4"></i>
                                <span>Estação: ${Utils.escapeHtml(s.station_id)}</span>
                            </div>
                            ` : ''}
                            <div class="flex items-center gap-2">
                                <i data-lucide="hash" class="h-4 w-4"></i>
                                <span class="text-xs font-mono">${s.id}</span>
                            </div>
                        </div>
                    </div>
                    ${s.status === 'pendente' ? `
                    <div class="flex gap-2 ml-4">
                        <button data-action="aprovar" data-id="${s.id}" 
                                class="flex items-center px-3 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-md transition-colors">
                            <i data-lucide="check" class="h-4 w-4 mr-1"></i>
                            Aprovar
                        </button>
                        <button data-action="rejeitar" data-id="${s.id}" 
                                class="flex items-center px-3 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-md transition-colors">
                            <i data-lucide="x" class="h-4 w-4 mr-1"></i>
                            Rejeitar
                        </button>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;
    }

    formatCPF(cpf) {
        if (!cpf) return '';
        const cleaned = cpf.replace(/\D/g, '');
        if (cleaned.length === 11) {
            return cleaned.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
        }
        return cpf;
    }

    attachActionListeners() {
        const aprovarButtons = this.elements.container.querySelectorAll('[data-action="aprovar"]');
        const rejeitarButtons = this.elements.container.querySelectorAll('[data-action="rejeitar"]');

        aprovarButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleAprovar(btn.dataset.id));
        });

        rejeitarButtons.forEach(btn => {
            btn.addEventListener('click', () => this.handleRejeitar(btn.dataset.id));
        });
    }

    async handleAprovar(id) {
        const solicitacao = this.solicitacoes.find(s => s.id === id);
        if (!solicitacao) return;

        const confirmed = await Modals.confirm(
            `Deseja aprovar a solicitação de cadastro de ${solicitacao.nome}?`,
            'Confirmar Aprovação'
        );

        if (!confirmed) return;

        try {
            const response = await fetch('/api/qr/solicitacao/aprovar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    aprovado_por: this.app.currentUser?.username || 'admin'
                })
            });

            const data = await response.json();

            if (data.success) {
                Modals.alert('Solicitação aprovada com sucesso!', 'Sucesso');
                logAction('qr_connection_approved', { solicitacao_id: id, nome: solicitacao.nome });
                await this.loadSolicitacoes();
            } else {
                throw new Error(data.error || 'Erro ao aprovar solicitação');
            }
        } catch (error) {
            console.error('Erro ao aprovar solicitação:', error);
            Modals.alert('Erro ao aprovar solicitação: ' + error.message, 'Erro');
        }
    }

    async handleRejeitar(id) {
        const solicitacao = this.solicitacoes.find(s => s.id === id);
        if (!solicitacao) return;

        const observacoes = prompt(`Motivo da rejeição da solicitação de ${solicitacao.nome} (opcional):`);
        if (observacoes === null) return; // User cancelled

        try {
            const response = await fetch('/api/qr/solicitacao/rejeitar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                    aprovado_por: this.app.currentUser?.username || 'admin',
                    observacoes: observacoes || ''
                })
            });

            const data = await response.json();

            if (data.success) {
                Modals.alert('Solicitação rejeitada.', 'Solicitação Rejeitada');
                logAction('qr_connection_rejected', { solicitacao_id: id, nome: solicitacao.nome, observacoes });
                await this.loadSolicitacoes();
            } else {
                throw new Error(data.error || 'Erro ao rejeitar solicitação');
            }
        } catch (error) {
            console.error('Erro ao rejeitar solicitação:', error);
            Modals.alert('Erro ao rejeitar solicitação: ' + error.message, 'Erro');
        }
    }
}

// Make the manager globally accessible for inline event handlers
window.qrConnectionsManager = null;
