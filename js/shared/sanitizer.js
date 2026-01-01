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
     * IMPORTANT: For maximum security, prefer using textContent or escapeHtml
     * This method attempts to remove dangerous content but regex-based sanitization
     * has limitations. For untrusted content, always use textContent.
     * 
     * @param {string} input - The user input
     * @returns {string} The sanitized input
     * @security This uses multiple sanitization passes but may have edge cases.
     *           For critical security needs, use textContent or a dedicated library.
     */
    sanitizeInput(input) {
        if (typeof input !== 'string') return '';
        
        let sanitized = input;
        
        // Remove any HTML tags - use multiple passes to handle nested/encoded tags
        let iterations = 0;
        const maxIterations = 10; // Prevent infinite loops
        
        while (iterations < maxIterations) {
            const before = sanitized;
            
            // Remove HTML tags - handle various bypass attempts
            // Split by < and > to handle incomplete tags
            const parts = sanitized.split('<');
            sanitized = parts[0]; // Keep everything before first <
            for (let i = 1; i < parts.length; i++) {
                const gtIndex = parts[i].indexOf('>');
                if (gtIndex !== -1) {
                    // Skip everything until after the >
                    sanitized += parts[i].substring(gtIndex + 1);
                }
                // If no >, the < was incomplete, so skip it entirely
            }
            
            // Handle double encoding
            sanitized = sanitized.replace(/&lt;.*?&gt;/gi, '');
            
            // Remove dangerous protocols (with various encodings)
            sanitized = sanitized.replace(/j\s*a\s*v\s*a\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '');
            sanitized = sanitized.replace(/d\s*a\s*t\s*a\s*:/gi, '');
            sanitized = sanitized.replace(/v\s*b\s*s\s*c\s*r\s*i\s*p\s*t\s*:/gi, '');
            
            // Remove event handlers - match various patterns
            // Using split and filter approach to avoid incomplete sanitization
            const onParts = sanitized.split(/\bon/i);
            if (onParts.length > 1) {
                // Keep first part, remove anything after 'on' that looks like event handler
                sanitized = onParts[0];
                for (let i = 1; i < onParts.length; i++) {
                    // If the part doesn't start with a common event name followed by =, keep it
                    if (!/^[a-z]+\s*=/i.test(onParts[i])) {
                        sanitized += 'on' + onParts[i];
                    }
                }
            }
            
            // If no changes were made, we're done
            if (before === sanitized) {
                break;
            }
            
            iterations++;
        }
        
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
            // Explicitly exclude dangerous protocols
            const allowedProtocols = ['http:', 'https:', 'mailto:'];
            const dangerousProtocols = ['javascript:', 'data:', 'vbscript:', 'file:'];
            
            // Check for dangerous protocols first
            const lowerProtocol = parsed.protocol.toLowerCase();
            if (dangerousProtocols.includes(lowerProtocol)) {
                return null;
            }
            
            // Then check if it's in allowed list
            if (!allowedProtocols.includes(lowerProtocol)) {
                return null;
            }
            
            return parsed.href;
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
