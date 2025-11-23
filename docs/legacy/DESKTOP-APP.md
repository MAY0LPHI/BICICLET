# 🖥️ Versão Desktop - Executável Windows

## 📌 Resumo

Foi criada uma versão desktop do Sistema de Gerenciamento de Bicicletário que pode ser transformada em um executável (.exe) para Windows 10/11.

## ✨ Vantagens da Versão Desktop

1. **Sem navegador**: Roda como aplicativo nativo do Windows
2. **Offline completo**: Não precisa de internet ou servidor
3. **Instalador profissional**: Com ícone, atalhos e desinstalador
4. **Interface nativa**: Barra de menu, atalhos de teclado Windows
5. **Dados locais**: Tudo salvo no computador do usuário

## 📂 Estrutura de Arquivos

```
📁 Projeto
├── 📄 index.html              # Interface principal (compartilhada)
├── 📄 style.css               # Estilos (compartilhados)
├── 📁 js/                     # JavaScript (compartilhado)
│
├── 📁 electron/               # 🆕 ARQUIVOS DO ELECTRON
│   ├── 📄 main.js            # Código principal do desktop
│   ├── 📄 preload.js         # Segurança e isolamento
│   ├── 📄 build-helper.bat   # Script automático Windows
│   ├── 📄 icon.ico           # Ícone da aplicação (criar)
│   └── 📄 README-ICONE.md    # Guia para criar ícone
│
├── 📄 package.json           # 🆕 Configuração Node.js/Electron
├── 📄 BUILD-WINDOWS.md       # 🆕 Guia completo de build
└── 📄 DESKTOP-APP.md         # 🆕 Este arquivo
```

## 🚀 Como Gerar o .exe

### ⚠️ Nota Importante sobre Ícone

O ícone da aplicação é **OPCIONAL**. O build funcionará mesmo sem um ícone personalizado (usará o ícone padrão do Electron). 

Para adicionar um ícone personalizado antes do build, veja: `electron/README-ICONE.md`

### Método Fácil (Windows)

1. Instale o Node.js: https://nodejs.org/
2. Abra o terminal na pasta do projeto
3. (Opcional) Adicione ícone personalizado em `electron/icon.ico` e `electron/icon.png`
4. Execute: `electron\build-helper.bat`
5. Aguarde o processo (2-5 minutos)
6. O instalador estará em: `dist\Gestão de Bicicletário Setup 2.1.0.exe`

### Método Manual

Veja instruções detalhadas em: **BUILD-WINDOWS.md**

## 🎯 Funcionalidades Desktop

### Menu de Aplicação

- **Arquivo**: Recarregar, Sair
- **Editar**: Desfazer, Copiar, Colar, etc.
- **Visualizar**: Zoom, Tela Cheia
- **Ferramentas**: DevTools (F12)
- **Ajuda**: Sobre

### Atalhos de Teclado

- **F5**: Recarregar aplicação
- **F12**: Ferramentas do desenvolvedor
- **F11**: Tela cheia
- **Ctrl + R**: Recarregar
- **Ctrl + Scroll**: Zoom in/out
- **Alt + F4**: Fechar aplicação

### Janela

- Tamanho inicial: 1400x900 pixels
- Tamanho mínimo: 800x600 pixels
- Redimensionável: Sim
- Maximizável: Sim

## 💾 Armazenamento de Dados

Os dados são salvos localmente no computador usando localStorage do Electron:

**Localização**:
```
C:\Users\<SeuUsuário>\AppData\Roaming\bicicletario-desktop\
```

**Backup**: Você pode fazer backup copiando esta pasta

**Importação/Exportação**: Use as funções nativas do sistema (Excel/CSV)

## 🔧 Tecnologias Utilizadas

- **Electron 28**: Framework para apps desktop
- **Electron Builder**: Gerador de instaladores
- **Node.js**: Runtime JavaScript
- **HTML/CSS/JS**: Interface (mesma da versão web)

## 📦 Tamanho do Instalador

- **Instalador (.exe)**: ~100-120 MB
- **Após instalação**: ~200-250 MB
- **Inclui**: Electron, Node.js, Chromium, todas as bibliotecas

## ⚙️ Requisitos de Sistema

### Mínimos
- Windows 10 (64-bit)
- 4 GB RAM
- 500 MB espaço em disco
- Processador 1.6 GHz

### Recomendados
- Windows 10/11 (64-bit)
- 8 GB RAM
- 1 GB espaço em disco
- Processador 2.0 GHz ou superior

## 🆚 Desktop vs Web

| Característica | Versão Web | Versão Desktop |
|---------------|------------|----------------|
| Instalação | Não precisa | Precisa instalar |
| Internet | Precisa servidor | Não precisa |
| Atualizações | Automáticas | Manual (reinstalar) |
| Compatibilidade | Qualquer SO com navegador | Apenas Windows |
| Tamanho | Leve (~5 MB) | Pesado (~100 MB) |
| Performance | Depende do navegador | Nativa e rápida |
| Atalhos de teclado | Limitados | Completos |
| Barra de menu | Não | Sim |
| Dados | localStorage navegador | localStorage app |

## 🎨 Personalização

### Mudar o Ícone

Veja: `electron/README-ICONE.md`

### Mudar o Nome

Edite em `package.json`:
```json
"productName": "Seu Nome Aqui"
```

### Mudar a Versão

Edite em `package.json`:
```json
"version": "2.1.0"
```

## 🐛 Problemas Comuns

### Antivírus bloqueia o .exe
- Normal para executáveis novos
- Adicione exceção no antivírus
- O código é open-source e seguro

### App não abre
- Reinstale o aplicativo
- Verifique se o Windows está atualizado
- Execute como Administrador

### Dados não aparecem
- Verifique a pasta de dados
- Reimporte dados via Excel/CSV

## 📝 Distribuição

Para distribuir o aplicativo:

1. Gere o instalador (.exe)
2. Teste em outro computador Windows
3. Distribua o arquivo .exe
4. Usuários executam e seguem o instalador
5. Não precisa de configuração adicional

## 🔐 Segurança

- ✅ Código-fonte aberto
- ✅ Dados salvos localmente
- ✅ Sem conexão com internet
- ✅ Sem coleta de dados
- ✅ Context isolation habilitado
- ✅ Node integration desabilitado

## 📞 Suporte

Para problemas com a versão desktop:

1. Verifique `BUILD-WINDOWS.md` para troubleshooting
2. Verifique se o Node.js está instalado corretamente
3. Execute o build novamente
4. Teste em outro computador Windows

## 🎉 Pronto para Usar!

Sua aplicação web agora pode ser distribuída como um executável profissional para Windows!

---

**Versão**: 2.1.0  
**Plataforma**: Windows 10/11 (64-bit)  
**Electron**: 28.0.0  
**Node.js**: 18+ requerido
