# Opções de Implantação (Deployment Options)

Este documento detalha as opções de implantação para o sistema Bicicletário Online, com foco na opção selecionada de **Hospedagem Online (Nuvem)**.

## 1. Hospedagem Local (Atual)
- **Descrição**: O servidor roda na máquina local (PC do estabelecimento).
- **Acesso**: Apenas dispositivos na mesma rede Wi-Fi.
- **Banco de Dados**: SQLite (arquivo local).
- **Custo**: Zero.
- **Prós**: Simples, sem dependência de internet externa, dados sob controle total.
- **Contras**: Acesso restrito ao local, risco de perda de dados se o PC estragar (backup manual necessário).

## 2. Hospedagem Online (Nuvem)  ⬅ **SELECIONADA**
- **Descrição**: O servidor e o banco de dados são hospedados em um provedor de nuvem (ex: Render, Railway, PythonAnywhere).
- **Acesso**: Acessível de qualquer lugar via internet (4G, Wi-Fi de casa, etc).
- **Banco de Dados**: PostgreSQL (Gerenciado na nuvem).
- **Custo**: 
    - **Testes/Desenvolvimento**: Gratuito (Free Tiers).
    - **Produção**: Baixo custo (~$5-10/mês para remover limitações de "dormência" ou limites de execução).
- **Prós**: Acesso universal, backups automáticos (dependendo do provedor), maior disponibilidade.
- **Contras**: Depende de conexão com internet, configuração inicial um pouco mais técnica.

### Mudanças Necessárias para Nuvem
Para habilitar esta opção, precisamos fazer pequenas alterações no código, especificamente na camada de dados (`db_manager.py`), para substituir o SQLite (que não funciona bem em containers efêmeros) pelo PostgreSQL.

1.  **Adaptar `db_manager.py`**: Adicionar suporte a conexões PostgreSQL usando `psycopg2`.
2.  **Configuração via Variáveis de Ambiente**: Usar `DATABASE_URL` para conectar ao banco de dados.
3.  **Preparar para Deploy**: Adicionar arquivos de configuração padrão (`requirements.txt` atualizado, `Procfile` ou `render.yaml`).

## 3. Hospedagem Híbrida (Sincronização)
- **Descrição**: Mantém o servidor local, mas sincroniza dados com a nuvem periodicamente.
- **Prós**: Funciona offline, backup na nuvem.
- **Contras**: Alta complexidade de implementação (sincronização bidirecional, resolução de conflitos).
