# Sistema de Gerenciamento de Bicicletário

## Overview
The Bicycle Rack Management System (Bicicletário Shop) is a web and desktop application designed to manage clients, bicycles, and control the flow of entry and exit in bicycle parking lots. Its primary goal is to optimize operations for local bicycle shops through features like registration, movement tracking, data export, a comprehensive audit system, and customizable settings. The project also includes a global ranking system for games and a robust user permission system.

## User Preferences
- Idioma: Português (Brasil)
- Aplicação projetada para lojas locais de estacionamento de bicicletas
- Interface com suporte a tema escuro/claro
- Dados separados por plataforma (navegador e desktop) em pastas distintas
- Execução local no computador via navegador

## System Architecture
The system adopts a modular architecture based on Vanilla JavaScript (ES6+ Modules), HTML, and CSS, utilizing Tailwind CSS for styling and Lucide Icons. Data persistence is achieved via LocalStorage or JSON files, with file-based storage for the web version and a local file system for the desktop version. A Python backend serves the web application and a file-based storage API.

### UI/UX Decisions
- Responsive interface supporting Light, Dark, and OS preference themes.
- Modals for edits, confirmations, and alerts with smooth animations.
- Navigation tabs for different modules (Clients, Daily Records, Users, Data, Configuration, Games).
- Visual feedback for actions and selections, extensively using Lucide Icons.
- Consistent design for dropdowns and other components.
- Per-user theme customization with pre-made color themes and custom color pickers, saved individually in localStorage.

### Technical Implementations
- **Core Modules**:
    - **Registrations**: Manages clients and bicycles (add, search, edit, CPF validation, duplication prevention, multiple registrations per client, history).
    - **Daily Records**: Controls entry/exit records, "Overnight stays," and record editing. Includes category columns and statistics.
    - **Users**: Manages employee profiles with granular permissions and provides a comprehensive audit report with filters and export options.
    - **Data**: Centralized import/export of data (client import by file, period export, full system backup).
    - **Configuration**: Allows theme selection, global advanced search, category management, export of client access records, and history viewing.
    - **Games**: Dedicated tab with 6 complete games (Snake, Pac-Man, Typing Test, Memory Game, Tetris, Breakout) featuring a global ranking system, difficulties, and level progression.
    - **Shared**: Contains utilities (formatting, CPF validation, UUID), data management and migration functions, and an AuditLogger.
- **Permission System**: Granular access control with profiles (owner, admin, employee) and UI/runtime protection, including specific permissions for "Games" and "Data" tabs.
- **Comments System**: Unified modal for adding and managing client comments.
- **Categories**: Functionality to create, edit (name and icon), and delete categories, with refactored storage to a JSON object and usage statistics.

### System Design Choices
- **Data Flow**: Data primarily stored in LocalStorage with separate structures. Snapshot system for bicycles. Separate folder structure per platform (`dados/navegador/` and `dados/desktop/`) for JSON files. Automatic fallback to localStorage. Timestamps processed with local time zone.
- **Storage Mode Toggle**: Users can switch between SQLite database and JSON file storage via the Configuration tab. Migration functionality automatically backs up data before transferring between modes.
- **Desktop Version (Electron)**: Executable desktop applications built with Electron, using `electron/storage-backend.js` for local file storage management.
- **Python Backend**: A Python server serves the web application and a file-based storage API. The API is integrated into the main server (port 5000) for Replit's proxy environment. Includes endpoints for storage mode management (`/api/storage-mode`) and data migration (`/api/migrate`).
- **Background Job System**: Asynchronous import processing using Python threading (`background_jobs.py`). Large data imports run in background with real-time progress monitoring. API endpoints: `/api/jobs`, `/api/job/{id}`, `/api/changes`, `/api/import/clients`, `/api/import/registros`, `/api/import/backup`.
- **Real-time Synchronization**: JobMonitor component (`js/shared/job-monitor.js`) provides automatic tab synchronization, progress pop-ups in bottom-right corner, and toast notifications for data changes.

## External Dependencies
- **Tailwind CSS**: CSS framework for styling.
- **Lucide Icons**: Icon library.
- **SheetJS (xlsx)**: Library for reading and writing Excel files.
- **LocalStorage**: For data persistence in the browser.
- **Python 3.11 HTTP Server**: Used to serve the web application and the file-based storage API.
- **Electron**: Framework for building cross-platform desktop applications.
- **Electron Builder**: Tool for packaging and distributing Electron applications.