# 📖 Guia Completo do Modo Offline

## 🎯 Introdução

Este guia explica como usar o Sistema de Gerenciamento de Bicicletário em modo offline completo, incluindo todas as funcionalidades disponíveis sem conexão à internet.

## 🚀 Início Rápido

### Instalação e Configuração

1. **Instalar Dependências Opcionais** (para criptografia avançada)
   ```bash
   pip install -r requirements.txt
   ```
   
   Se as dependências não puderem ser instaladas, o sistema funcionará com fallbacks:
   - **bcrypt** → SHA-256 com salt
   - **cryptography** → Dados não criptografados (ainda seguros com permissões de arquivo)

2. **Iniciar o Sistema**
   ```bash
   python3 server.py
   ```
   
   O servidor iniciará em:
   - **http://localhost:5000** - Interface principal
   - **http://localhost:5001** - API de armazenamento offline

3. **Acessar a Interface**
   - Abra o navegador em `http://localhost:5000`
   - Faça login com as credenciais padrão:
     - **admin** / **admin123** (Administrador)
     - **CELO123** / **CELO123** (Dono)

## 📴 Trabalhando Offline

### Ativando o Modo Offline

**Opção 1: Desconectar Internet**
- Desconecte WiFi ou cabo de rede
- O sistema detecta automaticamente e mostra indicador vermelho 🔴

**Opção 2: Simular Offline (Teste)**
- Abra DevTools (F12)
- Vá em Network > Marque "Offline"
- O indicador offline aparecerá automaticamente

### Indicadores Visuais

#### Status Offline 🔴
```
┌─────────────────────────────┐
│ 🔴 Modo Offline             │
└─────────────────────────────┘
```
Aparece no canto superior direito quando sem conexão.

#### Reconexão 🟢
```
┌─────────────────────────────┐
│ ✓ Online - Sincronizando... │
└─────────────────────────────┘
```
Aparece temporariamente quando a conexão é restaurada.

#### Sincronização Completa 🔵
```
┌─────────────────────────────┐
│ ↻ Sincronização Completa    │
└─────────────────────────────┘
```
Confirma que todas as operações pendentes foram sincronizadas.

## 🎮 Funcionalidades Offline

### 1. Autenticação

**Login Offline**
- Credenciais armazenadas localmente com hash seguro
- Tokens de sessão válidos por 7 dias
- Sem necessidade de servidor remoto

**Alterar Senha**
```python
# Via Python (se necessário)
from auth_manager import get_auth_manager

auth = get_auth_manager()
auth.change_password('usuario', 'senha_antiga', 'senha_nova')
```

### 2. Cadastro de Clientes

**Criar Cliente**
1. Acesse "Cadastros" > "Clientes"
2. Preencha o formulário:
   - Nome completo
   - CPF (validado automaticamente)
   - Telefone
   - Categoria (opcional)
   - Comentários (opcional)
3. Clique em "Salvar"

**Modo Offline:**
- Cliente salvo no SQLite local
- Se SQLite não disponível → arquivos JSON
- Se arquivos não disponíveis → LocalStorage
- **Operação enfileirada** para sincronização

### 3. Cadastro de Bicicletas

**Adicionar Bicicleta**
1. Selecione um cliente
2. Clique em "Adicionar Bicicleta"
3. Preencha:
   - Descrição
   - Marca
   - Modelo
   - Cor
   - Aro
4. Salve

**Modo Offline:**
- Bicicleta vinculada ao cliente localmente
- Sincronização automática quando online

### 4. Registros de Entrada/Saída

**Registrar Entrada**
1. Acesse "Registros" > "Entrada/Saída"
2. Selecione cliente
3. Selecione bicicleta
4. Marque "Pernoite" se aplicável
5. Confirme entrada

**Registrar Saída**
1. Localize o registro ativo
2. Clique em "Registrar Saída"
3. Confirmado automaticamente

**Modo Offline:**
- Registro salvo com timestamp local
- Sincronização preserva ordem cronológica

### 5. Exportação de Dados

**Exportar Logs de Auditoria**
```python
from log_exporter import get_log_exporter
from db_manager import get_db_manager

db = get_db_manager()
exporter = get_log_exporter()

# Busca logs
logs = db.get_audit_logs(100)

# Exporta para CSV
exporter.export_audit_log_csv(logs)

# Exporta para TXT
exporter.export_audit_log_txt(logs)
```

**Exportar Relatório de Clientes**
```python
# Busca clientes
clientes = db.get_all_clientes()

# Exporta
exporter.export_clients_report_csv(clientes)
```

**Exportar Registros**
```python
# Busca registros
registros = db.get_all_registros()

# Exporta
exporter.export_registros_report_csv(registros)
```

**Resumo Diário**
```python
# Resumo de hoje
from datetime import date
today = date.today().isoformat()

registros = db.get_all_registros()
exporter.export_daily_summary_txt(today, registros)
```

### 6. Backup e Restauração

**Criar Backup**
```python
from db_manager import get_db_manager

db = get_db_manager()

# Backup ZIP (compactado)
backup_zip = db.create_backup('zip')
print(f"Backup criado: {backup_zip}")

# Backup JSON (legível)
backup_json = db.create_backup('json')
print(f"Backup criado: {backup_json}")
```

**Restaurar Backup**
```python
# Restaura de ZIP
db.restore_backup('dados/database/backups/backup_20260103_120000.zip')

# Restaura de JSON
db.restore_backup('dados/database/backups/backup_20260103_120000.json')
```

**Backup Manual via Interface** (futuro)
- Acesse "Configuração" > "Backup"
- Clique em "Criar Backup"
- Escolha formato (ZIP ou JSON)
- Download automático

## 🔄 Sincronização

### Como Funciona

1. **Operações Offline** são enfileiradas automaticamente
2. **Detecção de Conexão** monitora status online/offline
3. **Sincronização Automática** quando conexão retorna
4. **Confirmação Visual** após conclusão

### Verificar Fila de Sincronização

**Via JavaScript (Console do Navegador)**
```javascript
// Importa o módulo
import { getOfflineStorage } from './js/shared/offline-storage.js';

// Instância
const storage = getOfflineStorage();

// Verifica pendências
const pending = await storage.getPendingSync();
console.log(`Operações pendentes: ${pending.length}`);
```

**Via API REST**
```bash
# GET status
curl http://localhost:5001/api/sync/status

# Response
{
  "pending_count": 5,
  "pending_operations": [
    {
      "id": 1,
      "storeName": "clientes",
      "operation": "save",
      "timestamp": "2026-01-03T10:00:00",
      "synced": false
    }
  ]
}
```

### Forçar Sincronização

**Via Interface** (futuro)
- Clique no ícone de status (canto superior direito)
- Selecione "Sincronizar Agora"

**Via JavaScript**
```javascript
const storage = getOfflineStorage();
await storage.syncPendingOperations();
```

## 🔒 Segurança

### Proteção de Dados

1. **Senhas**
   - Hash bcrypt (12 rounds) ou SHA-256 com salt
   - Nunca armazenadas em texto plano
   - Tokens de sessão criptografados

2. **Dados Sensíveis**
   - Criptografia AES (se cryptography instalado)
   - Arquivos com permissões 600 (apenas proprietário)
   - Chave de criptografia em arquivo protegido

3. **Backups**
   - Backups ZIP com compressão
   - Backups JSON legíveis mas protegidos
   - Histórico de backups mantido

### Boas Práticas

✅ **Fazer**
- Alterar senhas padrão na primeira execução
- Fazer backups regulares (diário/semanal)
- Proteger acesso físico ao servidor
- Manter sistema operacional atualizado
- Usar senhas fortes (mínimo 8 caracteres)

❌ **Não Fazer**
- Compartilhar arquivo `.key` (criptografia)
- Expor porta 5001 publicamente
- Usar credenciais padrão em produção
- Ignorar avisos de segurança

## 📊 Relatórios

### Tipos de Relatórios

1. **Auditoria**
   - Todas as ações do sistema
   - Usuário, ação, detalhes, timestamp
   - Formatos: CSV, TXT

2. **Clientes**
   - Lista completa de clientes
   - Total de bicicletas por cliente
   - Status ativo/inativo
   - Formato: CSV

3. **Registros**
   - Entrada/saída de bicicletas
   - Status de pernoite
   - Cliente associado
   - Formato: CSV

4. **Resumo Diário**
   - Estatísticas do dia
   - Total entradas/saídas
   - Bicicletas no local
   - Formato: TXT formatado

### Localização dos Arquivos

```
dados/
├── logs/
│   ├── auditoria_YYYYMMDD_HHMMSS.csv
│   └── auditoria_YYYYMMDD_HHMMSS.txt
│
├── relatorios/
│   ├── clientes_YYYYMMDD_HHMMSS.csv
│   ├── registros_YYYYMMDD_HHMMSS.csv
│   └── resumo_diario_YYYYMMDD.txt
│
└── database/
    └── backups/
        ├── backup_YYYYMMDD_HHMMSS.zip
        └── backup_YYYYMMDD_HHMMSS.json
```

## 🛠️ Troubleshooting

### Problema: Sistema não inicia

**Sintoma**: Erro ao executar `python3 server.py`

**Soluções**:
1. Verifique Python 3.12+ instalado:
   ```bash
   python3 --version
   ```

2. Verifique permissões do diretório:
   ```bash
   ls -la dados/
   ```

3. Verifique logs:
   ```bash
   tail -f dados/logs/*.log
   ```

### Problema: Banco de dados corrompido

**Sintoma**: Erro ao acessar SQLite

**Soluções**:
1. Verifique integridade:
   ```bash
   sqlite3 dados/database/bicicletario.db "PRAGMA integrity_check;"
   ```

2. Restaure de backup:
   ```python
   from db_manager import get_db_manager
   db = get_db_manager()
   db.restore_backup('dados/database/backups/backup_ULTIMO.zip')
   ```

3. Recrie banco (perda de dados):
   ```bash
   rm dados/database/bicicletario.db
   python3 db_manager.py
   ```

### Problema: Sincronização não funciona

**Sintoma**: Operações não sincronizam quando online

**Soluções**:
1. Verifique conexão:
   ```bash
   curl http://localhost:5001/api/health
   ```

2. Limpe cache:
   - DevTools > Application > Clear Storage
   - Recarregue página

3. Verifique logs de erro no console do navegador

### Problema: Senha esquecida

**Sintoma**: Não consegue fazer login

**Soluções**:
1. Resete senha de admin:
   ```python
   from auth_manager import get_auth_manager
   
   auth = get_auth_manager()
   auth.change_password('admin', 'admin123', 'nova_senha_forte')
   ```

2. Ou recrie usuários:
   ```bash
   rm dados/auth/users.json
   python3 auth_manager.py
   ```

## 📞 Suporte

### Logs e Diagnóstico

**Ver logs do servidor**:
```bash
tail -f dados/logs/server.log
```

**Ver logs de auditoria**:
```bash
cat dados/logs/auditoria_*.txt | tail -50
```

**Verificar status do sistema**:
```bash
curl http://localhost:5001/api/health
```

### Informações do Sistema

```bash
# Versão Python
python3 --version

# Versão SQLite
python3 -c "import sqlite3; print(sqlite3.sqlite_version)"

# Tamanho do banco
du -h dados/database/bicicletario.db

# Total de backups
ls -lh dados/database/backups/ | wc -l
```

## 🎓 Recursos Adicionais

- **Documentação Técnica**: `docs/FUNCIONAMENTO-OFFLINE.md`
- **Arquitetura**: Diagrama de fluxo na documentação
- **Código-fonte**: Módulos Python bem documentados
- **Testes**: Scripts de teste incluídos em cada módulo

## 📝 Changelog

**Versão 3.1 (Janeiro 2026)**
- ✅ SQLite completo com backup automático
- ✅ Autenticação offline com bcrypt/AES
- ✅ IndexedDB com sincronização
- ✅ Exportação de logs em CSV/TXT
- ✅ Sistema de fila de sincronização
- ✅ Indicadores visuais de status

---

**Última Atualização**: Janeiro 2026  
**Versão**: 3.1 - Sistema Offline Completo
