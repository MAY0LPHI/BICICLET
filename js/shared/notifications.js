/**
 * ============================================================
 *  ARQUIVO: notifications.js
 *  DESCRIÇÃO: Gerenciador de notificações automáticas do sistema
 *
 *  FUNÇÃO: Monitora a atividade do bicicletário e envia alertas
 *          automáticos para os funcionários em situações como:
 *
 *  NOTIFICAÇÕES DISPONÍVEIS:
 *  1. INATIVIDADE: Alerta quando nenhum cliente entrou/saiu por um
 *     período configurado (ex: 30 minutos sem movimentação).
 *
 *  2. SOLICITAÇÃO DE RONDA POR ACESSO: Solicita verificação após
 *     um número X de entradas/saídas (ex: a cada 10 movimentações).
 *
 *  3. RONDA PERIÓDICA: Solicita uma ronda de segurança no local
 *     em intervalos fixos (ex: a cada 60 minutos).
 *
 *  PARA INICIANTES:
 *  - Este arquivo é instanciado automaticamente e exporta uma
 *    instância global: notificationManager
 *  - Para registrar uma movimentação: notificationManager.onClientActivity()
 *  - As configurações são ajustadas no painel de configurações do sistema.
 * ============================================================
 */

import { Modals } from './modals.js';

/**
 * Classe NotificationManager — Gerencia todos os alertas e notificações do sistema.
 * Controla timers de inatividade, rondas periódicas e contadores de acesso.
 */
export class NotificationManager {

    /**
     * Inicializa o gerenciador com os valores padrão de configuração.
     * Após a criação, carrega as configurações salvas e inicia o monitoramento.
     */
    constructor() {
        /**
         * Configurações das notificações:
         * - inactivityEnabled: ativa/desativa o alerta de inatividade
         * - inactivityInterval: tempo (em minutos) sem movimentação para disparar alerta
         * - inactivityRandom: se true, o intervalo é aleatório entre 5-15 min
         * - patrolRequestEnabled: ativa solicitação de ronda por número de acessos
         * - patrolRequestCount: quantos acessos para pedir uma ronda
         * - patrolRoundEnabled: ativa rondas periódicas por tempo
         * - patrolRoundInterval: intervalo em minutos entre rondas periódicas
         */
        this.settings = {
            inactivityEnabled: false,
            inactivityInterval: 10,  // minutos sem movimentação
            inactivityRandom: false,
            patrolRequestEnabled: false,
            patrolRequestCount: 10,  // número de acessos para pedir ronda
            patrolRoundEnabled: false,
            patrolRoundInterval: 60,  // minutos entre rondas periódicas
        };

        /**
         * Timers ativos (referências para poder cancelá-los quando necessário):
         * - inactivity: timer do monitoramento de inatividade
         * - patrolRound: timer do ciclo de ronda periódica
         * - patrolSnooze: timer do "adiar ronda" (5 minutos de soneca)
         */
        this.timers = {
            inactivity: null,
            patrolRound: null,
            patrolSnooze: null,
        };

        /**
         * Contadores de atividade:
         * - accessCount: quantas entradas/saídas ocorreram desde a última ronda
         * - lastActivity: timestamp da última movimentação registrada
         */
        this.counters = {
            accessCount: 0,
            lastActivity: Date.now(),
        };

        this.patrolSnoozed = false; // Indica se a ronda está em "modo soneca"
        this.init(); // Carrega configurações e inicia o monitoramento
    }

    /**
     * Inicializa o sistema: carrega as configurações salvas e começa a monitorar.
     * Chamado automaticamente no construtor.
     */
    async init() {
        await this.loadSettings();
        this.startMonitoring();
    }

    /**
     * Carrega as configurações de notificação salvas no LocalStorage.
     * Se não houver configurações salvas, mantém os valores padrão.
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('notification_settings');
            if (saved) {
                // Mescla os padrões com os valores salvos
                this.settings = { ...this.settings, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('Erro ao carregar configurações de notificações:', error);
        }
    }

    /**
     * Salva novas configurações de notificação e reinicia o monitoramento.
     * Chamado pelo painel de configurações quando o usuário altera as opções.
     *
     * @param {Object} newSettings - Objeto com as configurações a atualizar
     */
    saveSettings(newSettings) {
        this.settings = { ...this.settings, ...newSettings };
        localStorage.setItem('notification_settings', JSON.stringify(this.settings));
        this.restartMonitoring(); // Reinicia com as novas configurações
    }

    /**
     * Retorna uma cópia das configurações atuais.
     * (Retorna cópia para evitar modificação acidental do objeto interno)
     *
     * @returns {Object} Configurações atuais de notificação
     */
    getSettings() {
        return { ...this.settings };
    }

    /**
     * Inicia todos os monitores de notificação habilitados nas configurações.
     * Primeiro para os monitores anteriores para evitar timers duplicados.
     */
    startMonitoring() {
        this.stopMonitoring(); // Garante que não há timers duplicados

        if (this.settings.inactivityEnabled) {
            this.startInactivityMonitor(); // Inicia monitor de inatividade
        }

        if (this.settings.patrolRoundEnabled) {
            this.startPatrolRoundMonitor(); // Inicia monitor de ronda periódica
        }
    }

    /**
     * Para todos os timers de monitoramento ativos.
     * Deve ser chamado antes de reiniciar com novas configurações.
     */
    stopMonitoring() {
        // Cancela o timer de inatividade
        if (this.timers.inactivity) {
            clearTimeout(this.timers.inactivity);
            this.timers.inactivity = null;
        }

        // Cancela o timer da ronda periódica
        if (this.timers.patrolRound) {
            clearTimeout(this.timers.patrolRound);
            this.timers.patrolRound = null;
        }

        // Cancela o timer de "soneca da ronda"
        if (this.timers.patrolSnooze) {
            clearTimeout(this.timers.patrolSnooze);
            this.timers.patrolSnooze = null;
        }
    }

    /**
     * Para todos os timers e inicia novamente com as configurações atuais.
     * Útil quando as configurações são alteradas pelo painel de administração.
     */
    restartMonitoring() {
        this.stopMonitoring();
        this.startMonitoring();
    }

    /**
     * Inicia o monitor de inatividade usando um timer recursivo (auto-agendado).
     * A cada ciclo, agenda o próximo automaticamente, formando um loop suave.
     *
     * Se inactivityRandom for true, o intervalo varia aleatoriamente entre 5 e 15 minutos,
     * tornando o alerta menos previsível (útil para segurança).
     */
    startInactivityMonitor() {
        const scheduleNext = () => {
            let delay;

            if (this.settings.inactivityRandom) {
                // Intervalo aleatório entre 5 e 15 minutos (convertido para ms)
                delay = (5 + Math.random() * 10) * 60 * 1000;
            } else {
                // Intervalo fixo configurado pelo usuário (em ms)
                delay = this.settings.inactivityInterval * 60 * 1000;
            }

            // Agenda a verificação de inatividade e o próximo ciclo
            this.timers.inactivity = setTimeout(() => {
                this.checkInactivity();
                scheduleNext(); // Auto-agenda o próximo ciclo
            }, delay);
        };

        scheduleNext(); // Inicia o primeiro ciclo
    }

    /**
     * Verifica se o tempo desde a última atividade ultrapassou o limite configurado.
     * Se ultrapassou, exibe a notificação de inatividade.
     */
    checkInactivity() {
        const now = Date.now();
        const elapsed = now - this.counters.lastActivity;
        const threshold = this.settings.inactivityInterval * 60 * 1000;

        if (elapsed >= threshold) {
            this.showInactivityNotification();
        }
    }

    /**
     * Exibe um modal de alerta informando que não houve movimentação recente.
     * Também toca um som de notificação para chamar a atenção do funcionário.
     */
    showInactivityNotification() {
        const message = 'Nenhum cliente entrou ou saiu recentemente. Verifique se há alguma movimentação no bicicletário.';
        Modals.alert(message, 'Alerta de Inatividade', 'bell');
        this.playNotificationSound();
    }

    /**
     * Registra uma atividade de entrada ou saída de cliente.
     * Atualiza o timestamp da última atividade e incrementa o contador de acessos.
     * Se o contador atingir o limite configurado, solicita uma ronda.
     *
     * Deve ser chamado toda vez que um cliente entra ou sai do bicicletário:
     *   notificationManager.onClientActivity();
     */
    recordActivity() {
        this.counters.lastActivity = Date.now(); // Atualiza o tempo da última atividade
        this.counters.accessCount++;             // Incrementa o contador de acessos

        // Verifica se deve solicitar ronda por número de acessos
        if (this.settings.patrolRequestEnabled) {
            if (this.counters.accessCount >= this.settings.patrolRequestCount) {
                this.showPatrolRequestNotification();
                this.counters.accessCount = 0; // Reinicia o contador após o alerta
            }
        }
    }

    /**
     * Exibe notificação solicitando uma verificação/ronda após N acessos.
     */
    showPatrolRequestNotification() {
        const message = `Foram registrados ${this.settings.patrolRequestCount} acessos ou saídas. É recomendado realizar uma verificação ou ronda no local.`;
        Modals.alert(message, 'Solicitação de Ronda', 'user-check');
        this.playNotificationSound();
    }

    /**
     * Inicia o monitor de ronda periódica, disparando a cada X minutos.
     * Usa timer recursivo (auto-agendado) igual ao monitor de inatividade.
     * Se a ronda estiver em "soneca", o popup não é exibido naquele ciclo.
     */
    startPatrolRoundMonitor() {
        const scheduleNext = () => {
            const delay = this.settings.patrolRoundInterval * 60 * 1000;

            this.timers.patrolRound = setTimeout(() => {
                if (!this.patrolSnoozed) {
                    this.showPatrolRoundPopup(); // Exibe popup apenas se não estiver adiado
                }
                scheduleNext(); // Auto-agenda o próximo ciclo
            }, delay);
        };

        scheduleNext(); // Inicia o primeiro ciclo
    }

    /**
     * Exibe o popup de solicitação de ronda periódica com opções de:
     * - "Adiar 5 minutos": adia a notificação por 5 minutos (soneca)
     * - "Tarefa Realizada": registra a ronda como concluída no histórico
     *
     * Usa lucide.createIcons() para renderizar os ícones após inserir o HTML.
     * O setTimeout de 100ms garante que o DOM seja atualizado antes de buscar os botões.
     */
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
        this.playNotificationSound(); // Toca som de alerta

        // Aguarda 100ms para o DOM atualizar e os botões existirem na tela
        setTimeout(() => {
            lucide.createIcons(); // Renderiza os ícones SVG inseridos no HTML

            const snoozeBtn = document.getElementById('snooze-patrol-btn');
            const completeBtn = document.getElementById('complete-patrol-btn');

            // Botão "Adiar": ativa a soneca e fecha o modal
            if (snoozeBtn) {
                snoozeBtn.addEventListener('click', () => {
                    this.snoozePatrolRound();
                    Modals.close();
                });
            }

            // Botão "Tarefa Realizada": registra a ronda e fecha o modal
            if (completeBtn) {
                completeBtn.addEventListener('click', () => {
                    this.completePatrolRound();
                    Modals.close();
                });
            }
        }, 100);
    }

    /**
     * Ativa a "soneca" da ronda periódica por 5 minutos.
     * Durante a soneca, o popup não é exibido mesmo que o timer dispare.
     * Após 5 minutos, a soneca é desativada e o popup é exibido novamente.
     */
    snoozePatrolRound() {
        this.patrolSnoozed = true;

        // Cancela qualquer timer de soneca anterior (para evitar duplicatas)
        if (this.timers.patrolSnooze) {
            clearTimeout(this.timers.patrolSnooze);
        }

        // Agenda o fim da soneca após 5 minutos
        this.timers.patrolSnooze = setTimeout(() => {
            this.patrolSnoozed = false;
            this.timers.patrolSnooze = null;
            this.showPatrolRoundPopup(); // Exibe o popup novamente após a soneca
        }, 5 * 60 * 1000); // 5 minutos em milissegundos

        Modals.alert('A ronda foi adiada por 5 minutos.', 'Ronda Adiada', 'clock');
    }

    /**
     * Registra a conclusão de uma ronda no histórico (LocalStorage).
     * O histórico pode ser consultado pelo método getPatrolLogs().
     */
    completePatrolRound() {
        const completionTime = new Date().toISOString();

        // Cria o registro desta ronda concluída
        const log = {
            type: 'patrol_round',
            timestamp: completionTime,
            status: 'completed'
        };

        // Adiciona ao histórico de rondas salvo no LocalStorage
        const logs = JSON.parse(localStorage.getItem('patrol_logs') || '[]');
        logs.push(log);
        localStorage.setItem('patrol_logs', JSON.stringify(logs));

        Modals.alert('Ronda registrada como concluída. Obrigado!', 'Ronda Concluída', 'check-circle');
    }

    /**
     * Toca um som curto de notificação usando a Web Audio API.
     * Cria um oscilador (tom de bipe) de 800Hz com duração de 0.5 segundos.
     * Tem fade-out suave para não ser abrupto.
     *
     * Nota: Pode falhar silenciosamente em browsers sem suporte à Web Audio API
     * ou se o usuário bloqueou permissões de áudio.
     */
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator(); // Gerador de tom
            const gainNode = audioContext.createGain();       // Controle de volume

            // Conecta: oscilador → controle de volume → saída de áudio
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // Frequência do bipe (800 Hz)
            oscillator.type = 'sine';          // Forma de onda senoidal (suave)

            // Volume: começa em 30%, faz fade-out rápido até quase zero em 0.5s
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            // Toca o bipe por 0.5 segundos e para
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.warn('Não foi possível tocar o som de notificação:', error);
        }
    }

    /**
     * Método público para ser chamado quando um cliente entra ou sai.
     * É uma interface simplificada para recordActivity().
     *
     * Uso (em registros-diarios.js ou qualquer lugar que registre movimentação):
     *   notificationManager.onClientActivity();
     */
    onClientActivity() {
        this.recordActivity();
    }

    /**
     * Retorna o histórico completo de rondas registradas.
     * Cada registro tem: type, timestamp e status.
     *
     * @returns {Array} Lista de objetos de log de ronda
     */
    getPatrolLogs() {
        try {
            return JSON.parse(localStorage.getItem('patrol_logs') || '[]');
        } catch (error) {
            return [];
        }
    }

    /**
     * Remove os registros de ronda mais antigos que N dias do histórico.
     * Use para manter o histórico limpo sem acumular dados indefinidamente.
     *
     * @param {number} [daysToKeep=30] - Quantos dias de histórico manter (padrão: 30 dias)
     */
    clearOldPatrolLogs(daysToKeep = 30) {
        try {
            const logs = this.getPatrolLogs();

            // Calcula a data de corte: registros mais antigos que esta data serão removidos
            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

            // Filtra apenas os logs mais recentes que a data de corte
            const filtered = logs.filter(log => {
                const logDate = new Date(log.timestamp);
                return logDate >= cutoffDate;
            });

            localStorage.setItem('patrol_logs', JSON.stringify(filtered));
        } catch (error) {
            console.error('Erro ao limpar logs de ronda:', error);
        }
    }
}

// ─────────────────────────────────────────────────────────
// Instância global pré-criada do gerenciador de notificações.
// Importe e use diretamente: import { notificationManager } from './shared/notifications.js';
// ─────────────────────────────────────────────────────────
export const notificationManager = new NotificationManager();
