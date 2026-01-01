# 🔐 Práticas de Segurança

## Visão Geral

Este documento descreve as práticas de segurança implementadas no Sistema de Gerenciamento de Bicicletário para proteger contra vulnerabilidades comuns.

## Índice

- [Prevenção de XSS](#prevenção-de-xss)
- [Autenticação e Sessões](#autenticação-e-sessões)
- [Validação de Dados](#validação-de-dados)
- [Headers de Segurança](#headers-de-segurança)
- [Armazenamento Seguro](#armazenamento-seguro)
- [Logging e Auditoria](#logging-e-auditoria)

---

## Prevenção de XSS

### Problema
Cross-Site Scripting (XSS) permite que atacantes injetem scripts maliciosos em páginas web.

### Solução Implementada

#### 1. Módulo de Sanitização (`js/shared/sanitizer.js`)

```javascript
import { Sanitizer } from './shared/sanitizer.js';

// NUNCA use innerHTML diretamente
// ❌ element.innerHTML = userInput;

// ✅ Use sanitização
element.textContent = Sanitizer.sanitizeInput(userInput);

// ✅ Ou escape HTML
element.innerHTML = Sanitizer.escapeHtml(userInput);
```

#### 2. Funções Seguras

- `Sanitizer.escapeHtml(str)` - Escapa caracteres HTML especiais
- `Sanitizer.sanitizeInput(input)` - Remove tags e scripts
- `Sanitizer.sanitizeUrl(url)` - Valida e sanitiza URLs
- `Sanitizer.createElement(tag, text, className)` - Cria elementos seguros

#### 3. Regras de Uso

**DO:**
```javascript
// Use textContent para texto simples
element.textContent = userInput;

// Use o módulo Sanitizer
const safeText = Sanitizer.sanitizeInput(userInput);
element.textContent = safeText;

// Crie elementos de forma programática
const div = Sanitizer.createElement('div', safeText, 'my-class');
```

**DON'T:**
```javascript
// ❌ Nunca use innerHTML com dados do usuário
element.innerHTML = userInput;

// ❌ Nunca use eval()
eval(userCode);

// ❌ Nunca use document.write()
document.write(content);
```

---

## Autenticação e Sessões

### Hash de Senhas

```javascript
// Usando SHA-256 do Web Crypto API
const hashedPassword = await Auth.hashPassword(password);
```

**Características:**
- Hash SHA-256 unidirecional
- Senhas nunca armazenadas em texto plano
- Validação apenas por comparação de hash

### Proteção Contra Força Bruta

```javascript
// Constantes de segurança
const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutos
```

**Mecanismo:**
1. Contador de tentativas de login
2. Bloqueio temporário após 5 tentativas
3. Reset automático após 15 minutos

### Gerenciamento de Sessão

```javascript
// Sessão armazenada com validação
{
    userId: 'user-id',
    username: 'user',
    loginTime: timestamp,
    requirePasswordChange: false
}
```

**Boas Práticas:**
- Timeout de sessão: 24 horas
- Validação em cada ação sensível
- Logout adequado limpa todas as informações

---

## Validação de Dados

### Cliente (Frontend)

```javascript
import { VALIDATION } from './shared/constants.js';

// Validação de CPF
if (!Utils.validateCPF(cpf)) {
    throw new Error('CPF inválido');
}

// Validação de formato
if (!VALIDATION.CPF_REGEX.test(cpf)) {
    throw new Error('Formato de CPF inválido');
}
```

### Servidor (Backend)

```python
# storage_api.py - Validação de entrada
def save_client(self):
    try:
        content_length = int(self.headers['Content-Length'])
        # Limite de tamanho
        if content_length > 10 * 1024 * 1024:  # 10MB
            self._set_headers(413)
            return
        
        post_data = self.rfile.read(content_length)
        client = json.loads(post_data.decode('utf-8'))
        
        # Validação de dados
        if not client.get('cpf'):
            self._set_headers(400)
            return
        
        # Processamento...
    except Exception as e:
        logger.error(f"Erro: {e}")
        self._set_headers(500)
```

### Regras de Validação

| Campo | Regra |
|-------|-------|
| CPF | 11 dígitos, formato válido |
| Nome | 2-100 caracteres |
| Telefone | Formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX |
| Email | Formato válido RFC 5322 |
| Comentários | Máximo 500 caracteres |

---

## Headers de Segurança

### Servidor Python

```python
def end_headers(self):
    # Controle de Cache
    self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
    
    # Security Headers
    self.send_header('X-Content-Type-Options', 'nosniff')
    self.send_header('X-Frame-Options', 'SAMEORIGIN')
    self.send_header('X-XSS-Protection', '1; mode=block')
    self.send_header('Referrer-Policy', 'strict-origin-when-cross-origin')
    
    # Content Security Policy
    csp = (
        "default-src 'self'; "
        "script-src 'self' 'unsafe-inline' 'unsafe-eval'; "
        "style-src 'self' 'unsafe-inline'; "
        "img-src 'self' data: https:; "
        "connect-src 'self' http://localhost:5001"
    )
    self.send_header('Content-Security-Policy', csp)
```

### Descrição dos Headers

| Header | Proteção |
|--------|----------|
| `X-Content-Type-Options: nosniff` | Previne MIME type sniffing |
| `X-Frame-Options: SAMEORIGIN` | Previne clickjacking |
| `X-XSS-Protection: 1; mode=block` | Proteção adicional contra XSS |
| `Referrer-Policy` | Controla informações de referer |
| `Content-Security-Policy` | Define fontes confiáveis de conteúdo |

---

## Armazenamento Seguro

### LocalStorage

**Boas Práticas:**
```javascript
// ✅ Armazene apenas dados não-sensíveis
localStorage.setItem('theme', 'dark');

// ❌ NUNCA armazene senhas ou tokens em texto plano
// localStorage.setItem('password', 'senha123'); // ERRADO!

// ✅ Armazene apenas hashes
localStorage.setItem('passwordHash', hashedPassword);
```

### Arquivos JSON

**Permissões:**
- Arquivos de dados: somente leitura/escrita pelo app
- Sem exposição via servidor web
- Armazenados fora do diretório público

---

## Logging e Auditoria

### Sistema de Logging

```javascript
import { logger } from './shared/logger.js';

// Níveis de log
logger.debug('Informação detalhada');
logger.info('Operação realizada');
logger.warn('Aviso de possível problema');
logger.error('Erro capturado', { error: e });
logger.fatal('Erro crítico do sistema');
```

### Auditoria de Ações

```javascript
import { logAction } from './shared/audit-logger.js';

// Registro de ação com contexto
logAction('create', 'clients', {
    clientId: client.id,
    clientName: client.nome
});
```

**Informações Registradas:**
- Timestamp
- Usuário responsável
- Ação realizada
- Entidade afetada
- Detalhes adicionais

---

## Checklist de Segurança

### Para Desenvolvedores

- [ ] Sempre validar input do usuário
- [ ] Nunca usar `innerHTML` com dados não sanitizados
- [ ] Nunca usar `eval()` ou `Function()`
- [ ] Sempre escapar dados antes de exibir
- [ ] Validar permissões antes de ações sensíveis
- [ ] Usar HTTPS em produção
- [ ] Manter dependências atualizadas
- [ ] Revisar código para vulnerabilidades
- [ ] Testar com dados maliciosos
- [ ] Documentar mudanças de segurança

### Para Administradores

- [ ] Usar senhas fortes
- [ ] Mudar senha padrão imediatamente
- [ ] Revisar logs regularmente
- [ ] Fazer backup dos dados
- [ ] Manter sistema atualizado
- [ ] Limitar acessos por função
- [ ] Monitorar tentativas de login falhas
- [ ] Educar usuários sobre segurança

---

## Reportando Vulnerabilidades

Se você descobrir uma vulnerabilidade de segurança, por favor:

1. **NÃO** abra uma issue pública
2. Envie um email para o mantenedor
3. Inclua:
   - Descrição da vulnerabilidade
   - Passos para reproduzir
   - Impacto potencial
   - Sugestão de correção (opcional)

---

## Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
- [Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API)

---

**Última atualização:** 1º de Janeiro de 2026  
**Versão:** 3.1
