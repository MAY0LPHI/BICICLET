/**
 * Application Constants
 * Centralized location for all magic numbers and strings
 */

// Storage Keys
export const STORAGE_KEYS = {
    CLIENTS: 'bicicletario_clients',
    REGISTROS: 'bicicletario_registros',
    USERS: 'bicicletario_users',
    SESSION: 'bicicletario_session',
    LOGIN_ATTEMPTS: 'login_attempts',
    THEME: 'theme',
    CATEGORIAS: 'bicicletario_categorias',
    AUDITORIA: 'bicicletario_auditoria',
    LOGS: 'bicicletario_logs'
};

// User Types
export const USER_TYPES = {
    DONO: 'dono',
    ADMIN: 'admin',
    FUNCIONARIO: 'funcionario'
};

// Security Constants
export const SECURITY = {
    MAX_LOGIN_ATTEMPTS: 5,
    LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
    PASSWORD_MIN_LENGTH: 6,
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000 // 24 hours
};

// Default Permissions
export const DEFAULT_PERMISSIONS = {
    [USER_TYPES.DONO]: {
        clientes: { ver: true, adicionar: true, editar: true, excluir: true },
        registros: { ver: true, adicionar: true, editar: true, excluir: true },
        dados: { 
            ver: true, 
            exportar: true, 
            importar: true,
            exportarDados: true,
            importarDados: true,
            exportarSistema: true,
            importarSistema: true
        },
        configuracao: { 
            ver: true, 
            gerenciarUsuarios: true,
            buscaAvancada: true
        },
        jogos: { ver: true }
    },
    [USER_TYPES.ADMIN]: {
        clientes: { ver: true, adicionar: true, editar: true, excluir: true },
        registros: { ver: true, adicionar: true, editar: true, excluir: true },
        dados: { 
            ver: true, 
            exportar: true, 
            importar: true,
            exportarDados: true,
            importarDados: true,
            exportarSistema: false,
            importarSistema: false
        },
        configuracao: { 
            ver: true, 
            gerenciarUsuarios: false,
            buscaAvancada: true
        },
        jogos: { ver: true }
    },
    [USER_TYPES.FUNCIONARIO]: {
        clientes: { ver: true, adicionar: false, editar: false, excluir: false },
        registros: { ver: true, adicionar: true, editar: false, excluir: false },
        dados: { 
            ver: false, 
            exportar: false, 
            importar: false,
            exportarDados: false,
            importarDados: false,
            exportarSistema: false,
            importarSistema: false
        },
        configuracao: { 
            ver: false, 
            gerenciarUsuarios: false,
            buscaAvancada: false
        },
        jogos: { ver: false }
    }
};

// UI Constants
export const UI = {
    MODAL_ANIMATION_DURATION: 300,
    TOAST_DURATION: 3000,
    DEBOUNCE_DELAY: 300,
    PAGE_SIZE: 50,
    MAX_SEARCH_RESULTS: 100
};

// Date Formats
export const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',
    ISO: 'YYYY-MM-DD',
    FILE_NAME: 'YYYY-MM-DD_HHmmss'
};

// Validation Rules
export const VALIDATION = {
    CPF_LENGTH: 11,
    CPF_REGEX: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,
    TELEFONE_REGEX: /^\(\d{2}\) \d{4,5}-\d{4}$/,
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    MIN_NAME_LENGTH: 2,
    MAX_NAME_LENGTH: 100,
    MAX_COMMENT_LENGTH: 500
};

// Export Formats
export const EXPORT_FORMATS = {
    CSV: 'csv',
    EXCEL: 'xlsx',
    PDF: 'pdf',
    JSON: 'json'
};

// API Endpoints
export const API = {
    BASE_URL: 'http://localhost:5001',
    ENDPOINTS: {
        CLIENTS: '/api/clients',
        CLIENT: '/api/client',
        REGISTROS: '/api/registros',
        REGISTRO: '/api/registro',
        HEALTH: '/api/health'
    }
};

// Error Messages
export const ERROR_MESSAGES = {
    GENERIC: 'Ocorreu um erro inesperado. Tente novamente.',
    NETWORK: 'Erro de conexão. Verifique sua internet.',
    VALIDATION: 'Por favor, verifique os dados informados.',
    PERMISSION_DENIED: 'Você não tem permissão para realizar esta ação.',
    AUTHENTICATION_FAILED: 'Usuário ou senha incorretos.',
    SESSION_EXPIRED: 'Sua sessão expirou. Faça login novamente.',
    CPF_INVALID: 'CPF inválido.',
    CPF_DUPLICATE: 'CPF já cadastrado.',
    REQUIRED_FIELDS: 'Preencha todos os campos obrigatórios.',
    FILE_UPLOAD_FAILED: 'Erro ao fazer upload do arquivo.'
};

// Success Messages
export const SUCCESS_MESSAGES = {
    SAVE: 'Dados salvos com sucesso!',
    DELETE: 'Removido com sucesso!',
    UPDATE: 'Atualizado com sucesso!',
    EXPORT: 'Exportado com sucesso!',
    IMPORT: 'Importado com sucesso!',
    LOGIN: 'Login realizado com sucesso!'
};

// Theme Constants
export const THEME = {
    LIGHT: 'light',
    DARK: 'dark',
    AUTO: 'auto'
};

// File Size Limits
export const FILE_LIMITS = {
    MAX_SIZE_MB: 10,
    MAX_SIZE_BYTES: 10 * 1024 * 1024,
    ALLOWED_TYPES: {
        IMAGES: ['image/jpeg', 'image/png', 'image/gif'],
        DOCUMENTS: ['application/pdf', 'application/msword'],
        SPREADSHEETS: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    }
};

// Default Categories (with emojis)
export const DEFAULT_CATEGORIES = {
    'Aluno': '🎓',
    'Professor': '👨‍🏫',
    'Funcionário': '💼',
    'Visitante': '👋',
    'Mensalista': '📅'
};

// Audit Action Types
export const AUDIT_ACTIONS = {
    CREATE: 'create',
    UPDATE: 'update',
    DELETE: 'delete',
    VIEW: 'view',
    EXPORT: 'export',
    IMPORT: 'import',
    LOGIN: 'login',
    LOGOUT: 'logout'
};

// Status Constants
export const STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
};
