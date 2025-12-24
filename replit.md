# Sistema de Gerenciamento de Bicicletário

## Overview
O Sistema de Gerenciamento de Bicicletário (Bicicletário Shop) é uma aplicação web, com versão desktop executável, desenvolvida para gerenciar clientes, bicicletas e controlar o fluxo de entrada e saída em estacionamentos de bicicletas. O objetivo é otimizar as operações de bicicletários através de funcionalidades de cadastro, registro de movimentação, exportação de dados, sistema de auditoria completo e configurações personalizáveis, visando o mercado de lojas locais. O projeto inclui um sistema de ranking global para jogos e um robusto sistema de permissões de usuário.

## Replit Setup (30/11/2025)
- **Environment**: Python 3.11 installed for web server
- **Workflow**: Configured to run `python3 server.py` on port 5000 with webview output
- **Deployment**: Set to autoscale deployment target for production
- **Server Configuration**:
  - Main web server: `http://0.0.0.0:5000/` (serves the frontend)
  - Storage API: `http://localhost:5001/` (handles file-based storage)
  - Data storage path: `dados/navegador/` for web version
- **Access**: Click the "Run" button to start the server, then access via the webview
- **Default Credentials**: 
  - Admin: `admin` / `admin123`
  - Dono (Owner): `CELO123` / `CELO123`

## Desktop Version (Electron)
- **Setup**: Run `npm install` to install Electron dependencies
- **Run**: Execute `npm start` to launch the desktop application
- **Build**: Run `npm run build` to compile executable for Windows
- **Data Storage**: Desktop version saves data in `dados/desktop/` folder
- **Features**: 
  - Standalone executable application
  - Local file-based storage (no server required)
  - Full offline functionality

## Recent Changes (24/12/2025 - UI Modernization & Code Cleanup)
- **Delete Data Section Modernized**:
  - Dark gradient background (slate-800 to slate-900)
  - Red circular badges showing item counts
  - Enhanced checkbox styling with hover effects
  - Gradient red button with better visual hierarchy
  - Improved warning section with better contrast
  - Modern card design matching current UI theme
- **Project Cleanup**:
  - Removed `legado/app-monolitico.js` (653 lines of legacy code)
  - Removed `test_theme.html` (24 lines of test file)
  - Project now uses modular architecture exclusively (`js/app-modular.js`)
  - Total cleanup: 677 lines removed

## Recent Changes (23/12/2025 - Theme Customization per User)
- **Theme Switching Fixed**: 
  - Light mode (Claro) works correctly by removing the 'dark' class from the HTML element
  - Dark mode (Escuro) works by adding the 'dark' class
  - System preference (Sistema) respects the OS theme setting
- **Color Customization Feature (Per User)**:
  - Pencil icon added next to "Tema do Sistema" heading
  - Clicking the pencil opens a "Personalizar Tema" modal with:
    - 5 pre-made color themes: Padrão (Slate), Oceano, Floresta, Pôr do Sol, Ametista
    - Each theme shows 3 color swatches (primária, secundária, destaque)
    - Custom color pickers for each color type with hex value display
    - "Salvar Tema" button to apply custom theme
    - "Cancelar" button to close modal
  - **Per-User Theme Storage**: Each user's custom colors are saved individually:
    - Cores armazenadas em `customThemeColors_USERNAME` no localStorage
    - Quando um usuário faz login, suas cores personalizadas são carregadas automaticamente
    - Ao fazer logout, as cores são limpas
    - Diferentes usuários podem ter diferentes temas personalizados
  - CSS variables (`--color-primary`, `--color-secondary`, `--color-accent`) applied globally
  - All utility classes use theme variables for consistent theming
- **Code Improvements**:
  - Added setTimeout() delays in `loadThemePreference()` and `addEventListeners()` for DOM readiness
  - Fixed `handleThemeChange()` to update labels properly
  - Fixed dark mode to respect user's selected theme (no longer defaults to OS preference)
  - Refactored `applyTheme()` to correctly apply light/dark based on user selection
  - Enhanced modal UI with better visual hierarchy and color displays
  - Dark mode now works correctly: selecting "Escuro" applies dark theme immediately

## Recent Changes (17/12/2025)
- **Delete Data Feature:** Added new section in the "Dados" (Data) tab to permanently delete system data with selective options:
  - Delete all client registrations (clientes e bicicletas)
  - Delete all access records (registros de entrada/saida)
  - Delete all categories
  - Shows count of each data type before deletion
  - Double confirmation required for safety
  - Permission-controlled (requires configuracao/exportar permission)

## Recent Changes (29/11/2025)
- **Clickable Category Stats:** Adicionada funcionalidade para clicar nas estatísticas de categorias em Configuração > Gerenciar Categorias. Ao clicar em uma categoria, abre um modal mostrando todos os clientes daquela categoria com botão de editar (lápis) ao lado de cada um.
- **Client ID Normalization:** Adicionada normalização automática de IDs de clientes para garantir que todos os registros tenham um identificador único.
- **Category Removal Fix:** Corrigido bug na função de remover categoria em Configuração > Gerenciar Categorias. Adicionado método `Modals.confirm()` que faltava no módulo de modais.

## Recent Changes (27/11/2025)
- **Typing Game Redesign (MonkeyType Style):**
  - Nova interface minimalista escura inspirada no MonkeyType
  - Opções de tempo: 15, 30, 60, 120 segundos
  - Auto-início quando o usuário começa a digitar
  - Animação suave do cursor seguindo a posição
  - Overlay com blur quando desfocado
  - Letras verdes para acertos, vermelhas para erros
  - Tab + Enter para reiniciar após fim do jogo
  - Tela de resultados com WPM, precisão, caracteres e tempo
- **Pac-Man Speed Fix:** Velocidade reduzida de 100ms para 150ms
- **Games Tab Fixes:** Botão voltar funcional, sem flickering nos jogos
- **Navigation Icons:** Ícones Lucide em todas as 6 abas

## User Preferences
- Idioma: Português (Brasil)
- Aplicação projetada para lojas locais de estacionamento de bicicletas
- Interface com suporte a tema escuro/claro
- Dados separados por plataforma (navegador e desktop) em pastas distintas
- Execução local no computador via navegador

## System Architecture
O sistema adota uma arquitetura modular baseada em Vanilla JavaScript (ES6+ Modules), HTML e CSS, utilizando Tailwind CSS para estilização e Lucide Icons para ícones. A persistência de dados é realizada via LocalStorage ou arquivos JSON, com suporte a um backend de armazenamento em arquivos para a versão web e um sistema de arquivos local para a versão desktop.

### UI/UX Decisions
- Interface responsiva com suporte a temas Claro, Escuro e detecção da preferência do sistema operacional.
- Modais para edições, confirmações e alertas, com animações suaves.
- Abas de navegação para diferentes módulos (Clientes, Registros Diários, Usuários, Dados, Configuração, Jogos).
- Feedback visual para ações e seleções, com uso extensivo de Lucide Icons no lugar de emojis.
- Design consistente com o tema do site para dropdowns e outros componentes.

### Technical Implementations
- **Módulos Core**:
    - **Cadastros**: Gerencia clientes e bicicletas (adição, busca, edição, validação de CPF, prevenção de duplicidade, cadastro múltiplo por cliente, histórico).
    - **Registros Diários**: Controla registros de entrada/saída, "Pernoite", e edição de registros. Inclui coluna de categoria e estatísticas por categoria.
    - **Usuários**: Gerenciamento de perfis de funcionários com permissões granulares e relatório completo de auditoria com filtros, exportação em CSV e PDF.
    - **Dados**: Gerenciamento centralizado de importação/exportação de dados (importação de clientes por arquivo, exportação por período, backup completo do sistema).
    - **Configuração**: Permite seleção de tema, busca avançada global, gerenciamento de categorias, exportação de registros de acesso por cliente (PDF, Excel) e visualização de histórico.
    - **Jogos**: Aba dedicada com 6 jogos completos (Snake, Pac-Man, Typing Test, Memory Game, Tetris, Breakout) com sistema de ranking global, dificuldades e progressão de fases.
    - **Shared**: Contém utilitários (formatação, validação de CPF, UUID), funções para gerenciamento e migração de dados, e sistema de auditoria (AuditLogger).
- **Sistema de Permissões**: Controle de acesso granular com perfis (dono, admin, funcionário) e proteção de UI e runtime, incluindo permissões específicas para a aba de "Jogos" e "Dados".
- **Sistema de Comentários**: Modal unificada para adicionar e gerenciar comentários de clientes.
- **Categorias**: Funcionalidade para criar, editar (nome e ícone) e deletar categorias, com armazenamento refatorado para objeto JSON e estatísticas de uso.

### System Design Choices
- **Fluxo de Dados**: Dados primariamente armazenados no LocalStorage com estruturas separadas. Sistema de "snapshot" para bicicletas. Estrutura de pastas separada por plataforma (`dados/navegador/` e `dados/desktop/`) para arquivos JSON. Fallback automático para localStorage. Timestamps processados com fuso horário local.
- **Versão Desktop (Electron)**: Aplicações desktop executáveis construídas com Electron, utilizando `electron/storage-backend.js` para gerenciar o armazenamento de arquivos localmente.
- **Python Backend**: Um servidor Python serve a aplicação web e uma API de armazenamento em arquivos.

## External Dependencies
-   **Tailwind CSS**: Framework CSS para estilização.
-   **Lucide Icons**: Biblioteca de ícones.
-   **SheetJS (xlsx)**: Biblioteca para leitura e escrita de arquivos Excel.
-   **LocalStorage**: Para persistência de dados no navegador.
-   **Python 3.12 HTTP Server**: Utilizado para servir a aplicação web e a API de armazenamento em arquivos (`storage_api.py`).
-   **Electron**: Framework para construção de aplicações desktop multiplataforma.
-   **Electron Builder**: Ferramenta para empacotamento e distribuição de aplicações Electron.