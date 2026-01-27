const fs = require('fs');
const path = require('path');

class StorageBackend {
  constructor() {
    this.basePath = path.join(__dirname, '..', 'dados', 'desktop');
    this.backupsPath = path.join(__dirname, '..', 'dados', 'database', 'backups');
    this.clientesFile = path.join(this.basePath, 'clientes.json');
    this.registrosFile = path.join(this.basePath, 'registros.json');
    this.categoriasFile = path.join(this.basePath, 'categorias.json');
    this.backupSettingsFile = path.join(this.basePath, 'backup-settings.json');
    this.imagesDir = path.join(this.basePath, 'imagens');

    this.ensureDirectories();
    console.log('\x1b[36m%s\x1b[0m', '📁 [SISTEMA] Dados serão salvos em:', this.basePath);
  }

  ensureDirectories() {
    // Ensure data directories exist
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Pasta de dados criada:', this.basePath);
    }

    if (!fs.existsSync(this.imagesDir)) {
      fs.mkdirSync(this.imagesDir, { recursive: true });
      console.log('\x1b[32m%s\x1b[0m', '✅ [SISTEMA] Pasta de imagens criada:', this.imagesDir);
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

  // ... (existing helper methods) ...

  saveImage(base64Data) {
    try {
      if (!base64Data) return { success: false, error: 'Sem dados' };

      // Remove header if present
      let cleanBase64 = base64Data;
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1];
      }

      const buffer = Buffer.from(cleanBase64, 'base64');
      const timestamp = Date.now();
      const filename = `img_${timestamp}_${Math.random().toString(36).substr(2, 9)}.jpg`;
      const filepath = path.join(this.imagesDir, filename);

      fs.writeFileSync(filepath, buffer);
      console.log('\x1b[32m%s\x1b[0m', `💾 [IMAGEM] Imagem salva: ${filename}`);

      // Return proper URL for Electron
      // Using file:// protocol for absolute path
      return { success: true, url: filename, fullPath: filepath };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao salvar imagem:', error);
      return { success: false, error: error.message };
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

  // Helper method to validate backup structure
  validateBackupStructure(backup) {
    if (!backup || !backup.data) {
      return { valid: false, error: 'Formato de backup inválido - estrutura ausente' };
    }

    if (!Array.isArray(backup.data.clients)) {
      return { valid: false, error: 'Formato de backup inválido - dados de clientes inválidos' };
    }

    if (!Array.isArray(backup.data.registros)) {
      return { valid: false, error: 'Formato de backup inválido - dados de registros inválidos' };
    }

    return { valid: true };
  }

  // Helper method to check if categorias is valid
  isCategoriesValid(categorias) {
    return categorias && typeof categorias === 'object' && !Array.isArray(categorias);
  }

  // Helper method to safely parse JSON data
  parseJSON(data, errorMessage) {
    try {
      return { success: true, data: JSON.parse(data) };
    } catch (error) {
      return { success: false, error: errorMessage || 'Erro ao parsear JSON' };
    }
  }

  createBackup() {
    try {
      // Generate backup filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
      const filename = `backup_${timestamp}.json`;
      const backupPath = path.join(this.backupsPath, filename);

      // Load all data
      const clients = this.loadAllClients();
      const registros = this.loadAllRegistros();
      const categorias = this.loadCategorias();

      // Create backup object
      const backup = {
        version: '1.0',
        created_at: now.toISOString(),
        data: {
          clients: clients,
          registros: registros,
          categorias: categorias
        }
      };

      // Save backup file
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');
      console.log('\x1b[32m%s\x1b[0m', `✅ [BACKUP] Backup criado: ${filename}`);

      return { success: true, filename: filename };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao criar backup:', error);
      return { success: false, error: error.message };
    }
  }

  restoreBackup(filename) {
    try {
      const backupPath = path.join(this.backupsPath, filename);

      if (!fs.existsSync(backupPath)) {
        throw new Error('Arquivo de backup não encontrado');
      }

      // Read and parse backup file
      const data = fs.readFileSync(backupPath, 'utf8');
      const parseResult = this.parseJSON(data, 'Arquivo de backup corrompido ou inválido');

      if (!parseResult.success) {
        throw new Error(parseResult.error);
      }

      const backup = parseResult.data;

      // Validate backup structure
      const validation = this.validateBackupStructure(backup);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Restore data
      this.saveAllClients(backup.data.clients);
      this.saveAllRegistros(backup.data.registros);

      if (this.isCategoriesValid(backup.data.categorias)) {
        this.saveCategorias(backup.data.categorias);
      }

      console.log('\x1b[32m%s\x1b[0m', `✅ [BACKUP] Backup restaurado: ${filename}`);

      return {
        success: true,
        stats: {
          clients: backup.data.clients.length,
          registros: backup.data.registros.length,
          categorias: this.isCategoriesValid(backup.data.categorias) ? Object.keys(backup.data.categorias).length : 0
        }
      };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao restaurar backup:', error);
      return { success: false, error: error.message };
    }
  }

  downloadBackup(filename) {
    try {
      const backupPath = path.join(this.backupsPath, filename);

      if (!fs.existsSync(backupPath)) {
        throw new Error('Arquivo de backup não encontrado');
      }

      // Read backup file and return its contents
      const data = fs.readFileSync(backupPath, 'utf8');

      console.log('\x1b[34m%s\x1b[0m', `📥 [BACKUP] Backup lido para download: ${filename}`);

      return {
        success: true,
        data: data,
        filename: filename
      };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao ler backup:', error);
      return { success: false, error: error.message };
    }
  }

  deleteBackup(filename) {
    try {
      const backupPath = path.join(this.backupsPath, filename);

      if (!fs.existsSync(backupPath)) {
        throw new Error('Arquivo de backup não encontrado');
      }

      // Delete backup file
      fs.unlinkSync(backupPath);
      console.log('\x1b[32m%s\x1b[0m', `🗑️ [BACKUP] Backup excluído: ${filename}`);

      return { success: true };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao excluir backup:', error);
      return { success: false, error: error.message };
    }
  }

  importBackup(backupData) {
    try {
      // Parse backup data if it's a string
      let backup;
      if (typeof backupData === 'string') {
        const parseResult = this.parseJSON(backupData, 'Dados de backup corrompidos ou inválidos');
        if (!parseResult.success) {
          throw new Error(parseResult.error);
        }
        backup = parseResult.data;
      } else {
        backup = backupData;
      }

      // Validate backup structure
      const validation = this.validateBackupStructure(backup);
      if (!validation.valid) {
        throw new Error(validation.error);
      }

      // Generate filename with timestamp
      const now = new Date();
      const timestamp = now.toISOString().replace(/:/g, '-').replace(/\..+/, '').replace('T', '_');
      const filename = `backup_imported_${timestamp}.json`;
      const backupPath = path.join(this.backupsPath, filename);

      // Save backup file
      fs.writeFileSync(backupPath, JSON.stringify(backup, null, 2), 'utf8');

      console.log('\x1b[32m%s\x1b[0m', `✅ [BACKUP] Backup importado e salvo: ${filename}`);

      return { success: true, filename: filename };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao importar backup:', error);
      return { success: false, error: error.message };
    }
  }

  loadBackupSettings() {
    try {
      const settingsFile = this.backupSettingsFile;

      if (fs.existsSync(settingsFile)) {
        const data = fs.readFileSync(settingsFile, 'utf8');
        const parseResult = this.parseJSON(data, 'Arquivo de configurações corrompido');

        if (parseResult.success) {
          return parseResult.data;
        } else {
          console.warn('\x1b[33m%s\x1b[0m', '⚠️ [AVISO] Arquivo de configurações corrompido, usando padrões');
          // Fall through to return defaults
        }
      }

      // Return default settings
      return {
        enabled: false,
        interval: 'daily',
        max_backups: 10
      };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao carregar configurações de backup:', error);
      return {
        enabled: false,
        interval: 'daily',
        max_backups: 10
      };
    }
  }

  saveBackupSettings(settings) {
    try {
      const settingsFile = this.backupSettingsFile;
      fs.writeFileSync(settingsFile, JSON.stringify(settings, null, 2), 'utf8');
      console.log('\x1b[32m%s\x1b[0m', '💾 [BACKUP] Configurações de backup salvas');
      return { success: true };
    } catch (error) {
      console.error('\x1b[31m%s\x1b[0m', '❌ [ERRO] Falha ao salvar configurações de backup:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = StorageBackend;
