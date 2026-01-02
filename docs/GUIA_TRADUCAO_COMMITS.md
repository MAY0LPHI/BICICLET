# Tradução de Mensagens de Commits - Guia Completo

## Visão Geral

Este repositório contém recursos para traduzir as mensagens de commits do repositório BICICLETARIO do inglês para o português.

## Arquivos Incluídos

1. **TRADUCAO_COMMITS.md** - Documento de referência completo com todas as traduções
2. **scripts/traduzir_commits.sh** - Script automatizado para reescrever o histórico (use com cautela)

## ⚠️ Aviso Importante sobre Reescrita de Histórico

**Reescrever o histórico do Git é uma operação destrutiva que deve ser feita com extremo cuidado.**

### Riscos de Reescrever o Histórico

1. **Mudança de Hashes**: Todos os hashes de commit serão alterados
2. **Impacto em Colaboradores**: Todos os colaboradores precisarão re-clonar o repositório
3. **Pull Requests**: PRs abertos serão afetados e podem precisar ser recriados
4. **Forks**: Forks externos não serão atualizados automaticamente
5. **Referências**: Links para commits específicos em issues, documentação, etc. serão quebrados

### Quando Reescrever o Histórico é Aceitável

- Repositório privado com poucos colaboradores
- Todos os colaboradores estão coordenados e cientes
- Antes de tornar um projeto público
- Parte de uma limpeza planejada do repositório

### Quando NÃO Reescrever o Histórico

- Repositório público com múltiplos contribuidores
- Existem forks ou dependências externas
- Sem coordenação da equipe
- Em branches de produção ativas

## Abordagens Recomendadas

### Abordagem 1: Documentação (Recomendada) ✅

Mantenha o documento `TRADUCAO_COMMITS.md` como referência oficial das traduções. Esta é a abordagem mais segura e não causa problemas para colaboradores.

**Vantagens:**
- Sem risco para colaboradores
- Histórico preservado
- Referências mantidas
- Reversível

**Desvantagens:**
- Histórico permanece em inglês
- Requer consulta ao documento

### Abordagem 2: Novo Repositório

Crie um novo repositório com histórico traduzido e migre gradualmente.

**Vantagens:**
- Histórico limpo em português
- Repositório original preservado
- Migração controlada

**Desvantagens:**
- Requer migração de issues, PRs, etc.
- Perda de stars, forks, etc.
- Trabalho adicional significativo

### Abordagem 3: Reescrita de Histórico (Não Recomendada para este caso) ⚠️

Use o script fornecido para reescrever o histórico. **Somente faça isto se:**

1. Você tem permissões de administrador
2. Todos os colaboradores estão coordenados
3. Não há trabalho em andamento
4. Um backup completo foi feito
5. Você entende completamente as consequências

## Como Usar o Script de Tradução

### Pré-requisitos

```bash
# 1. Certifique-se de que tem permissões adequadas
# 2. Notifique TODOS os colaboradores
# 3. Coordene um horário para a operação
# 4. Certifique-se de que não há PRs ou trabalho pendente
```

### Passos de Execução

```bash
# 1. Clone o repositório (se ainda não fez)
git clone https://github.com/MAY0LPHI/BICICLETARIO.git
cd BICICLETARIO

# 2. Crie um backup manual adicional
cp -r .git .git-backup-$(date +%Y%m%d)

# 3. Execute o script
./scripts/traduzir_commits.sh

# 4. Revise as mudanças
git log --oneline --all | head -50

# 5. Se estiver satisfeito, force-push (CUIDADO!)
# git push --force --all
# git push --force --tags

# 6. Notifique todos os colaboradores imediatamente
```

### Após a Reescrita

**Instruções para Colaboradores:**

```bash
# 1. Fazer backup de branches locais com trabalho não salvo
git branch backup-minha-branch minha-branch

# 2. Remover repositório local
cd ..
rm -rf BICICLETARIO

# 3. Re-clonar do zero
git clone https://github.com/MAY0LPHI/BICICLETARIO.git
cd BICICLETARIO

# 4. Recriar branches de trabalho (se necessário)
# Você precisará fazer rebase ou cherry-pick do trabalho salvo
```

## Exemplo de Traduções

| Original (Inglês) | Traduzido (Português) |
|-------------------|----------------------|
| Initial plan | Plano inicial |
| Add files via upload | Adicionar arquivos via upload |
| Fix bug in authentication | Corrigir bug na autenticação |
| Implement new feature | Implementar nova funcionalidade |
| Update documentation | Atualizar documentação |

## Tradução de Corpos de Commit

O script fornecido traduz apenas os **assuntos** (primeira linha) dos commits. Os corpos são preservados como estão.

Para traduzir também os corpos dos commits, seria necessário:
1. Análise mais complexa de cada commit
2. Tradução manual ou assistida por IA
3. Script mais sofisticado

## Limitações Técnicas

### Ambiente de Desenvolvimento Copilot

**Nota:** As limitações abaixo se aplicam ao ambiente de desenvolvimento GitHub Copilot Workspace. Se você estiver executando o script em seu próprio ambiente local com permissões adequadas, essas restrições não se aplicarão.

No ambiente Copilot:
- Não permite `git push --force` diretamente via comandos bash
- Deve usar a ferramenta `report_progress` para commits
- `report_progress` pode não suportar reescrita de histórico

### Alternativas no Ambiente Copilot

Dado que o ambiente não suporta force-push:
1. Use este PR para documentar as traduções
2. O mantenedor do repositório pode executar o script localmente
3. Ou aceite a documentação como solução

## Recomendação Final

**Para o repositório BICICLETARIO, recomendamos a Abordagem 1 (Documentação)** porque:

1. O repositório já está público
2. Há histórico de PRs e colaborações
3. O impacto para colaboradores seria significativo
4. A documentação fornece valor sem riscos
5. O ambiente de execução tem limitações técnicas

## Suporte

Se você decidir prosseguir com a reescrita de histórico:

1. Leia toda esta documentação
2. Consulte a documentação oficial do Git sobre `filter-branch`
3. Considere usar `git-filter-repo` (mais moderno e eficiente)
4. Teste primeiro em um clone/fork de teste
5. Tenha um plano de rollback

## Recursos Adicionais

- [Git Filter-Branch Documentation](https://git-scm.com/docs/git-filter-branch)
- [Git Filter-Repo](https://github.com/newren/git-filter-repo)
- [Pro Git Book - Rewriting History](https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History)

## Conclusão

Este pacote fornece uma solução completa para tradução de commits, mas enfatiza fortemente a abordagem de documentação como a opção mais segura e prática. A decisão final deve ser tomada pelo mantenedor do repositório com total entendimento das implicações.
