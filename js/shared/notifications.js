import { Modals } from './modals.js';

export class NotificationManager {
    constructor() {
        this.settings = {
            inactivityEnabled: false,
            inactivityInterval: 10, // minutos
            inactivityRandom: false,
            patrolRequestEnabled: false,
            patrolRequestCount: 10, // número de acessos
            patrolRoundEnabled: false,
            patrolRoundInterval: 60, // minutos
        };
        
        this.timers = {
            inactivity: null,
            patrolRound: null,
            patrolSnooze: null,
        };
        
        this.counters = {
            accessCount: 0,
            lastActivity: Date.now(),
        };
        
        this.patrolSnoozed = false;
        this.init();
    }
    
    async init() {
        await this.loadSettings();
        this.startMonitoring();
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('notification_settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de notificações:', error);
        }
    }
    
    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('notification_settings', JSON.stringify(this.settings));
        this.restartMonitoring();
    }
    
    getSettings() {
        return { ...this.settings };
    }
    
    startMonitoring() {
        this.stopMonitoring();
        
        if (this.settings.inactivityEnabled) {
            this.startInactivityMonitor();
        }
        
        if (this.settings.patrolRoundEnabled) {
            this.startPatrolRoundMonitor();
        }
    }
    
    stopMonitoring() {
        if (this.timers.inactivity) {
            clearTimeout(this.timers.inactivity);
            this.timers.inactivity = null;
        }
        
        if (this.timers.patrolRound) {
            clearTimeout(this.timers.patrolRound);
            this.timers.patrolRound = null;
        }
        
        if (this.timers.patrolSnooze) {
            clearTimeout(this.timers.patrolSnooze);
            this.timers.patrolSnooze = null;
        }
    }
    
    restartMonitoring() {
        this.stopMonitoring();
        this.startMonitoring();
    }
    
    startInactivityMonitor() {
        const scheduleNext = () => {
            let delay;
            
            if (this.settings.inactivityRandom) {
                // Intervalo aleatório entre 5 e 15 minutos
                delay = (5 + Math.random() * 10) * 60 * 1000;
            } else {
                delay = this.settings.inactivityInterval * 60 * 1000;
            }
            
            this.timers.inactivity = setTimeout(() => {
                this.checkInactivity();
                scheduleNext();
            }, delay);
        };
        
        scheduleNext();
    }
    
    checkInactivity() {
        const now = Date.now();
        const elapsed = now - this.counters.lastActivity;
        const threshold = this.settings.inactivityInterval * 60 * 1000;
        
        if (elapsed >= threshold) {
            this.showInactivityNotification();
        }
    }
    
    showInactivityNotification() {
        const message = 'Nenhum cliente entrou ou saiu recentemente. Verifique se há alguma movimentação no bicicletário.';
        
        Modals.alert(message, 'Alerta de Inatividade', 'bell');
        
        this.playNotificationSound();
    }
    
    recordActivity() {
        this.counters.lastActivity = Date.now();
        this.counters.accessCount++;
        
        // Verificar se atingiu o limite para solicitação de ronda
        if (this.settings.patrolRequestEnabled) {
            if (this.counters.accessCount >= this.settings.patrolRequestCount) {
                this.showPatrolRequestNotification();
                this.counters.accessCount = 0; // Resetar contador
            }
        }
    }
    
    showPatrolRequestNotification() {
        const message = `Foram registrados ${this.settings.patrolRequestCount} acessos ou saídas. É recomendado realizar uma verificação ou ronda no local.`;
        
        Modals.alert(message, 'Solicitação de Ronda', 'user-check');
        this.playNotificationSound();
    }
    
    startPatrolRoundMonitor() {
        const scheduleNext = () => {
            const delay = this.settings.patrolRoundInterval * 60 * 1000;
            
            this.timers.patrolRound = setTimeout(() => {
                if (!this.patrolSnoozed) {
                    this.showPatrolRoundPopup();
                }
                scheduleNext();
            }, delay);
        };
        
        scheduleNext();
    }
    
    showPatrolRoundPopup() {
        const content = `
            <div class="space-y-4">
                <div class="flex items-center gap-3 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                    <i data-lucide="alert-triangle" class="w-8 h-8 text-yellow-600 dark:text-yellow-400 flex-shrink-0"></i>
                    <div>
                        <p class="font-semibold text-slate-800 dark:text-slate-200 mb-1">Hora de Realizar uma Ronda!</p>
                        <p class="text-sm text-slate-600 dark:text-slate-400">
                            Por favor, verifique bicicletas destrancadas e pertences no local.
                        </p>
                    </div>
                </div>
                
                <div class="flex gap-3">
                    <button id="snooze-patrol-btn" class="flex-1 py-2.5 px-4 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="clock" class="w-4 h-4"></i>
                        Adiar 5 minutos
                    </button>
                    <button id="complete-patrol-btn" class="flex-1 py-2.5 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                        <i data-lucide="check-circle" class="w-4 h-4"></i>
                        Tarefa Realizada
                    </button>
                </div>
            </div>
        `;
        
        Modals.showWithIcon('Ronda de Verificação', content, 'clipboard-check');
        
        // Tocar som de alerta
        this.playNotificationSound();
        
        setTimeout(() => {
            lucide.createIcons();
            
            const snoozeBtn = document.getElementById('snooze-patrol-btn');
            const completeBtn = document.getElementById('complete-patrol-btn');
            
            if (snoozeBtn) {
                snoozeBtn.addEventListener('click', () => {
                    this.snoozePatrolRound();
                    Modals.close();
                });
            }
            
            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    this.completePatrolRound();
                    Modals.close();
                });
            }
        }, 100);
    }
    
    snoozePatrolRound() {
        this.patrolSnoozed = true;
        
        // Clear any existing snooze timer to avoid duplicates
        if (this.timers.patrolSnooze) {
            clearTimeout(this.timers.patrolSnooze);
        }
        
        this.timers.patrolSnooze = setTimeout(() => {
            this.patrolSnoozed = false;
            this.timers.patrolSnooze = null;
            this.showPatrolRoundPopup();
        }, 5 * 60 * 1000); // 5 minutos
        
        Modals.alert('A ronda foi adiada por 5 minutos.', 'Ronda Adiada', 'clock');
    }
    
    completePatrolRound() {
        // Registrar conclusão da ronda
        const completionTime = new Date().toISOString();
        const log = {
            type: 'patrol_round',
            timestamp: completionTime,
            status: 'completed'
        };
        
        // Salvar log (opcional - pode expandir para histórico)
        const logs = JSON.parse(localStorage.getItem('patrol_logs') || '[]');
        logs.push(log);
        localStorage.setItem('patrol_logs', JSON.stringify(logs));
        
        Modals.alert('Ronda registrada como concluída. Obrigado!', 'Ronda Concluída', 'check-circle');
    }
    
    playNotificationSound() {
        try {
            // Usar API Web Audio para tocar um som simples
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Não foi possível tocar som de notificação:', error);
        }
    }
    
    // Método para ser chamado quando há entrada/saída de cliente
    onClientActivity() {
        this.recordActivity();
    }
    
    // Obter estatísticas de ronda
    getPatrolLogs() {
        try {
            return JSON.parse(localStorage.getItem('patrol_logs') || '[]');
        } catch (error) {
            return [];
        }
    }
    
    // Limpar logs antigos (opcional)
    clearOldPatrolLogs(daysToKeep = 30) {
        try {
            const logs = this.getPatrolLogs();
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
            
            const filtered = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= cutoffDate;
            });
            
            localStorage.setItem('patrol_logs', JSON.stringify(filtered));
        } catch (error) {
            console.error('Erro ao limpar logs:', error);
        }
    }
}

// Instância global do gerenciador de notificações
export const notificationManager = new NotificationManager();
