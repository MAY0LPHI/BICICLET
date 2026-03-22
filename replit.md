# Bicicletário - Sistema de Gerenciamento de Bicicletário

## Overview
A bicycle parking management system (bicicletário) built with Python and vanilla HTML/CSS/JS. The server is a Python HTTP server that serves static files and provides a REST API for data management.

## Architecture
- **Backend**: Python `http.server` with custom request handler (`server.py`)
- **Frontend**: Static HTML/CSS/JS served directly by the Python server
- **Database**: SQLite (`dados/database/bicicletario.db`) via `db_manager.py`
- **Auth**: Custom auth manager (`auth_manager.py`)
- **Background Jobs**: Scheduled tasks via `background_jobs.py`
- **Storage**: Local file system under `dados/` directory

## Running the App
- **Workflow**: "Start application" — runs `python server.py`
- **Port**: 5000 (0.0.0.0)
- **URL**: Accessible via the Replit preview pane

## Key Files
- `server.py` — Main HTTP server (port 5000, serves static files + API at `/api/`)
- `db_manager.py` — SQLite database manager
- `auth_manager.py` — Authentication/user management (includes create_user, delete_user, change_password, get_all_users)
- `background_jobs.py` — Background job scheduler
- `storage_api.py` — Storage abstraction layer
- `qr_generator.py` — QR code generation
- `dados/` — Data directory (SQLite DB, JSON files, images, backups, logs)
- `js/` — Frontend JavaScript modules (legacy, not used by admin-mobile anymore)
- `css/` — Compiled CSS (Tailwind, used by desktop)

## Frontend Pages
- `index.html` — Main admin desktop panel
- `admin-mobile.html` — Mobile admin panel (self-contained SPA with inline CSS/JS)
- `mobile-access.html` — Client self-service totem (CPF login)

## Mobile Admin Panel (`admin-mobile.html`)
Self-contained single-file SPA with all CSS and JS inline. Uses the `App` module pattern.

### Theme & Design (matches `mobile-access.html`)
- **Tailwind CSS**: Loaded via `libs/tailwind.min.js` with `darkMode:'class'` config
- **Dark Mode**: Detects `themePreference` from localStorage (`dark`/`light`/`system`), applies `html.dark` class
- **Custom Theme Colors**: Reads `customThemeColors*` from localStorage for `--color-primary`, `--color-secondary`, `--theme-*` CSS variables
- **Glass Morphism**: `backdrop-filter:blur`, semi-transparent backgrounds (`var(--glass-bg/border/shadow)`) on cards, nav, drawers, overlays
- **Lucide Icons**: All icons use `<i data-lucide="...">` with `lucide.createIcons()` called in `boot()`, `initApp()`, and after dynamic renders
- **Gradient Backgrounds**: Light mode uses blue-to-white gradient; dark mode uses deep blue gradient from theme vars
- **Smooth Transitions**: All interactive elements have transitions/transform feedback
- **CSS Variables**: Comprehensive dark/light token set (`--bg`, `--sf`, `--tx`, `--glass-*`, `--bd`, etc.) defined in `:root` and overridden in `html.dark`

### Structure
- **Login**: Glass morphism login card with gradient background, Lucide bike icon, animated bounce
- **5-Tab Bottom Navigation**: Clientes, Registros, Dados, Ajustes, Perfil (with glass morphism nav bar)
- **Drawer System**: All forms open as bottom-sheet drawers (`.drw` elements) with rounded top corners and glass styling
- **FAB Buttons**: Blue FAB on Clientes tab (new client), green FAB on Registros tab (new entry)
- **Toast Notifications**: Global toast system with backdrop-blur
- **Confirm Modal**: Glass morphism confirmation dialog for destructive actions

### Tabs
1. **Clientes**: Search, category filter chips, client cards list, client detail drawer (edit/delete/bikes/history)
2. **Registros**: Date filter, search, stat cards (Total/Dentro/Saíram), record cards with entry/exit/edit/delete, solicitations handling
3. **Dados**: Export (clients/registros JSON), import (clients/registros/backup JSON), create/download backups, danger zone (clear data)
4. **Ajustes**: System config (capacity slider, alert hours slider), backup auto settings, category management (with emoji), user management (for admin/dono users)
5. **Perfil**: Profile card, change password, audit log, game rankings, system actions, logout

### Key Features
- Client CRUD with category, bikes with photo (camera + file upload)
- Entry/exit registration with bike selection
- Solicitation approve/reject
- Data import/export (JSON)
- Backup management (create, download, restore)
- User management (create, delete users; change password)
- System configuration (capacity, alerts, backup frequency)
- Category management with emoji icons
- PWA support (manifest, service worker)

### Auth
- Login: CELO123/CELO123 (tipo: dono)
- User types: admin, dono (proprietário), funcionario
- Users stored in `dados/auth/users.json` (bcrypt hashed)
- User management visible for admin and dono user types

### API Endpoints Used
- Auth: `/api/auth/login` POST
- Clients: `/api/clients` GET, `/api/client` POST, `/api/client/{cpf}` DELETE
- Registros: `/api/registros` GET, `/api/registro` POST, `/api/registro/{id}` DELETE
- Categories: `/api/categorias` GET/POST
- Solicitations: `/api/solicitacoes` GET, `/api/solicitacoes/process` POST
- Users: `/api/users` GET/POST, `/api/users/{username}` DELETE, `/api/users/change-password` POST
- Config: `/api/system-config` GET/POST
- Backup: `/api/backups` GET, `/api/backup` POST, `/api/backup/restore` POST, `/api/backup/upload` POST, `/api/backup/download/{file}` GET, `/api/backup/{file}` DELETE, `/api/backup/settings` GET/POST
- Import: `/api/import/clients` POST, `/api/import/registros` POST, `/api/import/backup` POST
- Clear: `/api/clear/clients` POST, `/api/clear/registros` POST, `/api/clear/categorias` POST
- Audit: `/api/audit` GET
- Upload: `/api/upload-image` POST

### Performance Optimizations
- Debounced search (200ms delay)
- Paginated client list (50 per page with "load more" button via `maisClientes()`)
- `buildAtivosSet()` for O(1) active-client lookup instead of O(n) per card
- `refreshAll()` loads clients first, then registros (registros depend on client data for CPF resolution)
- **Individual registro save**: Operations (entry, exit, edit, revert, overnight, bike swap) use `Storage.saveRegistro()` for single-record API calls instead of re-saving all registros
- **Bulk save only for imports**: `Storage.saveRegistros()` only loops through the API when an `onProgress` callback is provided (used during data imports)
- **Individual delete**: `Storage.deleteRegistro()` removes a single record from both localStorage and API
- **Non-blocking modals**: "Registrar Entrada" modal closes immediately; the API save happens asynchronously in the background
- **2-query client loading**: `get_all_clientes()` fetches all clients + all bikes in 2 queries and maps in memory (instead of N+1: 1 query per client for bikes)
- **Direct client lookup**: `get_cliente_by_id_or_cpf()` queries the DB directly with WHERE clause instead of loading all 2746 clients to find one
- **O(1) client Map**: `RegistrosManager.getClientById()` uses a cached Map for instant client lookups in renderDailyRecords and all operations (instead of O(n) `.find()` loops)
- **Event delegation**: `ClientesManager` uses a single delegated click listener on `#client-list` instead of per-item addEventListener loops
- **CSS-only selection**: Clicking a client toggles CSS classes directly instead of re-rendering the entire list
- **Targeted comment badge**: Adding/removing comments updates only the badge DOM element instead of re-rendering the full client list
- **Debounced global search**: `ConfiguracaoManager.handleGlobalSearch` is debounced (configurable delay) to avoid filtering on every keystroke
- **Set-based import dedup**: `DadosManager.processImportData` pre-builds a Set of existing CPFs for O(1) duplicate checking (was O(N*M))
- **Batch category save**: During import, new categories are collected and saved once after the loop instead of on each new category
- **Foreign keys enforced**: `PRAGMA foreign_keys=ON` in every connection prevents orphaned registros/bicicletas
- **Index on bicicleta_id**: `idx_registros_bicicleta` added for faster bike-related queries in registros
- **Pre-restore backup**: `restore_backup()` auto-creates a safety backup before overwriting the database
- **JSON validation on POST**: `/api/client`, `/api/clients`, `/api/registro` return 400 on malformed JSON instead of crashing
- **Required field validation**: `/api/client` requires `nome` and `cpf` fields, returns 400 if missing
- **localStorage quota protection**: All `localStorage.setItem` calls wrapped in try/catch to handle `QuotaExceededError` gracefully
- **Corrupted data recovery**: `loadClientsSync()` catches `JSON.parse` errors on corrupted localStorage data instead of crashing
- **Save failure rollback**: `handleAddClient` removes client from memory if `Storage.saveClient()` fails, shows error to user
- **Init error isolation**: `Config.load()` and `Auth.init()` failures are caught independently so the app still shows the login screen

### Important Notes
- Storage mode is SQLite (`db_manager.set_storage_mode('sqlite')`) — if it resets to `json`, registro POST will fail
- Client `id` field auto-generates from CPF when not provided (handled in `db_manager.save_cliente`)
- `delete_cliente` accepts both `id` and `cpf` for deletion
- Old `js/admin-mobile.js` was removed — all JS is inline in `admin-mobile.html`
- **Backup system**: Backups include auth users (with hashed passwords) from `auth_manager.py`. On restore, users are restored via `auth_manager.restore_users_from_backup()` (merge, not replace). Path traversal protection on all backup file operations.
- **All text inputs** use CSS `text-transform: uppercase` and `.toUpperCase()` on save for data consistency between admin and access interfaces
- Bicicletas table uses `criada_em`/`atualizada_em` (feminine) column names

## Dependencies
Python packages (see `requirements.txt`):
- `cryptography` — Encryption
- `bcrypt` — Password hashing
- `argon2-cffi` — Argon2 hashing

## Protected Version (sistema_protegido/)
- Built via `python3 build_protected.py`
- **Python**: XOR encrypted + zlib compressed (works with any Python 3.8+)
- **HTML**: Minified + anti-DevTools + anti-copy + anti-right-click + anti-select; Tailwind CDN removed (uses pre-compiled CSS only); chrome-extension links stripped; cache-busting version params added
- **JavaScript**: ES Module files (40+) copied as-is (new Function() can't handle import/export); non-module JS (3 files) get XOR obfuscation; Electron/libs/sw.js copied unchanged
- **CSS**: Minified with noise comments; `tailwind-compiled.css` regenerated via Tailwind CLI to include ALL utility classes (no CDN dependency)
- **.bat files**: Copied as-is with CRLF line endings (Windows compatible)
- **GERAR-EXE.bat**: PyInstaller script to create standalone .exe on Windows
- Launchers detect both protected (iniciar.py) and original (server.py) versions
- **Tailwind config**: `tailwind.config.js` + `tailwind-input.css` used to regenerate complete CSS; run `npx tailwindcss -i tailwind-input.css -o css/tailwind-compiled.css --minify` to update

## Deployment
- Target: VM (always-running, needed for local SQLite + file system state)
- Run command: `python server.py`
