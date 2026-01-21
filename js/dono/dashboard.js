import { Utils } from '../shared/utils.js';
import { Storage } from '../shared/storage.js';
import { Config } from '../shared/config.js';

export class DonoDashboard {
    constructor(app, containerId) {
        this.app = app;
        this.containerId = containerId;
    }

    async render() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        try {
            // Show loading state
            container.innerHTML = '<div class="flex items-center justify-center h-64"><div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>';

            const metrics = await this.calculateMetrics();

            const occupancyPercentage = Math.round((metrics.currentOccupancy / metrics.maxCapacity) * 100);
            let occupancyColor = 'bg-blue-500';
            if (occupancyPercentage > 75) occupancyColor = 'bg-amber-500';
            if (occupancyPercentage > 90) occupancyColor = 'bg-red-500';

            container.innerHTML = `
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <!-- Card 1: Total Clientes -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                            <i data-lucide="users" class="w-6 h-6 text-blue-600 dark:text-blue-400"></i>
                        </div>
                        <span class="text-xs font-medium text-green-600 bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded-full">+${metrics.newClientsLast7Days} esta semana</span>
                    </div>
                    <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">${metrics.totalClients}</div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Total de Clientes</p>
                </div>

                <!-- Card 2: Bicicletas Ativas -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                            <i data-lucide="bike" class="w-6 h-6 text-purple-600 dark:text-purple-400"></i>
                        </div>
                    </div>
                    <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">${metrics.totalBikes}</div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Bicicletas Cadastradas</p>
                </div>

                <!-- Card 3: Ocupação Atual (Com Barra de Progresso) -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md">
                    <div class="flex items-center justify-between mb-2">
                        <div class="w-12 h-12 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                            <i data-lucide="parking-circle" class="w-6 h-6 text-indigo-600 dark:text-indigo-400"></i>
                        </div>
                        <span class="text-xs font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded-full">${occupancyPercentage}% Ocupado</span>
                    </div>
                    <div class="flex items-end justify-between mb-2">
                        <div class="text-3xl font-bold text-slate-800 dark:text-white">
                            ${metrics.currentOccupancy}<span class="text-lg text-slate-400 font-normal"> / ${metrics.maxCapacity}</span>
                            <button id="edit-capacity-btn" class="ml-2 inline-flex items-center justify-center p-1 text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors" title="Editar Capacidade">
                                <i data-lucide="pencil" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                    
                    <!-- Progress Bar -->
                    <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5 mb-1">
                        <div class="${occupancyColor} h-2.5 rounded-full transition-all duration-1000 ease-out" style="width: 0%" id="occupancy-bar"></div>
                    </div>
                    <p class="text-xs text-slate-500 dark:text-slate-400 text-right">Vagas Disponíveis: ${Math.max(0, metrics.maxCapacity - metrics.currentOccupancy)}</p>
                </div>

                 <!-- Card 4: Alertas de Permanência -->
                <!-- Card 4: Alertas de Permanência -->
                <div id="long-stay-card" class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 transition-all hover:shadow-md hover:bg-slate-50 dark:hover:bg-slate-700/50 relative overflow-hidden cursor-pointer group">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-12 h-12 ${metrics.longStays > 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-emerald-100 dark:bg-emerald-900/30'} rounded-lg flex items-center justify-center transition-transform group-hover:scale-110">
                            <i data-lucide="${metrics.longStays > 0 ? 'alert-triangle' : 'check-circle'}" class="w-6 h-6 ${metrics.longStays > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}"></i>
                        </div>
                        ${metrics.longStays > 0 ? `<span class="animate-pulse w-2 h-2 bg-amber-500 rounded-full absolute top-6 right-6"></span>` : ''}
                    </div>
                    <div class="text-3xl font-bold text-slate-800 dark:text-white mb-1">${metrics.longStays}</div>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Permanência > 24h</p>
                    <p class="text-xs text-blue-500 dark:text-blue-400 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">Ver detalhes &rarr;</p>
                </div>
            </div>

            <!-- Charts Section -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- Chart 1: Atividade Semanal -->
                <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <i data-lucide="bar-chart-2" class="w-5 h-5 text-blue-500"></i>
                        Atividade Semanal (Entradas)
                    </h3>
                    <div class="flex items-end justify-between h-48 space-x-2">
                        ${this.renderWeeklyChart(metrics.weeklyActivity)}
                    </div>
                </div>

                <!-- Chart 2: Horários de Pico -->
                 <div class="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                        <i data-lucide="clock" class="w-5 h-5 text-purple-500"></i>
                        Horários de Pico (Geral)
                    </h3>
                    <div class="flex items-end justify-between h-48 space-x-1">
                        ${this.renderPeakHoursChart(metrics.peakHours)}
                    </div>
                    <div class="flex justify-between text-xs text-slate-400 mt-2 px-1">
                        <span>00h</span>
                        <span>06h</span>
                        <span>12h</span>
                        <span>18h</span>
                        <span>23h</span>
                    </div>
                </div>
            </div>
        `;

            lucide.createIcons();
            lucide.createIcons();
            this.setupEditCapacity();
            this.setupLongStayClick();

            // Animate Progress Bar
            setTimeout(() => {
                const bar = document.getElementById('occupancy-bar');
                if (bar) bar.style.width = `${occupancyPercentage}%`;
            }, 100);

        } catch (error) {
            console.error('Erro ao renderizar dashboard:', error);
            container.innerHTML = `
                <div class="p-4 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg">
                    <p class="font-bold">Erro ao carregar dashboard</p>
                    <p class="text-sm">${error.message}</p>
                    <button onclick="window.location.reload()" class="mt-2 text-xs underline">Recarregar Página</button>
                </div>
            `;
        }
    }

    setupEditCapacity() {
        const editBtn = document.getElementById('edit-capacity-btn');
        if (!editBtn) return;

        // Remover listeners antigos para evitar duplicação (embora re-render substitua o DOM)
        const newBtn = editBtn.cloneNode(true);
        editBtn.parentNode.replaceChild(newBtn, editBtn);

        newBtn.addEventListener('click', async () => {
            const { Modals } = await import('../shared/modals.js');
            const metrics = await this.calculateMetrics();

            const newCapacity = await Modals.showInputPrompt(
                `Capacidade Atual: ${Config.MAX_CAPACITY}`,
                'Definir Nova Capacidade'
            );

            if (!newCapacity) return;

            const cap = parseInt(newCapacity);
            if (isNaN(cap) || cap <= 0) {
                return Modals.alert('Por favor, insira um número válido maior que zero.', 'Valor Inválido');
            }

            // 1. Salva localmente (Garante funcionalidade imediata "leve")
            Config.saveLocal({ maxCapacity: cap });
            this.render(); // Atualiza UI na hora

            // 2. Tenta persistir no servidor (Background sync best-effort)
            try {
                const response = await fetch('/api/system-config', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ maxCapacity: cap })
                });

                if (response.ok) {
                    this.app.jobMonitor.showToast('Capacidade salva no servidor!', 'success');
                } else {
                    console.warn('Servidor antigo/offline (405/404). Config salva apenas localmente.');
                    this.app.jobMonitor.showToast('Salvo localmente (Servidor não atualizado)', 'warning');
                }
            } catch (e) {
                console.warn('Erro de conexão. Config salva apenas localmente.', e);
                this.app.jobMonitor.showToast('Salvo localmente (Sem conexão)', 'warning');
            }
        });
    }

    setupLongStayClick() {
        const card = document.getElementById('long-stay-card');
        if (card) {
            // Remove old listener if any (managed by replacing element? No, here we just add)
            // Ideally we should handle cleanup but since render replaces innerHTML, it's fine.
            card.addEventListener('click', () => this.showLongStayDetails());
        }
    }

    async showLongStayDetails() {
        const activeRegistros = (this.app.data.registros || []).filter(r => !r.dataHoraSaida);
        const now = new Date();
        const longStayThreshold = new Date(now.getTime() - (Config.LONG_STAY_HOURS * 60 * 60 * 1000));

        const longStayRecords = activeRegistros.filter(r => {
            const entryDate = new Date(r.dataHoraEntrada);
            return entryDate < longStayThreshold;
        });

        if (longStayRecords.length === 0) {
            const { Modals } = await import('../shared/modals.js');
            return Modals.showAlert('Nenhuma bicicleta com permanência superior a 24h no momento.', 'Tudo Certo');
        }

        // Map to format expected by openCustomListModal
        const mappedRecords = longStayRecords.map(registro => {
            const client = this.app.data.clients.find(c => c.id === registro.clientId);
            if (!client) return null;
            const bike = client.bicicletas.find(b => b.id === registro.bikeId);
            if (!bike) return null;

            // Fix bikeSnapshot if missing (legacy support)
            if (!registro.bikeSnapshot && bike) {
                registro.bikeSnapshot = {
                    modelo: bike.modelo,
                    marca: bike.marca,
                    cor: bike.cor
                };
            }

            return { client, bike, registro };
        }).filter(Boolean);

        if (this.app.registrosManager && this.app.registrosManager.openCustomListModal) {
            this.app.registrosManager.openCustomListModal('Permanência > 24h', mappedRecords);
        } else {
            console.error('RegistrosManager or openCustomListModal not available');
        }
    }

    async calculateMetrics() {
        console.log('--- Calculating Metrics ---');
        const clients = this.app.data.clients || [];
        const activeRegistros = (this.app.data.registros || []).filter(r => !r.dataHoraSaida);
        console.log(`Clients: ${clients.length}, Active Registros: ${activeRegistros.length}`);

        const totalClients = clients.length;

        let totalBikes = 0;
        clients.forEach(c => {
            if (c.bicicletas) {
                const bikes = typeof c.bicicletas === 'string' ? JSON.parse(c.bicicletas) : c.bicicletas;
                if (Array.isArray(bikes)) totalBikes += bikes.length;
            }
        });

        // New clients last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const newClientsLast7Days = clients.filter(c => {
            if (!c.dataCadastro) return false;
            const date = new Date(c.dataCadastro);
            return date > sevenDaysAgo;
        }).length;

        // Occupancy
        const currentOccupancy = activeRegistros.length; // Bikes atualmente dentro
        const maxCapacity = Config.MAX_CAPACITY;

        // Long Stays (> 24h)
        const now = new Date();
        const longStayThreshold = new Date(now.getTime() - (Config.LONG_STAY_HOURS * 60 * 60 * 1000));

        const longStays = activeRegistros.filter(r => {
            const entryDate = new Date(r.dataHoraEntrada);
            return entryDate < longStayThreshold;
        }).length;

        // Historical Data for Charts
        const registros = this.app.data.registros || [];
        const weeklyActivity = await Storage.getWeeklyActivityStats(registros);
        const peakHours = await Storage.getPeakHourStats(registros);

        return {
            totalClients,
            totalBikes,
            newClientsLast7Days,
            currentOccupancy,
            maxCapacity,
            longStays,
            weeklyActivity,
            peakHours
        };
    }

    renderWeeklyChart(data) {
        if (!data || data.length === 0) return '<div class="w-full h-full flex items-center justify-center text-slate-400">Sem dados</div>';
        const maxValue = Math.max(...data.map(d => d.value)) || 1; // Avoid divide by zero

        return data.map(item => {
            const height = Math.max((item.value / maxValue) * 100, 4); // Min height for visibility
            return `
                <div class="flex flex-col items-center flex-1 group relative h-full justify-end">
                     <!-- Tooltip -->
                    <div class="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        ${item.value} entradas
                    </div>
                    <div class="relative w-full bg-slate-100 dark:bg-slate-700/50 rounded-t-sm overflow-hidden flex-1 w-full">
                        <div class="absolute bottom-0 w-full bg-blue-500 dark:bg-blue-600 rounded-t-sm transition-all duration-500 group-hover:bg-blue-600 dark:group-hover:bg-blue-500" style="height: ${height}%"></div>
                    </div>
                    <div class="flex flex-col items-center mt-2 leading-none">
                        <span class="text-xs text-slate-600 dark:text-slate-400 font-medium">${item.day}</span>
                        <span class="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5">${item.date.split('-')[2]}/${item.date.split('-')[1]}</span>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderPeakHoursChart(data) {
        if (!data || data.length === 0) return '<div class="w-full h-full flex items-center justify-center text-slate-400">Sem dados</div>';
        const maxValue = Math.max(...data) || 1;

        return data.map((value, hour) => {
            const height = Math.max((value / maxValue) * 100, 2);
            // Highlight busy hours (e.g. > 50% max)
            const colorClass = (value / maxValue) > 0.7 ? 'bg-purple-500 dark:bg-purple-400' : 'bg-purple-300 dark:bg-purple-900/40';

            return `
                <div class="flex flex-col items-center flex-1 group relative h-full justify-end" title="${hour}h: ${value} entradas">
                     <div class="absolute -top-8 bg-slate-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                        ${hour}h: ${value}
                    </div>
                    <div class="w-full ${colorClass} rounded-t-sm hover:bg-purple-600 dark:hover:bg-purple-300 transition-colors" style="height: ${height}%"></div>
                </div>
            `;
        }).join('');
    }
}
