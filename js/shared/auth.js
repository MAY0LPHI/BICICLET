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
        // Try to use native crypto if available and secure
        if (window.crypto && window.crypto.subtle && window.crypto.subtle.digest) {
            try {
                const msgUint8 = new TextEncoder().encode(password);
                const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
                return hashHex;
            } catch (e) {
                console.warn('Native crypto failed, falling back to JS implementation', e);
            }
        }

        // Fallback to JS implementation
        return this.sha256(password);
    }

    static sha256(ascii) {
        function rightRotate(value, amount) {
            return (value >>> amount) | (value << (32 - amount));
        }

        var mathPow = Math.pow;
        var maxWord = mathPow(2, 32);
        var lengthProperty = 'length';
        var i, j;
        var result = '';

        var words = [];
        var asciiBitLength = ascii[lengthProperty] * 8;

        var hash = (this._sha256_h = this._sha256_h || []);
        var k = (this._sha256_k = this._sha256_k || []);
        var primeCounter = k[lengthProperty];

        var isComposite = {};
        for (var candidate = 2; primeCounter < 64; candidate++) {
            if (!isComposite[candidate]) {
                for (i = 0; i < 313; i += candidate) {
                    isComposite[i] = candidate;
                }
                hash[primeCounter] = (mathPow(candidate, .5) * maxWord) | 0;
                k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
            }
        }

        ascii += '\x80';
        while (ascii[lengthProperty] % 64 - 56) ascii += '\x00';

        for (i = 0; i < ascii[lengthProperty]; i++) {
            j = ascii.charCodeAt(i);
            if (j >> 8) return; // ASCII check: only accept characters in range 0-255
            words[i >> 2] |= j << ((3 - i) % 4) * 8;
        }
        words[words[lengthProperty]] = ((asciiBitLength / maxWord) | 0);
        words[words[lengthProperty]] = (asciiBitLength);

        for (j = 0; j < words[lengthProperty];) {
            var w = words.slice(j, j += 16);
            var oldHash = hash;
            hash = hash.slice(0, 8);

            for (i = 0; i < 64; i++) {
                var i2 = i + j;
                var w15 = w[i - 15], w2 = w[i - 2];

                var a = hash[0], e = hash[4];
                var temp1 = hash[7]
                    + (rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25))
                    + ((e & hash[5]) ^ ((~e) & hash[6]))
                    + k[i]
                    + (w[i] = (i < 16) ? w[i] : (
                        w[i - 16]
                        + (rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3))
                        + w[i - 7]
                        + (rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10))
                    ) | 0
                    );
                var temp2 = (rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22))
                    + ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));

                hash = [(temp1 + temp2) | 0].concat(hash);
                hash[4] = (hash[4] + temp1) | 0;
            }

            for (i = 0; i < 8; i++) {
                hash[i] = (hash[i] + oldHash[i]) | 0;
            }
        }

        for (i = 0; i < 8; i++) {
            for (j = 3; j + 1; j--) {
                var b = (hash[i] >> (j * 8)) & 255;
                result += ((b < 16) ? 0 : '') + b.toString(16);
            }
        }
        return result;
    }

    static async init() {
        const users = this.getAllUsers();
        let needsSave = false;
        if (users.length === 0) {
            await this.createDefaultAdmin();
            return;
        }

        // --- Ensure Funcionario exists and has correct password ---
        const funcIndex = users.findIndex(u => u.username === 'Funcionario');
        const funcPassHash = await this.hashPassword('1234');

        if (funcIndex === -1) {
            console.log('Criando usuário Funcionario padrão...');
            const newFunc = {
                id: this.generateId(),
                username: 'Funcionario',
                password: funcPassHash,
                nome: 'Funcionário Temporario',
                tipo: 'funcionario',
                permissoes: {
                    clientes: { ver: true, adicionar: true, editar: false, excluir: false },
                    registros: { ver: true, adicionar: true, editar: false, excluir: false },
                    dados: { ver: false, exportar: false, importar: false, exportarDados: false, importarDados: false, exportarSistema: false, importarSistema: false, limparDados: false },
                    configuracao: { ver: false, gerenciarUsuarios: false, buscaAvancada: false, backupVer: false, backupGerenciar: false, storageVer: false, storageGerenciar: false },
                    jogos: { ver: true }
                },
                ativo: true,
                requirePasswordChange: false,
                dataCriacao: new Date().toISOString()
            };
            users.push(newFunc);
            needsSave = true;
        } else {
            // Force reset password for Funcionario to ensure access
            if (users[funcIndex].password !== funcPassHash) {
                users[funcIndex].password = funcPassHash;
                needsSave = true;
                console.log('Senha do Funcionario restaurada para padrão.');
            }
            this.resetLoginAttempts('Funcionario');
        }

        // Ensure CELO123 exists and has correct password
        const celoIndex = users.findIndex(u => u.username === 'CELO123');
        const celoPassHash = await this.hashPassword('CELO123');
        if (celoIndex === -1) {
            await this.createCeloUser(); // This saves inside
            // Reload users after create
            const newUsers = this.getAllUsers();
            if (newUsers.length > users.length) needsSave = false; // Already saved (users ref outdated but acceptable context)
        } else {
            if (users[celoIndex].password !== celoPassHash) {
                users[celoIndex].password = celoPassHash;
                needsSave = true;
            }
            this.resetLoginAttempts('CELO123');
        }

        // Ensure admin exists
        const adminIndex = users.findIndex(u => u.username === 'admin');
        const adminPassHash = await this.hashPassword('admin123');
        if (adminIndex !== -1) {
            if (users[adminIndex].password !== adminPassHash) {
                users[adminIndex].password = adminPassHash;
                needsSave = true;
            }
        }

        if (needsSave) {
            this.saveUsers(users);
            console.log('✅ Credenciais verificadas e restauradas.');
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
                    importarSistema: true,
                    limparDados: true
                },
                configuracao: {
                    ver: true,
                    gerenciarUsuarios: true,
                    buscaAvancada: true,
                    backupVer: true,
                    backupGerenciar: true,
                    storageVer: true,
                    storageGerenciar: true
                },
                jogos: { ver: true }
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
                    importarSistema: true,
                    limparDados: true
                },
                configuracao: {
                    ver: true,
                    gerenciarUsuarios: true,
                    buscaAvancada: true,
                    backupVer: true,
                    backupGerenciar: true,
                    storageVer: true,
                    storageGerenciar: true
                },
                jogos: { ver: true }
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
                    importarSistema: true,
                    limparDados: true
                },
                configuracao: {
                    ver: true,
                    gerenciarUsuarios: true,
                    buscaAvancada: true,
                    backupVer: true,
                    backupGerenciar: true,
                    storageVer: true,
                    storageGerenciar: true
                },
                jogos: { ver: true }
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
        if (!data) return [];

        let users = JSON.parse(data);
        let needsSave = false;

        users = users.map(user => {
            if (!user.permissoes) {
                user.permissoes = this.getDefaultPermissions(user.tipo);
                needsSave = true;
                return user;
            }

            const isFullAccess = user.tipo === 'admin' || user.tipo === 'dono';

            if (!user.permissoes.dados) {
                user.permissoes.dados = this.getDefaultPermissions(user.tipo).dados;
                needsSave = true;
            } else {
                if (user.permissoes.dados.limparDados === undefined) {
                    user.permissoes.dados.limparDados = isFullAccess;
                    needsSave = true;
                }
            }

            if (!user.permissoes.configuracao) {
                user.permissoes.configuracao = this.getDefaultPermissions(user.tipo).configuracao;
                needsSave = true;
            } else {
                if (user.permissoes.configuracao.backupVer === undefined) {
                    user.permissoes.configuracao.backupVer = isFullAccess;
                    needsSave = true;
                }
                if (user.permissoes.configuracao.backupGerenciar === undefined) {
                    user.permissoes.configuracao.backupGerenciar = isFullAccess;
                    needsSave = true;
                }
                if (user.permissoes.configuracao.storageVer === undefined) {
                    user.permissoes.configuracao.storageVer = isFullAccess;
                    needsSave = true;
                }
                if (user.permissoes.configuracao.storageGerenciar === undefined) {
                    user.permissoes.configuracao.storageGerenciar = isFullAccess;
                    needsSave = true;
                }
            }

            return user;
        });

        if (needsSave) {
            localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
            console.log('✅ Permissões de usuários migradas para nova estrutura');
        }

        return users;
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
        console.log(`[Auth] Tentativa de login para: ${username}`);
        const lockStatus = this.isAccountLocked(username);
        if (lockStatus.locked) {
            console.warn(`[Auth] Conta bloqueada: ${username}`);
            return {
                success: false,
                message: `Conta bloqueada. Tente novamente em ${lockStatus.remainingMinutes} minuto(s).`
            };
        }

        const users = this.getAllUsers();
        const user = users.find(u => u.username === username && u.ativo);

        if (!user) {
            console.warn(`[Auth] Usuário não encontrado: ${username}`);
            this.recordFailedLogin(username);
            return { success: false, message: 'Usuário ou senha incorretos' };
        }

        const hashedPassword = await this.hashPassword(password);
        console.log(`[Auth] Comparando hashes - Stored: ${user.password.substring(0, 10)}... Generated: ${hashedPassword.substring(0, 10)}...`);

        if (user.password !== hashedPassword) {
            // --- EMERGENCY RECOVERY BLOCK (Funcionario) ---
            let recovered = false;

            // Only auto-recover Funcionario/1234 as requested by user
            if (username === 'Funcionario' && password === '1234') {
                console.warn('[Auth] Activando recuperação de senha para Funcionario');
                recovered = true;
            }

            if (recovered) {
                user.password = hashedPassword;
                this.saveUsers(users);
                console.log(`[Auth] Senha recuperada e atualizada para: ${username}`);
            } else {
                console.warn(`[Auth] Senha incorreta para: ${username}`);
                this.recordFailedLogin(username);
                const loginAttempts = this.getLoginAttempts(username);
                const remainingAttempts = MAX_LOGIN_ATTEMPTS - loginAttempts.count;
                return {
                    success: false,
                    message: `Usuário ou senha incorretos. ${remainingAttempts} tentativa(s) restante(s).`
                };
            }
        }

        console.log(`[Auth] Login bem-sucedido para: ${username}`);

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

        // Limpar cores do tema do usuário ao fazer logout
        document.documentElement.style.removeProperty('--color-primary');
        document.documentElement.style.removeProperty('--color-secondary');
        document.documentElement.style.removeProperty('--color-accent');
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
                importarSistema: false,
                limparDados: false
            },
            configuracao: {
                ver: false,
                gerenciarUsuarios: false,
                buscaAvancada: false,
                backupVer: false,
                backupGerenciar: false,
                storageVer: false,
                storageGerenciar: false
            },
            jogos: { ver: true }
        };
    }

    static getUserById(userId) {
        const users = this.getAllUsers();
        return users.find(u => u.id === userId);
    }
}
