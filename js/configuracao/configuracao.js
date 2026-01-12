import { Storage } from '../shared/storage.js';
import { Utils } from '../shared/utils.js';
import { Modals } from '../shared/modals.js';
import { Auth } from '../shared/auth.js';
import { notificationManager } from '../shared/notifications.js';
import { getJobMonitor } from '../shared/job-monitor.js';
import { logAction } from '../shared/audit-logger.js';

export class ConfiguracaoManager {
    // Constants for backup settings validation
    static BACKUP_MAX_COUNT_MIN = 1;
    static BACKUP_MAX_COUNT_MAX = 50;
    static BACKUP_MAX_COUNT_DEFAULT = 10;

    emojiToIconMap = {
        '👤': 'user',
        '🏢': 'building',
        '🍽️': 'utensils',
        '💪': 'dumbbell',
        '👨': 'user',
        '🏪': 'store',
        '⚙️': 'settings',
        '🎯': 'target',
        '📱': 'smartphone',
        '📊': 'bar-chart',
        '🔧': 'wrench',
        '🎨': 'palette',
        '⭐': 'star',
        '📦': 'package',
        '🚀': 'rocket',
        '🛍️': 'shopping-bag',
        '☕': 'coffee'
    };

    sanitizeCategory(value) {
        if (typeof value !== 'string') return value;
        let sanitized = value.trim();
        sanitized = sanitized.replace(/^["']+|["']+$/g, '');
        sanitized = sanitized.replace(/["']/g, '');
        return sanitized.trim();
    }

    escapeHtmlAttr(str) {
        if (typeof str !== 'string') return str;
        return str.replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    constructor(app) {
        this.app = app;
        this.elements = {
            themeRadios: document.querySelectorAll('input[name="theme"]'),
            globalSearch: document.getElementById('global-search'),
            globalSearchResults: document.getElementById('global-search-results'),
            importFile: document.getElementById('import-file'),
            importBtn: document.getElementById('import-btn'),
            importStatus: document.getElementById('import-status'),
            exportExcelBtn: document.getElementById('export-excel-btn'),
            exportCsvBtn: document.getElementById('export-csv-config-btn'),
            exportDataInicio: document.getElementById('export-data-inicio'),
            exportDataFim: document.getElementById('export-data-fim'),
            exportSystemExcelBtn: document.getElementById('export-system-excel-btn'),
            exportSystemCsvBtn: document.getElementById('export-system-csv-btn'),
            exportSystemDataInicio: document.getElementById('export-system-data-inicio'),
            exportSystemDataFim: document.getElementById('export-system-data-fim'),
            importSystemFile: document.getElementById('import-system-file'),
            importSystemBtn: document.getElementById('import-system-btn'),
            importSystemStatus: document.getElementById('import-system-status'),
            historicoOrganizado: document.getElementById('historico-organizado'),
            historicoSummary: document.getElementById('historico-summary'),
        };
        this.expandedYears = new Set();
        this.expandedMonths = new Set();
        this.init();
    }

    async init() {
        await this.cleanupCategoriesWithQuotes();
        this.addEventListeners();
        this.setupSystemThemeListener();
        this.loadThemePreference();
        this.renderHistoricoOrganizado();
        this.setupNotificationSettings();
        this.setupJobMonitorCallbacks();
        
        // Pequeno atraso para garantir que o Storage carregou tudo
        setTimeout(() => {
            this.renderCategorias();
        }, 100);
        
        // Carregar gerenciamento de backups
        this.loadBackupManagement();
    }

    async cleanupCategoriesWithQuotes() {
        const categorias = Storage.loadCategorias();
        const clientes = Storage.loadClientsSync();
        let categoriasChanged = false;
        let clientesChanged = false;
        
        const newCategorias = {};
        Object.entries(categorias).forEach(([nome, emoji]) => {
            const cleanName = this.sanitizeCategory(nome);
            if (cleanName && cleanName !== nome) {
                newCategorias[cleanName] = emoji;
                categoriasChanged = true;
            } else if (cleanName) {
                newCategorias[cleanName] = emoji;
            }
        });
        
        if (categoriasChanged) {
            Storage.saveCategorias(newCategorias);
        }
        
        const updatedClientes = clientes.map(cliente => {
            let updatedClient = { ...cliente };
            let changed = false;
            
            if (cliente.nome) {
                const cleanNome = this.sanitizeCategory(cliente.nome);
                if (cleanNome !== cliente.nome) {
                    updatedClient.nome = cleanNome;
                    changed = true;
                }
            }
            
            if (cliente.categoria) {
                const cleanCategoria = this.sanitizeCategory(cliente.categoria);
                if (cleanCategoria !== cliente.categoria) {
                    updatedClient.categoria = cleanCategoria;
                    changed = true;
                }
            }
            
            if (changed) {
                clientesChanged = true;
                return updatedClient;
            }
            return cliente;
        });
        
        if (clientesChanged) {
            await Storage.saveClients(updatedClientes, true);
            if (this.app && this.app.data) {
                this.app.data.clients = updatedClientes;
            }
        }
    }

    loadThemePreference() {
        const savedTheme = localStorage.getItem('themePreference') || 'system';
        
        setTimeout(() => {
            const allRadios = document.querySelectorAll('input[name="theme"]');
            allRadios.forEach(radio => {
                radio.checked = radio.value === savedTheme;
            });
            
            this.updateThemeLabels(savedTheme);
            this.applyTheme(savedTheme);
        }, 100);
    }

    setupSystemThemeListener() {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            const currentPreference = localStorage.getItem('themePreference');
            if (currentPreference === 'system') {
                this.applyTheme(e.matches ? 'dark' : 'light');
            }
        });
    }

    addEventListeners() {
        setTimeout(() => {
            document.querySelectorAll('input[name="theme"]').forEach(radio => {
                radio.addEventListener('change', (e) => {
                    this.handleThemeChange(e.target.value);
                });
            });
        }, 50);

        this.elements.globalSearch.addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase();
            this.handleGlobalSearch(e.target.value);
        });

        this.elements.importFile.addEventListener('change', (e) => {
            this.elements.importBtn.disabled = !e.target.files.length;
        });

        this.elements.importBtn.addEventListener('click', () => this.handleImport());
        this.elements.exportExcelBtn.addEventListener('click', () => this.exportToExcel());
        this.elements.exportCsvBtn.addEventListener('click', () => this.exportToCSV());

        if (this.elements.importSystemFile) {
            this.elements.importSystemFile.addEventListener('change', (e) => {
                this.elements.importSystemBtn.disabled = !e.target.files.length;
            });
        }

        if (this.elements.importSystemBtn) {
            this.elements.importSystemBtn.addEventListener('click', () => this.handleSystemImport());
        }
        
        if (this.elements.exportSystemExcelBtn) {
            this.elements.exportSystemExcelBtn.addEventListener('click', () => this.exportSystemToExcel());
        }
        
        if (this.elements.exportSystemCsvBtn) {
            this.elements.exportSystemCsvBtn.addEventListener('click', () => this.exportSystemToCSV());
        }

        const customThemeBtn = document.getElementById('custom-theme-btn');
        if (customThemeBtn) {
            customThemeBtn.addEventListener('click', () => this.openCustomThemeModal());
        }

        const addCategoriaBtn = document.getElementById('add-categoria-btn');
        const novaCategoriaInput = document.getElementById('nova-categoria');
        
        if (addCategoriaBtn) {
            addCategoriaBtn.addEventListener('click', () => this.addCategoria());
        }
        
        if (novaCategoriaInput) {
            novaCategoriaInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addCategoria();
                }
            });
        }
    }

    getIconForEmoji(emoji) {
        return this.emojiToIconMap[emoji] || 'circle';
    }

    renderCategorias() {
        const categoriasList = document.getElementById('categorias-list');
        if (!categoriasList) return;

        let categorias = Storage.loadCategorias();
        
        // Garantir que categorias seja um objeto válido
        if (!categorias || typeof categorias !== 'object' || Array.isArray(categorias)) {
            console.error('Categorias inválidas carregadas:', categorias);
            categorias = {};
        }
        
        const entries = Object.entries(categorias);
        if (entries.length === 0) {
            categoriasList.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhuma categoria cadastrada</p>';
            this.renderCategoriasStats();
            return;
        }

        categoriasList.innerHTML = entries.map(([nome, emoji]) => {
            const iconName = this.getIconForEmoji(emoji);
            const escapedNome = this.escapeHtmlAttr(nome);
            return `
            <div class="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                <div class="flex items-center gap-2">
                    <i data-lucide="${iconName}" class="w-5 h-5 text-slate-700 dark:text-slate-300"></i>
                    <span class="text-sm font-medium text-slate-800 dark:text-slate-200">${nome}</span>
                </div>
                <div class="flex gap-2">
                    <button class="edit-categoria-btn text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors" data-categoria="${escapedNome}">
                        <i data-lucide="pencil" class="w-4 h-4"></i>
                    </button>
                    <button class="delete-categoria-btn text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors" data-categoria="${escapedNome}">
                        <i data-lucide="x" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>
        `;
        }).join('');

        lucide.createIcons();

        categoriasList.querySelectorAll('.edit-categoria-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoria = btn.dataset.categoria;
                this.editCategoria(categoria);
            });
        });

        categoriasList.querySelectorAll('.delete-categoria-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const categoria = btn.dataset.categoria;
                this.deleteCategoria(categoria);
            });
        });

        this.updateCategoryDropdowns();
        this.renderCategoriasStats();
    }

    renderCategoriasStats() {
        const statsContainer = document.getElementById('categorias-stats');
        if (!statsContainer) return;

        let categorias = Storage.loadCategorias();
        
        // Garantir que categorias seja um objeto válido
        if (!categorias || typeof categorias !== 'object' || Array.isArray(categorias)) {
            categorias = {};
        }

        const clientes = Storage.loadClientsSync();
        
        const categoriaCounts = {};
        Object.keys(categorias).forEach(categoria => {
            categoriaCounts[categoria] = 0;
        });
        
        let semCategoria = 0;
        
        Object.values(clientes).forEach(cliente => {
            const categoria = cliente.categoria || '';
            if (categoria && categoria in categoriaCounts) {
                categoriaCounts[categoria]++;
            } else {
                semCategoria++;
            }
        });

        const totalClientes = Object.keys(clientes).length;

        if (totalClientes === 0) {
            statsContainer.innerHTML = `
                <div class="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                    <i data-lucide="info" class="w-4 h-4"></i>
                    <span>Nenhum cliente cadastrado</span>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        let statsHTML = '';
        let semCategoriaHTML = '';
        
        if (Object.keys(categorias).length > 0) {
            statsHTML = Object.entries(categoriaCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([nome, count]) => {
                    const emoji = categorias[nome];
                    const iconName = this.getIconForEmoji(emoji);
                    const percentual = totalClientes > 0 ? ((count / totalClientes) * 100).toFixed(1) : '0.0';
                    const escapedNome = this.escapeHtmlAttr(nome);
                    return `
                        <div class="categoria-stats-row flex items-center justify-between p-2 -mx-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" data-categoria="${escapedNome}">
                            <div class="flex items-center gap-2">
                                <i data-lucide="${iconName}" class="w-4 h-4 text-slate-700 dark:text-slate-300"></i>
                                <span class="text-sm font-medium text-slate-700 dark:text-slate-300">${nome}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="text-sm font-semibold text-blue-600 dark:text-blue-400">${count}</span>
                                <span class="text-xs text-slate-500 dark:text-slate-500">(${percentual}%)</span>
                            </div>
                        </div>
                    `;
                })
                .join('');

            const semCategoriaPercentual = totalClientes > 0 ? ((semCategoria / totalClientes) * 100).toFixed(1) : '0.0';
            semCategoriaHTML = `
                <div class="categoria-stats-row flex items-center justify-between p-2 -mx-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors pt-2 mt-2 border-t border-slate-300 dark:border-slate-600" data-categoria="">
                    <div class="flex items-center gap-2">
                        <i data-lucide="settings" class="w-4 h-4 text-slate-700 dark:text-slate-300"></i>
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Sem categoria</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">${semCategoria}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-500">(${semCategoriaPercentual}%)</span>
                    </div>
                </div>
            `;
        } else {
            semCategoriaHTML = `
                <div class="categoria-stats-row flex items-center justify-between p-2 -mx-2 rounded-lg cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors" data-categoria="">
                    <div class="flex items-center gap-2">
                        <i data-lucide="settings" class="w-4 h-4 text-slate-700 dark:text-slate-300"></i>
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-300">Sem categoria</span>
                    </div>
                    <div class="flex items-center gap-2">
                        <span class="text-sm font-semibold text-slate-600 dark:text-slate-400">${semCategoria}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-500">(100.0%)</span>
                    </div>
                </div>
            `;
        }

        statsContainer.innerHTML = `
            <div class="space-y-2">
                ${statsHTML}
                ${semCategoriaHTML}
            </div>
        `;
        
        lucide.createIcons();

        statsContainer.querySelectorAll('.categoria-stats-row').forEach(row => {
            row.addEventListener('click', () => {
                const categoria = row.dataset.categoria;
                this.showClientsByCategory(categoria);
            });
        });
    }

    showClientsByCategory(categoria) {
        const clientes = Storage.loadClientsSync();
        let categorias = Storage.loadCategorias();
        
        if (!categorias || typeof categorias !== 'object' || Array.isArray(categorias)) {
            categorias = {};
        }
        
        const clientesFiltrados = clientes.filter(cliente => {
            const clienteCategoria = cliente.categoria || '';
            if (categoria === '') {
                return !clienteCategoria || !(clienteCategoria in categorias);
            }
            return clienteCategoria === categoria;
        });

        const titulo = categoria ? `Clientes: ${categoria}` : 'Clientes: Sem Categoria';
        const iconName = categoria ? this.getIconForEmoji(categorias[categoria]) : 'settings';
        
        let listaHTML = '';
        
        if (clientesFiltrados.length === 0) {
            listaHTML = `
                <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                    <i data-lucide="users" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>Nenhum cliente nesta categoria</p>
                </div>
            `;
        } else {
            listaHTML = `
                <div class="space-y-2 max-h-[400px] overflow-y-auto">
                    ${clientesFiltrados.map(cliente => `
                        <div class="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30">
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">${cliente.nome}</p>
                                <p class="text-xs text-slate-500 dark:text-slate-400">${Utils.formatCPF(cliente.cpf)} • ${Utils.formatTelefone(cliente.telefone)}</p>
                            </div>
                            <button class="edit-client-categoria-btn p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" data-client-id="${cliente.id}" title="Editar cliente">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            `;
        }

        const content = `
            <div class="space-y-4">
                <div class="flex items-center gap-3 pb-3 border-b border-slate-200 dark:border-slate-700">
                    <div class="flex items-center justify-center w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                        <i data-lucide="${iconName}" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
                    </div>
                    <div>
                        <p class="text-lg font-semibold text-slate-800 dark:text-slate-200">${categoria || 'Sem Categoria'}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">${clientesFiltrados.length} cliente${clientesFiltrados.length !== 1 ? 's' : ''}</p>
                    </div>
                </div>
                ${listaHTML}
                <div class="flex justify-end pt-3 border-t border-slate-200 dark:border-slate-700">
                    <button type="button" id="close-clients-categoria-btn" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg transition-colors">Fechar</button>
                </div>
            </div>
        `;

        Modals.show(titulo, content);

        const self = this;
        setTimeout(() => {
            lucide.createIcons();

            document.querySelectorAll('.edit-client-categoria-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    const clientId = btn.getAttribute('data-client-id');
                    if (!clientId) return;
                    
                    Modals.close();
                    setTimeout(() => {
                        if (self.app && self.app.clientesManager) {
                            self.app.clientesManager.openEditClientModal(clientId);
                        }
                    }, 350);
                });
            });

            const closeBtn = document.getElementById('close-clients-categoria-btn');
            if (closeBtn) {
                closeBtn.addEventListener('click', () => Modals.close());
            }
        }, 50);
    }

    async addCategoria() {
        const input = document.getElementById('nova-categoria');
        const categoria = input.value.trim().toUpperCase();

        if (!categoria) {
            Modals.alert('Por favor, digite um nome para a categoria.', 'Campo vazio');
            return;
        }

        const categorias = Storage.loadCategorias();
        
        if (categoria in categorias) {
            Modals.alert('Esta categoria já existe.', 'Categoria duplicada');
            return;
        }

        const emoji = Storage.getDefaultEmoji(categoria);
        categorias[categoria] = emoji;
        await Storage.saveCategorias(categorias);
        input.value = '';
        this.renderCategorias();
    }

    deleteCategoria(categoria) {
        Modals.confirm(
            `Tem certeza que deseja remover a categoria "${categoria}"?`,
            'Confirmar Remoção',
            async () => {
                let categorias = Storage.loadCategorias();
                delete categorias[categoria];
                await Storage.saveCategorias(categorias);
                this.renderCategorias();
            }
        );
    }

    async editCategoria(categoria) {
        const categorias = Storage.loadCategorias();
        const emojiAtual = categorias[categoria];
        
        const iconOptions = [
            { icon: 'user', emoji: '👨' },
            { icon: 'building', emoji: '🏢' },
            { icon: 'utensils', emoji: '🍽️' },
            { icon: 'briefcase', emoji: '💼' },
            { icon: 'settings', emoji: '⚙️' },
            { icon: 'target', emoji: '🎯' },
            { icon: 'smartphone', emoji: '📱' },
            { icon: 'bar-chart', emoji: '📊' },
            { icon: 'wrench', emoji: '🔧' },
            { icon: 'palette', emoji: '🎨' },
            { icon: 'star', emoji: '⭐' },
            { icon: 'package', emoji: '📦' },
            { icon: 'rocket', emoji: '🚀' },
            { icon: 'shopping-bag', emoji: '🛍️' },
            { icon: 'coffee', emoji: '☕' }
        ];
        
        const content = `
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Nome da Categoria</label>
                    <input type="text" id="edit-cat-nome" value="${categoria}" class="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent" maxlength="30">
                </div>
                
                <div>
                    <label class="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Selecione um Ícone</label>
                    <div class="grid grid-cols-5 gap-2">
                        ${iconOptions.map(option => `
                            <button type="button" class="icon-option p-3 rounded-lg border-2 transition-all ${option.emoji === emojiAtual ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30' : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30'} hover:border-blue-500 flex items-center justify-center" data-emoji="${option.emoji}" data-icon="${option.icon}">
                                <i data-lucide="${option.icon}" class="w-6 h-6 text-slate-700 dark:text-slate-300"></i>
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div class="flex gap-2 justify-end pt-4">
                    <button type="button" id="cancel-edit-cat" class="px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">Cancelar</button>
                    <button type="button" id="save-edit-cat" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">Salvar</button>
                </div>
            </div>
        `;
        
        Modals.show('Editar Categoria', content);
        
        setTimeout(() => {
            lucide.createIcons();
        }, 0);
        
        let emojiSelecionado = emojiAtual;
        
        document.querySelectorAll('.icon-option').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.icon-option').forEach(b => b.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/30'));
                btn.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/30');
                emojiSelecionado = btn.dataset.emoji;
            });
        });
        
        document.getElementById('cancel-edit-cat').addEventListener('click', () => {
            Modals.close();
        });
        
        document.getElementById('save-edit-cat').addEventListener('click', async () => {
            const novoNome = document.getElementById('edit-cat-nome').value.trim().toUpperCase();
            
            if (!novoNome) {
                Modals.alert('Por favor, digite um nome para a categoria.', 'Campo vazio');
                return;
            }
            
            if (novoNome !== categoria && novoNome in categorias) {
                Modals.alert('Uma categoria com este nome já existe.', 'Categoria duplicada');
                return;
            }
            
            if (novoNome !== categoria) {
                delete categorias[categoria];
            }
            
            categorias[novoNome] = emojiSelecionado;
            await Storage.saveCategorias(categorias);
            Modals.close();
            this.renderCategorias();
        });
    }

    updateCategoryDropdowns() {
        const categorias = Storage.loadCategorias();
        const selectIds = ['categoria', 'edit-client-categoria', 'registro-categoria', 'edit-registro-categoria'];

        selectIds.forEach(id => {
            const select = document.getElementById(id);
            if (select) {
                const currentValue = select.value;
                select.innerHTML = '<option value="">Selecione uma categoria (opcional)</option>' +
                    Object.entries(categorias).map(([nome, emoji]) => `<option value="${nome}">${emoji} ${nome}</option>`).join('');
                if (currentValue && currentValue in categorias) {
                    select.value = currentValue;
                }
            }
        });
        
        this.updateCustomDropdowns(categorias);
    }

    updateCustomDropdowns(categorias) {
        const dropdownConfigs = [
            { id: 'categoria-dropdown', windowKey: 'categoriaDropdown' },
            { id: 'registro-categoria-dropdown', windowKey: 'registroCategoriaDropdown' },
            { id: 'edit-client-categoria-dropdown', windowKey: 'editClientCategoriaDropdown' },
            { id: 'edit-registro-categoria-dropdown', windowKey: 'editRegistroCategoriaDropdown' }
        ];

        dropdownConfigs.forEach(config => {
            const dropdown = document.getElementById(config.id);
            if (!dropdown) return;

            const menu = dropdown.querySelector('.dropdown-menu');
            if (!menu) return;

            menu.innerHTML = '<div class="dropdown-option" data-value=""><i data-lucide="settings" class="w-4 h-4 inline mr-2"></i>Selecione uma categoria (opcional)</div>' +
                Object.entries(categorias).map(([nome, emoji]) => {
                    const iconName = this.getIconForEmoji(emoji);
                    return `
                    <div class="dropdown-option" data-value="${nome}">
                        <i data-lucide="${iconName}" class="w-4 h-4 inline mr-2"></i>${nome}
                    </div>
                `;
                }).join('');

            setTimeout(() => {
                lucide.createIcons();
                if (window[config.windowKey]) {
                    window[config.windowKey].init();
                }
            }, 0);
        });
    }

    updateThemeLabels(selectedTheme) {
        document.querySelectorAll('input[name="theme"]').forEach(radio => {
            const label = radio.closest('label');
            if (radio.value === selectedTheme) {
                label.classList.add('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-500', 'dark:border-blue-400');
                label.classList.remove('border-slate-200', 'dark:border-slate-600');
            } else {
                label.classList.remove('bg-blue-50', 'dark:bg-blue-900/30', 'border-blue-500', 'dark:border-blue-400');
                label.classList.add('border-slate-200', 'dark:border-slate-600');
            }
        });
    }

    handleThemeChange(theme) {
        this.applyTheme(theme);
        this.updateThemeLabels(theme);
    }

    applyTheme(theme) {
        const htmlElement = document.documentElement;
        
        // Sempre salvar a preferência do usuário
        localStorage.setItem('themePreference', theme);
        
        // Determinar o tema real a ser aplicado
        let realTheme = theme;
        if (theme === 'system') {
            realTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        // Aplicar classe dark apenas se for dark
        if (realTheme === 'dark') {
            htmlElement.classList.add('dark');
        } else {
            htmlElement.classList.remove('dark');
        }

        // Aplica cores customizadas do usuário atual se existirem
        const session = Auth.getCurrentSession();
        const username = session ? session.username : null;
        const storageKey = username ? `customThemeColors_${username}` : 'customThemeColors';
        
        const customColors = JSON.parse(localStorage.getItem(storageKey) || '{}');
        if (customColors.primary) {
            document.documentElement.style.setProperty('--color-primary', customColors.primary);
        }
        if (customColors.secondary) {
            document.documentElement.style.setProperty('--color-secondary', customColors.secondary);
        }
        if (customColors.accent) {
            document.documentElement.style.setProperty('--color-accent', customColors.accent);
        }
    }

    openCustomThemeModal() {
        const session = Auth.getCurrentSession();
        const username = session ? session.username : null;
        const storageKey = username ? `customThemeColors_${username}` : 'customThemeColors';
        
        const customColors = JSON.parse(localStorage.getItem(storageKey) || '{}');
        
        const themes = [
            { name: 'Padrão (Slate)', primary: '#2563eb', secondary: '#1e40af', accent: '#0ea5e9' },
            { name: 'Oceano', primary: '#0891b2', secondary: '#0369a1', accent: '#06b6d4' },
            { name: 'Floresta', primary: '#16a34a', secondary: '#15803d', accent: '#22c55e' },
            { name: 'Pôr do Sol', primary: '#ea580c', secondary: '#c2410c', accent: '#f97316' },
            { name: 'Ametista', primary: '#a855f7', secondary: '#9333ea', accent: '#d946ef' }
        ];

        const content = `
            <div class="space-y-6">
                <div>
                    <p class="text-sm font-medium text-slate-100 mb-4">Temas Pré-prontos</p>
                    <div class="space-y-2">
                        ${themes.map(t => `
                            <button type="button" class="preset-theme-btn w-full flex items-center gap-4 p-3 rounded-lg border border-slate-600 hover:border-slate-500 hover:bg-slate-700/50 dark:hover:bg-slate-700/50 transition-all text-left" data-primary="${t.primary}" data-secondary="${t.secondary}" data-accent="${t.accent}">
                                <div class="flex gap-2">
                                    <div class="w-6 h-6 rounded" style="background-color: ${t.primary}"></div>
                                    <div class="w-6 h-6 rounded" style="background-color: ${t.secondary}"></div>
                                    <div class="w-6 h-6 rounded" style="background-color: ${t.accent}"></div>
                                </div>
                                <span class="text-sm font-medium text-slate-100 flex-1">${t.name}</span>
                            </button>
                        `).join('')}
                    </div>
                </div>

                <div class="pt-4 border-t border-slate-600">
                    <p class="text-sm font-medium text-slate-100 mb-4">Personalizar Cores</p>
                    <div class="space-y-3">
                        <div class="flex items-center justify-between">
                            <label class="text-xs text-slate-300">Cor Primária</label>
                            <div class="flex items-center gap-2">
                                <input type="color" id="primary-color-input" value="${customColors.primary || '#2563eb'}" class="w-10 h-8 p-1 rounded border border-slate-500 bg-slate-700 cursor-pointer">
                                <input type="text" id="primary-color-text" value="${customColors.primary || '#2563eb'}" class="w-20 px-2 py-1 text-xs rounded border border-slate-500 bg-slate-700 text-slate-100" readonly>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="text-xs text-slate-300">Cor Secundária</label>
                            <div class="flex items-center gap-2">
                                <input type="color" id="secondary-color-input" value="${customColors.secondary || '#1e40af'}" class="w-10 h-8 p-1 rounded border border-slate-500 bg-slate-700 cursor-pointer">
                                <input type="text" id="secondary-color-text" value="${customColors.secondary || '#1e40af'}" class="w-20 px-2 py-1 text-xs rounded border border-slate-500 bg-slate-700 text-slate-100" readonly>
                            </div>
                        </div>
                        <div class="flex items-center justify-between">
                            <label class="text-xs text-slate-300">Cor de Destaque</label>
                            <div class="flex items-center gap-2">
                                <input type="color" id="accent-color-input" value="${customColors.accent || '#0ea5e9'}" class="w-10 h-8 p-1 rounded border border-slate-500 bg-slate-700 cursor-pointer">
                                <input type="text" id="accent-color-text" value="${customColors.accent || '#0ea5e9'}" class="w-20 px-2 py-1 text-xs rounded border border-slate-500 bg-slate-700 text-slate-100" readonly>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex gap-3 pt-4">
                    <button type="button" id="cancel-theme-btn" class="flex-1 py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded font-medium transition-all">Cancelar</button>
                    <button type="button" id="save-theme-btn" class="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium shadow-lg shadow-blue-500/20 transition-all">Salvar Tema</button>
                </div>
            </div>
        `;

        Modals.show('Personalizar Tema', content);

        setTimeout(() => {
            const primaryInput = document.getElementById('primary-color-input');
            const primaryText = document.getElementById('primary-color-text');
            const secondaryInput = document.getElementById('secondary-color-input');
            const secondaryText = document.getElementById('secondary-color-text');
            const accentInput = document.getElementById('accent-color-input');
            const accentText = document.getElementById('accent-color-text');
            const saveBtn = document.getElementById('save-theme-btn');
            const cancelBtn = document.getElementById('cancel-theme-btn');
            const presetBtns = document.querySelectorAll('.preset-theme-btn');

            // Sincronizar color input com text input
            primaryInput.addEventListener('change', () => { primaryText.value = primaryInput.value; });
            secondaryInput.addEventListener('change', () => { secondaryText.value = secondaryInput.value; });
            accentInput.addEventListener('change', () => { accentText.value = accentInput.value; });

            const saveThemeColors = () => {
                const primary = primaryInput.value;
                const secondary = secondaryInput.value;
                const accent = accentInput.value;
                document.documentElement.style.setProperty('--color-primary', primary);
                document.documentElement.style.setProperty('--color-secondary', secondary);
                document.documentElement.style.setProperty('--color-accent', accent);
                
                const session = Auth.getCurrentSession();
                const username = session ? session.username : null;
                const key = username ? `customThemeColors_${username}` : 'customThemeColors';
                localStorage.setItem(key, JSON.stringify({ primary, secondary, accent }));
                
                Modals.close();
                Modals.alert('Tema salvo com sucesso!', 'Tema Atualizado');
            };

            saveBtn.addEventListener('click', saveThemeColors);
            cancelBtn.addEventListener('click', () => Modals.close());

            presetBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    primaryInput.value = btn.dataset.primary;
                    primaryText.value = btn.dataset.primary;
                    secondaryInput.value = btn.dataset.secondary;
                    secondaryText.value = btn.dataset.secondary;
                    accentInput.value = btn.dataset.accent;
                    accentText.value = btn.dataset.accent;
                });
            });
        }, 50);
    }

    handleGlobalSearch(query) {
        const resultsContainer = this.elements.globalSearchResults;
        
        if (!query.trim()) {
            resultsContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Digite para buscar clientes</p>';
            return;
        }

        const searchTerm = query.toLowerCase();
        const numericSearch = query.replace(/\D/g, '');
        
        const results = this.app.data.clients.filter(client => {
            const name = client.nome.toLowerCase();
            const cpf = client.cpf.replace(/\D/g, '');
            const telefone = client.telefone.replace(/\D/g, '');
            
            const matchesName = name.includes(searchTerm);
            const matchesCPF = numericSearch.length > 0 && cpf.includes(numericSearch);
            const matchesTelefone = numericSearch.length > 0 && telefone.includes(numericSearch);
            
            return matchesName || matchesCPF || matchesTelefone;
        });

        if (results.length === 0) {
            resultsContainer.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum cliente encontrado para "<span class="font-semibold">' + query + '</span>"</p>';
            return;
        }
        
        const resultCountMsg = `<p class="text-xs text-blue-600 dark:text-blue-400 font-medium mb-3">${results.length} cliente(s) encontrado(s)</p>`;

        resultsContainer.innerHTML = resultCountMsg + results.map(client => `
            <div class="p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <div class="cursor-pointer" data-client-id="${client.id}">
                    <p class="font-semibold text-slate-800 dark:text-slate-100">${client.nome}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatCPF(client.cpf)}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">${Utils.formatTelefone(client.telefone)}</p>
                </div>
                <div class="mt-2 pt-2 border-t border-slate-200 dark:border-slate-600 flex gap-2">
                    <button class="export-client-pdf-btn flex-1 px-3 py-1.5 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors flex items-center justify-center gap-1" data-client-id="${client.id}">
                        <i data-lucide="file-text" class="w-3 h-3"></i>
                        Exportar PDF
                    </button>
                    <button class="export-client-excel-btn flex-1 px-3 py-1.5 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center justify-center gap-1" data-client-id="${client.id}">
                        <i data-lucide="file-spreadsheet" class="w-3 h-3"></i>
                        Exportar Excel
                    </button>
                </div>
            </div>
        `).join('');

        resultsContainer.querySelectorAll('[data-client-id]').forEach(el => {
            if (!el.classList.contains('export-client-pdf-btn') && !el.classList.contains('export-client-excel-btn')) {
                el.addEventListener('click', () => {
                    const clientId = el.dataset.clientId;
                    this.app.data.selectedClientId = clientId;
                    this.app.switchTab('clientes');
                    this.app.clientesManager.renderClientDetails(clientId);
                });
            }
        });

        resultsContainer.querySelectorAll('.export-client-pdf-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const clientId = btn.dataset.clientId;
                this.exportClientRecordsToPDF(clientId);
            });
        });

        resultsContainer.querySelectorAll('.export-client-excel-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const clientId = btn.dataset.clientId;
                this.exportClientRecordsToExcel(clientId);
            });
        });

        lucide.createIcons();
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    showImportStatus(message, type, progress = null, current = null, total = null) {
        const statusEl = this.elements.importStatus;
        if (!statusEl) return;

        const colorClass = type === 'success' ? 'text-green-600 dark:text-green-400' :
            type === 'error' ? 'text-red-600 dark:text-red-400' :
            type === 'warning' ? 'text-yellow-600 dark:text-yellow-400' :
            'text-blue-600 dark:text-blue-400';

        const progressColorClass = type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-orange-500';

        if (progress !== null && progress >= 0 && progress <= 100) {
            const countDisplay = (current !== null && total !== null) 
                ? `<span class="text-orange-500 dark:text-orange-400 font-bold">${current}/${total}</span>` 
                : '';
            const progressDisplay = (current !== null && total !== null) 
                ? `${countDisplay} <span class="text-slate-500 dark:text-slate-400">(${progress}%)</span>`
                : `${progress}%`;
            
            statusEl.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <p class="${colorClass} font-medium">${message}</p>
                        <p class="text-sm font-medium">${progressDisplay}</p>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div class="${progressColorClass} h-3 rounded-full transition-all duration-300 ease-out" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        } else {
            statusEl.innerHTML = `<p class="${colorClass}">${message}</p>`;
        }
        
        statusEl.className = 'text-sm mt-2';
        statusEl.classList.remove('hidden');
    }

    async handleImport() {
        try {
            Auth.requirePermission('configuracao', 'importar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const file = this.elements.importFile.files[0];
        if (!file) return;

        const statusEl = this.elements.importStatus;
        statusEl.classList.remove('hidden');

        try {
            this.showImportStatus('Lendo arquivo...', 'info', 0);
            await this.delay(100);

            this.showImportStatus('Processando arquivo...', 'info', 20);
            await this.delay(100);
            const data = await this.readFile(file);

            this.showImportStatus('Analisando dados...', 'info', 40);
            await this.delay(100);

            this.showImportStatus('Importando clientes...', 'info', 60);
            await this.delay(100);
            const imported = this.processImportData(data);
            
            if (imported > 0) {
                const totalClients = this.app.data.clients.length;
                this.showImportStatus('Salvando clientes...', 'info', 80, 0, totalClients);
                await this.delay(100);
                await Storage.saveClients(this.app.data.clients, true, (current, total) => {
                    const progressPercent = 80 + Math.floor((current / total) * 10);
                    this.showImportStatus('Salvando clientes...', 'info', progressPercent, current, total);
                });

                this.showImportStatus('Atualizando lista...', 'info', 90);
                await this.delay(100);
                this.app.clientesManager.renderClientList();

                this.showImportStatus(`${imported} cliente(s) importado(s) com sucesso!`, 'success', 100);
                this.elements.importFile.value = '';
                this.elements.importBtn.disabled = true;
            } else {
                this.showImportStatus('Nenhum cliente válido encontrado no arquivo.', 'warning', null);
            }
        } catch (error) {
            console.error('Erro ao importar:', error);
            this.showImportStatus(`Erro ao importar: ${error.message}`, 'error', null);
        }

        setTimeout(() => {
            statusEl.classList.add('hidden');
        }, 5000);
    }

    sanitizeCsvCell(cell) {
        if (typeof cell !== 'string') return cell;
        
        let sanitized = cell.trim();
        
        if (sanitized.startsWith('"') && sanitized.endsWith('"')) {
            sanitized = sanitized.slice(1, -1);
        }
        
        sanitized = sanitized.replace(/""/g, '"');
        
        return sanitized;
    }

    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            const isCSV = file.name.endsWith('.csv');

            reader.onload = (e) => {
                try {
                    if (isCSV) {
                        const text = e.target.result;
                        const rows = text.split('\n').map(row => 
                            row.split(',').map(cell => this.sanitizeCsvCell(cell))
                        );
                        resolve(rows);
                    } else {
                        const data = new Uint8Array(e.target.result);
                        const workbook = XLSX.read(data, { type: 'array' });
                        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
                        resolve(jsonData);
                    }
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            
            if (isCSV) {
                reader.readAsText(file);
            } else {
                reader.readAsArrayBuffer(file);
            }
        });
    }

    processImportData(rows) {
        let imported = 0;
        const categoriasExistentes = Storage.loadCategorias();
        
        rows.forEach((row, index) => {
            if (index === 0 && (row[0]?.toLowerCase().includes('nome') || row[0]?.toLowerCase().includes('name'))) {
                return;
            }

            if (row.length >= 3 && row[0] && row[2]) {
                const nomeRaw = String(row[0]).trim().toUpperCase();
                const nome = this.sanitizeCategory(nomeRaw);
                const telefoneRaw = String(row[1] || '').trim();
                const telefone = telefoneRaw.replace(/\D/g, '');
                const cpf = String(row[2]).replace(/\D/g, '');
                const categoriaRawValue = row.length >= 4 ? String(row[3] || '').trim().toUpperCase() : '';
                const categoriaRaw = this.sanitizeCategory(categoriaRawValue);
                
                let categoria = '';
                if (categoriaRaw) {
                    if (categoriaRaw in categoriasExistentes) {
                        categoria = categoriaRaw;
                    } else {
                        categoriasExistentes[categoriaRaw] = Storage.getDefaultEmoji(categoriaRaw);
                        Storage.saveCategorias(categoriasExistentes);
                        categoria = categoriaRaw;
                    }
                }

                if (nome && cpf && Utils.validateCPF(cpf)) {
                    const exists = this.app.data.clients.some(c => c.cpf.replace(/\D/g, '') === cpf);
                    
                    if (!exists) {
                        const newClient = {
                            id: Utils.generateUUID(),
                            nome: nome,
                            cpf: cpf,
                            telefone: telefone,
                            categoria: categoria,
                            comentarios: [],
                            bicicletas: []
                        };
                        this.app.data.clients.push(newClient);
                        imported++;
                    }
                }
            }
        });

        this.renderCategorias();
        return imported;
    }

    exportToExcel() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const dataInicio = this.elements.exportDataInicio.value;
        const dataFim = this.elements.exportDataFim.value;
        
        const exportData = this.prepareSimpleExportData(dataInicio, dataFim);
        const totalClientes = exportData.length - 1;
        
        if (totalClientes === 0) {
            const periodoMsg = dataInicio || dataFim 
                ? ` no período selecionado` 
                : '';
            Modals.alert(`Nenhum cliente encontrado${periodoMsg} para exportar.`, 'Aviso');
            return;
        }
        
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(exportData);
        XLSX.utils.book_append_sheet(wb, ws, "Clientes");

        const periodoStr = dataInicio && dataFim 
            ? `${dataInicio}_${dataFim}` 
            : new Date().toISOString().split('T')[0];
        const fileName = `clientes_${periodoStr}.xlsx`;
        
        XLSX.writeFile(wb, fileName);
        
        Modals.alert(`Exportação concluída! ${totalClientes} cliente(s) exportado(s).`);
    }

    exportToCSV() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const dataInicio = this.elements.exportDataInicio.value;
        const dataFim = this.elements.exportDataFim.value;
        
        const exportData = this.prepareSimpleExportData(dataInicio, dataFim);
        const totalClientes = exportData.length - 1;
        
        if (totalClientes === 0) {
            const periodoMsg = dataInicio || dataFim 
                ? ` no período selecionado` 
                : '';
            Modals.alert(`Nenhum cliente encontrado${periodoMsg} para exportar.`, 'Aviso');
            return;
        }

        const csvContent = exportData.map(row => 
            row.map(cell => {
                const cellStr = String(cell);
                const escaped = cellStr.replace(/"/g, '""');
                return `"${escaped}"`;
            }).join(',')
        ).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const periodoStr = dataInicio && dataFim 
            ? `${dataInicio}_${dataFim}` 
            : new Date().toISOString().split('T')[0];
        const fileName = `clientes_${periodoStr}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        Modals.alert(`Exportação concluída! ${totalClientes} cliente(s) exportado(s).`);
    }

    prepareSimpleExportData(dataInicio, dataFim) {
        let clientesToExport = this.app.data.clients;
        
        if (dataInicio || dataFim) {
            const inicio = dataInicio ? new Date(dataInicio) : null;
            const fim = dataFim ? new Date(dataFim) : null;
            
            if (inicio) inicio.setHours(0, 0, 0, 0);
            if (fim) fim.setHours(23, 59, 59, 999);
            
            const filteredRegistros = this.app.data.registros.filter(registro => {
                const dataEntrada = new Date(registro.dataHoraEntrada);
                if (inicio && dataEntrada < inicio) return false;
                if (fim && dataEntrada > fim) return false;
                return true;
            });
            
            const clientIds = new Set(filteredRegistros.map(r => r.clientId));
            clientesToExport = this.app.data.clients.filter(c => clientIds.has(c.id));
        }
        
        const headers = ['Nome', 'Telefone', 'CPF', 'Categoria'];
        const rows = clientesToExport.map(client => [
            client.nome,
            client.telefone || '',
            client.cpf,
            client.categoria || ''
        ]);

        return [headers, ...rows];
    }

    getClientRecords(clientId) {
        const client = this.app.data.clients.find(c => c.id === clientId);
        if (!client) return null;

        const clientRecords = this.app.data.registros.filter(r => r.clientId === clientId);
        
        const recordsWithDetails = clientRecords.map(registro => {
            let bikeModel = 'N/A';
            let bikeBrand = 'N/A';
            let bikeColor = 'N/A';

            if (registro.bikeSnapshot) {
                bikeModel = registro.bikeSnapshot.modelo;
                bikeBrand = registro.bikeSnapshot.marca;
                bikeColor = registro.bikeSnapshot.cor;
            } else {
                const bike = client.bicicletas?.find(b => b.id === registro.bikeId);
                if (bike) {
                    bikeModel = bike.modelo;
                    bikeBrand = bike.marca;
                    bikeColor = bike.cor;
                }
            }

            return {
                ...registro,
                clientName: client.nome,
                clientCPF: client.cpf,
                bikeModel: bikeModel,
                bikeBrand: bikeBrand,
                bikeColor: bikeColor
            };
        });

        recordsWithDetails.sort((a, b) => new Date(b.dataHoraEntrada) - new Date(a.dataHoraEntrada));
        
        return {
            client,
            records: recordsWithDetails
        };
    }

    async exportClientRecordsToPDF(clientId) {
        const data = this.getClientRecords(clientId);
        if (!data || data.records.length === 0) {
            await Modals.showAlert('Nenhum registro de acesso encontrado para este cliente.', 'Atenção');
            return;
        }

        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 14;
        let yPos = margin;

        doc.setFontSize(18);
        doc.setFont(undefined, 'bold');
        doc.text('Relatório de Registros de Acesso', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 10;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 15;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Informações do Cliente', margin, yPos);
        
        yPos += 7;
        doc.setFontSize(10);
        doc.setFont(undefined, 'normal');
        doc.text(`Nome: ${data.client.nome}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`CPF: ${Utils.formatCPF(data.client.cpf)}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Telefone: ${Utils.formatTelefone(data.client.telefone)}`, margin + 5, yPos);
        yPos += 5;
        doc.text(`Total de Registros: ${data.records.length}`, margin + 5, yPos);

        yPos += 12;
        doc.setFontSize(12);
        doc.setFont(undefined, 'bold');
        doc.text('Histórico de Registros', margin, yPos);
        
        yPos += 8;

        data.records.forEach((registro, index) => {
            if (yPos > pageHeight - 40) {
                doc.addPage();
                yPos = margin;
            }

            doc.setFontSize(10);
            doc.setFont(undefined, 'bold');
            doc.text(`Registro #${index + 1}`, margin, yPos);
            
            yPos += 6;
            doc.setFont(undefined, 'normal');
            doc.text(`Bicicleta: ${registro.bikeModel} (${registro.bikeBrand} - ${registro.bikeColor})`, margin + 5, yPos);
            
            yPos += 5;
            const entradaDate = new Date(registro.dataHoraEntrada);
            doc.text(`Entrada: ${entradaDate.toLocaleString('pt-BR')}`, margin + 5, yPos);
            
            yPos += 5;
            if (registro.dataHoraSaida) {
                const saidaDate = new Date(registro.dataHoraSaida);
                const statusText = registro.accessRemoved ? 'Acesso Removido' : 'Saída Normal';
                doc.text(`Saída: ${saidaDate.toLocaleString('pt-BR')} (${statusText})`, margin + 5, yPos);
            } else {
                doc.text('Saída: Ainda no estacionamento', margin + 5, yPos);
            }

            yPos += 8;
            doc.setDrawColor(200, 200, 200);
            doc.line(margin, yPos - 2, pageWidth - margin, yPos - 2);
            yPos += 2;
        });

        doc.save(`registros_${data.client.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
    }

    async exportClientRecordsToExcel(clientId) {
        const data = this.getClientRecords(clientId);
        if (!data || data.records.length === 0) {
            await Modals.showAlert('Nenhum registro de acesso encontrado para este cliente.', 'Atenção');
            return;
        }

        const headers = ['Data/Hora Entrada', 'Data/Hora Saída', 'Status', 'Bicicleta', 'Marca', 'Cor'];
        const rows = data.records.map(registro => {
            const entradaDate = new Date(registro.dataHoraEntrada);
            const saidaDate = registro.dataHoraSaida ? new Date(registro.dataHoraSaida) : null;
            const status = !registro.dataHoraSaida ? 'No estacionamento' : 
                          (registro.accessRemoved ? 'Acesso Removido' : 'Saída Normal');
            
            return [
                entradaDate.toLocaleString('pt-BR'),
                saidaDate ? saidaDate.toLocaleString('pt-BR') : '-',
                status,
                registro.bikeModel,
                registro.bikeBrand,
                registro.bikeColor
            ];
        });

        const clientInfo = [
            ['RELATÓRIO DE REGISTROS DE ACESSO'],
            [],
            ['Cliente:', data.client.nome],
            ['CPF:', Utils.formatCPF(data.client.cpf)],
            ['Telefone:', Utils.formatTelefone(data.client.telefone)],
            ['Total de Registros:', data.records.length],
            ['Gerado em:', new Date().toLocaleString('pt-BR')],
            [],
            headers,
            ...rows
        ];

        const ws = XLSX.utils.aoa_to_sheet(clientInfo);
        
        ws['!cols'] = [
            { wch: 20 },
            { wch: 20 },
            { wch: 18 },
            { wch: 20 },
            { wch: 15 },
            { wch: 12 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Registros");
        
        XLSX.writeFile(wb, `registros_${data.client.nome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`);
    }

    async renderHistoricoOrganizado() {
        const summary = await Storage.loadStorageSummary();
        const organized = await Storage.getOrganizedRegistros();
        
        if (!summary || summary.totalRegistros === 0) {
            this.elements.historicoOrganizado.innerHTML = '<p class="text-sm text-slate-500 dark:text-slate-400 text-center py-4">Nenhum registro encontrado</p>';
            this.elements.historicoSummary.innerHTML = '';
            return;
        }

        this.elements.historicoSummary.innerHTML = `
            <div class="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                <span class="font-semibold text-slate-700 dark:text-slate-200">Total de Registros: ${summary.totalRegistros}</span>
            </div>
        `;

        const years = Object.keys(organized).sort((a, b) => b - a);
        
        this.elements.historicoOrganizado.innerHTML = years.map(year => {
            const yearData = summary.anos[year];
            const isExpanded = this.expandedYears.has(year);
            
            return `
                <div class="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                    <div class="folder-header flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors" data-year="${year}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-yellow-600 dark:text-yellow-400 transition-transform ${isExpanded ? 'rotate-90' : ''}">
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                            </svg>
                            <span class="font-semibold text-slate-800 dark:text-slate-100">${year}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">(${yearData.totalMeses} ${yearData.totalMeses === 1 ? 'mês' : 'meses'})</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-full font-medium">
                                ${Object.values(yearData.meses).reduce((sum, m) => sum + m.totalRegistros, 0)} registros
                            </span>
                            <button class="report-btn p-1.5 rounded-lg bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors" data-type="year" data-year="${year}" title="Gerar Relatório do Ano">
                                <i data-lucide="file-bar-chart" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    <div class="year-content ${isExpanded ? '' : 'hidden'} p-2 space-y-2">
                        ${this.renderMonths(year, organized[year], yearData)}
                    </div>
                </div>
            `;
        }).join('');

        this.attachHistoricoEventListeners();
        lucide.createIcons();
    }

    renderMonths(year, monthsData, summaryData) {
        const months = Object.keys(monthsData).sort((a, b) => b - a);
        
        return months.map(month => {
            const monthInfo = summaryData.meses[month];
            const isExpanded = this.expandedMonths.has(`${year}-${month}`);
            
            return `
                <div class="border border-slate-200 dark:border-slate-600 rounded-lg overflow-hidden">
                    <div class="month-header flex items-center justify-between p-2 bg-white dark:bg-slate-800 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors" data-year="${year}" data-month="${month}">
                        <div class="flex items-center gap-2">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-blue-600 dark:text-blue-400 transition-transform ${isExpanded ? 'rotate-90' : ''}">
                                <path d="M4 20h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13c0 1.1.9 2 2 2Z"/>
                            </svg>
                            <span class="text-sm font-medium text-slate-700 dark:text-slate-200">${monthInfo.nome}</span>
                            <span class="text-xs text-slate-500 dark:text-slate-400">(${monthInfo.totalDias} ${monthInfo.totalDias === 1 ? 'dia' : 'dias'})</span>
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="text-xs px-2 py-0.5 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-full">
                                ${monthInfo.totalRegistros}
                            </span>
                            <button class="report-btn p-1 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors" data-type="month" data-year="${year}" data-month="${month}" title="Gerar Relatório do Mês">
                                <i data-lucide="file-bar-chart" class="w-3.5 h-3.5"></i>
                            </button>
                        </div>
                    </div>
                    <div class="month-content ${isExpanded ? '' : 'hidden'} p-2 pl-6 space-y-1">
                        ${this.renderDays(year, month, monthsData[month], monthInfo)}
                    </div>
                </div>
            `;
        }).join('');
    }

    renderDays(year, month, daysData, monthInfo) {
        const days = Object.keys(daysData).sort((a, b) => b - a);
        const categorias = Storage.loadCategorias();
        
        return days.map(day => {
            const dayCount = monthInfo.dias[day];
            const date = new Date(year, month - 1, day);
            const dayName = date.toLocaleDateString('pt-BR', { weekday: 'long' });
            
            const registrosDay = daysData[day] || [];
            
            const categoriaRegistros = {};
            const categoriaPernoites = {};
            Object.keys(categorias).forEach(cat => {
                categoriaRegistros[cat] = 0;
                categoriaPernoites[cat] = 0;
            });
            let semCategoriaRegistros = 0;
            let semCategoriaPernoites = 0;
            
            registrosDay.forEach(r => {
                const cat = r.categoria || '';
                const isPernoite = r.pernoite === true;
                
                if (cat && cat in categorias) {
                    if (isPernoite) {
                        categoriaPernoites[cat]++;
                    } else {
                        categoriaRegistros[cat]++;
                    }
                } else if (cat === '') {
                    if (isPernoite) {
                        semCategoriaPernoites++;
                    } else {
                        semCategoriaRegistros++;
                    }
                }
            });
            
            const categoriaRegistrosBadges = Object.entries(categoriaRegistros)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([nome, count]) => {
                    const emoji = categorias[nome];
                    return `<span class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded flex items-center gap-1" title="Registros ${nome}">${emoji} ${count}</span>`;
                })
                .join('');
            
            const semCategoriaRegistrosBadge = semCategoriaRegistros > 0 
                ? `<span class="text-xs px-2 py-0.5 bg-slate-300 dark:bg-slate-600 text-slate-700 dark:text-slate-200 rounded flex items-center gap-1" title="Sem categoria">⚙️ ${semCategoriaRegistros}</span>` 
                : '';
            
            const categoriaPernoitesBadges = Object.entries(categoriaPernoites)
                .filter(([_, count]) => count > 0)
                .sort((a, b) => b[1] - a[1])
                .map(([nome, count]) => {
                    const emoji = categorias[nome];
                    return `<span class="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1" title="Pernoites ${nome}"><i data-lucide="moon" class="w-3 h-3"></i> ${emoji} ${count}</span>`;
                })
                .join('');
            
            const semCategoriaPernoitesBadge = semCategoriaPernoites > 0 
                ? `<span class="text-xs px-2 py-0.5 bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded flex items-center gap-1" title="Pernoites sem categoria"><i data-lucide="moon" class="w-3 h-3"></i> ⚙️ ${semCategoriaPernoites}</span>` 
                : '';
            
            const totalPernoites = Object.values(categoriaPernoites).reduce((sum, c) => sum + c, 0) + semCategoriaPernoites;
            const totalRegistrosNormais = Object.values(categoriaRegistros).reduce((sum, c) => sum + c, 0) + semCategoriaRegistros;
            
            return `
                <div class="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-900/30 rounded hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div class="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-500 dark:text-slate-400">
                            <rect width="18" height="18" x="3" y="4" rx="2" ry="2"/>
                            <line x1="16" x2="16" y1="2" y2="6"/>
                            <line x1="8" x2="8" y1="2" y2="6"/>
                            <line x1="3" x2="21" y1="10" y2="10"/>
                        </svg>
                        <span class="text-sm text-slate-700 dark:text-slate-200">${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}</span>
                        <span class="text-xs text-slate-500 dark:text-slate-400 capitalize">(${dayName})</span>
                    </div>
                    <div class="flex items-center gap-1.5 flex-wrap justify-end">
                        ${totalRegistrosNormais > 0 ? `<span class="text-xs px-2 py-0.5 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-medium" title="Total de registros normais">${totalRegistrosNormais} ${totalRegistrosNormais === 1 ? 'registro' : 'registros'}</span>` : ''}
                        ${categoriaRegistrosBadges}
                        ${semCategoriaRegistrosBadge}
                        ${totalPernoites > 0 ? `<span class="text-xs px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded font-medium flex items-center gap-1" title="Total de pernoites"><i data-lucide="moon" class="w-3 h-3"></i> ${totalPernoites}</span>` : ''}
                        ${categoriaPernoitesBadges}
                        ${semCategoriaPernoitesBadge}
                        <button class="report-btn p-1 rounded bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-800/50 transition-colors" data-type="day" data-year="${year}" data-month="${month}" data-day="${day}" title="Gerar Relatório do Dia">
                            <i data-lucide="file-bar-chart" class="w-3 h-3"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');
    }

    attachHistoricoEventListeners() {
        document.querySelectorAll('.folder-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.report-btn')) return;
                const year = e.currentTarget.dataset.year;
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('svg');
                
                if (this.expandedYears.has(year)) {
                    this.expandedYears.delete(year);
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-90');
                } else {
                    this.expandedYears.add(year);
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-90');
                }
            });
        });

        document.querySelectorAll('.month-header').forEach(header => {
            header.addEventListener('click', (e) => {
                if (e.target.closest('.report-btn')) return;
                const year = e.currentTarget.dataset.year;
                const month = e.currentTarget.dataset.month;
                const key = `${year}-${month}`;
                const content = e.currentTarget.nextElementSibling;
                const icon = e.currentTarget.querySelector('svg');
                
                if (this.expandedMonths.has(key)) {
                    this.expandedMonths.delete(key);
                    content.classList.add('hidden');
                    icon.classList.remove('rotate-90');
                } else {
                    this.expandedMonths.add(key);
                    content.classList.remove('hidden');
                    icon.classList.add('rotate-90');
                }
            });
        });

        document.querySelectorAll('.report-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const type = btn.dataset.type;
                const year = btn.dataset.year;
                const month = btn.dataset.month;
                const day = btn.dataset.day;
                this.showReportExportModal(type, year, month, day);
            });
        });
    }

    async showReportExportModal(type, year, month, day) {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }

        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        let periodLabel = '';
        let periodSelectorHtml = '';
        
        if (type === 'year') {
            periodLabel = `Ano ${year}`;
        } else if (type === 'month') {
            periodLabel = `${monthNames[parseInt(month) - 1]} de ${year}`;
            const lastDay = new Date(parseInt(year), parseInt(month), 0).getDate();
            const monthPadded = month.toString().padStart(2, '0');
            periodSelectorHtml = `
                <div class="mb-4 p-3 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                    <label class="flex items-center gap-2 mb-2">
                        <input type="checkbox" id="use-custom-period" class="w-4 h-4 rounded text-emerald-600">
                        <span class="text-sm font-medium text-slate-700 dark:text-slate-200">Selecionar período personalizado</span>
                    </label>
                    <div id="custom-period-fields" class="hidden space-y-2">
                        <div class="flex items-center gap-2">
                            <label class="text-xs text-slate-500 dark:text-slate-400 w-10">De:</label>
                            <input type="date" id="report-date-start" value="${year}-${monthPadded}-01" min="${year}-${monthPadded}-01" max="${year}-${monthPadded}-${lastDay.toString().padStart(2, '0')}" class="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        </div>
                        <div class="flex items-center gap-2">
                            <label class="text-xs text-slate-500 dark:text-slate-400 w-10">Até:</label>
                            <input type="date" id="report-date-end" value="${year}-${monthPadded}-${lastDay.toString().padStart(2, '0')}" min="${year}-${monthPadded}-01" max="${year}-${monthPadded}-${lastDay.toString().padStart(2, '0')}" class="flex-1 px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 rounded bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        </div>
                    </div>
                </div>
            `;
        } else if (type === 'day') {
            periodLabel = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
        }

        const modalHtml = `
            <div id="report-export-modal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
                    <div class="flex items-center gap-3 mb-4">
                        <div class="p-2 bg-emerald-100 dark:bg-emerald-900/50 rounded-lg">
                            <i data-lucide="file-bar-chart" class="w-6 h-6 text-emerald-600 dark:text-emerald-400"></i>
                        </div>
                        <div>
                            <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-100">Gerar Relatório</h3>
                            <p class="text-sm text-slate-500 dark:text-slate-400">${periodLabel}</p>
                        </div>
                    </div>
                    <p class="text-sm text-slate-600 dark:text-slate-300 mb-4">
                        O relatório incluirá estatísticas detalhadas: total de acessos, acessos por cliente, por categoria e pernoites.
                    </p>
                    ${periodSelectorHtml}
                    <div class="flex flex-col gap-3">
                        <button id="export-report-xlsx" class="flex items-center justify-center gap-2 w-full py-3 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                            <i data-lucide="file-spreadsheet" class="w-5 h-5"></i>
                            Exportar como Excel (.xlsx)
                        </button>
                        <button id="export-report-pdf" class="flex items-center justify-center gap-2 w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                            <i data-lucide="file-text" class="w-5 h-5"></i>
                            Exportar como PDF
                        </button>
                        <button id="cancel-report-modal" class="w-full py-2 px-4 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
        lucide.createIcons();

        const modal = document.getElementById('report-export-modal');
        const useCustomPeriod = document.getElementById('use-custom-period');
        const customPeriodFields = document.getElementById('custom-period-fields');
        
        if (useCustomPeriod && customPeriodFields) {
            useCustomPeriod.addEventListener('change', () => {
                customPeriodFields.classList.toggle('hidden', !useCustomPeriod.checked);
            });
        }
        
        document.getElementById('cancel-report-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        const getReportParams = () => {
            if (type === 'month' && useCustomPeriod?.checked) {
                const startDate = document.getElementById('report-date-start')?.value;
                const endDate = document.getElementById('report-date-end')?.value;
                return { type: 'custom', year, month, startDate, endDate };
            }
            return { type, year, month, day };
        };

        document.getElementById('export-report-xlsx').addEventListener('click', async () => {
            const params = getReportParams();
            modal.remove();
            await this.generatePeriodReportXLSX(params.type, params.year, params.month, params.day, params.startDate, params.endDate);
        });

        document.getElementById('export-report-pdf').addEventListener('click', async () => {
            const params = getReportParams();
            modal.remove();
            await this.generatePeriodReportPDF(params.type, params.year, params.month, params.day, params.startDate, params.endDate);
        });
    }

    async generatePeriodReportXLSX(type, year, month, day, startDate, endDate) {
        const organized = await Storage.getOrganizedRegistros();
        const categorias = Storage.loadCategorias();
        const clients = Storage.loadClientsSync();
        
        let registros = [];
        let periodLabel = '';
        let fileName = '';
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

        if (type === 'year') {
            periodLabel = `Ano ${year}`;
            fileName = `relatorio_${year}`;
            if (organized[year]) {
                Object.values(organized[year]).forEach(monthData => {
                    Object.values(monthData).forEach(dayData => {
                        registros = registros.concat(dayData);
                    });
                });
            }
        } else if (type === 'month') {
            periodLabel = `${monthNames[parseInt(month) - 1]} de ${year}`;
            fileName = `relatorio_${year}_${month}`;
            if (organized[year] && organized[year][month]) {
                Object.values(organized[year][month]).forEach(dayData => {
                    registros = registros.concat(dayData);
                });
            }
        } else if (type === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startDay = start.getDate();
            const endDay = end.getDate();
            periodLabel = `${startDay.toString().padStart(2, '0')}/${month.padStart(2, '0')}/${year} a ${endDay.toString().padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            fileName = `relatorio_${year}_${month}_${startDay}_a_${endDay}`;
            if (organized[year] && organized[year][month]) {
                Object.entries(organized[year][month]).forEach(([dayKey, dayData]) => {
                    const dayNum = parseInt(dayKey);
                    if (dayNum >= startDay && dayNum <= endDay) {
                        registros = registros.concat(dayData);
                    }
                });
            }
        } else if (type === 'day') {
            periodLabel = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            fileName = `relatorio_${year}_${month}_${day}`;
            if (organized[year] && organized[year][month] && organized[year][month][day]) {
                registros = organized[year][month][day];
            }
        }

        const stats = this.calculateReportStats(registros, clients, categorias);

        const wb = XLSX.utils.book_new();

        const resumoData = [
            ['RELATÓRIO DE ACESSOS - ' + periodLabel.toUpperCase()],
            ['Gerado em:', new Date().toLocaleString('pt-BR')],
            [],
            ['RESUMO GERAL'],
            ['Total de Acessos:', stats.totalAcessos],
            ['Total de Pernoites:', stats.totalPernoites],
            ['Total de Clientes Únicos:', stats.clientesUnicos],
            [],
            ['ACESSOS POR CATEGORIA'],
            ['Categoria', 'Acessos', 'Pernoites'],
            ...Object.entries(stats.porCategoria).map(([cat, data]) => [cat === '' ? 'Sem categoria' : cat, data.acessos, data.pernoites]),
            [],
            ['ACESSOS POR CLIENTE'],
            ['Cliente', 'CPF', 'Categoria', 'Acessos', 'Pernoites'],
            ...Object.entries(stats.porCliente).sort((a, b) => b[1].acessos - a[1].acessos).map(([id, data]) => [
                data.nome, data.cpf, data.categoria || 'Sem categoria', data.acessos, data.pernoites
            ])
        ];

        const wsResumo = XLSX.utils.aoa_to_sheet(resumoData);
        wsResumo['!cols'] = [{ wch: 30 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 15 }];
        XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo');

        const registrosData = [
            ['Data/Hora Entrada', 'Data/Hora Saída', 'Cliente', 'CPF', 'Bicicleta', 'Categoria', 'Pernoite'],
            ...registros.map(r => {
                const client = clients.find(c => c.id === r.clienteId) || {};
                const bike = client.bicicletas?.find(b => b.id === r.bicicletaId) || {};
                return [
                    new Date(r.dataHoraEntrada).toLocaleString('pt-BR'),
                    r.dataHoraSaida ? new Date(r.dataHoraSaida).toLocaleString('pt-BR') : 'Em aberto',
                    client.nome || 'Desconhecido',
                    client.cpf || '',
                    bike.marca ? `${bike.marca} ${bike.modelo || ''} ${bike.cor || ''}`.trim() : 'Não identificada',
                    client.categoria || 'Sem categoria',
                    r.pernoite ? 'Sim' : 'Não'
                ];
            })
        ];

        const wsRegistros = XLSX.utils.aoa_to_sheet(registrosData);
        wsRegistros['!cols'] = [{ wch: 20 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 10 }];
        XLSX.utils.book_append_sheet(wb, wsRegistros, 'Registros Detalhados');

        XLSX.writeFile(wb, `${fileName}.xlsx`);
        Modals.alert(`Relatório exportado com sucesso: ${fileName}.xlsx`, 'Sucesso');
    }

    async generatePeriodReportPDF(type, year, month, day, startDate, endDate) {
        const organized = await Storage.getOrganizedRegistros();
        const categorias = Storage.loadCategorias();
        const clients = Storage.loadClientsSync();
        const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        
        let registros = [];
        let periodLabel = '';

        if (type === 'year') {
            periodLabel = `Ano ${year}`;
            if (organized[year]) {
                Object.values(organized[year]).forEach(monthData => {
                    Object.values(monthData).forEach(dayData => {
                        registros = registros.concat(dayData);
                    });
                });
            }
        } else if (type === 'month') {
            periodLabel = `${monthNames[parseInt(month) - 1]} de ${year}`;
            if (organized[year] && organized[year][month]) {
                Object.values(organized[year][month]).forEach(dayData => {
                    registros = registros.concat(dayData);
                });
            }
        } else if (type === 'custom' && startDate && endDate) {
            const start = new Date(startDate);
            const end = new Date(endDate);
            const startDay = start.getDate();
            const endDay = end.getDate();
            periodLabel = `${startDay.toString().padStart(2, '0')}/${month.padStart(2, '0')}/${year} a ${endDay.toString().padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            if (organized[year] && organized[year][month]) {
                Object.entries(organized[year][month]).forEach(([dayKey, dayData]) => {
                    const dayNum = parseInt(dayKey);
                    if (dayNum >= startDay && dayNum <= endDay) {
                        registros = registros.concat(dayData);
                    }
                });
            }
        } else if (type === 'day') {
            periodLabel = `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            if (organized[year] && organized[year][month] && organized[year][month][day]) {
                registros = organized[year][month][day];
            }
        }

        const stats = this.calculateReportStats(registros, clients, categorias);
        
        const printWindow = window.open('', '_blank');
        const maxAcessos = Math.max(...Object.values(stats.porCliente).map(d => d.acessos), 1);
        const categoriasArray = Object.entries(stats.porCategoria).filter(([_, d]) => d.acessos > 0 || d.pernoites > 0);
        const maxCatAcessos = Math.max(...categoriasArray.map(([_, d]) => d.acessos + d.pernoites), 1);
        
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Relatório de Acessos - ${periodLabel}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #334155; line-height: 1.6; }
                    .container { max-width: 900px; margin: 0 auto; padding: 20px; }
                    
                    .header { background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 50%, #7c3aed 100%); color: white; padding: 30px; border-radius: 16px; margin-bottom: 24px; text-align: center; box-shadow: 0 10px 40px rgba(37, 99, 235, 0.3); }
                    .header-icon { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; }
                    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header-period { font-size: 18px; opacity: 0.95; font-weight: 500; }
                    .header-date { font-size: 13px; opacity: 0.8; margin-top: 8px; }
                    
                    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
                    .stat-card { background: white; padding: 24px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; position: relative; overflow: hidden; }
                    .stat-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; }
                    .stat-card.blue::before { background: linear-gradient(90deg, #0ea5e9, #2563eb); }
                    .stat-card.purple::before { background: linear-gradient(90deg, #8b5cf6, #7c3aed); }
                    .stat-card.emerald::before { background: linear-gradient(90deg, #10b981, #059669); }
                    .stat-icon { width: 48px; height: 48px; border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 12px; font-size: 24px; }
                    .stat-card.blue .stat-icon { background: #dbeafe; }
                    .stat-card.purple .stat-icon { background: #ede9fe; }
                    .stat-card.emerald .stat-icon { background: #d1fae5; }
                    .stat-value { font-size: 36px; font-weight: 700; margin-bottom: 4px; }
                    .stat-card.blue .stat-value { color: #2563eb; }
                    .stat-card.purple .stat-value { color: #7c3aed; }
                    .stat-card.emerald .stat-value { color: #059669; }
                    .stat-label { font-size: 13px; color: #64748b; font-weight: 500; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; }
                    .section-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #0ea5e9, #2563eb); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; }
                    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; }
                    
                    .category-list { display: flex; flex-direction: column; gap: 12px; }
                    .category-item { display: flex; align-items: center; gap: 16px; }
                    .category-name { min-width: 140px; font-weight: 500; color: #475569; }
                    .category-bar-container { flex: 1; height: 28px; background: #f1f5f9; border-radius: 14px; overflow: hidden; position: relative; }
                    .category-bar { height: 100%; border-radius: 14px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; font-size: 12px; font-weight: 600; color: white; transition: width 0.3s; }
                    .category-bar.acessos { background: linear-gradient(90deg, #0ea5e9, #2563eb); }
                    .category-bar.pernoites { background: linear-gradient(90deg, #8b5cf6, #7c3aed); margin-top: 4px; height: 20px; }
                    .category-stats { min-width: 100px; text-align: right; font-size: 13px; color: #64748b; }
                    
                    table { width: 100%; border-collapse: separate; border-spacing: 0; }
                    thead th { background: linear-gradient(135deg, #f8fafc, #f1f5f9); padding: 14px 12px; text-align: left; font-weight: 600; color: #475569; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #e2e8f0; }
                    thead th:first-child { border-radius: 8px 0 0 0; }
                    thead th:last-child { border-radius: 0 8px 0 0; }
                    tbody td { padding: 14px 12px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
                    tbody tr:hover { background: #f8fafc; }
                    tbody tr:last-child td { border-bottom: none; }
                    .client-name { font-weight: 600; color: #1e293b; }
                    .client-cpf { color: #64748b; font-family: monospace; }
                    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
                    .badge-blue { background: #dbeafe; color: #2563eb; }
                    .badge-purple { background: #ede9fe; color: #7c3aed; }
                    .badge-gray { background: #f1f5f9; color: #64748b; }
                    .access-bar { width: 60px; height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; display: inline-block; margin-left: 8px; vertical-align: middle; }
                    .access-bar-fill { height: 100%; background: linear-gradient(90deg, #0ea5e9, #2563eb); border-radius: 4px; }
                    
                    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
                    .footer-logo { font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 4px; }
                    
                    @media print { 
                        body { background: white; }
                        .container { padding: 10px; }
                        .section, .stat-card { box-shadow: none; border: 1px solid #e2e8f0; }
                        .header { box-shadow: none; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">🚲</div>
                        <h1>Relatório de Acessos</h1>
                        <div class="header-period">${periodLabel}</div>
                        <div class="header-date">Gerado em ${new Date().toLocaleString('pt-BR')}</div>
                    </div>

                    <div class="stats-grid">
                        <div class="stat-card blue">
                            <div class="stat-icon">📊</div>
                            <div class="stat-value">${stats.totalAcessos}</div>
                            <div class="stat-label">Total de Acessos</div>
                        </div>
                        <div class="stat-card purple">
                            <div class="stat-icon">🌙</div>
                            <div class="stat-value">${stats.totalPernoites}</div>
                            <div class="stat-label">Pernoites</div>
                        </div>
                        <div class="stat-card emerald">
                            <div class="stat-icon">👥</div>
                            <div class="stat-value">${stats.clientesUnicos}</div>
                            <div class="stat-label">Clientes Únicos</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <div class="section-icon">📁</div>
                            <div class="section-title">Acessos por Categoria</div>
                        </div>
                        <div class="category-list">
                            ${categoriasArray.length > 0 ? categoriasArray.map(([cat, data]) => {
                                const total = data.acessos + data.pernoites;
                                const width = Math.max((total / maxCatAcessos) * 100, 10);
                                return `
                                    <div class="category-item">
                                        <div class="category-name">${cat || 'Sem categoria'}</div>
                                        <div class="category-bar-container">
                                            <div class="category-bar acessos" style="width: ${width}%">${total}</div>
                                        </div>
                                        <div class="category-stats">
                                            <span class="badge badge-blue">${data.acessos} acessos</span>
                                            ${data.pernoites > 0 ? `<span class="badge badge-purple">${data.pernoites} pernoites</span>` : ''}
                                        </div>
                                    </div>
                                `;
                            }).join('') : '<p style="color: #94a3b8; text-align: center;">Nenhuma categoria registrada</p>'}
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <div class="section-icon">👤</div>
                            <div class="section-title">Ranking de Clientes</div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 40px">#</th>
                                    <th>Cliente</th>
                                    <th>CPF</th>
                                    <th>Categoria</th>
                                    <th style="text-align: center">Acessos</th>
                                    <th style="text-align: center">Pernoites</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${Object.entries(stats.porCliente).sort((a, b) => b[1].acessos - a[1].acessos).map(([id, data], index) => `
                                    <tr>
                                        <td style="font-weight: 700; color: ${index < 3 ? '#f59e0b' : '#94a3b8'}">${index + 1}</td>
                                        <td class="client-name">${data.nome}</td>
                                        <td class="client-cpf">${data.cpf || '-'}</td>
                                        <td><span class="badge badge-gray">${data.categoria || 'Sem categoria'}</span></td>
                                        <td style="text-align: center">
                                            <strong>${data.acessos}</strong>
                                            <div class="access-bar"><div class="access-bar-fill" style="width: ${(data.acessos / maxAcessos) * 100}%"></div></div>
                                        </td>
                                        <td style="text-align: center">
                                            ${data.pernoites > 0 ? `<span class="badge badge-purple">${data.pernoites}</span>` : '<span style="color: #cbd5e1">-</span>'}
                                        </td>
                                    </tr>
                                `).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="footer">
                        <div class="footer-logo">🚲 Bicicletário Shop</div>
                        <div>Sistema de Gerenciamento de Bicicletário</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        if (!printWindow) {
            Modals.alert('Não foi possível abrir a janela de impressão. Verifique se o bloqueador de pop-ups está desativado.', 'Erro');
            return;
        }
        printWindow.document.write(printContent);
        printWindow.document.close();
        setTimeout(() => {
            try {
                printWindow.print();
            } catch (e) {
                Modals.alert('Erro ao imprimir. Tente novamente.', 'Erro');
            }
        }, 500);
    }

    calculateReportStats(registros, clients, categorias) {
        const stats = {
            totalAcessos: registros.length,
            totalPernoites: 0,
            clientesUnicos: new Set(),
            porCategoria: {},
            porCliente: {}
        };

        Object.keys(categorias).forEach(cat => {
            stats.porCategoria[cat] = { acessos: 0, pernoites: 0 };
        });
        stats.porCategoria[''] = { acessos: 0, pernoites: 0 };

        registros.forEach(r => {
            const client = clients.find(c => c.id === r.clienteId) || {};
            const isPernoite = r.pernoite === true;
            const cat = client.categoria || '';

            if (isPernoite) stats.totalPernoites++;
            stats.clientesUnicos.add(r.clienteId);

            if (!stats.porCategoria[cat]) {
                stats.porCategoria[cat] = { acessos: 0, pernoites: 0 };
            }
            if (isPernoite) {
                stats.porCategoria[cat].pernoites++;
            } else {
                stats.porCategoria[cat].acessos++;
            }

            if (!stats.porCliente[r.clienteId]) {
                stats.porCliente[r.clienteId] = {
                    nome: client.nome || 'Desconhecido',
                    cpf: client.cpf || '',
                    categoria: client.categoria || '',
                    acessos: 0,
                    pernoites: 0
                };
            }
            if (isPernoite) {
                stats.porCliente[r.clienteId].pernoites++;
            } else {
                stats.porCliente[r.clienteId].acessos++;
            }
        });

        stats.clientesUnicos = stats.clientesUnicos.size;
        return stats;
    }

    exportSystemToExcel() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const dataInicio = this.elements.exportSystemDataInicio?.value || '';
        const dataFim = this.elements.exportSystemDataFim?.value || '';
        
        const systemData = this.prepareSystemExportData(dataInicio, dataFim);
        const wb = XLSX.utils.book_new();

        if (systemData.clientes && systemData.clientes.length > 1) {
            const clientesWs = XLSX.utils.aoa_to_sheet(systemData.clientes);
            XLSX.utils.book_append_sheet(wb, clientesWs, "Clientes");
        }

        if (systemData.bicicletas && systemData.bicicletas.length > 1) {
            const bicicletasWs = XLSX.utils.aoa_to_sheet(systemData.bicicletas);
            XLSX.utils.book_append_sheet(wb, bicicletasWs, "Bicicletas");
        }

        if (systemData.categorias && systemData.categorias.length > 1) {
            const categoriasWs = XLSX.utils.aoa_to_sheet(systemData.categorias);
            XLSX.utils.book_append_sheet(wb, categoriasWs, "Categorias");
        }

        if (systemData.registros && systemData.registros.length > 1) {
            const registrosWs = XLSX.utils.aoa_to_sheet(systemData.registros);
            XLSX.utils.book_append_sheet(wb, registrosWs, "Registros");
        }

        if (systemData.usuarios && systemData.usuarios.length > 1) {
            const usuariosWs = XLSX.utils.aoa_to_sheet(systemData.usuarios);
            XLSX.utils.book_append_sheet(wb, usuariosWs, "Usuarios");
        }

        const periodoStr = dataInicio && dataFim 
            ? `${dataInicio}_${dataFim}` 
            : new Date().toISOString().split('T')[0];
        const fileName = `backup_sistema_${periodoStr}.xlsx`;
        XLSX.writeFile(wb, fileName);
        
        const periodoMsg = dataInicio || dataFim 
            ? ` (período: ${dataInicio || 'início'} até ${dataFim || 'hoje'})` 
            : '';
        Modals.alert(`Backup exportado com sucesso${periodoMsg} para ${fileName}`);
    }

    exportSystemToCSV() {
        try {
            Auth.requirePermission('configuracao', 'exportar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const dataInicio = this.elements.exportSystemDataInicio?.value || '';
        const dataFim = this.elements.exportSystemDataFim?.value || '';
        
        const systemData = this.prepareSystemExportData(dataInicio, dataFim);
        
        const sections = [];
        if (systemData.clientes && systemData.clientes.length > 1) {
            sections.push({ name: 'Clientes', data: systemData.clientes });
        }
        if (systemData.bicicletas && systemData.bicicletas.length > 1) {
            sections.push({ name: 'Bicicletas', data: systemData.bicicletas });
        }
        if (systemData.categorias && systemData.categorias.length > 1) {
            sections.push({ name: 'Categorias', data: systemData.categorias });
        }
        if (systemData.registros && systemData.registros.length > 1) {
            sections.push({ name: 'Registros', data: systemData.registros });
        }
        if (systemData.usuarios && systemData.usuarios.length > 1) {
            sections.push({ name: 'Usuarios', data: systemData.usuarios });
        }

        let csvContent = '';
        sections.forEach((section, index) => {
            if (index > 0) csvContent += '\n\n';
            csvContent += `=== ${section.name} ===\n`;
            csvContent += section.data.map(row => 
                row.map(cell => {
                    const cellStr = String(cell);
                    const escaped = cellStr.replace(/"/g, '""');
                    return `"${escaped}"`;
                }).join(',')
            ).join('\n');
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        const periodoStr = dataInicio && dataFim 
            ? `${dataInicio}_${dataFim}` 
            : new Date().toISOString().split('T')[0];
        const fileName = `backup_sistema_${periodoStr}.csv`;
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        const periodoMsg = dataInicio || dataFim 
            ? ` (período: ${dataInicio || 'início'} até ${dataFim || 'hoje'})` 
            : '';
        Modals.alert(`Backup exportado com sucesso${periodoMsg} para ${fileName}`);
    }

    prepareSystemExportData(dataInicio = '', dataFim = '') {
        let registrosFiltrados = this.app.data.registros;
        let clienteIds = new Set();
        
        if (dataInicio || dataFim) {
            registrosFiltrados = this.app.data.registros.filter(registro => {
                const dataEntrada = Utils.getLocalDateString(registro.dataHoraEntrada);
                if (dataInicio && dataEntrada < dataInicio) return false;
                if (dataFim && dataEntrada > dataFim) return false;
                return true;
            });
            
            registrosFiltrados.forEach(reg => clienteIds.add(reg.clientId));
        }
        
        const clientesFiltrados = (dataInicio || dataFim) 
            ? this.app.data.clients.filter(c => clienteIds.has(c.id))
            : this.app.data.clients;

        const clientesHeaders = ['ID', 'Nome', 'CPF', 'Telefone', 'Categoria', 'Comentários', 'Bicicletas'];
        const clientesRows = clientesFiltrados.map(client => [
            client.id,
            client.nome,
            client.cpf,
            client.telefone || '',
            client.categoria || '',
            client.comentarios ? JSON.stringify(client.comentarios) : '[]',
            client.bicicletas ? JSON.stringify(client.bicicletas) : '[]'
        ]);

        const bicicletasHeaders = ['ID', 'Cliente ID', 'Marca', 'Modelo', 'Cor'];
        const bicicletasRows = [];
        clientesFiltrados.forEach(client => {
            if (client.bicicletas && client.bicicletas.length > 0) {
                client.bicicletas.forEach(bike => {
                    bicicletasRows.push([
                        bike.id,
                        client.id,
                        bike.marca,
                        bike.modelo,
                        bike.cor
                    ]);
                });
            }
        });

        const categoriasHeaders = ['Nome', 'Emoji'];
        const categorias = Storage.loadCategorias();
        const categoriasRows = Object.entries(categorias).map(([nome, emoji]) => [
            nome,
            emoji
        ]);

        const registrosHeaders = ['ID', 'Cliente ID', 'Bicicleta ID', 'Categoria', 'Data Entrada', 'Data Saída', 'Pernoite', 'Acesso Removido', 'Registro Original ID', 'Bike Snapshot'];
        const registrosRows = registrosFiltrados.map(registro => [
            registro.id,
            registro.clientId,
            registro.bikeId,
            registro.categoria || '',
            registro.dataHoraEntrada,
            registro.dataHoraSaida || '',
            registro.pernoite ? 'Sim' : 'Não',
            registro.acessoRemovido ? 'Sim' : 'Não',
            registro.registroOriginalId || '',
            registro.bikeSnapshot ? JSON.stringify(registro.bikeSnapshot) : '{}'
        ]);

        const usuarios = Auth.getAllUsers();
        const usuariosHeaders = ['ID', 'Username', 'Password', 'Nome', 'Tipo', 'Ativo', 'Permissões'];
        const usuariosRows = usuarios.map(user => [
            user.id,
            user.username,
            user.password,
            user.nome,
            user.tipo,
            user.ativo ? 'Sim' : 'Não',
            JSON.stringify(user.permissoes)
        ]);

        return {
            clientes: [clientesHeaders, ...clientesRows],
            bicicletas: [bicicletasHeaders, ...bicicletasRows],
            categorias: [categoriasHeaders, ...categoriasRows],
            registros: [registrosHeaders, ...registrosRows],
            usuarios: [usuariosHeaders, ...usuariosRows]
        };
    }

    mergeSystemData(importedData) {
        const stats = {
            clientesNovos: 0,
            clientesMesclados: 0,
            bicicletasAdicionadas: 0,
            registrosNovos: 0,
            usuariosNovos: 0,
            categoriasImportadas: 0
        };

        const existingClients = this.app.data.clients;
        const existingRegistros = this.app.data.registros;
        const existingUsuarios = Auth.getAllUsers();

        const clientesByCPF = new Map();
        existingClients.forEach(client => {
            const cpfClean = client.cpf.replace(/\D/g, '');
            clientesByCPF.set(cpfClean, client);
        });

        importedData.clients.forEach(importedClient => {
            const cpfClean = importedClient.cpf.replace(/\D/g, '');
            const existingClient = clientesByCPF.get(cpfClean);

            if (existingClient) {
                const existingBikesIds = new Set(existingClient.bicicletas.map(b => b.id));
                importedClient.bicicletas.forEach(bike => {
                    if (!existingBikesIds.has(bike.id)) {
                        existingClient.bicicletas.push(bike);
                        existingBikesIds.add(bike.id);
                        stats.bicicletasAdicionadas++;
                    }
                });
                stats.clientesMesclados++;
            } else {
                existingClients.push(importedClient);
                clientesByCPF.set(cpfClean, importedClient);
                stats.clientesNovos++;
                stats.bicicletasAdicionadas += importedClient.bicicletas.length;
            }
        });

        const existingRegistrosIds = new Set(existingRegistros.map(r => r.id));
        importedData.registros.forEach(registro => {
            if (!existingRegistrosIds.has(registro.id)) {
                existingRegistros.push(registro);
                existingRegistrosIds.add(registro.id);
                stats.registrosNovos++;
            }
        });

        const existingUsuariosUsernames = new Set(existingUsuarios.map(u => u.username));
        const usuariosToAdd = [];
        importedData.usuarios.forEach(usuario => {
            if (!existingUsuariosUsernames.has(usuario.username)) {
                usuariosToAdd.push(usuario);
                existingUsuariosUsernames.add(usuario.username);
                stats.usuariosNovos++;
            }
        });
        
        const mergedUsuarios = [...existingUsuarios, ...usuariosToAdd];
        
        let mergedCategorias = null;
        if (importedData.categorias) {
            mergedCategorias = importedData.categorias;
            stats.categoriasImportadas = Object.keys(mergedCategorias).length;
        }
        
        return {
            clients: existingClients,
            registros: existingRegistros,
            usuarios: mergedUsuarios,
            categorias: mergedCategorias,
            stats: stats
        };
    }

    async handleSystemImport() {
        try {
            Auth.requirePermission('configuracao', 'importar');
        } catch (error) {
            Modals.alert(error.message, 'Permissão Negada');
            return;
        }
        
        const file = this.elements.importSystemFile.files[0];
        if (!file) return;

        const confirmed = await Modals.showConfirm(
            'Esta operação irá MESCLAR os dados do arquivo com os dados existentes no sistema. Clientes duplicados (mesmo CPF) terão suas bicicletas mescladas, registros e usuários duplicados (mesmo ID/username) serão ignorados. Deseja continuar?'
        );
        
        if (!confirmed) return;

        try {
            this.showImportSystemStatus('Lendo arquivo...', 'info', 0);
            await this.delay(100);
            
            const fileExtension = file.name.split('.').pop().toLowerCase();
            let importedData;

            this.showImportSystemStatus('Processando arquivo...', 'info', 10);
            await this.delay(100);

            if (fileExtension === 'csv') {
                importedData = await this.processSystemCSVImport(file);
            } else {
                importedData = await this.processSystemExcelImport(file);
            }

            this.showImportSystemStatus('Analisando dados...', 'info', 30);
            await this.delay(100);

            const mergedData = this.mergeSystemData(importedData);

            const totalClients = mergedData.clients.length;
            this.showImportSystemStatus('Salvando clientes...', 'info', 50, 0, totalClients);
            await this.delay(100);
            await Storage.saveClients(mergedData.clients, true, (current, total) => {
                const progressPercent = 50 + Math.floor((current / total) * 15);
                this.showImportSystemStatus('Salvando clientes...', 'info', progressPercent, current, total);
            });

            const totalRegistros = mergedData.registros.length;
            this.showImportSystemStatus('Salvando registros...', 'info', 65, 0, totalRegistros);
            await this.delay(100);
            await Storage.saveRegistros(mergedData.registros, (current, total) => {
                const progressPercent = 65 + Math.floor((current / total) * 15);
                this.showImportSystemStatus('Salvando registros...', 'info', progressPercent, current, total);
            });

            this.showImportSystemStatus('Salvando usuários...', 'info', 80);
            await this.delay(100);
            Auth.saveUsers(mergedData.usuarios);

            if (mergedData.categorias) {
                this.showImportSystemStatus('Salvando categorias...', 'info', 90);
                await this.delay(100);
                Storage.saveCategorias(mergedData.categorias);
            }

            this.app.data.clients = mergedData.clients;
            this.app.data.registros = mergedData.registros;

            this.showImportSystemStatus('Finalizando importação...', 'info', 95);
            await this.delay(200);

            this.showImportSystemStatus(`Backup importado com sucesso! ${mergedData.stats.clientesNovos} clientes novos, ${mergedData.stats.clientesMesclados} mesclados, ${mergedData.stats.bicicletasAdicionadas} bicicletas adicionadas, ${mergedData.stats.registrosNovos} registros novos, ${mergedData.stats.usuariosNovos} usuários novos, ${mergedData.stats.categoriasImportadas} categorias.`, 'success', 100);
            
            this.app.clientesManager.renderClientList();
            
            sessionStorage.setItem('skipLoadingScreen', 'true');
            
            setTimeout(() => {
                Modals.alert('Dados importados com sucesso! A página será recarregada.', 'Importação Concluída', 'check-circle');
                setTimeout(() => {
                    window.location.reload();
                }, 1500);
            }, 1000);

        } catch (error) {
            console.error('Erro ao importar backup:', error);
            this.showImportSystemStatus(`Erro ao importar: ${error.message}`, 'error', null);
        }
    }

    async processSystemExcelImport(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });

                    const clientesSheet = workbook.Sheets['Clientes'];
                    const registrosSheet = workbook.Sheets['Registros'];
                    const usuariosSheet = workbook.Sheets['Usuarios'];
                    const bicicletasSheet = workbook.Sheets['Bicicletas'];
                    const categoriasSheet = workbook.Sheets['Categorias'];

                    if (!clientesSheet || !registrosSheet) {
                        throw new Error('Arquivo inválido. Certifique-se de que contém ao menos as abas: Clientes e Registros');
                    }

                    const clientesData = XLSX.utils.sheet_to_json(clientesSheet, { header: 1 });
                    const registrosData = XLSX.utils.sheet_to_json(registrosSheet, { header: 1 });
                    const usuariosData = usuariosSheet ? XLSX.utils.sheet_to_json(usuariosSheet, { header: 1 }) : [];
                    const bicicletasData = bicicletasSheet ? XLSX.utils.sheet_to_json(bicicletasSheet, { header: 1 }) : [];
                    const categoriasData = categoriasSheet ? XLSX.utils.sheet_to_json(categoriasSheet, { header: 1 }) : [];

                    const clients = this.parseClientesData(clientesData, bicicletasData);
                    const registros = this.parseRegistrosData(registrosData);
                    const usuarios = this.parseUsuariosData(usuariosData);
                    const categorias = this.parseCategoriasData(categoriasData);

                    resolve({
                        clients,
                        registros,
                        usuarios,
                        categorias
                    });
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
            reader.readAsArrayBuffer(file);
        });
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            const nextChar = line[i + 1];
            
            if (char === '"') {
                if (inQuotes && nextChar === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result;
    }

    async processSystemCSVImport(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const text = e.target.result;
                    const sections = text.split(/\n\n=== /);
                    
                    let clientesData = [];
                    let bicicletasData = [];
                    let categoriasData = [];
                    let registrosData = [];
                    let usuariosData = [];
                    
                    sections.forEach(section => {
                        const lines = section.split('\n');
                        const sectionName = lines[0].replace('=== ', '').replace(' ===', '').trim();
                        
                        const rows = lines.slice(1).filter(line => line.trim()).map(line => {
                            return this.parseCSVLine(line);
                        });
                        
                        if (sectionName === 'Clientes') {
                            clientesData = rows;
                        } else if (sectionName === 'Bicicletas') {
                            bicicletasData = rows;
                        } else if (sectionName === 'Categorias') {
                            categoriasData = rows;
                        } else if (sectionName === 'Registros') {
                            registrosData = rows;
                        } else if (sectionName === 'Usuarios') {
                            usuariosData = rows;
                        }
                    });
                    
                    if (clientesData.length === 0) {
                        throw new Error('Arquivo CSV inválido. Certifique-se de que contém dados de Clientes');
                    }
                    
                    const clients = this.parseClientesData(clientesData, bicicletasData);
                    const registros = this.parseRegistrosData(registrosData);
                    const usuarios = this.parseUsuariosData(usuariosData);
                    const categorias = this.parseCategoriasData(categoriasData);
                    
                    resolve({
                        clients,
                        registros,
                        usuarios,
                        categorias
                    });
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Erro ao ler arquivo CSV'));
            reader.readAsText(file);
        });
    }

    parseClientesData(clientesData, bicicletasData) {
        const clientesMap = new Map();
        
        for (let i = 1; i < clientesData.length; i++) {
            const row = clientesData[i];
            if (!row[0]) continue;

            let bicicletas = [];
            let categoria = '';
            let comentarios = [];
            
            // Detectar formato pela quantidade total de colunas (incluindo vazias)
            // Formato novo: 7 colunas (ID, Nome, CPF, Telefone, Categoria, Comentários, Bicicletas)
            // Formato antigo: 5 colunas (ID, Nome, CPF, Telefone, Bicicletas)
            
            if (row.length >= 7) {
                // Formato novo detectado
                categoria = row[4] || '';
                
                // Parse comentários com validação
                if (row[5] && row[5].trim()) {
                    try {
                        const parsed = JSON.parse(row[5]);
                        comentarios = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        console.warn(`Erro ao parsear comentários para cliente ${row[0]} (valor: "${row[5]}"): ${e.message}`);
                        comentarios = [];
                    }
                }
                
                // Parse bicicletas com validação
                if (row[6] && row[6].trim()) {
                    try {
                        const parsed = JSON.parse(row[6]);
                        bicicletas = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        console.warn(`Erro ao parsear bicicletas para cliente ${row[0]} (valor: "${row[6]}"): ${e.message}`);
                        bicicletas = [];
                    }
                }
            } else if (row.length >= 5) {
                // Formato antigo detectado
                if (row[4] && row[4].trim()) {
                    try {
                        const parsed = JSON.parse(row[4]);
                        bicicletas = Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        console.warn(`Erro ao parsear bicicletas (formato antigo) para cliente ${row[0]} (valor: "${row[4]}"): ${e.message}`);
                        bicicletas = [];
                    }
                }
            } else {
                console.warn(`Formato inesperado de cliente na linha ${i + 1}: ${row.length} colunas encontradas. Cliente será importado sem bicicletas.`);
            }

            clientesMap.set(row[0], {
                id: row[0],
                nome: row[1],
                cpf: row[2],
                telefone: row[3] || '',
                categoria: categoria,
                comentarios: comentarios,
                bicicletas: bicicletas
            });
        }

        // Se houver aba de bicicletas separada (formato antigo), processa também
        if (bicicletasData && bicicletasData.length > 1) {
            for (let i = 1; i < bicicletasData.length; i++) {
                const row = bicicletasData[i];
                if (!row[0]) continue;

                const clienteId = row[1];
                const client = clientesMap.get(clienteId);
                
                if (client) {
                    client.bicicletas.push({
                        id: row[0],
                        marca: row[2],
                        modelo: row[3],
                        cor: row[4]
                    });
                }
            }
        }

        return Array.from(clientesMap.values());
    }

    parseRegistrosData(registrosData) {
        const registros = [];
        
        for (let i = 1; i < registrosData.length; i++) {
            const row = registrosData[i];
            if (!row[0]) continue;

            // Detectar formato pela quantidade total de colunas (incluindo vazias)
            // Formato novo: 10 colunas (ID, Cliente ID, Bicicleta ID, Categoria, Data Entrada, Data Saída, Pernoite, Acesso Removido, Registro Original ID, Bike Snapshot)
            // Formato antigo: 8 colunas (ID, Cliente ID, Bicicleta ID, Data Entrada, Data Saída, Pernoite, Acesso Removido, Registro Original ID)
            
            if (row.length >= 10) {
                // Formato novo detectado
                let bikeSnapshot = null;
                
                // Parse bikeSnapshot com validação
                if (row[9]) {
                    try {
                        const parsed = JSON.parse(row[9]);
                        bikeSnapshot = (parsed && typeof parsed === 'object') ? parsed : null;
                    } catch (e) {
                        console.warn(`Erro ao parsear bikeSnapshot para registro ${row[0]}:`, e);
                        bikeSnapshot = null;
                    }
                }
                
                registros.push({
                    id: row[0],
                    clientId: row[1],
                    bikeId: row[2],
                    categoria: row[3] || '',
                    dataHoraEntrada: row[4],
                    dataHoraSaida: row[5] || null,
                    pernoite: row[6] === 'Sim',
                    acessoRemovido: row[7] === 'Sim',
                    registroOriginalId: row[8] || null,
                    bikeSnapshot: bikeSnapshot
                });
            } else if (row.length >= 8) {
                // Formato antigo detectado
                registros.push({
                    id: row[0],
                    clientId: row[1],
                    bikeId: row[2],
                    categoria: '',
                    dataHoraEntrada: row[3],
                    dataHoraSaida: row[4] || null,
                    pernoite: row[5] === 'Sim',
                    acessoRemovido: row[6] === 'Sim',
                    registroOriginalId: row[7] || null,
                    bikeSnapshot: null
                });
            } else {
                console.error(`Formato inesperado de registro na linha ${i + 1}: ${row.length} colunas encontradas. Registro ignorado.`);
            }
        }

        return registros;
    }

    parseUsuariosData(usuariosData) {
        const usuarios = [];
        
        for (let i = 1; i < usuariosData.length; i++) {
            const row = usuariosData[i];
            if (!row[0]) continue;

            let permissoes = {};
            if (row[6]) {
                try {
                    permissoes = JSON.parse(row[6]);
                } catch (e) {
                    console.warn(`Erro ao parsear permissões para usuário ${row[1]}:`, e);
                    permissoes = {};
                }
            }

            usuarios.push({
                id: row[0],
                username: row[1],
                password: row[2],
                nome: row[3],
                tipo: row[4],
                ativo: row[5] === 'Sim',
                permissoes: permissoes
            });
        }

        return usuarios;
    }

    parseCategoriasData(categoriasData) {
        const categorias = {};
        
        for (let i = 1; i < categoriasData.length; i++) {
            const row = categoriasData[i];
            if (!row[0]) continue;

            categorias[row[0]] = row[1];
        }

        return categorias;
    }

    showImportSystemStatus(message, type, progress = null, current = null, total = null) {
        const statusEl = this.elements.importSystemStatus;
        if (!statusEl) return;

        const colorClass = type === 'success' ? 'text-green-600 dark:text-green-400' :
            type === 'error' ? 'text-red-600 dark:text-red-400' :
            'text-blue-600 dark:text-blue-400';

        const progressColorClass = type === 'success' ? 'bg-green-500' :
            type === 'error' ? 'bg-red-500' : 'bg-orange-500';

        if (progress !== null && progress >= 0 && progress <= 100) {
            const countDisplay = (current !== null && total !== null) 
                ? `<span class="text-orange-500 dark:text-orange-400 font-bold">${current}/${total}</span>` 
                : '';
            const progressDisplay = (current !== null && total !== null) 
                ? `${countDisplay} <span class="text-slate-500 dark:text-slate-400">(${progress}%)</span>`
                : `${progress}%`;
            
            statusEl.innerHTML = `
                <div class="space-y-2">
                    <div class="flex items-center justify-between">
                        <p class="${colorClass} font-medium">${message}</p>
                        <p class="text-sm font-medium">${progressDisplay}</p>
                    </div>
                    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden">
                        <div class="${progressColorClass} h-3 rounded-full transition-all duration-300 ease-out" style="width: ${progress}%"></div>
                    </div>
                </div>
            `;
        } else {
            statusEl.innerHTML = `<p class="${colorClass}">${message}</p>`;
        }
        
        statusEl.className = 'text-sm mt-2';
        statusEl.classList.remove('hidden');
    }

    applyPermissionsToUI() {
        const canBuscaAvancada = Auth.hasPermission('configuracao', 'buscaAvancada');
        const canBackupVer = Auth.hasPermission('configuracao', 'backupVer');
        const canBackupGerenciar = Auth.hasPermission('configuracao', 'backupGerenciar');
        const canStorageVer = Auth.hasPermission('configuracao', 'storageVer');
        const canStorageGerenciar = Auth.hasPermission('configuracao', 'storageGerenciar');

        const globalSearchSection = document.getElementById('section-busca-avancada');
        if (globalSearchSection) {
            globalSearchSection.style.display = canBuscaAvancada ? '' : 'none';
        }

        if (this.elements.globalSearch) {
            const searchContainer = this.elements.globalSearch.closest('.bg-white, .dark\\:bg-slate-800');
            if (searchContainer && searchContainer.id === 'section-busca-avancada') {
                searchContainer.style.display = canBuscaAvancada ? '' : 'none';
            }
        }

        const backupSection = document.getElementById('backup-management-container');
        if (backupSection) {
            backupSection.style.display = canBackupVer ? '' : 'none';
        }

        const storageSection = document.getElementById('storage-mode-container');
        if (storageSection) {
            storageSection.style.display = canStorageVer ? '' : 'none';
        }
    }
    
    setupJobMonitorCallbacks() {
        try {
            const jobMonitor = getJobMonitor();
            const self = this;
            
            jobMonitor.onChanges(async (changes) => {
                try {
                    if (changes.clients || changes.registros || changes.categorias) {
                        if (typeof self.loadStorageModeSettings === 'function') {
                            await self.loadStorageModeSettings();
                        }
                        if (typeof self.renderHistoricoOrganizado === 'function') {
                            await self.renderHistoricoOrganizado();
                        }
                        
                        if (changes.categorias && typeof self.renderCategorias === 'function') {
                            self.renderCategorias();
                        }
                    }
                } catch (err) {
                    console.warn('Erro ao processar mudanças no ConfiguracaoManager:', err.message);
                }
            });
        } catch (e) {
            console.warn('Erro ao configurar callbacks do JobMonitor:', e);
        }
    }
    
    setupNotificationSettings() {
        const settings = notificationManager.getSettings();
        
        // Elementos de controle
        const inactivityEnabled = document.getElementById('inactivity-enabled');
        const inactivitySettings = document.getElementById('inactivity-settings');
        const inactivityInterval = document.getElementById('inactivity-interval');
        const inactivityRandom = document.getElementById('inactivity-random');
        
        const patrolRequestEnabled = document.getElementById('patrol-request-enabled');
        const patrolRequestSettings = document.getElementById('patrol-request-settings');
        const patrolRequestCount = document.getElementById('patrol-request-count');
        
        const patrolRoundEnabled = document.getElementById('patrol-round-enabled');
        const patrolRoundSettings = document.getElementById('patrol-round-settings');
        const patrolRoundInterval = document.getElementById('patrol-round-interval');
        
        const saveBtn = document.getElementById('save-notification-settings');
        
        // Carregar configurações salvas
        if (inactivityEnabled) {
            inactivityEnabled.checked = settings.inactivityEnabled;
            if (settings.inactivityEnabled && inactivitySettings) {
                inactivitySettings.classList.remove('hidden');
            }
        }
        
        if (inactivityInterval) {
            inactivityInterval.value = settings.inactivityInterval;
        }
        
        if (inactivityRandom) {
            inactivityRandom.checked = settings.inactivityRandom;
        }
        
        if (patrolRequestEnabled) {
            patrolRequestEnabled.checked = settings.patrolRequestEnabled;
            if (settings.patrolRequestEnabled && patrolRequestSettings) {
                patrolRequestSettings.classList.remove('hidden');
            }
        }
        
        if (patrolRequestCount) {
            patrolRequestCount.value = settings.patrolRequestCount;
        }
        
        if (patrolRoundEnabled) {
            patrolRoundEnabled.checked = settings.patrolRoundEnabled;
            if (settings.patrolRoundEnabled && patrolRoundSettings) {
                patrolRoundSettings.classList.remove('hidden');
            }
        }
        
        if (patrolRoundInterval) {
            patrolRoundInterval.value = settings.patrolRoundInterval;
        }
        
        // Event listeners para toggles
        if (inactivityEnabled) {
            inactivityEnabled.addEventListener('change', (e) => {
                if (inactivitySettings) {
                    inactivitySettings.classList.toggle('hidden', !e.target.checked);
                }
            });
        }
        
        if (patrolRequestEnabled) {
            patrolRequestEnabled.addEventListener('change', (e) => {
                if (patrolRequestSettings) {
                    patrolRequestSettings.classList.toggle('hidden', !e.target.checked);
                }
            });
        }
        
        if (patrolRoundEnabled) {
            patrolRoundEnabled.addEventListener('change', (e) => {
                if (patrolRoundSettings) {
                    patrolRoundSettings.classList.toggle('hidden', !e.target.checked);
                }
            });
        }
        
        // Salvar configurações
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const newSettings = {
                    inactivityEnabled: inactivityEnabled?.checked || false,
                    inactivityInterval: parseInt(inactivityInterval?.value || 10),
                    inactivityRandom: inactivityRandom?.checked || false,
                    patrolRequestEnabled: patrolRequestEnabled?.checked || false,
                    patrolRequestCount: parseInt(patrolRequestCount?.value || 10),
                    patrolRoundEnabled: patrolRoundEnabled?.checked || false,
                    patrolRoundInterval: parseInt(patrolRoundInterval?.value || 60),
                };
                
                notificationManager.saveSettings(newSettings);
                
                Modals.alert('Configurações de notificações salvas com sucesso!', 'Configurações Salvas', 'check-circle');
            });
        }
        
        this.loadStorageModeSettings();
    }
    
    async loadStorageModeSettings() {
        const container = document.getElementById('storage-mode-container');
        if (!container) return;
        
        // Check if running in Electron (desktop mode)
        const isDesktop = window.AppPlatform && typeof window.AppPlatform.isDesktop === 'function' && window.AppPlatform.isDesktop();
        
        if (isDesktop) {
            // Desktop mode - storage is file-based only
            container.innerHTML = `
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 p-4 rounded-lg">
                    <div class="flex items-center gap-2 text-blue-800 dark:text-blue-200">
                        <i data-lucide="info" class="w-5 h-5"></i>
                        <span class="font-medium">Modo Desktop</span>
                    </div>
                    <p class="text-sm text-blue-700 dark:text-blue-300 mt-1">
                        No modo desktop, os dados são armazenados automaticamente em arquivos JSON locais.
                    </p>
                    <p class="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        Localização: dados/desktop/
                    </p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
            return;
        }
        
        // Browser mode - try to fetch from API
        try {
            const response = await fetch('/api/storage-mode');
            if (!response.ok) throw new Error('API not available');
            
            const stats = await response.json();
            this.renderStorageModeUI(container, stats);
        } catch (error) {
            console.warn('Storage mode API not available:', error);
            container.innerHTML = `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg">
                    <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                        <span class="font-medium">Configuração de armazenamento indisponível</span>
                    </div>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        O servidor não está disponível para gerenciar modos de armazenamento.
                    </p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    }
    
    renderStorageModeUI(container, stats) {
        const currentMode = stats.current_mode || 'sqlite';
        const sqliteActive = currentMode === 'sqlite';
        const lastMigration = stats.last_migration ? new Date(stats.last_migration).toLocaleString('pt-BR') : 'Nunca';
        const canStorageGerenciar = Auth.hasPermission('configuracao', 'storageGerenciar');
        
        container.innerHTML = `
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div class="border-2 rounded-lg p-4 cursor-pointer transition-all ${sqliteActive ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-purple-300'}" data-mode="sqlite">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i data-lucide="database" class="w-5 h-5 ${sqliteActive ? 'text-purple-600' : 'text-slate-400'}"></i>
                            <span class="font-semibold ${sqliteActive ? 'text-purple-700 dark:text-purple-300' : 'text-slate-700 dark:text-slate-300'}">SQLite</span>
                        </div>
                        ${sqliteActive ? '<span class="text-xs bg-purple-600 text-white px-2 py-0.5 rounded-full">Ativo</span>' : ''}
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Banco de dados único, mais rápido e confiável. Recomendado.</p>
                    <div class="space-y-1 text-xs">
                        <div class="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Clientes:</span>
                            <span class="font-medium">${stats.sqlite?.clientes || 0}</span>
                        </div>
                        <div class="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Bicicletas:</span>
                            <span class="font-medium">${stats.sqlite?.bicicletas || 0}</span>
                        </div>
                        <div class="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Registros:</span>
                            <span class="font-medium">${stats.sqlite?.registros || 0}</span>
                        </div>
                    </div>
                </div>
                
                <div class="border-2 rounded-lg p-4 cursor-pointer transition-all ${!sqliteActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-200 dark:border-slate-600 hover:border-blue-300'}" data-mode="json">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2">
                            <i data-lucide="file-json" class="w-5 h-5 ${!sqliteActive ? 'text-blue-600' : 'text-slate-400'}"></i>
                            <span class="font-semibold ${!sqliteActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'}">Arquivos JSON</span>
                        </div>
                        ${!sqliteActive ? '<span class="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full">Ativo</span>' : ''}
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 mb-3">Arquivos separados por pasta. Compatível com versões antigas.</p>
                    <div class="space-y-1 text-xs">
                        <div class="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Clientes:</span>
                            <span class="font-medium">${stats.json?.clientes || 0}</span>
                        </div>
                        <div class="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Bicicletas:</span>
                            <span class="font-medium">${stats.json?.bicicletas || 0}</span>
                        </div>
                        <div class="flex justify-between text-slate-600 dark:text-slate-400">
                            <span>Registros:</span>
                            <span class="font-medium">${stats.json?.registros || 0}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flex items-center justify-between bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg">
                <div class="text-xs text-slate-600 dark:text-slate-400">
                    <span>Última migração: </span>
                    <span class="font-medium">${lastMigration}</span>
                    ${stats.migration_status && stats.migration_status !== 'idle' ? `<span class="ml-2 text-yellow-600">(${stats.migration_status})</span>` : ''}
                </div>
                ${canStorageGerenciar ? `
                <div class="flex gap-2">
                    <button id="migrate-to-sqlite-btn" class="text-xs px-3 py-1.5 rounded-md transition-colors ${sqliteActive ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700'}" ${sqliteActive ? 'disabled' : ''}>
                        <i data-lucide="arrow-right" class="w-3 h-3 inline mr-1"></i>
                        Migrar para SQLite
                    </button>
                    <button id="migrate-to-json-btn" class="text-xs px-3 py-1.5 rounded-md transition-colors ${!sqliteActive ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}" ${!sqliteActive ? 'disabled' : ''}>
                        <i data-lucide="arrow-right" class="w-3 h-3 inline mr-1"></i>
                        Migrar para JSON
                    </button>
                </div>
                ` : ''}
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
        
        const sqliteCard = container.querySelector('[data-mode="sqlite"]');
        const jsonCard = container.querySelector('[data-mode="json"]');
        const migrateToSqliteBtn = document.getElementById('migrate-to-sqlite-btn');
        const migrateToJsonBtn = document.getElementById('migrate-to-json-btn');
        
        sqliteCard?.addEventListener('click', () => {
            if (!sqliteActive) this.changeStorageMode('sqlite');
        });
        
        jsonCard?.addEventListener('click', () => {
            if (sqliteActive) this.changeStorageMode('json');
        });
        
        migrateToSqliteBtn?.addEventListener('click', () => {
            if (!sqliteActive) this.confirmMigration('json_to_sqlite');
        });
        
        migrateToJsonBtn?.addEventListener('click', () => {
            if (sqliteActive) this.confirmMigration('sqlite_to_json');
        });
    }
    
    async changeStorageMode(newMode) {
        const confirmed = await Modals.confirm(
            `Deseja alterar o modo de armazenamento para ${newMode === 'sqlite' ? 'SQLite' : 'Arquivos JSON'}?`,
            'Alterar Modo de Armazenamento'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await fetch('/api/storage-mode', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ mode: newMode })
            });
            
            if (response.ok) {
                Modals.alert(`Modo alterado para ${newMode === 'sqlite' ? 'SQLite' : 'JSON'} com sucesso!`, 'Sucesso', 'check-circle');
                this.loadStorageModeSettings();
            } else {
                const error = await response.json();
                Modals.alert(`Erro ao alterar modo: ${error.error}`, 'Erro', 'alert-circle');
            }
        } catch (error) {
            console.error('Erro ao alterar modo:', error);
            Modals.alert('Erro ao conectar com o servidor.', 'Erro', 'alert-circle');
        }
    }
    
    async confirmMigration(direction) {
        const isToSqlite = direction === 'json_to_sqlite';
        const title = isToSqlite ? 'Migrar para SQLite' : 'Migrar para JSON';
        const message = isToSqlite
            ? 'Esta ação irá copiar todos os dados dos arquivos JSON para o banco de dados SQLite. Um backup será criado automaticamente. Deseja continuar?'
            : 'Esta ação irá exportar todos os dados do SQLite para arquivos JSON. Um backup será criado automaticamente. Deseja continuar?';
        
        const confirmed = await Modals.confirm(message, title);
        if (!confirmed) return;
        
        const container = document.getElementById('storage-mode-container');
        container.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <div class="text-center">
                    <i data-lucide="loader-2" class="w-8 h-8 animate-spin text-purple-600 mx-auto mb-3"></i>
                    <p class="text-slate-600 dark:text-slate-400">Migrando dados... Por favor, aguarde.</p>
                </div>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        
        try {
            const response = await fetch('/api/migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction })
            });
            
            if (!response.ok) {
                const error = await response.json();
                Modals.alert(`Erro na migração: ${error.error || 'Serviço indisponível'}`, 'Erro', 'alert-circle');
                this.loadStorageModeSettings();
                return;
            }
            
            const result = await response.json();
            
            if (result.success) {
                const oldMode = isToSqlite ? 'json' : 'sqlite';
                const newMode = isToSqlite ? 'sqlite' : 'json';
                await fetch('/api/storage-mode', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ mode: newMode })
                });
                
                logAction('change_storage', 'sistema', null, { 
                    de: oldMode, 
                    para: newMode,
                    clientesMigrados: result.migrated?.clientes || 0,
                    registrosMigrados: result.migrated?.registros || 0
                });
                
                Modals.alert(
                    `Migração concluída com sucesso!\n\nClientes migrados: ${result.migrated?.clientes || 0}\nBicicletas migradas: ${result.migrated?.bicicletas || 0}\nRegistros migrados: ${result.migrated?.registros || 0}`,
                    'Migração Concluída',
                    'check-circle'
                );
            } else {
                Modals.alert(
                    `Migração concluída com alguns erros:\n\n${result.errors?.slice(0, 5).join('\n') || 'Erro desconhecido'}`,
                    'Migração com Erros',
                    'alert-triangle'
                );
            }
            
            this.loadStorageModeSettings();
        } catch (error) {
            console.error('Erro na migração:', error);
            Modals.alert('Erro ao executar a migração. Verifique os logs do servidor.', 'Erro', 'alert-circle');
            this.loadStorageModeSettings();
        }
    }
    
    // ==================== BACKUP MANAGEMENT ====================
    
    async loadBackupManagement() {
        const container = document.getElementById('backup-management-container');
        if (!container) return;
        
        container.innerHTML = `
            <div class="flex items-center justify-center py-8">
                <i data-lucide="loader-2" class="w-6 h-6 animate-spin text-blue-600"></i>
                <span class="ml-2 text-slate-600 dark:text-slate-400">Carregando...</span>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
        
        // Check if running in Electron (desktop mode)
        const isDesktop = window.AppPlatform && typeof window.AppPlatform.isDesktop === 'function' && window.AppPlatform.isDesktop();
        
        if (isDesktop) {
            // Desktop mode - use Electron IPC to list backups
            try {
                await this.loadDesktopBackupManagement(container);
            } catch (error) {
                console.error('Erro ao carregar backups (desktop):', error);
                this.renderDesktopBackupError(container);
            }
            return;
        }
        
        // Browser mode - use HTTP API
        try {
            const [backupsResponse, settingsResponse] = await Promise.all([
                fetch('/api/backups'),
                fetch('/api/backup/settings')
            ]);
            
            if (!backupsResponse.ok || !settingsResponse.ok) {
                throw new Error('API not available');
            }
            
            const backups = await backupsResponse.json();
            const settings = await settingsResponse.json();
            
            this.renderBackupManagement(backups, settings);
        } catch (error) {
            console.error('Erro ao carregar backups:', error);
            container.innerHTML = `
                <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg">
                    <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                        <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                        <span class="font-medium">Gerenciamento de backup indisponível</span>
                    </div>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                        O servidor não está disponível para gerenciar backups.
                    </p>
                </div>
            `;
            if (window.lucide) lucide.createIcons();
        }
    }
    
    renderBackupManagement(backups, settings) {
        const container = document.getElementById('backup-management-container');
        if (!container) return;
        
        const canBackupGerenciar = Auth.hasPermission('configuracao', 'backupGerenciar');
        
        const intervalLabels = {
            'daily': 'Diário',
            'weekly': 'Semanal',
            'monthly': 'Mensal'
        };
        
        const backupsList = backups.length > 0 ? backups.map(backup => {
            const date = new Date(backup.created_at);
            const formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
            return `
                <div class="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <i data-lucide="file-archive" class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"></i>
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">${backup.filename}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400">${formattedDate} • ${backup.size_formatted}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        ${canBackupGerenciar ? `
                        <button class="backup-restore-btn p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" data-filename="${backup.filename}" title="Restaurar">
                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                        <button class="backup-download-btn p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" data-filename="${backup.filename}" title="Download">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                        ${canBackupGerenciar ? `
                        <button class="backup-delete-btn p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" data-filename="${backup.filename}" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('') : `
            <div class="text-center py-6 text-slate-500 dark:text-slate-400">
                <i data-lucide="archive" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">Nenhum backup disponível</p>
            </div>
        `;
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Ações de Backup -->
                ${canBackupGerenciar ? `
                <div class="flex flex-wrap gap-3">
                    <button id="create-backup-btn" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        Criar Backup Agora
                    </button>
                    <label class="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors">
                        <i data-lucide="upload" class="w-4 h-4"></i>
                        Importar Backup
                        <input type="file" id="backup-upload-input" accept=".json" class="hidden">
                    </label>
                </div>
                ` : ''}
                
                <!-- Lista de Backups -->
                <div>
                    <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <i data-lucide="folder-archive" class="w-4 h-4"></i>
                        Backups Disponíveis (${backups.length})
                    </h4>
                    <div id="backups-list" class="space-y-2 max-h-[300px] overflow-y-auto">
                        ${backupsList}
                    </div>
                </div>
                
                <!-- Configurações de Backup Automático -->
                ${canBackupGerenciar ? `
                <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        Backup Automático
                    </h4>
                    <div class="space-y-4">
                        <label class="flex items-center gap-3">
                            <input type="checkbox" id="backup-auto-enabled" ${settings.enabled ? 'checked' : ''} class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm text-slate-700 dark:text-slate-300">Ativar backup automático</span>
                        </label>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Intervalo</label>
                                <select id="backup-interval" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                    <option value="daily" ${settings.interval === 'daily' ? 'selected' : ''}>Diário</option>
                                    <option value="weekly" ${settings.interval === 'weekly' ? 'selected' : ''}>Semanal</option>
                                    <option value="monthly" ${settings.interval === 'monthly' ? 'selected' : ''}>Mensal</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Máximo de backups a manter</label>
                                <input type="number" id="backup-max-count" value="${settings.max_backups || 10}" min="1" max="50" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            </div>
                        </div>
                        
                        <button id="save-backup-settings-btn" class="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                            <i data-lucide="save" class="w-4 h-4"></i>
                            Salvar Configurações
                        </button>
                        
                        ${settings.last_backup ? `
                            <p class="text-xs text-slate-500 dark:text-slate-400">
                                Último backup automático: ${new Date(settings.last_backup).toLocaleDateString('pt-BR')} às ${new Date(settings.last_backup).toLocaleTimeString('pt-BR')}
                            </p>
                        ` : ''}
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
        this.setupBackupEventListeners();
    }
    
    setupBackupEventListeners() {
        document.getElementById('create-backup-btn')?.addEventListener('click', () => this.createBackup());
        
        document.getElementById('backup-upload-input')?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.uploadBackup(e.target.files[0]);
            }
        });
        
        document.getElementById('save-backup-settings-btn')?.addEventListener('click', () => this.saveBackupSettings());
        
        document.querySelectorAll('.backup-restore-btn').forEach(btn => {
            btn.addEventListener('click', () => this.restoreBackup(btn.dataset.filename));
        });
        
        document.querySelectorAll('.backup-download-btn').forEach(btn => {
            btn.addEventListener('click', () => this.downloadBackup(btn.dataset.filename));
        });
        
        document.querySelectorAll('.backup-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => this.deleteBackup(btn.dataset.filename));
        });
    }
    
    async createBackup() {
        const btn = document.getElementById('create-backup-btn');
        if (!btn) {
            console.error('Botão de criar backup não encontrado');
            Modals.alert('Erro: Botão de criar backup não encontrado', 'Erro', 'alert-circle');
            return;
        }
        
        const originalContent = btn.innerHTML;
        btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Criando...';
        btn.disabled = true;
        if (window.lucide) lucide.createIcons();
        
        try {
            const response = await fetch('/api/backup', { method: 'POST' });
            const result = await response.json();
            
            if (response.ok && result.success) {
                logAction('create', 'backup', result.filename, { 
                    tipo: 'manual',
                    clientes: result.stats?.clientes || 0,
                    registros: result.stats?.registros || 0
                });
                Modals.alert(
                    `Backup criado com sucesso!\n\nArquivo: ${result.filename}\nClientes: ${result.stats?.clientes || 0}\nRegistros: ${result.stats?.registros || 0}\nCategorias: ${result.stats?.categorias || 0}`,
                    'Backup Criado',
                    'check-circle'
                );
                this.loadBackupManagement();
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            Modals.alert('Erro ao criar backup: ' + error.message, 'Erro', 'alert-circle');
            if (btn) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        }
    }
    
    async restoreBackup(filename) {
        const confirmed = await Modals.confirm(
            `Deseja restaurar o backup "${filename}"?\n\nAVISO: Os dados atuais serão substituídos pelos dados do backup.`,
            'Restaurar Backup'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await fetch('/api/backup/restore', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ filename })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                logAction('restore', 'backup', filename, { 
                    tipo: 'restauracao',
                    clientes: result.restored?.clientes || 0,
                    registros: result.restored?.registros || 0
                });
                Modals.alert(
                    `Backup restaurado com sucesso!\n\nClientes: ${result.restored?.clientes || 0}\nRegistros: ${result.restored?.registros || 0}\nCategorias: ${result.restored?.categorias || 0}\nUsuários: ${result.restored?.usuarios || 0}`,
                    'Backup Restaurado',
                    'check-circle'
                );
                
                if (this.app && this.app.loadData) {
                    await this.app.loadData();
                }
            } else {
                const errors = result.errors?.slice(0, 3).join('\n') || 'Erro desconhecido';
                Modals.alert(`Erro ao restaurar backup:\n\n${errors}`, 'Erro', 'alert-circle');
            }
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            Modals.alert('Erro ao restaurar backup: ' + error.message, 'Erro', 'alert-circle');
        }
    }
    
    async downloadBackup(filename) {
        try {
            const response = await fetch(`/api/backup/download/${filename}`);
            
            if (!response.ok) {
                throw new Error('Falha ao baixar backup');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            a.remove();
        } catch (error) {
            console.error('Erro ao baixar backup:', error);
            Modals.alert('Erro ao baixar backup: ' + error.message, 'Erro', 'alert-circle');
        }
    }
    
    async deleteBackup(filename) {
        const confirmed = await Modals.confirm(
            `Deseja excluir o backup "${filename}"?\n\nEsta ação não pode ser desfeita.`,
            'Excluir Backup'
        );
        
        if (!confirmed) return;
        
        try {
            const response = await fetch(`/api/backup/${filename}`, { method: 'DELETE' });
            const result = await response.json();
            
            if (response.ok && result.success) {
                logAction('delete', 'backup', filename, {});
                Modals.alert('Backup excluído com sucesso!', 'Sucesso', 'check-circle');
                this.loadBackupManagement();
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro ao excluir backup:', error);
            Modals.alert('Erro ao excluir backup: ' + error.message, 'Erro', 'alert-circle');
        }
    }
    
    async uploadBackup(file) {
        try {
            const text = await file.text();
            const backupData = JSON.parse(text);
            
            if (!backupData.data) {
                throw new Error('Estrutura de backup inválida');
            }
            
            const response = await fetch('/api/backup/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    backup_data: backupData,
                    filename: file.name
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                logAction('import', 'backup', result.filename, { 
                    tipo: 'upload'
                });
                Modals.alert(`Backup importado com sucesso!\n\nArquivo salvo: ${result.filename}`, 'Sucesso', 'check-circle');
                this.loadBackupManagement();
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            Modals.alert('Erro ao importar backup: ' + error.message, 'Erro', 'alert-circle');
        }
        
        document.getElementById('backup-upload-input').value = '';
    }
    
    async saveBackupSettings() {
        const enabled = document.getElementById('backup-auto-enabled')?.checked || false;
        const interval = document.getElementById('backup-interval')?.value || 'daily';
        const maxBackups = parseInt(document.getElementById('backup-max-count')?.value) || 10;
        
        try {
            const response = await fetch('/api/backup/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    enabled,
                    interval,
                    max_backups: maxBackups
                })
            });
            
            const result = await response.json();
            
            if (response.ok && result.success) {
                logAction('edit', 'configuracao', null, { 
                    tipo: 'backup_automatico',
                    habilitado: enabled,
                    intervalo: interval,
                    maxBackups: maxBackups
                });
                Modals.alert('Configurações de backup salvas com sucesso!', 'Sucesso', 'check-circle');
            } else {
                throw new Error(result.error || 'Erro desconhecido');
            }
        } catch (error) {
            console.error('Erro ao salvar configurações:', error);
            Modals.alert('Erro ao salvar configurações: ' + error.message, 'Erro', 'alert-circle');
        }
    }
    
    // ==================== DESKTOP BACKUP MANAGEMENT ====================
    
    async loadDesktopBackupManagement(container) {
        // In desktop mode, backups are stored in dados/database/backups/
        try {
            // Check if Electron IPC is available
            if (!window.electronAPI || typeof window.electronAPI.listBackups !== 'function') {
                console.warn('Electron IPC not available for backup listing');
                this.renderDesktopBackupManagement(container, []);
                return;
            }
            
            // Use Electron IPC to list backup files
            const backups = await window.electronAPI.listBackups();
            this.renderDesktopBackupManagement(container, backups || []);
        } catch (error) {
            console.warn('Backup listing not available via IPC, using simple UI:', error);
            this.renderDesktopBackupManagement(container, []);
        }
    }
    
    renderDesktopBackupManagement(container, backups) {
        const canBackupGerenciar = Auth.hasPermission('configuracao', 'backupGerenciar');
        
        const backupsList = backups && backups.length > 0 ? backups.map(backup => {
            const dateValue = backup.created_at || backup.timestamp;
            let formattedDate = 'Data desconhecida';
            
            if (dateValue) {
                const date = new Date(dateValue);
                if (!isNaN(date.getTime())) {
                    formattedDate = date.toLocaleDateString('pt-BR') + ' ' + date.toLocaleTimeString('pt-BR');
                }
            }
            
            return `
                <div class="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-colors">
                    <div class="flex items-center gap-3 flex-1 min-w-0">
                        <i data-lucide="file-archive" class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0"></i>
                        <div class="min-w-0">
                            <p class="text-sm font-medium text-slate-800 dark:text-slate-200 truncate">${backup.filename || backup.name}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400">${formattedDate}${backup.size_formatted ? ' • ' + backup.size_formatted : ''}</p>
                        </div>
                    </div>
                    <div class="flex items-center gap-1 flex-shrink-0">
                        ${canBackupGerenciar ? `
                        <button class="desktop-backup-restore-btn p-2 text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors" data-filename="${backup.filename || backup.name}" title="Restaurar">
                            <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                        <button class="desktop-backup-download-btn p-2 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors" data-filename="${backup.filename || backup.name}" title="Download">
                            <i data-lucide="download" class="w-4 h-4"></i>
                        </button>
                        ${canBackupGerenciar ? `
                        <button class="desktop-backup-delete-btn p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" data-filename="${backup.filename || backup.name}" title="Excluir">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('') : `
            <div class="text-center py-6 text-slate-500 dark:text-slate-400">
                <i data-lucide="archive" class="w-10 h-10 mx-auto mb-2 opacity-50"></i>
                <p class="text-sm">Nenhum backup disponível</p>
            </div>
        `;
        
        container.innerHTML = `
            <div class="space-y-6">
                <!-- Ações de Backup -->
                ${canBackupGerenciar ? `
                <div class="flex flex-wrap gap-3">
                    <button id="desktop-create-backup-btn" class="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                        <i data-lucide="plus" class="w-4 h-4"></i>
                        Criar Backup Agora
                    </button>
                    <label class="flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg cursor-pointer transition-colors">
                        <i data-lucide="upload" class="w-4 h-4"></i>
                        Importar Backup
                        <input type="file" id="desktop-backup-upload-input" accept=".json" class="hidden">
                    </label>
                </div>
                ` : ''}
                
                <!-- Lista de Backups -->
                <div>
                    <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                        <i data-lucide="folder-archive" class="w-4 h-4"></i>
                        Backups Disponíveis (${backups ? backups.length : 0})
                    </h4>
                    <div id="desktop-backups-list" class="space-y-2 max-h-[300px] overflow-y-auto">
                        ${backupsList}
                    </div>
                </div>
                
                <!-- Configurações de Backup Automático -->
                ${canBackupGerenciar ? `
                <div class="pt-4 border-t border-slate-200 dark:border-slate-700">
                    <h4 class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        Backup Automático
                    </h4>
                    <div class="space-y-4">
                        <label class="flex items-center gap-3">
                            <input type="checkbox" id="desktop-backup-auto-enabled" class="w-4 h-4 rounded border-slate-300 dark:border-slate-600 text-blue-600 focus:ring-blue-500">
                            <span class="text-sm text-slate-700 dark:text-slate-300">Ativar backup automático</span>
                        </label>
                        
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Intervalo</label>
                                <select id="desktop-backup-interval" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                                    <option value="daily">Diário</option>
                                    <option value="weekly">Semanal</option>
                                    <option value="monthly">Mensal</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1">Máximo de backups a manter</label>
                                <input type="number" id="desktop-backup-max-count" min="1" max="50" class="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                            </div>
                        </div>
                        
                        <button id="desktop-save-backup-settings-btn" class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm">
                            Salvar Configurações
                        </button>
                    </div>
                </div>
                ` : ''}
            </div>
        `;
        
        if (window.lucide) lucide.createIcons();
        
        // Load backup settings
        this.loadDesktopBackupSettings();
        
        // Add event listeners
        this.attachDesktopBackupEventListeners();
    }
    
    renderDesktopBackupError(container) {
        container.innerHTML = `
            <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 p-4 rounded-lg">
                <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200">
                    <i data-lucide="alert-triangle" class="w-5 h-5"></i>
                    <span class="font-medium">Erro ao carregar backups</span>
                </div>
                <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    Não foi possível listar os backups. Use as funções de exportação manual.
                </p>
            </div>
        `;
        if (window.lucide) lucide.createIcons();
    }
    
    async loadDesktopBackupSettings() {
        if (!window.electronAPI || typeof window.electronAPI.loadBackupSettings !== 'function') {
            return;
        }
        
        try {
            const settings = await window.electronAPI.loadBackupSettings();
            
            const enabledCheckbox = document.getElementById('desktop-backup-auto-enabled');
            const intervalSelect = document.getElementById('desktop-backup-interval');
            const maxCountInput = document.getElementById('desktop-backup-max-count');
            
            if (enabledCheckbox) {
                enabledCheckbox.checked = settings.enabled || false;
            }
            
            if (intervalSelect) {
                intervalSelect.value = settings.interval || 'daily';
            }
            
            if (maxCountInput) {
                maxCountInput.value = settings.max_backups || ConfiguracaoManager.BACKUP_MAX_COUNT_DEFAULT;
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de backup:', error);
        }
    }
    
    attachDesktopBackupEventListeners() {
        const self = this;
        
        // Create backup button
        const createBtn = document.getElementById('desktop-create-backup-btn');
        if (createBtn) {
            createBtn.addEventListener('click', () => this.handleDesktopCreateBackup());
        }
        
        // Import backup button
        const uploadInput = document.getElementById('desktop-backup-upload-input');
        if (uploadInput) {
            uploadInput.addEventListener('change', (e) => this.handleDesktopImportBackup(e));
        }
        
        // Save settings button
        const saveSettingsBtn = document.getElementById('desktop-save-backup-settings-btn');
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.handleDesktopSaveBackupSettings());
        }
        
        // Restore buttons
        document.querySelectorAll('.desktop-backup-restore-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const filename = this.getAttribute('data-filename');
                self.handleDesktopRestoreBackup(filename);
            });
        });
        
        // Download buttons
        document.querySelectorAll('.desktop-backup-download-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const filename = this.getAttribute('data-filename');
                self.handleDesktopDownloadBackup(filename);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.desktop-backup-delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const filename = this.getAttribute('data-filename');
                self.handleDesktopDeleteBackup(filename);
            });
        });
    }
    
    async handleDesktopCreateBackup() {
        if (!window.electronAPI || typeof window.electronAPI.createBackup !== 'function') {
            Modals.alert('Funcionalidade de criar backup não disponível', 'Erro');
            return;
        }
        
        const btn = document.getElementById('desktop-create-backup-btn');
        const originalContent = btn ? btn.innerHTML : null;
        
        if (btn) {
            btn.innerHTML = '<i data-lucide="loader-2" class="w-4 h-4 animate-spin"></i> Criando...';
            btn.disabled = true;
            if (window.lucide) lucide.createIcons();
        }
        
        try {
            const result = await window.electronAPI.createBackup();
            
            if (result.success) {
                Modals.alert(`Backup criado com sucesso: ${result.filename}`, 'Sucesso');
                // Reload backup list
                const container = document.getElementById('backup-management-container');
                if (container) {
                    await this.loadDesktopBackupManagement(container);
                }
            } else {
                Modals.alert(`Erro ao criar backup: ${result.error}`, 'Erro');
            }
        } catch (error) {
            console.error('Erro ao criar backup:', error);
            Modals.alert(`Erro ao criar backup: ${error.message}`, 'Erro');
        } finally {
            if (btn && originalContent) {
                btn.innerHTML = originalContent;
                btn.disabled = false;
                if (window.lucide) lucide.createIcons();
            }
        }
    }
    
    async handleDesktopRestoreBackup(filename) {
        if (!window.electronAPI || typeof window.electronAPI.restoreBackup !== 'function') {
            Modals.alert('Funcionalidade de restaurar backup não disponível', 'Erro');
            return;
        }
        
        const confirmed = await Modals.showConfirm(
            `Tem certeza que deseja restaurar o backup "${filename}"?\n\nEsta ação irá substituir todos os dados atuais!`
        );
        
        if (!confirmed) return;
        
        try {
            const result = await window.electronAPI.restoreBackup(filename);
            
            if (result.success) {
                const message = `Backup restaurado com sucesso!\n\n` +
                    `Clientes: ${result.stats.clients}\n` +
                    `Registros: ${result.stats.registros}\n` +
                    `Categorias: ${result.stats.categorias}\n\n` +
                    `A página será recarregada.`;
                
                Modals.alert(message, 'Sucesso');
                
                // Reload page after a short delay
                setTimeout(() => {
                    window.location.reload();
                }, 2000);
            } else {
                Modals.alert(`Erro ao restaurar backup: ${result.error}`, 'Erro');
            }
        } catch (error) {
            console.error('Erro ao restaurar backup:', error);
            Modals.alert(`Erro ao restaurar backup: ${error.message}`, 'Erro');
        }
    }
    
    async handleDesktopDownloadBackup(filename) {
        if (!window.electronAPI || typeof window.electronAPI.downloadBackup !== 'function') {
            Modals.alert('Funcionalidade de download de backup não disponível', 'Erro');
            return;
        }
        
        try {
            const result = await window.electronAPI.downloadBackup(filename);
            
            if (result.success) {
                // Create a download link
                const blob = new Blob([result.data], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = filename;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                URL.revokeObjectURL(url);
                
                Modals.alert(`Backup baixado com sucesso: ${filename}`, 'Sucesso');
            } else {
                Modals.alert(`Erro ao baixar backup: ${result.error}`, 'Erro');
            }
        } catch (error) {
            console.error('Erro ao baixar backup:', error);
            Modals.alert(`Erro ao baixar backup: ${error.message}`, 'Erro');
        }
    }
    
    async handleDesktopDeleteBackup(filename) {
        if (!window.electronAPI || typeof window.electronAPI.deleteBackup !== 'function') {
            Modals.alert('Funcionalidade de excluir backup não disponível', 'Erro');
            return;
        }
        
        const confirmed = await Modals.showConfirm(
            `Tem certeza que deseja excluir o backup "${filename}"?\n\nEsta ação não pode ser desfeita!`
        );
        
        if (!confirmed) return;
        
        try {
            const result = await window.electronAPI.deleteBackup(filename);
            
            if (result.success) {
                Modals.alert(`Backup excluído com sucesso: ${filename}`, 'Sucesso');
                // Reload backup list
                const container = document.getElementById('backup-management-container');
                if (container) {
                    await this.loadDesktopBackupManagement(container);
                }
            } else {
                Modals.alert(`Erro ao excluir backup: ${result.error}`, 'Erro');
            }
        } catch (error) {
            console.error('Erro ao excluir backup:', error);
            Modals.alert(`Erro ao excluir backup: ${error.message}`, 'Erro');
        }
    }
    
    async handleDesktopImportBackup(event) {
        if (!window.electronAPI || typeof window.electronAPI.importBackup !== 'function') {
            Modals.alert('Funcionalidade de importar backup não disponível', 'Erro');
            return;
        }
        
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const backupData = e.target.result;
                    const result = await window.electronAPI.importBackup(backupData);
                    
                    if (result.success) {
                        Modals.alert(`Backup importado com sucesso: ${result.filename}`, 'Sucesso');
                        // Reload backup list
                        const container = document.getElementById('backup-management-container');
                        if (container) {
                            await this.loadDesktopBackupManagement(container);
                        }
                    } else {
                        Modals.alert(`Erro ao importar backup: ${result.error}`, 'Erro');
                    }
                } catch (error) {
                    console.error('Erro ao processar arquivo de backup:', error);
                    Modals.alert(`Erro ao processar arquivo: ${error.message}`, 'Erro');
                }
                
                // Clear file input
                event.target.value = '';
            };
            
            reader.onerror = () => {
                Modals.alert('Erro ao ler arquivo de backup', 'Erro');
                event.target.value = '';
            };
            
            reader.readAsText(file);
        } catch (error) {
            console.error('Erro ao importar backup:', error);
            Modals.alert(`Erro ao importar backup: ${error.message}`, 'Erro');
        }
    }
    
    async handleDesktopSaveBackupSettings() {
        if (!window.electronAPI || typeof window.electronAPI.saveBackupSettings !== 'function') {
            Modals.alert('Funcionalidade de salvar configurações não disponível', 'Erro');
            return;
        }
        
        try {
            const enabledCheckbox = document.getElementById('desktop-backup-auto-enabled');
            const intervalSelect = document.getElementById('desktop-backup-interval');
            const maxCountInput = document.getElementById('desktop-backup-max-count');
            
            // Parse and validate max_backups value
            let maxBackups = ConfiguracaoManager.BACKUP_MAX_COUNT_DEFAULT;
            if (maxCountInput && maxCountInput.value) {
                const parsed = parseInt(maxCountInput.value, 10);
                if (!isNaN(parsed) && parsed >= ConfiguracaoManager.BACKUP_MAX_COUNT_MIN && parsed <= ConfiguracaoManager.BACKUP_MAX_COUNT_MAX) {
                    maxBackups = parsed;
                }
            }
            
            const settings = {
                enabled: enabledCheckbox ? enabledCheckbox.checked : false,
                interval: intervalSelect ? intervalSelect.value : 'daily',
                max_backups: maxBackups
            };
            
            const result = await window.electronAPI.saveBackupSettings(settings);
            
            if (result.success) {
                Modals.alert('Configurações de backup salvas com sucesso!', 'Sucesso');
            } else {
                Modals.alert(`Erro ao salvar configurações: ${result.error}`, 'Erro');
            }
        } catch (error) {
            console.error('Erro ao salvar configurações de backup:', error);
            Modals.alert(`Erro ao salvar configurações: ${error.message}`, 'Erro');
        }
    }
}
