/**
 * ============================================================
 *  ARQUIVO: utils.js
 *  DESCRIÇÃO: Utilitários gerais do sistema
 *  FUNÇÃO: Funções auxiliares reutilizáveis em todo o projeto,
 *          como formatação de CPF, telefone, geração de ID único,
 *          e manipulação de datas sem dependência de bibliotecas externas.
 *
 *  PARA INICIANTES:
 *  - Este arquivo é uma "caixa de ferramentas" do sistema.
 *  - Para usar qualquer função, importe o objeto Utils no seu arquivo:
 *      import { Utils } from './shared/utils.js';
 *  - Depois chame como: Utils.formatCPF('12345678901')
 * ============================================================
 */

import { Validator } from './validator.js';

export const Utils = {

    /**
     * Gera um ID único universal (UUID v4).
     * Usado para criar identificadores únicos para registros e clientes.
     *
     * Exemplo de retorno: "550e8400-e29b-41d4-a716-446655440000"
     *
     * @returns {string} Um UUID v4 aleatório no formato padrão
     */
    generateUUID() {
        return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(new RegExp('[018]', 'g'), c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    },

    /**
     * Formata uma string de dígitos no padrão de CPF brasileiro: 000.000.000-00
     * Remove letras, pontos e traços antes de formatar.
     *
     * Exemplo:
     *   Utils.formatCPF('12345678901') => '123.456.789-01'
     *   Utils.formatCPF('123.456.789-01') => '123.456.789-01' (já formatado, mantém)
     *
     * @param {string} value - O CPF como string (com ou sem formatação)
     * @returns {string} CPF formatado no padrão 000.000.000-00
     */
    formatCPF(value) {
        // Remove tudo que não for número
        value = value.replace(new RegExp('\\D', 'g'), '');
        // Limita a 11 dígitos
        value = value.slice(0, 11);
        // Aplica os pontos e o traço progressivamente
        value = value.replace(new RegExp('(\\d{3})(\\d)'), '$1.$2');
        value = value.replace(new RegExp('(\\d{3})\\.(\\d{3})(\\d)'), '$1.$2.$3');
        value = value.replace(new RegExp('(\\d{3})\\.(\\d{3})\\.(\\d{3})(\\d{1,2})'), '$1.$2.$3-$4');
        return value;
    },

    /**
     * Formata uma string de dígitos como número de telefone brasileiro.
     * Suporta celular (11 dígitos) e fixo (10 dígitos).
     *
     * Exemplos:
     *   Utils.formatTelefone('11987654321') => '(11) 98765-4321'
     *   Utils.formatTelefone('1132654321')  => '(11) 3265-4321'
     *
     * @param {string} value - O telefone como string (com ou sem formatação)
     * @returns {string} Telefone formatado no padrão (XX) XXXXX-XXXX ou (XX) XXXX-XXXX
     */
    formatTelefone(value) {
        // Remove tudo que não for número
        value = value.replace(new RegExp('\\D', 'g'), '');
        // Limita a 11 dígitos (celular com DDD)
        value = value.slice(0, 11);
        // Aplica o DDD entre parênteses
        value = value.replace(new RegExp('^(\\d{2})(\\d)'), '($1) $2');
        // Aplica o hífen no meio do número
        value = value.replace(new RegExp('(\\d{5})(\\d)'), '$1-$2');
        return value;
    },

    /**
     * Valida um CPF usando o algoritmo oficial da Receita Federal.
     * Esta função delega para Validator.validateCPF, que é a fonte
     * única de verdade da validação. Assim, o algoritmo fica em um
     * só lugar e não há duplicação de código.
     *
     * Exemplo:
     *   Utils.validateCPF('123.456.789-09') => true (CPF válido)
     *   Utils.validateCPF('111.111.111-11') => false (CPF inválido - todos iguais)
     *
     * @param {string} cpfStr - CPF para validar (com ou sem formatação)
     * @returns {boolean} true se o CPF for válido, false caso contrário
     */
    validateCPF(cpfStr) {
        // Delega para Validator (fonte única de verdade do algoritmo CPF)
        return Validator.validateCPF(cpfStr);
    },

    /**
     * Retorna a data/hora atual no formato ISO 8601 usando o horário LOCAL
     * da máquina (sem conversão para UTC).
     *
     * Diferença do Date.toISOString() padrão:
     *   - toISOString() converte para UTC (pode dar data errada dependendo do fuso)
     *   - Esta função usa o horário local do computador
     *
     * Exemplo de retorno: "2025-03-01T14:30:00.000"
     *
     * @param {Date} [date=new Date()] - Data a formatar (padrão: agora)
     * @returns {string} Data e hora local no formato "YYYY-MM-DDTHH:mm:ss.mmm"
     */
    getLocalISOString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0'); // getMonth() começa em 0 (janeiro = 0)
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
    },

    /**
     * Converte uma data (objeto Date ou string) para o formato de data apenas:
     * "YYYY-MM-DD", usando o horário LOCAL da máquina.
     *
     * Exemplo:
     *   Utils.getLocalDateString(new Date('2025-03-01T03:00:00Z'))
     *   => "2025-03-01" (pode variar de acordo com o fuso horário)
     *
     * @param {Date|string} dateOrString - Objeto Date ou string de data
     * @returns {string} Data no formato "YYYY-MM-DD"
     */
    getLocalDateString(dateOrString) {
        let date;
        if (typeof dateOrString === 'string') {
            date = new Date(dateOrString);
        } else {
            date = dateOrString;
        }
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    /**
     * Debounce — Evita que uma função seja chamada muitas vezes em sequência rápida.
     *
     * Muito útil para campos de pesquisa: sem debounce, a busca seria
     * disparada a cada tecla pressionada. Com debounce, ela só acontece
     * depois que o usuário PARAR de digitar pelo tempo definido.
     *
     * Exemplo de uso:
     *   const buscarComDebounce = Utils.debounce(() => buscar(), 500);
     *   inputDeBusca.addEventListener('input', buscarComDebounce);
     *   // A função buscar() só será chamada 500ms após a última tecla
     *
     * @param {Function} func - A função que deve ter o atraso aplicado
     * @param {number} [wait=300] - Tempo de espera em milissegundos (padrão: 300ms)
     * @returns {Function} Nova função com o debounce aplicado
     */
    debounce(func, wait = 300) {
        let timeout; // Armazena o timer interno
        return function executedFunction(...args) {
            const context = this;
            clearTimeout(timeout); // Cancela qualquer chamada anterior pendente
            // Agenda a função para executar após o tempo de espera
            timeout = setTimeout(() => func.apply(context, args), wait);
        };
    },

    /**
     * Ajusta o brilho de uma cor no formato hexadecimal (#RRGGBB).
     * Valores positivos clareiam a cor, valores negativos escurecem.
     *
     * Exemplos:
     *   Utils.adjustColor('#336699', 40)   => '#5386c3' (mais clara)
     *   Utils.adjustColor('#336699', -40)  => '#0d4669' (mais escura)
     *
     * @param {string} color - Cor em formato hexadecimal (ex: '#336699')
     * @param {number} amount - Quantidade de ajuste (-255 a 255)
     * @returns {string} Nova cor ajustada em hexadecimal
     */
    adjustColor(color, amount) {
        return '#' + color.replace(/^#/, '').replace(/../g, color =>
            ('0' + Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2)
        );
    }
};
