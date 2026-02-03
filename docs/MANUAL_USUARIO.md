# 📘 Manual do Usuário - Sistema de Gerenciamento de Bicicletário

**Versão:** 4.0  
**Data:** 02/02/2026

---

## 📋 Índice

1. [Primeiro Acesso](#primeiro-acesso)
2. [Login no Sistema](#login-no-sistema)
3. [Dashboard Principal](#dashboard-principal)
4. [Gerenciamento de Clientes](#gerenciamento-de-clientes)
5. [Gerenciamento de Bicicletas](#gerenciamento-de-bicicletas)
6. [Registros de Entrada e Saída](#registros-de-entrada-e-saída)
7. [Relatórios e Exportação](#relatórios-e-exportação)
8. [Configurações do Sistema](#configurações-do-sistema)
9. [Perguntas Frequentes (FAQ)](#perguntas-frequentes-faq)

---

## 🚀 Primeiro Acesso

### Iniciando o Sistema

**Opção 1: Navegador Web** (Recomendado)
```bash
# Windows
scripts\INICIAR-NAVEGADOR.bat

# Linux/Mac
bash scripts/INICIAR-NAVEGADOR.sh
```

**Opção 2: Aplicação Desktop**
```bash
# Windows
scripts\INICIAR-DESKTOP.bat
```

**Opção 3: Servidor Manual**
```bash
python server.py
# Acesse: http://localhost:5000
```

---

## 🔐 Login no Sistema

### Credenciais Padrão

#### Usuário Dono (Acesso Total)
- **Usuário:** `Dono`
- **Senha:** `admin123` *(altere após primeiro login)*

#### Usuário Administrador
- **Usuário:** `Admin`
- **Senha:** `admin123`

#### Usuário Funcionário
- **Usuário:** `Funcionario`
- **Senha:** `123456`

### Níveis de Permissão

| Nível | Permissões |
|-------|------------|
| **Dono** | Acesso total, gerenciar usuários, configurações avançadas |
| **Admin** | Cadastros, registros, relatórios, auditoria |
| **Funcionário** | Apenas registros de entrada/saída |

> ⚠️ **Importante:** Altere as senhas padrão na primeira utilização!

---

## 🏠 Dashboard Principal

Após o login, você verá o dashboard com:

### Seções Principais

1. **📊 Métricas**
   - Bikes estacionadas atualmente
   - Total de clientes cadastrados
   - Registros do dia
   - Taxa de ocupação

2. **🚲 Bicicletas Estacionadas**
   - Lista em tempo real
   - Status (ativa/pernoite)
   - Tempo de permanência

3. **📈 Gráficos** (Apenas Dono/Admin)
   - Ocupação por horário
   - Clientes por categoria
   - Tendências semanais

---

## 👥 Gerenciamento de Clientes

### Cadastrar Novo Cliente

1. Clique em **"Clientes"** no menu lateral
2. Clique no botão **"+ Novo Cliente"**
3. Preencha os dados:
   - **Nome Completo** *(obrigatório)*
   - **CPF** *(validado automaticamente)*
   - **Telefone** *(com máscara automática)*
   - **Categoria** *(opcional: Cliente, Lojista, iFood, Academia)*
4. Clique em **"Salvar"**

### Buscar Cliente

- Use a **barra de busca** no topo
- Filtre por **nome, CPF ou telefone**
- Filtros por **categoria** disponíveis

### Editar Cliente

1. Localize o cliente na lista
2. Clique no ícone **✏️ Editar**
3. Altere os dados necessários
4. Clique em **"Salvar Alterações"**

### Adicionar Comentários

1. Na listagem de clientes, clique em **💬 Comentários**
2. Digite a observação
3. Clique em **"Adicionar"**
4. Comentários aparecem com data e hora

### Excluir Cliente

> ⚠️ **Atenção:** Apenas usuários **Dono** podem excluir clientes!

1. Localize o cliente
2. Clique em **🗑️ Excluir**
3. Confirme a ação

---

## 🚲 Gerenciamento de Bicicletas

### Adicionar Bicicleta a um Cliente

1. Na lista de clientes, clique em **"+ Bike"** no cliente desejado
2. Preencha os dados da bicicleta:
   - **Marca** *(ex: Caloi, Oggi)* 
   - **Modelo** *(ex: Elite, Speed)*
   - **Cor** *(ex: Preto, Vermelho)*
3. **(Opcional)** Adicione uma **foto**:
   - Clique em **"📸 Usar Câmera"** para capturar
   - OU clique em **"📁 Carregar Arquivo"** para upload
4. Clique em **"Adicionar"**

### Visualizar Bicicletas do Cliente

- Na lista de clientes, as bikes aparecem abaixo do nome
- Clique para expandir os detalhes
- Foto da bike (se cadastrada) é exibida

### Editar Bicicleta

1. Clique no ícone **✏️** na bike
2. Altere os dados
3. **Salvar Alterações**

### Excluir Bicicleta

1. Clique em **🗑️ Excluir** na bike
2. Confirme a exclusão

---

## 🚪 Registros de Entrada e Saída

### Registrar Entrada

#### Método 1: Via Sistema (Desktop/Web)

1. Vá para **"Registros"** no menu
2. Clique em **"+ Nova Entrada"**
3. Selecione o **cliente**
4. Selecione a **bicicleta**
5. **(Opcional)** Escolha a **categoria** da visita
6. Clique em **"Registrar Entrada"**

#### Método 2: Via QR Code (Mobile)

1. Cliente acessa o link mobile (`/mobile-access.html`)
2. Escaneia seu **QR Code pessoal**
3. Seleciona a **bicicleta**
4. Clica em **"Solicitar Entrada"**
5. Funcionário aprova a solicitação no painel admin

### Registrar Saída

#### Método 1: Via Sistema

1. Na lista de **"Bikes Estacionadas"**
2. Localize a bike do cliente
3. Clique em **"Registrar Saída"**
4. Confirme a ação

#### Método 2: Via QR Code (Mobile)

1. Cliente escaneia novamente
2. Clica em **"Solicitar Saída"**
3. Funcionário aprova

### Registros de Pernoite

Para bikes que ficam durante a noite:

1. Ao registrar entrada, marque **"Pernoite"**
2. O sistema calcula automaticamente tempo além do expediente
3. Alerta visual para bikes em pernoite

### Editar Registro

> ⚠️ Apenas **Dono** e **Admin** podem editar registros!

1. Vá em **"Relatórios" > "Histórico"**
2. Localize o registro
3. Clique em **✏️ Editar**
4. Altere **data/hora** de entrada ou saída
5. Salvar

---

## 📊 Relatórios e Exportação

### Gerar Relatórios

1. Acesse **"Dados" > "Relatórios"**
2. Selecione o **período**:
   - Hoje
   - Esta semana
   - Este mês
   - Personalizado (escolha datas)
3. **(Opcional)** Filtre por **categoria**
4. Clique em **"Gerar Relatório"**

### Exportar Dados

#### Formatos Disponíveis

**📄 PDF** - Relatório formatado para impressão
1. Gere o relatório
2. Clique em **"Exportar PDF"**
3. Arquivo baixa automaticamente

**📊 Excel (XLSX)** - Planilha editável
1. Clique em **"Exportar Excel"**
2. Abre no Excel/LibreOffice

**📋 CSV** - Dados separados por vírgula
1. Clique em **"Exportar CSV"**
2. Compatível com qualquer planilha

**💾 JSON** - Backup completo
1. Clique em **"Exportar JSON"**
2. Backup de todos os dados do sistema

### Importar Dados

1. Acesse **"Dados" > "Importar"**
2. Selecione o arquivo (**CSV, Excel ou JSON**)
3. Clique em **"Importar"**
4. Aguarde processamento
5. Confirmação de importação

---

## ⚙️ Configurações do Sistema

### Gerenciar Usuários (Apenas Dono)

1. Menu **"Usuários"**
2. **Adicionar novo usuário:**
   - Clique em **"+ Novo Usuário"**
   - Nome, senha e nível de permissão
3. **Editar/Excluir usuários** existentes

### Personalizar Tema

1. Menu **"Configurações" > "Tema"**
2. Escolha:
   - **Modo:** Claro, Escuro ou Sistema
   - **Preset:** 8 temas predefinidos
   - **Cores Customizadas:** Escolha primária e secundária
3. **Preview** em tempo real
4. **Salvar** preferências

### Gerenciar Categorias

1. **"Configurações" > "Categorias"**
2. **Adicionar categoria:**
   - Nome da categoria
   - Ícone emoji
3. **Editar/Excluir** categorias existentes

### Backup Automático

1. **"Configurações" > "Backup"**
2. **Configurar backup automático:**
   - Frequência: Diária, Semanal, Mensal
   - Hora do backup
3. **Backup manual:**
   - Clique em **"Fazer Backup Agora"**
   - Arquivo SQLite é salvo em `dados/database/backups/`

### Auditoria

1. **"Configurações" > "Auditoria"**
2. Visualize **todas as ações** do sistema:
   - Quem fez
   - O que fez
   - Quando fez
3. **Exportar logs** em TXT

---

## ❓ Perguntas Frequentes (FAQ)

### Como altero minha senha?

1. Clique no seu **nome de usuário** (canto superior direito)
2. **"Alterar Senha"**
3. Digite senha atual e nova senha
4. Confirme

### O sistema funciona sem internet?

**Sim!** 100% funcional offline após primeiro carregamento:
- Dados salvos localmente com SQLite
- Sincronização automática quando voltar online

### Posso usar no celular?

**Sim!** Duas formas:
1. **Navegador:** Abra o endereço do servidor
2. **Acesso Mobile:** Use `/mobile-access.html` para interface otimizada

### Como gero QR Code para os clientes?

1. Vá em **"Clientes"**
2. Clique em **🔗 QR Code** no cliente
3. QR Code é gerado e pode ser:
   - Impresso
   - Enviado por e-mail/WhatsApp
   - Salvo em PDF

### O que fazer se perder os dados?

1. **Restaurar de backup:**
   - Vá em **"Configurações" > "Backup"**
   - Clique em **"Restaurar"**
   - Selecione o arquivo de backup (.db)
   - Confirme restauração

2. **Prevenção:**
   - Configure backup automático
   - Exporte regularmente em JSON

### Quantos clientes/bikes posso cadastrar?

**Ilimitado!** O SQLite suporta milhões de registros.

### Como adiciono um novo funcionário?

Apenas o **Dono** pode:
1. Menu **"Usuários"**
2. **"+ Novo Usuário"**
3. Preencha nome, senha
4. Escolha nível: **Funcionário**
5. Salvar

### Posso personalizar as categorias?

**Sim!** 
1. **"Configurações" > "Categorias"**
2. Adicione, edite ou remova categorias
3. Escolha ícone emoji para cada uma

---

## 🆘 Problemas Comuns

### Não consigo fazer login

- Verifique se está usando as credenciais corretas
- Padrão: `Funcionario` / `123456`
- Limpe cache do navegador (Ctrl+F5)

### Página não carrega

- Verifique se o servidor está rodando
- Acesse: `http://localhost:5000`
- Reinicie o servidor: `python server.py`

### Dados não salvam

- Verifique conexão com servidor
- Modo offline: aguarde sincronização
- Verifique permissões de escrita na pasta `dados/`

### QR Code não funciona

- Verifique câmera do dispositivo
- Permita acesso à câmera no navegador
- Limpe QR Code (pode estar sujo/manchado)

---

## 📞 Suporte

Para mais ajuda:
- 📖 Consulte `docs/` para documentação técnica
- 🔧 Veja [troubleshooting](docs/legacy/DESKTOP-TROUBLESHOOTING.md)
- 🎮 [Manual de Jogos](MANUAL_JOGOS.md)
- ⚙️ [Manual de Configuração](MANUAL_CONFIGURACAO.md)

---

**Sistema de Gerenciamento de Bicicletário v4.0**  
*BICICLETARIO SHOP. BOULEVARD V.V.* | 2025-2026
