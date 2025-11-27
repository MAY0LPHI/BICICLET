/**
 * Sistema de Autenticação
 * Gerencia login, logout e controle de sessão com segurança aprimorada
 */

import { Storage } from './storage.js';
import { logAction } from './audit-logger.js';

const STORAGE_KEY_USERS = 'bicicletario_users';
const STORAGE_KEY_SESSION = 'bicicletario_session';
const STORAGE_KEY_LOGIN_ATTEMPTS = 'login_attempts';
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000;

export class Auth {
    static async hashPassword(password) {
        const msgUint8 = new TextEncoder().encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
        return hashHex;
    }

    static async init() {
        const users = this.getAllUsers();
        if (users.length === 0) {
            await this.createDefaultAdmin();
        } else {
            const celoExists = users.find(u => u.username === 'CELO123');
            if (!celoExists) {
                await this.createCeloUser();
            }
        }
    }
    
    static async createCeloUser() {
        const hashedPasswordCelo = await this.hashPassword('CELO123');
        
        const userCelo = {
            id: this.generateId(),
            username: 'CELO123',
            password: hashedPasswordCelo,
            nome: 'CELO - Dono do Sistema',
            tipo: 'dono',
            permissoes: {
                clientes: { ver: true, adicionar: true, editar: true, excluir: true },
                registros: { ver: true, adicionar: true, editar: true, excluir: true },
                dados: { 
                    ver: true, 
                    exportar: true, 
                    importar: true,
                    exportarDados: true,
                    importarDados: true,
                    exportarSistema: true,
                    importarSistema: true
                },
                configuracao: { 
                    ver: true, 
                    gerenciarUsuarios: true,
                    buscaAvancada: true
                }
            },
            ativo: true,
            requirePasswordChange: false,
            dataCriacao: new Date().toISOString()
        };
        
        const users = this.getAllUsers();
        users.push(userCelo);
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        console.log('Usuário CELO123 criado como DONO (username: CELO123, senha: CELO123)');
    }

    static async createDefaultAdmin() {
        const hashedPasswordAdmin = await this.hashPassword('admin123');
        const hashedPasswordCelo = await this.hashPassword('CELO123');
        
        const defaultAdmin = {
            id: this.generateId(),
            username: 'admin',
            password: hashedPasswordAdmin,
            nome: 'Administrador',
            tipo: 'admin',
            permissoes: {
                clientes: { ver: true, adicionar: true, editar: true, excluir: true },
                registros: { ver: true, adicionar: true, editar: true, excluir: true },
                dados: { 
                    ver: true, 
                    exportar: true, 
                    importar: true,
                    exportarDados: true,
                    importarDados: true,
                    exportarSistema: true,
                    importarSistema: true
                },
                configuracao: { 
                    ver: true, 
                    gerenciarUsuarios: true,
                    buscaAvancada: true
                }
            },
            ativo: true,
            requirePasswordChange: true,
            dataCriacao: new Date().toISOString()
        };
        
        const userCelo = {
            id: this.generateId(),
            username: 'CELO123',
            password: hashedPasswordCelo,
            nome: 'CELO - Dono do Sistema',
            tipo: 'dono',
            permissoes: {
                clientes: { ver: true, adicionar: true, editar: true, excluir: true },
                registros: { ver: true, adicionar: true, editar: true, excluir: true },
                dados: { 
                    ver: true, 
                    exportar: true, 
                    importar: true,
                    exportarDados: true,
                    importarDados: true,
                    exportarSistema: true,
                    importarSistema: true
                },
                configuracao: { 
                    ver: true, 
                    gerenciarUsuarios: true,
                    buscaAvancada: true
                }
            },
            ativo: true,
            requirePasswordChange: false,
            dataCriacao: new Date().toISOString()
        };
        
        const users = [defaultAdmin, userCelo];
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
        console.log('✅ Usuário admin padrão criado (username: admin, senha: admin123)');
        console.log('✅ Usuário CELO123 criado como DONO (username: CELO123, senha: CELO123)');
    }

    static generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static getAllUsers() {
        const data = localStorage.getItem(STORAGE_KEY_USERS);
        return data ? JSON.parse(data) : [];
    }

    static saveUsers(users) {
        localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
    }

    static getLoginAttempts(username) {
        const data = localStorage.getItem(STORAGE_KEY_LOGIN_ATTEMPTS);
        const attempts = data ? JSON.parse(data) : {};
        return attempts[username] || { count: 0, lastAttempt: 0 };
    }

    static recordFailedLogin(username) {
        const data = localStorage.getItem(STORAGE_KEY_LOGIN_ATTEMPTS);
        const attempts = data ? JSON.parse(data) : {};
        
        if (!attempts[username]) {
            attempts[username] = { count: 0, lastAttempt: 0 };
        }
        
        attempts[username].count++;
        attempts[username].lastAttempt = Date.now();
        
        localStorage.setItem(STORAGE_KEY_LOGIN_ATTEMPTS, JSON.stringify(attempts));
    }

    static resetLoginAttempts(username) {
        const data = localStorage.getItem(STORAGE_KEY_LOGIN_ATTEMPTS);
        const attempts = data ? JSON.parse(data) : {};
        delete attempts[username];
        localStorage.setItem(STORAGE_KEY_LOGIN_ATTEMPTS, JSON.stringify(attempts));
    }

    static isAccountLocked(username) {
        const loginAttempts = this.getLoginAttempts(username);
        
        if (loginAttempts.count >= MAX_LOGIN_ATTEMPTS) {
            const timeSinceLastAttempt = Date.now() - loginAttempts.lastAttempt;
            if (timeSinceLastAttempt < LOCKOUT_DURATION) {
                const remainingMinutes = Math.ceil((LOCKOUT_DURATION - timeSinceLastAttempt) / 60000);
                return { locked: true, remainingMinutes };
            } else {
                this.resetLoginAttempts(username);
            }
        }
        
        return { locked: false };
    }

    static async login(username, password) {
        const lockStatus = this.isAccountLocked(username);
        if (lockStatus.locked) {
            return { 
                success: false, 
                message: `Conta bloqueada. Tente novamente em ${lockStatus.remainingMinutes} minuto(s).` 
            };
        }

        const users = this.getAllUsers();
        const user = users.find(u => u.username === username && u.ativo);
        
        if (!user) {
            this.recordFailedLogin(username);
            return { success: false, message: 'Usuário ou senha incorretos' };
        }

        const hashedPassword = await this.hashPassword(password);
        
        if (user.password !== hashedPassword) {
            this.recordFailedLogin(username);
            const loginAttempts = this.getLoginAttempts(username);
            const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts.count;
            return { 
                success: false, 
                message: `Usuário ou senha incorretos. ${remainingAttempts} tentativa(s) restante(s).` 
            };
        }

        this.resetLoginAttempts(username);

        const session = {
            userId: user.id,
            username: user.username,
            nome: user.nome,
            tipo: user.tipo,
            permissoes: user.permissoes,
            requirePasswordChange: user.requirePasswordChange || false,
            loginTime: new Date().toISOString()
        };
        localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        
        setTimeout(() => {
            logAction('login', 'usuario', user.id, { 
                username: user.username,
                nome: user.nome,
                tipo: user.tipo
            });
        }, 100);
        
        return { success: true, user: session };
    }

    static logout() {
        const session = this.getCurrentSession();
        if (session) {
            logAction('logout', 'usuario', session.userId, {
                username: session.username,
                nome: session.nome
            });
        }
        localStorage.removeItem(STORAGE_KEY_SESSION);
    }

    static getCurrentSession() {
        const data = localStorage.getItem(STORAGE_KEY_SESSION);
        return data ? JSON.parse(data) : null;
    }

    static isLoggedIn() {
        return this.getCurrentSession() !== null;
    }

    static isAdmin() {
        const session = this.getCurrentSession();
        return session && (session.tipo === 'admin' || session.tipo === 'dono');
    }

    static hasPermission(modulo, acao) {
        const session = this.getCurrentSession();
        if (!session) return false;
        if (session.tipo === 'admin' || session.tipo === 'dono') return true;
        
        const permissoes = session.permissoes[modulo];
        return permissoes && permissoes[acao] === true;
    }

    static requirePermission(modulo, acao, errorMessage = 'Você não tem permissão para executar esta ação') {
        if (!this.hasPermission(modulo, acao)) {
            throw new Error(errorMessage);
        }
    }

    static async addUser(userData) {
        this.requirePermission('configuracao', 'gerenciarUsuarios');

        const users = this.getAllUsers();
        
        if (users.find(u => u.username === userData.username)) {
            return { success: false, message: 'Nome de usuário já existe' };
        }

        const hashedPassword = await this.hashPassword(userData.password);

        const newUser = {
            id: this.generateId(),
            username: userData.username,
            password: hashedPassword,
            nome: userData.nome,
            tipo: userData.tipo || 'funcionario',
            permissoes: userData.permissoes || this.getDefaultPermissions(),
            ativo: true,
            requirePasswordChange: false,
            dataCriacao: new Date().toISOString()
        };

        users.push(newUser);
        this.saveUsers(users);
        return { success: true, user: newUser };
    }

    static async updateUser(userId, userData) {
        this.requirePermission('configuracao', 'gerenciarUsuarios');

        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) {
            return { success: false, message: 'Usuário não encontrado' };
        }

        const userWithSameUsername = users.find(u => u.username === userData.username && u.id !== userId);
        if (userWithSameUsername) {
            return { success: false, message: 'Nome de usuário já existe' };
        }

        if (userData.password) {
            userData.password = await this.hashPassword(userData.password);
        }

        users[index] = { ...users[index], ...userData };
        this.saveUsers(users);
        return { success: true, user: users[index] };
    }

    static async changePassword(userId, newPassword) {
        const users = this.getAllUsers();
        const index = users.findIndex(u => u.id === userId);
        
        if (index === -1) {
            return { success: false, message: 'Usuário não encontrado' };
        }

        const hashedPassword = await this.hashPassword(newPassword);
        users[index].password = hashedPassword;
        users[index].requirePasswordChange = false;
        this.saveUsers(users);

        const session = this.getCurrentSession();
        if (session && session.userId === userId) {
            session.requirePasswordChange = false;
            localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
        }
        
        logAction('change_password', 'usuario', userId, {
            username: users[index].username
        });

        return { success: true };
    }

    static deleteUser(userId) {
        this.requirePermission('configuracao', 'gerenciarUsuarios');

        const session = this.getCurrentSession();
        if (session && session.userId === userId) {
            return { success: false, message: 'Não é possível excluir o usuário logado' };
        }

        const users = this.getAllUsers();
        const filtered = users.filter(u => u.id !== userId);
        
        if (filtered.length === users.length) {
            return { success: false, message: 'Usuário não encontrado' };
        }

        this.saveUsers(filtered);
        return { success: true };
    }

    static toggleUserStatus(userId) {
        this.requirePermission('configuracao', 'gerenciarUsuarios');

        const users = this.getAllUsers();
        const user = users.find(u => u.id === userId);
        
        if (!user) {
            return { success: false, message: 'Usuário não encontrado' };
        }

        user.ativo = !user.ativo;
        this.saveUsers(users);
        return { success: true, user };
    }

    static getDefaultPermissions() {
        return {
            clientes: { ver: true, adicionar: true, editar: false, excluir: false },
            registros: { ver: true, adicionar: true, editar: false, excluir: false },
            dados: { 
                ver: false, 
                exportar: false, 
                importar: false,
                exportarDados: false,
                importarDados: false,
                exportarSistema: false,
                importarSistema: false
            },
            configuracao: { ver: false, gerenciarUsuarios: false, buscaAvancada: false }
        };
    }

    static getUserById(userId) {
        const users = this.getAllUsers();
        return users.find(u => u.id === userId);
    }
}
