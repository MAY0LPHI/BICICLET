/**
 * HTML Sanitization Module
 * Provides security functions to prevent XSS attacks
 */

export const Sanitizer = {
    /**
     * Escapes HTML special characters to prevent XSS
     * @param {string} str - The string to escape
     * @returns {string} The escaped string
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
     * Escapes HTML special characters and returns safe text
     * Note: This removes ALL HTML tags. For preserving safe HTML,
     * use a library like DOMPurify
     * @param {string} html - The HTML string to sanitize
     * @returns {string} The sanitized plain text
     */
    sanitizeHtml(html) {
        if (typeof html !== 'string') return '';
        
        // Remove all HTML by converting to text
        // This is more secure than trying to allow "safe" tags
        const temp = document.createElement('div');
        temp.textContent = html;
        return temp.textContent || '';
    },

    /**
     * Creates a text node safely
     * @param {string} text - The text content
     * @returns {Text} A text node
     */
    createTextNode(text) {
        return document.createTextNode(text || '');
    },

    /**
     * Safely sets text content of an element
     * @param {HTMLElement} element - The target element
     * @param {string} text - The text to set
     */
    setTextContent(element, text) {
        if (element) {
            element.textContent = text || '';
        }
    },

    /**
     * Creates a safe HTML element with text content
     * @param {string} tagName - The tag name (e.g., 'p', 'span')
     * @param {string} text - The text content
     * @param {string} className - Optional CSS class
     * @returns {HTMLElement} The created element
     */
    createElement(tagName, text = '', className = '') {
        const element = document.createElement(tagName);
        if (className) {
            element.className = className;
        }
        if (text) {
            element.textContent = text;
        }
        return element;
    },

    /**
     * Sanitizes user input for safe display
     * Removes potentially dangerous content
     * @param {string} input - The user input
     * @returns {string} The sanitized input
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        // Remove any HTML tags
        let sanitized = input.replace(/<[^>]*>/g, '');
        
        // Remove script-like patterns
        sanitized = sanitized.replace(/javascript:/gi, '');
        sanitized = sanitized.replace(/on\w+\s*=/gi, '');
        
        // Trim whitespace
        sanitized = sanitized.trim();
        
        return sanitized;
    },

    /**
     * Validates and sanitizes a URL
     * @param {string} url - The URL to validate
     * @returns {string|null} The sanitized URL or null if invalid
     */
    sanitizeUrl(url) {
        if (typeof url !== 'string') return null;
        
        try {
            const parsed = new URL(url, window.location.origin);
            
            // Only allow http, https, and mailto protocols
            if (['http:', 'https:', 'mailto:'].includes(parsed.protocol)) {
                return parsed.href;
            }
            
            return null;
        } catch (e) {
            return null;
        }
    },

    /**
     * Safely appends HTML by creating elements instead of using innerHTML
     * @param {HTMLElement} parent - The parent element
     * @param {string} html - The HTML string to parse and append
     */
    safeAppendHtml(parent, html) {
        if (!parent || typeof html !== 'string') return;
        
        const temp = document.createElement('div');
        temp.textContent = html;
        
        while (temp.firstChild) {
            parent.appendChild(temp.firstChild);
        }
    },

    /**
     * Removes all child nodes from an element safely
     * @param {HTMLElement} element - The element to clear
     */
    clearElement(element) {
        if (!element) return;
        
        while (element.firstChild) {
            element.removeChild(element.firstChild);
        }
    }
};
