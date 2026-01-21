# Storage and Backup Error Fixes

## Problem Statement

The desktop version of the application displayed two critical errors:

1. **Storage Configuration Unavailable**: "The server is not available to manage storage modes."
2. **Backup Loading Error**: "Error loading backups."

## Root Cause Analysis

The application's configuration module (`js/configuracao/configuracao.js`) was attempting to fetch storage and backup information from HTTP API endpoints (`/api/storage-mode` and `/api/backups`). However, the desktop version runs using Electron without a backend HTTP server, relying instead on IPC (Inter-Process Communication) between the renderer and main processes.

### Key Issues:
- No platform detection before making API calls
- No graceful fallback for desktop environment  
- Missing Electron IPC handlers for backup operations
- Frontend assumed server-side APIs always exist

## Solution Implemented

### 1. Platform Detection
**File**: `index.html`, `js/shared/platform.js`

Added platform.js script loading in index.html to detect whether the application is running in:
- Electron (desktop mode)
- Browser (web mode)
- Capacitor (mobile mode)

```javascript
const isDesktop = window.AppPlatform && window.AppPlatform.isDesktop();
```

### 2. Desktop-Specific Storage Management
**File**: `js/configuracao/configuracao.js`

Modified `loadStorageModeSettings()` to:
- Check platform before making API calls
- Show appropriate desktop message explaining file-based storage
- Only attempt server API calls in browser mode

**Desktop Message**:
```
Modo Desktop
No modo desktop, os dados são armazenados automaticamente em arquivos JSON locais.
Localização: dados/desktop/
```

### 3. Desktop-Specific Backup Management
**File**: `js/configuracao/configuracao.js`

Added three new methods:
- `loadDesktopBackupManagement()` - Loads backups via Electron IPC
- `renderDesktopBackupManagement()` - Displays backups for desktop mode
- `renderDesktopBackupError()` - Shows error fallback

The desktop backup management:
- Lists backups from `dados/database/backups/` folder
- Explains that backups are created via system export functions
- Provides guidance on using import/export features

### 4. Electron IPC Support
**Files**: `electron/preload.js`, `electron/main.js`, `electron/storage-backend.js`

Added backup listing support:

**preload.js**:
```javascript
contextBridge.exposeInMainWorld('electronAPI', {
  // ... existing handlers
  listBackups: () => ipcRenderer.invoke('list-backups')
});
```

**main.js**:
```javascript
ipcMain.handle('list-backups', () => {
  return storage.listBackups();
});
```

**storage-backend.js**:
```javascript
listBackups() {
  // Reads backup files from dados/database/backups/
  // Returns array of backup metadata
}
```

### 5. Graceful Error Handling
**File**: `js/configuracao/configuracao.js`

Both browser and desktop modes now show informative messages instead of cryptic errors:

**Browser Mode (no server)**:
- Storage: "Configuração de armazenamento indisponível - O servidor não está disponível..."
- Backup: "Gerenciamento de backup indisponível - O servidor não está disponível..."

**Desktop Mode**:
- Storage: Informative message about file-based storage
- Backup: Instructions on using export features + list of available backups

## Testing

### Desktop Mode Test
1. Run `npm start` to launch Electron app
2. Navigate to "Configurações" tab
3. Verify storage section shows desktop-specific message
4. Verify backup section lists backups or shows appropriate guidance
5. No errors should appear in console

### Browser Mode Test
1. Start server with `python server.py`
2. Open browser to `http://localhost:5000`
3. Navigate to "Configurações" tab
4. If server has DB support: Storage and backup features work normally
5. If server lacks DB support: Shows warning messages (not errors)

## Files Modified

- `index.html` - Added platform.js script loading
- `js/configuracao/configuracao.js` - Platform detection and desktop handlers
- `electron/preload.js` - Exposed listBackups IPC handler
- `electron/main.js` - Added list-backups IPC handler
- `electron/storage-backend.js` - Implemented backup listing

## Benefits

1. **No More Errors**: Desktop users see informative messages instead of errors
2. **Better UX**: Clear guidance on where data is stored and how to manage backups
3. **Platform Awareness**: Code adapts automatically to running environment
4. **Maintainability**: Separation of desktop vs. browser logic
5. **Future-Proof**: Easy to add more platform-specific features

## Related Documentation

- `docs/README-DESKTOP.md` - Desktop application usage
- `docs/SISTEMA-ARQUIVOS.md` - File system architecture
- `js/shared/platform.js` - Platform detection implementation
