# 🤝 Guia de Contribuição

Obrigado pelo interesse em contribuir com o Sistema de Gerenciamento de Bicicletário! Este guia fornece instruções para contribuir de forma efetiva.

## Índice

- [Código de Conduta](#código-de-conduta)
- [Como Contribuir](#como-contribuir)
- [Padrões de Código](#padrões-de-código)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Testes](#testes)
- [Processo de Pull Request](#processo-de-pull-request)

---

## Código de Conduta

Este projeto adere a um código de conduta para criar um ambiente acolhedor e inclusivo. Ao participar, você concorda em manter este padrão.

### Nossas Expectativas

- Seja respeitoso com todos os contribuidores
- Use linguagem inclusiva e acolhedora
- Aceite críticas construtivas com graça
- Foque no que é melhor para a comunidade
- Mostre empatia com outros membros

---

## Como Contribuir

### Reportando Bugs

1. **Verifique** se o bug já não foi reportado
2. **Inclua** informações detalhadas:
   - Passos para reproduzir
   - Comportamento esperado
   - Comportamento atual
   - Screenshots (se aplicável)
   - Versão do navegador/sistema
   - Logs de console (Ctrl+Shift+J)

### Sugerindo Melhorias

1. **Verifique** se a sugestão já existe
2. **Descreva** claramente:
   - O problema que resolve
   - Como deve funcionar
   - Alternativas consideradas
   - Impacto em funcionalidades existentes

### Contribuindo Código

1. **Fork** o repositório
2. **Crie** uma branch (`git checkout -b feature/nova-funcionalidade`)
3. **Commit** suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. **Push** para a branch (`git push origin feature/nova-funcionalidade`)
5. **Abra** um Pull Request

---

## Padrões de Código

### JavaScript

#### Estilo de Código

```javascript
// ✅ Use camelCase para variáveis e funções
const minhaVariavel = 'valor';
function minhaFuncao() {}

// ✅ Use PascalCase para classes
class MinhaClasse {}

// ✅ Use UPPER_SNAKE_CASE para constantes
const VALOR_MAXIMO = 100;

// ✅ Indentação: 4 espaços
function exemplo() {
    if (condicao) {
        fazAlgo();
    }
}

// ✅ Sempre use ponto e vírgula
const valor = 10;
```

#### Segurança

```javascript
// ✅ SEMPRE sanitize user input
import { Sanitizer } from './shared/sanitizer.js';
element.textContent = Sanitizer.sanitizeInput(userInput);

// ❌ NUNCA use innerHTML com dados do usuário
// element.innerHTML = userInput;  // PERIGOSO!

// ✅ Use constantes centralizadas
import { STORAGE_KEYS } from './shared/constants.js';
localStorage.getItem(STORAGE_KEYS.CLIENTS);

// ✅ Sempre valide permissões
Auth.requirePermission('clientes', 'adicionar');
```

#### Tratamento de Erros

```javascript
// ✅ Use try-catch em operações assíncronas
try {
    const result = await operacaoAssincrona();
    logger.info('Operação concluída', { result });
} catch (error) {
    logger.error('Erro na operação', { error });
    await Modals.showAlert('Erro ao processar');
}

// ✅ Log errors com contexto
logger.error('Erro ao salvar cliente', {
    clientId: client.id,
    error: error.message
});
```

#### Documentação

```javascript
/**
 * Adiciona um novo cliente ao sistema
 * @param {Object} client - Dados do cliente
 * @param {string} client.nome - Nome completo
 * @param {string} client.cpf - CPF formatado
 * @param {string} [client.telefone] - Telefone opcional
 * @returns {Promise<Object>} Cliente salvo com ID
 * @throws {Error} Se CPF for inválido ou duplicado
 */
async function adicionarCliente(client) {
    // Implementação
}
```

### Python

#### Estilo de Código

```python
# ✅ Use snake_case para funções e variáveis
minha_variavel = 'valor'

def minha_funcao():
    pass

# ✅ Use PascalCase para classes
class MinhaClasse:
    pass

# ✅ Use docstrings
def processar_dados(dados):
    """
    Processa dados de entrada e retorna resultado
    
    Args:
        dados (dict): Dicionário com dados
        
    Returns:
        dict: Dados processados
        
    Raises:
        ValueError: Se dados forem inválidos
    """
    pass
```

#### Logging

```python
import logging

logger = logging.getLogger(__name__)

# ✅ Use níveis apropriados
logger.debug('Informação detalhada')
logger.info('Operação normal')
logger.warning('Aviso')
logger.error('Erro', exc_info=True)
```

---

## Estrutura do Projeto

```
bicicletario/
├── js/                       # JavaScript modular
│   ├── shared/              # Utilitários compartilhados
│   │   ├── sanitizer.js    # Sanitização (IMPORTANTE!)
│   │   ├── logger.js       # Sistema de logging
│   │   ├── constants.js    # Constantes da aplicação
│   │   ├── auth.js         # Autenticação
│   │   └── utils.js        # Funções utilitárias
│   ├── cadastros/          # Módulos de cadastro
│   ├── registros/          # Controle de entrada/saída
│   ├── usuarios/           # Gerenciamento de usuários
│   └── configuracao/       # Configurações
├── docs/                    # Documentação
│   ├── SECURITY.md         # Práticas de segurança
│   └── CONTRIBUTING.md     # Este arquivo
├── server.py               # Servidor HTTP Python
├── storage_api.py          # API de armazenamento
└── index.html              # Página principal
```

### Módulos Importantes

1. **sanitizer.js** - SEMPRE use para prevenir XSS
2. **logger.js** - Sistema centralizado de logging
3. **constants.js** - Todas as constantes da aplicação
4. **auth.js** - Autenticação e controle de sessão

---

## Testes

### Testes Manuais

Antes de submeter um PR, teste:

1. **Funcionalidade Principal**
   - Adicionar cliente
   - Registrar entrada/saída
   - Exportar dados

2. **Segurança**
   - Input com HTML tags
   - Input com scripts
   - Validação de CPF

3. **Navegadores**
   - Chrome/Edge (último)
   - Firefox (último)
   - Safari (último)

4. **Responsividade**
   - Desktop (1920x1080)
   - Tablet (768x1024)
   - Mobile (375x667)

### Testes Automatizados (Futuro)

```bash
# Quando implementado
npm test                 # Executar todos os testes
npm run test:coverage    # Ver cobertura
npm run test:watch       # Modo watch
```

---

## Processo de Pull Request

### Antes de Submeter

- [ ] Código segue os padrões do projeto
- [ ] Código foi testado manualmente
- [ ] Sem erros no console
- [ ] Documentação atualizada (se necessário)
- [ ] Commit messages são claras
- [ ] Branch está atualizada com main

### Template de PR

```markdown
## Descrição
[Descreva as mudanças]

## Tipo de Mudança
- [ ] Bug fix
- [ ] Nova funcionalidade
- [ ] Melhoria de código
- [ ] Documentação
- [ ] Segurança

## Como Testar
1. [Passo 1]
2. [Passo 2]
3. [Passo 3]

## Screenshots
[Se aplicável]

## Checklist
- [ ] Código testado
- [ ] Documentação atualizada
- [ ] Sem console.log esquecidos
- [ ] Inputs sanitizados
- [ ] Permissões verificadas
```

### Revisão

Seu PR será revisado para:

1. **Qualidade do Código**
   - Legibilidade
   - Manutenibilidade
   - Padrões do projeto

2. **Segurança**
   - Sanitização de inputs
   - Validação de permissões
   - Sem vulnerabilidades

3. **Funcionalidade**
   - Funciona conforme esperado
   - Não quebra funcionalidades existentes
   - Edge cases tratados

4. **Documentação**
   - Comentários úteis
   - README atualizado
   - Docs atualizadas

---

## Boas Práticas

### Commits

```bash
# ✅ Boas mensagens de commit
git commit -m "Fix: Corrige validação de CPF"
git commit -m "Feat: Adiciona export PDF"
git commit -m "Docs: Atualiza README com novos recursos"
git commit -m "Security: Adiciona sanitização em inputs"

# ❌ Evite mensagens vagas
git commit -m "fix"
git commit -m "Update"
git commit -m "Changes"
```

### Prefixos de Commit

- `Feat:` - Nova funcionalidade
- `Fix:` - Correção de bug
- `Docs:` - Documentação
- `Style:` - Formatação
- `Refactor:` - Refatoração
- `Test:` - Testes
- `Security:` - Melhorias de segurança
- `Perf:` - Melhorias de performance

### Code Review

Ao revisar código:

1. Seja construtivo e respeitoso
2. Explique o "porquê", não apenas o "o quê"
3. Sugira alternativas
4. Reconheça boas práticas
5. Foque em aprender e ensinar

---

## Recursos

### Documentação

- [README.md](../README.md) - Visão geral do projeto
- [SECURITY.md](SECURITY.md) - Práticas de segurança
- [docs/](.) - Documentação detalhada

### Ferramentas

- [MDN Web Docs](https://developer.mozilla.org/) - Referência web
- [OWASP](https://owasp.org/) - Segurança
- [Can I Use](https://caniuse.com/) - Compatibilidade

---

## Dúvidas?

- Abra uma [issue](https://github.com/MAY0LPHI/BICICLETARIO/issues)
- Consulte a [documentação](.)
- Revise [PRs anteriores](https://github.com/MAY0LPHI/BICICLETARIO/pulls)

---

## Licença

Ao contribuir, você concorda que suas contribuições serão licenciadas sob a mesma licença do projeto (MIT).

---

**Obrigado por contribuir! 🎉**
