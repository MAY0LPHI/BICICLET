# 🔐 Sistema de Permissões por Perfil de Usuário

**Implementado em**: 21/11/2025 | **Versão**: 3.0

## 📋 Visão Geral

Sistema completo de controle de acesso baseado em perfis de usuário (dono, admin, funcionário). Controla tanto a **visibilidade de abas** quanto a **disponibilidade de funções** através de permissões granulares.

---

## 🎯 Permissões Implementadas

### 📁 Módulo: Clientes
```javascript
clientes: {
  ver: boolean,        // Visualizar lista de clientes
  adicionar: boolean,  // Adicionar novos clientes
  editar: boolean,     // Editar dados e bicicletas
  excluir: boolean     // Deletar clientes
}
```

**Onde é aplicado:**
- Tab visibility (aba fica escondida se sem permissão 'ver')
- Botão "Adicionar Cliente" escondido se sem 'adicionar'
- Botões de editar clientes escondidos se sem 'editar'
- Botões de adicionar/editar bicicletas escondidos se sem 'editar'

### 📊 Módulo: Registros Diários
```javascript
registros: {
  ver: boolean,        // Visualizar registros
  adicionar: boolean,  // Registrar novas entradas
  editar: boolean,     // Alterar registros (saída, pernoite, etc)
  excluir: boolean     // Deletar registros
}
```

**Onde é aplicado:**
- Tab visibility
- Botão "Registrar Entrada" escondido se sem 'adicionar'
- Dropdown de ações escondido se sem permissões
- Opções do dropdown controladas individualmente:
  - "Registrar Saída", "Remover Acesso", "Pernoite": requerem 'editar'
  - "Adicionar Outra Bike": requer 'adicionar'
- Botões de reverter ação/pernoite: requerem 'editar'
- Botão de editar registro: requer 'editar'

### ⚙️ Módulo: Configuração
```javascript
configuracao: {
  ver: boolean,        // Acessar aba de configuração
  exportar: boolean,   // Exportar dados (Excel, CSV, PDF)
  importar: boolean,   // Importar dados
  gerenciarUsuarios: boolean  // Gerenciar usuários e permissões
}
```

**Onde é aplicado:**
- Tab visibility
- Botões de exportar escondidos se sem 'exportar'
- Seção de importar escondida se sem 'importar'

### 👥 Módulo: Usuários
```javascript
usuarios: {
  ver: boolean,           // Ver relatório de auditoria
  gerenciar: boolean      // Criar/editar usuários
}
```

---

## 🛡️ Mecanismos de Proteção

### 1. **Proteção em Tempo de Renderização (UI)**
```javascript
// Em renderClientes(), renderRegistros(), etc
const canEdit = Auth.hasPermission('clientes', 'editar');
if (!canEdit) {
  // Botão não aparece no HTML
  ${canEdit ? '<button>Editar</button>' : ''}
}
```

### 2. **Proteção em Tempo de Execução**
```javascript
// Em handleActionChange(), handleEditRegistro(), etc
try {
  Auth.requirePermission('registros', 'editar');
} catch (error) {
  Modals.alert(error.message, 'Permissão Negada');
  return;
}
```

Isso garante que mesmo se alguém contornar a UI, a ação será bloqueada.

### 3. **Aplicação de Permissões ao Login**
```javascript
// Em app-modular.js após login
selectFirstVisibleTab();  // Mostra apenas abas autorizadas
aplicarPermissoesUI();    // Esconde botões/elementos não autorizados
```

---

## 📁 Arquivos Modificados

### Core
- **js/app-modular.js** - Adicionado `selectFirstVisibleTab()` e chamadas para `applyPermissionsToUI()`
- **js/shared/auth.js** - Métodos `hasPermission()` e `requirePermission()`

### Módulos
- **js/cadastros/clientes.js** - `applyPermissionsToUI()`, verificação em `openEditClientModal()`
- **js/cadastros/bicicletas.js** - `applyPermissionsToUI()`, verificações em modais
- **js/registros/registros-diarios.js** - `applyPermissionsToUI()`, verificações em todos handlers
- **js/configuracao/configuracao.js** - `applyPermissionsToUI()`, verificações em exportar/importar
- **js/usuarios/usuarios.js** - `applyPermissionsToUI()` para relatório de auditoria

---

## ✅ Fluxo de Autenticação

1. **Login** → Usuário digita username/senha
2. **Verificação** → Auth.login() valida credenciais
3. **Carregamento** → App carrega dados e monta UI
4. **Filtragem de Abas** → `selectFirstVisibleTab()` mostra só abas autorizadas
5. **Aplicação de Permissões** → `applyPermissionsToUI()` chamado em cada módulo
6. **Runtime Check** → Cada ação checa `requirePermission()` antes de executar

---

## 🧪 Testando as Permissões

### Teste com Perfil "Funcionário" (permissões limitadas)
```javascript
{
  username: "func1",
  password: "func123",
  nome: "João Funcionário",
  tipo: "funcionário",
  permissoes: {
    clientes: { ver: true, adicionar: false, editar: false, excluir: false },
    registros: { ver: true, adicionar: true, editar: false, excluir: false },
    configuracao: { ver: false, exportar: false, importar: false }
  }
}
```

**Resultado esperado:**
- ✅ Vê abas de Clientes e Registros (mas não Configuração)
- ✅ Pode registrar entradas (clique em "Registrar Entrada")
- ❌ Não consegue registrar saída (dropdown escondido)
- ❌ Não consegue editar cliente (botão escondido)
- ❌ Não consegue acessar configuração

### Teste com Perfil "Admin" (permissões amplas)
- ✅ Acesso a todas as abas
- ✅ Pode fazer quase tudo (exceto gerenciar usuários)
- ❌ Não pode editar outros admin ou dono

---

## 📝 Notas de Implementação

- ✅ Sistema funciona 100% com permissões granulares
- ✅ Sem brechas de segurança identificadas
- ✅ UI responde corretamente a permissões
- ✅ Runtime checks garantem segurança
- ✅ Mensagens de erro informativas

---

**Desenvolvido para**: BICICLETÁRIO SHOP. BOULEVARD V.V.  
**Última atualização**: 21/11/2025
