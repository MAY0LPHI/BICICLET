/**
 * ============================================================
 *  ARQUIVO: validator.js
 *  DESCRIÇÃO: Módulo centralizado de validação de dados
 *
 *  FUNÇÃO: Contém toda a lógica de validação de dados do sistema,
 *          seguindo o princípio DRY (Don't Repeat Yourself — não
 *          repita o mesmo código em vários lugares).
 *          Todas as validações passam por aqui, garantindo que
 *          as regras de negócio sejam consistentes no sistema inteiro.
 *
 *  ATENÇÃO: Este arquivo importa de constants.js, mas constants.js
 *           NÃO DEVE importar deste arquivo, para evitar dependências
 *           circulares (importações que formam um ciclo).
 *
 *  PARA INICIANTES:
 *  - Importe a classe: import { Validator } from './shared/validator.js';
 *  - Todos os métodos são static (não precisa criar instância):
 *      Validator.validateCPF('123.456.789-01')
 *  - Métodos de validação simples retornam boolean (true/false).
 *  - Métodos de validação complexos retornam { valid: boolean, error?: string }
 * ============================================================
 */

import { VALIDATION, ERROR_MESSAGES } from './constants.js';

export class Validator {

    /**
     * Valida um CPF usando o algoritmo oficial da Receita Federal brasileira.
     *
     * O algoritmo funciona assim:
     * 1. Remove formatação e verifica se tem 11 dígitos.
     * 2. Rejeita CPFs com todos os dígitos iguais (111.111.111-11, etc.) — são inválidos.
     * 3. Calcula o 1º dígito verificador e compara com o 10º dígito do CPF.
     * 4. Calcula o 2º dígito verificador e compara com o 11º dígito do CPF.
     *
     * Exemplos:
     *   Validator.validateCPF('529.982.247-25') => true
     *   Validator.validateCPF('111.111.111-11') => false (todos iguais)
     *   Validator.validateCPF('123.456.789-00') => false (dígitos errados)
     *
     * @param {string} cpf - CPF para validar (com ou sem pontos e traço)
     * @returns {boolean} true se o CPF for matematicamente válido
     */
    static validateCPF(cpf) {
        if (!cpf) return false;

        // Remove tudo que não for número (pontos, traços, espaços)
        cpf = cpf.replace(/[^\d]/g, '');

        // CPF deve ter exatamente 11 dígitos
        if (cpf.length !== VALIDATION.CPF_LENGTH) return false;

        // CPFs com todos os dígitos iguais são inválidos (ex: 000.000.000-00)
        if (/^(\d)\1{10}$/.test(cpf)) return false;

        // ── Cálculo do 1º dígito verificador ────────────────────────────────
        // Soma: cada dígito (posição 1 a 9) é multiplicado por (10 - posição)
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit > 9) digit = 0; // Se o resultado for 10 ou 11, o dígito é 0
        if (digit !== parseInt(cpf.charAt(9))) return false; // Compara com o 10º dígito

        // ── Cálculo do 2º dígito verificador ────────────────────────────────
        // Soma: cada dígito (posição 1 a 10) é multiplicado por (11 - posição)
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit > 9) digit = 0;
        if (digit !== parseInt(cpf.charAt(10))) return false; // Compara com o 11º dígito

        return true; // CPF válido!
    }

    /**
     * Valida o formato de um endereço de e-mail.
     * Verifica a presença do @ e de um domínio após ele.
     * Não verifica se o e-mail realmente existe (apenas o formato).
     *
     * Exemplos:
     *   Validator.validateEmail('usuario@email.com') => true
     *   Validator.validateEmail('usuario@')          => false
     *   Validator.validateEmail('semArroba')         => false
     *
     * @param {string} email - E-mail para validar
     * @returns {boolean} true se o formato for válido
     */
    static validateEmail(email) {
        if (!email) return false;
        return VALIDATION.EMAIL_REGEX.test(email.trim().toLowerCase());
    }

    /**
     * Valida o formato de um número de telefone brasileiro.
     * Formatos aceitos: (11) 98765-4321 (celular) ou (11) 3456-7890 (fixo)
     * O número deve estar formatado (com parênteses, espaço e hífen).
     *
     * Exemplos:
     *   Validator.validateTelefone('(11) 98765-4321') => true
     *   Validator.validateTelefone('11987654321')     => false (sem formatação)
     *
     * @param {string} telefone - Telefone a validar (deve estar formatado)
     * @returns {boolean} true se o formato for válido
     */
    static validateTelefone(telefone) {
        if (!telefone) return false;
        return VALIDATION.TELEFONE_REGEX.test(telefone);
    }

    /**
     * Valida o nome de uma pessoa ou entidade.
     * Verifica se o nome tem comprimento adequado (mínimo e máximo definidos em constants.js).
     *
     * Retorna um objeto com o resultado da validação:
     *   - valid: true = nome válido
     *   - error: mensagem de erro se inválido
     *
     * Exemplos:
     *   Validator.validateNome('João Silva') => { valid: true }
     *   Validator.validateNome('A')          => { valid: false, error: 'Nome deve ter no mínimo 2 caracteres' }
     *
     * @param {string} nome - Nome a validar
     * @returns {{ valid: boolean, error?: string }} Resultado da validação
     */
    static validateNome(nome) {
        if (!nome || typeof nome !== 'string') {
            return { valid: false, error: 'Nome é obrigatório' };
        }

        const trimmed = nome.trim(); // Remove espaços do início e do fim

        if (trimmed.length < VALIDATION.MIN_NAME_LENGTH) {
            return {
                valid: false,
                error: `Nome deve ter no mínimo ${VALIDATION.MIN_NAME_LENGTH} caracteres`
            };
        }

        if (trimmed.length > VALIDATION.MAX_NAME_LENGTH) {
            return {
                valid: false,
                error: `Nome deve ter no máximo ${VALIDATION.MAX_NAME_LENGTH} caracteres`
            };
        }

        return { valid: true };
    }

    /**
     * Verifica se todos os campos obrigatórios de um objeto foram preenchidos.
     * Um campo é considerado vazio se for undefined, null, ou string vazia/com espaços.
     *
     * Exemplo:
     *   const cliente = { nome: 'João', cpf: '', telefone: '(11) 99999-9999' };
     *   Validator.validateRequiredFields(cliente, ['nome', 'cpf'])
     *   => { valid: false, missing: ['cpf'] }
     *
     * @param {Object}   obj            - O objeto com os dados a verificar
     * @param {string[]} requiredFields - Lista de nomes dos campos obrigatórios
     * @returns {{ valid: boolean, missing?: string[] }} Resultado com campos faltando
     */
    static validateRequiredFields(obj, requiredFields) {
        const missing = []; // Lista de campos que estão vazios

        for (const field of requiredFields) {
            const value = obj[field];
            // Campo inválido se: não existe, é null, ou é string com apenas espaços
            if (!value || (typeof value === 'string' && !value.trim())) {
                missing.push(field);
            }
        }

        if (missing.length > 0) {
            return { valid: false, missing };
        }

        return { valid: true };
    }

    /**
     * Valida uma data, verificando seu formato e restrições de intervalo.
     *
     * Opções disponíveis:
     *   - noFuture: true  → rejeita datas no futuro
     *   - noPast: true    → rejeita datas no passado
     *   - minDate: string → data mínima permitida (ex: '2020-01-01')
     *   - maxDate: string → data máxima permitida
     *
     * Exemplos:
     *   Validator.validateDate('2025-03-01') => { valid: true }
     *   Validator.validateDate('',)          => { valid: false, error: 'Data é obrigatória' }
     *   Validator.validateDate('2099-01-01', { noFuture: true }) => { valid: false, error: 'Data não pode ser futura' }
     *
     * @param {string} date - Data no formato ISO (YYYY-MM-DD) ou outro formato válido
     * @param {Object} [options={}] - Restrições de validação
     * @returns {{ valid: boolean, error?: string }} Resultado da validação
     */
    static validateDate(date, options = {}) {
        if (!date) {
            return { valid: false, error: 'Data é obrigatória' };
        }

        const dateObj = new Date(date);

        // Verifica se a data é válida (ex: '30/02/2025' não é uma data real)
        if (isNaN(dateObj.getTime())) {
            return { valid: false, error: 'Data inválida' };
        }

        // Restrição: data não pode ser futura
        if (options.noFuture && dateObj > new Date()) {
            return { valid: false, error: 'Data não pode ser futura' };
        }

        // Restrição: data não pode ser passada
        if (options.noPast && dateObj < new Date()) {
            return { valid: false, error: 'Data não pode ser passada' };
        }

        // Restrição: data mínima
        if (options.minDate && dateObj < new Date(options.minDate)) {
            return { valid: false, error: 'Data anterior ao mínimo permitido' };
        }

        // Restrição: data máxima
        if (options.maxDate && dateObj > new Date(options.maxDate)) {
            return { valid: false, error: 'Data posterior ao máximo permitido' };
        }

        return { valid: true };
    }

    /**
     * Valida o comprimento de um texto, garantindo que não ultrapasse o limite.
     * Se o texto estiver vazio ou undefined, é considerado válido (campo opcional).
     *
     * Exemplo:
     *   Validator.validateTextLength('Texto curto', 500) => { valid: true }
     *   Validator.validateTextLength('Texto...muito longo', 10) => { valid: false, error: '...' }
     *
     * @param {string} text      - Texto a validar
     * @param {number} maxLength - Comprimento máximo permitido em caracteres
     * @returns {{ valid: boolean, error?: string }} Resultado da validação
     */
    static validateTextLength(text, maxLength) {
        if (!text) return { valid: true }; // Campo vazio é válido (opcional)

        if (typeof text !== 'string') {
            return { valid: false, error: 'Texto inválido' };
        }

        if (text.length > maxLength) {
            return {
                valid: false,
                error: `Texto deve ter no máximo ${maxLength} caracteres`
            };
        }

        return { valid: true };
    }

    /**
     * Valida um arquivo enviado pelo usuário, verificando tamanho e tipo.
     *
     * Opções disponíveis:
     *   - maxSizeMB: número máximo de megabytes (padrão: 10)
     *   - allowedTypes: array de MIME types permitidos (ex: ['image/jpeg', 'image/png'])
     *
     * Exemplo:
     *   Validator.validateFile(arquivo, { maxSizeMB: 5, allowedTypes: ['image/jpeg'] })
     *
     * @param {File}   file         - Objeto File do input de arquivo HTML
     * @param {Object} [options={}] - Restrições de validação
     * @returns {{ valid: boolean, error?: string }} Resultado da validação
     */
    static validateFile(file, options = {}) {
        if (!file) {
            return { valid: false, error: 'Arquivo é obrigatório' };
        }

        // Verifica o tamanho do arquivo
        const maxSize = options.maxSizeMB || 10; // Padrão: 10 MB
        const maxSizeBytes = maxSize * 1024 * 1024;

        if (file.size > maxSizeBytes) {
            return {
                valid: false,
                error: `Arquivo muito grande. Tamanho máximo: ${maxSize}MB`
            };
        }

        // Verifica o tipo do arquivo (MIME type)
        if (options.allowedTypes && options.allowedTypes.length > 0) {
            if (!options.allowedTypes.includes(file.type)) {
                return {
                    valid: false,
                    error: 'Tipo de arquivo não permitido'
                };
            }
        }

        return { valid: true };
    }

    /**
     * Avalia a força de uma senha e verifica se ela atende aos requisitos mínimos.
     *
     * Critérios de pontuação (cada um vale 1 ponto):
     *   - 8+ caracteres
     *   - 12+ caracteres
     *   - Tem letras minúsculas (a-z)
     *   - Tem letras maiúsculas (A-Z)
     *   - Tem números (0-9)
     *   - Tem caracteres especiais (!@#$%, etc.)
     *
     * Classificação:
     *   - 5+ pontos: 'strong' (forte)
     *   - 3-4 pontos: 'medium' (média)
     *   - < 3 pontos: 'weak' (fraca)
     *
     * Exemplo:
     *   Validator.validatePassword('Senha@123') => { valid: true, strength: 'strong' }
     *   Validator.validatePassword('123456')    => { valid: true, strength: 'weak' }
     *
     * @param {string} password      - Senha a validar
     * @param {Object} [options={}]  - Configurações (ex: { minLength: 8 })
     * @returns {{ valid: boolean, strength: string, error?: string }} Resultado
     */
    static validatePassword(password, options = {}) {
        if (!password) {
            return { valid: false, strength: 'none', error: 'Senha é obrigatória' };
        }

        const minLength = options.minLength || 6; // Mínimo padrão de 6 caracteres

        if (password.length < minLength) {
            return {
                valid: false,
                strength: 'weak',
                error: `Senha deve ter no mínimo ${minLength} caracteres`
            };
        }

        // Calcula a pontuação de força da senha
        let score = 0;
        if (password.length >= 8) score++; // Comprimento razoável
        if (password.length >= 12) score++; // Comprimento bom
        if (/[a-z]/.test(password)) score++; // Há letras minúsculas
        if (/[A-Z]/.test(password)) score++; // Há letras maiúsculas
        if (/[0-9]/.test(password)) score++; // Há números
        if (/[^a-zA-Z0-9]/.test(password)) score++; // Há caracteres especiais

        let strength = 'weak';
        if (score >= 5) strength = 'strong';
        else if (score >= 3) strength = 'medium';

        return { valid: true, strength };
    }

    /**
     * Valida se uma URL está no formato correto e usa um protocolo seguro.
     * Permite apenas http:, https: e mailto:.
     *
     * Exemplos:
     *   Validator.validateUrl('https://exemplo.com') => true
     *   Validator.validateUrl('javascript:alert(1)') => false (protocolo perigoso)
     *   Validator.validateUrl('texto simples')       => false
     *
     * @param {string} url - URL a validar
     * @returns {boolean} true se a URL for válida e usar protocolo permitido
     */
    static validateUrl(url) {
        if (!url) return false;

        try {
            const urlObj = new URL(url);
            // Apenas protocolos seguros são permitidos
            return ['http:', 'https:', 'mailto:'].includes(urlObj.protocol);
        } catch {
            return false; // URL malformada (lançou exceção ao parsear)
        }
    }

    /**
     * Valida se um valor é um número e opcionalmente verifica intervalos.
     *
     * Opções disponíveis:
     *   - min: valor mínimo aceito
     *   - max: valor máximo aceito
     *   - integer: true → só aceita números inteiros
     *   - positive: true → só aceita números maiores que zero
     *
     * Exemplos:
     *   Validator.validateNumber(10, { min: 1, max: 50 })        => { valid: true }
     *   Validator.validateNumber(-5, { positive: true })          => { valid: false, error: '...' }
     *   Validator.validateNumber(3.14, { integer: true })         => { valid: false, error: '...' }
     *
     * @param {any}    value       - Valor a validar (pode ser string ou número)
     * @param {Object} [options={}] - Restrições de validação
     * @returns {{ valid: boolean, error?: string }} Resultado da validação
     */
    static validateNumber(value, options = {}) {
        const num = Number(value); // Converte para número (funciona com strings também)

        if (isNaN(num)) {
            return { valid: false, error: 'Valor deve ser numérico' };
        }

        if (options.min !== undefined && num < options.min) {
            return { valid: false, error: `Valor mínimo permitido: ${options.min}` };
        }

        if (options.max !== undefined && num > options.max) {
            return { valid: false, error: `Valor máximo permitido: ${options.max}` };
        }

        if (options.integer && !Number.isInteger(num)) {
            return { valid: false, error: 'Valor deve ser um número inteiro' };
        }

        if (options.positive && num <= 0) {
            return { valid: false, error: 'Valor deve ser positivo (maior que zero)' };
        }

        return { valid: true };
    }

    /**
     * Valida o conjunto completo de dados de um cliente.
     * Agrupa as validações de nome, CPF e telefone em um único método.
     *
     * Retorna um objeto com:
     *   - valid: true se todos os campos são válidos
     *   - errors: objeto com um erro por campo inválido
     *
     * Exemplo:
     *   const resultado = Validator.validateClient({ nome: 'João', cpf: '123', telefone: '' });
     *   // => { valid: false, errors: { cpf: 'CPF inválido.' } }
     *
     * @param {Object} client - Objeto com os dados do cliente
     * @param {string} client.nome     - Nome do cliente
     * @param {string} client.cpf      - CPF do cliente
     * @param {string} [client.telefone] - Telefone (opcional)
     * @returns {{ valid: boolean, errors: Object }} Resultado completo
     */
    static validateClient(client) {
        const errors = {};

        // Valida o nome
        const nomeValidation = this.validateNome(client.nome);
        if (!nomeValidation.valid) {
            errors.nome = nomeValidation.error;
        }

        // Valida o CPF
        if (!this.validateCPF(client.cpf)) {
            errors.cpf = ERROR_MESSAGES.CPF_INVALID;
        }

        // Valida o telefone apenas se foi preenchido (campo opcional)
        if (client.telefone && !this.validateTelefone(client.telefone)) {
            errors.telefone = 'Telefone inválido. Use o formato (DDD) XXXXX-XXXX';
        }

        return {
            valid: Object.keys(errors).length === 0, // válido se não houver erros
            errors
        };
    }
}

// ─────────────────────────────────────────────────────────
// Exportações alternativas (para simplicidade de uso quando não se quer a classe)
// Permite importar diretamente: import { validateCPF } from './shared/validator.js';
// ─────────────────────────────────────────────────────────
export const {
    validateCPF,
    validateEmail,
    validateTelefone,
    validateNome,
    validateRequiredFields,
    validateDate,
    validateTextLength,
    validateFile,
    validatePassword,
    validateUrl,
    validateNumber,
    validateClient
} = Validator;
