const fs = require('fs');
const path = require('path');

class StorageBackend {
  constructor() {
    this.basePath = path.join(__dirname, '..', 'dados', 'desktop');
    this.backupsPath = path.join(__dirname, '..', 'dados', 'database', 'backups');
    this.clientesFile = path.join(this.basePath, 'clientes.json');
    this.registrosFile = path.join(this.basePath, 'registros.json');
    this.categoriasFile = path.join(this.basePath, 'categorias.json');
    
    this.ensureDirectories();
    console.log('\x1b[36m%s\x1b[0m', '📁 [SISTEMA] Dados serão salvos em:', this.basePath);
  }

  ensureDirectories() {
    // Ensure data directories exist
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Pasta de dados criada:', this.basePath);
    }
    
    // Ensure backups directory exists
    if (!fs.existsSync(this.backupsPath)) {
      fs.mkdirSync(this.backupsPath, { recursive: true });
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Pasta de backups criada:', this.backupsPath);
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

  listBackups() {
    try {
      if (!fs.existsSync(this.backupsPath)) {
        console.log('\x1b[33m%s\x1b[0m', '⚠️ [SISTEMA] Pasta de backups não existe:', this.backupsPath);
        return [];
      }

      const files = fs.readdirSync(this.backupsPath);
      const backups = files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filepath = path.join(this.backupsPath, file);
          const stats = fs.statSync(filepath);
          return {
            filename: file,
            name: file,
            created_at: stats.mtime.toISOString(),
            timestamp: stats.mtime.toISOString(),
            size: stats.size,
            size_formatted: this.formatBytes(stats.size)
          };
        })
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      console.log('\x1b[34m%s\x1b[0m', `📋 [SISTEMA] ${backups.length} backup(s) encontrado(s)`);
      return backups;
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao listar backups:', error);
      return [];
    }
  }

  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    if (bytes < 0 || typeof bytes !== 'number') return 'N/A';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), sizes.length - 1);
    
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}

module.exports = StorageBackend;
