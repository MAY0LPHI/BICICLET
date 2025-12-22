# Sistema de Gerenciamento de Bicicletário 🚴

Sistema completo para gerenciar bicicletários com versões Web e Desktop.

## 🚀 Início Rápido

### Versão Web
```bash
# Já está rodando automaticamente
# Acesse: http://localhost:5000/
```

### Versão Desktop
```bash
# Duplo clique em: INICIAR.bat
# Ou execute:
npm install
npm start
```

## 🔐 Login Padrão

- **Admin**: `admin` / `admin123`
- **Dono**: `CELO123` / `CELO123`

## 📁 Estrutura de Dados

```
dados/
├── navegador/        # Versão Web
│   ├── clientes/     # Um arquivo JSON por cliente
│   └── registros/    # Um arquivo JSON por registro
└── desktop/          # Versão Desktop
    ├── clientes/
    ├── registros/
    ├── usuarios.json
    ├── auditoria.json
    └── categorias.json
```

## ✨ Funcionalidades

- ✅ Cadastro de clientes
- ✅ Registros de entrada/saída
- ✅ Gerenciamento de usuários
- ✅ Auditoria de ações
- ✅ Exportação/Importação de dados
- ✅ Interface em Português
- ✅ Web + Desktop

## 🐛 Problemas?

1. Não consigo entrar → Execute `limpar-dados-desktop.bat`
2. Dados não salvam → Verifique permissões da pasta `dados/`
3. Preciso instalar dependências → Execute `npm install`

## 📚 Documentação Completa

Veja os arquivos:
- `SISTEMA-PRONTO.txt` - Status completo do sistema
- `ESTRUTURA-DADOS.txt` - Estrutura de dados detalhada
- `CORRIGIR-LOGIN-DESKTOP.txt` - Troubleshooting do login
- `README-DESKTOP.txt` - Guia completo do desktop

---

**Versão:** 2.3.0  
**Desenvolvido para:** Bicicletário Shop - Boulevard V.V.  
**Data:** 19 de Dezembro de 2025
