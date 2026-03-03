/**
 * ============================================================
 *  ARQUIVO: platform.js
 *  DESCRIÇÃO: Módulo de detecção de plataforma e ambiente de execução
 *
 *  FUNÇÃO: Detecta em qual ambiente o sistema está rodando:
 *          navegador web comum, Electron (app desktop), Capacitor
 *          (app mobile Android/iOS) ou PWA (instalado).
 *          Com essa informação, o sistema pode adaptar seu
 *          comportamento e escolher a estratégia de armazenamento
 *          mais adequada para cada plataforma.
 *
 *  ESTRATÉGIAS DE ARMAZENAMENTO POR PLATAFORMA:
 *  - Electron (desktop): 'file'         — salva em arquivos do sistema
 *  - Capacitor (mobile): 'capacitor'    — usa o armazenamento nativo do dispositivo
 *  - Web / PWA:          'localStorage' — usa o armazenamento do navegador
 *
 *  PARA INICIANTES:
 *  - Este arquivo se auto-executa (IIFE) e registra os resultados em:
 *      window.APP_PLATFORM  — string como 'web', 'electron', 'android'
 *      window.AppPlatform   — objeto com todos os métodos e informações
 *  - Você pode usar diretamente no console: AppPlatform.getPlatform()
 * ============================================================
 */

(function () {
    'use strict';

    /**
     * Verifica se o sistema está rodando dentro do Electron (app desktop).
     * O Electron expõe APIs e variáveis específicas que permitem identificá-lo.
     *
     * @returns {boolean} true se estiver rodando no Electron, false caso contrário
     */
    function isElectron() {
        // Verifica o tipo de processo do Electron (renderer = janela do app)
        if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
            return true;
        }

        // Verifica a versão do Electron nas variáveis do Node.js
        if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
            return true;
        }

        // Verifica o User-Agent do navegador (Electron informa seu nome aqui)
        if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
            return true;
        }

        // Verifica se a API do Electron foi exposta via script preload (bridge)
        if (typeof window !== 'undefined' && (window.electronAPI || window.electron)) {
            return true;
        }

        return false;
    }

    /**
     * Verifica se o sistema está rodando via Capacitor (app mobile nativo).
     * Capacitor é um framework que permite usar apps web como apps nativos em Android/iOS.
     *
     * @returns {boolean} true se estiver rodando em ambiente Capacitor
     */
    function isCapacitor() {
        if (typeof window !== 'undefined') {
            // Verifica o objeto global do Capacitor e se está em plataforma nativa
            if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                return true;
            }

            // Verifica se os plugins do Capacitor estão disponíveis
            if (window.Capacitor && window.Capacitor.Plugins) {
                return true;
            }
        }
        return false;
    }

    /**
     * Verifica se está rodando em um dispositivo Android via Capacitor.
     *
     * @returns {boolean} true se for Android com Capacitor
     */
    function isAndroid() {
        if (isCapacitor() && typeof window !== 'undefined' && window.Capacitor) {
            return window.Capacitor.getPlatform() === 'android';
        }
        return false;
    }

    /**
     * Verifica se está rodando em um dispositivo iOS via Capacitor.
     *
     * @returns {boolean} true se for iOS (iPhone/iPad) com Capacitor
     */
    function isIOS() {
        if (isCapacitor() && typeof window !== 'undefined' && window.Capacitor) {
            return window.Capacitor.getPlatform() === 'ios';
        }
        return false;
    }

    /**
     * Verifica se o app está instalado como PWA (Progressive Web App).
     * Uma PWA instalada roda em modo "standalone" (sem barra de URL do navegador).
     *
     * @returns {boolean} true se estiver rodando como PWA instalado
     */
    function isPWA() {
        if (typeof window !== 'undefined') {
            // Verifica o media query de modo de exibição standalone (PWA instalado)
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
                return true;
            }

            // Verificação específica para iOS (Safari no iPhone/iPad instalado como PWA)
            if (window.navigator && window.navigator.standalone === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * Retorna o nome da plataforma atual como string.
     * Verifica na ordem: Electron > Android > iOS > PWA > Web.
     *
     * @returns {string} Um dos valores: 'electron' | 'android' | 'ios' | 'pwa' | 'web'
     */
    function getPlatform() {
        if (isElectron()) return 'electron';
        if (isAndroid()) return 'android';
        if (isIOS()) return 'ios';
        if (isPWA()) return 'pwa';
        return 'web'; // Padrão: navegador web comum
    }

    /**
     * Verifica se está em uma plataforma mobile (Android ou iOS via Capacitor).
     *
     * @returns {boolean} true se for Android ou iOS
     */
    function isMobile() {
        return isAndroid() || isIOS();
    }

    /**
     * Verifica se está em uma plataforma desktop (Electron).
     *
     * @returns {boolean} true se for Electron (app desktop)
     */
    function isDesktop() {
        return isElectron();
    }

    /**
     * Determina a melhor estratégia de armazenamento para a plataforma atual.
     * Cada plataforma tem sua própria API de armazenamento:
     *
     * - 'file':         Electron — armazena em arquivos do sistema operacional
     * - 'capacitor':    Capacitor — armazena no armazenamento nativo do dispositivo móvel
     * - 'localStorage': Web/PWA — armazena no banco de dados do navegador
     *
     * @returns {string} 'file' | 'capacitor' | 'localStorage'
     */
    function getStorageStrategy() {
        if (isElectron()) return 'file';
        if (isCapacitor()) return 'capacitor';
        return 'localStorage';
    }

    // ─────────────────────────────────────────────────────────
    // Objeto público com todas as funções e informações de plataforma
    // ─────────────────────────────────────────────────────────
    const platform = {
        isElectron,
        isCapacitor,
        isAndroid,
        isIOS,
        isPWA,
        getPlatform,
        isMobile,
        isDesktop,
        getStorageStrategy,

        // Propriedades calculadas na inicialização (leitura rápida)
        current: getPlatform(),       // Ex: 'web', 'electron', 'android'
        storageStrategy: getStorageStrategy() // Ex: 'localStorage', 'file', 'capacitor'
    };

    // Expõe o objeto globalmente para facilitar uso em outros scripts (sem import)
    if (typeof window !== 'undefined') {
        window.APP_PLATFORM = platform.current;  // String simples: 'web', 'electron', etc.
        window.AppPlatform = platform;           // Objeto completo com todas as funções
    }

    // Compatibilidade com sistemas de módulos CommonJS (Node.js / bundlers antigos)
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = platform;
    }

    // Registra informações de plataforma no console ao carregar o script
    // (visível durante o desenvolvimento para confirmar o ambiente)
    console.log('[Plataforma] Plataforma detectada:', platform.current);
    console.log('[Plataforma] Estratégia de armazenamento:', platform.storageStrategy);
})();
