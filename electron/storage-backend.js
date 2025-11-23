const fs = require('fs');
const path = require('path');

class StorageBackend {
  constructor() {
    this.basePath = path.join(__dirname, '..', 'dados', 'desktop');
    this.clientesFile = path.join(this.basePath, 'clientes.json');
    this.registrosFile = path.join(this.basePath, 'registros.json');
    
    this.ensureDirectories();
    console.log('📁 Dados serão salvos em:', this.basePath);
  }

  ensureDirectories() {
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log('✅ Pasta de dados criada:', this.basePath);
    }
    
    if (!fs.existsSync(this.clientesFile)) {
      fs.writeFileSync(this.clientesFile, '[]', 'utf8');
      console.log('✅ Arquivo clientes.json criado');
    }
    
    if (!fs.existsSync(this.registrosFile)) {
      fs.writeFileSync(this.registrosFile, '[]', 'utf8');
      console.log('✅ Arquivo registros.json criado');
    }
  }

  loadAllClients() {
    try {
      const data = fs.readFileSync(this.clientesFile, 'utf8');
      const clients = JSON.parse(data);
      console.log(`📋 ${clients.length} cliente(s) carregado(s)`);
      return clients;
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      return [];
    }
  }

  saveAllClients(clients) {
    try {
      fs.writeFileSync(this.clientesFile, JSON.stringify(clients, null, 2), 'utf8');
      console.log(`✅ ${clients.length} cliente(s) salvo(s)`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar clientes:', error);
      return { success: false, error: error.message };
    }
  }

  loadAllRegistros() {
    try {
      const data = fs.readFileSync(this.registrosFile, 'utf8');
      const registros = JSON.parse(data);
      console.log(`📋 ${registros.length} registro(s) carregado(s)`);
      return registros;
    } catch (error) {
      console.error('❌ Erro ao carregar registros:', error);
      return [];
    }
  }

  saveAllRegistros(registros) {
    try {
      fs.writeFileSync(this.registrosFile, JSON.stringify(registros, null, 2), 'utf8');
      console.log(`✅ ${registros.length} registro(s) salvo(s)`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar registros:', error);
      return { success: false, error: error.message };
    }
  }

  getStoragePath() {
    return this.basePath;
  }
}

module.exports = StorageBackend;
