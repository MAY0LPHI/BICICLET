# ⚙️ Manual de Configuração Avançada

Este guia detalha todas as opções de personalização e manutenção do sistema.

## 🎨 Aparência e Temas

O sistema possui um motor de temas robusto compatível com Preferências do Sistema e personalização manual.

### Temas Disponíveis
1. **Automático (Sistema)**: Segue a preferência do seu Windows/Navegador (Claro/Escuro).
2. **Claro (Light)**: Tema padrão para ambientes iluminados.
3. **Escuro (Dark)**: Tema de alto contraste para ambientes escuros.

### Temas Personalizados
No menu "Temas", clique em **"Personalizar Tema"** para:
- Escolher **Cores de Destaque** (Primária, Secundária, Acento).
- Selecionar **Presets** (Oceano, Floresta, Pôr do Sol, Ametista, etc.).
- As alterações são salvas localmente por usuário.

## 🏷️ Gerenciamento de Categorias

As categorias ajudam a organizar os clientes (ex: Mensalista, Diarista, Funcionário).

### Adicionar Categoria
1. Vá na aba **Configurações**.
2. No campo "Nova Categoria", digite o nome (ex: "VIP").
3. O sistema atribuirá um ícone/emoji automático.

### Editar Categoria
1. Clique no lápis (✏️) ao lado de uma categoria.
2. Você pode **Renomear** a categoria.
3. Você pode **Alterar o Ícone** escolhendo entre as opções disponíveis (Prédio, Usuário, Estrela, etc.).
4. A alteração reflete em todos os clientes dessa categoria automaticamente.

### Estatísticas
O painel mostra quantos clientes existem em cada categoria e a porcentagem total.

## 💾 Backup e Dados

### Exportação (Excel/CSV)
- **Dados Completos**: Exporta TUDO (Clientes + Registros).
- **Dados Filtrados**: Escolha um período (Data Início - Data Fim).
- Formatos: `.xlsx` (Excel) ou `.csv` (Texto separado por vírgulas).

### Importação
- Permite restaurar dados de um arquivo `.json` ou `.csv` gerado anteriormente pelo sistema.
- **Atenção**: O sistema tenta mesclar dados, mas recomenda-se fazer um backup antes de importar.

### Gerenciamento de Backups Automáticos
O sistema cria backups automáticos periodicamente no Electron (Desktop).
- Você pode definir o **limite de backups** (padrão: 10).
- Backups antigos são removidos automaticamente para economizar espaço.
- Botão **"Fazer Backup Agora"**: Cria um ponto de restauração imediato.

## 🔔 Notificações e Sons
- Configure se deseja receber alertas visuais ou sonoros para:
  - Entrada/Saída de veículos.
  - Erros do sistema.
  - Conclusão de exportações.

## 🛠️ Modo Desenvolvedor / Debug
- O sistema possui logs de auditoria detalhados.
- Em caso de erros, verifique o console do navegador (F12) ou os arquivos de log na pasta `dados/logs/` (Desktop).
