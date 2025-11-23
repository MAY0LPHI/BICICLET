# Mudanças no Sistema Desktop - Versão 2.2.0

## 🔧 Reconfiguração Completa do Armazenamento

O sistema desktop foi completamente reconfigurado para salvar dados LOCALMENTE na pasta do projeto.

### ❌ ANTES (Sistema Antigo)
- Dados salvos em: `C:\Users\<SeuUsuário>\AppData\Roaming\bicicletario-desktop\`
- Estrutura complexa com múltiplas subpastas
- Sistema difícil de fazer backup
- Dados separados por CPF em arquivos individuais

### ✅ AGORA (Sistema Novo)
- Dados salvos em: `dados/desktop/` (pasta do projeto)
- Dois arquivos simples:
  - `clientes.json` - Todos os clientes
  - `registros.json` - Todos os registros
- Fácil de fazer backup (copiar 2 arquivos)
- Dados portáteis junto com o projeto

## 📁 Nova Estrutura de Arquivos

```
BICICLETARIO-27/
├── dados/
│   ├── desktop/
│   │   ├── clientes.json     ← TODOS os clientes aqui
│   │   └── registros.json    ← TODOS os registros aqui
│   └── navegador/
│       ├── clientes.json
│       └── registros.json
├── electron/
│   ├── main.js              ← API IPC simplificada
│   ├── preload.js           ← API exposta simplificada
│   └── storage-backend.js   ← Salva em dados/desktop/
└── js/
    └── shared/
        └── storage.js       ← Atualizado para nova API
```

## 🔄 Mudanças Técnicas

### 1. electron/storage-backend.js
**ANTES**: Sistema complexo com estrutura de pastas organizadas
```javascript
dados/desktop/
  ├── clientes/
  │   ├── 12345678900.json
  │   └── 98765432100.json
  └── registros/
      └── 2025/
          └── 11/
              └── 07.json
```

**AGORA**: Sistema simples com 2 arquivos JSON
```javascript
dados/desktop/
  ├── clientes.json    // Array com todos os clientes
  └── registros.json   // Array com todos os registros
```

### 2. electron/preload.js
**API Simplificada**:
```javascript
window.electron.loadClients()           // Carrega clientes
window.electron.saveClients(clients)    // Salva clientes
window.electron.loadRegistros()         // Carrega registros
window.electron.saveRegistros(registros)// Salva registros
window.electron.getStoragePath()        // Mostra onde está salvando
```

### 3. js/shared/storage.js
- Atualizado para usar a nova API simplificada
- Suporte completo ao Electron mantido
- Versão web continua funcionando normalmente

## 🎯 Benefícios

1. **Portabilidade**: Dados ficam junto com o projeto
2. **Backup Simples**: Copiar apenas 2 arquivos
3. **Sem Conflitos**: Não usa AppData do Windows
4. **Transparência**: Você sabe exatamente onde os dados estão
5. **Debugging Fácil**: Abra os JSONs e veja seus dados
6. **Migração Simples**: Copie a pasta `dados/` para outro computador

## 📋 Como Testar

### Passo 1: Execute o aplicativo desktop
```bash
npm start
```

### Passo 2: Adicione um cliente de teste
- Cadastre um cliente qualquer
- Adicione uma bicicleta a ele

### Passo 3: Verifique onde os dados foram salvos
Abra a pasta do projeto e vá em:
```
dados/desktop/clientes.json
```

Você verá um arquivo JSON com todos os clientes:
```json
[
  {
    "id": "abc123",
    "nome": "João Silva",
    "cpf": "123.456.789-00",
    "telefone": "(11) 98765-4321",
    "bicicletas": [...]
  }
]
```

### Passo 4: Faça um registro
- Registre uma entrada
- Verifique: `dados/desktop/registros.json`

## 🔒 Backup de Dados

### Para fazer backup:
```bash
# Copie a pasta dados/desktop para um local seguro
cp -r dados/desktop/ /seu/backup/local/
```

### Para restaurar:
```bash
# Copie de volta para o projeto
cp -r /seu/backup/local/desktop/ dados/
```

## ⚠️ Migração Automática

Se você estava usando a versão anterior:
- Os dados antigos continuam em AppData
- O sistema cria arquivos novos em `dados/desktop/`
- Você pode copiar manualmente do AppData se quiser

**Localização antiga** (apenas para referência):
```
C:\Users\<SeuUsuário>\AppData\Roaming\bicicletario-desktop\dados\desktop\
```

## 🧹 Código Limpo

- ✅ Removidos logs de debug excessivos
- ✅ Sistema de storage simplificado
- ✅ API clara e documentada
- ✅ Código mais fácil de manter

## 🚀 Próximos Passos

1. Execute `npm start` e teste
2. Cadastre alguns clientes
3. Verifique se os arquivos estão sendo criados em `dados/desktop/`
4. Faça backup copiando a pasta `dados/desktop/`

---

**Versão**: 2.2.0  
**Data**: 07/11/2025  
**Status**: Sistema Reconfigurado Completamente
