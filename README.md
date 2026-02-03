# 🚲 Sistema de Gerenciamento de Bicicletário

**Sistema completo e profissional para gestão de estacionamento de bicicletas** | Versão 4.0

[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow.svg)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![SQLite](https://img.shields.io/badge/SQLite-3-green.svg)](https://www.sqlite.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Version](https://img.shields.io/badge/version-4.0-blue.svg)](https://github.com)

---

## 📋 Sobre o Projeto

Sistema web completo e profissional para gerenciamento de bicicletários, desenvolvido para **BICICLETARIO SHOP. BOULEVARD V.V.**

**Versão atual:** 4.0 (02/02/2026)

Solução moderna e robusta que combina:
- 💻 **Interface Web Responsiva** - Funciona em qualquer dispositivo
- 📱 **Acesso Mobile Dedicado** - Interface otimizada para smartphones
- 🖥️ **Aplicação Desktop** - Versão standalone com Electron
- 🌐 **Modo Offline Completo** - Opera 100% sem internet
- 🎮 **Sistema de Entretenimento** - Jogos integrados para funcionários

### ✨ Principais Funcionalidades

#### 👥 Gestão de Clientes e Bicicletas
- ✅ **Cadastro Completo** - Nome, CPF (validado), telefone e categoria
- ✅ **Múltiplas Bicicletas** - Suporte ilimitado de bikes por cliente
- ✅ **Fotos de Bicicletas** - Captura via webcam ou upload de arquivos
- ✅ **Categorização** - Cliente, Lojista, iFood, Academia com ícones customizados
- ✅ **Sistema de Comentários** - Anotações e observações por cliente

#### 🚪 Controle de Acesso
- ✅ **Entrada/Saída Automatizada** - Registro com timestamp automático
- ✅ **QR Code** - Identificação rápida via dispositivo móvel
- ✅ **Sistema de Pernoite** - Controle especial para bikes overnight
- ✅ **Histórico Completo** - Todas as movimentações registradas
- ✅ **Solicitações Mobile** - Clientes podem solicitar entrada/saída via smartphone

#### 📊 Relatórios e Analytics
- ✅ **Dashboards Administrativos** - Métricas e estatísticas em tempo real
- ✅ **Exportação Múltipla** - PDF, CSV, Excel (XLSX) e JSON
- ✅ **Relatórios por Período** - Filtros avançados de data e categoria
- ✅ **Auditoria Completa** - Log de todas as ações do sistema

#### 🔐 Segurança e Autenticação
- ✅ **Sistema de Permissões** - 3 níveis (Dono, Admin, Funcionário)
- ✅ **JWT Tokens** - Autenticação segura com tokens
- ✅ **Criptografia** - Senhas protegidas com hash
- ✅ **Validações** - Sanitização contra XSS e injeção

#### 🎨 Personalização
- ✅ **Temas Claro/Escuro** - Alternância suave com preferência salva
- ✅ **8 Presets de Cores** - Temas predefinidos (Oceano, Noturno, etc)
- ✅ **Editor de Cores** - Customize primária e secundária
- ✅ **Interface Responsiva** - Adaptável a mobile, tablet e desktop

#### 🎮 Entretenimento e Gamificação
- ✅ **10+ Jogos Integrados** - Snake, Doom 3D, Termo, Memória, etc
- ✅ **Sistema de Ranking** - Competição entre funcionários
- ✅ **Conquistas** - Achievements desbloqueáveis
- ✅ **Pontuações Persistentes** - Histórico salvo por usuário

#### 🌐 Tecnologia Offline
- ✅ **SQLite Local** - Banco de dados robusto e rápido
- ✅ **Modo 100% Offline** - Funciona sem internet
- ✅ **Sincronização Automática** - Merge inteligente de dados
- ✅ **Backup Automático** - Proteção contra perda de dados
- ✅ **Progressive Web App** - Instalável como aplicativo
- ✅ **Aplicação Electron** - Versão desktop nativa

---

## 🚀 Início Rápido

### Executando Localmente

#### Opção 1: Scripts de Inicialização (Recomendado)

```bash
# Windows
scripts/batch/INICIAR-NAVEGADOR.bat

# Linux/Mac
bash scripts/INICIAR-NAVEGADOR.sh
```

#### Opção 2: Servidor Web Python

```bash
# Inicie o servidor (porta 5000)
python3 server.py
```
```
Acesse: `http://localhost:5000`

---

## ☁️ Deployment e Hospedagem

O sistema suporta múltiplas plataformas de hospedagem:

### Plataformas Suportadas

- **🌩️ Discloud** - Deploy simples com SQLite
- **🚀 Render** - Deploy profissional com PostgreSQL
- **💻 Local** - Desenvolvimento e uso offline

### Guia Completo

📖 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia passo a passo para cada plataforma

### Deploy Rápido

#### Discloud
```bash
# 1. Configure o ID em discloud.config
# 2. Zipe o projeto
zip -r bicicletario.zip . -x "node_modules/*" "dados/*"
# 3. Faça upload no painel da Discloud
```

#### Render
```bash
# 1. Conecte seu repositório GitHub
# 2. O Render detectará render.yaml automaticamente
# 3. Aprove e faça deploy
```

### Variáveis de Ambiente

Copie `.env.example` para `.env` e configure:
```bash
ENVIRONMENT=local|discloud|render
PORT=5000
DATABASE_URL=postgresql://... # Apenas para Render
SECRET_KEY=sua-chave-secreta
```

---

## 📚 Documentação e Manuais

### 🆕 Manuais Detalhados
- **[MANUAL_JOGOS.md](docs/MANUAL_JOGOS.md)** - Guia dos jogos, ranking e conquistas.
- **[MANUAL_CONFIGURACAO.md](docs/MANUAL_CONFIGURACAO.md)** - Guia de temas, categorias e backups.

### 🎯 Guias Básicos
- **[README-PRINCIPAL.md](docs/legacy/README-PRINCIPAL.md)** - Guia completo de uso (Legacy).
- **[GUIA-MODO-OFFLINE.md](docs/legacy/GUIA-MODO-OFFLINE.md)** - Guia completo sobre o funcionamento offline.
- **[INSTRUCOES-USO.md](docs/legacy/INSTRUCOES-USO.md)** - Instruções detalhadas de operação.

### 🔧 Documentação Técnica
- **[ESTRUTURA.md](docs/legacy/ESTRUTURA.md)** - Organização modular do código.
- **[SISTEMA-ARQUIVOS.md](docs/legacy/SISTEMA-ARQUIVOS.md)** - Estrutura de armazenamento.

---

## � Tech Stack

### Frontend
- **HTML5** - Estrutura semântica moderna
- **TailwindCSS** - Framework CSS utilitário
- **JavaScript ES6+** - Módulos e programação moderna
- **Lucide Icons** - Ícones SVG consistentes
- **XLSX.js** - Exportação para Excel
- **jsPDF** - Geração de relatórios PDF

### Backend
- **Python 3.12+** - Linguagem principal do servidor
- **Flask** - Framework web leve e flexível
- **SQLite 3** - Banco de dados local robusto
- **JWT (PyJWT)** - Autenticação segura com tokens
- **Bcrypt** - Criptografia de senhas

### Desktop
- **Electron** - Framework para aplicações desktop
- **Node.js** - Runtime JavaScript

### DevOps
- **Git** - Controle de versão
- **Discloud** - Hospedagem com SQLite
- **Render** - Hospedagem profissional com PostgreSQL

---

## �📁 Estrutura do Projeto

```
bicicletario/
├── 📂 js/                          # Código JavaScript modular
│   ├── cadastros/                  # Módulos de cadastro
│   │   ├── clientes.js            # CRUD de clientes
│   │   └── bicicletas.js          # CRUD de bicicletas
│   ├── registros/                  # Controle de entrada/saída
│   │   ├── registros.js           # Registro de movimentações
│   │   └── pernoite.js            # Sistema de pernoite
│   ├── jogos/                      # Módulo de jogos e gamificação
│   │   └── jogos.js               # 10+ jogos com ranking
│   ├── configuracao/               # Configurações do sistema
│   │   └── configuracao.js        # Temas, cores, backups
│   ├── dados/                      # Gestão de dados
│   │   └── dados-manager.js       # Import/export, relatórios
│   ├── dono/                       # Painel administrativo
│   │   └── painel-dono.js         # Dashboard do proprietário
│   ├── usuarios/                   # Gestão de usuários
│   │   └── usuarios.js            # CRUD de usuários
│   ├── shared/                     # Utilitários compartilhados
│   │   ├── auth.js                # Autenticação e sessões
│   │   ├── storage.js             # Gerenciamento de armazenamento
│   │   ├── offline-storage.js     # SQLite offline
│   │   ├── validator.js           # Validações (CPF, etc)
│   │   ├── sanitizer.js           # Sanitização de dados
│   │   ├── notifications.js       # Sistema de notificações toast
│   │   ├── modals.js              # Gerenciador de modais
│   │   ├── audit-logger.js        # Logger de auditoria
│   │   ├── photo-handler.js       # Gerenciamento de fotos
│   │   ├── platform.js            # Detecção de plataforma
│   │   └── utils.js               # Funções utilitárias
│   └── app-modular.js              # Aplicação principal modular
│
├── � Backend Python/             # Servidor backend
│   ├── server.py                   # Servidor Flask principal
│   ├── app.py                      # Aplicação WSGI (Gunicorn)
│   ├── db_manager.py               # Gerenciador de banco SQLite/PostgreSQL
│   ├── auth_manager.py             # Gerenciador de autenticação
│   ├── jwt_manager.py              # Gerenciador de JWT tokens
│   ├── storage_api.py              # API de armazenamento
│   ├── offline_storage_api.py      # API offline com SQLite
│   ├── log_exporter.py             # Exportador de logs
│   ├── qr_generator.py             # Gerador de QR Codes
│   └── background_jobs.py          # Jobs agendados (backups)
│
├── 🖥️ electron/                   # Aplicação desktop
│   ├── main.js                     # Processo principal Electron
│   ├── preload.js                  # Script de preload
│   ├── storage-backend.js          # Backend de armazenamento local
│   ├── README.md                   # Documentação Electron
│   └── README-ICONE.md             # Guia de ícones
│
├── 📱 mobile/                     # Interface mobile
│   ├── mobile-access.html          # Página de acesso mobile
│   ├── mobile-access.js            # Lógica mobile
│   └── qrcode.html                 # Gerador de QR Code
│
├── 📄 docs/                       # Documentação
│   ├── MANUAL_JOGOS.md             # Manual de jogos
│   ├── MANUAL_CONFIGURACAO.md      # Manual de configurações
│   └── legacy/                     # Docs legadas
│
├── �️ scripts/                    # Scripts de inicialização
│   ├── INICIAR-NAVEGADOR.bat       # Iniciar no navegador (Windows)
│   ├── INICIAR-NAVEGADOR.sh        # Iniciar no navegador (Linux/Mac)
│   ├── INICIAR-DESKTOP.bat         # Iniciar versão desktop
│   └── check-system.js             # Verificador de sistema
│
├── � dados/                      # Dados da aplicação
│   ├── database/                   # Bancos de dados SQLite
│   ├── logs/                       # Logs de auditoria
│   ├── relatorios/                 # Relatórios gerados
│   ├── imagens/                    # Fotos de bicicletas
│   └── auth/                       # Dados de autenticação
│
├── 🎨 assets/                     # Recursos estáticos
│   ├── icons/                      # Ícones SVG do PWA
│   ├── libs/                       # Bibliotecas externas
│   │   ├── tailwind.min.js        # TailwindCSS
│   │   ├── lucide.js              # Lucide Icons
│   │   └── xlsx.full.min.js       # SheetJS
│   ├── favicon.svg                 # Favicon
│   └── style.css                   # Estilos customizados
│
├── 📄 Arquivos raiz
│   ├── index.html                  # Página principal
│   ├── login.html                  # Página de login
│   ├── dashboard.html              # Dashboard
│   ├── admin-qr.html               # Painel admin de QR
│   ├── manifest.json               # Manifest PWA
│   ├── sw.js                       # Service Worker
│   ├── package.json                # Dependências Node.js
│   ├── requirements.txt            # Dependências Python
│   ├── .env.example                # Template de variáveis de ambiente
│   ├── discloud.config             # Config deploy Discloud
│   ├── render.yaml                 # Config deploy Render
│   └── README.md                   # Este arquivo
```

---

## 📅 Histórico de Versões

### 🚀 v4.0 (02/02/2026) - **Sistema Completo de Entretenimento e Acesso Mobile**
- 📱 **Acesso Mobile Aprimorado**
  - Sistema de solicitações de entrada/saída via dispositivo móvel
  - Interface mobile-first com QR Code para identificação rápida
  - Notificações em tempo real para solicitações pendentes
- 🎮 **Módulo de Jogos Expandido**
  - Sistema de ranking global entre funcionários
  - Sistema de conquistas (achievements) desbloqueáveis
  - 10+ jogos integrados: Snake, Doom 3D, Termo (Wordle), Memória, etc
  - Pontuações persistentes por usuário
- 🎨 **Personalização Avançada de Temas**
  - Editor de cores customizadas (primária e secundária)
  - 8 presets de temas predefinidos (Padrão, Noturno, Oceano, etc)
  - Preview em tempo real de mudanças de tema
  - Persistência de preferências de cor

### 🌐 v3.5 (23/01/2026) - **Otimizações e Sistema de Categorias**
- 📊 **Categorias Personalizadas**
  - Sistema de categorização de clientes (Cliente, Lojista, Ifood, Academia)
  - Ícones customizados por categoria
  - Filtros avançados por categoria nos relatórios
  - Estatísticas por categoria no dashboard
- 🔄 **Otimizações de Performance**
  - API batch para importação em massa de clientes
  - Redução de requisições HTTP individuais
  - Cache inteligente de dados frequentes
- 📸 **Sistema de Fotos de Bicicletas**
  - Captura via câmera web integrada
  - Upload de arquivos de imagem
  - Preview e edição de fotos
  - Armazenamento compactado em Base64

### 🔐 v3.2 (15/01/2026) - **Segurança e Autenticação Offline**
- 🛡️ **Sistema de Autenticação Robusto**
  - JWT Manager para tokens seguros
  - Auth Manager com criptografia de senhas
  - Sistema de permissões hierárquico (Dono, Admin, Funcionário)
  - Autenticação offline com validação local
- 📝 **Sistema de Auditoria Completo**
  - Rastreamento de todas as ações do sistema
  - Exportação de logs de auditoria
  - Visualização detalhada de histórico de ações
  - Formatação legível de eventos do sistema

### 💾 v3.0 (03/01/2026) - **Sistema Offline Completo com SQLite**
- 🗄️ **Banco de Dados SQLite Local**
  - Migração de LocalStorage para SQLite
  - Backup automático programado
  - Exportação/Importação de banco completo
  - Maior capacidade e performance
- 🔄 **Sincronização Automática**
  - Sincronização entre navegador e desktop
  - Detecção automática de conflitos
  - Merge inteligente de dados
  - Modo 100% offline funcional
- 🖥️ **Aplicação Desktop com Electron**
  - Empacotamento para Windows/Linux/Mac
  - Storage backend dedicado
  - Integração com sistema de arquivos local
  - Scripts de build helper automatizados

### 📊 v2.8 (28/12/2025) - **Relatórios e Exportação Avançados**
- 📈 **Sistema de Relatórios**
  - Geração de relatórios em PDF com jsPDF
  - Exportação para CSV e Excel (XLSX)
  - Exportação completa em JSON
  - Relatórios customizados por período
  - Estatísticas visuais no dashboard
- 💼 **Dashboard Administrativo**
  - Painel do Dono com métricas completas
  - Gráficos e estatísticas em tempo real
  - Visão geral de clientes ativos
  - Controle de usuários do sistema

### 🚲 v2.5 (20/12/2025) - **Gestão Avançada de Bicicletas**
- 🔢 **Sistema de Múltiplas Bicicletas**
  - Suporte para múltiplas bikes por cliente
  - CRUD completo de bicicletas
  - Fotos detalhadas de cada bicicleta
  - Histórico individual por bike
- 🌙 **Sistema de Pernoite**
  - Controle especial para bikes overnight
  - Cálculo de tempo de permanência
  - Alertas para bicicletas em pernoite
  - Relatório específico de pernoites

### 👥 v2.2 (12/12/2025) - **Gestão de Clientes e Validações**
- ✅ **Validações Avançadas**
  - Validação de CPF com algoritmo verificador
  - Sanitização de entrada de dados
  - Máscaras automáticas (CPF, telefone)
  - Prevenção de XSS e injeção
- 👤 **Cadastro Completo de Clientes**
  - CRUD completo com nome, CPF, telefone
  - Sistema de comentários por cliente
  - Edição em lote de dados
  - Busca e filtros avançados

### 🚪 v2.0 (05/12/2025) - **Sistema de Registros de Entrada/Saída**
- ⏱️ **Controle de Acesso**
  - Registro de entrada com timestamp automático
  - Registro de saída com cálculo de permanência
  - Histórico completo de movimentações
  - Edição de registros com auditoria
- 📋 **Gestão de Registros**
  - Visualização de bikes estacionadas
  - Filtros por status (ativa/encerrada)
  - Busca por cliente, bike ou data
  - Estatísticas de uso

### 🎨 v1.5 (25/11/2025) - **Interface e Experiência do Usuário**
- 🌓 **Sistema de Temas**
  - Tema Claro e Escuro
  - Detecção automática de preferência do sistema
  - Transições suaves entre temas
  - Persistência de preferência
- 🎭 **Interface Moderna**
  - Design com TailwindCSS
  - Ícones Lucide para consistência visual
  - Componentes reutilizáveis
  - Responsividade completa (mobile/desktop/tablet)

### 🔧 v1.2 (18/11/2025) - **Modularização e Arquitetura**
- 📦 **Código Modular**
  - Separação em módulos ES6
  - Organização por funcionalidade (cadastros, registros, jogos, etc)
  - Módulos compartilhados (shared/) para utilitários
  - Sistema de carregamento dinâmico
- 🛠️ **Utilitários e Helpers**
  - Logger centralizado
  - Sistema de notificações toast
  - Gerenciador de modais reutilizável
  - Detecção de plataforma (navegador/desktop/mobile)

### 🎯 v1.0 (10/11/2025) - **Versão Inicial - MVP**
- 🚀 **Lançamento do Sistema**
  - Estrutura HTML/CSS/JavaScript básica
  - Servidor Python com Flask
  - LocalStorage para dados iniciais
  - CRUD básico de clientes e bicicletas
  - Interface de login simples
  - Cadastro manual de registros

---

## 🎯 Recursos Destacados

### 📱 Acesso Mobile
O sistema oferece uma interface mobile dedicada (`mobile-access.html`) que permite:
- Identificação rápida via QR Code
- Solicitações de entrada/saída direto do smartphone cliente
- Notificações em tempo real para funcionários
- Interface touch-friendly otimizada

### 🎮 Sistema de Jogos
Módulo de entretenimento completo para funcionários:
- **Snake** - Clássico jogo da cobrinha
- **Doom 3D** - FPS raycasting em JavaScript
- **Termo** - Clone do Wordle em português
- **Jogo da Memória** - Combine os pares
- **+6 jogos adicionais** - Tetris, Pong, Space Invaders, etc

Sistema de **ranking global** e **conquistas desbloqueáveis** para aumentar o engajamento da equipe.

### 🔐 Segurança Robusta
- **3 níveis de permissão** - Controle granular de acesso
- **JWT Tokens** - Autenticação stateless segura
- **Senhas criptografadas** - Proteção com bcrypt
- **Auditoria completa** - Rastreamento de todas as ações
- **Validação de dados** - Sanitização contra XSS e SQL injection

### 💾 Modo Offline Primeiro
- Opera **100% sem internet** após primeiro carregamento
- SQLite para armazenamento local robusto
- Sincronização automática quando online
- Progressive Web App instalável
- Service Worker para cache inteligente

---

## 📖 Documentação Adicional

### Manuais de Usuário
- 📘 **[MANUAL_JOGOS.md](docs/MANUAL_JOGOS.md)** - Guia completo dos jogos, ranking e conquistas
- 📗 **[MANUAL_CONFIGURACAO.md](docs/MANUAL_CONFIGURACAO.md)** - Personalização de temas, categorias e backups
- 📙 **[DEPLOYMENT.md](DEPLOYMENT.md)** - Guia de deploy para Discloud, Render e local

### Documentação Técnica (Legacy)
- 🔧 **[ESTRUTURA.md](docs/legacy/ESTRUTURA.md)** - Arquitetura e organização modular
- 🗄️ **[SISTEMA-ARQUIVOS.md](docs/legacy/SISTEMA-ARQUIVOS.md)** - Estrutura de armazenamento
- 🌐 **[GUIA-MODO-OFFLINE.md](docs/legacy/GUIA-MODO-OFFLINE.md)** - Funcionamento do sistema offline

---

## 🚀 Quick Start - Comandos Úteis

```bash
# Desenvolvimento Local
python server.py                    # Iniciar servidor (porta 5000)
python app.py                       # Iniciar com Gunicorn (produção)

# Navegador
scripts/batch/INICIAR-NAVEGADOR.bat       # Windows
bash scripts/INICIAR-NAVEGADOR.sh         # Linux/Mac

# Desktop (Electron)
npm install                         # Instalar dependências
npm start                           # Executar modo dev
npm run build                       # Build para produção

# Utilitários
node tests/verify_audit_formatting_node.js  # Verificar formatação de logs
scripts/check-system.js                     # Verificar dependências
```

---

## 🤝 Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 💡 Suporte e Contato

📧 **Suporte Técnico:**
- Consulte a documentação em `docs/`
- Verifique [troubleshooting](docs/legacy/DESKTOP-TROUBLESHOOTING.md) para problemas comuns

🐛 **Reportar Bugs:**
- Descreva o problema detalhadamente
- Inclua passos para reproduzir
- Informe versão do sistema e plataforma

💬 **FAQ:**

**P: O sistema funciona sem internet?**
R: Sim! 100% funcional offline após primeiro carregamento. SQLite armazena tudo localmente.

**P: Posso usar em dispositivos móveis?**
R: Sim! Interface responsiva + acesso mobile dedicado em `mobile-access.html`.

**P: Como faço backup dos dados?**
R: Menu Configurações > Backup Automático ou exportação manual em CSV/Excel/JSON.

**P: Quantas bicicletas posso cadastrar por cliente?**
R: Ilimitado! Cada cliente pode ter quantas bikes precisar.

---

<div align="center">

**⭐ Sistema de Gerenciamento de Bicicletário v4.0 ⭐**

*Desenvolvido com ❤️ para otimizar a gestão de bicicletários*

**BICICLETARIO SHOP. BOULEVARD V.V.** | 2025-2026

</div>
