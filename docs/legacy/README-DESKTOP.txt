╔════════════════════════════════════════════════════════════════════╗
║          GESTOR DE BICICLETÁRIO - VERSÃO DESKTOP                   ║
║                                                                    ║
║  Como Executar a Aplicação Desktop (Electron)                      ║
╚════════════════════════════════════════════════════════════════════╝


OPÇÃO 1: USANDO O ARQUIVO .BAT (RECOMENDADO)
═════════════════════════════════════════════

Windows:
   → Duplo clique em: scripts\INICIAR-NAVEGADOR.bat
   → Isso iniciará o servidor e abrirá o navegador automaticamente.

OPÇÃO 2: MANUAL (Prompt de Comando)
════════════════════════════════════

Abra "Prompt de Comando" (cmd) na pasta do projeto e execute:

  python server.py

Isso iniciará o servidor na porta 5000.
Acesse http://localhost:5000 no seu navegador.


DADOS DA APLICAÇÃO
════════════════════

Os dados são salvos em:
  → dados/navegador/ (Web/Offline)

A estrutura de dados é:
  • clientes/ ............... Arquivos JSON por cliente
  • registros/ .............. Arquivos JSON por registro


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

❌ "Python não encontrado"
   → Instale Python 3.12+ e marque "Add to PATH"

❌ "Porta 5000 em uso"
   → Verifique se já não tem outra instância rodando
   → Feche o terminal e tente novamente

❌ Aplicação não abre
   → Tente executar como Administrador

❌ Dados não estão sendo salvos
   → Verifique permissões da pasta "dados"


SUPORTE E MAIS INFORMAÇÕES
════════════════════════════

Versão: 3.1.0 (Offline + Jogos)
Desenvolvido para: Bicicletário Shop - Boulevard V.V.

Para mais detalhes, consulte a pasta docs/.

════════════════════════════════════════════════════════════════════

Dúvidas? Entre em contato com o suporte.
