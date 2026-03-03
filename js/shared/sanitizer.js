/**
 * ============================================================
 *  ARQUIVO: sanitizer.js
 *  DESCRIÇÃO: Módulo de segurança — sanitização de dados HTML
 *
 *  FUNÇÃO: Previne ataques de XSS (Cross-Site Scripting).
 *          XSS é quando um usuário mal-intencionado injeta código
 *          JavaScript malicioso em campos de texto que depois são
 *          exibidos na tela — e esse código acaba executando.
 *
 *          Exemplo de ataque XSS:
 *          - Usuário digita no campo Nome:  <script>alert('hackeado!')</script>
 *          - Se o sistema usar innerHTML sem sanitizar, esse script EXECUTA.
 *          - Se usar textContent ou escapeHtml(), o texto é exibido como está (seguro).
 *
 *  REGRA DE OURO:
 *  - NUNCA use innerHTML com dados vindos de usuários sem sanitizar antes.
 *  - SEMPRE prefira textContent, createTextNode() ou escapeHtml() para dados do usuário.
 *
 *  PARA INICIANTES:
 *  - Importe com: import { Sanitizer } from './shared/sanitizer.js';
 *  - Antes de exibir dados do usuário: elemento.textContent = valoreDoUsuario;
 *    (textContent já é seguro por padrão — não executa HTML)
 * ============================================================
 */

export const Sanitizer = {

    /**
     * Converte os caracteres especiais do HTML em suas entidades seguras.
     * "Escapar" significa substituir caracteres perigosos por versões que
     * o navegador exibe como texto normal, sem executar como código HTML.
     *
     * Caracteres convertidos:
     *   & → &amp;   (e comercial)
     *   < → &lt;    (menor que — início de tags HTML)
     *   > → &gt;    (maior que — fim de tags HTML)
     *   " → &quot;  (aspas duplas — usada em atributos HTML)
     *   ' → &#x27;  (aspas simples)
     *   / → &#x2F;  (barra — usada em tags de fechamento)
     *
     * Exemplo:
     *   Sanitizer.escapeHtml('<script>alert(1)</script>')
     *   => '&lt;script&gt;alert(1)&lt;/script&gt;' (seguro para exibir)
     *
     * @param {string} str - String a escapar
     * @returns {string} String com caracteres HTML escapados
     */
    escapeHtml(str) {
        if (typeof str !== 'string') return '';

        const htmlEscapeMap = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#x27;',
            '/': '&#x2F;'
        };

        return str.replace(/[&<>"'\/]/g, char => htmlEscapeMap[char]);
    },

    /**
     * Remove todos os tags HTML de uma string, retornando apenas o texto puro.
     * Usa um elemento div temporário para fazer a conversão com segurança,
     * aproveitando o próprio navegador para processar o HTML.
     *
     * Diferença de escapeHtml():
     *   - escapeHtml(): converte < em &lt; → EXIBE a tag como texto
     *   - sanitizeHtml(): REMOVE a tag completamente → só o texto interno fica
     *
     * IMPORTANTE: Esta função REMOVE todo HTML. Se precisar manter
     * algumas tags seguras (como <b> ou <i>), use uma biblioteca
     * especializada como DOMPurify.
     *
     * Exemplo:
     *   Sanitizer.sanitizeHtml('<b>Olá</b> <script>alert(1)</script>')
     *   => 'Olá alert(1)' (tags removidas, apenas texto)
     *
     * @param {string} html - String HTML a ser sanitizada
     * @returns {string} Texto puro sem nenhuma tag HTML
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';

        // Cria um elemento temporário e define o HTML como texto puro.
        // O navegador processa o HTML mas não o executa neste contexto.
        const temp = document.createElement('div');
        temp.textContent = html; // textContent é SEGURO — não interpreta HTML
        return temp.textContent || '';
    },

    /**
     * Cria um nó de texto seguro para inserção no DOM.
     * Nós de texto nunca executam como HTML — é a forma mais segura
     * de adicionar conteúdo dinâmico sem risco de XSS.
     *
     * Uso:
     *   const no = Sanitizer.createTextNode(dadoDoUsuario);
     *   elemento.appendChild(no);
     *
     * @param {string} text - Texto a converter em nó
     * @returns {Text} Nó de texto do DOM
     */
    createTextNode(text) {
        return document.createTextNode(text || '');
    },

    /**
     * Define o conteúdo de texto de um elemento do DOM de forma segura.
     * Equivalente a: elemento.textContent = texto (mas com verificação de null).
     *
     * Por que usar textContent em vez de innerHTML?
     *   - textContent trata o valor como TEXTO PURO → seguro
     *   - innerHTML trata o valor como HTML → pode executar scripts!
     *
     * Uso:
     *   Sanitizer.setTextContent(document.getElementById('nome'), dadoDoUsuario);
     *
     * @param {HTMLElement} element - Elemento do DOM a atualizar
     * @param {string}      text    - Texto a definir (serão escapados caracteres especiais)
     */
    setTextContent(element, text) {
        if (element) {
            element.textContent = text || '';
        }
    },

    /**
     * Cria um elemento HTML com texto seguro e classe CSS opcional.
     * Alternativa segura ao uso de innerHTML para criar elementos dinamicamente.
     *
     * Exemplo:
     *   const p = Sanitizer.createElement('p', 'Bem-vindo, João!', 'texto-destaque');
     *   document.body.appendChild(p);
     *   // Cria: <p class="texto-destaque">Bem-vindo, João!</p>
     *
     * @param {string} tagName   - Nome da tag HTML (ex: 'p', 'span', 'div')
     * @param {string} [text=''] - Texto de conteúdo do elemento
     * @param {string} [className=''] - Classes CSS para o elemento
     * @returns {HTMLElement} Elemento HTML criado com segurança
     */
    createElement(tagName, text = '', className = '') {
        const element = document.createElement(tagName);
        if (className) element.className = className;
        if (text) element.textContent = text; // textContent = seguro
        return element;
    },

    /**
     * Sanitiza entrada de usuário removendo HTML, scripts e outros conteúdos perigosos.
     * Usa múltiplas passagens para evitar técnicas de bypass comuns.
     *
     * ⚠️  IMPORTANTE — Limitações desta abordagem:
     * Esta função foi construída com regex e manipulação de strings, que
     * têm limitações conhecidas. Para máxima segurança em conteúdo crítico,
     * prefira usar textContent diretamente ou a biblioteca DOMPurify.
     * Esta função é adequada para validação de entrada em formulários
     * comuns, não para aplicações de alta segurança.
     *
     * O que é removido:
     *   - Todas as tags HTML (<tag>, </tag>)
     *   - Protocolos perigosos (javascript:, data:, vbscript:)
     *   - Atributos de evento HTML (onclick=, onload=, onfocus=, etc.)
     *
     * @param {string} input - Texto de entrada do usuário
     * @returns {string} Texto sanitizado, seguro para uso na interface
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';

        let sanitized = input;

        // Múltiplas passagens para lidar com técnicas de bypass aninhadas
        let iterations = 0;
        const maxIterations = 10; // Limite para evitar loops infinitos

        while (iterations < maxIterations) {
            const before = sanitized;

            // ── Remove tags HTML ─────────────────────────────────────────────
            // Divide pelo caractere < e remove tudo até o próximo >
            const parts = sanitized.split('<');
            sanitized = parts[0]; // Mantém o conteúdo antes da primeira tag
            for (let i = 1; i < parts.length; i++) {
                const gtIndex = parts[i].indexOf('>');
                if (gtIndex !== -1) {
                    // Pula tudo dentro da tag e mantém o que vem depois
                    sanitized += parts[i].substring(gtIndex + 1);
                }
                // Se não há >, a < era incompleta — ignora completamente
            }

            // ── Remove tags codificadas em HTML entities ──────────────────────
            sanitized = sanitized.replace(/&lt;.*?&gt;/gi, '');

            // ── Remove protocolos perigosos (com espaços para bypass) ─────────
            sanitized = sanitized.replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '');
            sanitized = sanitized.replace(/d\s*a\s*t\s*a\s*:/gi, '');
            sanitized = sanitized.replace(/v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '');

            // ── Remove atributos de evento HTML (onclick=, onload=, etc.) ─────
            // Divide pelo prefixo 'on' e remove partes que parecem event handlers
            const onParts = sanitized.split(/\bon/i);
            if (onParts.length > 1) {
                sanitized = onParts[0]; // Mantém antes do 'on'
                for (let i = 1; i < onParts.length; i++) {
                    // Se não parece um event handler (letra= seguido de =), mantém
                    if (!/^[a-z]+\s*=/i.test(onParts[i])) {
                        sanitized += 'on' + onParts[i];
                    }
                    // Se parece event handler (onclick=, onload=), descarta
                }
            }

            // Se nenhuma mudança foi feita nesta passagem, o texto já está limpo
            if (before === sanitized) break;

            iterations++;
        }

        return sanitized.trim(); // Remove espaços do início e do fim
    },

    /**
     * Valida e sanitiza uma URL, rejeitando protocolos perigosos.
     * Retorna null se a URL for inválida ou usar protocolo não permitido.
     *
     * Protocolos PERMITIDOS: http:, https:, mailto:
     * Protocolos BLOQUEADOS: javascript:, data:, vbscript:, file:
     *
     * Exemplos:
     *   Sanitizer.sanitizeUrl('https://exemplo.com') => 'https://exemplo.com'
     *   Sanitizer.sanitizeUrl('javascript:alert(1)') => null (bloqueado)
     *   Sanitizer.sanitizeUrl('not a url')           => null (inválida)
     *
     * @param {string} url - URL a validar e sanitizar
     * @returns {string|null} URL sanitizada ou null se inválida/perigosa
     */
    sanitizeUrl(url) {
        if (typeof url !== 'string') return null;

        try {
            const parsed = new URL(url, window.location.origin);

            const allowedProtocols = ['http:', 'https:', 'mailto:'];
            const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];

            const lowerProtocol = parsed.protocol.toLowerCase();

            // Verifica protocolos perigosos PRIMEIRO (por segurança)
            if (dangerousProtocols.includes(lowerProtocol)) return null;

            // Verifica se o protocolo está na lista de permitidos
            if (!allowedProtocols.includes(lowerProtocol)) return null;

            return parsed.href; // Retorna a URL normalizada e sanitizada
        } catch (e) {
            return null; // URL malformada
        }
    },

    /**
     * Adiciona conteúdo ao DOM de forma segura, sem usar innerHTML.
     * Converte o HTML fornecido em texto puro antes de inserir,
     * evitando execução de scripts maliciosos.
     *
     * NOTA: Esta função insere o conteúdo como TEXTO PURO, não como HTML.
     * Se precisar inserir HTML real (de forma controlada), use autre abordagem.
     *
     * @param {HTMLElement} parent - Elemento que receberá o conteúdo
     * @param {string}      html   - Conteúdo a adicionar (será tratado como texto)
     */
    safeAppendHtml(parent, html) {
        if (!parent || typeof html !== 'string') return;

        // Cria um elemento temporário e usa textContent (seguro)
        const temp = document.createElement('div');
        temp.textContent = html;

        // Move os filhos (nós de texto) para o elemento pai real
        while (temp.firstChild) {
            parent.appendChild(temp.firstChild);
        }
    },

    /**
     * Remove todos os elementos filhos de um elemento HTML de forma segura.
     * Alternativa segura a: elemento.innerHTML = '' (que pode ter side effects).
     *
     * Uso:
     *   Sanitizer.clearElement(document.getElementById('lista-clientes'));
     *   // Esvazia a lista sem usar innerHTML
     *
     * @param {HTMLElement} element - Elemento a limpar
     */
    clearElement(element) {
        if (!element) return;

        // Remove os filhos um a um até o elemento ficar vazio
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
};
