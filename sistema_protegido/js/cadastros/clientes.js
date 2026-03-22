/**
 * ============================================================
 *  ARQUIVO: clientes.js
 *  DESCRIÇÃO: Gerenciador de Cadastro e Listagem de Clientes
 *
 *  FUNÇÃO:
 *  Controla todo o gerenciamento de clientes no sistema:
 *  - Cadastro de novo cliente (formulário #add-client-form)
 *  - Listagem e busca de clientes com paginação progressiva
 *  - Edição de dados do cliente (modal #edit-client-modal)
 *  - Sistema de comentários por cliente
 *  - Toast de confirmação ao salvar
 *  - Controle de permissões por papel (admin/funcionario)
 *
 *  CLASSE: ClientesManager
 *  Instanciada em app-modular.js como this.clientesManager
 *
 *  DEPENDÊNCIAS:
 *  - utils.js             → formatCPF(), formatTelefone(), validateCPF(), debounce()
 *  - storage.js           → Storage.saveClient()
 *  - auth.js              → Auth.requirePermission(), Auth.getCurrentSession()
 *  - modals.js            → Modals.alert()
 *  - audit-logger.js      → logAction()
 *  - performance-config.js → PerformanceConfig.get('clientListLimit'), enableDebounce
 *
 *  FLUXO PRINCIPAL:
 *  1. Usuário preenche formulário → handleAddClient() valida CPF e duplicatas
 *  2. Salvo com sucesso → Storage.saveClient() + logAction() + toast + foco automático
 *  3. Busca no campo #search → renderClientList(filtro) com debounce opcional
 *  4. Clique no cliente → selectedClientId atualizado → bicicletasManager.renderClientDetails()
 *
 *  LISTAGEM COM PAGINAÇÃO:
 *  - Máximo de 50 clientes renderizados de início (protege baixo hardware)
 *  - Botão "Carregar mais" incrementa em clientListLimit (configurável)
 *  - currentLimit é resetado a cada busca nova
 *
 *  TOAST DE CONFIRMAÇÃO (_showSaveToast):
 *  - Aparece no centro-baixo da tela por 3 segundos
 *  - Cor dinâmica para modo claro/escuro
 *  - Usa animation via requestAnimationFrame
 *
 *  PARA INICIANTES:
 *  Para adicionar campos (ex: endereço):
 *  1. Crie o <input id="endereco"> no formulário em index.html
 *  2. Leia com formData.get('endereco') em handleAddClient()
 *  3. Inclua no objeto newClient
 * ============================================================
 */

import { Utils } from '../shared/utils.js';
import { Storage } from '../shared/storage.js';
import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';
import { logAction } from '../shared/audit-logger.js';
import { PerformanceConfig } from '../shared/performance-config.js';

export class ClientesManager {
    constructor(app) {
        this.app = app;
        this.currentLimit = 100; // Limite atual de itens renderizados
        this.elements = {
            addClientForm: document.getElementById('add-client-form'),
            cpfInput: document.getElementById('cpf'),
            cpfError: document.getElementById('cpf-error'),
            telefoneInput: document.getElementById('telefone'),
            searchInput: document.getElementById('search'),
            clientList: document.getElementById('client-list'),
            clientDetailsSection: document.getElementById('client-details-section'),
            clientDetailsPlaceholder: document.getElementById('client-details-placeholder'),
            editClientModal: document.getElementById('edit-client-modal'),
            editClientForm: document.getElementById('edit-client-form'),
            editClientId: document.getElementById('edit-client-id'),
            editClientNome: document.getElementById('edit-client-nome'),
            editClientCpf: document.getElementById('edit-client-cpf'),
            editClientTelefone: document.getElementById('edit-client-telefone'),
            editCpfError: document.getElementById('edit-cpf-error'),
            cancelEditClient: document.getElementById('cancel-edit-client'),
        };
        this.setupEventListeners();
    }

    setupEventListeners() {
        const nomeInput = document.getElementById('nome');

        this.elements.addClientForm.addEventListener('submit', this.handleAddClient.bind(this));

        // Pressionar enter em qualquer input do form tenta salvar
        const handleEnterSubmit = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.elements.addClientForm.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
            }
        };
        this.elements.addClientForm.querySelectorAll('input').forEach(input => {
            input.addEventListener('keypress', handleEnterSubmit);
        });

        // Aplica debounce se habilitado nas configurações
        const handleSearch = (e) => {
            e.target.value = e.target.value.toUpperCase();
            this.currentLimit = PerformanceConfig.get('clientListLimit'); // Reseta limite ao buscar
            this.renderClientList(e.target.value);
        };

        if (PerformanceConfig.get('enableDebounce')) {
            const delay = PerformanceConfig.get('debounceDelay');
            this.elements.searchInput.addEventListener('input', Utils.debounce(handleSearch, delay));
        } else {
            this.elements.searchInput.addEventListener('input', handleSearch);
        }

        nomeInput.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        this.elements.cpfInput.addEventListener('input', (e) => {
            e.target.value = Utils.formatCPF(e.target.value);
        });
        this.elements.telefoneInput.addEventListener('input', (e) => {
            e.target.value = Utils.formatTelefone(e.target.value);
        });
        this.elements.editClientForm.addEventListener('submit', this.handleEditClient.bind(this));
        this.elements.cancelEditClient.addEventListener('click', () => this.app.toggleModal('edit-client-modal', false));

        this.elements.clientList.addEventListener('click', (e) => {
            const quickBtn = e.target.closest('.quick-entry-btn');
            if (quickBtn) {
                e.stopPropagation();
                if (this.app.registrosManager && typeof this.app.registrosManager.handleQuickEntry === 'function') {
                    this.app.registrosManager.handleQuickEntry(quickBtn.dataset.clientId);
                }
                return;
            }
            const clientItem = e.target.closest('.client-item');
            if (clientItem) {
                const prevSelected = this.elements.clientList.querySelector('.client-item.bg-blue-100, .client-item.dark\\:bg-blue-900\\/50');
                if (prevSelected) {
                    prevSelected.classList.remove('bg-blue-100', 'border-blue-400', 'dark:bg-blue-900/50', 'dark:border-blue-500');
                }
                clientItem.classList.add('bg-blue-100', 'border-blue-400', 'dark:bg-blue-900/50', 'dark:border-blue-500');
                this.app.data.selectedClientId = clientItem.dataset.id;
                this.app.bicicletasManager.renderClientDetails();
            }
        });

        this.elements.editClientNome.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
        });

        this.elements.editClientCpf.addEventListener('input', (e) => {
            e.target.value = Utils.formatCPF(e.target.value);
        });
        this.elements.editClientTelefone.addEventListener('input', (e) => {
            e.target.value = Utils.formatTelefone(e.target.value);
        });
    }

    async handleAddClient(e) {
        e.preventDefault();

        try {
            Auth.requirePermission('clientes', 'adicionar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const formData = new FormData(this.elements.addClientForm);
        const nome = formData.get('nome');
        const cpf = formData.get('cpf');
        const telefone = formData.get('telefone');

        this.elements.cpfError.classList.add('hidden');
        this.elements.cpfInput.classList.remove('border-red-500');

        if (!Utils.validateCPF(cpf)) {
            this.elements.cpfError.textContent = 'CPF inválido.';
            this.elements.cpfError.classList.remove('hidden');
            this.elements.cpfInput.classList.add('border-red-500');
            return;
        }

        if (this.app.data.clients.some(c => c.cpf === cpf)) {
            this.elements.cpfError.textContent = 'CPF já cadastrado.';
            this.elements.cpfError.classList.remove('hidden');
            this.elements.cpfInput.classList.add('border-red-500');
            return;
        }

        const categoria = formData.get('categoria') || '';
        const newClient = {
            id: Utils.generateUUID(),
            nome,
            cpf,
            telefone,
            categoria,
            dataCadastro: new Date().toISOString(),
            comentarios: [],
            bicicletas: []
        };
        this.app.data.clients.push(newClient);
        try {
            await Storage.saveClient(newClient);
        } catch (saveError) {
            console.error('Erro ao salvar cliente:', saveError);
            this.app.data.clients.pop();
            Modals.alert('Erro ao salvar o cliente. Verifique o espaço disponível.', 'Erro');
            return;
        }

        logAction('create', 'cliente', newClient.id, { nome, cpf, telefone, categoria });

        this.renderClientList();
        this.elements.addClientForm.reset();

        // Toast de confirmação
        this._showSaveToast(nome);

        // Automação: Focar novamente no Nome Completo após salvar
        const nomeInput = document.getElementById('nome');
        if (nomeInput) {
            nomeInput.focus();
            const card = nomeInput.closest('.bg-white, .dark\\\\:bg-slate-800');
            if (card) card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        if (this.app.configuracaoManager) {
            this.app.configuracaoManager.renderCategoriasStats();
        }
    }

    _showSaveToast(nome) {
        // Remove toast anterior se existir
        document.getElementById('client-save-toast')?.remove();

        const isDark = document.documentElement.classList.contains('dark');
        const toast = document.createElement('div');
        toast.id = 'client-save-toast';
        toast.style.cssText = `
            position: fixed;
            bottom: 28px;
            left: 50%;
            transform: translateX(-50%) translateY(20px);
            z-index: 9999;
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            border-radius: 50px;
            background: ${isDark ? '#1e293b' : '#ffffff'};
            color: ${isDark ? '#f1f5f9' : '#1e293b'};
            border: 1px solid ${isDark ? '#334155' : '#e2e8f0'};
            box-shadow: 0 12px 40px rgba(0,0,0,${isDark ? '0.5' : '0.15'});
            font-size: 13px;
            font-weight: 600;
            opacity: 0;
            transition: opacity 0.3s ease, transform 0.3s cubic-bezier(.16,1,.3,1);
            white-space: nowrap;
            max-width: 90vw;
        `;
        toast.innerHTML = `
            <div style="width:22px;height:22px;border-radius:50%;background:var(--color-success,#16a34a);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <span>Cliente <strong>${nome}</strong> salvo com sucesso!</span>
        `;
        document.body.appendChild(toast);

        // Animar entrada
        requestAnimationFrame(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
        });

        // Remover após 3s
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(-50%) translateY(12px)';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }


    renderClientList(filter = '', limit = null) {
        const lowercasedFilter = filter.toLowerCase();
        const numericFilter = filter.replace(/\D/g, '');

        const filteredClients = this.app.data.clients.filter(client => {
            const nome = client.nome.toLowerCase();
            const cpf = client.cpf.replace(/\D/g, '');
            const telefone = client.telefone.replace(/\D/g, '');

            const matchesName = nome.includes(lowercasedFilter);
            const matchesCPF = numericFilter.length > 0 && cpf.includes(numericFilter);
            const matchesTelefone = numericFilter.length > 0 && telefone.includes(numericFilter);

            // Busca Global (Otimizada: evita `toLowerCase()` on the fly para todos usando cache ou check rápido)
            let matchesBike = false;
            if (lowercasedFilter.length > 2 && client.bicicletas) {
                matchesBike = client.bicicletas.some(bike => {
                    const m = (bike.modelo || '').toLowerCase();
                    const mc = (bike.marca || '').toLowerCase();
                    return m.includes(lowercasedFilter) || mc.includes(lowercasedFilter);
                });
            }

            return matchesName || matchesCPF || matchesTelefone || matchesBike;
        }).sort((a, b) => a.nome.localeCompare(b.nome));

        if (filteredClients.length === 0) {
            this.elements.clientList.innerHTML = `<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum cliente encontrado.</p>`;
            return;
        }

        // Aplica limite de renderização agressivo para computadores fracos
        // Sempre força um limite máximo, mesmo se a configuração falhar (Proteção de Memória)
        const useLimit = true; // Forçamos ativação do limitador de interface
        const safeLimit = PerformanceConfig.get('clientListLimit') || 50; // Menos injeções no DOM ao abrir
        const baseLimit = Math.min(safeLimit, 50); // Hardcap em 50 para start inicial instantâneo
        const currentLimit = limit !== null ? limit : baseLimit;

        const displayClients = filteredClients.slice(0, currentLimit);
        const hasMore = filteredClients.length > currentLimit;

        this.elements.clientList.innerHTML = displayClients.map(client => {
            let comentarios = client.comentarios || [];
            if (typeof comentarios === 'string') {
                try { comentarios = JSON.parse(comentarios); } catch (e) { comentarios = []; }
            }
            if (!Array.isArray(comentarios)) { comentarios = []; }
            const hasComments = comentarios.length > 0;
            const commentCount = comentarios.length;
            const categoryBadge = client.categoria ? `<span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">${client.categoria}</span>` : '';

            // Botão de Entrada Rápida
            const canAddRegistros = Auth.hasPermission('registros', 'adicionar');
            const quickAddBtn = (canAddRegistros && client.bicicletas && client.bicicletas.length > 0) ? `
                <button class="quick-entry-btn flex items-center justify-center w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-full cursor-pointer hover:bg-green-200 dark:hover:bg-green-800/50 transition-colors ml-2" data-client-id="${client.id}" title="Entrada Rápida">
                    <i data-lucide="play" class="w-4 h-4 text-green-600 dark:text-green-400 ml-0.5"></i>
                </button>
            ` : '';

            return `
            <div class="client-item p-3 rounded-lg border border-slate-200 hover:bg-slate-50 hover:border-blue-400 cursor-pointer transition-colors dark:border-slate-700 dark:hover:bg-slate-700/50 dark:hover:border-blue-500 ${this.app.data.selectedClientId === client.id ? 'bg-blue-100 border-blue-400 dark:bg-blue-900/50 dark:border-blue-500' : ''}" data-id="${client.id}">
                <div class="flex items-start justify-between">
                    <div class="flex-1">
                        <p class="font-semibold text-slate-800 dark:text-slate-100">${client.nome.replace(/^"|"$/g, '')}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatCPF(client.cpf)}${client.telefone ? ' • ' + Utils.formatTelefone(client.telefone) : ''}</p>
                        ${categoryBadge ? `<div class="mt-1">${categoryBadge}</div>` : ''}
                    </div>
                    ${hasComments ? `
                    <div class="relative group">
                        <div class="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full cursor-help">
                            <i data-lucide="message-circle" class="w-4 h-4 text-amber-600 dark:text-amber-400"></i>
                            <span class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">${commentCount}</span>
                        </div>
                    </div>
                    ` : ''}
                    ${quickAddBtn}
                </div>
            </div>
        `;
        }).join('');

        // Adiciona botão "Carregar mais" se houver mais itens
        if (hasMore) {
            const remaining = filteredClients.length - currentLimit;
            this.elements.clientList.innerHTML += `
                <div class="text-center py-4">
                    <button id="load-more-clients" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors">
                        Carregar mais (${remaining} restantes)
                    </button>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mt-2">Mostrando ${currentLimit} de ${filteredClients.length} clientes</p>
                </div>
            `;

            // Event listener para carregar mais
            const loadMoreBtn = document.getElementById('load-more-clients');
            if (loadMoreBtn) {
                loadMoreBtn.addEventListener('click', () => {
                    this.currentLimit += PerformanceConfig.get('clientListLimit');
                    this.renderClientList(filter, this.currentLimit);
                });
            }
        }

        lucide.createIcons({ nameAttr: 'data-lucide', attrs: {} });
    }

    openEditClientModal(clientId) {
        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return;

        this.elements.editClientId.value = client.id;
        this.elements.editClientNome.value = client.nome;
        this.elements.editClientCpf.value = Utils.formatCPF(client.cpf);
        this.elements.editClientTelefone.value = Utils.formatTelefone(client.telefone);
        this.elements.editCpfError.classList.add('hidden');
        this.elements.editClientCpf.classList.remove('border-red-500');

        if (this.app.configuracaoManager) {
            this.app.configuracaoManager.updateCategoryDropdowns();
        }

        const categoriaSelect = document.getElementById('edit-client-categoria');
        if (categoriaSelect && client.categoria) {
            categoriaSelect.value = client.categoria;
        }

        this.app.toggleModal('edit-client-modal', true);
    }

    async handleEditClient(e) {
        e.preventDefault();

        try {
            Auth.requirePermission('clientes', 'editar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const clientId = this.elements.editClientId.value;
        const nome = this.elements.editClientNome.value;
        const cpfFormatted = this.elements.editClientCpf.value;
        const cpf = cpfFormatted.replace(/\D/g, '');
        const telefone = this.elements.editClientTelefone.value;

        this.elements.editCpfError.classList.add('hidden');
        this.elements.editClientCpf.classList.remove('border-red-500');

        if (!Utils.validateCPF(cpf)) {
            this.elements.editCpfError.textContent = 'CPF inválido.';
            this.elements.editCpfError.classList.remove('hidden');
            this.elements.editClientCpf.classList.add('border-red-500');
            return;
        }

        const cpfExists = this.app.data.clients.some(c => c.id !== clientId && c.cpf.replace(/\D/g, '') === cpf);
        if (cpfExists) {
            this.elements.editCpfError.textContent = 'CPF já cadastrado para outro cliente.';
            this.elements.editCpfError.classList.remove('hidden');
            this.elements.editClientCpf.classList.add('border-red-500');
            return;
        }

        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client) {
            const categoriaSelect = document.getElementById('edit-client-categoria');
            const categoria = categoriaSelect ? categoriaSelect.value : (client.categoria || '');

            const oldData = { nome: client.nome, cpf: client.cpf, telefone: client.telefone, categoria: client.categoria };
            client.nome = nome;
            client.cpf = cpf;
            client.telefone = telefone;
            client.categoria = categoria;
            if (!client.comentarios) client.comentarios = [];

            await Storage.saveClient(client);

            logAction('edit', 'cliente', clientId, {
                nome,
                cpf,
                telefone,
                categoria,
                changes: { before: oldData, after: { nome, cpf, telefone, categoria } }
            });

            this.renderClientList(this.elements.searchInput.value);
            this.app.bicicletasManager.renderClientDetails();
            this.app.toggleModal('edit-client-modal', false);

            if (this.app.configuracaoManager) {
                this.app.configuracaoManager.renderCategoriasStats();
            }
        }
    }

    _updateCommentBadge(clientId, count) {
        const item = this.elements.clientList.querySelector(`.client-item[data-id="${clientId}"]`);
        if (!item) return;
        const wrapper = item.querySelector('.flex.items-start');
        if (!wrapper) return;
        const badgeContainer = item.querySelector('.relative.group');
        if (count > 0) {
            if (badgeContainer) {
                const counter = badgeContainer.querySelector('.bg-amber-500');
                if (counter) counter.textContent = count;
            } else {
                const newBadge = document.createElement('div');
                newBadge.className = 'relative group';
                newBadge.innerHTML = `
                    <div class="flex items-center justify-center w-8 h-8 bg-amber-100 dark:bg-amber-900/30 rounded-full cursor-help">
                        <i data-lucide="message-circle" class="w-4 h-4 text-amber-600 dark:text-amber-400"></i>
                        <span class="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-amber-500 rounded-full">${count}</span>
                    </div>
                `;
                const quickBtn = wrapper.querySelector('.quick-entry-btn');
                if (quickBtn) {
                    wrapper.insertBefore(newBadge, quickBtn);
                } else {
                    wrapper.appendChild(newBadge);
                }
                lucide.createIcons({ nameAttr: 'data-lucide', attrs: {} });
            }
        } else if (badgeContainer) {
            badgeContainer.remove();
        }
    }

    async addComment(clientId, comentario) {
        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client) {
            if (!client.comentarios) client.comentarios = [];
            const currentSession = Auth.getCurrentSession();
            const newComment = {
                id: Utils.generateUUID(),
                usuario: currentSession?.username || 'Anônimo',
                data: new Date().toISOString(),
                texto: comentario
            };
            client.comentarios.push(newComment);
            await Storage.saveClient(client);

            logAction('add_comment', 'cliente', clientId, {
                comentario,
                usuario: currentSession?.username || 'Anônimo'
            });

            this._updateCommentBadge(clientId, client.comentarios.length);
            this.app.bicicletasManager.renderClientDetails();
        }
    }

    async deleteComment(clientId, commentId) {
        const client = this.app.data.clients.find(c => c.id === clientId);
        if (client && client.comentarios) {
            client.comentarios = client.comentarios.filter(c => c.id !== commentId);
            await Storage.saveClient(client);

            logAction('delete_comment', 'cliente', clientId, { commentId });

            this._updateCommentBadge(clientId, client.comentarios.length);
            this.app.bicicletasManager.renderClientDetails();
        }
    }

    applyPermissionsToUI() {
        const canAdd = Auth.hasPermission('clientes', 'adicionar');
        const canEdit = Auth.hasPermission('clientes', 'editar');
        const canDelete = Auth.hasPermission('clientes', 'excluir');

        const addClientForm = this.elements.addClientForm;
        if (addClientForm) {
            const addClientSection = addClientForm.closest('.bg-white, .dark\\:bg-slate-800');
            if (addClientSection) {
                addClientSection.style.display = canAdd ? '' : 'none';
            }
        }

        document.querySelectorAll('.edit-client-btn, #edit-client-btn').forEach(btn => {
            btn.style.display = canEdit ? '' : 'none';
        });

        document.querySelectorAll('.edit-bike-btn').forEach(btn => {
            btn.style.display = canEdit ? '' : 'none';
        });

        document.querySelectorAll('.delete-client-btn').forEach(btn => {
            btn.style.display = canDelete ? '' : 'none';
        });

        document.querySelectorAll('.delete-bike-btn').forEach(btn => {
            btn.style.display = canDelete ? '' : 'none';
        });

        const addBikeBtn = document.getElementById('add-bike-to-client-btn');
        if (addBikeBtn) {
            addBikeBtn.style.display = canEdit ? '' : 'none';
        }
    }
}
