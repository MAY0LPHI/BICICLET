╔════════════════════════════════════════════════════════════════════╗
║          GESTOR DE BICICLETÁRIO - VERSÃO DESKTOP                   ║
║                                                                    ║
║  Como Executar a Aplicação Desktop (Electron)                      ║
╚════════════════════════════════════════════════════════════════════╝


OPÇÃO 1: USANDO O ARQUIVO .BAT (RECOMENDADO)
═════════════════════════════════════════════

Windows (Simples):
  → Duplo clique em: iniciar-desktop-simples.bat
  
Windows (Detalhado com verificações):
  → Duplo clique em: iniciar-desktop.bat
  → Ou abra "Prompt de Comando" (cmd) aqui e execute: iniciar-desktop.bat


OPÇÃO 2: USANDO POWERSHELL
════════════════════════════

Windows 10 ou superior:
  → Clique com botão direito em: iniciar-desktop.ps1
  → Selecione: "Run with PowerShell"
  
Ou abra PowerShell e execute:
  → Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
  → .\iniciar-desktop.ps1


OPÇÃO 3: MANUAL (Prompt de Comando)
════════════════════════════════════

Abra "Prompt de Comando" (cmd) na pasta do projeto e execute:

  1. Primeira execução:
     npm install
     npm start

  2. Próximas execuções:
     npm start


PRÉ-REQUISITOS
═══════════════

✓ Node.js instalado (versão 14 ou superior)
  → Baixe em: https://nodejs.org/
  → Recomendamos a versão LTS (Long Term Support)

✓ npm (incluído com Node.js)

Para verificar se estão instalados, abra Prompt de Comando e execute:
  node --version
  npm --version


DADOS DA APLICAÇÃO
════════════════════

Os dados são salvos em:
  → dados/desktop/

Arquivos criados:
  • clientes.json ........... Lista de clientes
  • registros.json .......... Registros de entrada/saída
  • usuarios.json ........... Usuários do sistema
  • auditoria.json .......... Log de auditoria
  • categorias.json ......... Categorias


CREDENCIAIS PADRÃO
═══════════════════

Admin:
  Usuário: admin
  Senha:   admin123

Dono (Owner):
  Usuário: CELO123
  Senha:   CELO123


RESOLUÇÃO DE PROBLEMAS
══════════════════════

❌ "npm: comando não encontrado"
   → Node.js não está instalado ou não está no PATH
   → Reinstale Node.js de: https://nodejs.org/

❌ "Cannot find module 'electron'"
   → Execute: npm install
   → Aguarde até terminar (pode levar alguns minutos)

❌ Aplicação não abre
   → Execute em PowerShell como Administrador
   → Verifique antivírus (pode estar bloqueando)

❌ Dados não estão sendo salvos
   → Verifique permissões da pasta
   → Certifique-se de que a pasta "dados" existe e é gravável


PARA DESINSTALAR DEPENDÊNCIAS
══════════════════════════════

Se tiver problemas, pode remover e reinstalar:

  1. Delete a pasta: node_modules
  2. Delete o arquivo: package-lock.json
  3. Execute: npm install


CONSTRUIR INSTALADOR WINDOWS
══════════════════════════════

Para gerar um arquivo .exe instalável:

  npm run build

O arquivo será criado em: dist/

Requisitos:
  • Windows 10 ou superior
  • 200 MB de espaço livre
  • Permissões de administrador


SUPORTE E MAIS INFORMAÇÕES
════════════════════════════

Versão: 2.2.0
Desenvolvido para: Bicicletário Shop - Boulevard V.V.

Para problemas, verifique:
  • Que o Node.js está atualizado
  • Que tem permissão de escrita na pasta
  • Que não há antivírus bloqueando
  • Que o Windows está atualizado


════════════════════════════════════════════════════════════════════

Dúvidas? Abra Prompt de Comando na pasta e execute:
  npm start

Pressione Ctrl+C para parar a aplicação.
