# 📤📥 Sistema de Exportação e Importação de Dados

**Implementado em**: 21/11/2025 | **Versão**: 3.0

## 📋 Visão Geral

Sistema completo de backup e restauração de dados que permite exportar e importar toda a estrutura do sistema (clientes com bicicletas, registros de acesso, usuários e permissões) em formatos Excel (.xlsx) e CSV.

---

## 🎯 Funcionalidades

### 📤 Exportar Sistema Completo

**Onde encontrar**: Aba Configuração → Exportar Sistema Completo

#### Formatos Disponíveis
1. **Excel (.xlsx)** 
   - 3 abas: Clientes, Registros, Usuários
   - Bicicletas integradas na aba Clientes (em JSON)
   - Fácil visualização em planilha

2. **CSV**
   - 4 seções: Clientes, Registros, Usuários
   - Formato texto separado por vírgulas
   - Compatível com qualquer editor

#### O que é Exportado

**Aba Clientes:**
- ID | Nome | CPF | Telefone | Bicicletas (JSON)

**Aba Registros:**
- ID | Cliente ID | Bicicleta ID | Data Entrada | Data Saída | Pernoite | Acesso Removido | Registro Original ID

**Aba Usuários:**
- ID | Username | Password | Nome | Tipo | Ativo | Permissões (JSON)

---

### 📥 Importar Sistema Completo

**Onde encontrar**: Aba Configuração → Importar Sistema Completo

#### Formatos Aceitos
- ✅ Excel (.xlsx) - precisa ter abas: Clientes, Registros, Usuários (Bicicletas é opcional)
- ✅ CSV - precisa ter as 4 seções separadas

#### Estratégia de Mesclagem

O sistema **não substitui** os dados, mas **mescla inteligentemente**:

1. **Clientes**
   - Compara por CPF (sem formatação)
   - Mesmo CPF = mescla bicicletas
   - CPF diferente = adiciona como novo

2. **Registros**
   - Compara por ID
   - ID igual = ignora (evita duplicata)
   - ID diferente = adiciona como novo

3. **Usuários**
   - Compara por username
   - Username igual = ignora
   - Username diferente = adiciona como novo

---

## 🔄 Ciclo Completo: Exportar → Importar

### Exemplo Prático

**Passo 1: Exportar backup**
```
1. Acesse Aba Configuração
2. Clique em "Exportar Sistema Completo" → "Excel (.xlsx)"
3. Arquivo "backup_sistema_2025-11-21.xlsx" é baixado
```

**Passo 2: Importar o mesmo arquivo**
```
1. Acesse Aba Configuração
2. Clique em "Importar Sistema Completo"
3. Selecione o arquivo "backup_sistema_2025-11-21.xlsx"
4. Clique em "Importar Backup Completo"
5. Dados são restaurados com sucesso!
```

---

## 🛠️ Estrutura Técnica

### Funções de Exportação

**js/configuracao/configuracao.js**

```javascript
exportSystemToExcel() {
  // Prepara dados
  const systemData = this.prepareSystemExportData();
  
  // Cria workbook com 3 abas
  // Download automático
}

exportSystemToCSV() {
  // Prepara mesmos dados
  // Formata como CSV com seções
  // Download automático
}

prepareSystemExportData() {
  // Retorna {clientes, registros, usuarios}
  // Bicicletas integradas em cada cliente (JSON)
  // Todos os campos necessários incluídos
}
```

### Funções de Importação

```javascript
handleSystemImport() {
  // Detecta formato (Excel ou CSV)
  // Chama processador apropriado
}

processSystemExcelImport(file) {
  // Lê arquivo Excel
  // Extrai dados de cada aba
  // Chama parseClientesData(), parseRegistrosData(), etc
}

parseClientesData(clientesData, bicicletasData) {
  // Reconstrói clientes com bicicletas
  // Suporta formato JSON (novo) e formato tabular (antigo)
}

parseRegistrosData(registrosData) {
  // Mapeia campos corretos (clientId, bikeId)
  // Reconstrói objeto de registro
}

mergeSystemData(importedData) {
  // Implementa lógica de mesclagem inteligente
  // Retorna dados mesclados + estatísticas
}
```

---

## 📊 Campos Mapeados

### De Clientes
- `id` → ID único
- `nome` → Nome do cliente
- `cpf` → CPF (comparação para mesclagem)
- `telefone` → Telefone
- `bicicletas` → Array de bicicletas (em JSON)

### De Bicicletas (dentro de clientes)
- `id` → ID da bicicleta
- `modelo` → Modelo
- `marca` → Marca
- `cor` → Cor

### De Registros
- `id` → ID do registro
- `clientId` → ID do cliente
- `bikeId` → ID da bicicleta
- `dataHoraEntrada` → Data/hora de entrada
- `dataHoraSaida` → Data/hora de saída (null se aberto)
- `pernoite` → Booleano (sim/não)
- `acessoRemovido` → Booleano (banido ou não)
- `registroOriginalId` → ID do registro original (para pernoites)

### De Usuários
- `id` → ID do usuário
- `username` → Login
- `password` → Senha
- `nome` → Nome completo
- `tipo` → dono | admin | funcionário
- `ativo` → Sim/Não
- `permissoes` → JSON com permissões

---

## ✅ Checklist de Funcionalidades

- ✅ Exportar para Excel (.xlsx)
- ✅ Exportar para CSV
- ✅ Importar Excel (.xlsx)
- ✅ Importar CSV
- ✅ Mesclagem inteligente de clientes
- ✅ Mesclagem inteligente de registros
- ✅ Mesclagem inteligente de usuários
- ✅ Bicicletas integradas em clientes
- ✅ Suporte a pernoites na exportação/importação
- ✅ Suporte a "Acesso Removido" na exportação/importação
- ✅ Verificação de permissões
- ✅ Mensagens de status durante importação
- ✅ Estatísticas de mesclagem (x clientes novos, y mesclados, etc)

---

## 🔒 Segurança

- ✅ Verificação de permissões: `Auth.requirePermission('configuracao', 'exportar/importar')`
- ✅ Validação de estrutura de arquivo
- ✅ Tratamento de erros durante parsing
- ✅ Confirmação antes de mesclagem
- ✅ Rollback automático em caso de erro
- ✅ Rastreamento em auditoria (logging)

---

## 🚀 Como Usar

### Backup Diário
1. Acesse Configuração
2. Clique "Exportar Sistema Completo" → Excel
3. Arquivo é automaticamente baixado
4. Guarde em local seguro

### Restauração de Dados
1. Acesse Configuração
2. Clique "Importar Sistema Completo"
3. Selecione arquivo Excel ou CSV
4. Clique "Importar Backup Completo"
5. Dados são restaurados com mesclagem inteligente

### Transferência Entre Sistemas
- Exporte do sistema antigo
- Importe no sistema novo
- Dados são automaticamente mesclados

---

**Desenvolvido para**: BICICLETÁRIO SHOP. BOULEVARD V.V.  
**Última atualização**: 21/11/2025
