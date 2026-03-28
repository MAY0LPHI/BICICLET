/**
 * ============================================================
 *  ARQUIVO: constants.js
 *  DESCRIÇÃO: Constantes centralizadas do sistema de bicicletário
 *
 *  FUNÇÃO: Armazena todos os valores fixos ("números mágicos"
 *          e strings estáticas) usados em todo o projeto em
 *          um único lugar. Isso facilita manutenção: ao mudar
 *          um valor aqui, ele é atualizado em todo o sistema.
 *
 *  PARA INICIANTES:
 *  - Importe apenas o que precisar no seu arquivo:
 *      import { STORAGE_KEYS, USER_TYPES } from './shared/constants.js';
 *  - Nunca escreva strings "soltas" no código — sempre use estas constantes.
 *    Ex: use STORAGE_KEYS.CLIENTS em vez de 'bicicletario_clients'
 * ============================================================
 */

// ─────────────────────────────────────────────────────────
// Chaves de armazenamento (LocalStorage)
// Cada chave corresponde a um "compartimento" de dados no navegador.
// ─────────────────────────────────────────────────────────
export const STORAGE_KEYS = {
    CLIENTS: 'bicicletario_clients',    // Lista de clientes cadastrados
    REGISTROS: 'bicicletario_registros',  // Registros de entrada/saída
    USERS: 'bicicletario_users',      // Usuários do sistema (admin, funcionário)
    SESSION: 'bicicletario_session',    // Dados da sessão atual do usuário logado
    LOGIN_ATTEMPTS: 'login_attempts',          // Contador de tentativas de login falhas
    THEME: 'theme',                   // Tema da interface (claro/escuro)
    CATEGORIAS: 'bicicletario_categorias', // Categorias de clientes (Aluno, Professor etc.)
    AUDITORIA: 'bicicletario_auditoria',  // Log de auditoria (quem fez o quê)
    LOGS: 'bicicletario_logs'        // Logs do sistema para depuração
};

// ─────────────────────────────────────────────────────────
// Tipos de usuário do sistema
// Define os três papéis que um usuário pode ter.
// ─────────────────────────────────────────────────────────
export const USER_TYPES = {
    DONO: 'dono',        // Proprietário: acesso total ao sistema
    ADMIN: 'admin',       // Administrador: acesso amplo, exceto gerenciar donos
    FUNCIONARIO: 'funcionario'  // Funcionário: acesso limitado (registros apenas)
};

// ─────────────────────────────────────────────────────────
// Configurações de segurança
// ─────────────────────────────────────────────────────────
export const SECURITY = {
    MAX_LOGIN_ATTEMPTS: 5,                    // Máximo de tentativas antes de bloquear
    LOCKOUT_DURATION: 15 * 60 * 1000,      // Tempo de bloqueio após muitas tentativas: 15 minutos (em ms)
    PASSWORD_MIN_LENGTH: 6,                   // Comprimento mínimo de senha
    SESSION_TIMEOUT: 24 * 60 * 60 * 1000  // Tempo até a sessão expirar: 24 horas (em ms)
};

// ─────────────────────────────────────────────────────────
// Permissões padrão por tipo de usuário
// Define o que cada tipo de usuário pode ou não pode fazer.
// true = permitido, false = bloqueado.
// ─────────────────────────────────────────────────────────
export const DEFAULT_PERMISSIONS = {
    // DONO — Acesso irrestrito a tudo
    [USER_TYPES.DONO]: {
        clientes: { ver: true, adicionar: true, editar: true, excluir: true },
        registros: { ver: true, adicionar: true, editar: true, excluir: true },
        dados: {
            ver: true,
            exportar: true,
            importar: true,
            exportarDados: true,
            importarDados: true,
            exportarSistema: true,  // Pode fazer backup completo do sistema
            importarSistema: true   // Pode restaurar backup do sistema
        },
        configuracao: {
            ver: true,
            gerenciarUsuarios: true,
            buscaAvancada: true,
            adminMobile: true,
            acessoCelular: true
        },
        jogos: { ver: true }
    },

    // ADMIN — Acesso amplo, mas sem backup/restauração do sistema e sem gerenciar usuários
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
            buscaAvancada: true,
            adminMobile: true,
            acessoCelular: true
        },
        jogos: { ver: true }
    },

    // FUNCIONÁRIO — Acesso mínimo: apenas vê clientes e adiciona registros
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
            buscaAvancada: false,
            adminMobile: false,
            acessoCelular: false
        },
        jogos: { ver: false }
    }
};

// ─────────────────────────────────────────────────────────
// Constantes de interface do usuário (UI)
// ─────────────────────────────────────────────────────────
export const UI = {
    MODAL_ANIMATION_DURATION: 300,  // Duração da animação de modais em milissegundos
    TOAST_DURATION: 3000, // Tempo que uma notificação toast fica visível (3 segundos)
    DEBOUNCE_DELAY: 300,  // Atraso padrão para busca enquanto digita (300ms)
    PAGE_SIZE: 50,   // Número de itens por página na listagem
    MAX_SEARCH_RESULTS: 100   // Máximo de resultados a exibir em uma busca
};

// ─────────────────────────────────────────────────────────
// Formatos de data utilizados no sistema
// Estes são formatos de EXIBIÇÃO, não formatação real (use date-fns ou Intl para isso)
// ─────────────────────────────────────────────────────────
export const DATE_FORMATS = {
    DISPLAY: 'DD/MM/YYYY',          // Formato brasileiro para exibição
    DISPLAY_WITH_TIME: 'DD/MM/YYYY HH:mm',    // Formato com hora
    ISO: 'YYYY-MM-DD',           // Formato ISO para armazenamento
    FILE_NAME: 'YYYY-MM-DD_HHmmss'    // Formato para nome de arquivos exportados
};

// ─────────────────────────────────────────────────────────
// Regras de validação de dados
// ─────────────────────────────────────────────────────────
export const VALIDATION = {
    CPF_LENGTH: 11,                                   // CPF tem exatamente 11 dígitos
    CPF_REGEX: /^\d{3}\.\d{3}\.\d{3}-\d{2}$/,      // Formato: 000.000.000-00
    TELEFONE_REGEX: /^\(\d{2}\) \d{4,5}-\d{4}$/,        // Formato: (00) 00000-0000
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,        // Formato básico de e-mail
    MIN_NAME_LENGTH: 2,   // Nome deve ter pelo menos 2 caracteres
    MAX_NAME_LENGTH: 100, // Nome pode ter no máximo 100 caracteres
    MAX_COMMENT_LENGTH: 500  // Observações/comentários: no máximo 500 caracteres
};

// ─────────────────────────────────────────────────────────
// Formatos de exportação disponíveis
// ─────────────────────────────────────────────────────────
export const EXPORT_FORMATS = {
    CSV: 'csv',   // Planilha simples (compatível com Excel, Google Sheets)
    EXCEL: 'xlsx',  // Planilha Excel nativa
    PDF: 'pdf',   // Documento PDF
    JSON: 'json'   // Formato de dados estruturado (para backup/importação)
};

// ─────────────────────────────────────────────────────────
// Configuração da API do servidor
// ─────────────────────────────────────────────────────────
export const API = {
    BASE_URL: 'http://localhost:5001', // Endereço do servidor backend (local)
    ENDPOINTS: {
        CLIENTS: '/api/clients',   // Rota para listar/salvar todos os clientes
        CLIENT: '/api/client',    // Rota para um cliente específico
        REGISTROS: '/api/registros', // Rota para listar/salvar registros
        REGISTRO: '/api/registro',  // Rota para um registro específico
        HEALTH: '/api/health'     // Rota para verificar se o servidor está online
    }
};

// ─────────────────────────────────────────────────────────
// Mensagens de erro padronizadas
// Use estas constantes em vez de escrever mensagens soltas no código.
// ─────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────
// Mensagens de sucesso padronizadas
// ─────────────────────────────────────────────────────────
export const SUCCESS_MESSAGES = {
    SAVE: 'Dados salvos com sucesso!',
    DELETE: 'Removido com sucesso!',
    UPDATE: 'Atualizado com sucesso!',
    EXPORT: 'Exportado com sucesso!',
    IMPORT: 'Importado com sucesso!',
    LOGIN: 'Login realizado com sucesso!'
};

// ─────────────────────────────────────────────────────────
// Constantes de tema (aparência)
// ─────────────────────────────────────────────────────────
export const THEME = {
    LIGHT: 'light', // Tema claro (fundo branco)
    DARK: 'dark',  // Tema escuro (fundo preto/cinza)
    AUTO: 'auto'   // Automático: segue a preferência do sistema operacional
};

// ─────────────────────────────────────────────────────────
// Limites para upload de arquivos
// ─────────────────────────────────────────────────────────
export const FILE_LIMITS = {
    MAX_SIZE_MB: 10,                      // Tamanho máximo: 10 MB
    MAX_SIZE_BYTES: 10 * 1024 * 1024,       // Mesmo limite em bytes (para comparação)
    ALLOWED_TYPES: {
        IMAGES: ['image/jpeg', 'image/png', 'image/gif'],                                           // Imagens aceitas
        DOCUMENTS: ['application/pdf', 'application/msword'],                                           // Documentos aceitos
        SPREADSHEETS: ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'] // Planilhas aceitas
    }
};

// ─────────────────────────────────────────────────────────
// Categorias padrão de clientes (com emojis para a UI)
// Novas categorias podem ser criadas pelo painel de configuração.
// ─────────────────────────────────────────────────────────
export const DEFAULT_CATEGORIES = {
    'Aluno': '🎓',
    'Professor': '👨‍🏫',
    'Funcionário': '💼',
    'Visitante': '👋',
    'Mensalista': '📅'
};

// ─────────────────────────────────────────────────────────
// Tipos de ação para o log de auditoria
// Registra o que cada usuário fez no sistema.
// ─────────────────────────────────────────────────────────
export const AUDIT_ACTIONS = {
    CREATE: 'create', // Criou um registro/cliente
    UPDATE: 'update', // Editou um registro/cliente
    DELETE: 'delete', // Excluiu um registro/cliente
    VIEW: 'view',   // Visualizou dados sensíveis
    EXPORT: 'export', // Exportou dados
    IMPORT: 'import', // Importou dados
    LOGIN: 'login',  // Fez login no sistema
    LOGOUT: 'logout'  // Fez logout do sistema
};

// ─────────────────────────────────────────────────────────
// Constantes de status de registros/usuários
// ─────────────────────────────────────────────────────────
export const STATUS = {
    ACTIVE: 'active',   // Ativo (ex: bicicleta dentro do bicicletário)
    INACTIVE: 'inactive', // Inativo (ex: cliente desativado)
    PENDING: 'pending',  // Pendente (ex: aguardando aprovação)
    APPROVED: 'approved', // Aprovado
    REJECTED: 'rejected'  // Rejeitado
};
