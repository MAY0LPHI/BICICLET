/**
 * Sistema de Armazenamento Offline com IndexedDB
 * Fornece armazenamento persistente e sincronização automática
 */

const DB_NAME = 'BicicletarioDB';
const DB_VERSION = 1;

export class OfflineStorage {
    constructor() {
        this.db = null;
        this.syncQueue = [];
        this.isOnline = navigator.onLine;
        this.initEventListeners();
    }

    /**
     * Inicializa listeners para eventos de conectividade
     */
    initEventListeners() {
        window.addEventListener('online', () => {
            console.log('🌐 Conexão restaurada - iniciando sincronização');
            this.isOnline = true;
            this.showOnlineIndicator();
            this.syncPendingOperations();
        });

        window.addEventListener('offline', () => {
            console.log('📴 Modo offline ativado');
            this.isOnline = false;
            this.showOfflineIndicator();
        });

        // Verifica status inicial
        if (!this.isOnline) {
            this.showOfflineIndicator();
        }
    }

    /**
     * Inicializa o IndexedDB
     */
    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('❌ Erro ao abrir IndexedDB');
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB inicializado');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Store de clientes
                if (!db.objectStoreNames.contains('clientes')) {
                    const clientesStore = db.createObjectStore('clientes', { keyPath: 'id' });
                    clientesStore.createIndex('cpf', 'cpf', { unique: true });
                    clientesStore.createIndex('nome', 'nome', { unique: false });
                }

                // Store de bicicletas
                if (!db.objectStoreNames.contains('bicicletas')) {
                    const bicicletasStore = db.createObjectStore('bicicletas', { keyPath: 'id' });
                    bicicletasStore.createIndex('clienteId', 'clienteId', { unique: false });
                }

                // Store de registros
                if (!db.objectStoreNames.contains('registros')) {
                    const registrosStore = db.createObjectStore('registros', { keyPath: 'id' });
                    registrosStore.createIndex('clienteId', 'clienteId', { unique: false });
                    registrosStore.createIndex('dataHoraEntrada', 'dataHoraEntrada', { unique: false });
                }

                // Store de usuários
                if (!db.objectStoreNames.contains('usuarios')) {
                    const usuariosStore = db.createObjectStore('usuarios', { keyPath: 'id' });
                    usuariosStore.createIndex('username', 'username', { unique: true });
                }

                // Store de fila de sincronização
                if (!db.objectStoreNames.contains('syncQueue')) {
                    const syncStore = db.createObjectStore('syncQueue', { keyPath: 'id', autoIncrement: true });
                    syncStore.createIndex('timestamp', 'timestamp', { unique: false });
                    syncStore.createIndex('synced', 'synced', { unique: false });
                }

                console.log('✅ Estrutura do IndexedDB criada');
            };
        });
    }

    /**
     * Salva dados em uma store
     */
    async save(storeName, data) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put(data);

            request.onsuccess = () => {
                console.log(`✅ Dados salvos em ${storeName}:`, data.id);
                
                // Adiciona à fila de sincronização se offline
                if (!this.isOnline) {
                    this.addToSyncQueue(storeName, 'save', data);
                }
                
                resolve(data);
            };

            request.onerror = () => {
                console.error(`❌ Erro ao salvar em ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Busca todos os dados de uma store
     */
    async getAll(storeName) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error(`❌ Erro ao buscar ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Busca um item específico
     */
    async get(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(id);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                console.error(`❌ Erro ao buscar item ${id} em ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Deleta um item
     */
    async delete(storeName, id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(id);

            request.onsuccess = () => {
                console.log(`✅ Item ${id} deletado de ${storeName}`);
                
                // Adiciona à fila de sincronização se offline
                if (!this.isOnline) {
                    this.addToSyncQueue(storeName, 'delete', { id });
                }
                
                resolve();
            };

            request.onerror = () => {
                console.error(`❌ Erro ao deletar item ${id} de ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Adiciona operação à fila de sincronização
     */
    async addToSyncQueue(storeName, operation, data) {
        if (!this.db) await this.init();

        const queueItem = {
            storeName,
            operation,
            data,
            timestamp: new Date().toISOString(),
            synced: false
        };

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.add(queueItem);

            request.onsuccess = () => {
                console.log('📋 Operação adicionada à fila de sincronização');
                resolve();
            };

            request.onerror = () => {
                console.error('❌ Erro ao adicionar à fila de sincronização:', request.error);
                reject(request.error);
            };
        });
    }

    /**
     * Sincroniza operações pendentes com o servidor
     */
    async syncPendingOperations() {
        if (!this.isOnline) {
            console.log('📴 Offline - sincronização adiada');
            return;
        }

        const pendingOps = await this.getPendingSync();
        
        if (pendingOps.length === 0) {
            console.log('✅ Nenhuma operação pendente para sincronizar');
            return;
        }

        console.log(`🔄 Sincronizando ${pendingOps.length} operações pendentes...`);

        for (const op of pendingOps) {
            try {
                await this.syncOperation(op);
                await this.markAsSynced(op.id);
            } catch (error) {
                console.error('❌ Erro ao sincronizar operação:', error);
            }
        }

        console.log('✅ Sincronização concluída');
        this.showSyncCompleteNotification();
    }

    /**
     * Busca operações pendentes de sincronização
     */
    async getPendingSync() {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncQueue'], 'readonly');
            const store = transaction.objectStore('syncQueue');
            const index = store.index('synced');
            const request = index.getAll(false);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Sincroniza uma operação específica
     */
    async syncOperation(op) {
        const endpoint = this.getEndpoint(op.storeName);
        const method = op.operation === 'delete' ? 'DELETE' : 'POST';

        const response = await fetch(endpoint, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(op.data)
        });

        if (!response.ok) {
            throw new Error(`Erro ao sincronizar: ${response.statusText}`);
        }

        return response.json();
    }

    /**
     * Marca operação como sincronizada
     */
    async markAsSynced(id) {
        if (!this.db) await this.init();

        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['syncQueue'], 'readwrite');
            const store = transaction.objectStore('syncQueue');
            const request = store.get(id);

            request.onsuccess = () => {
                const data = request.result;
                if (data) {
                    data.synced = true;
                    data.syncedAt = new Date().toISOString();
                    store.put(data);
                }
                resolve();
            };

            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    /**
     * Retorna o endpoint apropriado para a store
     */
    getEndpoint(storeName) {
        const baseUrl = 'http://localhost:5001/api';
        const endpoints = {
            'clientes': `${baseUrl}/client`,
            'registros': `${baseUrl}/registro`,
            'usuarios': `${baseUrl}/usuario`
        };
        return endpoints[storeName] || baseUrl;
    }

    /**
     * Mostra indicador de status offline
     */
    showOfflineIndicator() {
        let indicator = document.getElementById('offline-indicator');
        
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'offline-indicator';
            indicator.innerHTML = `
                <div class="fixed top-4 right-4 z-[10000] bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"></path>
                    </svg>
                    <span>Modo Offline</span>
                </div>
            `;
            document.body.appendChild(indicator);
        }
        
        indicator.style.display = 'block';
    }

    /**
     * Mostra indicador de status online
     */
    showOnlineIndicator() {
        const indicator = document.getElementById('offline-indicator');
        if (indicator) {
            indicator.style.display = 'none';
        }
        
        // Mostra notificação temporária
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div class="fixed top-4 right-4 z-[10000] bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>Online - Sincronizando...</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Mostra notificação de sincronização completa
     */
    showSyncCompleteNotification() {
        const notification = document.createElement('div');
        notification.innerHTML = `
            <div class="fixed top-4 right-4 z-[10000] bg-blue-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
                <span>Sincronização Completa</span>
            </div>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    /**
     * Exporta todos os dados para backup
     */
    async exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            clientes: await this.getAll('clientes'),
            bicicletas: await this.getAll('bicicletas'),
            registros: await this.getAll('registros'),
            usuarios: await this.getAll('usuarios')
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `backup_offline_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        console.log('✅ Dados exportados para backup offline');
    }

    /**
     * Importa dados de um backup
     */
    async importData(jsonData) {
        const data = JSON.parse(jsonData);

        // Importa clientes
        for (const cliente of data.clientes || []) {
            await this.save('clientes', cliente);
        }

        // Importa bicicletas
        for (const bicicleta of data.bicicletas || []) {
            await this.save('bicicletas', bicicleta);
        }

        // Importa registros
        for (const registro of data.registros || []) {
            await this.save('registros', registro);
        }

        console.log('✅ Dados importados do backup offline');
    }
}

// Instância global
let offlineStorageInstance = null;

export function getOfflineStorage() {
    if (!offlineStorageInstance) {
        offlineStorageInstance = new OfflineStorage();
    }
    return offlineStorageInstance;
}

// Inicializa automaticamente ao carregar
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', () => {
        const storage = getOfflineStorage();
        storage.init().catch(console.error);
    });
}
