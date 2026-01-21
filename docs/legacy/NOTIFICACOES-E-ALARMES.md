# Documentação: Sistema de Notificações e Alarmes

## Visão Geral

O sistema de notificações e alarmes foi implementado para auxiliar os operadores do bicicletário a manter a segurança e realizar verificações periódicas. O sistema oferece três tipos de alertas configuráveis.

## Funcionalidades

### 1. Alerta de Inatividade

Notifica o operador quando não há movimentação de clientes (entrada ou saída) no bicicletário.

#### Configurações:
- **Intervalo**: Define o tempo (em minutos) sem atividade antes de disparar o alerta
  - Valor padrão: 10 minutos
  - Intervalo permitido: 1 a 120 minutos
  
- **Modo Aleatório**: Quando ativado, o intervalo varia aleatoriamente entre 5 e 15 minutos
  - Útil para evitar previsibilidade no monitoramento

#### Como funciona:
1. O timer é iniciado quando o sistema é carregado
2. Cada entrada ou saída de cliente reseta o contador de inatividade
3. Quando o tempo de inatividade é atingido, exibe um alerta visual
4. Um som de notificação é reproduzido (opcional, baseado em permissões do navegador)

### 2. Ronda por Número de Acessos

Solicita que o operador realize uma verificação após um número específico de entradas e saídas.

#### Configurações:
- **Número de acessos**: Define quantas movimentações devem ocorrer antes de solicitar a ronda
  - Valor padrão: 10 acessos
  - Intervalo permitido: 1 a 100 acessos

#### Como funciona:
1. Cada entrada de cliente incrementa o contador
2. Cada saída de cliente incrementa o contador
3. Quando o limite é atingido, exibe um alerta solicitando verificação
4. O contador é automaticamente resetado após o alerta
5. Um som de notificação é reproduzido

### 3. Ronda de Verificação Periódica

Exibe um popup interativo solicitando que o operador realize uma ronda de verificação no local.

#### Configurações:
- **Intervalo**: Define o tempo (em minutos) entre cada solicitação de ronda
  - Valor padrão: 60 minutos
  - Intervalo permitido: 15 a 480 minutos (8 horas)

#### Como funciona:
1. O timer é iniciado quando o sistema é carregado
2. Ao chegar no intervalo configurado, exibe um popup com duas opções:
   
   **a) Adiar 5 minutos**: 
   - Adia a solicitação por 5 minutos
   - Útil quando o operador está ocupado com outra tarefa
   
   **b) Tarefa realizada**:
   - Marca a ronda como concluída
   - Registra a conclusão no histórico (localStorage)
   - O registro inclui timestamp

3. Popup inclui descrição da tarefa:
   - "Verificar bicicletas destrancadas"
   - "Verificar pertences no local"

4. Som de alerta é reproduzido ao exibir o popup

## Acesso às Configurações

### Localização no Sistema:
1. Faça login no sistema
2. Clique na aba "Configuração" no menu superior
3. Role até a seção "Notificações e Alarmes"

### Interface de Configuração:

A seção possui três cards expansíveis, cada um com:
- **Toggle switch**: Liga/desliga a funcionalidade
- **Configurações específicas**: Aparecem quando o toggle está ativado
- **Descrição**: Explica o comportamento de cada alerta

### Salvando Configurações:

Após ajustar as configurações desejadas:
1. Clique no botão "Salvar Configurações" (azul, no final da seção)
2. Uma mensagem de confirmação será exibida
3. As notificações começam a funcionar imediatamente

## Armazenamento de Dados

### LocalStorage:
- **Chave**: `notification_settings`
- **Formato**: JSON com as configurações ativas
- **Persistência**: Mantido mesmo após fechar o navegador

### Logs de Ronda:
- **Chave**: `patrol_logs`
- **Formato**: Array de objetos JSON com:
  - `type`: Tipo do log (patrol_round)
  - `timestamp`: Data/hora da conclusão
  - `status`: Status da ronda (completed)
- **Retenção**: 30 dias (limpeza automática)

## Arquivos do Sistema

### Arquivo Principal:
**`js/shared/notifications.js`**
- Classe `NotificationManager`: Gerencia todas as notificações
- Instância global exportada: `notificationManager`
- Métodos principais:
  - `saveSettings()`: Salva configurações
  - `getSettings()`: Obtém configurações atuais
  - `onClientActivity()`: Chamado quando há movimento
  - `showInactivityNotification()`: Exibe alerta de inatividade
  - `showPatrolRequestNotification()`: Solicita ronda por acessos
  - `showPatrolRoundPopup()`: Exibe popup de ronda periódica
  - `snoozePatrolRound()`: Adia ronda por 5 minutos
  - `completePatrolRound()`: Marca ronda como concluída

### Integração:
**`js/configuracao/configuracao.js`**
- Método `setupNotificationSettings()`: Configura UI e event listeners
- Carrega configurações salvas ao iniciar
- Gerencia toggles e inputs da interface

**`js/registros/registros-diarios.js`**
- Importa `notificationManager`
- Chama `onClientActivity()` após cada entrada/saída
- Integração em:
  - `handleAddRegistro()`: Após adicionar novo registro
  - `handleRegisterSaida()`: Após registrar saída
  - `handleActionChange()`: Após registrar saída via dropdown

**`index.html`**
- Seção "Notificações e Alarmes" na aba de configuração
- Toggle switches com estilo consistente
- Inputs numéricos com validação
- Botão de salvar configurações

## Sons de Notificação

O sistema utiliza Web Audio API para reproduzir um som simples:
- **Frequência**: 800 Hz
- **Duração**: 0.5 segundos
- **Volume**: 30%
- **Tipo de onda**: Sine wave

### Requisitos:
- Navegador moderno com suporte a Web Audio API
- Permissão do usuário para reproduzir áudio
- Nota: Alguns navegadores bloqueiam áudio automático

## Testes e Validação

### Teste Manual:

#### 1. Alerta de Inatividade:
```
1. Ative o alerta com intervalo de 1 minuto
2. Aguarde 1 minuto sem registrar entrada/saída
3. Verifique se o alerta é exibido
4. Registre uma entrada
5. Verifique se o timer foi resetado
```

#### 2. Ronda por Acessos:
```
1. Ative a ronda com limite de 2 acessos
2. Registre 2 entradas ou saídas
3. Verifique se o alerta de ronda é exibido
4. Verifique se o contador foi resetado
```

#### 3. Ronda Periódica:
```
1. Ative a ronda com intervalo de 1 minuto (para teste)
2. Aguarde 1 minuto
3. Verifique se o popup é exibido
4. Teste "Adiar 5 minutos" - popup deve reaparecer após 5 min
5. Teste "Tarefa realizada" - verifique se foi registrado
```

## Considerações de Segurança

- Não armazena dados sensíveis
- Usa apenas localStorage local do navegador
- Não envia dados para servidores externos
- Funciona offline
- Logs têm limpeza automática (30 dias)

## Compatibilidade

### Navegadores Suportados:
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

### Funcionalidades Requeridas:
- LocalStorage
- Web Audio API (opcional, para sons)
- ES6 Modules
- setTimeout/setInterval

## Limitações Conhecidas

1. **Timer pausado em aba inativa**: Navegadores podem pausar timers em abas não ativas
2. **Som bloqueado**: Alguns navegadores bloqueiam reprodução automática de áudio
3. **Sincronização multi-tab**: Configurações não sincronizam automaticamente entre abas
4. **Precisão de timer**: Pode haver desvio de alguns segundos em intervalos longos

## Melhorias Futuras

- [ ] Sincronização em tempo real entre múltiplas abas
- [ ] Notificações do navegador (Push Notifications)
- [ ] Histórico de alertas disparados
- [ ] Personalização de sons de notificação
- [ ] Integração com sistema de auditoria
- [ ] Relatórios de conformidade de rondas
- [ ] Lembretes por horário específico (ex: 9h, 12h, 15h)

## Suporte

Para dúvidas ou problemas:
1. Verifique se o navegador é compatível
2. Verifique se JavaScript está habilitado
3. Verifique se há erros no console do navegador (F12)
4. Verifique se as configurações foram salvas corretamente
5. Tente recarregar a página (Ctrl+F5)

## Autor

Implementado por: GitHub Copilot Agent
Data: 2026-01-08
Versão: 1.0.0
