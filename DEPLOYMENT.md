# 📚 Guia Completo de Deployment

Este guia explica como hospedar o Sistema de Gerenciamento de Bicicletário em diferentes plataformas.

## 📋 Índice

- [Discloud](#-discloud)
- [Render](#-render)
- [Local/Desenvolvimento](#-localdesenvolvimento)
- [Troubleshooting](#-troubleshooting)

---

## ☁️ Discloud

A Discloud é ideal para hospedar o sistema com **SQLite** (banco de dados local).

### Pré-requisitos

- Conta na [Discloud](https://discloud.app/)
- Sistema zipado sem a pasta `node_modules`

### Passo a Passo

1. **Prepare os arquivos**
   
   ```bash
   # Remova node_modules se existir
   rm -rf node_modules
   
   # Zipe o projeto inteiro
   zip -r bicicletario.zip . -x "node_modules/*" "*.git/*" "dados/*"
   ```

2. **Configure o discloud.config**
   
   Edite o arquivo `discloud.config` e adicione seu APP ID:
   
   ```
   ID=seu-app-id-aqui
   TYPE=bot
   MAIN=server.py
   NAME=Bicicletario-Manager
   AVATAR=favicon.png
   RAM=512
   AUTORESTART=true
   VERSION=recommended
   APT=tools
   ```

3. **Faça upload**
   
   - Acesse o painel da Discloud
   - Vá em "Upload de Aplicação"
   - Selecione o arquivo `bicicletario.zip`
   - Clique em "Upload"

4. **Configure variáveis de ambiente** (opcional)
   
   No painel da Discloud, adicione:
   ```
   ENVIRONMENT=discloud
   PORT=5000
   ```

5. **Inicie a aplicação**
   
   A aplicação iniciará automaticamente após o upload.

### Acessando a aplicação

Após o deploy, você receberá uma URL no formato:
```
https://seu-app.discloud.app
```

---

## 🚀 Render

O Render é ideal para hospedar com **PostgreSQL** (banco de dados profissional).

### Pré-requisitos

- Conta no [Render](https://render.com/)
- Repositório GitHub/GitLab com o projeto

### Passo a Passo

#### Opção 1: Usando render.yaml (Recomendado)

1. **Conecte seu repositório**
   
   - Faça login no Render
   - Clique em "New +" → "Blueprint"
   - Conecte seu repositório GitHub/GitLab
   - Selecione o repositório do projeto

2. **Render detectará automaticamente**
   
   O arquivo `render.yaml` será detectado e criará:
   - ✅ Web Service (API Python)
   - ✅ PostgreSQL Database (Free tier)
   - ✅ Variáveis de ambiente configuradas

3. **Aprove e faça deploy**
   
   - Revise as configurações
   - Clique em "Apply"
   - Aguarde o deploy (5-10 minutos)

#### Opção 2: Manual

1. **Crie o banco de dados**
   
   - Clique em "New +" → "PostgreSQL"
   - Nome: `bicicletario-db`
   - Região: escolha a mais próxima
   - Plan: Free
   - Clique em "Create Database"

2. **Crie o web service**
   
   - Clique em "New +" → "Web Service"
   - Conecte seu repositório
   - Configurações:
     - **Name**: `bicicletario-api`
     - **Runtime**: Python 3
     - **Build Command**: `pip install -r requirements.txt`
     - **Start Command**: `gunicorn app:app --bind 0.0.0.0:$PORT`
     - **Plan**: Free

3. **Configure variáveis de ambiente**
   
   No painel do Web Service, adicione:
   
   ```
   ENVIRONMENT=render
   DATABASE_URL=[copiar do PostgreSQL]
   SECRET_KEY=[gerar uma chave aleatória]
   DEBUG=false
   ```
   
   Para gerar uma SECRET_KEY segura:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```

4. **Deploy**
   
   - Clique em "Create Web Service"
   - Aguarde o build e deploy

### Conectando o Banco

O Render automaticamente conecta o PostgreSQL via `DATABASE_URL`. Não é necessária configuração adicional.

### Acessando a aplicação

Após o deploy, você receberá uma URL no formato:
```
https://bicicletario-api.onrender.com
```

---

## 💻 Local/Desenvolvimento

Para rodar localmente durante o desenvolvimento:

### Pré-requisitos

- Python 3.12+
- pip

### Instalação

1. **Clone o repositório**
   
   ```bash
   git clone <seu-repositorio>
   cd BICICLET
   ```

2. **Crie ambiente virtual** (opcional, mas recomendado)
   
   ```bash
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # Linux/Mac
   source venv/bin/activate
   ```

3. **Instale dependências**
   
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure variáveis de ambiente**
   
   Copie `.env.example` para `.env`:
   
   ```bash
   cp .env.example .env
   ```
   
   Edite `.env` se necessário (valores padrão funcionam para desenvolvimento).

5. **Execute o servidor**
   
   ```bash
   python server.py
   ```
   
   Ou com Flask:
   
   ```bash
   python app.py
   ```

6. **Acesse a aplicação**
   
   Abra o navegador em:
   ```
   http://localhost:5000
   ```

---

## 🔧 Troubleshooting

### Erro: "psycopg2 não instalado"

**Problema**: PostgreSQL não está disponível.

**Solução**:
```bash
pip install psycopg2-binary
```

### Erro: "Port already in use"

**Problema**: Porta 5000 já está em uso.

**Solução**:
```bash
# Mude a porta no .env
PORT=8080

# Ou defina ao executar
PORT=8080 python server.py
```

### Erro: "Database connection failed"

**Problema**: Não consegue conectar ao PostgreSQL.

**Solução Render**:
1. Verifique se DATABASE_URL está configurada
2. Confirme que o banco PostgreSQL está rodando
3. Verifique os logs do Render

**Solução Local**:
- O sistema usará SQLite automaticamente
- Não precisa PostgreSQL para desenvolvimento local

### Site está lento no primeiro acesso (Render)

**Problema**: Free tier do Render "dorme" após inatividade.

**Solução**:
- Aguarde 30-60 segundos no primeiro acesso
- Após acordar, funcionará normalmente
- Considere upgrade para plan pago se precisar de always-on

### Dados não estão sendo salvos (Discloud)

**Problema**: Disco efêmero sendo resetado.

**Solução**:
1. Verifique se a pasta `dados/` está sendo criada
2. Confirme que SQLite está funcionando nos logs
3. Considere fazer backups regulares via API

### Erro 500 - Internal Server Error

**Problema**: Erro no servidor.

**Solução**:
1. Verifique os logs:
   - **Discloud**: Painel → Logs
   - **Render**: Dashboard → Logs
   - **Local**: Terminal
2. Procure por stack traces
3. Verifique se todas as dependências estão instaladas

---

## 📊 Comparação de Plataformas

| Recurso | Discloud | Render | Local |
|---------|----------|--------|-------|
| Banco de Dados | SQLite | PostgreSQL | SQLite |
| Custo | Varia | Free tier disponível | Grátis |
| Escalabilidade | Limitada | Alta | N/A |
| Persistência | Limitada* | Alta | Total |
| Setup | Simples | Médio | Simples |
| Recomendado para | Testes/Pequeno | Produção | Desenvolvimento |

\* *Discloud pode resetar o disco, faça backups regulares*

---

## 🆘 Suporte

Se encontrar problemas:

1. Verifique esta documentação
2. Revise os logs da aplicação
3. Consulte a documentação da plataforma:
   - [Discloud Docs](https://docs.discloud.app/)
   - [Render Docs](https://render.com/docs)

---

**Última atualização**: Janeiro 2026
