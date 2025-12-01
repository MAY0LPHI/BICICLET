/**
 * Platform Detection Module
 * Detects the current running platform: Web, Electron, or Capacitor/Android
 */

(function() {
    'use strict';

    /**
     * Detect if running in Electron environment
     * @returns {boolean}
     */
    function isElectron() {
        // Check for Electron-specific APIs
        if (typeof window !== 'undefined' && typeof window.process === 'object' && window.process.type === 'renderer') {
            return true;
        }
        
        // Check for Node.js integration
        if (typeof process !== 'undefined' && typeof process.versions === 'object' && !!process.versions.electron) {
            return true;
        }
        
        // Check for Electron user agent
        if (typeof navigator === 'object' && typeof navigator.userAgent === 'string' && navigator.userAgent.indexOf('Electron') >= 0) {
            return true;
        }
        
        // Check for electronAPI exposed via preload
        if (typeof window !== 'undefined' && window.electronAPI) {
            return true;
        }
        
        return false;
    }

    /**
     * Detect if running in Capacitor/Native environment
     * @returns {boolean}
     */
    function isCapacitor() {
        if (typeof window !== 'undefined') {
            // Check for Capacitor global object
            if (window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform()) {
                return true;
            }
            
            // Check for Capacitor Plugins
            if (window.Capacitor && window.Capacitor.Plugins) {
                return true;
            }
        }
        return false;
    }

    /**
     * Detect if running on Android
     * @returns {boolean}
     */
    function isAndroid() {
        if (isCapacitor() && typeof window !== 'undefined' && window.Capacitor) {
            return window.Capacitor.getPlatform() === 'android';
        }
        return false;
    }

    /**
     * Detect if running on iOS
     * @returns {boolean}
     */
    function isIOS() {
        if (isCapacitor() && typeof window !== 'undefined' && window.Capacitor) {
            return window.Capacitor.getPlatform() === 'ios';
        }
        return false;
    }

    /**
     * Detect if running as a PWA (installed)
     * @returns {boolean}
     */
    function isPWA() {
        if (typeof window !== 'undefined') {
            // Check display-mode media query
            if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
                return true;
            }
            
            // Check iOS standalone mode
            if (window.navigator && window.navigator.standalone === true) {
                return true;
            }
        }
        return false;
    }

    /**
     * Get the current platform name
     * @returns {string} 'electron' | 'android' | 'ios' | 'pwa' | 'web'
     */
    function getPlatform() {
        if (isElectron()) {
            return 'electron';
        }
        if (isAndroid()) {
            return 'android';
        }
        if (isIOS()) {
            return 'ios';
        }
        if (isPWA()) {
            return 'pwa';
        }
        return 'web';
    }

    /**
     * Check if running on mobile platform (Capacitor)
     * @returns {boolean}
     */
    function isMobile() {
        return isAndroid() || isIOS();
    }

    /**
     * Check if running on desktop platform (Electron)
     * @returns {boolean}
     */
    function isDesktop() {
        return isElectron();
    }

    /**
     * Get storage strategy based on platform
     * @returns {string} 'file' | 'capacitor' | 'localStorage'
     */
    function getStorageStrategy() {
        if (isElectron()) {
            return 'file';
        }
        if (isCapacitor()) {
            return 'capacitor';
        }
        return 'localStorage';
    }

    // Create the platform object
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
        
        // Current platform info
        current: getPlatform(),
        storageStrategy: getStorageStrategy()
    };

    // Expose to global window object
    if (typeof window !== 'undefined') {
        window.APP_PLATFORM = platform.current;
        window.AppPlatform = platform;
    }

    // Export for module systems
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = platform;
    }

    // Log platform info on load
    console.log('[Platform] Detected platform:', platform.current);
    console.log('[Platform] Storage strategy:', platform.storageStrategy);
})();
