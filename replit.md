# Sistema de Gerenciamento de Bicicletário

## Overview
O Sistema de Gerenciamento de Bicicletário (Bicicletário Shop) é uma aplicação web, com versão desktop executável, desenvolvida para gerenciar clientes, bicicletas e controlar o fluxo de entrada e saída em estacionamentos de bicicletas. O objetivo é otimizar as operações de bicicletários através de funcionalidades de cadastro, registro de movimentação, exportação de dados, sistema de auditoria completo e configurações personalizáveis, visando o mercado de lojas locais.

## Recent Changes
- **23/11/2025**: Projeto importado do GitHub e configurado no Replit
  - Ambiente Replit configurado com sucesso
  - Workflow "Web Application" configurado para executar `python3 server.py`
  - Servidor web Python rodando na porta 5000 (0.0.0.0:5000)
  - API de armazenamento em arquivos rodando na porta 5001 (localhost:5001)
  - Deployment configurado para modo "autoscale"
  - .gitignore criado para excluir node_modules, dist/, dados/, e arquivos temporários
  - Aplicação testada e funcionando corretamente
  - Sistema de armazenamento em arquivos funcionando (dados salvos em dados/navegador/)
  - **Reorganização de arquivos concluída:**
    - 11 arquivos .md duplicados movidos para `docs/legacy/`
    - 5 scripts de inicialização (.bat e .sh) movidos para `scripts/`
    - Arquivo vazio "Gestão de Bicicletário" removido
    - Raiz do projeto agora mais limpa e organizada
    - Código continua funcionando perfeitamente - nenhum import quebrado

## Replit Environment Setup
Successfully imported from GitHub and configured on November 23, 2025.

### Running in Replit
The project runs automatically when you start the Repl:
- **Frontend Server**: Python HTTP server on port 5000 (0.0.0.0:5000) - serves the web interface
- **Backend API**: Storage API on port 5001 (localhost:5001) - handles file-based data persistence
- **Workflow**: "Web Application" executes `python3 server.py` which starts both servers
- **Data Storage**: All data is stored in the `dados/navegador/` directory (excluded from git)
- **Deployment**: Configured for autoscale deployment mode for production
- **Cache Control**: Headers configured to prevent browser caching during development

### How It Works
1. When you run the Repl, `server.py` starts automatically
2. The main server starts on port 5000 (frontend)
3. A background thread starts the storage API on port 5001 (backend)
4. The application automatically detects the storage API and uses file-based persistence
5. If the storage API is unavailable, it falls back to localStorage

### Default Credentials
- **Admin**: admin / admin123
- **Dono**: CELO123 / CELO123

### Key Files
- `server.py`: Main web server that serves the frontend and starts the storage API
- `storage_api.py`: Backend API for file-based data persistence
- `index.html`: Main application interface
- `.gitignore`: Configured to exclude node_modules, dist/, dados/, and build artifacts

## User Preferences
- Idioma: Português (Brasil)
- Aplicação projetada para lojas locais de estacionamento de bicicletas
- Interface com suporte a tema escuro/claro
- Dados separados por plataforma (navegador e desktop) em pastas distintas
- Execução local no computador via navegador

## System Architecture
O sistema adota uma arquitetura modular baseada em Vanilla JavaScript (ES6+ Modules), HTML e CSS, utilizando Tailwind CSS para estilização e Lucide Icons para ícones. A persistência de dados é realizada via LocalStorage ou arquivos JSON, com suporte a um backend de armazenamento em arquivos para a versão web e um sistema de arquivos local para a versão desktop.

-   **UI/UX**:
    -   Interface responsiva com suporte a temas Claro, Escuro e detecção da preferência do sistema operacional.
    -   Modais para edições, confirmações e alertas, com animações suaves.
    -   Abas de navegação para diferentes módulos (Cadastros, Registros Diários, Configurações).
    -   Feedback visual para ações e seleções.
    -   Uso de toggle switches para permissões de usuário.
    -   Design consistente com o tema do site para dropdowns e outros componentes.

-   **Módulos Core**:
    -   **Cadastros**: Gerencia clientes e bicicletas (adição, busca, edição, validação de CPF, prevenção de duplicidade, cadastro múltiplo por cliente, histórico).
    -   **Registros Diários**: Controla registros de entrada/saída, "Pernoite", e edição de registros. Inclui coluna de categoria e estatísticas por categoria.
    -   **Usuários**: Gerenciamento de perfis de funcionários com permissões granulares e relatório completo de auditoria com filtros, exportação em CSV e PDF.
    -   **Configuração**: Permite seleção de tema, busca avançada global, importação/exportação de dados completos do sistema (CSV, Excel) com mesclagem inteligente, exportação de registros de acesso por cliente (PDF, Excel) e visualização de histórico organizado de registros e estatísticas por categoria.
    -   **Shared**: Contém utilitários (formatação, validação de CPF, UUID), funções para gerenciamento e migração de dados, e sistema de auditoria (AuditLogger).
    -   **Sistema de Permissões**: Controle de acesso granular com perfis (dono, admin, funcionário) e proteção de UI e runtime.
    -   **Sistema de Comentários**: Modal unificada para adicionar e gerenciar comentários de clientes, sincronizada entre todas as abas.
    -   **Categorias**: Funcionalidade para criar, editar (nome e emoji) e deletar categorias, com armazenamento refatorado para objeto JSON e estatísticas de uso.

-   **Fluxo de Dados**:
    -   Dados primariamente armazenados no LocalStorage com estruturas separadas para clientes e registros.
    -   Sistema de "snapshot" para bicicletas no momento da entrada.
    -   Estrutura de pastas separada por plataforma (`dados/navegador/` e `dados/desktop/`) para arquivos JSON de clientes e registros.
    -   A versão desktop utiliza arquivos JSON simplificados (`clientes.json`, `registros.json`) diretamente no diretório `dados/desktop/`.
    -   Fallback automático para localStorage quando a Storage API em arquivos não está acessível.
    -   Timestamps e datas processados com fuso horário local para evitar erros de data.

-   **Versão Desktop (Electron)**:
    -   Aplicações desktop executáveis (`.exe`) construídas com Electron, encapsulando a aplicação web.
    -   Utiliza `electron/storage-backend.js` para gerenciar o armazenamento de arquivos localmente através de IPC handlers.

## External Dependencies
-   **Tailwind CSS**: Framework CSS para estilização.
-   **Lucide Icons**: Biblioteca de ícones.
-   **SheetJS (xlsx)**: Biblioteca para leitura e escrita de arquivos Excel.
-   **LocalStorage**: Para persistência de dados no navegador.
-   **Python 3.12 HTTP Server**: Utilizado para servir a aplicação web e uma API de armazenamento em arquivos (`storage_api.py`) localmente.
-   **Electron**: Framework para construção de aplicações desktop multiplataforma.
-   **Electron Builder**: Ferramenta para empacotamento e distribuição de aplicações Electron.