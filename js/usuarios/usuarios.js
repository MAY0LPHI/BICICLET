/**
 * Módulo de Gerenciamento de Usuários
 * Permite ao administrador gerenciar funcionários e suas permissões
 */

import { Auth } from '../shared/auth.js';
import { Modals } from '../shared/modals.js';
import { AuditLogger } from '../shared/audit-logger.js';
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
        if (exportAuditCSV) {
            exportAuditCSV.addEventListener('click', () => this.exportAuditToCSV());
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
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            user.tipo === 'dono' 
                                ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300'
                                : user.tipo === 'admin' 
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300' 
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                        }">
                            ${user.tipo === 'dono' ? 'Dono' : user.tipo === 'admin' ? 'Administrador' : 'Funcionário'}
                        </span>
                        <span class="px-3 py-1 text-xs font-medium rounded-full ${
                            user.ativo 
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
                    <button onclick="Usuarios.toggleUserStatus('${user.id}')" class="flex-1 px-3 py-2 text-sm ${
                        user.ativo 
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
                    excluir: document.getElementById('perm-registros-excluir').checked
                },
                dados: {
                    ver: document.getElementById('perm-dados-ver').checked,
                    exportar: document.getElementById('perm-dados-exportar').checked,
                    importar: document.getElementById('perm-dados-importar').checked,
                    exportarDados: document.getElementById('perm-dados-exportarDados').checked,
                    importarDados: document.getElementById('perm-dados-importarDados').checked,
                    exportarSistema: document.getElementById('perm-dados-exportarSistema').checked,
                    importarSistema: document.getElementById('perm-dados-importarSistema').checked
                },
                configuracao: {
                    ver: document.getElementById('perm-configuracao-ver').checked,
                    gerenciarUsuarios: document.getElementById('perm-configuracao-gerenciarUsuarios').checked,
                    buscaAvancada: document.getElementById('perm-configuracao-buscaAvancada').checked
                }
            }
        };

        try {
            const result = Auth.addUser(userData);
            if (result.success) {
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
                    excluir: document.getElementById('edit-perm-registros-excluir').checked
                },
                dados: {
                    ver: document.getElementById('edit-perm-dados-ver').checked,
                    exportar: document.getElementById('edit-perm-dados-exportar').checked,
                    importar: document.getElementById('edit-perm-dados-importar').checked,
                    exportarDados: document.getElementById('edit-perm-dados-exportarDados').checked,
                    importarDados: document.getElementById('edit-perm-dados-importarDados').checked,
                    exportarSistema: document.getElementById('edit-perm-dados-exportarSistema').checked,
                    importarSistema: document.getElementById('edit-perm-dados-importarSistema').checked
                },
                configuracao: {
                    ver: document.getElementById('edit-perm-configuracao-ver').checked,
                    gerenciarUsuarios: document.getElementById('edit-perm-configuracao-gerenciarUsuarios').checked,
                    buscaAvancada: document.getElementById('edit-perm-configuracao-buscaAvancada').checked
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
        
        let htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; }
                    h1 { color: #1e40af; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 12px; }
                    th { background-color: #f1f5f9; padding: 10px; text-align: left; border: 1px solid #cbd5e1; }
                    td { padding: 8px; border: 1px solid #e2e8f0; }
                    tr:nth-child(even) { background-color: #f8fafc; }
                    .header { margin-bottom: 20px; }
                    .filters { background-color: #f1f5f9; padding: 10px; margin-bottom: 20px; border-radius: 5px; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>${reportTitle}</h1>
                    <p>Gerado em: ${reportDate}</p>
                </div>
                <div class="filters">
                    <strong>Filtros aplicados:</strong><br>
                    ${startDate ? `Data início: ${new Date(startDate).toLocaleDateString('pt-BR')}<br>` : ''}
                    ${endDate ? `Data fim: ${new Date(endDate).toLocaleDateString('pt-BR')}<br>` : ''}
                    ${userId && userId !== 'todos' ? `Usuário: ${logs[0]?.username || 'N/A'}<br>` : 'Todos os usuários<br>'}
                    Total de registros: ${logs.length}
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>Data</th>
                            <th>Hora</th>
                            <th>Usuário</th>
                            <th>Tipo</th>
                            <th>Ação</th>
                            <th>Entidade</th>
                            <th>Detalhes</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${logs.map(log => {
                            const date = new Date(log.timestamp);
                            return `
                                <tr>
                                    <td>${date.toLocaleDateString('pt-BR')}</td>
                                    <td>${date.toLocaleTimeString('pt-BR')}</td>
                                    <td>${log.username}</td>
                                    <td>${log.userTipo}</td>
                                    <td>${AuditLogger.getActionLabel(log.action)}</td>
                                    <td>${AuditLogger.getEntityLabel(log.entity)}</td>
                                    <td>${AuditLogger.formatLogDetails(log)}</td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
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
