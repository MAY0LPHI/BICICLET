import { FileStorage } from './file-storage.js';
import { Utils } from './utils.js';

const isElectron = typeof window !== 'undefined' && window.electron;

let fileStorageAvailable = false;

async function checkFileStorage() {
    if (!isElectron) {
        fileStorageAvailable = await FileStorage.isAvailable();
        if (fileStorageAvailable) {
            console.log('✅ API de arquivos disponível - dados serão salvos em: dados/navegador/');
        } else {
            console.log('ℹ️ API de arquivos indisponível - usando localStorage');
        }
    } else {
        const storagePath = await window.electron.getStoragePath();
        console.log('💾 Electron Desktop - dados em:', storagePath);
    }
}

checkFileStorage();

function normalizeClients(clients) {
    let needsSave = false;
    clients.forEach(client => {
        if (!client.id) {
            client.id = Utils.generateUUID();
            needsSave = true;
        }
        // Normaliza comentarios para array
        if (typeof client.comentarios === 'string') {
            try {
                client.comentarios = JSON.parse(client.comentarios);
            } catch (e) {
                client.comentarios = [];
            }
        }
        if (!Array.isArray(client.comentarios)) {
            client.comentarios = [];
        }
        // Garante que bicicletas seja array
        if (!Array.isArray(client.bicicletas)) {
            client.bicicletas = [];
        }
    });
    return { clients, needsSave };
}

export const Storage = {
    async saveClients(clients, syncToDatabase = false, onProgress = null) {
        if (isElectron) {
            await window.electron.saveClients(clients);
        } else {
            localStorage.setItem('bicicletario_clients', JSON.stringify(clients));

            if (syncToDatabase) {
                const total = clients.length;
                for (let i = 0; i < clients.length; i++) {
                    try {
                        await FileStorage.saveClient(clients[i]);
                        if (onProgress && typeof onProgress === 'function') {
                            onProgress(i + 1, total);
                        }
                    } catch (error) {
                        console.warn('Erro ao sincronizar cliente:', error);
                    }
                }
            }
        }
    },

    async loadClients() {
        let clients = [];

        if (isElectron) {
            clients = await window.electron.loadClients();
        } else {
            if (fileStorageAvailable) {
                try {
                    clients = await FileStorage.loadAllClients();
                    localStorage.setItem('bicicletario_clients', JSON.stringify(clients));
                } catch (error) {
                    console.warn('Erro ao carregar clientes de arquivo:', error);
                    const data = localStorage.getItem('bicicletario_clients');
                    clients = data ? JSON.parse(data) : [];
                }
            } else {
                const data = localStorage.getItem('bicicletario_clients');
                clients = data ? JSON.parse(data) : [];
            }
        }

        const { clients: normalizedClients, needsSave } = normalizeClients(clients);
        if (needsSave) {
            await this.saveClients(normalizedClients);
        }

        return normalizedClients;
    },

    async saveClient(client) {
        if (isElectron) {
            const clients = await this.loadClients();
            const index = clients.findIndex(c => c.id === client.id);
            if (index >= 0) {
                clients[index] = client;
            } else {
                clients.push(client);
            }
            await window.electron.saveClients(clients);
            return clients;
        } else {
            const clients = this.loadClientsSync();
            const index = clients.findIndex(c => c.id === client.id);
            if (index >= 0) {
                clients[index] = client;
            } else {
                clients.push(client);
            }
            localStorage.setItem('bicicletario_clients', JSON.stringify(clients));

            // Sincroniza com banco de dados imediatamente
            try {
                await FileStorage.saveClient(client);
            } catch (error) {
                console.warn('Erro ao salvar cliente em arquivo:', error);
            }

            return clients;
        }
    },

    loadClientsSync() {
        const data = localStorage.getItem('bicicletario_clients');
        if (!data) return [];

        const clients = JSON.parse(data);
        const { clients: normalizedClients, needsSave } = normalizeClients(clients);

        if (needsSave) {
            localStorage.setItem('bicicletario_clients', JSON.stringify(normalizedClients));
        }

        return normalizedClients;
    },

    async deleteClient(cpf) {
        if (isElectron) {
            const clients = await this.loadClients();
            const filtered = clients.filter(c => c.cpf.replace(/\D/g, '') !== cpf.replace(/\D/g, ''));
            await window.electron.saveClients(filtered);
            return { success: true };
        } else {
            const clients = this.loadClientsSync();
            const filtered = clients.filter(c => c.cpf.replace(/\D/g, '') !== cpf.replace(/\D/g, ''));
            localStorage.setItem('bicicletario_clients', JSON.stringify(filtered));

            // Sincroniza deleção com banco de dados imediatamente
            try {
                await FileStorage.deleteClient(cpf);
            } catch (error) {
                console.warn('Erro ao deletar cliente de arquivo:', error);
            }

            return { success: true };
        }
    },

    async saveRegistros(registros, onProgress = null) {
        if (isElectron) {
            await window.electron.saveRegistros(registros);
        } else {
            localStorage.setItem('bicicletario_registros', JSON.stringify(registros));
            this.organizeRegistrosByDate(registros);

            const total = registros.length;
            for (let i = 0; i < registros.length; i++) {
                try {
                    await FileStorage.saveRegistro(registros[i]);
                    if (onProgress && typeof onProgress === 'function') {
                        onProgress(i + 1, total);
                    }
                } catch (error) {
                    console.warn('Erro ao salvar registro em arquivo:', error);
                }
            }
        }
    },

    async saveRegistro(registro) {
        if (isElectron) {
            const registros = await this.loadRegistros();
            const index = registros.findIndex(r => r.id === registro.id);
            if (index >= 0) {
                registros[index] = registro;
            } else {
                registros.push(registro);
            }
            await window.electron.saveRegistros(registros);
            return { success: true };
        } else {
            const registros = this.loadRegistrosSync();
            const index = registros.findIndex(r => r.id === registro.id);
            if (index >= 0) {
                registros[index] = registro;
            } else {
                registros.push(registro);
            }
            localStorage.setItem('bicicletario_registros', JSON.stringify(registros));
            this.organizeRegistrosByDate(registros);

            // Sincroniza com banco de dados imediatamente
            try {
                await FileStorage.saveRegistro(registro);
            } catch (error) {
                console.warn('Erro ao salvar registro em arquivo:', error);
            }

            return { success: true };
        }
    },

    async loadRegistros() {
        if (isElectron) {
            return await window.electron.loadRegistros();
        } else {
            if (fileStorageAvailable) {
                try {
                    const registros = await FileStorage.loadAllRegistros();
                    localStorage.setItem('bicicletario_registros', JSON.stringify(registros));
                    this.organizeRegistrosByDate(registros);
                    return registros;
                } catch (error) {
                    console.warn('Erro ao carregar registros de arquivo:', error);
                }
            }
            const data = localStorage.getItem('bicicletario_registros');
            return data ? JSON.parse(data) : [];
        }
    },

    loadRegistrosSync() {
        const data = localStorage.getItem('bicicletario_registros');
        return data ? JSON.parse(data) : [];
    },

    organizeRegistrosByDate(registros) {
        const organized = {};

        registros.forEach(registro => {
            const entryDate = new Date(registro.dataHoraEntrada);
            const year = entryDate.getFullYear().toString();
            const month = String(entryDate.getMonth() + 1).padStart(2, '0');
            const day = String(entryDate.getDate()).padStart(2, '0');

            if (!organized[year]) organized[year] = {};
            if (!organized[year][month]) organized[year][month] = {};
            if (!organized[year][month][day]) organized[year][month][day] = [];

            organized[year][month][day].push(registro);
        });

        if (!isElectron) {
            localStorage.setItem('bicicletario_registros_organizados', JSON.stringify(organized));
            const summary = this.generateStorageSummary(organized);
            localStorage.setItem('bicicletario_registros_resumo', JSON.stringify(summary));
        }

        return organized;
    },

    generateStorageSummary(organized) {
        const summary = {
            totalRegistros: 0,
            anos: {}
        };

        Object.keys(organized).forEach(year => {
            summary.anos[year] = {
                totalMeses: Object.keys(organized[year]).length,
                meses: {}
            };

            Object.keys(organized[year]).forEach(month => {
                const monthName = this.getMonthName(parseInt(month));
                summary.anos[year].meses[month] = {
                    nome: monthName,
                    totalDias: Object.keys(organized[year][month]).length,
                    totalRegistros: 0,
                    dias: {}
                };

                Object.keys(organized[year][month]).forEach(day => {
                    const dayRegistros = organized[year][month][day].length;
                    summary.anos[year].meses[month].totalRegistros += dayRegistros;
                    summary.anos[year].meses[month].dias[day] = dayRegistros;
                    summary.totalRegistros += dayRegistros;
                });
            });
        });

        return summary;
    },

    getMonthName(month) {
        const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
            'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
        return months[month - 1];
    },

    async loadRegistrosByDate(year, month, day) {
        if (isElectron) {
            const allRegistros = await window.electron.loadRegistros();
            return allRegistros.filter(reg => {
                const date = new Date(reg.dataHoraEntrada);
                const matchYear = !year || date.getFullYear() === parseInt(year);
                const matchMonth = !month || (date.getMonth() + 1) === parseInt(month);
                const matchDay = !day || date.getDate() === parseInt(day);
                return matchYear && matchMonth && matchDay;
            });
        } else {
            const organized = localStorage.getItem('bicicletario_registros_organizados');
            if (!organized) return [];

            const data = JSON.parse(organized);

            if (year && month && day) {
                return data[year]?.[month]?.[day] || [];
            } else if (year && month) {
                const monthData = data[year]?.[month] || {};
                return Object.values(monthData).flat();
            } else if (year) {
                const yearData = data[year] || {};
                return Object.values(yearData).map(month => Object.values(month).flat()).flat();
            }

            return [];
        }
    },

    async loadStorageSummary() {
        if (isElectron) {
            const allRegistros = await window.electron.loadRegistros();
            const organized = this.organizeRegistrosByDate(allRegistros);
            return this.generateStorageSummary(organized);
        } else {
            const data = localStorage.getItem('bicicletario_registros_resumo');
            return data ? JSON.parse(data) : null;
        }
    },

    generateSummaryFromStructure(structure) {
        const summary = {
            totalRegistros: 0,
            anos: {}
        };

        Object.keys(structure).forEach(year => {
            summary.anos[year] = {
                totalMeses: Object.keys(structure[year]).length,
                meses: {}
            };

            Object.keys(structure[year]).forEach(month => {
                const monthName = this.getMonthName(parseInt(month));
                summary.anos[year].meses[month] = {
                    nome: monthName,
                    totalDias: structure[year][month].length,
                    totalRegistros: 0,
                    dias: {}
                };

                structure[year][month].forEach(day => {
                    summary.anos[year].meses[month].dias[day] = 1;
                    summary.totalRegistros += 1;
                    summary.anos[year].meses[month].totalRegistros += 1;
                });
            });
        });

        return summary;
    },

    async getOrganizedRegistros() {
        if (isElectron) {
            const allRegistros = await window.electron.loadRegistros();
            return this.organizeRegistrosByDate(allRegistros);
        } else {
            const data = localStorage.getItem('bicicletario_registros_organizados');
            return data ? JSON.parse(data) : {};
        }
    },

    async getStoragePath() {
        if (isElectron) {
            return await window.electron.getStoragePath();
        }
        return null;
    },

    migrateOldData() {
        if (isElectron) {
            return null;
        }

        const oldData = localStorage.getItem('bicicletarioData');
        if (oldData && !localStorage.getItem('bicicletario_clients')) {
            try {
                const clientsWithRecords = JSON.parse(oldData);
                const newClients = [];
                const newRegistros = [];

                clientsWithRecords.forEach(client => {
                    const newClient = { ...client, bicicletas: [] };
                    (client.bicicletas || []).forEach(bike => {
                        const newBike = { ...bike };
                        if (bike.registros && Array.isArray(bike.registros)) {
                            bike.registros.forEach(registro => {
                                newRegistros.push({
                                    ...registro,
                                    clientId: client.id,
                                    bikeId: bike.id
                                });
                            });
                        }
                        delete newBike.registros;
                        newClient.bicicletas.push(newBike);
                    });
                    newClients.push(newClient);
                });

                localStorage.setItem('bicicletario_clients', JSON.stringify(newClients));
                localStorage.setItem('bicicletario_registros', JSON.stringify(newRegistros));
                this.organizeRegistrosByDate(newRegistros);
                localStorage.removeItem('bicicletarioData');
                return { clients: newClients, registros: newRegistros };
            } catch (error) {
                localStorage.removeItem('bicicletarioData');
            }
        }
        return null;
    },

    loadCategorias() {
        if (isElectron && window.electron && window.electron.loadCategorias) {
            // No Electron, loadCategorias é geralmente assíncrono, mas aqui estamos em um contexto síncrono ou legado
            // Para simplificar e manter compatibilidade, vamos usar o localStorage como fonte primária na web
        }
        const data = localStorage.getItem('bicicletario_categorias');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                if (typeof parsed === 'object' && !Array.isArray(parsed)) {
                    return parsed;
                }
                if (Array.isArray(parsed)) {
                    const obj = {};
                    parsed.forEach(cat => {
                        obj[cat] = this.getDefaultEmoji(cat);
                    });
                    this.saveCategorias(obj);
                    return obj;
                }
            } catch (e) {
                console.error('Erro ao carregar categorias:', e);
            }
        }
        const defaultCategories = {
            'CLIENTE': '👤',
            'LOJISTA': '🏪',
            'IFOOD': '🍽️',
            'ACADEMIA': '💪',
            'MORADOR': '🏠',
            'VISITANTE': '🚶',
            'VIP': '⭐',
            'ENTREGA': '📦'
        };
        this.saveCategorias(defaultCategories);
        return defaultCategories;
    },

    getDefaultEmoji(categoryName) {
        const categoryUpper = categoryName.toUpperCase();
        const emojiMap = {
            'CLIENTE': '👤',
            'LOJISTA': '🏪',
            'IFOOD': '🍽️',
            'ACADEMIA': '💪',
            'MORADOR': '🏠',
            'VISITANTE': '🚶',
            'VIP': '⭐',
            'ENTREGA': '📦'
        };
        return emojiMap[categoryUpper] || '⚙️';
    },

    async saveCategorias(categorias) {
        if (isElectron) {
            await window.electron.saveCategorias(categorias);
        } else {
            localStorage.setItem('bicicletario_categorias', JSON.stringify(categorias));
            if (fileStorageAvailable) {
                await FileStorage.saveCategorias(categorias);
            }
        }
    },

    async saveImage(base64Data) {
        if (isElectron) {
            // Electron implementation
            const result = await window.electron.saveImage(base64Data);
            if (result.success) {
                return result.url; // Returns filename or full path
            }
        } else if (fileStorageAvailable) {
            const result = await FileStorage.uploadImage(base64Data);
            if (result.success) {
                return result.url; // Returns /imagens/img_uuid.jpg
            }
        }
        return base64Data; // Fallback to base64 if upload fails or not available
    },

    // Métodos para o Dashboard

    async getHistoricRegistros() {
        let allRegistros = [];
        if (isElectron) {
            allRegistros = await window.electron.loadRegistros();
        } else {
            // First try to load from the main flat list which is usually the source of truth in web mode
            const flatList = this.loadRegistrosSync();

            if (flatList && flatList.length > 0) {
                allRegistros = flatList;
            } else {
                // Fallback to organized structure if flat list is empty (legacy support)
                const organizedStr = localStorage.getItem('bicicletario_registros_organizados');
                if (organizedStr) {
                    try {
                        const organized = JSON.parse(organizedStr);
                        Object.values(organized).forEach(yearData => {
                            Object.values(yearData).forEach(monthData => {
                                Object.values(monthData).forEach(dayRegistros => {
                                    allRegistros = allRegistros.concat(dayRegistros);
                                });
                            });
                        });
                    } catch (e) {
                        console.error("Erro ao ler registros organizados", e);
                    }
                }
            }
        }
        return allRegistros;
    },

    async getWeeklyActivityStats(registros = null) {
        if (!registros) {
            registros = await this.getHistoricRegistros();
        }
        const stats = [];
        const today = new Date();

        for (let i = 6; i >= 0; i--) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);

            // Generate local YYYY-MM-DD string
            const year = d.getFullYear();
            const month = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            const localDateStr = `${year}-${month}-${day}`;

            const dayName = d.toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '');

            // Conta entradas neste dia usando comparação de data local
            const count = registros.filter(r => {
                if (!r.dataHoraEntrada) return false;
                const rDate = new Date(r.dataHoraEntrada);

                const rYear = rDate.getFullYear();
                const rMonth = String(rDate.getMonth() + 1).padStart(2, '0');
                const rDay = String(rDate.getDate()).padStart(2, '0');
                const rLocalDateStr = `${rYear}-${rMonth}-${rDay}`;

                return rLocalDateStr === localDateStr;
            }).length;

            stats.push({ day: dayName.charAt(0).toUpperCase() + dayName.slice(1), value: count, date: localDateStr });
        }
        return stats;
    },

    async getPeakHourStats(registros = null) {
        if (!registros) {
            registros = await this.getHistoricRegistros();
        }
        const hours = Array(24).fill(0);

        registros.forEach(r => {
            if (r.dataHoraEntrada) {
                const hour = new Date(r.dataHoraEntrada).getHours();
                if (hour >= 0 && hour < 24) {
                    hours[hour]++;
                }
            }
        });

        return hours; // Array com 24 posições, cada uma com a contagem acumulada
    }
};
