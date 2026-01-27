/**
 * Módulo de Gerenciamento de Usuários
 * Permite ao administrador gerenciar funcionários e suas permissões
 */

import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';
import { AuditLogger, logAction } from '../shared/audit-logger.js';
import { Utils } from '../shared/utils.js';

export class Usuarios {
    static init() {
        const usersTab = document.getElementById('usuarios-tab-content');
        if (!usersTab) return;

        this.renderUserList();
        this.setupEventListeners();

        if (document.getElementById('audit-logs-list')) {
            this.initAuditReport();
        }
    }

    static setupEventListeners() {
        const addUserBtn = document.getElementById('add-user-btn');
        if (addUserBtn) {
            addUserBtn.addEventListener('click', () => this.showAddUserModal());
        }

        const auditStartDate = document.getElementById('audit-start-date');
        const auditEndDate = document.getElementById('audit-end-date');
        const auditUserFilter = document.getElementById('audit-user-filter');
        const auditClearFilters = document.getElementById('audit-clear-filters');
        const exportAuditExcelBtn = document.getElementById('export-audit-excel-btn');
        const exportAuditExcelMenu = document.getElementById('export-audit-excel-menu');
        const exportAuditXLSX = document.getElementById('export-audit-xlsx');
        const exportAuditCSV = document.getElementById('export-audit-csv');
        const exportAuditPDF = document.getElementById('export-audit-pdf');

        if (auditStartDate) {
            auditStartDate.addEventListener('change', () => this.applyAuditFilters());
        }
        if (auditEndDate) {
            auditEndDate.addEventListener('change', () => this.applyAuditFilters());
        }
        if (auditUserFilter) {
            auditUserFilter.addEventListener('change', () => this.applyAuditFilters());
        }
        if (auditClearFilters) {
            auditClearFilters.addEventListener('click', () => this.clearAuditFilters());
        }
        if (exportAuditExcelBtn && exportAuditExcelMenu) {
            exportAuditExcelBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                exportAuditExcelMenu.classList.toggle('hidden');
            });
            document.addEventListener('click', (e) => {
                if (!exportAuditExcelBtn.contains(e.target) && !exportAuditExcelMenu.contains(e.target)) {
                    exportAuditExcelMenu.classList.add('hidden');
                }
            });
        }
        if (exportAuditXLSX) {
            exportAuditXLSX.addEventListener('click', () => {
                document.getElementById('export-audit-excel-menu')?.classList.add('hidden');
                this.exportAuditToExcel();
            });
        }
        if (exportAuditCSV) {
            exportAuditCSV.addEventListener('click', () => {
                document.getElementById('export-audit-excel-menu')?.classList.add('hidden');
                this.exportAuditToCSV();
            });
        }
        if (exportAuditPDF) {
            exportAuditPDF.addEventListener('click', () => this.exportAuditToPDF());
        }
    }

    static renderUserList() {
        const container = document.getElementById('users-list');
        if (!container) return;

        const users = Auth.getAllUsers();
        const currentSession = Auth.getCurrentSession();

        if (users.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                    <p>Nenhum usuário cadastrado</p>
                </div>
            `;
            return;
        }

        container.innerHTML = users.map(user => `
            <div class="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
                <div class="flex items-center justify-between">
                    <div class="flex-1">
                        <div class="flex items-center space-x-3">
                            <div class="flex-shrink-0">
                                <div class="w-10 h-10 rounded-full ${user.tipo === 'dono' ? 'bg-yellow-100 dark:bg-yellow-900' : 'bg-blue-100 dark:bg-blue-900'} flex items-center justify-center">
                                    <i data-lucide="${user.tipo === 'dono' ? 'crown' : user.tipo === 'admin' ? 'shield' : 'user'}" class="w-5 h-5 ${user.tipo === 'dono' ? 'text-yellow-600 dark:text-yellow-400' : 'text-blue-600 dark:text-blue-400'}"></i>
                                </div>
                            </div>
                            <div>
                                <h3 class="font-semibold text-slate-800 dark:text-slate-200">${user.nome}</h3>
                                <p class="text-sm text-slate-500 dark:text-slate-400">@${user.username}</p>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-center space-x-2">
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${user.tipo === 'dono'
                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                : user.tipo === 'admin'
                    ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                    : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
            }">
                            ${user.tipo === 'dono' ? 'Dono' : user.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
                        </span>
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${user.ativo
                ? 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
            }">
                            ${user.ativo ? 'Ativo' : 'Inativo'}
                        </span>
                    </div>
                </div>
                
                <div class="mt-4 grid grid-cols-4 gap-4 text-sm">
                    <div>
                        <p class="text-slate-500 dark:text-slate-400">Clientes</p>
                        <p class="font-medium text-slate-700 dark:text-slate-300">
                            ${this.formatPermissions(user.permissoes.clientes)}
                        </p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400">Registros</p>
                        <p class="font-medium text-slate-700 dark:text-slate-300">
                            ${this.formatPermissions(user.permissoes.registros)}
                        </p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400">Dados</p>
                        <p class="font-medium text-slate-700 dark:text-slate-300">
                            ${this.formatPermissions(user.permissoes.dados || {})}
                        </p>
                    </div>
                    <div>
                        <p class="text-slate-500 dark:text-slate-400">Configuração</p>
                        <p class="font-medium text-slate-700 dark:text-slate-300">
                            ${this.formatPermissions(user.permissoes.configuracao)}
                        </p>
                    </div>
                </div>

                <div class="mt-4 flex space-x-2">
                    <button onclick="Usuarios.editUser('${user.id}')" class="flex-1 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                        <i data-lucide="edit" class="w-4 h-4 inline mr-1"></i>
                        Editar
                    </button>
                    <button onclick="Usuarios.toggleUserStatus('${user.id}')" class="flex-1 px-3 py-2 text-sm ${user.ativo
                ? 'bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 hover:bg-orange-100 dark:hover:bg-orange-900/50'
                : 'bg-green-50 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/50'
            } rounded-lg transition-colors">
                        <i data-lucide="${user.ativo ? 'user-x' : 'user-check'}" class="w-4 h-4 inline mr-1"></i>
                        ${user.ativo ? 'Desativar' : 'Ativar'}
                    </button>
                    ${user.id !== currentSession?.userId ? `
                        <button onclick="Usuarios.deleteUser('${user.id}')" class="px-3 py-2 text-sm bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                            <i data-lucide="trash-2" class="w-4 h-4"></i>
                        </button>
                    ` : ''}
                </div>
            </div>
        `).join('');

        lucide.createIcons();
    }

    static formatPermissions(permissoes) {
        const active = Object.entries(permissoes).filter(([key, value]) => value === true).length;
        const total = Object.keys(permissoes).length;
        return `${active}/${total} permissões`;
    }

    static showAddUserModal() {
        const modalContent = `
            <form id="user-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome Completo</label>
                    <input type="text" id="user-nome" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome de Usuário</label>
                    <input type="text" id="user-username" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Senha</label>
                    <input type="password" id="user-password" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Tipo de Usuário</label>
                    <select id="user-tipo" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                        <option value="funcionario">Funcionário</option>
                        <option value="admin">Administrador</option>
                        <option value="dono">Dono</option>
                    </select>
                </div>
                
                <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 class="font-medium text-slate-700 dark:text-slate-300 mb-4">Permissões por Aba</h4>
                    
                    <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        <!-- Clientes -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="users" class="w-4 h-4 mr-2"></i>
                                Clientes
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-clientes-ver" checked class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-clientes-adicionar" checked class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                                    <span>Adicionar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-clientes-editar" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                    <span>Editar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-clientes-excluir" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    <span>Excluir</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Registros Diários -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="calendar-clock" class="w-4 h-4 mr-2"></i>
                                Registros Diários
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-registros-ver" checked class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-registros-adicionar" checked class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                                    <span>Adicionar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-registros-editar" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                    <span>Editar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-registros-excluir" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    <span>Excluir</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-registros-solicitacoes" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="bell" class="w-4 h-4"></i>
                                    <span>Solicitações</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Dados -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="database" class="w-4 h-4 mr-2"></i>
                                Dados
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-ver" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-exportar" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="download" class="w-4 h-4"></i>
                                    <span>Exportar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-importar" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="upload" class="w-4 h-4"></i>
                                    <span>Importar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-exportarDados" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                                    <span>Exportar Dados</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-importarDados" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="file-up" class="w-4 h-4"></i>
                                    <span>Importar Dados</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-exportarSistema" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="hard-drive-download" class="w-4 h-4"></i>
                                    <span>Exportar Sistema</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-importarSistema" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="hard-drive-upload" class="w-4 h-4"></i>
                                    <span>Importar Sistema</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-dados-limparDados" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="trash" class="w-4 h-4"></i>
                                    <span>Apagar Dados</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Configuração -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="settings" class="w-4 h-4 mr-2"></i>
                                Configuração
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-configuracao-ver" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-configuracao-gerenciarUsuarios" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="users-cog" class="w-4 h-4"></i>
                                    <span>Gerenciar Usuários</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-configuracao-buscaAvancada" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="search" class="w-4 h-4"></i>
                                    <span>Busca Avançada</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-configuracao-backupVer" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="archive" class="w-4 h-4"></i>
                                    <span>Ver Backups</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-configuracao-backupGerenciar" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="archive-restore" class="w-4 h-4"></i>
                                    <span>Gerenciar Backups</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-configuracao-storageVer" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="database" class="w-4 h-4"></i>
                                    <span>Ver Armazenamento</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-configuracao-storageGerenciar" class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="hard-drive" class="w-4 h-4"></i>
                                    <span>Gerenciar Armazenamento</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Jogos -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="gamepad-2" class="w-4 h-4 mr-2"></i>
                                Jogos
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="perm-jogos-ver" checked class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex space-x-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Adicionar Usuário
                    </button>
                    <button type="button" onclick="Modals.close()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                </div>
            </form>
        `;

        Modals.show('Adicionar Usuário', modalContent);

        setTimeout(() => {
            lucide.createIcons();
        }, 0);

        document.getElementById('user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleAddUser();
        });
    }

    static handleAddUser() {
        const userData = {
            nome: document.getElementById('user-nome').value,
            username: document.getElementById('user-username').value,
            password: document.getElementById('user-password').value,
            tipo: document.getElementById('user-tipo').value,
            permissoes: {
                clientes: {
                    ver: document.getElementById('perm-clientes-ver').checked,
                    adicionar: document.getElementById('perm-clientes-adicionar').checked,
                    editar: document.getElementById('perm-clientes-editar').checked,
                    excluir: document.getElementById('perm-clientes-excluir').checked
                },
                registros: {
                    ver: document.getElementById('perm-registros-ver').checked,
                    adicionar: document.getElementById('perm-registros-adicionar').checked,
                    editar: document.getElementById('perm-registros-editar').checked,
                    excluir: document.getElementById('perm-registros-excluir').checked,
                    solicitacoes: document.getElementById('perm-registros-solicitacoes')?.checked || false
                },
                dados: {
                    ver: document.getElementById('perm-dados-ver').checked,
                    exportar: document.getElementById('perm-dados-exportar').checked,
                    importar: document.getElementById('perm-dados-importar').checked,
                    exportarDados: document.getElementById('perm-dados-exportarDados').checked,
                    importarDados: document.getElementById('perm-dados-importarDados').checked,
                    exportarSistema: document.getElementById('perm-dados-exportarSistema').checked,
                    importarSistema: document.getElementById('perm-dados-importarSistema').checked,
                    limparDados: document.getElementById('perm-dados-limparDados')?.checked || false
                },
                configuracao: {
                    ver: document.getElementById('perm-configuracao-ver').checked,
                    gerenciarUsuarios: document.getElementById('perm-configuracao-gerenciarUsuarios').checked,
                    buscaAvancada: document.getElementById('perm-configuracao-buscaAvancada').checked,
                    backupVer: document.getElementById('perm-configuracao-backupVer')?.checked || false,
                    backupGerenciar: document.getElementById('perm-configuracao-backupGerenciar')?.checked || false,
                    storageVer: document.getElementById('perm-configuracao-storageVer')?.checked || false,
                    storageGerenciar: document.getElementById('perm-configuracao-storageGerenciar')?.checked || false
                },
                jogos: {
                    ver: document.getElementById('perm-jogos-ver').checked
                }
            }
        };

        try {
            const result = Auth.addUser(userData);
            if (result.success) {
                logAction('create', 'usuario', result.user.id, {
                    username: userData.username,
                    nome: userData.nome,
                    tipo: userData.tipo
                });
                Modals.close();
                this.renderUserList();
                Modals.alert('Usuário adicionado com sucesso!');
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }

    static editUser(userId) {
        const user = Auth.getUserById(userId);
        if (!user) return;

        const modalContent = `
            <form id="edit-user-form" class="space-y-4">
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome Completo</label>
                    <input type="text" id="edit-user-nome" value="${user.nome}" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nome de Usuário</label>
                    <input type="text" id="edit-user-username" value="${user.username}" required class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Nova Senha (deixe em branco para manter)</label>
                    <input type="password" id="edit-user-password" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                </div>
                <div>
                    <label class="block text-sm font-medium text-slate-600 dark:text-slate-400">Tipo de Usuário</label>
                    <select id="edit-user-tipo" class="mt-1 block w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md text-sm">
                        <option value="funcionario" ${user.tipo === 'funcionario' ? 'selected' : ''}>Funcionário</option>
                        <option value="admin" ${user.tipo === 'admin' ? 'selected' : ''}>Administrador</option>
                        <option value="dono" ${user.tipo === 'dono' ? 'selected' : ''}>Dono</option>
                    </select>
                </div>
                
                <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                    <h4 class="font-medium text-slate-700 dark:text-slate-300 mb-4">Permissões por Aba</h4>
                    
                    <div class="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                        <!-- Clientes -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="users" class="w-4 h-4 mr-2"></i>
                                Clientes
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-clientes-ver" ${user.permissoes.clientes.ver ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-clientes-adicionar" ${user.permissoes.clientes.adicionar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                                    <span>Adicionar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-clientes-editar" ${user.permissoes.clientes.editar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                    <span>Editar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-clientes-excluir" ${user.permissoes.clientes.excluir ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    <span>Excluir</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Registros Diários -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="calendar-clock" class="w-4 h-4 mr-2"></i>
                                Registros Diários
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-registros-ver" ${user.permissoes.registros.ver ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-registros-adicionar" ${user.permissoes.registros.adicionar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="plus-circle" class="w-4 h-4"></i>
                                    <span>Adicionar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-registros-editar" ${user.permissoes.registros.editar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="edit" class="w-4 h-4"></i>
                                    <span>Editar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-registros-excluir" ${user.permissoes.registros.excluir ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="trash-2" class="w-4 h-4"></i>
                                    <span>Excluir</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-registros-solicitacoes" ${user.permissoes.registros.solicitacoes ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="bell" class="w-4 h-4"></i>
                                    <span>Solicitações</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Dados -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="database" class="w-4 h-4 mr-2"></i>
                                Dados
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-ver" ${user.permissoes.dados?.ver ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-exportar" ${user.permissoes.dados?.exportar || user.permissoes.configuracao?.exportar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="download" class="w-4 h-4"></i>
                                    <span>Exportar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-importar" ${user.permissoes.dados?.importar || user.permissoes.configuracao?.importar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="upload" class="w-4 h-4"></i>
                                    <span>Importar</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-exportarDados" ${user.permissoes.dados?.exportarDados || user.permissoes.configuracao?.exportarDados ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="file-spreadsheet" class="w-4 h-4"></i>
                                    <span>Exportar Dados</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-importarDados" ${user.permissoes.dados?.importarDados || user.permissoes.configuracao?.importarDados ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="file-up" class="w-4 h-4"></i>
                                    <span>Importar Dados</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-exportarSistema" ${user.permissoes.dados?.exportarSistema || user.permissoes.configuracao?.exportarSistema ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="hard-drive-download" class="w-4 h-4"></i>
                                    <span>Exportar Sistema</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-importarSistema" ${user.permissoes.dados?.importarSistema || user.permissoes.configuracao?.importarSistema ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="hard-drive-upload" class="w-4 h-4"></i>
                                    <span>Importar Sistema</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-dados-limparDados" ${user.permissoes.dados?.limparDados ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="trash" class="w-4 h-4"></i>
                                    <span>Apagar Dados</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Configuração -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="settings" class="w-4 h-4 mr-2"></i>
                                Configuração
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-configuracao-ver" ${user.permissoes.configuracao.ver ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-configuracao-gerenciarUsuarios" ${user.permissoes.configuracao.gerenciarUsuarios ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="users-cog" class="w-4 h-4"></i>
                                    <span>Gerenciar Usuários</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-configuracao-buscaAvancada" ${user.permissoes.configuracao.buscaAvancada ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="search" class="w-4 h-4"></i>
                                    <span>Busca Avançada</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-configuracao-backupVer" ${user.permissoes.configuracao?.backupVer ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="archive" class="w-4 h-4"></i>
                                    <span>Ver Backups</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-configuracao-backupGerenciar" ${user.permissoes.configuracao?.backupGerenciar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="archive-restore" class="w-4 h-4"></i>
                                    <span>Gerenciar Backups</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-configuracao-storageVer" ${user.permissoes.configuracao?.storageVer ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="database" class="w-4 h-4"></i>
                                    <span>Ver Armazenamento</span>
                                </label>
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-configuracao-storageGerenciar" ${user.permissoes.configuracao?.storageGerenciar ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="hard-drive" class="w-4 h-4"></i>
                                    <span>Gerenciar Armazenamento</span>
                                </label>
                            </div>
                        </div>
                        
                        <!-- Jogos -->
                        <div class="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-3">
                            <p class="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center">
                                <i data-lucide="gamepad-2" class="w-4 h-4 mr-2"></i>
                                Jogos
                            </p>
                            <div class="grid grid-cols-2 gap-2">
                                <label class="flex items-center space-x-2 text-sm text-slate-600 dark:text-slate-300 cursor-pointer hover:text-slate-800 dark:hover:text-slate-100">
                                    <input type="checkbox" id="edit-perm-jogos-ver" ${user.permissoes.jogos?.ver ? 'checked' : ''} class="w-4 h-4 text-blue-600 bg-white dark:bg-slate-600 border-slate-300 dark:border-slate-500 rounded focus:ring-blue-500 focus:ring-2">
                                    <i data-lucide="eye" class="w-4 h-4"></i>
                                    <span>Ver</span>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="flex space-x-3 pt-4">
                    <button type="submit" class="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Salvar Alterações
                    </button>
                    <button type="button" onclick="Modals.close()" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600">
                        Cancelar
                    </button>
                </div>
            </form>
        `;

        Modals.show('Editar Usuário', modalContent);

        // Inicializar ícones Lucide
        setTimeout(() => {
            lucide.createIcons();
        }, 0);

        document.getElementById('edit-user-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleEditUser(userId);
        });
    }

    static handleEditUser(userId) {
        const userData = {
            nome: document.getElementById('edit-user-nome').value,
            username: document.getElementById('edit-user-username').value,
            tipo: document.getElementById('edit-user-tipo').value,
            permissoes: {
                clientes: {
                    ver: document.getElementById('edit-perm-clientes-ver').checked,
                    adicionar: document.getElementById('edit-perm-clientes-adicionar').checked,
                    editar: document.getElementById('edit-perm-clientes-editar').checked,
                    excluir: document.getElementById('edit-perm-clientes-excluir').checked
                },
                registros: {
                    ver: document.getElementById('edit-perm-registros-ver').checked,
                    adicionar: document.getElementById('edit-perm-registros-adicionar').checked,
                    editar: document.getElementById('edit-perm-registros-editar').checked,
                    excluir: document.getElementById('edit-perm-registros-excluir').checked,
                    solicitacoes: document.getElementById('edit-perm-registros-solicitacoes')?.checked || false
                },
                dados: {
                    ver: document.getElementById('edit-perm-dados-ver').checked,
                    exportar: document.getElementById('edit-perm-dados-exportar').checked,
                    importar: document.getElementById('edit-perm-dados-importar').checked,
                    exportarDados: document.getElementById('edit-perm-dados-exportarDados').checked,
                    importarDados: document.getElementById('edit-perm-dados-importarDados').checked,
                    exportarSistema: document.getElementById('edit-perm-dados-exportarSistema').checked,
                    importarSistema: document.getElementById('edit-perm-dados-importarSistema').checked,
                    limparDados: document.getElementById('edit-perm-dados-limparDados')?.checked || false
                },
                configuracao: {
                    ver: document.getElementById('edit-perm-configuracao-ver').checked,
                    gerenciarUsuarios: document.getElementById('edit-perm-configuracao-gerenciarUsuarios').checked,
                    buscaAvancada: document.getElementById('edit-perm-configuracao-buscaAvancada').checked,
                    backupVer: document.getElementById('edit-perm-configuracao-backupVer')?.checked || false,
                    backupGerenciar: document.getElementById('edit-perm-configuracao-backupGerenciar')?.checked || false,
                    storageVer: document.getElementById('edit-perm-configuracao-storageVer')?.checked || false,
                    storageGerenciar: document.getElementById('edit-perm-configuracao-storageGerenciar')?.checked || false
                },
                jogos: {
                    ver: document.getElementById('edit-perm-jogos-ver').checked
                }
            }
        };

        const newPassword = document.getElementById('edit-user-password').value;
        if (newPassword) {
            userData.password = newPassword;
        }

        try {
            const result = Auth.updateUser(userId, userData);
            if (result.success) {
                logAction('edit', 'usuario', userId, {
                    username: userData.username,
                    nome: userData.nome,
                    tipo: userData.tipo
                });
                Modals.close();
                this.renderUserList();
                Modals.alert('Salvo com sucesso', 'Sucesso');
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }

    static async deleteUser(userId) {
        const confirmed = await Modals.showConfirm('Tem certeza que deseja excluir este usuário?');
        if (!confirmed) return;

        try {
            const result = Auth.deleteUser(userId);
            if (result.success) {
                logAction('delete', 'usuario', userId, {
                    username: result.user?.username || 'desconhecido'
                });
                this.renderUserList();
                Modals.alert('Usuário excluído com sucesso!');
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }

    static async toggleUserStatus(userId) {
        const user = Auth.getUserById(userId);
        const action = user.ativo ? 'desativar' : 'ativar';
        const confirmed = await Modals.showConfirm(`Tem certeza que deseja ${action} este usuário?`);
        if (!confirmed) return;

        try {
            const result = Auth.toggleUserStatus(userId);
            if (result.success) {
                logAction(result.user.ativo ? 'activate' : 'deactivate', 'usuario', userId, {
                    username: result.user.username
                });
                this.renderUserList();
                Modals.alert(`Usuário ${action === 'desativar' ? 'desativado' : 'ativado'} com sucesso!`);
            } else {
                Modals.alert(result.message);
            }
        } catch (error) {
            Modals.alert(error.message, 'Erro de Permissão');
        }
    }

    static initAuditReport() {
        const userFilter = document.getElementById('audit-user-filter');
        if (!userFilter) return;

        const users = Auth.getAllUsers();
        userFilter.innerHTML = '<option value="todos">Todos os usuários</option>' +
            users.map(user => `<option value="${user.id}">${user.nome} (@${user.username})</option>`).join('');

        const endDate = document.getElementById('audit-end-date');
        if (endDate && !endDate.value) {
            endDate.value = new Date().toISOString().split('T')[0];
        }

        const startDate = document.getElementById('audit-start-date');
        if (startDate && !startDate.value) {
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            startDate.value = thirtyDaysAgo.toISOString().split('T')[0];
        }

        this.renderAuditLogs();
    }

    static applyAuditFilters() {
        this.renderAuditLogs();
    }

    static clearAuditFilters() {
        const startDate = document.getElementById('audit-start-date');
        const endDate = document.getElementById('audit-end-date');
        const userFilter = document.getElementById('audit-user-filter');

        if (startDate) startDate.value = '';
        if (endDate) endDate.value = '';
        if (userFilter) userFilter.value = 'todos';

        this.renderAuditLogs();
    }

    static renderAuditLogs() {
        const container = document.getElementById('audit-logs-list');
        if (!container) return;

        const startDate = document.getElementById('audit-start-date')?.value;
        const endDate = document.getElementById('audit-end-date')?.value;
        const userId = document.getElementById('audit-user-filter')?.value;

        const logs = AuditLogger.getLogsByFilter({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            userId: userId !== 'todos' ? userId : undefined
        });

        if (logs.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                    <i data-lucide="inbox" class="w-12 h-12 mx-auto mb-2 opacity-50"></i>
                    <p>Nenhum log encontrado para os filtros selecionados</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        const tableHTML = `
            <table class="w-full text-sm">
                <thead class="text-left bg-slate-50 dark:bg-slate-700/40 sticky top-0">
                    <tr class="border-b border-slate-200 dark:border-slate-700">
                        <th class="font-semibold text-slate-600 dark:text-slate-300 p-3">Data/Hora</th>
                        <th class="font-semibold text-slate-600 dark:text-slate-300 p-3">Usuário</th>
                        <th class="font-semibold text-slate-600 dark:text-slate-300 p-3">Ação</th>
                        <th class="font-semibold text-slate-600 dark:text-slate-300 p-3">Entidade</th>
                        <th class="font-semibold text-slate-600 dark:text-slate-300 p-3">Detalhes</th>
                    </tr>
                </thead>
                <tbody>
                    ${logs.map(log => {
            const date = new Date(log.timestamp);
            const dateStr = date.toLocaleDateString('pt-BR');
            const timeStr = date.toLocaleTimeString('pt-BR');

            const actionIcon = this.getActionIcon(log.action);
            const actionLabel = AuditLogger.getActionLabel(log.action);
            const entityLabel = AuditLogger.getEntityLabel(log.entity);
            const details = AuditLogger.formatLogDetails(log);

            return `
                            <tr class="border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                <td class="p-3 align-top">
                                    <div class="text-slate-800 dark:text-slate-100">${dateStr}</div>
                                    <div class="text-xs text-slate-500 dark:text-slate-400">${timeStr}</div>
                                </td>
                                <td class="p-3 align-top">
                                    <div class="font-medium text-slate-800 dark:text-slate-100">${log.username}</div>
                                    <div class="text-xs text-slate-500 dark:text-slate-400">${log.userTipo}</div>
                                </td>
                                <td class="p-3 align-top">
                                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${this.getActionBadgeClass(log.action)}">
                                        <i data-lucide="${actionIcon}" class="w-3 h-3 mr-1"></i>
                                        ${actionLabel}
                                    </span>
                                </td>
                                <td class="p-3 align-top text-slate-700 dark:text-slate-300">${entityLabel}</td>
                                <td class="p-3 align-top text-sm text-slate-600 dark:text-slate-400">${details}</td>
                            </tr>
                        `;
        }).join('')}
                </tbody>
            </table>
        `;

        container.innerHTML = tableHTML;
        lucide.createIcons();
    }

    static getActionIcon(action) {
        const icons = {
            'create': 'plus-circle',
            'edit': 'edit',
            'delete': 'trash-2',
            'register_entry': 'log-in',
            'register_exit': 'log-out',
            'remove_access': 'user-x',
            'change_entry_time': 'clock',
            'overnight_stay': 'moon',
            'export': 'download',
            'import': 'upload',
            'login': 'log-in',
            'logout': 'log-out',
            'change_password': 'key',
            'activate': 'check-circle',
            'deactivate': 'x-circle',
            'change_theme': 'palette'
        };
        return icons[action] || 'activity';
    }

    static getActionBadgeClass(action) {
        const classes = {
            'create': 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300',
            'edit': 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
            'delete': 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300',
            'register_entry': 'bg-cyan-100 dark:bg-cyan-900 text-cyan-700 dark:text-cyan-300',
            'register_exit': 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
            'login': 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300',
            'logout': 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300',
            'change_password': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
        };
        return classes[action] || 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300';
    }

    static exportAuditToExcel() {
        const startDate = document.getElementById('audit-start-date')?.value;
        const endDate = document.getElementById('audit-end-date')?.value;
        const userId = document.getElementById('audit-user-filter')?.value;

        const logs = AuditLogger.getLogsByFilter({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            userId: userId !== 'todos' ? userId : undefined
        });

        if (logs.length === 0) {
            Modals.alert('Nenhum log para exportar');
            return;
        }

        const headers = ['Data', 'Hora', 'Usuário', 'Tipo', 'Ação', 'Entidade', 'Detalhes'];
        const rows = logs.map(log => {
            const date = new Date(log.timestamp);
            return [
                date.toLocaleDateString('pt-BR'),
                date.toLocaleTimeString('pt-BR'),
                log.username,
                log.userTipo,
                AuditLogger.getActionLabel(log.action),
                AuditLogger.getEntityLabel(log.entity),
                AuditLogger.formatLogDetails(log)
            ];
        });

        const data = [headers, ...rows];
        const ws = XLSX.utils.aoa_to_sheet(data);

        ws['!cols'] = [
            { wch: 12 },
            { wch: 10 },
            { wch: 15 },
            { wch: 12 },
            { wch: 20 },
            { wch: 15 },
            { wch: 40 }
        ];

        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Auditoria');

        XLSX.writeFile(wb, `relatorio_auditoria_${new Date().toISOString().split('T')[0]}.xlsx`);

        Modals.alert('Relatório exportado com sucesso!', 'Sucesso');
    }

    static exportAuditToCSV() {
        const startDate = document.getElementById('audit-start-date')?.value;
        const endDate = document.getElementById('audit-end-date')?.value;
        const userId = document.getElementById('audit-user-filter')?.value;

        const logs = AuditLogger.getLogsByFilter({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            userId: userId !== 'todos' ? userId : undefined
        });

        if (logs.length === 0) {
            Modals.alert('Nenhum log para exportar');
            return;
        }

        const headers = ['Data', 'Hora', 'Usuário', 'Tipo', 'Ação', 'Entidade', 'Detalhes'];
        const rows = logs.map(log => {
            const date = new Date(log.timestamp);
            return [
                date.toLocaleDateString('pt-BR'),
                date.toLocaleTimeString('pt-BR'),
                log.username,
                log.userTipo,
                AuditLogger.getActionLabel(log.action),
                AuditLogger.getEntityLabel(log.entity),
                AuditLogger.formatLogDetails(log)
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `relatorio_auditoria_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        Modals.alert('Relatório exportado com sucesso!', 'Sucesso');
    }

    static exportAuditToPDF() {
        const startDate = document.getElementById('audit-start-date')?.value;
        const endDate = document.getElementById('audit-end-date')?.value;
        const userId = document.getElementById('audit-user-filter')?.value;

        const logs = AuditLogger.getLogsByFilter({
            startDate: startDate || undefined,
            endDate: endDate || undefined,
            userId: userId !== 'todos' ? userId : undefined
        });

        if (logs.length === 0) {
            Modals.alert('Nenhum log para exportar');
            return;
        }

        const reportTitle = 'Relatório de Auditoria';
        const reportDate = new Date().toLocaleDateString('pt-BR');
        const reportTime = new Date().toLocaleTimeString('pt-BR');

        const actionStats = {};
        logs.forEach(log => {
            const action = AuditLogger.getActionLabel(log.action);
            actionStats[action] = (actionStats[action] || 0) + 1;
        });
        const topActions = Object.entries(actionStats).sort((a, b) => b[1] - a[1]).slice(0, 5);
        const maxActionCount = topActions.length > 0 ? topActions[0][1] : 1;

        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Relatório de Auditoria - ${reportDate}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f8fafc; color: #334155; line-height: 1.6; }
                    .container { max-width: 1000px; margin: 0 auto; padding: 20px; }
                    
                    .header { background: linear-gradient(135deg, #f59e0b 0%, #ea580c 50%, #dc2626 100%); color: white; padding: 30px; border-radius: 16px; margin-bottom: 24px; text-align: center; box-shadow: 0 10px 40px rgba(234, 88, 12, 0.3); }
                    .header-icon { width: 60px; height: 60px; background: rgba(255,255,255,0.2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px; font-size: 28px; }
                    .header h1 { font-size: 28px; font-weight: 700; margin-bottom: 8px; text-shadow: 0 2px 4px rgba(0,0,0,0.1); }
                    .header-subtitle { font-size: 14px; opacity: 0.9; }
                    
                    .info-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
                    .info-card { background: white; padding: 20px; border-radius: 12px; text-align: center; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                    .info-value { font-size: 28px; font-weight: 700; color: #ea580c; margin-bottom: 4px; }
                    .info-label { font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; }
                    
                    .section { background: white; border-radius: 12px; padding: 24px; margin-bottom: 20px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
                    .section-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; }
                    .section-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #f59e0b, #ea580c); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 18px; color: white; }
                    .section-title { font-size: 18px; font-weight: 600; color: #1e293b; }
                    
                    .filters-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
                    .filter-item { background: #fef3c7; padding: 12px 16px; border-radius: 8px; border-left: 4px solid #f59e0b; }
                    .filter-label { font-size: 11px; color: #92400e; text-transform: uppercase; font-weight: 600; }
                    .filter-value { font-size: 14px; color: #78350f; font-weight: 500; margin-top: 2px; }
                    
                    .action-bars { display: flex; flex-direction: column; gap: 10px; }
                    .action-item { display: flex; align-items: center; gap: 16px; }
                    .action-name { min-width: 180px; font-weight: 500; color: #475569; font-size: 14px; }
                    .action-bar-container { flex: 1; height: 24px; background: #f1f5f9; border-radius: 12px; overflow: hidden; }
                    .action-bar { height: 100%; background: linear-gradient(90deg, #f59e0b, #ea580c); border-radius: 12px; display: flex; align-items: center; justify-content: flex-end; padding-right: 10px; font-size: 12px; font-weight: 600; color: white; min-width: 40px; }
                    
                    table { width: 100%; border-collapse: separate; border-spacing: 0; font-size: 12px; }
                    thead th { background: linear-gradient(135deg, #fef3c7, #fde68a); padding: 12px 10px; text-align: left; font-weight: 600; color: #92400e; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #f59e0b; }
                    thead th:first-child { border-radius: 8px 0 0 0; }
                    thead th:last-child { border-radius: 0 8px 0 0; }
                    tbody td { padding: 10px; border-bottom: 1px solid #f1f5f9; }
                    tbody tr:hover { background: #fffbeb; }
                    tbody tr:nth-child(even) { background: #fefce8; }
                    tbody tr:nth-child(even):hover { background: #fef9c3; }
                    
                    .badge { display: inline-block; padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
                    .badge-owner { background: #fef3c7; color: #92400e; }
                    .badge-admin { background: #dbeafe; color: #1e40af; }
                    .badge-employee { background: #dcfce7; color: #166534; }
                    .badge-action { background: #f1f5f9; color: #475569; }
                    
                    .footer { text-align: center; padding: 24px; color: #94a3b8; font-size: 12px; border-top: 1px solid #e2e8f0; margin-top: 20px; }
                    .footer-logo { font-size: 16px; font-weight: 600; color: #64748b; margin-bottom: 4px; }
                    
                    @media print { 
                        body { background: white; }
                        .container { padding: 10px; max-width: 100%; }
                        .section, .info-card { box-shadow: none; border: 1px solid #e2e8f0; }
                        .header { box-shadow: none; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        .info-grid { grid-template-columns: repeat(4, 1fr); }
                        table { font-size: 10px; }
                    }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="header-icon">🔍</div>
                        <h1>${reportTitle}</h1>
                        <div class="header-subtitle">Gerado em ${reportDate} às ${reportTime}</div>
                    </div>

                    <div class="info-grid">
                        <div class="info-card">
                            <div class="info-value">${logs.length}</div>
                            <div class="info-label">Total de Registros</div>
                        </div>
                        <div class="info-card">
                            <div class="info-value">${new Set(logs.map(l => l.username)).size}</div>
                            <div class="info-label">Usuários</div>
                        </div>
                        <div class="info-card">
                            <div class="info-value">${Object.keys(actionStats).length}</div>
                            <div class="info-label">Tipos de Ações</div>
                        </div>
                        <div class="info-card">
                            <div class="info-value">${new Set(logs.map(l => l.entity)).size}</div>
                            <div class="info-label">Entidades</div>
                        </div>
                    </div>

                    <div class="section">
                        <div class="section-header">
                            <div class="section-icon">🎯</div>
                            <div class="section-title">Filtros Aplicados</div>
                        </div>
                        <div class="filters-grid">
                            <div class="filter-item">
                                <div class="filter-label">Data Início</div>
                                <div class="filter-value">${startDate ? new Date(startDate).toLocaleDateString('pt-BR') : 'Sem limite'}</div>
                            </div>
                            <div class="filter-item">
                                <div class="filter-label">Data Fim</div>
                                <div class="filter-value">${endDate ? new Date(endDate).toLocaleDateString('pt-BR') : 'Sem limite'}</div>
                            </div>
                            <div class="filter-item">
                                <div class="filter-label">Usuário</div>
                                <div class="filter-value">${userId && userId !== 'todos' ? logs[0]?.username || 'N/A' : 'Todos os usuários'}</div>
                            </div>
                        </div>
                    </div>

                    ${topActions.length > 0 ? `
                    <div class="section">
                        <div class="section-header">
                            <div class="section-icon">📊</div>
                            <div class="section-title">Top 5 Ações Mais Frequentes</div>
                        </div>
                        <div class="action-bars">
                            ${topActions.map(([action, count]) => `
                                <div class="action-item">
                                    <div class="action-name">${action}</div>
                                    <div class="action-bar-container">
                                        <div class="action-bar" style="width: ${Math.max((count / maxActionCount) * 100, 15)}%">${count}</div>
                                    </div>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    ` : ''}

                    <div class="section">
                        <div class="section-header">
                            <div class="section-icon">📋</div>
                            <div class="section-title">Registros de Auditoria</div>
                        </div>
                        <table>
                            <thead>
                                <tr>
                                    <th style="width: 80px">Data</th>
                                    <th style="width: 60px">Hora</th>
                                    <th>Usuário</th>
                                    <th style="width: 70px">Tipo</th>
                                    <th>Ação</th>
                                    <th>Entidade</th>
                                    <th>Detalhes</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${logs.map(log => {
            const date = new Date(log.timestamp);
            const tipoClass = log.userTipo === 'dono' ? 'badge-owner' : log.userTipo === 'admin' ? 'badge-admin' : 'badge-employee';
            return `
                                        <tr>
                                            <td>${date.toLocaleDateString('pt-BR')}</td>
                                            <td>${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                                            <td><strong>${log.username}</strong></td>
                                            <td><span class="badge ${tipoClass}">${log.userTipo}</span></td>
                                            <td><span class="badge badge-action">${AuditLogger.getActionLabel(log.action)}</span></td>
                                            <td>${AuditLogger.getEntityLabel(log.entity)}</td>
                                            <td style="max-width: 200px; overflow: hidden; text-overflow: ellipsis;">${AuditLogger.formatLogDetails(log)}</td>
                                        </tr>
                                    `;
        }).join('')}
                            </tbody>
                        </table>
                    </div>

                    <div class="footer">
                        <div class="footer-logo">🚲 Bicicletário Shop</div>
                        <div>Sistema de Gerenciamento de Bicicletário - Relatório de Auditoria</div>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(htmlContent);
        printWindow.document.close();

        setTimeout(() => {
            printWindow.print();
        }, 250);

        Modals.alert('Janela de impressão aberta! Use "Salvar como PDF" nas opções de impressão.', 'Informação');
    }
}

window.Usuarios = Usuarios;
