/**
 * Cliente para a API de armazenamento em arquivos
 * Permite salvar dados em arquivos locais mesmo na versão web
 */

const API_URL = 'http://localhost:5001/api';

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
}
