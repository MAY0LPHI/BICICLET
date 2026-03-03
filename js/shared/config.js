/**
 * ============================================================
 *  ARQUIVO: config.js
 *  DESCRIÇÃO: Configurações globais do sistema de bicicletário
 *
 *  FUNÇÃO: Define os valores de configuração que afetam o
 *          comportamento do sistema, como capacidade máxima de
 *          vagas e tempo para alertar permanência longa.
 *          Carrega as configs do servidor (se disponível) ou
 *          do armazenamento local como fallback.
 *
 *  PARA INICIANTES:
 *  - Este arquivo define as "regras" do sistema.
 *  - Para usar: import { Config } from './shared/config.js';
 *  - Lembre-se de chamar Config.load() na inicialização do app.
 * ============================================================
 */

export const Config = {
    /**
     * Capacidade máxima de bicicletas no bicicletário.
     * Pode ser sobrescrito via painel de configuração.
     * Valor padrão: 50 vagas.
     */
    MAX_CAPACITY: 50,

    /**
     * Tempo (em horas) para considerar uma permanência como "longa".
     * Bicicletas com mais tempo que este valor serão destacadas no sistema.
     * Valor padrão: 24 horas.
     */
    LONG_STAY_HOURS: 24,

    /**
     * Conjunto de classes CSS (Tailwind) para colorir status no sistema.
     * Cada chave representa um estado e contém variantes de claro/escuro.
     *
     * - success: Verde para situações positivas (ex: vaga disponível)
     * - warning: Amarelo/âmbar para avisos (ex: permanência longa)
     * - danger: Vermelho para alertas críticos (ex: capacidade máxima)
     */
    COLORS: {
        success: { light: 'text-green-600', bg: 'bg-green-100', darkText: 'dark:text-green-400', darkBg: 'dark:bg-green-900/30' },
        warning: { light: 'text-amber-600', bg: 'bg-amber-100', darkText: 'dark:text-amber-400', darkBg: 'dark:bg-amber-900/30' },
        danger: { light: 'text-red-600', bg: 'bg-red-100', darkText: 'dark:text-red-400', darkBg: 'dark:bg-red-900/30' }
    },

    /**
     * Carrega as configurações do sistema em dois passos:
     *
     * 1º) Tenta carregar do LocalStorage (cache local salvo anteriormente)
     *     — Funciona mesmo sem internet ou se o servidor estiver offline.
     *
     * 2º) Tenta buscar do servidor via API para obter os valores mais atuais.
     *     — Se o servidor responder, sobrescreve o cache local com os novos valores.
     *     — Se o servidor falhar, mantém o cache do passo anterior.
     *
     * Chame este método no início da aplicação para garantir que as
     * configurações estejam sempre atualizadas antes de usar o sistema.
     */
    async load() {
        // PASSO 1: Tenta carregar do LocalStorage como fallback/cache
        const localConfig = localStorage.getItem('bicicletario_system_config');
        if (localConfig) {
            try {
                const parsed = JSON.parse(localConfig);
                // Só substitui se o valor existir no cache
                if (parsed.maxCapacity) this.MAX_CAPACITY = parsed.maxCapacity;
                if (parsed.longStayHours) this.LONG_STAY_HOURS = parsed.longStayHours;
            } catch (e) {
                console.warn('Erro ao ler configuração local:', e);
            }
        }

        // PASSO 2: Tenta buscar do servidor (sobrescreve o cache se bem-sucedido)
        try {
            const response = await fetch('/api/system-config');
            if (response.ok) {
                const config = await response.json();
                if (config.maxCapacity) this.MAX_CAPACITY = config.maxCapacity;
                if (config.longStayHours) this.LONG_STAY_HOURS = config.longStayHours;

                // Atualiza o cache local com os valores mais recentes do servidor
                localStorage.setItem('bicicletario_system_config', JSON.stringify({
                    maxCapacity: this.MAX_CAPACITY,
                    longStayHours: this.LONG_STAY_HOURS
                }));
            }
        } catch (e) {
            // Servidor offline ou versão antiga — mantemos os valores carregados do cache
            console.warn('Backend offline ou versão antiga — usando configuração local/padrão.');
        }
    },

    /**
     * Salva as configurações fornecidas no LocalStorage (sem precisar do servidor).
     * Útil para aplicar configurações instantaneamente mesmo quando offline.
     *
     * Este método atualiza tanto a memória (this.MAX_CAPACITY, etc.)
     * quanto o arquivo de cache local.
     *
     * @param {Object} newConfig - Objeto com as novas configurações
     * @param {number} [newConfig.maxCapacity]   - Nova capacidade máxima
     * @param {number} [newConfig.longStayHours] - Novo tempo de permanência longa (em horas)
     */
    saveLocal(newConfig) {
        if (newConfig.maxCapacity) this.MAX_CAPACITY = newConfig.maxCapacity;
        if (newConfig.longStayHours) this.LONG_STAY_HOURS = newConfig.longStayHours;

        // Persiste no LocalStorage para ser carregado na próxima sessão
        localStorage.setItem('bicicletario_system_config', JSON.stringify({
            maxCapacity: this.MAX_CAPACITY,
            longStayHours: this.LONG_STAY_HOURS
        }));
    }
};
