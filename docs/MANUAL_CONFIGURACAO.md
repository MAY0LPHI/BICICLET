# ⚙️ Manual de Configuração do Sistema

**Versão:** 4.0  
**Data:** 02/02/2026

---

## 📋 Índice

1. [Configurações de Tema](#configurações-de-tema)
2. [Gerenciamento de Categorias](#gerenciamento-de-categorias)
3. [Sistema de Backup](#sistema-de-backup)
4. [Configurações de Usuários](#configurações-de-usuários)
5. [Configurações Avançadas](#configurações-avançadas)

---

## 🎨 Configurações de Tema

### Acessando Configurações de Tema

1. Menu lateral → **"⚙️ Configurações"**
2. Aba **"🎨 Tema"**

### Modos de Tema

#### Modo Claro
- Fundo branco
- Texto escuro
- Ideal para ambientes bem iluminados

#### Modo Escuro
- Fundo escuro/preto
- Texto claro
- Reduz fadiga ocular em ambientes com pouca luz
- Economiza bateria em telas OLED

#### Modo Sistema
- Segue a preferência do sistema operacional
- Alterna automaticamente entre claro e escuro

### Como Alterar o Modo

1. Em **"Configurações" > "Tema"**
2. Selecione:
   - ☀️ **Claro**
   - 🌙 **Escuro**
   - 💻 **Sistema** (automático)
3. Mudança é **instantânea**
4. Preferência **salva automaticamente**

---

## 🎨 Personalização de Cores

### Presets de Cores Predefinidos

O sistema oferece **8 temas predefinidos**:

#### 1. 🔵 Padrão (Azul)
- **Primária:** Azul (#2563eb)
- **Secundária:** Roxo (#9333ea)
- Tema equilibrado e profissional

#### 2. 🌊 Oceano
- **Primária:** Azul marinho
- **Secundária:** Turquesa
- Visual calmo e relaxante

#### 3. 🌃 Noturno
- **Primária:** Azul escuro
- **Secundária:** Cinza chumbo
- Perfeito para modo escuro

#### 4. 🌸 Sakura
- **Primária:** Rosa suave
- **Secundária:** Rosa claro
- Visual delicado e clean

#### 5. 🌲 Floresta
- **Primária:** Verde musgo
- **Secundária:** Verde oliva
- Tema nature-friendly

#### 6. 🔥 Fogo
- **Primária:** Laranja vibrante
- **Secundária:** Vermelho
- Energético e chamativo

#### 7. 🌅 Pôr do Sol
- **Primária:** Laranja quente
- **Secundária:** Rosa/roxo
- Cores quentes e acolhedoras

#### 8. ⚡ Elétrico
- **Primária:** Amarelo neon
- **Secundária:** Ciano elétrico
- Alto contraste e moderno

### Aplicando um Preset

1. **"Configurações" > "Tema"**
2. Seção **"Presets de Cores"**
3. Clique em um dos 8 presets
4. **Preview em tempo real**
5. Clique em **"Aplicar"** para confirmar

---

## 🎨 Editor de Cores Customizadas

### Como Customizar Cores

Para criar seu próprio tema:

1. **"Configurações" > "Tema"**
2. Seção **"Cores Personalizadas"**
3. Escolha a **Cor Primária:**
   - Clique no seletor de cor
   - Escolha sua cor preferida
   - OU digite o código hex (ex: #FF5733)
4. Escolha a **Cor Secundária:**
   - Mesmo processo
5. **Preview instantâneo** mostra como ficará
6. **"Salvar Cores"** para aplicar

### Dicas de Customização

**✅ Boas Práticas:**
- Use cores com **bom contraste**
- Teste no modo **claro E escuro**
- Evite cores muito vibrantes para primária
- Combine cores complementares

**❌ Evite:**
- Cores muito similares (baixo contraste)
- Amarelo/branco em fundo claro
- Preto puro em fundo escuro

### Resetar para Padrão

Se não gostar das cores escolhidas:
1. **"Resetar para Padrão"**
2. Volta ao tema azul original

---

## 📊 Gerenciamento de Categorias

### O que são Categorias?

Categorias permitem **organizar clientes** por tipo de serviço:
- 👤 Cliente (padrão)
- 🏪 Lojista
- 🍽️ iFood
- 💪 Academia

### Visualizando Categorias

1. **"Configurações" > "Categorias"**
2. Lista todas as categorias existentes com:
   - Ícone/emoji
   - Nome
   - Número de clientes

### Adicionar Nova Categoria

1. Clique em **"+ Nova Categoria"**
2. Preencha:
   - **Nome** (ex: "Estudante", "Entregador")
   - **Ícone** (emoji, ex: 🎓, 🚴)
3. **Salvar**

A categoria aparecerá imediatamente nas opções de cadastro de clientes.

### Editar Categoria

1. Localize a categoria na lista
2. Clique em **✏️ Editar**
3. Altere nome ou ícone
4. **Salvar Alterações**

> ⚠️ **Atenção:** Clientes já atribuídos a esta categoria **permanecem** com ela

### Excluir Categoria

1. Clique em **🗑️ Excluir** na categoria
2. **Confirme** a exclusão

> ⚠️ **Importante:** 
> - Categoria **padrão (Cliente)** não pode ser excluída
> - Clientes da categoria excluída voltam para **"Sem categoria"**

### Ícones/Emojis Sugeridos

| Tipo | Emoji Sugerido |
|------|----------------|
| Cliente | 👤 💼 |
| Lojista | 🏪 🏬 |
| Delivery | 🍽️ 🚴 📦 |
| Academia | 💪 🏋️ |
| Estudante | 🎓 📚 |
| Turista | ✈️ 🗺️ |
| Morador | 🏡 🏠 |
| Escritório | 🏢 💻 |

---

## 💾 Sistema de Backup

### Backup Automático

#### Configurar Backup Automático

1. **"Configurações" > "Backup"**
2. Ative **"Backup Automático"**
3. Configure:
   - **Frequência:**
     - Diária (todo dia às X horas)
     - Semanal (toda segunda-feira, etc)
     - Mensal (dia 1 de cada mês)
   - **Horário:** Escolha o melhor momento (ex: 23:00)
4. **Salvar Configurações**

#### Como Funciona

- Backup é criado **automaticamente** nos horários configurados
- Arquivos salvos em: `dados/database/backups/`
- Formato: `backup_YYYYMMDD_HHMMSS.db`
- Sistema mantém **os últimos 30 backups**
- Backups antigos são **automaticamente deletados**

### Backup Manual

#### Criar Backup Agora

1. **"Configurações" > "Backup"**
2. Clique em **"📥 Fazer Backup Agora"**
3. Aguarde processamento (2-5 segundos)
4. Confirmação: **"Backup criado com sucesso!"**

O arquivo é salvo em `dados/database/backups/`.

### Restaurar Backup

⚠️ **ATENÇÃO:** Restaurar um backup **sobrescreve todos os dados atuais**!

#### Passo a Passo

1. **"Configurações" > "Backup"**
2. Seção **"Restaurar Backup"**
3. Clique em **"📁 Selecionar Arquivo"**
4. Escolha o arquivo `.db` de backup
5. **IMPORTANTE:** Leia o aviso:
   > "Todos os dados atuais serão perdidos. Deseja continuar?"
6. Digite **CONFIRMAR** para prosseguir
7. Clique em **"Restaurar"**
8. Aguarde processamento
9. **Reinicie o sistema** após conclusão

### Exportar Dados em Outros Formatos

Além do backup SQLite, você pode exportar em:

#### JSON (Backup Completo)
1. **"Dados" > "Exportar"**
2. Selecione **"JSON"**
3. Arquivo `backup_completo.json` será baixado
4. Contém **todos os dados** do sistema

#### CSV/Excel (Parcial)
- Exporte apenas clientes, bikes ou registros
- **"Relatórios" > "Exportar"**
- Escolha CSV ou XLSX

### Onde Ficam os Backups?

```
BICICLET/
└── dados/
    └── database/
        └── backups/
            ├── backup_20260202_230000.db
            ├── backup_20260201_230000.db
            └── backup_20260131_230000.db
```

### Boas Práticas de Backup

✅ **Recomendado:**
- Configure backup **diário** no final do expediente
- Mantenha backups em **local externo** (Google Drive, pen drive)
- Teste restauração **mensalmente**
- Guarde backups de **datas importantes** (fim de mês, etc)

❌ **Evite:**
- Confiar apenas em um backup
- Nunca testar a restauração
- Armazenar backups apenas no mesmo computador

---

## 👥 Configurações de Usuários

> 🔒 **Permissão necessária:** DONO

### Gerenciar Usuários

1. **Menu "Usuários"** (apenas Dono vê)
2. Lista todos os usuários com:
   - Nome
   - Nível de permissão
   - Último acesso

### Adicionar Novo Usuário

1. Clique em **"+ Novo Usuário"**
2. Preencha:
   - **Nome de usuário** (ex: "joao.silva")
   - **Senha** (mínimo 6 caracteres)
   - **Confirmar senha**
   - **Nível de permissão:**
     - 🔑 **Dono** (acesso total)
     - 👨‍💼 **Admin** (sem gerência de usuários)
     - 👤 **Funcionário** (apenas registros)
3. **Criar Usuário**

### Editar Usuário

1. Localize o usuário
2. **✏️ Editar**
3. Pode alterar:
   - Nome
   - Senha (se necessário)
   - Nível de permissão
4. **Salvar**

### Redefinir Senha

1. Edite o usuário
2. Campo **"Nova Senha"**
3. Digite a nova senha
4. **Confirmar senha**
5. **Salvar**

> 💡 **Dica:** Informe o usuário sobre a nova senha!

### Excluir Usuário

1. Clique em **🗑️ Excluir**
2. **Confirme** a exclusão

> ⚠️ **Atenção:** 
> - Não pode excluir o **último Dono**
> - Ações do usuário ficam registradas em auditoria

### Alterar Sua Própria Senha

Qualquer usuário pode alterar sua senha:

1. Clique no **seu nome** (canto superior direito)
2. **"🔑 Alterar Senha"**
3. Preencha:
   - Senha atual
   - Nova senha
   - Confirmar nova senha
4. **Alterar**

---

## 🔧 Configurações Avançadas

> 🔒 **Permissão necessária:** DONO ou ADMIN

### Auditoria e Logs

1. **"Configurações" > "Auditoria"**
2. Visualize log completo de ações:
   - Quem fez
   - O que fez
   - Quando fez
   - Detalhes da ação

#### Exportar Logs de Auditoria

1. Clique em **"Exportar Logs"**
2. Escolha formato:
   - TXT (legível)
   - JSON (dados estruturados)
3. Arquivo é baixado

### Configurações de Sistema

1. **"Configurações" > "Sistema"**

#### Porta do Servidor
- Padrão: 5000
- Altere se houver conflito
- Requer **reinício** do servidor

#### Timeout de Sessão
- Tempo para logout automático
- Padrão: 8 horas
- Opções: 1h, 4h, 8h, 24h, Nunca

#### Modo Debug
- Ativa logs detalhados
- **Apenas para desenvolvimento**
- Deixe DESLIGADO em produção

### Limpeza de Dados

> ⚠️ **CUIDADO:** Ações irreversíveis!

#### Limpar Registros Antigos

1. **"Configurações" > "Manutenção"**
2. **"Limpar Registros Antigos"**
3. Escolha período:
   - Mais de 1 ano
   - Mais de 2 anos
   - Mais de 5 anos
4. **Confirme** com senha de Dono

#### Resetar Sistema

Para recomeçar do zero:

1. **"Configurações" > "Manutenção"**
2. **"⚠️ Resetar Sistema"**
3. **AVISO:** Todos os dados serão perdidos!
4. Digite **RESETAR SISTEMA** para confirmar
5. Senha de Dono necessária

> 🛑 **Use com extremo cuidado!**

---

## ❓ FAQ - Configurações

### Posso ter mais de um tema salvo?

Não diretamente, mas você pode:
- Salvar códigos hex das cores em um arquivo
- Alternar rapidamente entre presets

### As configurações são salvas por usuário?

**Tema:** Sim, cada usuário tem suas preferências  
**Categorias:** Não, são globais do sistema  
**Backup:** Configuração global

### Como voltar configurações ao padrão?

1. **Tema:** Botão "Resetar para Padrão"
2. **Categorias:** Exclua as customizadas
3. **Backup:** Desative e reconfigure

### Perco dados ao restaurar backup?

**SIM!** Todos os dados **após a data do backup** serão perdidos.  
Por isso, sempre faça backup antes de restaurar.

### Posso agendar backups em horários diferentes?

Atualmente, apenas **um horário global** é suportado.  
**Sugestão:** Configure para o fim do expediente.

### Como sei se o backup automático está funcionando?

1. **"Configurações" > "Backup"**
2. Verifique **"Último Backup"** (data/hora)
3. Confira a pasta `dados/database/backups/`

---

## 📞 Suporte

Problemas com configurações?

- 📖 Consulte o [Manual do Usuário](MANUAL_USUARIO.md)
- 🎮 Veja o [Manual de Jogos](MANUAL_JOGOS.md)
- 🔧 Troubleshooting em `docs/legacy/`

---

*Sistema de Gerenciamento de Bicicletário v4.0*  
*BICICLETARIO SHOP. BOULEVARD V.V.* | 2025-2026
