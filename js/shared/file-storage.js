/**
 * ============================================================
 *  ARQUIVO: file-storage.js
 *  DESCRIÇÃO: Cliente HTTP para a API de armazenamento em arquivos
 *
 *  FUNÇÃO: Fornece uma interface JavaScript para comunicar com
 *          o servidor Python (Flask) e salvar/carregar dados
 *          persistidos em arquivos no servidor.
 *          Funciona como uma camada de abstração: o restante do
 *          sistema não precisa saber detalhes do HTTP — só chama
 *          FileStorage.saveClient(), por exemplo.
 *
 *  DIFERENÇA DO LocalStorage:
 *  - LocalStorage: dados ficam apenas no navegador (perdem-se ao trocar de computador).
 *  - FileStorage: dados são enviados ao servidor e ficam salvos em arquivos permanentes.
 *
 *  PRÉ-REQUISITO:
 *  - O servidor Python deve estar rodando em http://localhost:5001 (ou porta configurada).
 *  - Verifique com FileStorage.isAvailable() se o servidor está acessível.
 *
 *  PARA INICIANTES:
 *  - Importe com: import { FileStorage } from './shared/file-storage.js';
 *  - Todos os métodos são static (não precisa instanciar): FileStorage.loadAllClients()
 *  - Todos os métodos retornam Promises — use await ou .then()
 * ============================================================
 */

/** URL base da API do servidor. O '/' é relativo ao host atual (sem hardcode de porta). */
const API_URL = '/api';

export class FileStorage {

    /**
     * Verifica se o servidor (API) está online e acessível.
     * Útil para checar antes de tentar salvar ou carregar dados,
     * e decidir se deve usar o cache local (LocalStorage) como fallback.
     *
     * Exemplo:
     *   if (await FileStorage.isAvailable()) { ... }
     *
     * @returns {Promise<boolean>} true se o servidor está online, false se offline
     */
    static async isAvailable() {
        try {
            const response = await fetch(`${API_URL}/health`);
            return response.ok; // ok = status HTTP 200-299
        } catch (error) {
            return false; // Erro de rede = servidor inacessível
        }
    }

    // ─────────────────────────────────────────────────────────
    // Clientes
    // ─────────────────────────────────────────────────────────

    /**
     * Salva ou atualiza um único cliente no servidor.
     * O servidor identifica o cliente pelo CPF e cria ou sobrescreve.
     *
     * @param {Object} client - Objeto com os dados do cliente
     * @returns {Promise<Object>} Resposta do servidor em JSON
     */
    static async saveClient(client) {
        const response = await fetch(`${API_URL}/client`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(client)
        });
        return await response.json();
    }

    /**
     * Salva (substitui) a lista completa de clientes no servidor.
     * Atenção: isso SOBRESCREVE todos os clientes existentes no servidor!
     * Use apenas para sincronizar o estado completo.
     *
     * @param {Array} clients - Array com todos os objetos de clientes
     * @returns {Promise<Object>} Resposta do servidor em JSON
     */
    static async saveAllClients(clients) {
        const response = await fetch(`${API_URL}/clients`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clients)
        });
        return await response.json();
    }

    /**
     * Busca um único cliente no servidor pelo CPF.
     *
     * @param {string} cpf - CPF do cliente (com ou sem formatação)
     * @returns {Promise<Object|null>} Dados do cliente ou null se não encontrado
     */
    static async loadClient(cpf) {
        const cpfClean = cpf.replace(/\D/g, ''); // Remove pontos e traço: '123.456.789-01' => '12345678901'
        const response = await fetch(`${API_URL}/client/${cpfClean}`);
        if (response.ok) {
            return await response.json();
        }
        return null; // Retorna null se cliente não encontrado (status 404)
    }

    /**
     * Busca e retorna todos os clientes cadastrados no servidor.
     *
     * @returns {Promise<Array>} Array com todos os clientes
     */
    static async loadAllClients() {
        const response = await fetch(`${API_URL}/clients`);
        return await response.json();
    }

    /**
     * Remove um cliente do servidor pelo CPF.
     *
     * @param {string} cpf - CPF do cliente a excluir (com ou sem formatação)
     * @returns {Promise<Object>} Resposta do servidor confirmando a exclusão
     */
    static async deleteClient(cpf) {
        const cpfClean = cpf.replace(/\D/g, '');
        const response = await fetch(`${API_URL}/client/${cpfClean}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    // ─────────────────────────────────────────────────────────
    // Registros de Entrada/Saída
    // ─────────────────────────────────────────────────────────

    /**
     * Salva um registro de entrada ou saída no servidor.
     * Cada registro representa uma bicicleta entrando ou saindo do bicicletário.
     *
     * @param {Object} registro - Objeto com os dados do registro (cliente, data, tipo, etc.)
     * @returns {Promise<Object>} Resposta do servidor em JSON
     */
    static async saveRegistro(registro) {
        const response = await fetch(`${API_URL}/registro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(registro)
        });
        return await response.json();
    }

    /**
     * Retorna todos os registros de entrada/saída do servidor.
     *
     * @returns {Promise<Array>} Array com todos os registros
     */
    static async loadAllRegistros() {
        const response = await fetch(`${API_URL}/registros`);
        return await response.json();
    }

    /**
     * Remove um registro específico do servidor pelo ID.
     *
     * @param {string} registroId - ID único do registro (UUID)
     * @returns {Promise<Object>} Resposta do servidor confirmando a exclusão
     */
    static async deleteRegistro(registroId) {
        const response = await fetch(`${API_URL}/registro/${registroId}`, {
            method: 'DELETE'
        });
        return await response.json();
    }

    // ─────────────────────────────────────────────────────────
    // Categorias de Clientes
    // ─────────────────────────────────────────────────────────

    /**
     * Salva o mapa de categorias no servidor.
     * O objeto de categorias contém os nomes e emojis de cada categoria.
     *
     * Exemplo de formato: { 'Aluno': '🎓', 'Professor': '👨‍🏫' }
     *
     * @param {Object} categorias - Objeto com nome => emoji das categorias
     * @returns {Promise<Object>} Resposta do servidor em JSON
     */
    static async saveCategorias(categorias) {
        const response = await fetch(`${API_URL}/categorias`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(categorias)
        });
        return await response.json();
    }

    /**
     * Carrega as categorias salvas no servidor.
     * Se o servidor não responder corretamente, retorna um objeto vazio.
     *
     * @returns {Promise<Object>} Mapa de categorias ou {} se vazio/indisponível
     */
    static async loadCategorias() {
        const response = await fetch(`${API_URL}/categorias`);
        if (response.ok) {
            return await response.json();
        }
        return {}; // Retorna vazio se o servidor não tiver categorias salvas
    }

    // ─────────────────────────────────────────────────────────
    // Upload de Imagens (fotos de clientes)
    // ─────────────────────────────────────────────────────────

    /**
     * Envia uma imagem em formato Base64 para o servidor.
     * O servidor salva a imagem em arquivo e retorna o caminho/URL para acesso.
     *
     * Formato Base64: a imagem é convertida para texto (string longa que começa com "data:image/...")
     * antes de ser enviada. O módulo photo-handler.js faz essa conversão.
     *
     * @param {string} base64Data - Imagem codificada em Base64
     * @returns {Promise<Object>} Objeto com { success: true, path: 'caminho/da/imagem' }
     *                            ou { success: false, error: 'mensagem de erro' }
     */
    static async uploadImage(base64Data) {
        try {
            const response = await fetch(`${API_URL}/upload-image`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ image: base64Data })
            });
            return await response.json();
        } catch (error) {
            console.error('Erro no upload de imagem:', error);
            return { success: false, error: error.message };
        }
    }
}
