/**
 * ============================================================
 *  ARQUIVO: performance-config.js
 *  DESCRIÇÃO: Gerenciador de configurações de performance do sistema
 *
 *  FUNÇÃO: Armazena e gerencia preferências de otimização de
 *          desempenho da interface. Por exemplo: se deve usar
 *          debounce nos campos de busca e quantos clientes
 *          exibir na lista por vez.
 *
 *  PARA INICIANTES:
 *  - Importe com: import { PerformanceConfig } from './shared/performance-config.js';
 *  - Para ler uma configuração: PerformanceConfig.get('debounceDelay')
 *  - Para alterar uma configuração: PerformanceConfig.set('clientListLimit', 50)
 *  - Para resetar tudo ao padrão: PerformanceConfig.reset()
 * ============================================================
 */

export const PerformanceConfig = {

    /**
     * Valores padrão das configurações de performance.
     * Estes valores são usados quando nenhuma configuração foi salva ainda.
     *
     * - enableDebounce: true = ativa atraso na busca enquanto digita (evita excesso de requisições)
     * - debounceDelay:  300ms de espera após a última tecla antes de pesquisar
     * - limitClientList: true = limita a lista de clientes exibida para melhorar a velocidade
     * - clientListLimit: 100 = máximo de clientes exibidos por vez (limitar melhora a performance)
     */
    defaults: {
        enableDebounce: true,
        debounceDelay: 300,
        limitClientList: true,
        clientListLimit: 100
    },

    /**
     * Carrega as configurações de performance salvas no LocalStorage.
     * Se não houver configurações salvas, retorna os valores padrão (defaults).
     * As configurações salvas são mescladas com os padrões (merge),
     * garantindo que novas configurações adicionadas no futuro tenham valor padrão.
     *
     * @returns {Object} Objeto com todas as configurações de performance atuais
     */
    load() {
        try {
            const saved = localStorage.getItem('performance_config');
            if (saved) {
                // Mescla os padrões com o que foi salvo (saved tem prioridade)
                return { ...this.defaults, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.warn('Erro ao carregar configurações de performance:', e);
        }
        // Retorna uma cópia dos padrões (sem modificar o original)
        return { ...this.defaults };
    },

    /**
     * Salva um conjunto de configurações de performance no LocalStorage.
     * As configurações persistem entre sessões (ficam salvas mesmo após fechar o navegador).
     *
     * @param {Object} config - Objeto com as configurações a serem salvas
     * @returns {boolean} true se salvo com sucesso, false se houver erro
     */
    save(config) {
        try {
            localStorage.setItem('performance_config', JSON.stringify(config));
            return true;
        } catch (e) {
            console.error('Erro ao salvar configurações de performance:', e);
            return false;
        }
    },

    /**
     * Obtém o valor de uma configuração específica pelo nome da chave.
     * Se a chave não existir nas configurações salvas, usa o valor padrão.
     *
     * Exemplo:
     *   PerformanceConfig.get('debounceDelay') => 300
     *   PerformanceConfig.get('clientListLimit') => 100
     *
     * @param {string} key - Nome da configuração (ex: 'debounceDelay')
     * @returns {any} Valor da configuração ou o valor padrão correspondente
     */
    get(key) {
        const config = this.load();
        // Retorna o valor salvo, ou o padrão se não existir
        return config[key] !== undefined ? config[key] : this.defaults[key];
    },

    /**
     * Define o valor de uma configuração específica e salva no LocalStorage.
     * Carrega as configurações existentes, altera apenas a chave informada,
     * e salva tudo de volta — preservando as outras configurações intactas.
     *
     * Exemplo:
     *   PerformanceConfig.set('clientListLimit', 50) // Limita lista a 50 clientes
     *   PerformanceConfig.set('enableDebounce', false) // Desativa debounce
     *
     * @param {string} key   - Nome da configuração a alterar
     * @param {any}    value - Novo valor para a configuração
     * @returns {boolean} true se salvo com sucesso, false se houver erro
     */
    set(key, value) {
        const config = this.load(); // Carrega todas as configs atuais
        config[key] = value;        // Altera apenas a chave informada
        return this.save(config);   // Salva tudo de volta
    },

    /**
     * Reseta todas as configurações de performance para os valores padrão.
     * Use quando quiser desfazer todas as personalizações e voltar ao estado original.
     *
     * @returns {boolean} true se resetado com sucesso, false se houver erro
     */
    reset() {
        return this.save({ ...this.defaults });
    }
};
