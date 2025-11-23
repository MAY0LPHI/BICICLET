# 📁 Sistema de Armazenamento em Arquivos Locais

## 🎯 Objetivo

O sistema agora salva **todos os dados em arquivos JSON** organizados em pastas na máquina local quando usado na versão desktop (Electron). A versão web continua usando localStorage.

## 📂 Estrutura de Pastas

### Windows

Todos os dados são salvos em:
```
C:\Users\<SeuUsuário>\AppData\Roaming\bicicletario-desktop\dados\
```

### Organização

```
📁 dados/
├── 📁 clientes/
│   ├── 14931558739.json         # Cliente com CPF 149.315.587-39
│   ├── 12345678900.json         # Cliente com CPF 123.456.789-00
│   └── ...
│
└── 📁 registro_de_acesso/
    ├── 📁 2025/
    │   ├── 📁 01/                # Janeiro
    │   │   ├── 15.json           # Registros do dia 15/01/2025
    │   │   ├── 16.json           # Registros do dia 16/01/2025
    │   │   └── ...
    │   ├── 📁 02/                # Fevereiro
    │   │   └── ...
    │   └── ...
    ├── 📁 2024/
    │   └── ...
    └── ...
```

## 📄 Formato dos Arquivos

### Arquivo de Cliente

**Caminho**: `dados/clientes/{CPF_SEM_PONTUACAO}.json`

**Exemplo**: `dados/clientes/14931558739.json`

```json
{
  "id": "288ac6a1-2cfe-4427-bee1-97e214349f24",
  "nome": "Marcelo Jorge",
  "cpf": "149.315.587-39",
  "telefone": "(11) 98765-4321",
  "bicicletas": [
    {
      "id": "ef0e7f68-514b-4ae3-94f2-41129420d2aa",
      "modelo": "aro 29",
      "marca": "rava",
      "cor": "preta e laranja"
    }
  ]
}
```

### Arquivo de Registros Diários

**Caminho**: `dados/registro_de_acesso/{ANO}/{MES}/{DIA}.json`

**Exemplo**: `dados/registro_de_acesso/2025/10/19.json`

```json
[
  {
    "id": "60bb09af-663a-4190-93cb-53cbb759ba2f",
    "clientId": "288ac6a1-2cfe-4427-bee1-97e214349f24",
    "bikeId": "ef0e7f68-514b-4ae3-94f2-41129420d2aa",
    "dataHoraEntrada": "2025-10-19T00:18:22.000Z",
    "dataHoraSaida": null,
    "entrada": "2025-10-19T00:18:22.000Z",
    "saida": null,
    "bikeSnapshot": {
      "modelo": "aro 29",
      "marca": "rava",
      "cor": "preta e laranja"
    }
  }
]
```

## 🔧 Como Funciona

### Detecção de Ambiente

O sistema detecta automaticamente se está rodando:
- **Electron (Desktop)**: Salva em arquivos
- **Navegador Web**: Salva em localStorage

### Operações Automáticas

#### Ao Salvar um Cliente
1. Sistema cria a pasta `dados/clientes/` (se não existir)
2. Remove pontuação do CPF (149.315.587-39 → 14931558739)
3. Salva em `dados/clientes/14931558739.json`

#### Ao Salvar um Registro
1. Extrai data/hora da entrada
2. Cria estrutura de pastas: `dados/registro_de_acesso/2025/10/`
3. Carrega registros existentes do dia (se houver)
4. Adiciona ou atualiza o registro
5. Salva em `dados/registro_de_acesso/2025/10/19.json`

## 🎁 Vantagens

### ✅ Organização
- Dados categorizados por tipo (clientes x registros)
- Registros organizados cronologicamente (ano → mês → dia)
- Fácil navegar e encontrar informações

### ✅ Backup
- Basta copiar a pasta `dados/` para fazer backup completo
- Cada cliente é um arquivo separado
- Cada dia é um arquivo separado

### ✅ Portabilidade
- Copiar a pasta `dados/` para outro computador
- Colar na mesma localização
- Todos os dados aparecem automaticamente

### ✅ Transparência
- Arquivos em formato JSON (texto legível)
- Pode abrir e ver o conteúdo em qualquer editor de texto
- Facilita auditoria e verificação

### ✅ Performance
- Carrega apenas os dados necessários
- Não precisa carregar todo o histórico sempre
- Busca otimizada por data

## 🔍 Encontrando seus Dados

### No Windows

1. Pressione `Win + R`
2. Digite: `%APPDATA%\bicicletario-desktop\dados`
3. Pressione Enter
4. A pasta com todos os dados abrirá

### Pelo Aplicativo

No menu: **Ferramentas → Abrir Pasta de Dados** (em breve)

## 💾 Backup e Restauração

### Fazer Backup

1. Localize a pasta de dados (veja acima)
2. Copie a pasta inteira `dados/`
3. Cole em local seguro (pen drive, nuvem, etc)

### Restaurar Backup

1. Feche a aplicação
2. Localize a pasta de dados
3. Delete a pasta `dados/` atual (ou renomeie)
4. Cole a pasta `dados/` do backup
5. Abra a aplicação

## 🔄 Migração localStorage → Arquivos

Quando você abrir a versão desktop pela primeira vez:
1. O sistema detecta dados no localStorage (da versão web)
2. **NÃO** migra automaticamente (para evitar perda de dados)
3. Você precisa importar via Excel/CSV

**Recomendação**: 
- Use a versão web para exportar para Excel
- Use a versão desktop para importar o Excel
- Ou use cada versão independentemente

## 📊 Comparação

| Característica | localStorage (Web) | Arquivos (Desktop) |
|---------------|-------------------|-------------------|
| Limite de tamanho | ~5-10 MB | Ilimitado |
| Organização | Único arquivo JSON | Pasta estruturada |
| Backup | Exportar manualmente | Copiar pasta |
| Visualização | Navegador DevTools | Explorador de Arquivos |
| Portabilidade | Vinculado ao navegador | Pasta transferível |
| Performance | Carrega tudo | Carrega sob demanda |
| Transparência | Opaco | Arquivos legíveis |

## 🔐 Segurança

- Dados salvos **localmente** na máquina
- **Nenhuma** conexão com internet
- **Não** enviado para servidores externos
- Protegido pelas permissões do Windows
- Requer acesso ao computador para visualizar

## 🐛 Troubleshooting

### Dados não aparecem
1. Verifique se está usando a versão desktop
2. Feche e reabra a aplicação
3. Verifique se a pasta de dados existe

### Erro ao salvar
1. Verifique permissões da pasta
2. Execute como Administrador
3. Verifique espaço em disco

### Duplicação de dados
1. Use apenas UMA versão (web OU desktop)
2. Não misture os dois sem exportar/importar
3. Faça backup antes de trocar de versão

## 📝 Notas Técnicas

### Nomes de Arquivo
- CPF sem pontuação (apenas números)
- Datas com zero à esquerda (01, 02, ..., 31)
- Formato JSON com indentação (legível)

### Codificação
- UTF-8 para suportar acentos e caracteres especiais
- Compatível com Excel e editores de texto

### Sincronização
- **Não há** sincronização automática entre dispositivos
- Cada instalação tem seus próprios arquivos
- Use exportação/importação para transferir dados

---

**Versão**: 2.1.0  
**Sistema de Arquivos**: Electron + Node.js  
**Formato**: JSON (UTF-8)
