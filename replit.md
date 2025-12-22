# Sistema de Gerenciamento de Bicicletário

## Overview
O Sistema de Gerenciamento de Bicicletário (Bicicletário Shop) é uma aplicação web multiplataforma (web e desktop Electron), desenvolvida para gerenciar clientes, bicicletas e controlar o fluxo de entrada e saída em estacionamentos de bicicletas. Otimiza operações através de cadastro, registro de movimentação, exportação de dados, auditoria completa e configurações personalizáveis. Inclui sistema de ranking global para jogos e robusto sistema de permissões de usuário.

## Replit Setup (19/12/2025)
### Versão Web
- **Environment**: Python 3.11
- **Servidor**: `python server.py` rodando em `http://0.0.0.0:5000/`
- **Storage API**: `http://localhost:5001/` (arquivos JSON em `dados/navegador/`)
- **Deployment**: Autoscale configurado
- **Cache Control**: Headers no-cache para evitar caching issues
- **Status**: ✅ Totalmente funcional

### Versão Desktop (Electron)
- **Dependências**: npm install (Electron 28.3.3 + electron-builder)
- **Executar**: `npm start` (usa index.html localmente)
- **Storage**: Arquivos JSON em `dados/desktop/`
- **Arquivo Backend**: `electron/storage-backend.js` com suporte completo para:
  - Clientes e Registros (JSON)
  - Usuários (persiste em arquivo)
  - Logs de Auditoria (persiste em arquivo)
  - Categorias (persiste em arquivo)
- **IPC Handlers**: Comunicação frontend-backend via Electron IPC
- **Status**: ✅ Configurada com suporte total para arquivos (igual à web)

## Autenticação e Dados
- **Default Credentials**:
  - Admin: `admin` / `admin123`
  - Dono (Owner): `CELO123` / `CELO123`
- **Sistema de Usuários**: Suporte para múltiplos usuários com permissões granulares
- **Auditoria**: Logs completos de todas as ações (create, edit, delete, login, etc)
- **Persistência**: 
  - Web: localStorage + API de arquivos em `dados/navegador/`
  - Desktop: Arquivos JSON em `dados/desktop/`

## Estrutura de Projeto
```
/
├── electron/
│   ├── main.js (Electron app + IPC handlers)
│   ├── preload.js (Bridge entre frontend e Node.js)
│   └── storage-backend.js (Persistência de dados em arquivos)
├── js/
│   ├── app-modular.js (App principal)
│   ├── cadastros/ (Clientes e Bicicletas)
│   ├── registros/ (Registro de Entrada/Saída)
│   ├── configuracao/ (Temas, Categorias, Permissões)
│   ├── dados/ (Importação/Exportação)
│   ├── jogos/ (6 Jogos com Ranking)
│   ├── usuarios/ (Gerenciamento de Usuários)
│   └── shared/ (Storage, Auth, Auditoria, Utils)
├── index.html (UI Principal)
├── server.py (Servidor web Python)
├── storage_api.py (API de arquivos)
└── package.json (npm + Electron Builder config)
```

## Funcionalidades Core

### Frontend JavaScript (Vanilla ES6+)
- Interface responsiva com temas Claro/Escuro
- Sistema modular com 6 abas principais
- Validação de CPF, formatação de dados
- Exportação em PDF, Excel, CSV

### Backend
- **Web**: Python SimpleHTTPServer na porta 5000 + Storage API na porta 5001
- **Desktop**: Electron com IPC para persistência local
- **Ambos**: Suporte completo para mesmo conjunto de dados

### Módulos Principais
- **Clientes**: Cadastro com CPF, telefone, bicicletas associadas
- **Registros Diários**: Entrada/Saída, "Pernoite", estatísticas por categoria
- **Usuários**: Gerenciamento com permissões granulares
- **Dados**: Importação/Exportação, Backup
- **Configuração**: Temas, Categorias, Busca avançada
- **Jogos**: 6 jogos interativos com ranking global

## Tecnologias
- **Frontend**: Vanilla JavaScript ES6+, HTML5, CSS3, Tailwind CSS, Lucide Icons
- **Web Server**: Python 3.11 (http.server)
- **Desktop**: Electron 28.3.3, electron-builder
- **Storage**: localStorage (web) + arquivos JSON (ambas versões)
- **Persistência**: File-based (JSON) em `dados/`
- **Build**: npm + electron-builder

## Como Usar

### Versão Web (Replit)
```bash
npm install        # Instala dependências Electron (opcional)
python server.py   # Inicia servidor web na porta 5000
# Acesse via Replit Preview
```

### Versão Desktop Local
```bash
npm install
npm start          # Abre aplicação Electron
npm run build      # Compila para Windows (.exe)
```

## Deploy para Produção
- **Deployment Target**: Autoscale
- **Build Command**: `python server.py`
- **Run Command**: `python server.py`
- **Port**: 5000 (webview)

## Dados Persistidos
- **Clientes**: dados/navegador/clientes.json ou dados/desktop/clientes.json
- **Registros**: dados/navegador/registros.json ou dados/desktop/registros.json  
- **Usuários**: dados/navegador/usuarios.json ou dados/desktop/usuarios.json
- **Auditoria**: dados/navegador/auditoria.json ou dados/desktop/auditoria.json
- **Categorias**: dados/navegador/categorias.json ou dados/desktop/categorias.json

## Melhorias Recentes (19/12/2025)
- ✅ Instalado e configurado npm com Electron
- ✅ Melhorado storage-backend.js para suportar usuários, auditoria e categorias
- ✅ Atualizado preload.js com todos os handlers IPC necessários
- ✅ Implementado main.js com IPC handlers completos
- ✅ Corrigido auth.js para persistir dados via Electron quando disponível
- ✅ Versão Desktop agora tem feature parity com versão Web

## User Preferences
- Idioma: Português (Brasil)
- Público-alvo: Lojas locais de estacionamento de bicicletas
- Interface: Tema escuro/claro com persistência
- Dados: Separados por plataforma (web vs desktop)
- Execução: Local no navegador (web) ou desktop (Electron)

## Status Final
✅ Sistema completo e funcional
- ✅ Versão Web 100% operacional em Replit
- ✅ Versão Desktop (Electron) com suporte total a persistência
- ✅ Autenticação, Autorização, Auditoria
- ✅ Storage duplo (localStorage + arquivos JSON)
- ✅ Deployment configurado e testado
