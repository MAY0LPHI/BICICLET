/**
 * ============================================================
 *  ARQUIVO: debug.js
 *  DESCRIÇÃO: Sistema de debug condicional do bicicletário
 *
 *  FUNÇÃO: Permite exibir mensagens de depuração no console do
 *          navegador sem que elas apareçam em produção.
 *          Em produção, todos os logs de debug são silenciados
 *          automaticamente, exceto avisos e erros críticos.
 *
 *  PARA INICIANTES:
 *  - Para ATIVAR o modo debug: abra o console do navegador (F12)
 *    e digite: Debug.enable()
 *  - Para DESATIVAR: Debug.disable()
 *  - Para usar no código: import { Debug } from './shared/debug.js';
 *
 *  POR QUE USAR Debug.log() E NÃO console.log() DIRETO?
 *  - Debug.log() só aparece quando o modo debug está ativado.
 *  - console.log() aparece SEMPRE, inclusive para o usuário final.
 * ============================================================
 */

// Verifica se o modo debug foi ativado anteriormente (salvo no LocalStorage)
// Se não houver nada salvo, o padrão é false (debug desativado em produção)
const DEBUG_MODE = localStorage.getItem('DEBUG_MODE') === 'true' || false;

export const Debug = {

    /**
     * Indica se o modo debug está ativo.
     * true = logs de debug aparecem; false = logs silenciados.
     */
    enabled: DEBUG_MODE,

    /**
     * Inicializa o sistema de debug.
     * Chame este método na inicialização do app para registrar o estado do debug.
     * Se o debug estiver ativo, exibe instruções de como desativá-lo.
     */
    init() {
        if (this.enabled) {
            console.log('🔧 [DEBUG] Modo de debug ativado');
            console.log('💡 Para desativar: localStorage.setItem("DEBUG_MODE", "false")');
        }
    },

    /**
     * Registra uma mensagem de debug padrão no console.
     * Só aparece se o modo debug estiver ativo.
     *
     * Exemplo: Debug.log('Clientes carregados:', lista)
     *
     * @param {...any} args - Mensagens ou objetos para exibir
     */
    log(...args) {
        if (this.enabled) {
            console.log('[DEBUG]', ...args);
        }
    },

    /**
     * Registra uma informação no console.
     * Só aparece se o modo debug estiver ativo.
     * Use para mensagens informativas que não são erros.
     *
     * @param {...any} args - Mensagens ou objetos para exibir
     */
    info(...args) {
        if (this.enabled) {
            console.info('[INFO]', ...args);
        }
    },

    /**
     * Registra um AVISO no console.
     * Aparece SEMPRE, mesmo sem o modo debug ativo.
     * Use para situações inesperadas que não são erros críticos
     * (ex: dado ausente, mas sistema continua funcionando).
     *
     * @param {...any} args - Mensagens ou objetos para exibir
     */
    warn(...args) {
        console.warn('[WARN]', ...args);
    },

    /**
     * Registra um ERRO crítico no console.
     * Aparece SEMPRE, mesmo sem o modo debug ativo.
     * Use para problemas que impedem ou comprometem o funcionamento.
     *
     * @param {...any} args - Mensagens ou objetos para exibir
     */
    error(...args) {
        console.error('[ERROR]', ...args);
    },

    /**
     * Cria um grupo recolhível de logs no console (console.group).
     * Útil para agrupar logs relacionados visualmente.
     * Só funciona com o modo debug ativo.
     *
     * Exemplo:
     *   Debug.group('Carregando dados');
     *   Debug.log('clientes:', lista);
     *   Debug.groupEnd();
     *
     * @param {string} label - Título do grupo de logs
     */
    group(label) {
        if (this.enabled) {
            console.group(label);
        }
    },

    /**
     * Fecha o grupo de logs aberto por Debug.group().
     * Deve sempre ser chamado depois de Debug.group() para fechar o bloco.
     */
    groupEnd() {
        if (this.enabled) {
            console.groupEnd();
        }
    },

    /**
     * Inicia um cronômetro de performance com o rótulo informado.
     * Use em conjunto com Debug.timeEnd() para medir o tempo de execução.
     * Só funciona com o modo debug ativo.
     *
     * Exemplo:
     *   Debug.time('carregarClientes');
     *   await carregarClientes();
     *   Debug.timeEnd('carregarClientes');
     *   // Console mostra: "carregarClientes: 123ms"
     *
     * @param {string} label - Nome do cronômetro
     */
    time(label) {
        if (this.enabled) {
            console.time(label);
        }
    },

    /**
     * Para o cronômetro iniciado com Debug.time() e exibe o tempo decorrido.
     *
     * @param {string} label - Nome do cronômetro (deve ser igual ao usado em Debug.time)
     */
    timeEnd(label) {
        if (this.enabled) {
            console.timeEnd(label);
        }
    },

    /**
     * Ativa o modo debug em tempo real (sem precisar recarregar a página).
     * Também salva a preferência no LocalStorage para persistir entre sessões.
     *
     * Como usar: abra o console do navegador (F12) e digite: Debug.enable()
     */
    enable() {
        this.enabled = true;
        localStorage.setItem('DEBUG_MODE', 'true');
        console.log('🔧 Modo debug ATIVADO — os logs de depuração agora estão visíveis.');
    },

    /**
     * Desativa o modo debug em tempo real.
     * Também salva a preferência no LocalStorage para persistir entre sessões.
     *
     * Como usar: abra o console do navegador (F12) e digite: Debug.disable()
     */
    disable() {
        this.enabled = false;
        localStorage.setItem('DEBUG_MODE', 'false');
        console.log('🔇 Modo debug DESATIVADO — os logs de depuração estão ocultos.');
    }
};

// Expõe o objeto Debug globalmente para facilitar o acesso direto pelo console do navegador.
// Com isso, você pode digitar Debug.enable() ou Debug.log() sem precisar importar nada.
if (typeof window !== 'undefined') {
    window.Debug = Debug;
}
