export const Utils = {
    generateUUID() {
        return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(new RegExp('[018]', 'g'), c =>
            (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
        );
    },

    formatCPF(value) {
        value = value.replace(new RegExp('\\D', 'g'), '');
        value = value.slice(0, 11);
        value = value.replace(new RegExp('(\\d{3})(\\d)'), '$1.$2');
        value = value.replace(new RegExp('(\\d{3})\\.(\\d{3})(\\d)'), '$1.$2.$3');
        value = value.replace(new RegExp('(\\d{3})\\.(\\d{3})\\.(\\d{3})(\\d{1,2})'), '$1.$2.$3-$4');
        return value;
    },

    formatTelefone(value) {
        value = value.replace(new RegExp('\\D', 'g'), '');
        value = value.slice(0, 11);
        value = value.replace(new RegExp('^(\\d{2})(\\d)'), '($1) $2');
        value = value.replace(new RegExp('(\\d{5})(\\d)'), '$1-$2');
        return value;
    },

    validateCPF(cpfStr) {
        const cpf = String(cpfStr).replace(new RegExp('[.-]', 'g'), '');
        if (cpf.length !== 11 || new RegExp('^(\\d)\\1{10}$').test(cpf)) return false;
        let sum = 0;
        for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
        let firstDigit = 11 - (sum % 11);
        if (firstDigit >= 10) firstDigit = 0;
        if (firstDigit !== parseInt(cpf.charAt(9))) return false;
        sum = 0;
        for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
        let secondDigit = 11 - (sum % 11);
        if (secondDigit >= 10) secondDigit = 0;
        if (secondDigit !== parseInt(cpf.charAt(10))) return false;
        return true;
    },

    getLocalISOString(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        const milliseconds = String(date.getMilliseconds()).padStart(3, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.${milliseconds}`;
    },

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
    }
};
