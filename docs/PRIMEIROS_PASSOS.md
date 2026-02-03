# 🚀 Guia de Primeiros Passos

**Bem-vindo ao Sistema de Gerenciamento de Bicicletário!**

Este guia foi criado para quem está usando o sistema **pela primeira vez**. Siga os passos abaixo para começar rapidamente.

---

## ⏱️ Tempo estimado: 10 minutos

---

## 📋 Passo 1: Iniciar o Sistema

### Windows

1. Navegue até a pasta do sistema
2. Clique duas vezes em: **`scripts\INICIAR-NAVEGADOR.bat`**
3. Uma janela do navegador abrirá automaticamente

### Linux/Mac

1. Abra o Terminal
2. Navegue até a pasta do sistema:
   ```bash
   cd /caminho/para/BICICLET
   ```
3. Execute:
   ```bash
   bash scripts/INICIAR-NAVEGADOR.sh
   ```

### OU: Iniciar Manualmente

```bash
python server.py
```
Depois acesse no navegador: **http://localhost:5000**

---

## 🔐 Passo 2: Fazer Login

### Tela de Login

Você verá uma tela de login. Use as credenciais padrão:

**👑 Usuário Dono (recomendado para primeiro acesso):**
- **Usuário:** `Dono`
- **Senha:** `admin123`

**OU**

**👤 Usuário Funcionário:**
- **Usuário:** `Funcionario`
- **Senha:** `123456`

### ⚠️ IMPORTANTE: Altere a Senha Depois!

1. Após fazer login, clique no **seu nome** (canto superior direito)
2. Selecione **"Alterar Senha"**
3. Digite uma senha segura
4. Salve

---

## 👥 Passo 3: Cadastrar Seu Primeiro Cliente

### 3.1 Acessar Cadastro

1. No menu lateral, clique em **"Clientes"**
2. Clique no botão azul **"+ Novo Cliente"**

### 3.2 Preencher Dados

**Campos obrigatórios:**
- **Nome:** Digite o nome completo (ex: "João Silva")
- **CPF:** Digite o CPF (será validado automaticamente)
- **Telefone:** Digite com DDD (ex: 11999887766)

**Campos opcionais:**
- **Categoria:** Escolha uma (Cliente, Lojista, iFood, Academia)

### 3.3 Salvar

Clique em **"Salvar"** no final do formulário.

✅ **Pronto!** Seu primeiro cliente foi cadastrado.

---

## 🚲 Passo 4: Adicionar uma Bicicleta

### 4.1 Localizar o Cliente

Na lista de clientes, encontre o cliente que você acabou de criar.

### 4.2 Adicionar Bike

1. Clique no botão **"+ Bike"** ao lado do nome do cliente
2. Preencha:
   - **Marca:** ex: "Caloi"
   - **Modelo:** ex: "Elite"
   - **Cor:** ex: "Preto"
3. **(Opcional)** Tire uma foto:
   - Clique em **"📸 Usar Câmera"** para capturar
   - OU **"📁 Upload"** para enviar arquivo
4. Clique em **"Adicionar"**

✅ **Bicicleta cadastrada!**

---

## 🚪 Passo 5: Registrar uma Entrada

Agora vamos simular uma entrada de bicicleta no estacionamento.

### 5.1 Acessar Registros

1. No menu lateral, clique em **"Registros"**
2. Clique em **"+ Nova Entrada"**

### 5.2 Selecionar Cliente e Bike

1. **Cliente:** Procure e selecione o cliente
2. **Bicicleta:** Escolha a bike que cadastrou
3. **(Opcional)** Selecione a **Categoria** da visita

### 5.3 Confirmar

Clique em **"Registrar Entrada"**

✅ **Entrada registrada!** A bike agora aparece como "estacionada".

---

## 🚪 Passo 6: Registrar uma Saída

### 6.1 Ver Bikes Estacionadas

No dashboard principal, você verá a seção **"🚲 Bicicletas Estacionadas"**.

### 6.2 Registrar Saída

1. Localize a bike que acabou de estacionar
2. Clique no botão **"Registrar Saída"**
3. Confirme

✅ **Saída registrada!** O tempo de permanência foi calculado automaticamente.

---

## 📊 Passo 7: Ver Relatórios (Opcional)

### 7.1 Acessar Relatórios

1. No menu, clique em **"Dados"**
2. Depois em **"Relatórios"**

### 7.2 Gerar Relatório

1. Selecione um período (ex: "Hoje")
2. Clique em **"Gerar Relatório"**

Você verá estatísticas como:
- Total de entradas
- Total de saídas
- Tempo médio de permanência
- Gráficos

### 7.3 Exportar (Opcional)

Clique em:
- **"📄 Exportar PDF"** - Para imprimir
- **"📊 Exportar Excel"** - Para planilha
- **"📋 Exportar CSV"** - Para outros sistemas

---

## 🎨 Passo 8: Personalizar o Tema (Opcional)

### 8.1 Acessar Configurações

1. Menu lateral → **"⚙️ Configurações"**
2. Aba **"🎨 Tema"**

### 8.2 Escolher Tema

**Modo:**
- ☀️ Claro
- 🌙 Escuro
- 💻 Sistema (automático)

**Cores:**
- Escolha um dos **8 presets** predefinidos
- OU crie cores **customizadas**

### 8.3 Salvar

As alterações são aplicadas instantaneamente!

---

## ✅ Checklist - Você Completou!

Parabéns! Agora você sabe:

- ✅ Iniciar o sistema
- ✅ Fazer login
- ✅ Cadastrar clientes
- ✅ Adicionar bicicletas
- ✅ Registrar entradas
- ✅ Registrar saídas
- ✅ Gerar relatórios
- ✅ Personalizar o tema

---

## 🎯 Próximos Passos

Agora que você domina o básico, explore:

### 📱 Acesso Mobile
- Gere QR Codes para clientes
- Permita solicitações via smartphone
- Ver: [Manual do Usuário - Seção Mobile](MANUAL_USUARIO.md#acesso-mobile)

### 👥 Gerenciar Usuários (Apenas Dono)
- Adicione funcionários
- Defina permissões
- Ver: [Manual de Configuração - Usuários](MANUAL_CONFIGURACAO.md#configurações-de-usuários)

### 💾 Configurar Backup Automático
- Proteja seus dados
- Configure backup diário
- Ver: [Manual de Configuração - Backup](MANUAL_CONFIGURACAO.md#sistema-de-backup)

### 🎮 Explorar Jogos
- Divirta-se nos intervalos
- Compita no ranking
- Ver: [Manual de Jogos](MANUAL_JOGOS.md)

---

## ❓ Dúvidas Frequentes

### Esqueci minha senha. E agora?

Se você é o **Dono**, pode:
1. Parar o servidor
2. Usar o script de reset de senha (se disponível)
3. OU criar novo usuário via banco de dados

**Melhor:** Configure backup antes de alterar senhas!

### O sistema funciona sem internet?

**Sim!** 100% offline. Dados são salvos localmente.

### Posso usar no celular?

**Sim!** O sistema é responsivo. Abra o endereço do servidor no navegador móvel.

### Quantos clientes posso cadastrar?

**Ilimitado!** O sistema suporta milhares de registros.

### Como faço backup?

1. **"Configurações" > "Backup"**
2. **"Fazer Backup Agora"**
3. Arquivo salvo em `dados/database/backups/`

---

## 📖 Manuais Completos

Para informações detalhadas, consulte:

- 📘 **[MANUAL_USUARIO.md](MANUAL_USUARIO.md)** - Guia completo do usuário
- 🎮 **[MANUAL_JOGOS.md](MANUAL_JOGOS.md)** - Sistema de jogos
- ⚙️ **[MANUAL_CONFIGURACAO.md](MANUAL_CONFIGURACAO.md)** - Configurações avançadas

---

## 🆘 Precisa de Ajuda?

### Problemas Comuns

**Sistema não inicia:**
- Verifique se Python está instalado: `python --version`
- Instale dependências: `pip install -r requirements.txt`

**Página não carrega:**
- Verifique se o servidor está rodando
- Tente acessar: `http://127.0.0.1:5000` ou `http://localhost:5000`

**Erro de permissão:**
- Execute como administrador (Windows)
- Use `sudo` (Linux/Mac)

---

## 🎉 Pronto para Começar!

Você agora tem tudo para usar o sistema profissionalmente.

**Dica final:** Experimente! O sistema está preparado para uso real e possui todas as validações necessárias.

---

<div align="center">

**🚲 Sistema de Gerenciamento de Bicicletário v4.0 🚲**

*Desenvolvido para facilitar sua gestão*

**Boa sorte! 🚀**

</div>

---

**BICICLETARIO SHOP. BOULEVARD V.V.** | 2025-2026
