# 🧪 Testes do Sistema BICICLET

Esta pasta contém arquivos de teste e verificação do sistema.

## 📁 Arquivos

### Testes de Formatação
- **verify_audit_formatting_node.js** - Verifica formatação de logs de auditoria
  ```bash
  node tests/verify_audit_formatting_node.js
  ```

### Testes de Configuração
- **verify_cloud.py** - Verifica configuração de banco de dados em ambiente cloud
  ```bash
  # Execute da raiz do projeto
  cd /home/runner/work/BICICLET/BICICLET
  python3 -c "import sys; sys.path.insert(0, '.'); exec(open('tests/verify_cloud.py').read())"
  ```

### Páginas de Teste HTML
- **test-audit.html** - Página de teste para visualização de auditoria
- **test_theme.html** - Página de teste para temas do sistema

## ⚙️ Como Executar

### Testes JavaScript
```bash
node tests/verify_audit_formatting_node.js
```

### Testes Python
Os testes Python precisam ser executados da raiz do projeto para acessar os módulos:
```bash
# Da raiz do projeto
python3 tests/verify_cloud.py
```

## 📝 Notas

- Todos os testes devem passar antes de fazer deploy
- Arquivos HTML podem ser abertos diretamente no navegador
- Testes de formatação validam a estrutura de logs do sistema
