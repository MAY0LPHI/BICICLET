/**
 * ============================================================
 *  ARQUIVO: logger.js
 *  DESCRIÇÃO: Sistema centralizado de logs do bicicletário
 *
 *  FUNÇÃO: Registra eventos do sistema em diferentes níveis de
 *          severidade (debug, info, aviso, erro). Os logs podem
 *          ser exibidos no console e/ou salvos no LocalStorage
 *          para consulta posterior.
 *
 *  DIFERENÇA ENTRE Logger E Debug:
 *  - Debug (debug.js): para mensagens de desenvolvimento, desativadas em produção.
 *  - Logger (logger.js): para logs estruturados com timestamp, persistidos e exportáveis.
 *
 *  PARA INICIANTES:
 *  - Importe a instância global já criada: import { logger } from './shared/logger.js';
 *  - Use como: logger.info('Usuário logado') ou logger.error('Falha ao salvar')
 * ============================================================
 */

/**
 * Níveis de severidade dos logs.
 * Quanto maior o número, mais grave o nível.
 * O sistema só registra logs com nível >= ao nível mínimo configurado.
 *
 * Ordem: DEBUG(0) < INFO(1) < WARN(2) < ERROR(3) < FATAL(4)
 */
const LogLevel = {
    DEBUG: 0, // Mensagens detalhadas de depuração — só em desenvolvimento
    INFO: 1, // Informações normais de operação do sistema
    WARN: 2, // Avisos — algo inesperado, mas o sistema ainda funciona
    ERROR: 3, // Erros — falha em uma operação, mas o sistema continua
    FATAL: 4  // Erros fatais — sistema pode falhar completamente
};

/**
 * Classe Logger — Gerencia o registro de mensagens do sistema.
 *
 * Exemplo de uso básico:
 *   import { logger } from './shared/logger.js';
 *   logger.info('Sistema iniciado');
 *   logger.error('Falha ao conectar ao servidor', { codigo: 500 });
 */
export class Logger {

    /**
     * Cria uma instância do Logger com as opções fornecidas.
     *
     * @param {Object} [options={}] - Configurações do logger
     * @param {number}  [options.minLevel=LogLevel.INFO] - Nível mínimo a registrar (use LogLevel.DEBUG para ver tudo)
     * @param {boolean} [options.persistLogs=false]       - Se true, salva logs no LocalStorage
     * @param {number}  [options.maxLogs=1000]            - Número máximo de logs salvos antes de limpar os mais antigos
     * @param {boolean} [options.consoleEnabled=true]     - Se true, exibe logs no console do navegador
     */
    constructor(options = {}) {
        this.minLevel = options.minLevel || LogLevel.INFO;
        this.persistLogs = options.persistLogs || false;
        this.maxLogs = options.maxLogs || 1000;
        this.storageKey = 'bicicletario_logs'; // Chave no LocalStorage onde os logs são salvos
        this.consoleEnabled = options.consoleEnabled !== false; // Padrão: true
    }

    /**
     * Cria uma entrada de log estruturada com timestamp, nível e contexto.
     * Inclui também informações do navegador e URL atual para facilitar a depuração.
     *
     * @private — Uso interno apenas
     * @param {number} level   - Nível do log (use LogLevel.INFO, etc.)
     * @param {string} message - Mensagem principal do log
     * @param {Object} [context={}] - Dados adicionais (ex: { usuarioId: 1, acao: 'login' })
     * @returns {Object} Entrada de log formatada
     */
    _formatMessage(level, message, context = {}) {
        return {
            timestamp: new Date().toISOString(), // Data e hora exata do log
            level: this._getLevelName(level),  // Nome do nível (ex: 'INFO')
            message,
            context,
            userAgent: navigator.userAgent,       // Informações do navegador
            url: window.location.href       // Página onde o log foi gerado
        };
    }

    /**
     * Converte o número do nível para seu nome em texto.
     * Ex: LogLevel.INFO (1) => 'INFO'
     *
     * @private
     * @param {number} level - Número do nível
     * @returns {string} Nome do nível ou 'UNKNOWN'
     */
    _getLevelName(level) {
        const names = {
            [LogLevel.DEBUG]: 'DEBUG',
            [LogLevel.INFO]: 'INFO',
            [LogLevel.WARN]: 'WARN',
            [LogLevel.ERROR]: 'ERROR',
            [LogLevel.FATAL]: 'FATAL'
        };
        return names[level] || 'UNKNOWN';
    }

    /**
     * Salva a entrada de log no LocalStorage, se a persistência estiver ativada.
     * Garante que os logs mais antigos são removidos automaticamente quando
     * o limite (maxLogs) é atingido, evitando que o armazenamento fique cheio.
     *
     * @private
     * @param {Object} logEntry - Entrada de log gerada por _formatMessage()
     */
    _persistLog(logEntry) {
        if (!this.persistLogs) return; // Sai imediatamente se não deve persistir

        try {
            const logs = this._getStoredLogs();
            logs.push(logEntry);

            // Se ultrapassar o limite, remove os logs mais antigos (do início do array)
            if (logs.length > this.maxLogs) {
                logs.splice(0, logs.length - this.maxLogs);
            }

            try {
                localStorage.setItem(this.storageKey, JSON.stringify(logs));
            } catch (storageError) {
                // Erro de cota excedida: o LocalStorage está cheio
                if (storageError.name === 'QuotaExceededError' || storageError.name === 'NS_ERROR_DOM_QUOTA_REACHED') {
                    // Reduz para metade dos logs para liberar espaço
                    const reducedLogs = logs.slice(-Math.floor(this.maxLogs / 2));
                    localStorage.setItem(this.storageKey, JSON.stringify(reducedLogs));
                    if (this.consoleEnabled) {
                        console.warn('Cota de armazenamento de logs excedida — logs antigos foram removidos para liberar espaço.');
                    }
                } else {
                    throw storageError; // Relança erros de outro tipo
                }
            }
        } catch (error) {
            // Falha silenciosa: se o armazenamento está completamente indisponível,
            // não interrompe o funcionamento do sistema.
            if (this.consoleEnabled) {
                console.error('Falha ao persistir log:', error);
            }
        }
    }

    /**
     * Lê e retorna todos os logs salvos no LocalStorage.
     * Retorna um array vazio se não houver logs ou se houver erro.
     *
     * @private
     * @returns {Array} Lista de entradas de log
     */
    _getStoredLogs() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return []; // Retorna vazio em caso de erro de parse
        }
    }

    /**
     * Método principal de log — chamado internamente por debug(), info(), warn(), error() e fatal().
     * Verifica se o nível do log atinge o mínimo configurado antes de registrar.
     *
     * @private
     * @param {number} level   - Nível de severidade
     * @param {string} message - Mensagem do log
     * @param {Object} [context={}] - Dados adicionais do contexto
     */
    _log(level, message, context = {}) {
        // Ignora logs abaixo do nível mínimo configurado
        if (level < this.minLevel) return;

        const logEntry = this._formatMessage(level, message, context);

        // Exibe no console do navegador (se habilitado)
        if (this.consoleEnabled) {
            const consoleMethods = {
                [LogLevel.DEBUG]: 'log',
                [LogLevel.INFO]: 'info',
                [LogLevel.WARN]: 'warn',
                [LogLevel.ERROR]: 'error',
                [LogLevel.FATAL]: 'error'
            };
            const method = consoleMethods[level] || 'log';
            console[method](`[${logEntry.level}]`, logEntry.message, context);
        }

        // Persiste no LocalStorage (se habilitado)
        this._persistLog(logEntry);
    }

    // ─────────────────────────────────────────────────────────
    // Métodos públicos de log — use estes no seu código
    // ─────────────────────────────────────────────────────────

    /**
     * Registra uma mensagem de DEBUG (nível 0 — mais detalhado).
     * Ideal para rastrear o fluxo de execução durante desenvolvimento.
     *
     * Exemplo: logger.debug('Iniciando busca de clientes', { filtro: 'João' })
     *
     * @param {string} message - Mensagem do log
     * @param {Object} [context] - Dados extras para contexto
     */
    debug(message, context) { this._log(LogLevel.DEBUG, message, context); }

    /**
     * Registra uma informação de operação normal (nível 1).
     * Use para eventos importantes que são esperados (login, save, etc.)
     *
     * Exemplo: logger.info('Usuário logado com sucesso', { usuario: 'admin' })
     *
     * @param {string} message - Mensagem do log
     * @param {Object} [context] - Dados extras para contexto
     */
    info(message, context) { this._log(LogLevel.INFO, message, context); }

    /**
     * Registra um AVISO (nível 2).
     * Use quando algo inesperado aconteceu, mas não impediu a operação.
     *
     * Exemplo: logger.warn('Servidor offline, usando cache local')
     *
     * @param {string} message - Mensagem do log
     * @param {Object} [context] - Dados extras para contexto
     */
    warn(message, context) { this._log(LogLevel.WARN, message, context); }

    /**
     * Registra um ERRO (nível 3).
     * Use quando uma operação falhou, mas o sistema ainda pode continuar.
     *
     * Exemplo: logger.error('Falha ao salvar cliente', { erro: e.message })
     *
     * @param {string} message - Mensagem do log
     * @param {Object} [context] - Dados extras para contexto
     */
    error(message, context) { this._log(LogLevel.ERROR, message, context); }

    /**
     * Registra um ERRO FATAL (nível 4 — mais crítico).
     * Use para falhas que podem impedir o funcionamento do sistema inteiro.
     *
     * Exemplo: logger.fatal('Banco de dados corrompido!')
     *
     * @param {string} message - Mensagem do log
     * @param {Object} [context] - Dados extras para contexto
     */
    fatal(message, context) { this._log(LogLevel.FATAL, message, context); }

    /**
     * Retorna todos os logs salvos no LocalStorage.
     * Útil para exibir histórico de eventos no painel de administração.
     *
     * @returns {Array} Lista de entradas de log com timestamp, nível e mensagem
     */
    getLogs() {
        return this._getStoredLogs();
    }

    /**
     * Remove todos os logs do LocalStorage.
     * Use quando quiser limpar o histórico de logs manualmente.
     */
    clearLogs() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            if (this.consoleEnabled) {
                console.error('Falha ao limpar logs:', error);
            }
        }
    }

    /**
     * Exporta todos os logs como arquivo JSON e faz o download automaticamente.
     * Útil para enviar logs para análise ou suporte técnico.
     */
    exportLogs() {
        const logs = this._getStoredLogs();
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString()}.json`; // Nome do arquivo com data
        a.click();
        URL.revokeObjectURL(url); // Libera a memória após o download
    }
}

// ─────────────────────────────────────────────────────────
// Instância global do Logger — pronta para uso em todo o sistema.
// Importe com: import { logger } from './shared/logger.js';
// ─────────────────────────────────────────────────────────
export const logger = new Logger({
    minLevel: LogLevel.INFO, // Registra a partir de INFO (ignora DEBUG)
    persistLogs: true,           // Salva os logs no LocalStorage
    consoleEnabled: true            // Exibe no console do navegador
});

// Exporta os níveis para uso externo (ex: criar um logger com nível customizado)
export { LogLevel };
