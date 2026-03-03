/**
 * ============================================================
 *  ARQUIVO: audit-logger.js
 *  DESCRIÇÃO: Sistema de auditoria de ações dos usuários
 *
 *  FUNÇÃO: Registra um log detalhado de TUDO que os usuários
 *          fazem no sistema: criar cliente, editar registro,
 *          fazer login/logout, exportar dados, etc.
 *          Isto permite rastrear quem fez o quê e quando,
 *          fundamental para segurança e governança do sistema.
 *
 *  ESTRUTURA DE UM LOG:
 *  {
 *    id:          ID único do log (ex: "log_1709298765_abc123xyz")
 *    timestamp:   Data e hora ISO (ex: "2025-03-01T14:30:00.000Z")
 *    userId:      ID do usuário que fez a ação
 *    username:    Nome de login do usuário
 *    userTipo:    Tipo do usuário (dono/admin/funcionario)
 *    action:      Tipo da ação (ex: "create", "delete", "login")
 *    entity:      O que foi afetado (ex: "cliente", "registro", "usuario")
 *    entityId:    ID do item afetado (ex: CPF do cliente)
 *    details:     Dados específicos da ação (nome, CPF, etc.)
 *    metadata:    Informações extras (ex: { success: false })
 *    context:     URL e user-agent do navegador no momento da ação
 *  }
 *
 *  LIMITE DE ARMAZENAMENTO:
 *  - Mantém no máximo 5.000 logs no LocalStorage.
 *  - Logs mais antigos são removidos automaticamente quando o limite é atingido.
 *  - Use clearOldLogs() para limpeza periódica de logs muito antigos.
 *
 *  PARA INICIANTES:
 *  - Para registrar uma ação: AuditLogger.log('create', 'cliente', cpf, { nome: 'João' });
 *  - Ou use o helper: logAction('delete', 'registro', id, { cliente: 'João' });
 *  - Para operações assíncronas: use withAudit() que loga sucesso E falha.
 * ============================================================
 */

import { Auth } from './auth.js';

/** Chave no LocalStorage onde os logs de auditoria são armazenados */
const STORAGE_KEY = 'bicicletario_audit_logs';

/** Número máximo de logs a manter. Logs mais antigos são descartados automaticamente. */
const MAX_LOGS = 5000;

/**
 * Classe AuditLogger — Gerencia o registro e consulta de logs de auditoria.
 * Todos os métodos são static (não precisa instanciar).
 */
export class AuditLogger {

    /**
     * Gera um ID único para cada log de auditoria.
     * Combina o timestamp atual com uma string aleatória para garantir unicidade.
     *
     * Formato: "log_1709298765123_abc123xyz"
     *
     * @returns {string} ID único do log
     */
    static generateId() {
        return 'log_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    /**
     * Registra uma ação no log de auditoria.
     * Captura automaticamente as informações da sessão atual do usuário.
     * Só registra se houver uma sessão ativa (usuário logado).
     *
     * Exemplos de uso:
     *   AuditLogger.log('create', 'cliente', '12345678901', { nome: 'João Silva', cpf: '123...' });
     *   AuditLogger.log('login', 'sistema', null, {});
     *   AuditLogger.log('delete', 'registro', registroId, { cliente: 'João' });
     *
     * Ações comuns (ver getActionLabel para lista completa):
     *   'create', 'edit', 'delete', 'login', 'logout', 'export', 'import',
     *   'register_entry', 'register_exit', 'activate', 'deactivate'
     *
     * Entidades comuns (ver getEntityLabel para lista completa):
     *   'cliente', 'bicicleta', 'registro', 'usuario', 'sistema'
     *
     * @param {string} action    - Tipo da ação (ex: 'create', 'delete', 'login')
     * @param {string} entity    - Entidade afetada (ex: 'cliente', 'registro')
     * @param {string} entityId  - ID do item afetado (ex: CPF, UUID) — null se não aplicável
     * @param {Object} [details={}]  - Dados específicos da ação (nome, valores alterados, etc.)
     * @param {Object} [metadata={}] - Metadados extras (ex: { success: false })
     * @returns {Object|undefined} A entrada de log criada, ou undefined se não houver sessão
     */
    static log(action, entity, entityId, details = {}, metadata = {}) {
        const session = Auth.getCurrentSession();

        // Não registra sem sessão ativa (usuário não logado)
        if (!session) {
            console.warn('Tentativa de registrar log de auditoria sem sessão ativa');
            return;
        }

        // Monta a entrada completa de auditoria
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
            // Contexto técnico: de onde a ação foi realizada
            context: {
                url: window.location.href,
                userAgent: navigator.userAgent.substring(0, 100) // Limita a 100 chars
            }
        };

        // Recupera logs existentes, adiciona o novo no início (mais recente primeiro)
        const logs = this.getAllLogs();
        logs.unshift(logEntry); // unshift = adiciona no começo do array

        // Limita ao número máximo de logs (remove os mais antigos do final)
        if (logs.length > MAX_LOGS) {
            logs.splice(MAX_LOGS); // Remove tudo após MAX_LOGS
        }

        // Salva no LocalStorage
        localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));

        // Exibe no console para facilitar depuração durante desenvolvimento
        console.log(`[AUDITORIA] ${action} - ${entity}`, logEntry);

        return logEntry;
    }

    /**
     * Retorna todos os logs de auditoria armazenados no LocalStorage.
     * Os logs são retornados do mais recente ao mais antigo.
     *
     * @returns {Array} Lista de entradas de log de auditoria
     */
    static getAllLogs() {
        const data = localStorage.getItem(STORAGE_KEY);
        return data ? JSON.parse(data) : [];
    }

    /**
     * Filtra os logs de auditoria com base em critérios específicos.
     * Todos os parâmetros são opcionais — use apenas os que precisar.
     *
     * Exemplo:
     *   // Logs de um usuário específico nos últimos 7 dias
     *   const logs = AuditLogger.getLogsByFilter({
     *     startDate: '2025-02-22',
     *     userId: 'admin_001',
     *     action: 'delete'
     *   });
     *
     * @param {Object} filtros - Critérios de filtro
     * @param {string} [filtros.startDate] - Data início no formato YYYY-MM-DD (inclui o dia)
     * @param {string} [filtros.endDate]   - Data fim no formato YYYY-MM-DD (inclui o dia)
     * @param {string} [filtros.userId]    - Filtra por usuário específico (ou 'todos' para ignorar)
     * @param {string} [filtros.action]    - Filtra por tipo de ação (ex: 'create', 'delete')
     * @param {string} [filtros.entity]    - Filtra por entidade afetada (ex: 'cliente')
     * @returns {Array} Logs que atendem a todos os filtros aplicados
     */
    static getLogsByFilter({ startDate, endDate, userId, action, entity } = {}) {
        let logs = this.getAllLogs();

        // Filtro de data início: inclui o dia inteiro (começa à meia-noite)
        if (startDate) {
            const start = new Date(startDate);
            start.setHours(0, 0, 0, 0); // 00:00:00.000
            logs = logs.filter(log => new Date(log.timestamp) >= start);
        }

        // Filtro de data fim: inclui o dia inteiro (termina à meia-noite)
        if (endDate) {
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999); // 23:59:59.999
            logs = logs.filter(log => new Date(log.timestamp) <= end);
        }

        // Filtro por usuário (ignora se for 'todos')
        if (userId && userId !== 'todos') {
            logs = logs.filter(log => log.userId === userId);
        }

        // Filtro por tipo de ação
        if (action) {
            logs = logs.filter(log => log.action === action);
        }

        // Filtro por entidade afetada
        if (entity) {
            logs = logs.filter(log => log.entity === entity);
        }

        return logs;
    }

    /**
     * Remove logs de auditoria mais antigos que N dias.
     * Use para manutenção periódica do histórico e evitar acúmulo excessivo de dados.
     *
     * Exemplo:
     *   AuditLogger.clearOldLogs(30); // Mantém apenas os últimos 30 dias
     *
     * @param {number} [daysToKeep=90] - Quantos dias de histórico manter (padrão: 90 dias)
     * @returns {{ removed: number, remaining: number }} Quantos logs foram removidos e quantos restaram
     */
    static clearOldLogs(daysToKeep = 90) {
        const logs = this.getAllLogs();

        // Calcula a data de corte
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        // Mantém apenas logs mais recentes que a data de corte
        const filtered = logs.filter(log => new Date(log.timestamp) >= cutoffDate);

        localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

        return {
            removed: logs.length - filtered.length, // Quantos foram removidos
            remaining: filtered.length                 // Quantos permaneceram
        };
    }

    /**
     * Remove TODOS os logs de auditoria permanentemente.
     * ⚠️ Ação irreversível! Use com cuidado.
     */
    static clearAllLogs() {
        localStorage.removeItem(STORAGE_KEY);
    }

    /**
     * Converte um código de ação para um texto amigável em português.
     * Usado para exibir os logs na tela de auditoria.
     *
     * Exemplo:
     *   AuditLogger.getActionLabel('register_entry') => 'Registrou Entrada'
     *   AuditLogger.getActionLabel('delete')         => 'Excluiu'
     *
     * @param {string} action - Código da ação (ex: 'create', 'edit', 'delete')
     * @returns {string} Descrição amigável da ação em português
     */
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
        return labels[action] || action; // Retorna o código original se não encontrar
    }

    /**
     * Converte um código de entidade para um texto amigável em português.
     * Usado para exibir os logs na tela de auditoria.
     *
     * Exemplo:
     *   AuditLogger.getEntityLabel('cliente')  => 'Cliente'
     *   AuditLogger.getEntityLabel('registro') => 'Registro'
     *
     * @param {string} entity - Código da entidade (ex: 'cliente', 'usuario')
     * @returns {string} Descrição amigável da entidade em português
     */
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

    /**
     * Formata os detalhes de um log em uma string legível para exibição.
     * Verifica vários campos do objeto details e monta uma lista separada por " | ".
     *
     * Exemplo de retorno:
     *   "Nome: João Silva | CPF: 123.456.789-01 | Tel: (11) 99999-9999"
     *
     * @param {Object} log - Entrada de log completa (com campo `details`)
     * @returns {string} Detalhes formatados em texto, ou "Sem detalhes" se vazio
     */
    static formatLogDetails(log) {
        const details = [];
        const d = log.details || {};

        // ── Dados / Backup ────────────────────────────────────────────────────
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

        // ── Clientes / Pessoas ────────────────────────────────────────────────
        if (d.nome) details.push(`Nome: ${d.nome}`);
        if (d.cpf) details.push(`CPF: ${d.cpf}`);
        if (d.telefone) details.push(`Tel: ${d.telefone}`);
        if (d.email) details.push(`Email: ${d.email}`);

        // ── Bicicletas ────────────────────────────────────────────────────────
        if (d.modelo) details.push(`Modelo: ${d.modelo}`);
        if (d.marca) details.push(`Marca: ${d.marca}`);
        if (d.cor) details.push(`Cor: ${d.cor}`);

        // ── Registros / Movimentação ──────────────────────────────────────────
        if (d.cliente) details.push(`Cliente: ${d.cliente}`);
        if (d.clienteCpf) details.push(`CPF: ${d.clienteCpf}`);
        if (d.dataHoraEntrada) details.push(`Entrada: ${new Date(d.dataHoraEntrada).toLocaleString('pt-BR')}`);
        if (d.dataHoraSaida) details.push(`Saída: ${new Date(d.dataHoraSaida).toLocaleString('pt-BR')}`);
        if (d.acao) details.push(`Ação: ${d.acao}`);
        if (d.from && d.to) details.push(`De: ${d.from} → Para: ${d.to}`);

        // ── Usuários ──────────────────────────────────────────────────────────
        if (d.username) details.push(`Usuário: ${d.username}`);
        if (d.userTipo || (d.tipo && log.entity === 'usuario')) {
            details.push(`Função: ${d.userTipo || d.tipo}`);
        }

        // ── Comentários ───────────────────────────────────────────────────────
        if (d.comentario) details.push(`Comentário: "${d.comentario}"`);
        if (d.commentId) details.push(`ID Comentário: ${d.commentId}`);

        // ── Alterações genéricas (before/after) ───────────────────────────────
        // Exibe apenas os campos que realmente mudaram entre o estado anterior e o atual
        if (d.changes) {
            const changesList = [];
            const before = d.changes.before || {};
            const after = d.changes.after || {};

            for (const key in after) {
                if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                    let valBefore = before[key];
                    let valAfter = after[key];

                    // Converte objetos/arrays para string legível
                    if (typeof valBefore === 'object') valBefore = JSON.stringify(valBefore);
                    if (typeof valAfter === 'object') valAfter = JSON.stringify(valAfter);

                    changesList.push(`${key}: ${valBefore} -> ${valAfter}`);
                }
            }

            if (changesList.length > 0) {
                details.push(`Alterações: [${changesList.join(', ')}]`);
            }
        }

        return details.join(' | ') || 'Sem detalhes';
    }

    /**
     * Calcula estatísticas resumidas de um conjunto de logs.
     * Retorna contagens agrupadas por usuário, tipo de ação, entidade e dia.
     *
     * Exemplo de retorno:
     * {
     *   total: 150,
     *   byUser:   { 'admin': 80, 'func01': 70 },
     *   byAction: { 'create': 50, 'delete': 10, 'login': 90 },
     *   byEntity: { 'cliente': 60, 'registro': 90 },
     *   byDay:    { '2025-03-01': 30, '2025-03-02': 120 }
     * }
     *
     * @param {Array|null} [logs=null] - Lista de logs. Se null, carrega todos do LocalStorage.
     * @returns {Object} Estatísticas agrupadas
     */
    static getLogStats(logs = null) {
        if (!logs) {
            logs = this.getAllLogs(); // Se não fornecido, carrega todos
        }

        const stats = {
            total: logs.length,
            byUser: {}, // Contagem por nome de usuário
            byAction: {}, // Contagem por tipo de ação
            byEntity: {}, // Contagem por entidade afetada
            byDay: {}  // Contagem por dia (YYYY-MM-DD)
        };

        logs.forEach(log => {
            // Incrementa (ou inicia em 1) o contador de cada agrupamento
            stats.byUser[log.username] = (stats.byUser[log.username] || 0) + 1;
            stats.byAction[log.action] = (stats.byAction[log.action] || 0) + 1;
            stats.byEntity[log.entity] = (stats.byEntity[log.entity] || 0) + 1;

            // Extrai apenas a data (parte antes do "T") para agrupar por dia
            const day = log.timestamp.split('T')[0];
            stats.byDay[day] = (stats.byDay[day] || 0) + 1;
        });

        return stats;
    }
}

// ─────────────────────────────────────────────────────────
// Funções helper — atalhos simples para uso no código
// ─────────────────────────────────────────────────────────

/**
 * Atalho simplificado para AuditLogger.log().
 * Registra uma ação no log de auditoria.
 *
 * Exemplo:
 *   logAction('create', 'cliente', cliente.cpf, { nome: cliente.nome });
 *
 * @param {string} action   - Tipo da ação (ex: 'create', 'delete')
 * @param {string} entity   - Entidade afetada (ex: 'cliente', 'registro')
 * @param {string} entityId - ID do item afetado
 * @param {Object} [details={}]  - Dados específicos da ação
 * @param {Object} [metadata={}] - Metadados extras
 * @returns {Object} A entrada de log criada
 */
export function logAction(action, entity, entityId, details = {}, metadata = {}) {
    return AuditLogger.log(action, entity, entityId, details, metadata);
}

/**
 * Wrapper de auditoria para operações assíncronas.
 * Executa a função handler e registra automaticamente:
 * - Sucesso: registra a ação com o resultado retornado pelo handler.
 * - Falha: registra a ação com { error: mensagem } e relança o erro.
 *
 * Isto garante que erros também sejam auditados, e simplifica o código
 * evitando blocos try/catch repetidos com logAction dentro de cada um.
 *
 * Exemplo:
 *   await withAudit('create', 'cliente', async () => {
 *     const novoCliente = await salvarCliente(dados);
 *     return novoCliente; // Este valor vai para os details do log
 *   }, (result) => result.cpf); // Função para extrair o entityId do resultado
 *
 * @param {string}   action         - Tipo da ação a registrar
 * @param {string}   entity         - Entidade afetada
 * @param {Function} handler        - Função assíncrona a executar e auditar
 * @param {Function|null} [entityIdGetter=null] - Função que extrai o ID do resultado (opcional)
 * @returns {Promise<any>} O resultado do handler
 * @throws {Error} Relança qualquer erro do handler após registrá-lo no log
 */
export async function withAudit(action, entity, handler, entityIdGetter = null) {
    try {
        const result = await handler();
        const entityId = entityIdGetter ? entityIdGetter(result) : null;
        AuditLogger.log(action, entity, entityId, result || {});
        return result;
    } catch (error) {
        // Registra a falha antes de relançar o erro
        AuditLogger.log(action, entity, null, { error: error.message }, { success: false });
        throw error; // Continua propagando o erro para o código que chamou
    }
}
