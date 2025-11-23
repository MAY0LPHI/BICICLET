# Gestão de Bicicletário - Versão Desktop

Sistema de gerenciamento de bicicletário construído com Electron para desktop.

## 🚀 Início Rápido

### Instalação

1. **Clone ou baixe o projeto**

2. **Instale as dependências**:
   ```bash
   npm install
   ```

3. **Execute o aplicativo**:
   ```bash
   npm start
   ```

## 📦 Criar Executável

### Para Windows

```bash
npm run build
```

**⚠️ Problemas de permissão?** 
Veja o guia completo: `SOLUCAO-ERRO-BUILD-WINDOWS.md`

Solução rápida:
- Abra o Prompt de Comando **como Administrador**
- Navegue até a pasta do projeto
- Execute `npm run build`

### Build para Teste (sem instalador)

```bash
npm run build:dir
```

Isso cria uma pasta `dist/win-unpacked/` com o executável, mas não cria instalador.

## 🐛 Solução de Problemas

### As abas não abrem quando clico nelas

1. **Execute com debug**:
   ```bash
   npm start
   ```

2. **Abra o console**: Pressione **F12**

3. **Veja os logs**: Ao clicar nas abas, você verá:
   ```
   🔍 Debug mode ATIVADO - Versão Desktop Electron
   📌 Adicionando event listeners às abas...
   ✅ Adicionando listener à aba Clientes
   ✅ CLICK GLOBAL detectado em: <button>
   🎯 ABA CLICADA! clientes-tab
   ```

4. **Siga o guia**: `CORRECOES-DESKTOP.md`

### Erro ao fazer build no Windows

Veja o guia completo: `SOLUCAO-ERRO-BUILD-WINDOWS.md`

### Outros problemas

Veja: `DESKTOP-TROUBLESHOOTING.md` (em inglês)

## 📁 Estrutura do Projeto

```
BICICLETARIO-27/
├── electron/
│   ├── main.js              # Processo principal do Electron
│   ├── preload.js           # Script de preload
│   └── storage-backend.js   # Backend de armazenamento
├── js/
│   ├── app-modular.js       # Aplicação principal
│   ├── cadastros/           # Módulos de cadastro
│   ├── registros/           # Módulos de registros
│   ├── configuracao/        # Módulos de configuração
│   └── shared/              # Código compartilhado
│       ├── debug.js         # Sistema de debug
│       ├── storage.js       # Armazenamento
│       └── utils.js         # Utilitários
├── dados/                   # Dados salvos
│   ├── desktop/            # Dados da versão desktop
│   └── navegador/          # Dados da versão web
├── index.html              # Interface principal
├── style.css               # Estilos
└── package.json            # Configurações do projeto
```

## 🔧 Scripts Disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm start` | Executa o app em modo de desenvolvimento |
| `npm run build` | Cria instalador para Windows (requer admin) |
| `npm run build:dir` | Cria executável sem instalador (não requer admin) |

## 📊 Dados

Os dados são salvos automaticamente em:
- **Desktop**: `dados/desktop/`
- **Web**: `dados/navegador/`

Os dados incluem:
- `clientes.json` - Cadastro de clientes
- `registros.json` - Registros de entrada/saída

## 🌐 Versão Web

Este projeto também funciona como aplicação web. Para executar a versão web:

```bash
python server.py
```

Acesse: `http://localhost:5000`

## 💾 Backup de Dados

Para fazer backup:
1. Copie a pasta `dados/desktop/` para um local seguro
2. Para restaurar, substitua os arquivos na pasta `dados/desktop/`

## 🔑 Atalhos do Teclado

| Atalho | Ação |
|--------|------|
| **F12** | Abrir/Fechar Console de Debug |
| **F5** | Recarregar Aplicação |
| **Ctrl+R** | Recarregar Aplicação |
| **Alt+F4** | Fechar Aplicação |

## 🆘 Suporte

1. **Problemas com build**: `SOLUCAO-ERRO-BUILD-WINDOWS.md`
2. **Problemas com cliques**: `CORRECOES-DESKTOP.md`
3. **Troubleshooting geral**: `DESKTOP-TROUBLESHOOTING.md`

## 📝 Requisitos

- **Node.js**: 18.0.0 ou superior
- **npm**: 9.0.0 ou superior
- **Windows**: 10 ou 11 (64-bit)

## 🎯 Funcionalidades

- ✅ Cadastro de clientes
- ✅ Cadastro de bicicletas
- ✅ Registro de entrada/saída
- ✅ Busca e filtros
- ✅ Exportação para CSV/Excel
- ✅ Modo escuro/claro
- ✅ Armazenamento local automático
- ✅ Interface responsiva

## 📄 Licença

MIT License

---

**Versão**: 2.1.1  
**Data**: 07/11/2025  
**Empresa**: BICICLETARIO SHOP. BOULEVARD V.V.
