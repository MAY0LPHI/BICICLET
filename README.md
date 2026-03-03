# 🚲 Sistema de Gerenciamento de Bicicletário

**Sistema completo para gestão de estacionamento de bicicletas** | Versão 3.2 (Clean Code & Documentação)

[![Replit](https://img.shields.io/badge/Executar-Replit-blue)](https://replit.com)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Doc](https://img.shields.io/badge/Documenta%C3%A7%C3%A3o-100%25%20PT--BR-yellow.svg)](#)

---

## 📋 Sobre o Projeto

Sistema web profissional para gerenciamento de bicicletários, desenvolvido para **BICICLETARIO SHOP. BOULEVARD V.V.**, com funcionalidades completas de cadastro, controle de acesso, auditoria e relatórios.

### ✨ Principais Funcionalidades

- ✅ **Gerenciamento de Clientes** - Cadastro completo com validação de CPF e categorização.
- ✅ **Controle de Bicicletas** - Registro detalhado com múltiplas bikes por cliente.
- ✅ **Registros de Entrada/Saída** - Sistema de controle de acesso com histórico.
- ✅ **Sistema de Permissões** - Perfis hierárquicos (Dono, Admin, Funcionário).
- ✅ **Auditoria Completa** - Rastreamento de todas as ações do sistema.
- ✅ **Exportação/Importação** - Backup completo em CSV/Excel/JSON.
- ✅ **Temas e Personalização** - Temas Claro/Escuro e Cores Personalizadas.
- ✅ **Categorias Personalizadas** - Organize clientes por tipo de serviço com ícones.
- ✅ **Sistema de Pernoite** - Controle especial para bikes que ficam durante a noite.
- ✅ **🎮 Módulo de Jogos** - Sistema de entretenimento com Ranking e Conquistas.
- ✅ **🌐 Modo Offline Completo** - Funciona 100% sem internet com sincronização automática.
- ✅ **💾 SQLite Local** - Banco de dados robusto com backup automático.
- ✅ **📝 Clean Code & Documentação** - 100% do código JavaScript e HTML documentado e padronizado em Português-BR para facilitar onboarding de novos desenvolvedores.

---

## 🚀 Início Rápido

### Executando Localmente

#### Opção 1: Scripts de Inicialização (Recomendado)

```bash
# Windows
scripts/INICIAR-NAVEGADOR.bat

# Linux/Mac
bash scripts/INICIAR-NAVEGADOR.sh
```

#### Opção 2: Servidor Web Python

```bash
# Inicie o servidor (porta 5000)
python3 server.py
```
Acesse: `http://localhost:5000`

---

## 📚 Documentação e Manuais

### 🆕 Manuais Detalhados
- **[MANUAL_JOGOS.md](docs/MANUAL_JOGOS.md)** - Guia dos jogos, ranking e conquistas.
- **[MANUAL_CONFIGURACAO.md](docs/MANUAL_CONFIGURACAO.md)** - Guia de temas, categorias e backups.

### 🎯 Guias Básicos
- **[README-PRINCIPAL.md](docs/legacy/README-PRINCIPAL.md)** - Guia completo de uso (Legacy).
- **[GUIA-MODO-OFFLINE.md](docs/legacy/GUIA-MODO-OFFLINE.md)** - Guia completo sobre o funcionamento offline.
- **[INSTRUCOES-USO.md](docs/legacy/INSTRUCOES-USO.md)** - Instruções detalhadas de operação.

### 🔧 Documentação Técnica
- **[ESTRUTURA.md](docs/legacy/ESTRUTURA.md)** - Organização modular do código.
- **[SISTEMA-ARQUIVOS.md](docs/legacy/SISTEMA-ARQUIVOS.md)** - Estrutura de armazenamento.

---

## 📁 Estrutura do Projeto

```
bicicletario/
├── 📂 js/                          # Código JavaScript modular
│   ├── cadastros/                  # Módulos de cadastro
│   ├── registros/                  # Controle de entrada/saída
│   ├── jogos/                      # Módulo de jogos e ranking
│   ├── configuracao/               # Configurações do sistema
│   └── shared/                     # Utilitários compartilhados
├── 📂 docs/                        # Manuais atuais
│   └── legacy/                     # Documentação antiga
├── 📂 tests/                       # Arquivos de teste e templates auxiliares
├── 📂 legado/                      # Scripts antigos e backups manuais
├── 📂 scripts/                     # Scripts de inicialização
├── 📂 electron/                    # Aplicação desktop
├── 📄 index.html                   # Página principal
├── 📄 server.py                    # Servidor web Python
└── 📄 package.json                 # Configuração Node/Electron
```

---

## 📅 Histórico de Versões

- **v3.4** (02/03/2026) - ⚡ **Produtividade e Automações de UX**
  - Implementação de Atalhos Globais de Teclado (Busca Rápidas, Logout, Navegação).
  - Guia de Ajuda integrado com painel interativo.
  - Tutorial Passo-a-Passo com marcações visuais na tela para novos membros.
  - Duplo-clique para dar Saída diretamente na aba de Registros.
  - Automações de foco (Nome) e confirmações via `Enter`/`Esc` nos modais.
- **v3.3** (24/02/2026) - 🧹 **Reorganização, Limpeza e Otimização**
  - Limpeza da raiz do projeto, criando as pastas `tests/` e isolando backups em `legado/`.
  - Refatoração para remover duplicação de validação de CPF (`utils.js` e `validator.js`).
  - Otimização do processamento de imagens de bicicletas em um método centralizado no controller.
- **v3.2** (15/02/2026) - 📝 **Clean Code & Documentação 100% PT-BR**
  - Revisão, tradução e padronização completa de todos os 18 módulos JS e 5 arquivos HTML.
  - Implementação de JSDoc em todos os módulos para facilitar o onboarding de Devs.
- **v3.1** (23/01/2026) - 🎮 **Módulo de Jogos + Configuração Avançada**
  - Jogos integrados: Snake, Doom, Termo, Memória, etc.
  - Customização de Temas (Cores e Presets).
  - Documentação atualizada (Manuais novos).
- **v3.0** (03/01/2026) - 🌐 **Sistema Offline Completo**
  - SQLite com backup automático.
  - Autenticação offline segura.
  - Sincronização automática.
- **v2.2** - Categorias e Melhorias Desktop.
- **v2.0** - Sistema de Auditoria.
- **v1.0** - Versão Inicial.

---

## 💡 Suporte

Para dúvidas ou problemas:
- Consulte a pasta `docs/`.
- Verifique o [troubleshooting](docs/legacy/DESKTOP-TROUBLESHOOTING.md).

---

**Desenvolvido com ❤️ para otimizar a gestão de bicicletários**
