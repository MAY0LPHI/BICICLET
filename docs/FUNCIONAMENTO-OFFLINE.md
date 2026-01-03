# 🌐 Funcionamento Offline Completo

## Visão Geral

A aplicação está **totalmente configurada para funcionar sem conexão à internet** com múltiplas camadas de armazenamento e sincronização automática.

## 🎯 Recursos Offline

### 📦 Armazenamento Multi-Camada

1. **SQLite (Banco de Dados Local)**
   - Armazenamento estruturado e persistente
   - Backup automático em .zip/.json
   - Suporte a transações ACID
   - Arquivo: `dados/database/bicicletario.db`

2. **IndexedDB (Navegador)**
   - Armazenamento no lado do cliente
   - Sincronização automática quando online
   - Fila de operações pendentes
   - Cache de dados para acesso rápido

3. **LocalStorage (Fallback)**
   - Backup secundário no navegador
   - Compatibilidade universal
   - Dados sempre disponíveis

### 🔐 Autenticação Offline Segura

- ✅ **Bcrypt/SHA-256** - Hash seguro de senhas
- ✅ **Criptografia AES** - Dados sensíveis protegidos
- ✅ **Tokens de Sessão** - Autenticação persistente offline
- ✅ **Arquivo: `dados/auth/users.json`** (criptografado)

### 🔄 Sincronização Inteligente

- ✅ **Detecção automática** de status online/offline
- ✅ **Fila de operações** - Registra ações offline
- ✅ **Sincronização automática** quando conexão retorna
- ✅ **Resolução de conflitos** - Mesclagem inteligente de dados

### 📊 Exportação de Logs e Relatórios

- ✅ **Logs de auditoria** - CSV e TXT
- ✅ **Relatórios de clientes** - CSV
- ✅ **Resumo diário** - TXT formatado
- ✅ **Relatórios de backup** - Informações detalhadas

## Bibliotecas Locais

Todas as dependências externas estão na pasta `libs/`:

- ✅ **Tailwind CSS** (`libs/tailwind.min.js`) - 488 KB
- ✅ **Lucide Icons** (`libs/lucide.js`) - 549 KB  
- ✅ **SheetJS/XLSX** (`libs/xlsx.full.min.js`) - 923 KB

**Total:** ~2 MB de bibliotecas locais

## Funcionamento

### 🌐 Com Internet
- Aplicação funciona normalmente
- Dados salvos em SQLite (porta 5001)
- IndexedDB sincroniza com servidor
- LocalStorage como backup adicional

### 📴 Sem Internet
- ✅ **Todas as funcionalidades continuam funcionando**
- ✅ Cadastro de clientes e bicicletas
- ✅ Registro de entrada/saída completo
- ✅ Autenticação local segura
- ✅ Busca e filtros funcionais
- ✅ Tema claro/escuro
- ✅ Exportação de dados (CSV, Excel, TXT)
- ✅ Logs de auditoria locais
- ✅ Backup automático de dados
- ✅ **Operações enfileiradas** para sincronização posterior

## Arquivos Atualizados

Os seguintes arquivos foram modificados/criados para suporte offline completo:

### Backend (Python)
1. **requirements.txt** - Dependências para criptografia e segurança
2. **db_manager.py** - Gerenciador SQLite com backup automático
3. **offline_storage_api.py** - API REST integrada com SQLite
4. **auth_manager.py** - Autenticação offline com bcrypt/AES
5. **log_exporter.py** - Exportação de logs e relatórios
6. **server.py** - Servidor principal integrado com API offline

### Frontend (JavaScript)
1. **js/shared/offline-storage.js** - IndexedDB com sincronização
2. **sw.js** - Service Worker para PWA
3. **index.html** - Interface com indicadores offline

## 🚀 Como Usar Offline

### Instalação

```bash
# 1. Instalar dependências Python (opcional para criptografia)
pip install -r requirements.txt

# 2. Iniciar servidor
python3 server.py
```

O servidor iniciará:
- **Porta 5000**: Interface web principal
- **Porta 5001**: API de armazenamento offline (SQLite + fallback)

### Recursos Disponíveis Offline

#### 1. **Banco de Dados SQLite**
```
dados/database/
├── bicicletario.db       # Banco principal
└── backups/              # Backups automáticos
    ├── backup_*.zip
    └── backup_*.json
```

#### 2. **Autenticação Segura**
```
dados/auth/
├── users.json           # Usuários (criptografado)
├── tokens.json          # Tokens de sessão
└── .key                 # Chave de criptografia AES
```

#### 3. **Logs e Relatórios**
```
dados/logs/
├── auditoria_*.csv
├── auditoria_*.txt
└── relatorio_backup_*.txt

dados/relatorios/
├── clientes_*.csv
├── registros_*.csv
└── resumo_diario_*.txt
```

### Indicadores Visuais

#### Status Offline
Quando sem conexão, um indicador vermelho aparece no canto superior direito:
```
🔴 Modo Offline
```

#### Sincronização
Quando a conexão retorna, o sistema automaticamente:
1. Detecta a conexão
2. Mostra indicador de sincronização
3. Envia operações pendentes
4. Confirma conclusão

#### Notificações
- 🔴 **Vermelho**: Modo offline ativo
- 🟢 **Verde**: Conexão restaurada, sincronizando
- 🔵 **Azul**: Sincronização completa

## Como Testar Offline

### No Navegador

#### Teste Básico
1. Abra a aplicação normalmente em `http://localhost:5000`
2. Faça login com credenciais padrão
3. Pressione F12 para abrir DevTools
4. Vá em "Network" > Marque "Offline"
5. Tente cadastrar um cliente ou fazer um registro
6. ✅ Tudo deve funcionar normalmente
7. Desmarque "Offline" para sincronizar

#### Teste Avançado
1. Crie alguns registros em modo online
2. Ative o modo offline no DevTools
3. Crie mais registros (serão enfileirados)
4. Verifique o ícone 🔴 no canto superior direito
5. Desative o modo offline
6. Observe a sincronização automática 🔄
7. Verifique que todos os dados foram sincronizados

### Localmente

#### Teste Completo
1. Execute `python3 server.py`
2. Acesse `http://localhost:5000`
3. **Desconecte a internet física** (WiFi/cabo)
4. ✅ A aplicação continua funcionando
5. Todos os recursos estão disponíveis:
   - Login/Logout
   - Cadastro de clientes
   - Cadastro de bicicletas
   - Registros de entrada/saída
   - Exportação de relatórios
   - Logs de auditoria

#### Teste de Banco de Dados
```bash
# Verifica banco SQLite
sqlite3 dados/database/bicicletario.db

# Lista tabelas
.tables

# Conta clientes
SELECT COUNT(*) FROM clientes;

# Sai
.quit
```

#### Teste de Backup
```bash
# Lista backups
ls -lh dados/database/backups/

# Extrai backup ZIP
unzip dados/database/backups/backup_*.zip -d /tmp/teste_backup/

# Visualiza backup JSON
cat dados/database/backups/backup_*.json | python3 -m json.tool
```

#### Teste de Logs
```bash
# Lista logs de auditoria
ls -lh dados/logs/

# Visualiza log TXT
cat dados/logs/auditoria_*.txt

# Visualiza log CSV
cat dados/logs/auditoria_*.csv
```

## Vantagens do Sistema Offline

### 🚀 Performance
✅ **Velocidade**: Sem latência de rede  
✅ **Resposta Instantânea**: Dados locais sempre disponíveis  
✅ **Cache Inteligente**: IndexedDB + SQLite otimizados  

### 🔒 Segurança
✅ **Criptografia AES**: Dados sensíveis protegidos  
✅ **Bcrypt**: Hash seguro de senhas (ou SHA-256 como fallback)  
✅ **Arquivos Protegidos**: Permissões 600 (apenas proprietário)  
✅ **Tokens Locais**: Autenticação sem servidor externo  

### 🌐 Confiabilidade
✅ **Independência Total**: Funciona sem internet  
✅ **Sincronização Automática**: Quando conexão retorna  
✅ **Fila de Operações**: Nenhuma ação perdida  
✅ **Backup Automático**: Dados sempre protegidos  

### 💾 Armazenamento
✅ **SQLite**: Banco relacional completo  
✅ **IndexedDB**: 50MB+ no navegador  
✅ **LocalStorage**: Fallback universal  
✅ **Arquivos JSON**: Backup legível  

### 📊 Auditoria
✅ **Logs Completos**: Todas as ações registradas  
✅ **Exportação Fácil**: CSV, TXT, JSON  
✅ **Relatórios**: Diários, por cliente, por período  
✅ **Rastreabilidade**: Quem fez o quê e quando  

## 🔧 Arquitetura Técnica

### Fluxo de Dados

```
┌─────────────────────────────────────────────────┐
│                 FRONTEND                        │
│  ┌──────────────────────────────────────────┐  │
│  │  Interface HTML + JavaScript             │  │
│  │  - Formulários                           │  │
│  │  - Tabelas                               │  │
│  │  - Indicadores de Status                 │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                               │
│  ┌──────────────▼───────────────────────────┐  │
│  │  Offline Storage (offline-storage.js)   │  │
│  │  - IndexedDB                             │  │
│  │  - Fila de Sincronização                │  │
│  │  - Detecção Online/Offline              │  │
│  └──────────────┬───────────────────────────┘  │
└─────────────────┼───────────────────────────────┘
                  │
                  │ HTTP (quando online)
                  │
┌─────────────────▼───────────────────────────────┐
│                 BACKEND                         │
│  ┌──────────────────────────────────────────┐  │
│  │  Server.py (Port 5000)                   │  │
│  │  - Interface Web                         │  │
│  │  - Service Worker                        │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                               │
│  ┌──────────────▼───────────────────────────┐  │
│  │  Offline Storage API (Port 5001)        │  │
│  │  - REST Endpoints                        │  │
│  │  - Integração SQLite                     │  │
│  │  - Fallback para Arquivos               │  │
│  └──────────────┬───────────────────────────┘  │
│                 │                               │
│     ┌───────────┴───────────┐                  │
│     │                       │                  │
│  ┌──▼───────────┐  ┌───────▼──────────┐       │
│  │ db_manager.py│  │ auth_manager.py  │       │
│  │ - SQLite     │  │ - Bcrypt/SHA256  │       │
│  │ - Backups    │  │ - AES Encryption │       │
│  │ - Auditoria  │  │ - Tokens         │       │
│  └──┬───────────┘  └──────────────────┘       │
│     │                                          │
│  ┌──▼────────────────────────────────────┐    │
│  │  Armazenamento em Disco               │    │
│  │  dados/                               │    │
│  │  ├── database/                        │    │
│  │  │   ├── bicicletario.db             │    │
│  │  │   └── backups/                    │    │
│  │  ├── auth/                           │    │
│  │  │   ├── users.json (criptografado)  │    │
│  │  │   └── tokens.json                 │    │
│  │  ├── logs/                           │    │
│  │  └── relatorios/                     │    │
│  └───────────────────────────────────────┘    │
└─────────────────────────────────────────────────┘
```

### Estratégia de Fallback

1. **Tenta SQLite** (mais robusto)
   - ✅ Sucesso → Usa SQLite
   - ❌ Falha → Vai para passo 2

2. **Tenta Arquivos JSON**
   - ✅ Sucesso → Usa arquivos
   - ❌ Falha → Vai para passo 3

3. **Usa LocalStorage** (sempre disponível)
   - ✅ Funciona em qualquer navegador
   - ⚠️ Limite de ~5-10MB

## Observações

### Avisos de Console
- Os avisos de "ERR_BLOCKED_BY_CLIENT" no console podem aparecer se você tiver extensões de bloqueio de anúncios, mas não afetam o funcionamento
- O aviso do Tailwind CSS sobre "should not be used in production" é apenas informativo e não impede o uso offline
- Mensagens sobre Service Worker são normais durante a atualização do cache

### Armazenamento de Dados
- **SQLite**: Dados estruturados com backups automáticos
- **IndexedDB**: Cache de dados no navegador (50MB+)
- **LocalStorage**: Backup secundário (~5-10MB)
- **Arquivos JSON**: Backups legíveis para recuperação

### Segurança
- ⚠️ **Não compartilhe** o arquivo `.key` (criptografia AES)
- ⚠️ **Proteja** o arquivo `users.json` (senhas criptografadas)
- ✅ **Use senhas fortes** para usuários administrativos
- ✅ **Faça backups regulares** dos dados

### Performance
- SQLite é mais rápido que arquivos JSON para grandes volumes
- IndexedDB é ideal para cache de dados no navegador
- Sincronização automática otimizada para minimizar tráfego

### Limitações
- IndexedDB pode ter limites de quota do navegador
- LocalStorage limitado a ~5-10MB
- Sincronização requer conexão estável para evitar conflitos

## 📞 Suporte

Para problemas com o modo offline:

1. **Verifique os logs**
   ```bash
   # Logs do servidor
   tail -f dados/logs/server.log
   
   # Logs de auditoria
   ls -lh dados/logs/
   ```

2. **Verifique o banco de dados**
   ```bash
   # Integridade do SQLite
   sqlite3 dados/database/bicicletario.db "PRAGMA integrity_check;"
   ```

3. **Limpe o cache** (se necessário)
   ```bash
   # Limpa cache do Service Worker
   # Via DevTools > Application > Clear Storage
   ```

4. **Restaure um backup**
   ```bash
   # Lista backups disponíveis
   ls -lh dados/database/backups/
   
   # Restaura backup específico
   python3 -c "from db_manager import get_db_manager; db = get_db_manager(); db.restore_backup('dados/database/backups/backup_XXXXXX.zip')"
   ```

## 🔄 Atualizações Futuras

### Em Desenvolvimento
- [ ] Migração automática com Alembic
- [ ] Geração de PDF para relatórios
- [ ] Compressão de backups antigos
- [ ] Interface de gerenciamento de backups
- [ ] Sincronização multi-dispositivo

### Planejado
- [ ] Notificações push offline
- [ ] Modo kiosk para tablet
- [ ] Integração com impressora térmica
- [ ] API REST completa para integração externa

---

**Data da Última Atualização**: Janeiro 2026  
**Versão do Sistema**: 3.1 (Com suporte offline completo + SQLite + criptografia)
