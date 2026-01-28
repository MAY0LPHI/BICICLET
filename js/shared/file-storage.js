/**
 * Cliente para a API de armazenamento em arquivos
 * Permite salvar dados em arquivos locais mesmo na versão web
 * API integrada no servidor principal (porta 5000)
 */

const API_URL = '/api';

export class FileStorage {
    static async isAvailable() {
        try {
            const response = await fetch(`${API_URL}/health`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Clientes
    static async saveClient(client) {
        const response = await fetch(`${API_URL}/client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        return await response.json();
    }

    static async loadClient(cpf) {
        const cpfClean = cpf.replace(/\D/g, '');
        const response = await fetch(`${API_URL}/client/${cpfClean}`);
        if (response.ok) {
            return await response.json();
        }
        return null;
    }

    static async loadAllClients() {
        const response = await fetch(`${API_URL}/clients`);
        return await response.json();
    }

    static async deleteClient(cpf) {
        const cpfClean = cpf.replace(/\D/g, '');
        const response = await fetch(`${API_URL}/client/${cpfClean}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    // Registros
    static async saveRegistro(registro) {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        return await response.json();
    }

    static async loadAllRegistros() {
        const response = await fetch(`${API_URL}/registros`);
        return await response.json();
    }

    static async deleteRegistro(registroId) {
        const response = await fetch(`${API_URL}/registro/${registroId}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    // Categorias
    static async saveCategorias(categorias) {
        const response = await fetch(`${API_URL}/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categorias)
        });
        return await response.json();
    }

    static async loadCategorias() {
        const response = await fetch(`${API_URL}/categorias`);
        if (response.ok) {
            return await response.json();
        }
        return {};
    }

    // Imagens
    static async uploadImage(base64Data) {
        try {
            const response = await fetch(`${API_URL}/upload-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data })
            });
            return await response.json();
        } catch (error) {
            console.error("Erro no upload de imagem:", error);
            return { success: false, error: error.message };
        }
    }
}
