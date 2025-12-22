const fs = require('fs');
const path = require('path');

class StorageBackend {
  constructor() {
    this.basePath = path.join(__dirname, '..', 'dados', 'desktop');
    this.clientesFile = path.join(this.basePath, 'clientes.json');
    this.registrosFile = path.join(this.basePath, 'registros.json');
    this.categoriasFile = path.join(this.basePath, 'categorias.json');
    
    this.ensureDirectories();
    console.log('\x1b[36m%s\x1b[0m', '📁 [SISTEMA] Dados serão salvos em:', this.basePath);
  }

  ensureDirectories() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Pasta de dados criada:', this.basePath);
    }
    
    if (!fs.existsSync(this.clientesFile)) {
      fs.writeFileSync(this.clientesFile, '[]', 'utf8');
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Arquivo clientes.json criado');
    }
    
    if (!fs.existsSync(this.registrosFile)) {
      fs.writeFileSync(this.registrosFile, '[]', 'utf8');
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Arquivo registros.json criado');
    }

    if (!fs.existsSync(this.categoriasFile)) {
      const defaultCategories = {
        'CLIENTE': '👤',
        'LOJISTA': '🏪',
        'IFOOD': '🍽️',
        'ACADEMIA': '💪'
      };
      fs.writeFileSync(this.categoriasFile, JSON.stringify(defaultCategories, null, 2), 'utf8');
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Arquivo categorias.json criado');
    }
  }

  loadCategorias() {
    try {
      if (fs.existsSync(this.categoriasFile)) {
        const data = fs.readFileSync(this.categoriasFile, 'utf8');
        return JSON.parse(data);
      }
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao carregar categorias:', error);
    }
    return null;
  }

  saveCategorias(categorias) {
    try {
      fs.writeFileSync(this.categoriasFile, JSON.stringify(categorias, null, 2), 'utf8');
      console.log('\x1b[32m%s\x1b[0m', '💾 [DADOS] Categorias salvas com sucesso');
      return { success: true };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao salvar categorias:', error);
      return { success: false, error: error.message };
    }
  }

  loadAllClients() {
    try {
      const data = fs.readFileSync(this.clientesFile, 'utf8');
      const clients = JSON.parse(data);
      console.log('\x1b[34m%s\x1b[0m', `📋 [DADOS] ${clients.length} cliente(s) carregado(s)`);
      return clients;
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao carregar clientes:', error);
      return [];
    }
  }

  saveAllClients(clients) {
    try {
      fs.writeFileSync(this.clientesFile, JSON.stringify(clients, null, 2), 'utf8');
      console.log('\x1b[32m%s\x1b[0m', `💾 [DADOS] ${clients.length} cliente(s) salvo(s) com sucesso`);
      return { success: true };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao salvar clientes:', error);
      return { success: false, error: error.message };
    }
  }

  loadAllRegistros() {
    try {
      const data = fs.readFileSync(this.registrosFile, 'utf8');
      const registros = JSON.parse(data);
      console.log('\x1b[34m%s\x1b[0m', `📋 [DADOS] ${registros.length} registro(s) carregado(s)`);
      return registros;
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao carregar registros:', error);
      return [];
    }
  }

  saveAllRegistros(registros) {
    try {
      fs.writeFileSync(this.registrosFile, JSON.stringify(registros, null, 2), 'utf8');
      console.log('\x1b[32m%s\x1b[0m', `💾 [DADOS] ${registros.length} registro(s) salvo(s) com sucesso`);
      return { success: true };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao salvar registros:', error);
      return { success: false, error: error.message };
    }
  }

  getStoragePath() {
    return this.basePath;
  }
}

module.exports = StorageBackend;
