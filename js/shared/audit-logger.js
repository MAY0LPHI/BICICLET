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
            'change_theme': 'Alterou Tema',
            'restore': 'Restaurou',
            'change_storage': 'Alterou Armazenamento',
            'revert_action': 'Reverteu Ação',
            'add_comment': 'Adicionou Comentário',
            'delete_comment': 'Excluiu Comentário'
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
            'dados': 'Dados',
            'backup': 'Backup'
        };
        return labels[entity] || entity;
    }

    static formatLogDetails(log) {
        const details = [];
        const d = log.details || {};

        // --- Dados / Backup ---
        if (d.tipo) details.push(`Tipo: ${d.tipo}`);
        if (d.tipos && Array.isArray(d.tipos)) details.push(`Tipos: ${d.tipos.join(', ')}`);
        if (d.quantidade !== undefined) details.push(`Qtd: ${d.quantidade}`);
        if (d.formato) details.push(`Formato: ${d.formato}`);
        if (d.resultado) details.push(`Resultado: ${d.resultado}`);
        if (d.periodo) {
            const inicio = d.periodo.inicio ? new Date(d.periodo.inicio).toLocaleDateString('pt-BR') : 'Início';
            const fim = d.periodo.fim ? new Date(d.periodo.fim).toLocaleDateString('pt-BR') : 'Hoje';
            details.push(`Período: ${inicio} até ${fim}`);
        }

        // --- Clientes / Pessoas ---
        if (d.nome) details.push(`Nome: ${d.nome}`);
        if (d.cpf) details.push(`CPF: ${d.cpf}`);
        if (d.telefone) details.push(`Tel: ${d.telefone}`);
        if (d.email) details.push(`Email: ${d.email}`);

        // --- Bicicletas ---
        if (d.modelo) details.push(`Modelo: ${d.modelo}`);
        if (d.marca) details.push(`Marca: ${d.marca}`);
        if (d.cor) details.push(`Cor: ${d.cor}`);

        // --- Registros / Movimentação ---
        if (d.cliente) details.push(`Cliente: ${d.cliente}`); // Nome do cliente no registro
        if (d.clienteCpf) details.push(`CPF: ${d.clienteCpf}`);
        if (d.dataHoraEntrada) details.push(`Entrada: ${new Date(d.dataHoraEntrada).toLocaleString('pt-BR')}`);
        if (d.dataHoraSaida) details.push(`Saída: ${new Date(d.dataHoraSaida).toLocaleString('pt-BR')}`);
        if (d.acao) details.push(`Ação: ${d.acao}`); // Ex: 'saida', 'remocao_acesso'
        if (d.from && d.to) details.push(`De: ${d.from} → Para: ${d.to}`);

        // --- Usuários ---
        if (d.username) details.push(`Usuário: ${d.username}`);
        if (d.userTipo || (d.tipo && log.entity === 'usuario')) details.push(`Função: ${d.userTipo || d.tipo}`);

        // --- Comentários ---
        if (d.comentario) details.push(`Comentário: "${d.comentario}"`);
        if (d.commentId) details.push(`ID Comentário: ${d.commentId}`);

        // --- Alterações Genéricas (Changes) ---
        if (d.changes) {
            const changesList = [];
            const before = d.changes.before || {};
            const after = d.changes.after || {};

            // Tenta listar apenas o que mudou
            for (const key in after) {
                if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                    let valBefore = before[key];
                    let valAfter = after[key];

                    // Tratamento simples para objetos/arrays
                    if (typeof valBefore === 'object') valBefore = JSON.stringify(valBefore);
                    if (typeof valAfter === 'object') valAfter = JSON.stringify(valAfter);

                    changesList.push(`${key}: ${valBefore} -> ${valAfter}`);
                }
            }
            if (changesList.length > 0) {
                details.push(`Alterações: [${changesList.join(', ')}]`);
            }
        }

        // Fallback para outros campos não mapeados especificamente, se sobrarem
        // (Opcional: listar chaves restantes se não forem as acima)

        return details.join(' | ') || 'Sem detalhes';
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
