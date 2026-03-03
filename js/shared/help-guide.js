/**
 * ============================================================
 *  ARQUIVO: help-guide.js
 *  DESCRIÇÃO: Guia de Atalhos e Tutorial Interativo
 *
 *  FUNÇÃO:
 *  Exibe um painel flutuante com todos os atalhos do sistema
 *  e um tutorial passo a passo que guia o usuário pelos recursos.
 *  É aberto ao clicar no ícone de bicicleta (bike-logo-btn) no header.
 *
 *  CLASSE HelpGuide:
 *  - Construtor recebe a instância do App para usar switchTab()
 *  - openGuide()   → abre o painel com lista de atalhos + botão tutorial
 *  - closeGuide()  → fecha o painel com animação de fade-out
 *  - startTutorial() → inicia o tutorial passo a passo
 *  - showTutorialStep() → renderiza o destaque e tooltip do passo atual
 *  - endTutorial()  → remove destaque e exibe toast de conclusão
 *
 *  COMO FUNCIONA O TUTORIAL:
 *  1. Cada passo em this.tutorialSteps define:
 *     - target: CSS selector do elemento a destacar
 *     - title/text: conteúdo do tooltip
 *     - position: onde posicionar o tooltip (top/bottom/left/right)
 *     - action: função executada ANTES de mostrar o passo (ex: trocar aba)
 *  2. Um overlay escuro é aplicado sobre toda a tela
 *  3. O elemento alvo fica visível com anel brilhante pulsante
 *  4. Um tooltip com navegação (Anterior/Próximo/Pular) aparece ao lado
 *
 *  ATALHOS DOCUMENTADOS NO PAINEL:
 *  - Navegação: Alt+1 a Alt+6 (cada aba)
 *  - Busca:     / ou F2, Alt+N, Alt+B, Alt+M
 *  - Ações:     Enter, Esc, duplo clique, Alt+L (logout)
 *
 *  PARA INICIANTES:
 *  import { HelpGuide } from './shared/help-guide.js';
 *  const guide = new HelpGuide(appInstance);
 *  guide.openGuide();   // Abre o painel de atalhos
 *  guide.startTutorial(); // Inicia o tutorial diretamente
 * ============================================================
 */
export class HelpGuide {
    constructor(app) {
        this.app = app;
        this.tutorialStep = 0;
        this.tutorialSteps = [
            {
                target: '#clientes-tab',
                title: '1. Aba Clientes',
                text: 'Esta é a aba principal. Aqui você cadastra novos clientes e gerencia as bicicletas de cada um.',
                position: 'bottom',
            },
            {
                target: '#registros-diarios-tab',
                title: '2. Aba Registros',
                text: 'Acompanhe em tempo real quem está no pátio — todas as entradas e saídas do dia.',
                position: 'bottom',
            },
            {
                target: '#nome',
                title: '3. Cadastrar um Cliente',
                text: 'Preencha o Nome Completo aqui. Pressione Enter ou clique em "Salvar" para concluir rapidamente.',
                position: 'right',
                action: () => window.app?.switchTab?.('clientes'),
            },
            {
                target: '#search',
                title: '4. Buscar Clientes',
                text: 'Busque por nome, CPF ou bicicleta. Atalho: pressione "/" ou F2 para focar aqui diretamente.',
                position: 'bottom',
                action: () => window.app?.switchTab?.('clientes'),
            },
            {
                target: '#clientes-list',
                title: '5. Lista de Clientes',
                text: 'Clique no botão ▶ verde para registrar entrada instantânea. Clique no ✏ para editar.',
                position: 'right',
                action: () => window.app?.switchTab?.('clientes'),
            },
            {
                target: '#registros-diarios-tab',
                title: '6. Registros do Dia',
                text: 'Vá para Registros para ver quem está no pátio agora.',
                position: 'bottom',
                action: () => window.app?.switchTab?.('registros-diarios'),
            },
            {
                target: '#daily-records-date',
                title: '7. Escolher a Data',
                text: 'Selecione a data. O sistema mostrará automaticamente todos os registros daquele dia.',
                position: 'bottom',
                action: () => window.app?.switchTab?.('registros-diarios'),
            },
            {
                target: '#daily-records-list',
                title: '8. Registrar Saída',
                text: 'Use o menu "Selecione uma ação", ou DUPLO CLIQUE direto na linha do cliente para saída rápida!',
                position: 'top',
                action: () => window.app?.switchTab?.('registros-diarios'),
            },
            {
                target: '#configuracao-tab',
                title: '9. Configurações',
                text: 'Aqui você personaliza categorias de clientes, o tema visual e outras opções do sistema.',
                position: 'bottom',
            },
            {
                target: '.bike-logo-btn',
                title: '✅ Tutorial Concluído!',
                text: 'Clique sempre neste ícone de bicicleta para abrir o Guia de Atalhos e este Tutorial.',
                position: 'bottom',
            },
        ];
    }

    openGuide() {
        document.getElementById('help-guide-panel')?.remove();

        const isDark = document.documentElement.classList.contains('dark');

        const panel = document.createElement('div');
        panel.id = 'help-guide-panel';
        panel.className = 'fixed inset-0 z-[9999] flex items-center justify-center';
        panel.style.cssText = 'background: rgba(15,23,42,0.6); backdrop-filter: blur(8px); animation: hgFadeIn 0.25s ease;';

        panel.innerHTML = `
            <style>
                @keyframes hgFadeIn { from { opacity:0 } to { opacity:1 } }
                @keyframes hgSlideUp { from { transform:translateY(32px); opacity:0 } to { transform:translateY(0); opacity:1 } }
                #help-guide-box { animation: hgSlideUp 0.3s cubic-bezier(.16,1,.3,1); }
                .hg-shortcut-key {
                    display: inline-flex; align-items: center; justify-content: center;
                    padding: 2px 8px; border-radius: 6px;
                    font-family: monospace; font-size: 11px; font-weight: 700;
                    white-space: nowrap; flex-shrink: 0;
                    background: var(--hg-key-bg); border: 1px solid var(--hg-key-border);
                    border-bottom: 3px solid var(--hg-key-shadow); color: var(--hg-key-text);
                }
                .hg-row { display:flex; align-items:center; justify-content:space-between; padding:8px 0; font-size:13px; border-bottom: 1px solid var(--hg-divider); gap:12px; }
                .hg-row:last-child { border-bottom: none; }
                .hg-section-title { font-size:10px; font-weight:800; text-transform:uppercase; letter-spacing:.1em; display:flex; align-items:center; gap:6px; margin: 18px 0 8px; color: var(--hg-accent); }
                .hg-section-title:first-of-type { margin-top: 0; }
                .hg-keys { display:flex; align-items:center; gap:4px; flex-shrink:0; }
                .hg-desc { flex:1; color:var(--hg-text-muted); }
                #help-guide-box::-webkit-scrollbar { width:6px; }
                #help-guide-box::-webkit-scrollbar-track { background: var(--hg-scrolltrack); border-radius:8px; }
                #help-guide-box::-webkit-scrollbar-thumb { background: var(--hg-scrollthumb); border-radius:8px; }
            </style>

            <div id="help-guide-box"
                style="
                    --hg-bg: ${isDark ? '#1e293b' : '#ffffff'};
                    --hg-header: ${isDark ? '#0f172a' : '#f8fafc'};
                    --hg-border: ${isDark ? '#334155' : '#e2e8f0'};
                    --hg-text: ${isDark ? '#f1f5f9' : '#1e293b'};
                    --hg-text-muted: ${isDark ? '#94a3b8' : '#64748b'};
                    --hg-accent: var(--color-primary, #2563eb);
                    --hg-divider: ${isDark ? '#2d3f55' : '#f1f5f9'};
                    --hg-key-bg: ${isDark ? '#334155' : '#f1f5f9'};
                    --hg-key-border: ${isDark ? '#475569' : '#cbd5e1'};
                    --hg-key-shadow: ${isDark ? '#64748b' : '#94a3b8'};
                    --hg-key-text: ${isDark ? '#e2e8f0' : '#334155'};
                    --hg-card: ${isDark ? 'rgba(30,58,138,0.2)' : '#eff6ff'};
                    --hg-card-border: ${isDark ? '#1e3a8a' : '#bfdbfe'};
                    --hg-card-text: ${isDark ? '#93c5fd' : '#1d4ed8'};
                    --hg-card-sub: ${isDark ? '#60a5fa' : '#3b82f6'};
                    --hg-scrolltrack: ${isDark ? '#1e293b' : '#f1f5f9'};
                    --hg-scrollthumb: ${isDark ? '#334155' : '#cbd5e1'};
                    background: var(--hg-bg);
                    color: var(--hg-text);
                    border: 1px solid var(--hg-border);
                    border-radius: 20px;
                    width: min(680px, 96vw); max-height: 90vh; overflow-y: auto;
                    box-shadow: 0 32px 80px rgba(0,0,0,${isDark ? '0.6' : '0.2'});
                ">

                <!-- Header -->
                <div style="padding:20px 24px 16px; border-bottom:1px solid var(--hg-border); background:var(--hg-header); border-radius:20px 20px 0 0; display:flex; align-items:center; gap:12px; position:sticky; top:0; z-index:10;">
                    <div style="width:40px;height:40px;border-radius:10px;background:var(--color-primary,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
                    </div>
                    <div style="flex:1;">
                        <h2 style="margin:0;font-size:17px;font-weight:800;color:var(--hg-text);">Guia de Atalhos & Automações</h2>
                        <p style="margin:2px 0 0;font-size:11px;color:var(--hg-text-muted);">Bicicletário — Shop Boulevard V.V.</p>
                    </div>
                    <button id="help-guide-close"
                        style="width:30px;height:30px;border-radius:50%;border:1px solid var(--hg-border);background:var(--hg-bg);cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--hg-text-muted);flex-shrink:0;"
                        title="Fechar (Esc)">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                    </button>
                </div>

                <!-- Body -->
                <div style="padding:20px 24px 24px;">

                    <!-- Tutorial Banner -->
                    <div style="padding:14px 18px;border-radius:12px;background:var(--hg-card);border:1px solid var(--hg-card-border);display:flex;align-items:center;gap:14px;margin-bottom:20px;">
                        <div style="font-size:26px;line-height:1;">🚀</div>
                        <div style="flex:1;">
                            <p style="margin:0 0 2px;font-size:13px;font-weight:700;color:var(--hg-card-text);">Tutorial para Iniciantes</p>
                            <p style="margin:0;font-size:12px;color:var(--hg-card-sub);">Aprenda a usar o sistema com guia passo a passo interativo.</p>
                        </div>
                        <button id="help-start-tutorial"
                            style="padding:8px 16px;border-radius:8px;border:none;background:var(--color-primary,#2563eb);color:white;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;box-shadow:0 4px 12px rgba(37,99,235,0.35);">
                            ▶ Iniciar Tutorial
                        </button>
                    </div>

                    <!-- === SEÇÃO: NAVEGAR === -->
                    <div class="hg-section-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
                        Navegar entre Abas
                    </div>
                    <div class="hg-row"><span class="hg-desc">Clientes</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">1</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Registros Diários</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">2</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Usuários</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">3</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Dados / Backup</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">4</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Configuração</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">5</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Jogos</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">6</span></div></div>

                    <!-- === SEÇÃO: BUSCA === -->
                    <div class="hg-section-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                        Busca e Foco
                    </div>
                    <div class="hg-row"><span class="hg-desc">Focar campo de busca da aba atual</span><div class="hg-keys"><span class="hg-shortcut-key">/</span> ou <span class="hg-shortcut-key">F2</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Ir para o campo "Nome Completo" (cadastro)</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">N</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Focar busca de Clientes Cadastrados</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">B</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Focar busca de Registros do Dia</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">M</span></div></div>

                    <!-- === SEÇÃO: AÇÕES === -->
                    <div class="hg-section-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>
                        Ações Rápidas
                    </div>
                    <div class="hg-row"><span class="hg-desc">Fechar modal / Cancelar confirmação aberta</span><div class="hg-keys"><span class="hg-shortcut-key">Esc</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Confirmar na janela de confirmação</span><div class="hg-keys"><span class="hg-shortcut-key">Enter</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Salvar cliente (enquanto preenche o formulário)</span><div class="hg-keys"><span class="hg-shortcut-key">Enter</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Saída rápida de registro (na aba Registros)</span><div class="hg-keys"><span style="font-size:13px;color:var(--hg-text-muted);">🖱 Duplo Clique</span></div></div>
                    <div class="hg-row"><span class="hg-desc">Sair do usuário atual (logout)</span><div class="hg-keys"><span class="hg-shortcut-key">Alt</span>+<span class="hg-shortcut-key">L</span></div></div>

                    <!-- === SEÇÃO: AUTOMAÇÕES === -->
                    <div class="hg-section-title">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                        Automações do Sistema
                    </div>
                    <div class="hg-row"><span class="hg-desc">🟢 <strong>Entrada Expressa</strong> — botão ▶ no card do cliente. Cria registro de entrada em 1 clique.</span></div>
                    <div class="hg-row"><span class="hg-desc">⚡ <strong>Auto-foco</strong> — após salvar cliente, o campo "Nome" foca automaticamente para o próximo.</span></div>
                    <div class="hg-row"><span class="hg-desc">🔄 <strong>Duplo clique</strong> — em linha ativa nos Registros, confirma saída diretamente.</span></div>
                </div>
            </div>
        `;

        document.body.appendChild(panel);

        // Fechar ao clicar fora
        panel.addEventListener('click', (e) => { if (e.target === panel) this.closeGuide(); });
        document.getElementById('help-guide-close').addEventListener('click', () => this.closeGuide());
        document.getElementById('help-start-tutorial').addEventListener('click', () => {
            this.closeGuide();
            this.startTutorial();
        });

        // Esc fecha
        const escHandler = (e) => {
            if (e.key === 'Escape') { this.closeGuide(); document.removeEventListener('keydown', escHandler); }
        };
        document.addEventListener('keydown', escHandler);
    }

    closeGuide() {
        const panel = document.getElementById('help-guide-panel');
        if (panel) {
            panel.style.transition = 'opacity 0.2s';
            panel.style.opacity = '0';
            setTimeout(() => panel.remove(), 200);
        }
    }

    startTutorial() {
        this.tutorialStep = 0;
        // Inject animation CSS once
        if (!document.getElementById('tutorial-style')) {
            const style = document.createElement('style');
            style.id = 'tutorial-style';
            style.textContent = `
                @keyframes tutPulse {
                    0%,100% { box-shadow: 0 0 0 9999px rgba(0,0,0,0.58), 0 0 0 4px rgba(var(--color-primary-rgb,37,99,235),0.4); }
                    50%      { box-shadow: 0 0 0 9999px rgba(0,0,0,0.58), 0 0 0 10px rgba(var(--color-primary-rgb,37,99,235),0.1); }
                }
                @keyframes tutTooltipIn { from { transform:scale(0.9); opacity:0; } to { transform:scale(1); opacity:1; } }
                @keyframes tutToastIn { from { transform:translateX(-50%) translateY(24px); opacity:0; } to { transform:translateX(-50%) translateY(0); opacity:1; } }
            `;
            document.head.appendChild(style);
        }
        this.showTutorialStep();
    }

    showTutorialStep() {
        this.cleanupTutorial();
        const step = this.tutorialSteps[this.tutorialStep];
        if (!step) { this.endTutorial(); return; }

        if (step.action) step.action();

        setTimeout(() => {
            const target = document.querySelector(step.target);
            if (!target) { this.tutorialStep++; this.showTutorialStep(); return; }

            target.scrollIntoView({ behavior: 'smooth', block: 'center' });

            setTimeout(() => {
                const rect = target.getBoundingClientRect();
                const pad = 8;
                const isDark = document.documentElement.classList.contains('dark');

                // Highlight ring
                const highlight = document.createElement('div');
                highlight.id = 'tut-highlight';
                highlight.style.cssText = `
                    position:fixed;
                    top:${rect.top - pad}px; left:${rect.left - pad}px;
                    width:${rect.width + pad * 2}px; height:${rect.height + pad * 2}px;
                    border-radius:12px;
                    border:2px solid var(--color-primary,#2563eb);
                    box-shadow: 0 0 0 9999px rgba(0,0,0,0.58);
                    z-index:10001; pointer-events:none;
                    animation: tutPulse 1.5s ease-in-out infinite;
                `;
                document.body.appendChild(highlight);

                // Tooltip
                const isLast = this.tutorialStep === this.tutorialSteps.length - 1;
                const total = this.tutorialSteps.length;
                const current = this.tutorialStep;

                const tooltip = document.createElement('div');
                tooltip.id = 'tut-tooltip';
                tooltip.style.cssText = `
                    position:fixed; z-index:10002;
                    background:${isDark ? '#1e293b' : '#ffffff'};
                    color:${isDark ? '#f1f5f9' : '#1e293b'};
                    border:1px solid ${isDark ? '#334155' : '#e2e8f0'};
                    border-radius:16px; padding:18px 20px;
                    box-shadow: 0 24px 60px rgba(0,0,0,${isDark ? '0.6' : '0.2'});
                    max-width:310px; min-width:240px;
                    animation: tutTooltipIn 0.25s cubic-bezier(.16,1,.3,1);
                `;
                tooltip.innerHTML = `
                    <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px;">
                        <div style="width:26px;height:26px;border-radius:8px;background:var(--color-primary,#2563eb);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><circle cx="18.5" cy="17.5" r="3.5"/><circle cx="5.5" cy="17.5" r="3.5"/><circle cx="15" cy="5" r="1"/><path d="M12 17.5V14l-3-3 4-3 2 3h2"/></svg>
                        </div>
                        <div>
                            <p style="margin:0;font-size:13px;font-weight:800;">${step.title}</p>
                            <p style="margin:0;font-size:11px;color:${isDark ? '#64748b' : '#94a3b8'};">Passo ${current + 1} de ${total}</p>
                        </div>
                    </div>
                    <p style="margin:0 0 14px;font-size:13px;color:${isDark ? '#94a3b8' : '#475569'};line-height:1.55;">${step.text}</p>
                    <div style="display:flex;gap:8px;justify-content:space-between;align-items:center;">
                        <button id="tut-skip" style="font-size:11px;color:${isDark ? '#475569' : '#94a3b8'};background:none;border:none;cursor:pointer;padding:0;">Pular</button>
                        <div style="display:flex;gap:6px;">
                            ${current > 0 ? `<button id="tut-prev" style="padding:7px 12px;border-radius:8px;border:1px solid ${isDark ? '#334155' : '#e2e8f0'};background:${isDark ? '#1e293b' : 'white'};color:${isDark ? '#cbd5e1' : '#475569'};font-size:12px;font-weight:600;cursor:pointer;">← Anterior</button>` : ''}
                            <button id="tut-next" style="padding:7px 16px;border-radius:8px;border:none;background:var(--color-primary,#2563eb);color:white;font-size:12px;font-weight:700;cursor:pointer;">
                                ${isLast ? '✅ Concluir' : 'Próximo →'}
                            </button>
                        </div>
                    </div>
                    <!-- Dots -->
                    <div style="display:flex;gap:4px;justify-content:center;margin-top:12px;">
                        ${Array.from({ length: total }, (_, i) => `<div style="height:5px;border-radius:3px;background:${i === current ? 'var(--color-primary,#2563eb)' : (isDark ? '#334155' : '#e2e8f0')};width:${i === current ? 16 : 5}px;transition:all 0.3s;"></div>`).join('')}
                    </div>
                `;
                document.body.appendChild(tooltip);
                this._positionTooltip(tooltip, rect, step.position || 'bottom');

                document.getElementById('tut-next').addEventListener('click', () => { this.tutorialStep++; this.showTutorialStep(); });
                document.getElementById('tut-skip')?.addEventListener('click', () => this.endTutorial());
                document.getElementById('tut-prev')?.addEventListener('click', () => { this.tutorialStep--; this.showTutorialStep(); });
            }, 320);
        }, step.action ? 420 : 60);
    }

    _positionTooltip(tooltip, rect, position) {
        const gap = 16;
        const tw = tooltip.offsetWidth || 300;
        const th = tooltip.offsetHeight || 160;
        const vw = window.innerWidth;
        const vh = window.innerHeight;
        let top, left;
        if (position === 'bottom') { top = rect.bottom + gap; left = rect.left + rect.width / 2 - tw / 2; }
        else if (position === 'top') { top = rect.top - th - gap; left = rect.left + rect.width / 2 - tw / 2; }
        else if (position === 'right') { top = rect.top + rect.height / 2 - th / 2; left = rect.right + gap; }
        else { top = rect.top + rect.height / 2 - th / 2; left = rect.left - tw - gap; }
        left = Math.max(12, Math.min(left, vw - tw - 12));
        top = Math.max(12, Math.min(top, vh - th - 12));
        tooltip.style.top = top + 'px';
        tooltip.style.left = left + 'px';
    }

    cleanupTutorial() {
        document.getElementById('tut-highlight')?.remove();
        document.getElementById('tut-tooltip')?.remove();
    }

    endTutorial() {
        this.cleanupTutorial();
        const isDark = document.documentElement.classList.contains('dark');
        const toast = document.createElement('div');
        toast.style.cssText = `
            position:fixed; bottom:28px; left:50%; transform:translateX(-50%);
            z-index:10010; background:var(--color-primary,#2563eb); color:white;
            padding:13px 24px; border-radius:50px; font-size:13px; font-weight:700;
            box-shadow:0 10px 40px rgba(37,99,235,0.45);
            animation: tutToastIn 0.4s cubic-bezier(.16,1,.3,1);
            white-space:nowrap;
        `;
        toast.textContent = '🎉 Tutorial concluído! Você está pronto para usar o sistema.';
        document.body.appendChild(toast);
        setTimeout(() => {
            toast.style.transition = 'opacity 0.4s';
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 400);
        }, 4000);
    }
}
