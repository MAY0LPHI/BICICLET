# Bicicletário - Sistema de Gerenciamento de Bicicletário

## Overview
A bicycle parking management system (bicicletário) built with Python and vanilla HTML/CSS/JS. The server is a Python HTTP server that serves static files and provides a REST API for data management.

## Architecture
- **Backend**: Python `http.server` with custom request handler (`server.py`)
- **Frontend**: Static HTML/CSS/JS served directly by the Python server
- **Database**: SQLite (`dados/database/bicicletario.db`) via `db_manager.py`
- **Auth**: Custom auth manager (`auth_manager.py`) with bcrypt/SHA-256 hashing
- **Background Jobs**: Async import/sync tasks via `background_jobs.py`
- **Storage**: Local file system under `dados/` directory, SQLite preferred

## Running the App
- **Workflow**: "Start application" — runs `python server.py`
- **Port**: 5000 (0.0.0.0)
- **URL**: Accessible via the Replit preview pane

## Key Files

### Python (Backend)
- `server.py` — Main HTTP server (port 5000, serves static files + API at `/api/`, SSE at `/api/events`, gzip compression, security headers)
- `db_manager.py` — SQLite database manager (singleton via `get_db_manager()`)
- `auth_manager.py` — Offline auth with bcrypt/SHA-256, user CRUD, session management (singleton via `get_auth_manager()`)
- `background_jobs.py` — Background job manager + ImportWorker for async client/registro/backup imports
- `storage_api.py` — Legacy file-based REST storage API
- `offline_storage_api.py` — Enhanced storage API preferring SQLite with filesystem fallback
- `qr_generator.py` — QR code generation for station/totem access
- `jwt_manager.py` — JWT token generation/validation for secure auth
- `log_exporter.py` — Export audit logs and reports to CSV/TXT formats
- `app.py` — Flask wrapper for deployment on Render/Discloud
- `build_protected.py` — Build script for creating obfuscated `sistema_protegido/` distribution

### JavaScript (Frontend — `js/`)
- `js/app-modular.js` — Main application entry point, orchestrates all managers
- `js/cadastros/clientes.js` — Client CRUD, search, pagination (ClientesManager)
- `js/cadastros/bicicletas.js` — Bike management, photo capture/compression (BicicletasManager)
- `js/registros/registros-diarios.js` — Daily entry/exit records, pernoites (RegistrosManager)
- `js/registros/conexoes-qr.js` — QR/mobile request management (ConexoesQRManager)
- `js/configuracao/configuracao.js` — System settings, categories, theme (ConfiguracaoManager)
- `js/dados/dados.js` — Import/export, backups (DadosManager)
- `js/usuarios/usuarios.js` — User management for admin/dono roles (Usuarios)
- `js/jogos/jogos.js` — 15 mini-games with ranking system (~8170 lines, ~352KB)
- `js/dono/dashboard.js` — Owner dashboard with pure CSS charts (DonoDashboard)
- `js/mobile-access.js` — Client self-service totem logic (MobileAccess)
- `js/shared/` — 21 shared modules: auth, storage, utils, debug, config, modals, hotkeys, help-guide, system-loader, notifications, job-monitor, constants, validator, sanitizer, logger, audit-logger, platform, performance-config, photo-handler, file-storage, offline-storage

### Other
- `dados/` — Data directory (SQLite DB, JSON files, images, backups, logs)
- `css/` — Compiled CSS (Tailwind)
- `libs/` — Third-party libraries (Tailwind, Lucide, XLSX)

## Frontend Pages
- `index.html` — Main admin desktop panel (6 tabs, ~2300 lines)
- `admin-mobile.html` — Mobile admin panel (self-contained SPA, 5 tabs, ~1610 lines)
- `mobile-access.html` — Client self-service totem (step-based flow, ~530 lines)

## Desktop Panel (`index.html`)

### Tabs (6 total)
1. **Clientes**: Client registration, search with pagination, bike management panel
2. **Registros Diários**: Entry/exit records, pernoites, solicitation handling
3. **Usuários**: System user management (visible only for admin/dono)
4. **Dados**: Import/export data (JSON/Excel), backup management
5. **Configuração**: System settings, categories, theme colors, global search
6. **Jogos**: 15 mini-games with ranking and achievements

### JS/CSS Loading
- CSS: `style.css`, `css/tailwind-compiled.css`, inline Tailwind config
- JS: `libs/tailwind.min.js`, `libs/lucide.js`, `libs/xlsx.full.min.js`, `js/shared/platform.js` (IIFE), `js/app-modular.js` (ES module entry point)

### Lazy Loading Strategy (app-modular.js)
- **Immediate**: ClientesManager, BicicletasManager, RegistrosManager
- **Deferred** (via `lazyLoadDeferred()`): ConfiguracaoManager (1.5s), DadosManager (3s), Usuarios (4.5s)
- **On demand**: JogosManager (loaded via dynamic `import()` only when user clicks Jogos tab)
- Each deferred manager starts as `null` and is instantiated via `ensure*()` on first use

## Mobile Admin Panel (`admin-mobile.html`)
Self-contained single-file SPA with all CSS and JS inline. Uses the `App` module pattern.

### Theme & Design (matches `mobile-access.html`)
- **Tailwind CSS**: Loaded via `libs/tailwind.min.js` with `darkMode:'class'` config
- **Dark Mode**: Detects `themePreference` from localStorage (`dark`/`light`/`system`), applies `html.dark` class
- **Custom Theme Colors**: Reads `customThemeColors*` from localStorage for `--color-primary`, `--color-secondary`, `--theme-*` CSS variables
- **Glass Morphism**: `backdrop-filter:blur`, semi-transparent backgrounds (`var(--glass-bg/border/shadow)`) on cards, nav, drawers, overlays
- **Lucide Icons**: All icons use `<i data-lucide="...">` with `lucide.createIcons()` called in `boot()`, `initApp()`, and after dynamic renders

### Tabs (5 total)
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

## Auth
- **Default credentials** (must be changed for public/deployed environments):
  - `CELO123` / `CELO123` (tipo: dono — full access)
  - `admin` / `admin123` (tipo: admin — full access)
  - `Funcionario` / `1234` (tipo: funcionario — limited access)
- User types: admin, dono (proprietário), funcionario
- **Dual auth architecture**:
  - **Frontend** (`js/shared/auth.js`): SHA-256 client-side hashing, users cached in localStorage key `bicicletario_users`, session in `bicicletario_session`, brute force protection (locks after 5 failed attempts for 15 min)
  - **Backend** (`auth_manager.py`): Users stored in `dados/auth/users.json` with bcrypt hashing, used by API endpoints (`/api/auth/login`, `/api/users`)
  - Both systems are kept in sync — frontend `Auth.init()` creates default users locally if missing

## API Endpoints

### GET
- `/api/health` — System health check
- `/api/clients` — List all clients
- `/api/client/{id_or_cpf}` — Get specific client
- `/api/registros` — List all records
- `/api/categorias` — List categories
- `/api/solicitacoes` — List pending mobile requests
- `/api/users` — List all users
- `/api/audit` — Recent audit logs
- `/api/system-config` — System configuration
- `/api/storage-mode` — Current storage mode and stats
- `/api/jobs` — Active/recent background jobs
- `/api/job/{job_id}` — Specific job status
- `/api/changes` — Change counters for sync
- `/api/sync/status` — Pending sync operations
- `/api/backups` — List available backups
- `/api/backup/settings` — Auto-backup configuration
- `/api/backup/download/{file}` — Download specific backup
- `/api/events` — SSE stream for real-time updates
- `/imagens/{filename}` — Serve uploaded images

### POST
- `/api/auth/login` — Authenticate user
- `/api/client` — Save/update single client
- `/api/clients` — Batch save clients
- `/api/registro` — Save/update record
- `/api/categorias` — Save categories
- `/api/solicitacoes` — Create mobile request
- `/api/solicitacoes/process` — Approve/reject request
- `/api/users` — Create user
- `/api/users/change-password` — Change password
- `/api/system-config` — Update system config
- `/api/storage-mode` — Switch storage mode
- `/api/migrate` — Trigger data migration
- `/api/import/clients` — Async client import
- `/api/import/registros` — Async registro import
- `/api/import/backup` — Async backup restore
- `/api/clear/clients` — Delete all clients
- `/api/clear/registros` — Delete all records
- `/api/clear/categorias` — Delete all categories
- `/api/backup` — Create new backup
- `/api/backup/restore` — Restore from backup
- `/api/backup/upload` — Upload backup file
- `/api/backup/settings` — Update backup settings
- `/api/upload-image` — Upload base64 image
- `/api/audit` — Log audit action
- `/api/notify-change` — Trigger SSE change notification
- `/api/mobile/register-client` — Mobile client registration
- `/api/mobile/bike/add` — Mobile bike addition
- `/api/mobile/identify` — Mobile CPF identification

### DELETE
- `/api/users/{username}` — Delete user
- `/api/client/{id_or_cpf}` — Delete client
- `/api/registro/{id}` — Delete record
- `/api/backup/{filename}` — Delete backup file

## Performance Optimizations
- Debounced search (200ms delay)
- Paginated client list (50 per page with "load more" button via `maisClientes()`)
- `buildAtivosSet()` for O(1) active-client lookup instead of O(n) per card
- `refreshAll()` loads clients first, then registros (registros depend on client data for CPF resolution)
- **Individual registro save**: Operations (entry, exit, edit, revert, overnight, bike swap) use `Storage.saveRegistro()` for single-record API calls instead of re-saving all registros
- **Bulk save only for imports**: `Storage.saveRegistros()` only loops through the API when an `onProgress` callback is provided (used during data imports)
- **Individual delete**: `Storage.deleteRegistro()` removes a single record from both localStorage and API
- **Non-blocking modals**: "Registrar Entrada" modal closes immediately; the API save happens asynchronously in the background
- **2-query client loading**: `get_all_clientes()` fetches all clients + all bikes in 2 queries and maps in memory (instead of N+1: 1 query per client for bikes)
- **Direct client lookup**: `get_cliente_by_id_or_cpf()` queries the DB directly with WHERE clause instead of loading all clients to find one
- **O(1) client Map**: `RegistrosManager.getClientById()` uses a cached Map for instant client lookups in renderDailyRecords and all operations
- **Event delegation**: `ClientesManager` uses a single delegated click listener on `#client-list` instead of per-item addEventListener loops
- **CSS-only selection**: Clicking a client toggles CSS classes directly instead of re-rendering the entire list
- **Targeted comment badge**: Adding/removing comments updates only the badge DOM element instead of re-rendering the full client list
- **Debounced global search**: `ConfiguracaoManager.handleGlobalSearch` is debounced (configurable delay) to avoid filtering on every keystroke
- **Set-based import dedup**: `DadosManager.processImportData` pre-builds a Set of existing CPFs for O(1) duplicate checking
- **Batch category save**: During import, new categories are collected and saved once after the loop
- **Foreign keys enforced**: `PRAGMA foreign_keys=ON` in every connection prevents orphaned registros/bicicletas
- **Index on bicicleta_id**: `idx_registros_bicicleta` added for faster bike-related queries in registros
- **Pre-restore backup**: `restore_backup()` auto-creates a safety backup before overwriting the database
- **JSON validation on POST**: `/api/client`, `/api/clients`, `/api/registro` return 400 on malformed JSON
- **Required field validation**: `/api/client` requires `nome` and `cpf` fields, returns 400 if missing
- **localStorage quota protection**: All `localStorage.setItem` calls wrapped in try/catch for `QuotaExceededError`
- **Corrupted data recovery**: `loadClientsSync()` catches `JSON.parse` errors on corrupted localStorage data
- **Save failure rollback**: `handleAddClient` removes client from memory if `Storage.saveClient()` fails
- **Init error isolation**: `Config.load()` and `Auth.init()` failures are caught independently so the app still shows the login screen

## Important Notes
- Storage mode is SQLite (`db_manager.set_storage_mode('sqlite')`) — if it resets to `json`, registro POST will fail
- Client `id` field auto-generates from CPF when not provided (handled in `db_manager.save_cliente`)
- `delete_cliente` accepts both `id` and `cpf` for deletion
- Old `js/admin-mobile.js` was removed — all JS is inline in `admin-mobile.html`
- **Backup system**: Backups include auth users (with hashed passwords) from `auth_manager.py`. On restore, users are restored via `auth_manager.restore_users_from_backup()` (merge, not replace). Path traversal protection on all backup file operations.
- **All text inputs** use CSS `text-transform: uppercase` and `.toUpperCase()` on save for data consistency between admin and access interfaces
- Bicicletas table uses `criada_em`/`atualizada_em` (feminine) column names
- Communication between desktop and mobile-access totem is via localStorage key `bicicletario_requests`
- `sistema_protegido/` is compiled — do not modify files inside it

## Entertainment / Games Section
- **File**: `js/jogos/jogos.js` (~8170 lines, all game classes in one file, ~352KB)
- **Loading**: Lazy-loaded via dynamic `import()` — only downloaded when user clicks the Jogos tab (not during initial page load)
- **Cache busting**: `jogos.js?v=5` in app-modular.js, `app-modular.js?v=7` in index.html — increment when changing these files
- **Manager**: `JogosManager` class orchestrates game lifecycle (start/stop/cleanup)
- **Games** (15 total, 3 categories):
  - **Ação (6)**: SnakeGame, DoomGame, SpaceInvadersGame, BreakoutGame, FlappyBirdGame, DinoGame
  - **Palavras (4)**: TypingGame, TermoGame, TermoDuoGame, TermoQuartetGame
  - **Diversos (5)**: MemoryGame, WordSearchGame, CrosswordGame, Game2048, BrainTestGame
- **Achievements** (7): first_win, snake_master, doom_slayer, elephant_memory, destroyer, galaxy_defender, termo_master
- **Scoring**: Each game completion awards score via `onScore()` callback; rankings saved in localStorage `bicicletario_game_rankings` (top 100 per game)
- **SpaceInvadersGame**: Fully rewritten cohesive class — neon space aesthetic, pentagon enemies with eyes (color-coded by row), green arrowhead player, 5 waves with scaling difficulty, boss fight on wave 5 (HP bar), power-ups (triple shot/shield/speed/life), UFO special enemy, particle effects, 1.5s grace period at start, idempotent `_endGame()`, proper HUD ("Onda X/5 | Vidas: Y")
- **Optimized Classic Games** (4 authentic recreations with performance optimizations):
  - **Game2048**: Offscreen board cache, dirty-flag rendering, pre-computed colors, correct merge animation coordinates for all directions, touch restart support
  - **FlappyBirdGame**: Offscreen sky/ground caches, pre-computed constants, in-place pipe removal, original colors (#F5C227 bird, #74BF2E pipes, #4EC0CA sky)
  - **DinoGame**: Integer math, cached score strings, short obstacle type codes, correct HI score initialization from localStorage
  - **BrainTestGame**: 19 trick puzzles, 3 lives system, drag-and-drop puzzles, multi-tap puzzles, trick questions, time bonus scoring, hint system (H key), particle effects

## Dependencies
Python packages (see `requirements.txt`):
- `cryptography` — Encryption (Fernet/AES)
- `bcrypt` — Password hashing
- `argon2-cffi` — Argon2 hashing (optional)
- `qrcode` + `Pillow` — QR code generation (optional)
- `PyJWT` — JWT tokens (optional, fallback to HMAC)

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
