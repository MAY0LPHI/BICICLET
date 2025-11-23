/**
 * Sistema de Auditoria e Logs de Ações
 * Rastreia todas as ações dos usuários no sistema
 */

import { Auth } from './auth.js';

const STORAGE_KEY = 'bicicletario_audit_logs';
const MAX_LOGS = 5000;

export class AuditLogger {
    static generateId() {
        return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    static log(action, entity, entityId, details = {}, metadata = {}) {
        const session = Auth.getCurrentSession();
        
        if (!session) {
            console.warn('Tentativa de log sem sessão ativa');
            return;
        }

        const logEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            userId: session.userId,
            username: session.username,
            userTipo: session.tipo,
            action,
            entity,
            entityId: entityId || null,
            details,
            metadata,
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent.substring(0, 100)
            }
        };

        const logs = this.getAllLogs();
        logs.unshift(logEntry);

        if (logs.length > MAX_LOGS) {
            logs.splice(MAX_LOGS);
        }

        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
        
        console.log(`[AUDIT] ${action} - ${entity}`, logEntry);
        
        return logEntry;
    }

    static getAllLogs() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    static getLogsByFilter({ startDate, endDate, userId, action, entity } = {}) {
        let logs = this.getAllLogs();

        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0);
            logs = logs.filter(log => new Date(log.timestamp) >= start);
        }

        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            logs = logs.filter(log => new Date(log.timestamp) <= end);
        }

        if (userId && userId !== 'todos') {
            logs = logs.filter(log => log.userId === userId);
        }

        if (action) {
            logs = logs.filter(log => log.action === action);
        }

        if (entity) {
            logs = logs.filter(log => log.entity === entity);
        }

        return logs;
    }

    static clearOldLogs(daysToKeep = 90) {
        const logs = this.getAllLogs();
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const filtered = logs.filter(log => new Date(log.timestamp) >= cutoffDate);
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        
        return {
            removed: logs.length - filtered.length,
            remaining: filtered.length
        };
    }

    static clearAllLogs() {
        localStorage.removeItem(STORAGE_KEY);
    }

    static getActionLabel(action) {
        const labels = {
            'create': 'Criou',
            'edit': 'Editou',
            'delete': 'Excluiu',
            'register_entry': 'Registrou Entrada',
            'register_exit': 'Registrou Saída',
            'remove_access': 'Removeu Acesso',
            'change_entry_time': 'Alterou Horário',
            'overnight_stay': 'Pernoite',
            'export': 'Exportou',
            'import': 'Importou',
            'login': 'Login',
            'logout': 'Logout',
            'change_password': 'Alterou Senha',
            'activate': 'Ativou',
            'deactivate': 'Desativou',
            'change_theme': 'Alterou Tema'
        };
        return labels[action] || action;
    }

    static getEntityLabel(entity) {
        const labels = {
            'cliente': 'Cliente',
            'bicicleta': 'Bicicleta',
            'registro': 'Registro',
            'usuario': 'Usuário',
            'sistema': 'Sistema',
            'configuracao': 'Configuração',
            'dados': 'Dados'
        };
        return labels[entity] || entity;
    }

    static formatLogDetails(log) {
        const details = [];
        
        if (log.details.nome) {
            details.push(`Nome: ${log.details.nome}`);
        }
        if (log.details.cpf) {
            details.push(`CPF: ${log.details.cpf}`);
        }
        if (log.details.modelo) {
            details.push(`Modelo: ${log.details.modelo}`);
        }
        if (log.details.marca) {
            details.push(`Marca: ${log.details.marca}`);
        }
        if (log.details.from && log.details.to) {
            details.push(`De: ${log.details.from} → Para: ${log.details.to}`);
        }
        if (log.details.count !== undefined) {
            details.push(`Quantidade: ${log.details.count}`);
        }
        if (log.details.format) {
            details.push(`Formato: ${log.details.format}`);
        }
        
        return details.join(', ') || 'Sem detalhes';
    }

    static getLogStats(logs = null) {
        if (!logs) {
            logs = this.getAllLogs();
        }

        const stats = {
            total: logs.length,
            byUser: {},
            byAction: {},
            byEntity: {},
            byDay: {}
        };

        logs.forEach(log => {
            stats.byUser[log.username] = (stats.byUser[log.username] || 0) + 1;
            stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
            stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;
            
            const day = log.timestamp.split('T')[0];
            stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        });

        return stats;
    }
}

export function logAction(action, entity, entityId, details = {}, metadata = {}) {
    return AuditLogger.log(action, entity, entityId, details, metadata);
}

export async function withAudit(action, entity, handler, entityIdGetter = null) {
    try {
        const result = await handler();
        const entityId = entityIdGetter ? entityIdGetter(result) : null;
        AuditLogger.log(action, entity, entityId, result || {});
        return result;
    } catch (error) {
        AuditLogger.log(action, entity, null, { error: error.message }, { success: false });
        throw error;
    }
}
