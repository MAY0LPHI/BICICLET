# 🪟 Como Gerar o Executável (.exe) para Windows 10

Este guia explica como criar um arquivo executável (.exe) do Sistema de Gerenciamento de Bicicletário para Windows 10.

## 📋 Pré-requisitos

1. **Node.js** instalado (versão 18 ou superior)
   - Download: https://nodejs.org/
   - Verifique a instalação: `node --version`

2. **Git** (opcional, para clonar o repositório)
   - Download: https://git-scm.com/

## 🚀 Passo a Passo

### 1. Obter o Código Fonte

Se você está no Replit, faça o download do projeto completo. Ou clone o repositório:

```bash
git clone <url-do-repositorio>
cd bicicletario-2
```

### 2. Instalar as Dependências

Abra o terminal (Prompt de Comando ou PowerShell) na pasta do projeto e execute:

```bash
npm install
```

Isso instalará:
- Electron (para criar a aplicação desktop)
- Electron Builder (para gerar o .exe)

### 3. Adicionar Ícone (Opcional)

Se quiser um ícone personalizado para a aplicação:

1. Crie ou obtenha um ícone (formato .ico para Windows)
2. Salve como `electron/icon.ico` e `electron/icon.png`
3. Veja instruções detalhadas em: `electron/README-ICONE.md`

**Nota**: Se você não adicionar um ícone, a aplicação usará o ícone padrão do Electron.

### 4. Testar Localmente (Opcional)

Antes de gerar o .exe, você pode testar a aplicação:

```bash
npm start
```

Isso abrirá a aplicação em uma janela desktop. Se tudo funcionar corretamente, feche a janela e prossiga.

### 5. Gerar o Executável (.exe)

Execute o comando de build:

```bash
npm run build
```

**⏱️ Tempo estimado**: 2-5 minutos (dependendo do computador)

O processo irá:
- Empacotar toda a aplicação
- Criar o instalador NSIS (.exe)
- Salvar na pasta `dist/`

### 6. Localizar o Arquivo .exe

Após o build concluir, você encontrará o instalador em:

```
dist/Gestão de Bicicletário Setup 2.1.0.exe
```

Este é o **instalador** que você pode distribuir. Tamanho aproximado: 80-120 MB.

## 📦 Instalação no Windows 10

1. Execute o arquivo `Gestão de Bicicletário Setup 2.1.0.exe`
2. Escolha o diretório de instalação (ou use o padrão)
3. Aguarde a instalação
4. Um atalho será criado na Área de Trabalho
5. O programa estará disponível no Menu Iniciar

## 🎯 Usando a Aplicação Desktop

- **Iniciar**: Clique no atalho da Área de Trabalho ou Menu Iniciar
- **Fechar**: Clique no X ou use Alt+F4
- **Recarregar**: Pressione F5
- **Tela Cheia**: Menu Visualizar → Tela Cheia
- **Ferramentas do Desenvolvedor**: Pressione F12 (para debug)

## 💾 Dados

Os dados são salvos localmente no computador usando o armazenamento local do navegador (localStorage). Cada instalação terá seus próprios dados independentes.

**Localização dos dados**: 
```
C:\Users\<SeuUsuário>\AppData\Roaming\bicicletario-desktop\
```

## 🔧 Builds Avançados

### Build sem Instalador (apenas pasta)

Se você quer apenas os arquivos executáveis sem instalador:

```bash
npm run build:dir
```

Isso criará uma pasta em `dist/win-unpacked/` com o executável direto.

### Customizar Ícone

Para usar um ícone personalizado:

1. Crie os arquivos de ícone:
   - `electron/icon.ico` (para Windows - múltiplas resoluções)
   - `electron/icon.png` (512x512 pixels)

2. Adicione a configuração no `package.json`:
   ```json
   "win": {
     "icon": "electron/icon.ico"
   }
   ```

3. Veja guia completo em: `electron/README-ICONE.md`

**Importante**: O ícone é OPCIONAL. Se não for fornecido, o Electron usará seu ícone padrão.

## ❗ Solução de Problemas

### Erro: "node" não é reconhecido
- Instale o Node.js e reinicie o terminal

### Erro durante npm install
- Execute como Administrador
- Tente: `npm install --legacy-peer-deps`

### Build falha com erro de memória
- Feche outros programas
- Execute: `npm run build:dir` (build mais leve)

### Antivírus bloqueia o .exe
- É normal com executáveis novos
- Adicione exceção no antivírus
- O arquivo é seguro (código-fonte disponível)

## 📝 Notas Importantes

1. **Tamanho do arquivo**: O .exe será grande (~100MB) porque inclui o Electron e todas as bibliotecas necessárias

2. **Primeira execução**: Pode demorar alguns segundos para abrir na primeira vez

3. **Atualizações**: Para atualizar, gere um novo .exe com a versão atualizada e reinstale

4. **Compatibilidade**: Funciona no Windows 10 e Windows 11 (64-bit)

5. **Sem servidor**: A aplicação roda completamente offline, não precisa de internet

## 🎉 Pronto!

Agora você tem um executável profissional do Sistema de Gerenciamento de Bicicletário para Windows 10!

---

**Versão**: 2.1.0  
**Electron**: 28.0.0  
**Plataforma**: Windows 10/11 (x64)
