# 🚲 Sistema de Gerenciamento de Bicicletário

**Sistema completo para gestão de estacionamento de bicicletas** | Versão 3.0

[![Replit](https://img.shields.io/badge/Executar-Replit-blue)](https://replit.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

---

## 📋 Sobre o Projeto

Sistema web profissional para gerenciamento de bicicletários, desenvolvido para **BICICLETARIO SHOP. BOULEVARD V.V.**, com funcionalidades completas de cadastro, controle de acesso, auditoria e relatórios.

### ✨ Principais Funcionalidades

- ✅ **Gerenciamento de Clientes** - Cadastro completo com validação de CPF e categorização
- ✅ **Controle de Bicicletas** - Registro detalhado com múltiplas bikes por cliente
- ✅ **Registros de Entrada/Saída** - Sistema de controle de acesso com histórico
- ✅ **Sistema de Permissões** - Perfis hierárquicos (Dono, Admin, Funcionário)
- ✅ **Auditoria Completa** - Rastreamento de todas as ações do sistema
- ✅ **Exportação/Importação** - Backup completo em CSV/Excel
- ✅ **Tema Claro/Escuro** - Interface responsiva e moderna
- ✅ **Categorias Personalizadas** - Organize clientes por tipo de serviço
- ✅ **Sistema de Pernoite** - Controle especial para bikes que ficam durante a noite

---

## 🚀 Início Rápido

### Executando no Replit

1. **Clone ou importe o projeto** no Replit
2. **Clique em "Run"** - o servidor inicia automaticamente
3. **Acesse a aplicação** através do webview do Replit
4. **Faça login** com as credenciais padrão:
   - 👤 **Admin**: `admin` / `admin123`
   - 👑 **Dono**: `CELO123` / `CELO123`

### Executando Localmente

#### Opção 1: Servidor Web Python (Recomendado)

```bash
# Inicie o servidor (porta 5000)
python3 server.py
```

Acesse: `http://localhost:5000`

#### Opção 2: Scripts de Inicialização

```bash
# Windows
scripts/INICIAR-NAVEGADOR.bat

# Linux/Mac
bash scripts/INICIAR-NAVEGADOR.sh
```

#### Opção 3: Aplicação Desktop (Electron)

```bash
# Instalar dependências
npm install

# Executar versão desktop
npm start

# Compilar executável Windows
npm run build
```

---

## 📁 Estrutura do Projeto

```
bicicletario/
├── 📂 js/                          # Código JavaScript modular
│   ├── cadastros/                  # Módulos de cadastro
│   ├── registros/                  # Controle de entrada/saída
│   ├── usuarios/                   # Gerenciamento de usuários
│   ├── configuracao/               # Configurações do sistema
│   └── shared/                     # Utilitários compartilhados
├── 📂 docs/                        # Documentação completa
│   └── legacy/                     # Documentação antiga (movida)
├── 📂 scripts/                     # Scripts de inicialização
├── 📂 electron/                    # Aplicação desktop
├── 📂 libs/                        # Bibliotecas externas
├── 📄 index.html                   # Página principal
├── 📄 server.py                    # Servidor web Python
├── 📄 storage_api.py               # API de armazenamento
├── 📄 package.json                 # Configuração Node/Electron
└── 📄 replit.md                    # Documentação técnica do Replit
```

---

## 📚 Documentação Completa

### 🎯 Começar por Aqui

- **[README-PRINCIPAL.md](docs/README-PRINCIPAL.md)** - Guia completo de uso
- **[MUDANCAS-SISTEMA-PERMISSOES.md](docs/MUDANCAS-SISTEMA-PERMISSOES.md)** - Sistema de permissões
- **[INSTRUCOES-USO.md](docs/INSTRUCOES-USO.md)** - Instruções detalhadas

### 🔧 Documentação Técnica

- **[replit.md](replit.md)** - Arquitetura e configuração Replit
- **[ESTRUTURA.md](docs/ESTRUTURA.md)** - Organização modular do código
- **[SISTEMA-ARQUIVOS.md](docs/SISTEMA-ARQUIVOS.md)** - Estrutura de armazenamento

### 🎨 Funcionalidades

- **[DROPDOWN-ACOES.md](docs/DROPDOWN-ACOES.md)** - Sistema de ações em registros
- **[FUNCIONALIDADE-PERNOITE.md](docs/FUNCIONALIDADE-PERNOITE.md)** - Sistema de pernoite
- **[EXPORTACAO-IMPORTACAO-DADOS.md](docs/EXPORTACAO-IMPORTACAO-DADOS.md)** - Backup de dados
- **[ORGANIZACAO.md](docs/ORGANIZACAO.md)** - Reorganização da interface

### 💻 Versão Desktop

- **[DESKTOP-APP.md](docs/DESKTOP-APP.md)** - Aplicação Electron
- **[BUILD-WINDOWS.md](docs/BUILD-WINDOWS.md)** - Compilar para Windows
- **[DESKTOP-TROUBLESHOOTING.md](docs/DESKTOP-TROUBLESHOOTING.md)** - Soluções de problemas

### 🗄️ Armazenamento de Dados

O sistema possui **duas estratégias de armazenamento**:

1. **Versão Web (Replit)**:
   - Armazena em `dados/navegador/` (via API Python)
   - Fallback automático para `localStorage`

2. **Versão Desktop (Electron)**:
   - Armazena em `dados/desktop/` (arquivos JSON locais)

---

## 🛠️ Tecnologias Utilizadas

- **Frontend**: HTML5, CSS3, JavaScript ES6+ (Vanilla)
- **Estilização**: Tailwind CSS
- **Ícones**: Lucide Icons
- **Backend**: Python 3.12 (HTTP Server)
- **Planilhas**: SheetJS (xlsx)
- **Desktop**: Electron + Electron Builder
- **Armazenamento**: LocalStorage + File System (JSON)

---

## 👥 Sistema de Permissões

### Perfis de Usuário

| Perfil | Permissões |
|--------|-----------|
| 👑 **Dono** | Acesso total + gerenciamento de usuários + auditoria |
| 👤 **Admin** | Cadastros + registros + configurações |
| 👷 **Funcionário** | Apenas registros de entrada/saída |

---

## 📊 Funcionalidades Detalhadas

### 1. Cadastro de Clientes
- Validação automática de CPF
- Categorização customizável
- Sistema de comentários
- Histórico completo de acessos

### 2. Gerenciamento de Bicicletas
- Múltiplas bikes por cliente
- Descrição detalhada (marca, modelo, cor, aro)
- Snapshot automático no registro

### 3. Controle de Acesso
- Registro de entrada com data/hora
- Registro de saída com cálculo de permanência
- Sistema de pernoite
- Edição de registros (com auditoria)

### 4. Relatórios e Exportação
- Exportar para CSV, Excel e PDF
- Filtros por data, categoria e status
- Estatísticas por categoria
- Backup completo do sistema

### 5. Sistema de Auditoria
- Log de todas as ações
- Identificação do usuário responsável
- Filtros avançados
- Exportação de relatórios

---

## 🔐 Segurança

- ✅ Autenticação por usuário e senha
- ✅ Validação de permissões em tempo real
- ✅ Auditoria completa de ações
- ✅ Proteção contra duplicação de CPF
- ✅ Validação de dados em formulários

---

## 🌐 Deploy e Produção

### Replit (Recomendado)
O projeto está configurado para **autoscale deployment** no Replit:
- Servidor otimizado para produção
- Cache control configurado
- Ambiente isolado e seguro

### Servidor Próprio
```bash
# Configurar para produção
python3 server.py
```

---

## 🤝 Contribuindo

Para contribuir com o projeto:
1. Fork o repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo `LICENSE` para mais detalhes.

---

## 👨‍💻 Autor

**Marcelo Jorge**

---

## 📅 Histórico de Versões

- **v3.0** (23/11/2025) - Sistema de Permissões + Exportação/Importação
- **v2.2** (21/11/2025) - Melhorias Desktop + Categorias
- **v2.0** (20/11/2025) - Sistema de Auditoria
- **v1.0** (19/11/2025) - Versão Inicial

---

## 💡 Suporte

Para dúvidas ou problemas:
- Consulte a [documentação completa](docs/)
- Verifique o [troubleshooting](docs/DESKTOP-TROUBLESHOOTING.md)
- Abra uma issue no repositório

---

**Desenvolvido com ❤️ para otimizar a gestão de bicicletários**
