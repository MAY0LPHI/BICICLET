# 📁 Estrutura de Pastas - Bicicletário

## Organização Modular

Este projeto foi organizado em pastas separadas para facilitar a manutenção e desenvolvimento:

### 📂 js/cadastros/ - MÓDULO DE CADASTROS

Contém toda a lógica relacionada ao cadastro de clientes e bicicletas.

- **clientes.js**
  - ✅ Adicionar novos clientes
  - ✅ Validar CPF
  - ✅ Formatar CPF e telefone automaticamente
  - ✅ Buscar clientes
  
- **bicicletas.js**
  - ✅ Adicionar bicicletas a clientes
  - ✅ Visualizar detalhes das bicicletas
  - ✅ Exibir histórico de movimentação

- **dashboard.js**
  - ✅ Dashboard administrativo (Movido de dono/)
  - ✅ Gráficos e estatísticas

### 📂 js/registros/ - MÓDULO DE REGISTROS

Gerencia todos os registros diários de entrada e saída de bicicletas.

- **registros-diarios.js**
  - ✅ Registrar entrada de bicicletas
  - ✅ Registrar saída de bicicletas
  - ✅ Filtrar por data
  - ✅ Buscar registros
  - ✅ Exportar para CSV
  - ✅ Exportar para PDF

### 📂 js/jogos/ - MÓDULO DE JOGOS (NOVO)

- **jogos.js**
  - ✅ Sistema de jogos integrados
  - ✅ Ranking e Conquistas
  - ✅ Modo offline

### 📂 js/configuracao/ - MÓDULO DE CONFIGURAÇÃO (NOVO)

- **configuracao.js**
  - ✅ Temas e personalização
  - ✅ Categorias customizáveis
  - ✅ Backup e Importação

### 📂 js/shared/ - UTILITÁRIOS COMPARTILHADOS

Código reutilizável usado por todos os módulos.

- **utils.js**
  - ✅ Gerar UUID
  - ✅ Formatar CPF
  - ✅ Formatar telefone
  - ✅ Validar CPF

- **storage.js**
  - ✅ Salvar clientes no localStorage/SQLite
  - ✅ Carregar clientes do localStorage/SQLite
  - ✅ Salvar registros no localStorage/SQLite
  - ✅ Carregar registros do localStorage/SQLite
  - ✅ Sincronização offline

### 📄 Arquivos Principais

- **app-modular.js** - Ponto de entrada da aplicação modular
- **index.html** - Interface do usuário
- **style.css** - Estilos e tema escuro
- **server.py** - Servidor HTTP de desenvolvimento

## Benefícios da Estrutura Modular

✨ **Organização**: Código separado por responsabilidade
✨ **Manutenção**: Fácil localizar e corrigir problemas
✨ **Escalabilidade**: Simples adicionar novos recursos
✨ **Reutilização**: Utilitários compartilhados evitam duplicação
✨ **Clareza**: Estrutura de pastas auto-explicativa

## Fluxo de Dados

```
┌─────────────────┐
│  index.html     │
│  (Interface)    │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ app-modular.js  │
│ (Controlador)   │
└────────┬────────┘
         │
    ┌────┴──────────────┬─────────────────┐
    ▼                   ▼                 ▼
┌─────────┐      ┌──────────┐      ┌──────────┐
│Cadastros│      │Registros │      │ Shared   │
│         │      │          │      │          │
│clientes │      │registros │      │utils     │
│bicicletas│     │diarios   │      │storage   │
└─────────┘      └──────────┘      └──────────┘
    │                   │                 │
    └───────────────────┴─────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │ localStorage │
                └──────────────┘
```

## Próximas Melhorias Sugeridas

- [x] Adicionar testes unitários
- [x] Implementar sistema de backup automático
- [x] Criar relatórios estatísticos
- [x] Adicionar autenticação de usuários
- [x] Implementar sincronização em nuvem (via Replit)
