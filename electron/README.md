# 📁 Pasta Electron

Esta pasta contém todos os arquivos necessários para a versão desktop do Sistema de Gerenciamento de Bicicletário.

## 📄 Arquivos

### `main.js`
Arquivo principal do Electron. Contém:
- Criação da janela da aplicação (1400x900 pixels)
- Configuração de menu em português
- Atalhos de teclado (F5, F12, Alt+F4)
- Configurações de segurança (context isolation, node integration desabilitado)
- Verificação opcional de ícone

### `preload.js`
Script de pré-carregamento para segurança. Expõe informações seguras para o renderer process através do contextBridge.

### `build-helper.bat`
Script auxiliar para Windows que automatiza:
1. Verificação do Node.js
2. Instalação de dependências (`npm install`)
3. Geração do executável (`npm run build`)

### `README-ICONE.md`
Guia detalhado sobre como criar e adicionar ícones personalizados para a aplicação.

## 🎨 Ícones (Opcional)

Você pode adicionar ícones personalizados:
- `icon.ico` - Formato Windows (múltiplas resoluções)
- `icon.png` - Formato geral (512x512 pixels)

**Importante**: Os ícones são OPCIONAIS. Se não forem fornecidos, o Electron usará seu ícone padrão.

## 🔧 Como Usar

### Desenvolvimento Local
```bash
npm start
```

### Gerar Executável Windows
```bash
npm run build
```

### Build Somente Arquivos (sem instalador)
```bash
npm run build:dir
```

## 📦 Saída do Build

Após executar `npm run build`, você encontrará:

```
dist/
├── Gestão de Bicicletário Setup 2.1.0.exe  # Instalador NSIS
└── win-unpacked/                            # Arquivos desempacotados
    └── Gestão de Bicicletário.exe          # Executável direto
```

## ⚙️ Configuração

Toda a configuração do Electron está no arquivo raiz `package.json`:
- Seção `"main"`: Aponta para `electron/main.js`
- Seção `"build"`: Configurações do electron-builder
- Seção `"scripts"`: Comandos npm disponíveis

## 🔐 Segurança

Práticas de segurança implementadas:
- ✅ `contextIsolation: true` - Isolamento de contexto
- ✅ `nodeIntegration: false` - Node.js desabilitado no renderer
- ✅ `preload.js` - Script de pré-carregamento seguro
- ✅ Sem acesso direto ao sistema de arquivos do renderer

## 📚 Documentação

Para mais informações, consulte:
- `BUILD-WINDOWS.md` - Guia completo de build
- `DESKTOP-APP.md` - Documentação da versão desktop
- `README-ICONE.md` - Guia de ícones

## 🎯 Compatibilidade

- **Windows**: 10/11 (64-bit) ✅
- **Linux**: Pode ser adicionado (modificar package.json)
- **macOS**: Pode ser adicionado (modificar package.json)

Atualmente configurado apenas para Windows.
