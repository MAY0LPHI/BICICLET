# 🌙 Funcionalidade PERNOITE

## Descrição
A funcionalidade **PERNOITE** permite registrar quando um cliente deixa sua bicicleta pernoitando no estabelecimento. O registro aparece tanto no dia original quanto no dia seguinte com uma marcação especial.

## Como Usar

### 1. Acessar a Aba de Registros Diários
- Navegue até a aba **"Registros Diários"**
- Selecione uma data no calendário

### 2. Registrar como Pernoite
- Localize o registro do cliente que ficará com a bicicleta pernoitando
- Na coluna **"Ação"**, abra o menu dropdown
- Selecione a opção **🌙 Pernoite**
- Confirme a ação

### 3. Resultado
Após confirmar:
- ✅ O registro original no **dia atual** é marcado como PERNOITE
  - Mostra a data/hora de entrada normal
  - Badge roxo com o texto **"🌙 PERNOITE"**
  - Botão de **reverter** ao lado (ícone de seta circular)
  - Badge de status **"PERNOITE Ativo"** na coluna de Ação
- ✅ Um novo registro é criado automaticamente para o **dia seguinte**
  - Mostra a data e hora da entrada **original**
  - Badge roxo com o texto **"🌙 PERNOITE"**
  - Badge de status **"PERNOITE Ativo"** na coluna de Ação
  - Botão de **reverter** ao lado
  - Status em aberto (sem saída registrada)

## Exemplo Prático

### Cenário:
Cliente **Marcelo Jorge** deixa sua bicicleta **aro 29** no dia **07/11/2025 às 18:30**

### Passos:
1. Vai na aba "Registros Diários"
2. Seleciona a data **07/11/2025**
3. Encontra o registro de Marcelo Jorge
4. Seleciona **🌙 Pernoite** no dropdown de ações
5. Confirma

### Resultado:

**No dia 07/11/2025:**
- Cliente: Marcelo Jorge
- Bicicleta: aro 29
- Entrada: **07/11/2025, 18:30:00** 🌙 **PERNOITE**
- Ação: **PERNOITE Ativo** 🔄 (botão reverter)
- Status: Em aberto

**No dia 08/11/2025:**
- Cliente: Marcelo Jorge  
- Bicicleta: aro 29
- Entrada: **07/11/2025, 18:30:00** 🌙 **PERNOITE**
- Ação: **PERNOITE Ativo** 🔄 (botão reverter)
- Status: Em aberto

## Benefícios

✅ **Rastreabilidade**: Mantém o registro da hora exata de entrada original  
✅ **Visibilidade**: Fácil identificar pernoites com o badge roxo  
✅ **Controle**: Permite registrar saída no dia seguinte normalmente  
✅ **Histórico**: Não perde informação da data/hora real de entrada  

## Diferenças com Outros Registros

| Característica | Registro Normal | Registro Pernoite (Dia Atual) | Registro Pernoite (Dia Seguinte) |
|----------------|-----------------|-------------------------------|----------------------------------|
| Data de entrada | Dia atual | Dia atual | Dia seguinte |
| Hora de entrada | Hora atual | Hora atual | Hora do dia anterior |
| Badge visual na entrada | Nenhum | 🌙 PERNOITE (roxo) | 🌙 PERNOITE (roxo) |
| Dropdown de ações | Sim | Não (desabilitado) | **Sim (disponível!)** |
| Badge de status na ação | Nenhum | PERNOITE Ativo (roxo) | PERNOITE Ativo (roxo) |
| Botão reverter | Não | Sim (🔄) | Sim (🔄) |
| Pode registrar saída | Sim | Não (precisa reverter) | **Sim (direto pelo dropdown!)** |

## Gestão de Pernoites

### Reverter Pernoite
- Clique no botão **reverter** (🔄) ao lado do badge "PERNOITE Ativo"
- Confirme a reversão
- **Resultado:**
  - O registro do dia seguinte é **removido automaticamente**
  - O registro do dia atual volta ao estado normal (sem marcação PERNOITE)
  - O dropdown de ações fica disponível novamente

### Outras Ações
- O registro de pernoite pode ser editado normalmente (botão de lápis)
- **No dia atual**: Você **não pode** registrar saída ou remover acesso enquanto estiver marcado como PERNOITE. O dropdown de ações fica desabilitado.
- **No dia seguinte**: O dropdown de ações está DISPONÍVEL! Você pode:
  - 🚪 Registrar Saída normalmente
  - 🚫 Remover Acesso
  - 🌙 Marcar como Pernoite novamente (para mais um dia)
  - 🔄 Trocar Bicicleta
  - ➕ Adicionar Outra Bike
- O badge PERNOITE permanece visível até que seja revertido ou saída seja registrada

## Observações Importantes

⚠️ **Atenção**: 
- Ao selecionar PERNOITE, o registro do **dia atual** não permite mais registrar saída ou remover acesso diretamente (dropdown desabilitado)
- No **dia atual**, para fazer qualquer ação, primeiro **reverta o pernoite** usando o botão 🔄
- No **dia seguinte**, o dropdown de ações está HABILITADO e você pode usar normalmente
- Reverter o pernoite remove automaticamente o registro do dia seguinte
- O registro permanece em aberto em ambos os dias até que você reverta ou registre saída

💡 **Dicas**: 
- Use esta funcionalidade para clientes que deixam a bicicleta durante a noite
- Se o cliente decidir retirar a bike no mesmo dia, **reverta o pernoite** primeiro
- **NOVIDADE**: No dia seguinte, você pode registrar a saída, remover acesso ou fazer qualquer outra ação DIRETO pelo dropdown, sem precisar reverter o pernoite!
- O badge "PERNOITE Ativo" e o botão de reverter continuam disponíveis no dia seguinte para você ter controle total

---

**Versão**: 2.4.0  
**Data de Implementação**: 07/11/2025  
**Última Atualização**: 07/11/2025 - Adicionado dropdown de ações no dia seguinte
