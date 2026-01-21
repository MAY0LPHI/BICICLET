export const Config = {
    MAX_CAPACITY: 50,
    LONG_STAY_HOURS: 24,

    // Configurações de UI
    COLORS: {
        success: { light: 'text-green-600', bg: 'bg-green-100', darkText: 'dark:text-green-400', darkBg: 'dark:bg-green-900/30' },
        warning: { light: 'text-amber-600', bg: 'bg-amber-100', darkText: 'dark:text-amber-400', darkBg: 'dark:bg-amber-900/30' },
        danger: { light: 'text-red-600', bg: 'bg-red-100', darkText: 'dark:text-red-400', darkBg: 'dark:bg-red-900/30' }
    },

    async load() {
        // Tenta carregar do LocalStorage primeiro (fallback/cache)
        const localConfig = localStorage.getItem('bicicletario_system_config');
        if (localConfig) {
            try {
                const parsed = JSON.parse(localConfig);
                if (parsed.maxCapacity) this.MAX_CAPACITY = parsed.maxCapacity;
                if (parsed.longStayHours) this.LONG_STAY_HOURS = parsed.longStayHours;
            } catch (e) {
                console.warn('Erro ao ler config local:', e);
            }
        }

        // Tenta carregar do servidor (sobrescreve local se sucesso)
        try {
            const response = await fetch('/api/system-config');
            if (response.ok) {
                const config = await response.json();
                if (config.maxCapacity) this.MAX_CAPACITY = config.maxCapacity;
                if (config.longStayHours) this.LONG_STAY_HOURS = config.longStayHours;

                // Atualiza cache local
                localStorage.setItem('bicicletario_system_config', JSON.stringify({
                    maxCapacity: this.MAX_CAPACITY,
                    longStayHours: this.LONG_STAY_HOURS
                }));
            }
        } catch (e) {
            console.warn('Backend offline ou antigo, usando configuração local/padrão.');
        }
    },

    saveLocal(newConfig) {
        if (newConfig.maxCapacity) this.MAX_CAPACITY = newConfig.maxCapacity;
        if (newConfig.longStayHours) this.LONG_STAY_HOURS = newConfig.longStayHours;

        localStorage.setItem('bicicletario_system_config', JSON.stringify({
            maxCapacity: this.MAX_CAPACITY,
            longStayHours: this.LONG_STAY_HOURS
        }));
    }
};
