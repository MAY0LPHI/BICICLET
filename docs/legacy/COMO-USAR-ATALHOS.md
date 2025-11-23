# 🚀 Como Usar os Atalhos do Sistema

## ⚠️ IMPORTANTE - Antes de Começar

### 1️⃣ **Baixe o Projeto Completo**

Você precisa ter todos os arquivos do projeto no seu computador:

**Opção A - Baixar do GitHub:**
1. Acesse o repositório do projeto
2. Clique em "Code" → "Download ZIP"
3. Extraia o ZIP em uma pasta de sua escolha

**Opção B - Clonar com Git:**
```bash
git clone [URL-DO-REPOSITORIO]
```

### 2️⃣ **Instale o Python 3**

O sistema precisa do Python 3 instalado:

**Windows:**
1. Baixe em: https://www.python.org/downloads/
2. Durante a instalação, **MARQUE** a opção: ✅ "Add Python to PATH"
3. Clique em "Install Now"

**Linux:**
```bash
# Ubuntu/Debian
sudo apt install python3

# Fedora
sudo dnf install python3
```

**Mac:**
```bash
brew install python3
```

**Verificar instalação:**
```bash
python --version
```

---

## 📂 Organização dos Dados

O sistema salva todos os dados em pastas separadas:

### **📁 dados/navegador/** - Versão Web/Navegador
- `clientes/` - Arquivos JSON com cadastros de clientes
- `registros/` - Registros de entrada/saída organizados por ano/mês/dia

### **📁 dados/desktop/** - Versão Desktop (Electron)
- `clientes/` - Arquivos JSON com cadastros de clientes  
- `registros/` - Registros de entrada/saída organizados por ano/mês/dia

> **Importante:** Os dados são separados para que você possa usar as duas versões sem conflitos!

---

## 🖱️ Atalhos Disponíveis

### **Windows (.bat)**

#### **INICIAR-NAVEGADOR.bat** ⭐ Recomendado
- Verifica se Python está instalado
- Inicia o servidor automaticamente
- Abre no navegador padrão do Windows
- **Como usar:** Clique duas vezes no arquivo

#### **INICIAR-CHROME.bat**
- Abre especificamente no Google Chrome
- **Como usar:** Clique duas vezes no arquivo

#### **INICIAR-FIREFOX.bat**
- Abre especificamente no Mozilla Firefox
- **Como usar:** Clique duas vezes no arquivo

#### **INICIAR-EDGE.bat**
- Abre especificamente no Microsoft Edge
- **Como usar:** Clique duas vezes no arquivo

### **Linux/Mac (.sh)**

#### **INICIAR-NAVEGADOR.sh**
- Verifica se Python 3 está instalado
- Inicia o servidor automaticamente
- Abre no navegador padrão
- **Como usar no terminal:**
  ```bash
  ./INICIAR-NAVEGADOR.sh
  ```

---

## 📝 Passo a Passo - Primeira Vez

### Windows:

1. **Certifique-se de que o Python está instalado**
   - Abra o Prompt de Comando (cmd)
   - Digite: `python --version`
   - Deve mostrar algo como: `Python 3.12.x`

2. **Navegue até a pasta do projeto**
   - Vá até a pasta onde você extraiu/clonou o projeto
   - Você deve ver os arquivos: `server.py`, `index.html`, etc.

3. **Execute o atalho**
   - Clique duas vezes em `INICIAR-NAVEGADOR.bat`
   - Uma janela de comando abrirá
   - O navegador iniciará automaticamente
   - O sistema estará disponível em: `http://localhost:5000`

### Linux/Mac:

1. **Abra o terminal na pasta do projeto**
   ```bash
   cd /caminho/para/o/projeto
   ```

2. **Torne o script executável (apenas primeira vez)**
   ```bash
   chmod +x INICIAR-NAVEGADOR.sh
   ```

3. **Execute o script**
   ```bash
   ./INICIAR-NAVEGADOR.sh
   ```

4. O navegador abrirá em `http://localhost:5000`

---

## ❌ Problemas Comuns e Soluções

### **"Python não é reconhecido como comando..."**

**Problema:** Python não está instalado ou não está no PATH

**Solução:**
1. Instale o Python: https://www.python.org/downloads/
2. **IMPORTANTE:** Durante a instalação, marque ✅ "Add Python to PATH"
3. Reinicie o computador
4. Tente novamente

---

### **"localhost se recusou a conectar" / ERR_CONNECTION_REFUSED**

**Problema:** O servidor não está rodando

**Soluções:**

1. **Verifique se você está na pasta correta:**
   - A pasta deve conter o arquivo `server.py`
   - Execute o script a partir desta pasta

2. **A porta 5000 pode estar em uso:**
   - Feche qualquer programa que possa estar usando a porta 5000
   - No Windows, abra o Prompt de Comando como Administrador e digite:
     ```cmd
     netstat -ano | findstr :5000
     taskkill /PID [NUMERO_DO_PID] /F
     ```

3. **Firewall bloqueando:**
   - Permita Python no firewall do Windows
   - Vá em: Painel de Controle → Firewall → Permitir aplicativo

---

### **"Arquivo server.py não encontrado"**

**Problema:** Você está executando o script na pasta errada

**Solução:**
1. Certifique-se de que está na pasta raiz do projeto
2. A pasta deve conter: `server.py`, `index.html`, `style.css`, pasta `js/`, etc.
3. Execute o script novamente

---

### **O servidor inicia mas nada aparece no navegador**

**Problema:** Página em branco ou carregamento infinito

**Soluções:**
1. Limpe o cache do navegador (Ctrl + Shift + Delete)
2. Tente em modo anônimo/privado
3. Tente outro navegador
4. Verifique o console do navegador (F12) para erros

---

### **Quero usar outra porta (não 5000)**

**Solução:**
1. Abra o arquivo `server.py` em um editor de texto
2. Na linha 7, mude `PORT = 5000` para outro número (ex: `PORT = 8080`)
3. Salve o arquivo
4. Execute o atalho novamente
5. Acesse: `http://localhost:8080` (ou o número que você escolheu)

---

## 📊 Onde Estão Meus Dados?

### Versão Navegador (Web):
```
seu-projeto/
  └── dados/
      └── navegador/
          ├── clientes/
          │   ├── 12345678900.json
          │   └── 98765432100.json
          └── registros/
              └── 2025/
                  └── 10/
                      └── 24/
                          ├── abc123.json
                          └── def456.json
```

### Versão Desktop (Electron):
**Windows:** `%APPDATA%\bicicletario-desktop\dados\desktop\`

**Linux:** `~/.config/bicicletario-desktop/dados/desktop/`

**Mac:** `~/Library/Application Support/bicicletario-desktop/dados/desktop/`

---

## 🛡️ Backup dos Dados

### Fazer Backup:

1. **Feche o sistema**
2. **Copie a pasta `dados/`** para um local seguro:
   - Pen drive
   - Nuvem (Google Drive, OneDrive, Dropbox)
   - HD externo

### Restaurar Backup:

1. **Feche o sistema**
2. **Substitua** a pasta `dados/` pela cópia do backup
3. **Inicie** o sistema novamente

---

## 🔧 Comandos Úteis

### Parar o Servidor:

- **Fechar a janela** do Prompt de Comando/Terminal
- Ou pressionar **Ctrl + C** na janela

### Verificar se o servidor está rodando:

**Windows:**
```cmd
netstat -an | findstr :5000
```

**Linux/Mac:**
```bash
lsof -i :5000
```

---

## 📞 Suporte Adicional

Se os problemas persistirem:

1. Verifique os arquivos de log na janela do servidor
2. Consulte `README.md` para mais informações sobre funcionalidades
3. Consulte `replit.md` para documentação técnica completa

---

## ✅ Checklist de Verificação

Antes de pedir ajuda, verifique:

- [ ] Python 3 está instalado (`python --version`)
- [ ] Você está na pasta correta do projeto
- [ ] O arquivo `server.py` existe na pasta
- [ ] A porta 5000 está livre (não está sendo usada)
- [ ] O firewall permite conexões do Python
- [ ] Você tem permissões para executar o script

---

**Sistema desenvolvido para BICICLETARIO SHOP. BOULEVARD V.V.**

**Versão:** 2.1  
**Última atualização:** 24/10/2025
