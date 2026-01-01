/**
 * Centralized Logging System
 * Provides structured logging with levels and optional persistence
 */

const LogLevel = {
    DEBUG: 0,
    INFO: 1,
    WARN: 2,
    ERROR: 3,
    FATAL: 4
};

export class Logger {
    constructor(options = {}) {
        this.minLevel = options.minLevel || LogLevel.INFO;
        this.persistLogs = options.persistLogs || false;
        this.maxLogs = options.maxLogs || 1000;
        this.storageKey = 'bicicletario_logs';
        
        // Only log to console in development
        this.consoleEnabled = options.consoleEnabled !== false;
    }

    /**
     * Formats log message with timestamp and context
     * @private
     */
    _formatMessage(level, message, context = {}) {
        return {
            timestamp: new Date().toISOString(),
            level: this._getLevelName(level),
            message,
            context,
            userAgent: navigator.userAgent,
            url: window.location.href
        };
    }

    /**
     * Gets the name of a log level
     * @private
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
     * Writes log to storage if persistence is enabled
     * @private
     */
    _persistLog(logEntry) {
        if (!this.persistLogs) return;

        try {
            const logs = this._getStoredLogs();
            logs.push(logEntry);
            
            // Keep only the most recent logs
            if (logs.length > this.maxLogs) {
                logs.splice(0, logs.length - this.maxLogs);
            }
            
            localStorage.setItem(this.storageKey, JSON.stringify(logs));
        } catch (error) {
            // Silently fail if storage is full
            if (this.consoleEnabled) {
                console.error('Failed to persist log:', error);
            }
        }
    }

    /**
     * Retrieves stored logs
     * @private
     */
    _getStoredLogs() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            return [];
        }
    }

    /**
     * Core logging method
     * @private
     */
    _log(level, message, context = {}) {
        if (level < this.minLevel) return;

        const logEntry = this._formatMessage(level, message, context);
        
        // Console output in development
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

        // Persist if enabled
        this._persistLog(logEntry);
    }

    /**
     * Log debug message
     */
    debug(message, context) {
        this._log(LogLevel.DEBUG, message, context);
    }

    /**
     * Log info message
     */
    info(message, context) {
        this._log(LogLevel.INFO, message, context);
    }

    /**
     * Log warning message
     */
    warn(message, context) {
        this._log(LogLevel.WARN, message, context);
    }

    /**
     * Log error message
     */
    error(message, context) {
        this._log(LogLevel.ERROR, message, context);
    }

    /**
     * Log fatal error message
     */
    fatal(message, context) {
        this._log(LogLevel.FATAL, message, context);
    }

    /**
     * Get all stored logs
     */
    getLogs() {
        return this._getStoredLogs();
    }

    /**
     * Clear all stored logs
     */
    clearLogs() {
        try {
            localStorage.removeItem(this.storageKey);
        } catch (error) {
            if (this.consoleEnabled) {
                console.error('Failed to clear logs:', error);
            }
        }
    }

    /**
     * Export logs as JSON
     */
    exportLogs() {
        const logs = this._getStoredLogs();
        const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `logs-${new Date().toISOString()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Create global logger instance
export const logger = new Logger({
    minLevel: LogLevel.INFO,
    persistLogs: true,
    consoleEnabled: true
});

// Export log levels for external use
export { LogLevel };
