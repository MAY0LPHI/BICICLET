/**
 * Data Validation Module
 * Centralized validation logic following DRY principle
 * 
 * Note: This module imports from constants.js to maintain single source of truth.
 * Constants.js should NOT import from this module to avoid circular dependencies.
 */

import { VALIDATION, ERROR_MESSAGES } from './constants.js';

export class Validator {
    /**
     * Validates CPF (Cadastro de Pessoas Físicas)
     * @param {string} cpf - CPF to validate
     * @returns {boolean} True if valid
     */
    static validateCPF(cpf) {
        if (!cpf) return false;
        
        // Remove formatting
        cpf = cpf.replace(/[^\d]/g, '');
        
        // Check length
        if (cpf.length !== VALIDATION.CPF_LENGTH) return false;
        
        // Check for repeated digits
        if (/^(\d)\1{10}$/.test(cpf)) return false;
        
        // Validate first check digit
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let digit = 11 - (sum % 11);
        if (digit > 9) digit = 0;
        if (digit !== parseInt(cpf.charAt(9))) return false;
        
        // Validate second check digit
        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        digit = 11 - (sum % 11);
        if (digit > 9) digit = 0;
        if (digit !== parseInt(cpf.charAt(10))) return false;
        
        return true;
    }

    /**
     * Validates email format
     * @param {string} email - Email to validate
     * @returns {boolean} True if valid
     */
    static validateEmail(email) {
        if (!email) return false;
        return VALIDATION.EMAIL_REGEX.test(email.trim().toLowerCase());
    }

    /**
     * Validates phone number format
     * @param {string} telefone - Phone number to validate
     * @returns {boolean} True if valid
     */
    static validateTelefone(telefone) {
        if (!telefone) return false;
        return VALIDATION.TELEFONE_REGEX.test(telefone);
    }

    /**
     * Validates name
     * @param {string} nome - Name to validate
     * @returns {Object} { valid: boolean, error?: string }
     */
    static validateNome(nome) {
        if (!nome || typeof nome !== 'string') {
            return { valid: false, error: 'Nome é obrigatório' };
        }
        
        const trimmed = nome.trim();
        
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
     * Validates required fields in an object
     * @param {Object} obj - Object to validate
     * @param {Array<string>} requiredFields - Array of required field names
     * @returns {Object} { valid: boolean, missing?: Array<string> }
     */
    static validateRequiredFields(obj, requiredFields) {
        const missing = [];
        
        for (const field of requiredFields) {
            if (!obj[field] || (typeof obj[field] === 'string' && !obj[field].trim())) {
                missing.push(field);
            }
        }
        
        if (missing.length > 0) {
            return { valid: false, missing };
        }
        
        return { valid: true };
    }

    /**
     * Validates date format and range
     * @param {string} date - Date string to validate
     * @param {Object} options - Validation options
     * @returns {Object} { valid: boolean, error?: string }
     */
    static validateDate(date, options = {}) {
        if (!date) {
            return { valid: false, error: 'Data é obrigatória' };
        }
        
        const dateObj = new Date(date);
        
        if (isNaN(dateObj.getTime())) {
            return { valid: false, error: 'Data inválida' };
        }
        
        // Check if date is in the future (if not allowed)
        if (options.noFuture && dateObj > new Date()) {
            return { valid: false, error: 'Data não pode ser futura' };
        }
        
        // Check if date is in the past (if not allowed)
        if (options.noPast && dateObj < new Date()) {
            return { valid: false, error: 'Data não pode ser passada' };
        }
        
        // Check minimum date
        if (options.minDate && dateObj < new Date(options.minDate)) {
            return { valid: false, error: 'Data anterior ao mínimo permitido' };
        }
        
        // Check maximum date
        if (options.maxDate && dateObj > new Date(options.maxDate)) {
            return { valid: false, error: 'Data posterior ao máximo permitido' };
        }
        
        return { valid: true };
    }

    /**
     * Validates text length
     * @param {string} text - Text to validate
     * @param {number} maxLength - Maximum length
     * @returns {Object} { valid: boolean, error?: string }
     */
    static validateTextLength(text, maxLength) {
        if (!text) {
            return { valid: true };
        }
        
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
     * Validates file upload
     * @param {File} file - File to validate
     * @param {Object} options - Validation options
     * @returns {Object} { valid: boolean, error?: string }
     */
    static validateFile(file, options = {}) {
        if (!file) {
            return { valid: false, error: 'Arquivo é obrigatório' };
        }
        
        // Check file size
        const maxSize = options.maxSizeMB || 10;
        const maxSizeBytes = maxSize * 1024 * 1024;
        
        if (file.size > maxSizeBytes) {
            return { 
                valid: false, 
                error: `Arquivo muito grande. Máximo: ${maxSize}MB` 
            };
        }
        
        // Check file type
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
     * Validates password strength
     * @param {string} password - Password to validate
     * @param {Object} options - Validation options
     * @returns {Object} { valid: boolean, strength: string, error?: string }
     */
    static validatePassword(password, options = {}) {
        if (!password) {
            return { valid: false, strength: 'none', error: 'Senha é obrigatória' };
        }
        
        const minLength = options.minLength || 6;
        
        if (password.length < minLength) {
            return { 
                valid: false, 
                strength: 'weak',
                error: `Senha deve ter no mínimo ${minLength} caracteres` 
            };
        }
        
        // Check password strength
        let strength = 'weak';
        let score = 0;
        
        if (password.length >= 8) score++;
        if (password.length >= 12) score++;
        if (/[a-z]/.test(password)) score++;
        if (/[A-Z]/.test(password)) score++;
        if (/[0-9]/.test(password)) score++;
        if (/[^a-zA-Z0-9]/.test(password)) score++;
        
        if (score >= 5) strength = 'strong';
        else if (score >= 3) strength = 'medium';
        
        return { valid: true, strength };
    }

    /**
     * Validates URL format
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid
     */
    static validateUrl(url) {
        if (!url) return false;
        
        try {
            const urlObj = new URL(url);
            return ['http:', 'https:', 'mailto:'].includes(urlObj.protocol);
        } catch {
            return false;
        }
    }

    /**
     * Validates numeric value
     * @param {any} value - Value to validate
     * @param {Object} options - Validation options
     * @returns {Object} { valid: boolean, error?: string }
     */
    static validateNumber(value, options = {}) {
        const num = Number(value);
        
        if (isNaN(num)) {
            return { valid: false, error: 'Valor deve ser numérico' };
        }
        
        if (options.min !== undefined && num < options.min) {
            return { valid: false, error: `Valor mínimo: ${options.min}` };
        }
        
        if (options.max !== undefined && num > options.max) {
            return { valid: false, error: `Valor máximo: ${options.max}` };
        }
        
        if (options.integer && !Number.isInteger(num)) {
            return { valid: false, error: 'Valor deve ser inteiro' };
        }
        
        if (options.positive && num <= 0) {
            return { valid: false, error: 'Valor deve ser positivo' };
        }
        
        return { valid: true };
    }

    /**
     * Validates client data
     * @param {Object} client - Client data to validate
     * @returns {Object} { valid: boolean, errors: Object }
     */
    static validateClient(client) {
        const errors = {};
        
        // Validate nome
        const nomeValidation = this.validateNome(client.nome);
        if (!nomeValidation.valid) {
            errors.nome = nomeValidation.error;
        }
        
        // Validate CPF
        if (!this.validateCPF(client.cpf)) {
            errors.cpf = ERROR_MESSAGES.CPF_INVALID;
        }
        
        // Validate telefone (if provided)
        if (client.telefone && !this.validateTelefone(client.telefone)) {
            errors.telefone = 'Telefone inválido';
        }
        
        return {
            valid: Object.keys(errors).length === 0,
            errors
        };
    }
}

// Export individual validators as well
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
