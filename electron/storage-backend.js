const fs = require('fs');
const path = require('path');

class StorageBackend {
  constructor() {
    this.basePath = path.join(__dirname, '..', 'dados', 'desktop');
    // Subpastas para organizar melhor
    this.clientesDir = path.join(this.basePath, 'clientes');
    this.registrosDir = path.join(this.basePath, 'registros');
    // Arquivos principais na pasta raiz (controle do sistema)
    this.usuariosFile = path.join(this.basePath, 'usuarios.json');
    this.auditFile = path.join(this.basePath, 'auditoria.json');
    this.categoriasFile = path.join(this.basePath, 'categorias.json');
    
    this.ensureDirectories();
    console.log('📁 Dados serão salvos em:', this.basePath);
  }

  ensureDirectories() {
    // Cria pasta principal
    if (!fs.existsSync(this.basePath)) {
      fs.mkdirSync(this.basePath, { recursive: true });
      console.log('✅ Pasta de dados criada:', this.basePath);
    }
    
    // Cria subpastas para dados dos clientes e registros
    const dirs = [
      { path: this.clientesDir, name: 'clientes' },
      { path: this.registrosDir, name: 'registros' }
    ];
    
    dirs.forEach(({ path: dirPath, name }) => {
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`✅ Pasta ${name} criada`);
      }
    });
    
    // Cria arquivos de controle na pasta principal
    const files = [
      { file: this.usuariosFile, name: 'usuarios.json' },
      { file: this.auditFile, name: 'auditoria.json' },
      { file: this.categoriasFile, name: 'categorias.json' }
    ];
    
    files.forEach(({ file, name }) => {
      if (!fs.existsSync(file)) {
        fs.writeFileSync(file, '[]', 'utf8');
        console.log(`✅ Arquivo ${name} criado`);
      }
    });
  }

  loadAllClients() {
    try {
      const clients = [];
      if (fs.existsSync(this.clientesDir)) {
        const files = fs.readdirSync(this.clientesDir);
        files.forEach(filename => {
          if (filename.endsWith('.json')) {
            const filepath = path.join(this.clientesDir, filename);
            const data = fs.readFileSync(filepath, 'utf8');
            clients.push(JSON.parse(data));
          }
        });
      }
      console.log(`📋 ${clients.length} cliente(s) carregado(s) da pasta ${this.clientesDir}`);
      return clients;
    } catch (error) {
      console.error('❌ Erro ao carregar clientes:', error);
      return [];
    }
  }

  saveAllClients(clients) {
    try {
      // Salva cada cliente em um arquivo separado (por CPF)
      clients.forEach(client => {
        const cpfClean = client.cpf ? client.cpf.replace(/\D/g, '') : 'sem-cpf';
        const filepath = path.join(this.clientesDir, `${cpfClean}.json`);
        fs.writeFileSync(filepath, JSON.stringify(client, null, 2), 'utf8');
      });
      console.log(`✅ ${clients.length} cliente(s) salvo(s) em ${this.clientesDir}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar clientes:', error);
      return { success: false, error: error.message };
    }
  }

  loadAllRegistros() {
    try {
      const registros = [];
      if (fs.existsSync(this.registrosDir)) {
        const files = fs.readdirSync(this.registrosDir);
        files.forEach(filename => {
          if (filename.endsWith('.json')) {
            const filepath = path.join(this.registrosDir, filename);
            const data = fs.readFileSync(filepath, 'utf8');
            registros.push(JSON.parse(data));
          }
        });
      }
      console.log(`📋 ${registros.length} registro(s) carregado(s) da pasta ${this.registrosDir}`);
      return registros;
    } catch (error) {
      console.error('❌ Erro ao carregar registros:', error);
      return [];
    }
  }

  saveAllRegistros(registros) {
    try {
      // Salva cada registro em um arquivo separado (por ID ou timestamp)
      registros.forEach(registro => {
        const id = registro.id || `registro-${Date.now()}`;
        const filepath = path.join(this.registrosDir, `${id}.json`);
        fs.writeFileSync(filepath, JSON.stringify(registro, null, 2), 'utf8');
      });
      console.log(`✅ ${registros.length} registro(s) salvo(s) em ${this.registrosDir}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar registros:', error);
      return { success: false, error: error.message };
    }
  }

  loadAllUsers() {
    try {
      const data = fs.readFileSync(this.usuariosFile, 'utf8');
      const users = JSON.parse(data);
      return users;
    } catch (error) {
      console.error('❌ Erro ao carregar usuários:', error);
      return [];
    }
  }

  saveAllUsers(users) {
    try {
      fs.writeFileSync(this.usuariosFile, JSON.stringify(users, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      console.error('❌ Erro ao salvar usuários:', error);
      return { success: false, error: error.message };
    }
  }

  loadAuditLog() {
    try {
      const data = fs.readFileSync(this.auditFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return [];
    }
  }

  saveAuditLog(entries) {
    try {
      fs.writeFileSync(this.auditFile, JSON.stringify(entries, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  loadCategorias() {
    try {
      const data = fs.readFileSync(this.categoriasFile, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      return {};
    }
  }

  saveCategorias(categorias) {
    try {
      fs.writeFileSync(this.categoriasFile, JSON.stringify(categorias, null, 2), 'utf8');
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  getStoragePath() {
    return this.basePath;
  }
}

module.exports = StorageBackend;
