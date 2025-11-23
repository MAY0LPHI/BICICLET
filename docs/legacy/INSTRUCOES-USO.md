# 📋 Instruções de Uso - Sistema de Bicicletário

## 🎨 Como Mudar o Tema (Claro/Escuro)

### Passos:
1. Vá na aba **"Configuração"** (terceira aba no topo)
2. Na seção **"Tema do Sistema"**, escolha uma das opções:
   - **Sistema**: Segue a preferência do seu navegador/sistema operacional
   - **Claro**: Tema claro sempre ativo (fundo branco)
   - **Escuro**: Tema escuro sempre ativo (fundo preto)

3. A mudança acontece **instantaneamente** ao selecionar a opção
4. Sua preferência é salva automaticamente

### ⚠️ Se o tema não mudar:
1. Pressione **Ctrl+Shift+R** (Windows/Linux) ou **Cmd+Shift+R** (Mac) para fazer um "hard refresh"
2. Limpe o cache do navegador e recarregue a página
3. Se ainda não funcionar, entre em contato

---

## 💾 Armazenamento em Arquivos Locais

### O que mudou?
Agora o sistema **salva os dados em arquivos** na pasta `dados/` do servidor!

### Estrutura de pastas:
```
dados/
├── clientes/               # Um arquivo .json por cliente
│   ├── 12345678900.json   # Arquivo do cliente com CPF 123.456.789-00
│   ├── 98765432100.json
│   └── ...
└── registro_de_acesso/    # Registros organizados por data
    └── 2025/
        └── 10/
            └── 21/
                ├── registro1.json
                ├── registro2.json
                └── ...
```

### Vantagens:
- ✅ **Dados organizados em arquivos** (fácil de fazer backup)
- ✅ **Um arquivo por cliente** (fácil de encontrar)
- ✅ **Registros organizados por ano/mês/dia**
- ✅ **Formato JSON** (legível e editável)
- ✅ **Backup simples**: copie a pasta `dados/`

### Como funciona:
- **Automático**: O sistema detecta e usa a API de arquivos
- **Transparente**: Não precisa fazer nada diferente
- **Compatível**: Se a API não estiver disponível, usa localStorage (navegador)

### Localização dos arquivos:
- **Replit**: `/home/runner/workspace/dados/`
- **Local**: `dados/` na raiz do projeto

---

## 🔄 Diferenças entre versões

| Recurso | Versão Web (Replit) | Versão Desktop (Electron) |
|---------|-------------------|--------------------------|
| **Armazenamento** | Arquivos em `dados/` no servidor | Arquivos em `%APPDATA%\bicicletario-desktop\dados\` |
| **Acesso** | Pelo navegador | Aplicativo executável |
| **Backup** | Copiar pasta `dados/` | Copiar pasta `dados/` |
| **Portabilidade** | Depende do servidor | Totalmente local |

---

## 📝 Notas Importantes

1. **Cache do Navegador**: Se mudanças não aparecerem, limpe o cache (Ctrl+Shift+R)
2. **Dados Salvos**: Agora são salvos em arquivos, não apenas no navegador
3. **Backup**: Sempre faça backup da pasta `dados/` regularmente
