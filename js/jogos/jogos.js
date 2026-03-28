/**
 * ============================================================
 *  ARQUIVO: jogos.js
 *  DESCRIÇÃO: Sistema de Jogos com Ranking por Usuário
 *
 *  FUNÇÃO:
 *  Oferece uma aba de entretenimento com múltiplos mini-jogos
 *  integrados ao sistema de autenticação, pontuação e conquistas.
 *
 *  CLASSE: JogosManager
 *  Instanciada em app-modular.js como this.jogosManager
 *
 *  JOGOS DISPONÍVEIS (15 total):
 *  ┌──────────────────────────────────────────────────────────────┐
 *  │ Ação:     Snake, Doom, Space Invaders, Breakout,             │
 *  │           Flappy Bird, Dinossauro                             │
 *  │ Palavras: Typing, Termo, Termo Dueto, Termo Quarteto         │
 *  │ Diversos: Jogo da Memória, Caça Palavras, Cruzadinha,        │
 *  │           2048, Brain Test                                    │
 *  └──────────────────────────────────────────────────────────────┘
 *
 *  SISTEMA DE PONTUAÇÃO:
 *  - Cada vitória concede exatamente 2 pontos (addScore)
 *  - Rankings salvos em localStorage 'bicicletario_game_rankings'
 *  - Top 100 pontuações por jogo são mantidas
 *
 *  CONQUISTAS (Achievements):
 *  - Salvas em 'bicicletario_game_achievements' (localStorage)
 *  - Notificação toast ao desbloquear (top-right, 3 segundos)
 *  - Conquistas disponíveis:
 *    first_win        — Primeira Vitória (completar qualquer jogo)
 *    snake_master     — Mestre da Cobrinha (alcançar fase 5 no Snake)
 *    doom_slayer      — Exterminador do Doom (completar todos os níveis)
 *    elephant_memory  — Memória de Elefante (completar modo difícil)
 *    destroyer        — Destruidor (completar todas as fases do Breakout)
 *    galaxy_defender  — Defensor da Galáxia (derrotar o boss do Space Invaders)
 *    termo_master     — Mestre do Termo (acertar na primeira tentativa)
 *
 *  CONTROLE DE ACESSO:
 *  - applyPermissionsToUI() mostra/oculta a aba via Auth.hasPermission
 *  - Permissão necessária: Auth.hasPermission('jogos', 'ver')
 *
 *  ARQUITETURA INTERNA:
 *  - JogosManager: orquestra menu, abertura/fechamento e ranking
 *  - Cada jogo é uma classe independente (SnakeGame, DoomGame, etc.)
 *  - Canvas #game-canvas é reutilizado por todos os jogos
 *  - currentGame.stop() é chamado ao fechar para limpar loops/listeners
 *
 *  DEPENDÊNCIAS:
 *  - auth.js → Auth.getCurrentSession(), Auth.hasPermission()
 *
 *  PARA INICIANTES:
 *  Para adicionar um novo jogo:
 *  1. Crie uma classe NovoJogo com métodos start() e stop()
 *  2. Adicione ao array games em renderGameMenu()
 *  3. Adicione à tabela games em startGame()
 * ============================================================
 */

import { Auth } from '../shared/auth.js';

const STORAGE_KEY_RANKINGS = 'bicicletario_game_rankings';
const STORAGE_KEY_STATS = 'bicicletario_game_stats';
const STORAGE_KEY_ACHIEVEMENTS = 'bicicletario_game_achievements';

export class JogosManager {
    constructor(app) {
        this.app = app;
        this.currentGame = null;
        this.rankings = this.loadRankings();
        this.stats = this.loadStats();
        this.achievements = this.loadAchievements();
    }

    loadRankings() {
        const data = localStorage.getItem(STORAGE_KEY_RANKINGS);
        return data ? JSON.parse(data) : {};
    }

    saveRankings() {
        localStorage.setItem(STORAGE_KEY_RANKINGS, JSON.stringify(this.rankings));
    }

    loadStats() {
        const data = localStorage.getItem(STORAGE_KEY_STATS);
        return data ? JSON.parse(data) : { gamesPlayed: 0, totalTime: 0, bestScore: 0 };
    }

    saveStats() {
        localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(this.stats));
    }

    loadAchievements() {
        const data = localStorage.getItem(STORAGE_KEY_ACHIEVEMENTS);
        return data ? JSON.parse(data) : {};
    }

    saveAchievements() {
        localStorage.setItem(STORAGE_KEY_ACHIEVEMENTS, JSON.stringify(this.achievements));
    }

    unlockAchievement(achievementId) {
        if (!this.achievements[achievementId]) {
            this.achievements[achievementId] = { unlocked: true, date: new Date().toISOString() };
            this.saveAchievements();
            this.showAchievementNotification(achievementId);
        }
    }

    showAchievementNotification(achievementId) {
        const achievementNames = {
            'first_win': 'Primeira Vitória',
            'snake_master': 'Mestre da Cobrinha',
            'doom_slayer': 'Exterminador do Doom',
            'elephant_memory': 'Memória de Elefante',
            'destroyer': 'Destruidor',
            'galaxy_defender': 'Defensor da Galáxia',
            'termo_master': 'Mestre do Termo'
        };
        const name = achievementNames[achievementId] || achievementId;

        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 text-white px-6 py-4 rounded-xl shadow-lg transform translate-x-full transition-transform duration-500';
        notification.style.background = 'linear-gradient(to right, var(--color-primary, #3b82f6), var(--color-secondary, #9333ea))';
        notification.innerHTML = `
            <div class="flex items-center gap-3">
                <i data-lucide="trophy" class="w-6 h-6 text-yellow-300"></i>
                <div>
                    <p class="font-bold">Conquista Desbloqueada!</p>
                    <p class="text-sm opacity-90">${name}</p>
                </div>
            </div>
        `;
        document.body.appendChild(notification);

        setTimeout(() => notification.classList.remove('translate-x-full'), 100);
        setTimeout(() => {
            notification.classList.add('translate-x-full');
            setTimeout(() => notification.remove(), 500);
        }, 3000);

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    addScore(gameId, score) {
        const session = Auth.getCurrentSession();
        if (!session) return;

        const username = session.username;
        const nome = session.nome;

        // Sempre concede exatamente 2 pontos por vitória
        const finalScore = score > 0 ? 2 : 0;

        if (!this.rankings[gameId]) {
            this.rankings[gameId] = [];
        }

        this.rankings[gameId].push({
            username,
            nome,
            score: finalScore,
            date: new Date().toISOString()
        });

        this.rankings[gameId].sort((a, b) => b.score - a.score);
        this.rankings[gameId] = this.rankings[gameId].slice(0, 100);

        // Atualizar estatísticas
        this.stats.gamesPlayed++;
        if (finalScore > this.stats.bestScore) {
            this.stats.bestScore = finalScore;
        }
        this.saveStats();

        // Verificar conquista de primeira vitória
        if (finalScore > 0) {
            this.unlockAchievement('first_win');
        }

        this.saveRankings();
        this.renderRanking(gameId);
    }

    getTopScores(gameId, limit = 10) {
        if (!this.rankings[gameId]) return [];
        return this.rankings[gameId].slice(0, limit);
    }

    getUserBestScore(gameId) {
        const session = Auth.getCurrentSession();
        if (!session || !this.rankings[gameId]) return null;

        const userScores = this.rankings[gameId].filter(r => r.username === session.username);
        return userScores.length > 0 ? userScores[0].score : null;
    }

    init() {
        this.renderGameMenu();
        this.setupEventListeners();
        this.setupBackButton();
    }

    setupBackButton() {
        const backBtn = document.getElementById('back-to-games-btn');
        if (backBtn) {
            backBtn.addEventListener('click', () => this.closeGame());
        }
    }

    setupEventListeners() {
        document.querySelectorAll('.game-card').forEach(card => {
            card.addEventListener('click', () => {
                const gameId = card.dataset.game;
                this.openGame(gameId);
            });
        });
    }

    renderGameMenu() {
        const gamesContainer = document.getElementById('games-menu');
        const statsContainer = document.getElementById('player-stats');
        const achievementsContainer = document.getElementById('player-achievements');

        if (!gamesContainer) return;

        const games = [
            { id: 'snake', name: 'Jogo da Cobrinha', icon: 'zap', description: 'Com 5 fases, obstáculos e power-ups!', category: 'acao' },
            { id: 'doom', name: 'Doom', icon: 'crosshair', description: '3 níveis em primeira pessoa com inimigos!', category: 'acao' },
            { id: 'spaceinvaders', name: 'Invasores Espaciais', icon: 'rocket', description: 'Defenda a Terra dos invasores espaciais!', category: 'acao' },
            { id: 'breakout', name: 'Breakout', icon: 'square', description: '5 fases com power-ups e tijolos resistentes!', category: 'acao' },
            { id: 'typing', name: 'Teste de Digitação', icon: 'keyboard', description: 'Teste sua velocidade de digitação!', category: 'palavras' },
            { id: 'termo', name: 'Termo', icon: 'type', description: 'Adivinhe a palavra de 5 letras!', category: 'palavras' },
            { id: 'termo2', name: 'Termo Dueto', icon: 'columns', description: 'Adivinhe 2 palavras ao mesmo tempo!', category: 'palavras' },
            { id: 'termo4', name: 'Termo Quarteto', icon: 'layout-grid', description: 'Adivinhe 4 palavras de 4 letras!', category: 'palavras' },
            { id: 'memory', name: 'Jogo da Memória', icon: 'brain', description: '3 níveis de dificuldade!', category: 'diversos' },
            { id: 'wordsearch', name: 'Caça Palavras', icon: 'search', description: 'Encontre as palavras escondidas!', category: 'diversos' },
            { id: 'crossword', name: 'Cruzadinha', icon: 'grid', description: 'Preencha as palavras cruzadas!', category: 'diversos' },
            { id: 'game2048', name: '2048', icon: 'hash', description: 'Some os números e chegue ao 2048!', category: 'diversos' },
            { id: 'flappybird', name: 'Flappy Bird', icon: 'bird', description: 'Passe pelos canos sem cair!', category: 'acao' },
            { id: 'dino', name: 'Dinossauro', icon: 'footprints', description: 'Pule os obstáculos e sobreviva!', category: 'acao' },
            { id: 'braintest', name: 'Brain Test', icon: 'lightbulb', description: 'Puzzles com pegadinhas! Pense fora da caixa!', category: 'diversos' }
        ];

        const categories = [
            { id: 'acao', name: 'Jogos de Ação', icon: 'gamepad-2' },
            { id: 'palavras', name: 'Jogos de Palavras', icon: 'text' },
            { id: 'diversos', name: 'Jogos Diversos', icon: 'puzzle' }
        ];

        // Renderizar Estatísticas
        if (statsContainer) {
            statsContainer.innerHTML = `
                <div class="text-center">
                    <p class="text-2xl font-bold" style="color: var(--color-primary, #2563eb)">${this.stats.gamesPlayed}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Jogos</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold" style="color: var(--color-secondary, #9333ea)">${this.stats.bestScore}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Melhor Pontuação</p>
                </div>
                <div class="text-center">
                    <p class="text-2xl font-bold text-green-600 dark:text-green-400">${Object.keys(this.achievements).length}</p>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Conquistas</p>
                </div>
            `;
        }

        // Renderizar Conquistas
        if (achievementsContainer) {
            achievementsContainer.innerHTML = this.renderAchievements();
        }

        // Renderizar Jogos por Categoria
        const renderGameCard = (game) => `
            <div class="game-card bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all transform hover:-translate-y-1" data-game="${game.id}">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 rounded-xl flex items-center justify-center" style="background: linear-gradient(135deg, var(--color-primary, #3b82f6), var(--color-secondary, #9333ea));">
                        <i data-lucide="${game.icon}" class="w-6 h-6 text-white"></i>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-slate-500 dark:text-slate-400">Seu Recorde</p>
                        <p class="text-lg font-bold" style="color: var(--color-primary, #2563eb)">${this.getUserBestScore(game.id) || '-'}</p>
                    </div>
                </div>
                <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">${game.name}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">${game.description}</p>
            </div>
        `;

        const gamesByCategory = categories.map(cat => {
            const catGames = games.filter(g => g.category === cat.id);
            return `
                <div class="mb-8">
                    <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                        <i data-lucide="${cat.icon}" class="w-5 h-5 text-blue-600 dark:text-blue-400"></i>
                        ${cat.name}
                    </h3>
                    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        ${catGames.map(renderGameCard).join('')}
                    </div>
                </div>
            `;
        }).join('');

        gamesContainer.innerHTML = gamesByCategory;

        lucide.createIcons();
        this.setupEventListeners();
    }

    renderAchievements() {
        const allAchievements = [
            { id: 'first_win', name: 'Primeira Vitória', icon: 'award', description: 'Complete qualquer jogo' },
            { id: 'snake_master', name: 'Mestre da Cobrinha', icon: 'zap', description: 'Alcance fase 5 no Snake' },
            { id: 'doom_slayer', name: 'Exterminador do Doom', icon: 'crosshair', description: 'Complete todos os níveis do Doom' },
            { id: 'elephant_memory', name: 'Memória de Elefante', icon: 'brain', description: 'Complete o modo difícil da memória' },
            { id: 'destroyer', name: 'Destruidor', icon: 'square', description: 'Complete todas as fases do Breakout' },
            { id: 'galaxy_defender', name: 'Defensor da Galáxia', icon: 'rocket', description: 'Derrote o boss do Space Invaders' },
            { id: 'termo_master', name: 'Mestre do Termo', icon: 'type', description: 'Acerte a palavra na primeira tentativa' }
        ];

        return allAchievements.map(achievement => {
            const unlocked = this.achievements[achievement.id];
            return `
                <div class="flex items-center gap-2 p-2 rounded-lg ${unlocked ? 'bg-yellow-100 dark:bg-yellow-900/30' : 'bg-slate-100 dark:bg-slate-700/50 opacity-50'}" title="${achievement.description}">
                    <i data-lucide="${achievement.icon}" class="w-4 h-4 ${unlocked ? 'text-yellow-600 dark:text-yellow-400' : 'text-slate-400'}"></i>
                    <span class="text-xs font-medium ${unlocked ? 'text-yellow-700 dark:text-yellow-300' : 'text-slate-500 dark:text-slate-400'}">${achievement.name}</span>
                </div>
            `;
        }).join('');
    }

    renderRanking(gameId) {
        const container = document.getElementById('ranking-list');
        if (!container) return;

        const scores = this.getTopScores(gameId, 10);
        const session = Auth.getCurrentSession();

        if (scores.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-slate-500 dark:text-slate-400">
                    <i data-lucide="trophy" class="w-12 h-12 mx-auto mb-3 opacity-50"></i>
                    <p>Nenhuma pontuação ainda!</p>
                    <p class="text-sm mt-1">Seja o primeiro a jogar!</p>
                </div>
            `;
            lucide.createIcons();
            return;
        }

        container.innerHTML = scores.map((score, index) => {
            const isCurrentUser = session && score.username === session.username;
            const medalColor = index === 0 ? 'text-yellow-500' : index === 1 ? 'text-slate-400' : index === 2 ? 'text-amber-600' : 'text-slate-500';

            return `
                <div class="flex items-center justify-between p-3 rounded-lg ${isCurrentUser ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800' : 'bg-slate-50 dark:bg-slate-700/50'}">
                    <div class="flex items-center space-x-3">
                        <div class="w-8 h-8 flex items-center justify-center">
                            ${index < 3 ? `<i data-lucide="trophy" class="w-5 h-5 ${medalColor}"></i>` : `<span class="text-sm font-medium text-slate-500">${index + 1}</span>`}
                        </div>
                        <div>
                            <p class="font-medium text-slate-800 dark:text-slate-200 ${isCurrentUser ? 'text-blue-700 dark:text-blue-300' : ''}">${score.nome}</p>
                            <p class="text-xs text-slate-500 dark:text-slate-400">@${score.username}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="font-bold text-lg ${!isCurrentUser ? 'text-slate-700 dark:text-slate-300' : ''}" ${isCurrentUser ? 'style="color: var(--color-primary, #2563eb)"' : ''}>${score.score.toLocaleString('pt-BR')}</p>
                        <p class="text-xs text-slate-400">${new Date(score.date).toLocaleDateString('pt-BR')}</p>
                    </div>
                </div>
            `;
        }).join('');

        lucide.createIcons();
    }

    openGame(gameId) {
        const gameContainer = document.getElementById('game-container');
        const menuContainer = document.getElementById('games-menu-section');

        if (gameContainer && menuContainer) {
            menuContainer.classList.add('hidden');
            gameContainer.classList.remove('hidden');

            this.renderRanking(gameId);
            this.startGame(gameId);
        }
    }

    closeGame() {
        const gameContainer = document.getElementById('game-container');
        const menuContainer = document.getElementById('games-menu-section');
        const canvas = document.getElementById('game-canvas');

        if (this.currentGame && this.currentGame.stop) {
            this.currentGame.stop();
        }
        this.currentGame = null;

        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
        }

        if (gameContainer && menuContainer) {
            gameContainer.classList.add('hidden');
            menuContainer.classList.remove('hidden');
        }

        this.renderGameMenu();
    }

    startGame(gameId) {
        const canvas = document.getElementById('game-canvas');
        const gameTitle = document.getElementById('current-game-title');

        if (!canvas) return;

        const games = {
            snake: { name: 'Jogo da Cobrinha', class: SnakeGame },
            doom: { name: 'Doom', class: DoomGame },
            typing: { name: 'Teste de Digitação', class: TypingGame },
            memory: { name: 'Jogo da Memória', class: MemoryGame },
            spaceinvaders: { name: 'Invasores Espaciais', class: SpaceInvadersGame },
            breakout: { name: 'Breakout', class: BreakoutGame },
            termo: { name: 'Termo', class: TermoGame },
            termo2: { name: 'Termo Dueto', class: TermoDuoGame },
            termo4: { name: 'Termo Quarteto', class: TermoQuartetGame },
            wordsearch: { name: 'Caça Palavras', class: WordSearchGame },
            crossword: { name: 'Cruzadinha', class: CrosswordGame },
            game2048: { name: '2048', class: Game2048 },
            flappybird: { name: 'Flappy Bird', class: FlappyBirdGame },
            dino: { name: 'Dinossauro', class: DinoGame },
            braintest: { name: 'Brain Test', class: BrainTestGame }
        };

        const game = games[gameId];
        if (!game) return;

        if (gameTitle) {
            gameTitle.textContent = game.name;
        }

        // Garante que o jogo anterior foi parado (previne loops órfãos em duplo-clique)
        if (this.currentGame && this.currentGame.stop) {
            this.currentGame.stop();
            this.currentGame = null;
        }

        this.currentGame = new game.class(canvas, (score) => {
            this.addScore(gameId, score);
        }, this);
        this.currentGame.start();
    }

    applyPermissionsToUI() {
        const jogosTab = document.getElementById('jogos-tab');
        if (jogosTab) {
            if (Auth.hasPermission('jogos', 'ver')) {
                jogosTab.classList.remove('hidden');
            } else {
                jogosTab.classList.add('hidden');
            }
        }
    }
}

class SnakeGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.gridSize = 20;
        this.tileCount = 20;
        this.canvas.width = this.gridSize * this.tileCount;
        this.canvas.height = this.gridSize * this.tileCount;

        this.difficulties = {
            easy: { speed: 150, name: 'Fácil' },
            medium: { speed: 100, name: 'Médio' },
            hard: { speed: 60, name: 'Difícil' }
        };

        this.currentDifficulty = 'medium';
        this.phase = 1;
        this.maxPhase = 5;
        this.running = false;

        // Power-up types
        this.powerUpTypes = {
            slowmo: { icon: '⏱', color: '#06b6d4', duration: 100, name: 'Velocidade Reduzida' },
            double: { icon: '⭐', color: '#eab308', duration: 80, name: 'Pontos em Dobro' },
            ghost: { icon: '🌀', color: '#a855f7', duration: 60, name: 'Atravessar Paredes' }
        };

        this.reset();
        this.setupControls();
        this.showDifficultySelector();
    }

    showDifficultySelector() {
        const container = this.canvas.parentElement;
        let selector = document.getElementById('snake-difficulty');

        if (!selector) {
            selector = document.createElement('div');
            selector.id = 'snake-difficulty';
            selector.className = 'flex gap-2 mb-4 justify-center flex-wrap';
            selector.innerHTML = `
                <button data-diff="easy" class="diff-btn px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">Fácil</button>
                <button data-diff="medium" class="diff-btn px-4 py-2 rounded-lg bg-blue-500 text-white">Médio</button>
                <button data-diff="hard" class="diff-btn px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Difícil</button>
            `;
            container.insertBefore(selector, this.canvas);

            selector.querySelectorAll('.diff-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    this.currentDifficulty = btn.dataset.diff;
                    this.updateDifficultyButtons();
                    this.reset();
                    this.start();
                });
            });
        }
    }

    updateDifficultyButtons() {
        const btns = document.querySelectorAll('#snake-difficulty .diff-btn');
        btns.forEach(btn => {
            if (btn.dataset.diff === this.currentDifficulty) {
                btn.className = 'diff-btn px-4 py-2 rounded-lg bg-blue-500 text-white';
            } else {
                const colors = {
                    easy: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200',
                    medium: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 hover:bg-yellow-200',
                    hard: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200'
                };
                btn.className = `diff-btn px-4 py-2 rounded-lg ${colors[btn.dataset.diff]} transition-colors`;
            }
        });
    }

    reset() {
        this.snake = [{ x: 10, y: 10 }];
        this.direction = { x: 0, y: 0 };
        this.nextDirection = { x: 0, y: 0 };
        this.obstacles = [];
        this.food = this.generateFood();
        this.specialFood = null;
        this.powerUp = null;
        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.score = 0;
        this.phase = 1;
        this.phaseProgress = 0;
        this.phaseTarget = 50;
        this.gameOver = false;
        this.won = false;
        this.generateObstacles();
        this.updateScoreDisplay();
    }

    generateObstacles() {
        this.obstacles = [];
        // Obstáculos aparecem a partir da fase 3
        if (this.phase >= 3) {
            const obstacleCount = (this.phase - 2) * 4; // 4, 8, 12 obstacles for phases 3, 4, 5
            for (let i = 0; i < obstacleCount; i++) {
                let obstacle;
                do {
                    obstacle = {
                        x: Math.floor(Math.random() * this.tileCount),
                        y: Math.floor(Math.random() * this.tileCount)
                    };
                } while (
                    this.snake.some(seg => seg.x === obstacle.x && seg.y === obstacle.y) ||
                    this.obstacles.some(obs => obs.x === obstacle.x && obs.y === obstacle.y) ||
                    (Math.abs(obstacle.x - 10) < 3 && Math.abs(obstacle.y - 10) < 3) // Manter área de spawn livre
                );
                this.obstacles.push(obstacle);
            }
        }
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (
            this.snake.some(seg => seg.x === food.x && seg.y === food.y) ||
            this.obstacles.some(obs => obs.x === food.x && obs.y === food.y)
        );
        return food;
    }

    generateSpecialFood() {
        if (Math.random() < 0.15 && !this.specialFood) {
            let food;
            do {
                food = {
                    x: Math.floor(Math.random() * this.tileCount),
                    y: Math.floor(Math.random() * this.tileCount)
                };
            } while (
                this.snake.some(seg => seg.x === food.x && seg.y === food.y) ||
                this.obstacles.some(obs => obs.x === food.x && obs.y === food.y) ||
                (this.food.x === food.x && this.food.y === food.y)
            );
            this.specialFood = {
                ...food,
                timer: 100,
                points: 50
            };
        }
    }

    generatePowerUp() {
        if (Math.random() < 0.08 && !this.powerUp && !this.activePowerUp) {
            const types = Object.keys(this.powerUpTypes);
            const type = types[Math.floor(Math.random() * types.length)];
            let pos;
            do {
                pos = {
                    x: Math.floor(Math.random() * this.tileCount),
                    y: Math.floor(Math.random() * this.tileCount)
                };
            } while (
                this.snake.some(seg => seg.x === pos.x && seg.y === pos.y) ||
                this.obstacles.some(obs => obs.x === pos.x && obs.y === pos.y) ||
                (this.food.x === pos.x && this.food.y === pos.y)
            );
            this.powerUp = {
                ...pos,
                type,
                timer: 150
            };
        }
    }

    setupControls() {
        this.keyHandler = (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                case 'W':
                    if (this.direction.y !== 1) this.nextDirection = { x: 0, y: -1 };
                    break;
                case 'ArrowDown':
                case 's':
                case 'S':
                    if (this.direction.y !== -1) this.nextDirection = { x: 0, y: 1 };
                    break;
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    if (this.direction.x !== 1) this.nextDirection = { x: -1, y: 0 };
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    if (this.direction.x !== -1) this.nextDirection = { x: 1, y: 0 };
                    break;
                case ' ':
                    if (this.gameOver || this.won) {
                        this.reset();
                        this.start();
                    }
                    break;
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = 0;
        this.animationId = requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.removeEventListener('keydown', this.keyHandler);
        const selector = document.getElementById('snake-difficulty');
        if (selector) selector.remove();
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        let speed = this.difficulties[this.currentDifficulty].speed;

        // Efeito do power-up câmera lenta
        if (this.activePowerUp === 'slowmo') {
            speed *= 1.5;
        }

        if (timestamp - this.lastUpdate >= speed) {
            if (!this.gameOver && !this.won) {
                this.update();
            }
            this.lastUpdate = timestamp;
        }

        this.draw();
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    update() {
        this.direction = { ...this.nextDirection };

        if (this.direction.x === 0 && this.direction.y === 0) return;

        let head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        // Power-up fantasma permite atravessar paredes
        if (this.activePowerUp === 'ghost') {
            if (head.x < 0) head.x = this.tileCount - 1;
            if (head.x >= this.tileCount) head.x = 0;
            if (head.y < 0) head.y = this.tileCount - 1;
            if (head.y >= this.tileCount) head.y = 0;
        } else {
            if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
                this.endGame();
                return;
            }
        }

        // Verificar colisão consigo mesmo
        if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.endGame();
            return;
        }

        // Verificar colisão com obstáculos (apenas se não estiver no modo fantasma)
        if (this.activePowerUp !== 'ghost' && this.obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        // Verificar colisão com comida
        if (head.x === this.food.x && head.y === this.food.y) {
            let points = 10 * this.phase;
            if (this.activePowerUp === 'double') {
                points *= 2;
            }
            this.score += points;
            this.phaseProgress += 10;
            this.food = this.generateFood();
            this.generateSpecialFood();
            this.generatePowerUp();

            // Verificar progressão de fase
            if (this.phaseProgress >= this.phaseTarget && this.phase < this.maxPhase) {
                this.phase++;
                this.phaseProgress = 0;
                this.phaseTarget = 5his.phase++;
                this.phaseProgress = 0;
                this.phaseTarget = 50 + (this.phase - 1) * 25;
                this.generateObstacles();
            } else if (this.phase >= this.maxPhase && this.phaseProgress >= this.phaseTarget) {
                this.won = true;
                this.onScore(this.score);
                if (this.manager) {
                    this.manager.unlockAchievement('snake_master');
                }
                return;
            }
            this.updateScoreDisplay();
        } else if (this.specialFood && head.x === this.specialFood.x && head.y === this.specialFood.y) {
            let points = this.specialFood.points * this.phase;
            if (this.activePowerUp === 'double') {
                points *= 2;
            }
            this.score += points;
            this.specialFood = null;
            this.updateScoreDisplay();
        } else if (this.powerUp && head.x === this.powerUp.x && head.y === this.powerUp.y) {
            this.activePowerUp = this.powerUp.type;
            this.powerUpTimer = this.powerUpTypes[this.powerUp.type].duration;
            this.powerUp = null;
        } else {
            this.snake.pop();
        }

        // Atualizar timers dos power-ups
        if (this.specialFood) {
            this.specialFood.timer--;
            if (this.specialFood.timer <= 0) {
                this.specialFood = null;
            }
        }

        if (this.powerUp) {
            this.powerUp.timer--;
            if (this.powerUp.timer <= 0) {
                this.powerUp = null;
            }
        }

        if (this.activePowerUp) {
            this.powerUpTimer--;
            if (this.powerUpTimer <= 0) {
                this.activePowerUp = null;
            }
        }
    }

    draw() {
        // Fundo simples
        this.ctx.fillStyle = '#1e293b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grade
        this.ctx.strokeStyle = 'rgba(255,255,255,0.05)';
        for (let i = 0; i < this.tileCount; i++) {
            for (let j = 0; j < this.tileCount; j++) {
                this.ctx.strokeRect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
            }
        }

        // Obstáculos
        this.ctx.fillStyle = '#64748b';
        this.obstacles.forEach(obs => {
            this.ctx.fillRect(obs.x * this.gridSize + 1, obs.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
        });

        // Cobra
        this.ctx.fillStyle = '#22c55e';
        this.snake.forEach((seg, i) => {
            if (i === 0) this.ctx.fillStyle = '#4ade80';
            else this.ctx.fillStyle = '#22c55e';

            if (this.activePowerUp === 'ghost') this.ctx.globalAlpha = 0.6;
            this.ctx.fillRect(seg.x * this.gridSize + 1, seg.y * this.gridSize + 1, this.gridSize - 2, this.gridSize - 2);
            this.ctx.globalAlpha = 1;
        });

        // Comida
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(this.food.x * this.gridSize + this.gridSize / 2, this.food.y * this.gridSize + this.gridSize / 2, this.gridSize / 2 - 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Comida Especial
        if (this.specialFood) {
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.beginPath();
            this.ctx.arc(this.specialFood.x * this.gridSize + this.gridSize / 2, this.specialFood.y * this.gridSize + this.gridSize / 2, this.gridSize / 2 - 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Power-up
        if (this.powerUp) {
            this.ctx.fillStyle = this.powerUpTypes[this.powerUp.type].color;
            this.ctx.beginPath();
            this.ctx.arc(this.powerUp.x * this.gridSize + this.gridSize / 2, this.powerUp.y * this.gridSize + this.gridSize / 2, this.gridSize / 2 - 2, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Desenhar indicador do power-up ativo
        if (this.activePowerUp) {
            const puType = this.powerUpTypes[this.activePowerUp];
            this.ctx.fillStyle = puType.color;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${puType.icon} ${puType.name}: ${this.powerUpTimer}`, 5, 15);
        }

        // Desenhar barra de progresso da fase
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.fillRect(5, this.canvas.height - 15, this.canvas.width - 10, 10);

        const progressWidth = ((this.canvas.width - 10) * this.phaseProgress) / this.phaseTarget;
        this.ctx.fillStyle = '#3b82f6';
        this.ctx.fillRect(5, this.canvas.height - 15, progressWidth, 10);

        // Tela de game over / vitória
        if (this.gameOver || this.won) {
            this.ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            this.ctx.fillStyle = this.won ? '#22c55e' : '#ef4444';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? 'VOCÊ VENCEU!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`${this.score} pts`, this.canvas.width / 2, this.canvas.height / 2 + 10);

            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('Pressione ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 40);
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
    }

    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        const isDark = document.documentElement.classList.contains('dark');

        // Auxiliar para obter hex da variável ou valor padrão
        const getVar = (name, fallback) => {
            const val = style.getPropertyValue(name).trim();
            return val || fallback;
        };

        return {
            isDark,
            primary: getVar('--color-primary', '#3b82f6'), // Cor padrão azul-500
            secondary: getVar('--color-secondary', '#a855f7'), // Cor padrão roxo-500
            accent: getVar('--color-accent', '#ef4444'), // Cor padrão vermelho-500 para comida
            bg: isDark ? '#0f172a' : '#f8fafc', // Slate-900 / Slate-50
            grid: isDark ? '#334155' : '#e2e8f0', // Slate-700 / Slate-200
            text: isDark ? '#f1f5f9' : '#1e293b'  // Slate-100 / Slate-800
        };
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const phaseEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (phaseEl) phaseEl.textContent = `Fase ${this.phase}/${this.maxPhase}`;
    }

    endGame() {
        this.gameOver = true;
        this.onScore(this.score);
    }
}

class DoomGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.canvas.width = 600;
        this.canvas.height = 450;

        this.player = { x: 1.5, y: 1.5, angle: 0, health: 100, ammo: 50 };
        this.moveSpeed = 0.08;
        this.rotSpeed = 0.04;
        this.mouseSensitivity = 0.0025;
        this.isPointerLocked = false;

        // Efeitos visuais
        this.bobbing = 0;
        this.bobbingAmount = 0;
        this.weaponKick = 0;
        this.weaponSway = 0;

        this.level = 1;
        this.maxLevel = 3;
        this.score = 0;
        this.kills = 0;
        this.gameOver = false;
        this.won = false;
        this.running = false;

        // Animação de tiro
        this.shotAnimations = [];
        this.lastShotAnimTime = 0;

        this.maps = [
            [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 1, 1, 0, 1, 1, 0, 0, 1, 0, 1], [1, 0, 1, 0, 0, 0, 1, 0, 0, 1, 0, 1], [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1], [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1], [1, 0, 0, 0, 1, 1, 0, 1, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1], [1, 0, 1, 1, 1, 1, 0, 1, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
            [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1], [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1], [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 0, 1], [1, 0, 1, 1, 1, 1, 0, 0, 0, 1, 0, 1], [1, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1], [1, 1, 1, 0, 0, 0, 0, 1, 0, 0, 0, 1], [1, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1], [1, 0, 1, 1, 0, 0, 1, 0, 0, 0, 0, 1], [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]],
            [[1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 1, 0, 1], [1, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1], [1, 0, 1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 1], [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 0, 1], [1, 0, 1, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 1], [1, 0, 1, 0, 0, 0, 0, 1, 0, 1, 1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 0, 1], [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]]
        ];

        this.keys = { w: false, s: false, a: false, d: false, left: false, right: false, shoot: false };
        this.bullets = [];
        this.enemies = [];
        this.pickups = [];
        this.lastShot = 0;
        this.shootCooldown = 250; // Tiro mais rápido

        this.reset();
        this.setupControls();
    }

    reset() {
        this.map = this.maps[this.level - 1].map(row => [...row]);
        this.player = { x: 1.5, y: 1.5, angle: 0, health: 100, ammo: 50 };
        this.score = this.score || 0;
        this.kills = 0;
        this.gameOver = false;
        this.won = false;
        this.bullets = [];
        this.enemies = [];
        this.pickups = [];

        const enemyCount = 3 + (this.level - 1) * 2;
        for (let i = 0; i < enemyCount; i++) this.spawnEnemy();
        this.spawnPickups();
        this.updateScoreDisplay();
    }

    spawnEnemy() {
        let x, y;
        do {
            x = 1 + Math.random() * (this.map[0].length - 2);
            y = 1 + Math.random() * (this.map.length - 2);
        } while (this.map[Math.floor(y)][Math.floor(x)] === 1 || (Math.abs(x - this.player.x) < 3 && Math.abs(y - this.player.y) < 3));
        this.enemies.push({ x, y, health: 30 + this.level * 10, speed: 0.02 + this.level * 0.005, lastShot: 0, shootCooldown: 2000 - this.level * 300, type: Math.random() < 0.3 ? 'boss' : 'normal' });
    }

    spawnPickups() {
        for (let i = 0; i < 3; i++) {
            let x, y;
            do {
                x = 1 + Math.random() * (this.map[0].length - 2);
                y = 1 + Math.random() * (this.map.length - 2);
            } while (this.map[Math.floor(y)][Math.floor(x)] === 1);
            this.pickups.push({ x, y, type: Math.random() < 0.5 ? 'health' : 'ammo' });
        }
    }

    setupControls() {
        this.keyDownHandler = (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') {
                e.preventDefault();
                this.keys.w = true;
            }
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') {
                e.preventDefault();
                this.keys.s = true;
            }
            if (e.key === 'a' || e.key === 'A') {
                e.preventDefault();
                this.keys.a = true;
            }
            if (e.key === 'd' || e.key === 'D') {
                e.preventDefault();
                this.keys.d = true;
            }
            if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.keys.left = true;
            }
            if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.keys.right = true;
            }
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameOver || this.won) {
                    this.level = 1;
                    this.score = 0;
                    this.reset();
                    this.start();
                } else {
                    this.keys.shoot = true;
                }
            }
        };
        this.keyUpHandler = (e) => {
            if (e.key === 'w' || e.key === 'W' || e.key === 'ArrowUp') this.keys.w = false;
            if (e.key === 's' || e.key === 'S' || e.key === 'ArrowDown') this.keys.s = false;
            if (e.key === 'a' || e.key === 'A') this.keys.a = false;
            if (e.key === 'd' || e.key === 'D') this.keys.d = false;
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
            if (e.key === ' ') this.keys.shoot = false;
        };

        this.mouseMoveHandler = (e) => {
            if (this.isPointerLocked) {
                this.player.angle += e.movementX * this.mouseSensitivity;
            }
        };

        this.mouseClickHandler = (e) => {
            if (!this.isPointerLocked && !this.gameOver && !this.won) {
                this.canvas.requestPointerLock();
            } else if (this.isPointerLocked) {
                this.keys.shoot = true;
                setTimeout(() => { this.keys.shoot = false; }, 100);
            }
        };

        this.pointerLockChangeHandler = () => {
            this.isPointerLocked = document.pointerLockElement === this.canvas;
        };

        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        document.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('click', this.mouseClickHandler);
        document.addEventListener('pointerlockchange', this.pointerLockChangeHandler);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = Date.now();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        document.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('click', this.mouseClickHandler);
        document.removeEventListener('pointerlockchange', this.pointerLockChangeHandler);
        if (document.pointerLockElement === this.canvas) {
            document.exitPointerLock();
        }
        this.keys = { w: false, s: false, a: false, d: false, left: false, right: false, shoot: false };
    }

    gameLoop() {
        if (!this.running) return;
        if (!this.gameOver && !this.won) this.update();
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    canMove(x, y) {
        const m = 0.2;
        return this.map[Math.floor(y - m)] && this.map[Math.floor(y + m)] && this.map[Math.floor(y - m)][Math.floor(x - m)] !== 1 && this.map[Math.floor(y - m)][Math.floor(x + m)] !== 1 && this.map[Math.floor(y + m)][Math.floor(x - m)] !== 1 && this.map[Math.floor(y + m)][Math.floor(x + m)] !== 1;
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown || this.player.ammo <= 0) return;
        this.lastShot = now;
        this.player.ammo--;
        this.weaponKick = 12; // Efeito de recuo da arma

        // Lógica de dispersão para efeito de escopeta
        for (let i = 0; i < 3; i++) {
            const spread = (Math.random() - 0.5) * 0.1;
            this.bullets.push({
                x: this.player.x,
                y: this.player.y,
                dx: Math.cos(this.player.angle + spread) * 0.4,
                dy: Math.sin(this.player.angle + spread) * 0.4,
                isEnemy: false
            });
        }

        // Adicionar efeito de tiro
        this.shotAnimations.push({
            x: this.canvas.width / 2 + (Math.random() * 20 - 10),
            y: this.canvas.height / 2 + (Math.random() * 20 - 10),
            radius: 5,
            maxRadius: 25,
            opacity: 1,
            startTime: now
        });

        this.updateScoreDisplay();
    }

    update() {
        if (this.keys.left) this.player.angle -= this.rotSpeed;
        if (this.keys.right) this.player.angle += this.rotSpeed;

        let dx = 0, dy = 0;
        let isMoving = false;

        if (this.keys.w) { dx += Math.cos(this.player.angle) * this.moveSpeed; dy += Math.sin(this.player.angle) * this.moveSpeed; isMoving = true; }
        if (this.keys.s) { dx -= Math.cos(this.player.angle) * this.moveSpeed; dy -= Math.sin(this.player.angle) * this.moveSpeed; isMoving = true; }
        if (this.keys.a) { dx += Math.cos(this.player.angle - Math.PI / 2) * this.moveSpeed; dy += Math.sin(this.player.angle - Math.PI / 2) * this.moveSpeed; isMoving = true; }
        if (this.keys.d) { dx += Math.cos(this.player.angle + Math.PI / 2) * this.moveSpeed; dy += Math.sin(this.player.angle + Math.PI / 2) * this.moveSpeed; isMoving = true; }

        if (isMoving) {
            this.bobbing += 0.15;
            this.bobbingAmount = Math.sin(this.bobbing) * 4; // Amplitude do balanço da cabeça
            this.weaponSway = Math.sin(this.bobbing * 0.5) * 2;
        } else {
            this.bobbingAmount = this.bobbingAmount * 0.8; // Amortecer balanço ao parar
            this.weaponSway = this.weaponSway * 0.8;
            this.bobbing = 0;
        }

        // Recuperar recuo da arma
        if (this.weaponKick > 0) this.weaponKick *= 0.8;

        if (this.canMove(this.player.x + dx, this.player.y)) this.player.x += dx;
        if (this.canMove(this.player.x, this.player.y + dy)) this.player.y += dy;

        if (this.keys.shoot) this.shoot();

        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.dx; bullet.y += bullet.dy;
            if (this.map[Math.floor(bullet.y)] && this.map[Math.floor(bullet.y)][Math.floor(bullet.x)] === 1) return false;
            if (!bullet.isEnemy) {
                for (let i = this.enemies.length - 1; i >= 0; i--) {
                    const enemy = this.enemies[i];
                    if (Math.sqrt((bullet.x - enemy.x) ** 2 + (bullet.y - enemy.y) ** 2) < 0.5) {
                        enemy.health -= 20;
                        if (enemy.health <= 0) {
                            this.score += (enemy.type === 'boss' ? 200 : 100) * this.level;
                            this.kills++;
                            this.enemies.splice(i, 1);
                            this.updateScoreDisplay();
                            if (this.enemies.length === 0) {
                                if (this.level < this.maxLevel) { this.level++; this.reset(); }
                                else { this.won = true; this.onScore(this.score); if (this.manager) this.manager.unlockAchievement('doom_slayer'); }
                            }
                        }
                        return false;
                    }
                }
            }
            if (bullet.isEnemy && Math.sqrt((bullet.x - this.player.x) ** 2 + (bullet.y - this.player.y) ** 2) < 0.3) {
                this.player.health -= 10; this.updateScoreDisplay(); if (this.player.health <= 0) this.endGame(); return false;
            }
            return bullet.x > 0 && bullet.x < this.map[0].length && bullet.y > 0 && bullet.y < this.map.length;
        });

        const now = Date.now();
        this.enemies.forEach(enemy => {
            const angle = Math.atan2(this.player.y - enemy.y, this.player.x - enemy.x);
            const newX = enemy.x + Math.cos(angle) * enemy.speed;
            const newY = enemy.y + Math.sin(angle) * enemy.speed;
            if (this.canMove(newX, enemy.y)) enemy.x = newX;
            if (this.canMove(enemy.x, newY)) enemy.y = newY;
            const dist = Math.sqrt((enemy.x - this.player.x) ** 2 + (enemy.y - this.player.y) ** 2);
            if (dist < 5 && now - enemy.lastShot > enemy.shootCooldown) {
                enemy.lastShot = now;
                this.bullets.push({ x: enemy.x, y: enemy.y, dx: Math.cos(angle) * 0.15, dy: Math.sin(angle) * 0.15, isEnemy: true });
            }
            if (dist < 0.4) { this.player.health -= 1; this.updateScoreDisplay(); if (this.player.health <= 0) this.endGame(); }
        });

        this.pickups = this.pickups.filter(pickup => {
            if (Math.sqrt((pickup.x - this.player.x) ** 2 + (pickup.y - this.player.y) ** 2) < 0.5) {
                if (pickup.type === 'health') this.player.health = Math.min(100, this.player.health + 25);
                else this.player.ammo += 20;
                this.updateScoreDisplay();
                return false;
            }
            return true;
        });
    }

    draw() {
        // Chão e teto com gradiente para profundidade
        const gradientCeiling = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height / 2);
        gradientCeiling.addColorStop(0, '#0f172a');
        gradientCeiling.addColorStop(1, '#334155');
        this.ctx.fillStyle = gradientCeiling;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height / 2);

        const gradientFloor = this.ctx.createLinearGradient(0, this.canvas.height / 2, 0, this.canvas.height);
        gradientFloor.addColorStop(0, '#1e293b');
        gradientFloor.addColorStop(1, '#0f172a');
        this.ctx.fillStyle = gradientFloor;
        this.ctx.fillRect(0, this.canvas.height / 2, this.canvas.width, this.canvas.height / 2);

        // Algoritmo do Pintor: Criar fila de renderização para paredes e sprites
        const renderQueue = [];
        const fov = Math.PI / 3;
        const numRays = 120; // Resolução aumentada
        const stripWidth = Math.ceil(this.canvas.width / numRays);

        // 1. Raycasting (Coletar Paredes)
        for (let i = 0; i < numRays; i++) {
            const rayAngle = this.player.angle - fov / 2 + i * (fov / numRays);
            const result = this.castRay(rayAngle);

            if (result.distance > 0 && result.distance < 20) {
                const wallHeight = Math.min(this.canvas.height, (this.canvas.height / result.distance) * 0.8);
                const wallTop = (this.canvas.height - wallHeight) / 2 + this.bobbingAmount; // Aplicar balanço da cabeça

                // Cor baseada no lado e distância (névoa)
                const baseColor = result.side ? { r: 100, g: 50, b: 160 } : { r: 120, g: 60, b: 190 };
                const brightness = Math.max(0.1, 1 - result.distance / 15);

                // Sombreamento de textura falso: escurecer bordas do bloco
                const edgeShade = (result.xPos < 0.05 || result.xPos > 0.95) ? 0.7 : 1;

                const r = Math.floor(baseColor.r * brightness * edgeShade);
                const g = Math.floor(baseColor.g * brightness * edgeShade);
                const b = Math.floor(baseColor.b * brightness * edgeShade);

                renderQueue.push({
                    type: 'wall',
                    dist: result.distance, // Usar distância genérica para ordenação
                    col: i,
                    stripWidth,
                    wallTop,
                    wallHeight,
                    color: `rgb(${r}, ${g}, ${b})`
                });
            }
        }

        // 2. Coletar Sprites (Inimigos + Itens)
        const sprites = [
            ...this.enemies.map(e => ({ ...e, type: 'enemy', dist: Math.sqrt((e.x - this.player.x) ** 2 + (e.y - this.player.y) ** 2) })),
            ...this.pickups.map(p => ({ ...p, type: 'pickup', dist: Math.sqrt((p.x - this.player.x) ** 2 + (p.y - this.player.y) ** 2) }))
        ];

        sprites.forEach(obj => {
            const dx = obj.x - this.player.x;
            const dy = obj.y - this.player.y;

            let objAngle = Math.atan2(dy, dx) - this.player.angle;

            // Normalizar ângulo para -PI a +PI
            while (objAngle < -Math.PI) objAngle += Math.PI * 2;
            while (objAngle > Math.PI) objAngle -= Math.PI * 2;

            // Apenas desenhar se estiver na frente do jogador
            if (Math.abs(objAngle) < fov / 1.5) {
                const dist = obj.dist;
                // Correção olho de peixe para tamanho do sprite
                const correctDist = dist * Math.cos(objAngle);

                const screenX = (0.5 * (objAngle / (fov / 2)) + 0.5) * this.canvas.width;
                const size = Math.min(600, (this.canvas.height / correctDist) * 0.7);
                const screenY = (this.canvas.height - size) / 2 + this.bobbingAmount;

                renderQueue.push({
                    type: 'sprite',
                    dist: dist,
                    screenX,
                    screenY,
                    size,
                    obj
                });
            }
        });

        // 3. Ordenar por Distância Decrescente (Longe -> Perto)
        renderQueue.sort((a, b) => b.dist - a.dist);

        // 4. Renderizar Tudo
        renderQueue.forEach(item => {
            if (item.type === 'wall') {
                this.ctx.fillStyle = item.color;
                this.ctx.fillRect(item.col * item.stripWidth, item.wallTop, item.stripWidth, item.wallHeight);
            } else {
                if (item.obj.type === 'enemy') {
                    this.drawEnemy(item.screenX, item.screenY, item.size, item.obj);
                } else {
                    this.drawPickup(item.screenX, item.screenY, item.size, item.obj);
                }
            }
        });

        this.drawShotAnimations();

        this.drawWeapon();
        this.drawHUD();
        this.drawMinimap();

        if (this.gameOver || this.won) {
            // Sobreposição dramática para o Doom
            const overlayGradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
            );
            overlayGradient.addColorStop(0, this.won ? 'rgba(34, 197, 94, 0.9)' : 'rgba(127, 29, 29, 0.9)');
            overlayGradient.addColorStop(1, 'rgba(0, 0, 0, 0.95)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Anéis animados
            const time = Date.now() / 1000;
            for (let i = 0; i < 3; i++) {
                const radius = 50 + i * 30 + Math.sin(time * 2) * 5;
                this.ctx.strokeStyle = this.won ? `rgba(134, 239, 172, ${0.3 - i * 0.1})` : `rgba(239, 68, 68, ${0.3 - i * 0.1})`;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(this.canvas.width / 2, this.canvas.height / 2 - 20, radius, 0, Math.PI * 2);
                this.ctx.stroke();
            }

            this.ctx.shadowColor = this.won ? '#22c55e' : '#dc2626';
            this.ctx.shadowBlur = 25;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 32px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? '🎖️ VITÓRIA!' : '☠️ GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.shadowBlur = 0;

            // Caixa de estatísticas
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 100, this.canvas.height / 2, 200, 70, 12);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 22px Arial';
            this.ctx.fillText(`${this.score} pontos`, this.canvas.width / 2, this.canvas.height / 2 + 30);
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(`Nível ${this.level}/${this.maxLevel} • ${this.kills} abates`, this.canvas.width / 2, this.canvas.height / 2 + 55);

            const pulse = 0.5 + Math.sin(time * 4) * 0.2;
            this.ctx.fillStyle = `rgba(239, 68, 68, ${0.3 + pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 130, this.canvas.height / 2 + 85, 260, 32, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '13px Arial';
            this.ctx.fillText('⏎ Pressione ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 105);
        }
    }

    drawEnemy(x, y, size, enemy) {
        // Desenho procedural estilo "Cacodemon" ou "Imp"
        // Corpo (Esfera vermelha)
        const isBoss = enemy.type === 'boss';

        this.ctx.save();
        this.ctx.translate(x, y + size * 0.5); // Correção: Baixar sprite para ficar no chão (estava voando)

        // Sombra
        this.ctx.fillStyle = 'rgba(0,0,0,0.5)';
        this.ctx.beginPath();
        this.ctx.ellipse(0, size * 0.4, size * 0.4, size * 0.1, 0, 0, Math.PI * 2);
        this.ctx.fill();

        // Corpo Principal
        const gradient = this.ctx.createRadialGradient(-size * 0.1, -size * 0.1, size * 0.1, 0, 0, size * 0.4);
        gradient.addColorStop(0, isBoss ? '#fca5a5' : '#ef4444');
        gradient.addColorStop(1, isBoss ? '#991b1b' : '#7f1d1d');

        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.arc(0, 0, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();

        // Olho Grande Único (Ciclope)
        this.ctx.fillStyle = '#fef08a';
        this.ctx.beginPath();
        this.ctx.arc(0, -size * 0.05, size * 0.12, 0, Math.PI * 2);
        this.ctx.fill();

        // Pupila
        this.ctx.fillStyle = '#000';
        this.ctx.beginPath();
        this.ctx.arc(0, -size * 0.05, size * 0.05, 0, Math.PI * 2);
        this.ctx.fill();

        // Chifres
        this.ctx.fillStyle = '#e2e8f0';
        // Chifre esquerdo
        this.ctx.beginPath();
        this.ctx.moveTo(-size * 0.25, -size * 0.25);
        this.ctx.lineTo(-size * 0.4, -size * 0.5);
        this.ctx.lineTo(-size * 0.15, -size * 0.35);
        this.ctx.fill();
        // Chifre direito
        this.ctx.beginPath();
        this.ctx.moveTo(size * 0.25, -size * 0.25);
        this.ctx.lineTo(size * 0.4, -size * 0.5);
        this.ctx.lineTo(size * 0.15, -size * 0.35);
        this.ctx.fill();

        // Mandíbula / Boca
        this.ctx.fillStyle = '#450a0a';
        this.ctx.beginPath();
        this.ctx.arc(0, size * 0.2, size * 0.15, 0, Math.PI, false);
        this.ctx.fill();

        // Dentes
        this.ctx.fillStyle = '#fff';
        for (let i = -2; i <= 2; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * size * 0.05, size * 0.2);
            this.ctx.lineTo(i * size * 0.05 + size * 0.02, size * 0.28);
            this.ctx.lineTo(i * size * 0.05 - size * 0.02, size * 0.28);
            this.ctx.fill();
        }

        this.ctx.restore();
    }

    drawPickup(x, y, size, pickup) {
        this.ctx.save();
        this.ctx.translate(x, y + size * 0.2); // Fica um pouco no chão

        // Animação de flutuação para item
        const floatY = Math.sin(Date.now() / 300) * (size * 0.05);
        this.ctx.translate(0, floatY);

        if (pickup.type === 'health') {
            // Kit médico (Caixa azul com cruz)
            this.ctx.fillStyle = '#3b82f6'; // Azul
            this.ctx.fillRect(-size * 0.15, -size * 0.15, size * 0.3, size * 0.3);

            // Cruz
            this.ctx.fillStyle = '#fff';
            this.ctx.fillRect(-size * 0.05, -size * 0.1, size * 0.1, size * 0.2);
            this.ctx.fillRect(-size * 0.1, -size * 0.05, size * 0.2, size * 0.1);

        } else {
            // Caixa de munição (Verde)
            this.ctx.fillStyle = '#166534';
            this.ctx.fillRect(-size * 0.15, -size * 0.15, size * 0.3, size * 0.2);
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fillRect(-size * 0.15, -size * 0.15, size * 0.3, size * 0.05); // Tampa
        }

        this.ctx.restore();
    }

    drawWeapon() {
        const weaponX = this.canvas.width / 2 + this.weaponSway;
        const weaponY = this.canvas.height + this.weaponKick;
        const scale = 3;

        this.ctx.save();
        this.ctx.translate(weaponX, weaponY);

        // "Escopeta" procedural
        // Cano
        this.ctx.fillStyle = '#334155'; // Cinza escuro
        this.ctx.fillRect(-40, -180, 20, 180); // Cano esquerdo
        this.ctx.fillRect(20, -180, 20, 180); // Cano direito

        // Buracos do cano
        this.ctx.fillStyle = '#0f172a';
        this.ctx.beginPath(); this.ctx.arc(-30, -180, 8, 0, Math.PI * 2); this.ctx.fill();
        this.ctx.beginPath(); this.ctx.arc(30, -180, 8, 0, Math.PI * 2); this.ctx.fill();

        // Coronha/Corpo
        this.ctx.fillStyle = '#475569';
        this.ctx.fillRect(-50, 0, 100, 120);

        // Bomba da escopeta
        this.ctx.fillStyle = '#78350f'; // Madeira
        this.ctx.fillRect(-45, -80, 90, 40);

        // Flash do cano se disparando (recuo da arma alto)
        if (this.weaponKick > 5) {
            this.ctx.globalCompositeOperation = 'lighter';
            const flashSize = this.weaponKick * 5;
            const gradient = this.ctx.createRadialGradient(0, -180, 10, 0, -190, flashSize);
            gradient.addColorStop(0, '#fef08a');
            gradient.addColorStop(0.5, '#f97316');
            gradient.addColorStop(1, 'rgba(239, 68, 68, 0)');

            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.arc(0, -190, flashSize, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalCompositeOperation = 'source-over';
        }

        this.ctx.restore();

        // Mira
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(this.canvas.width / 2 - 8, this.canvas.height / 2);
        this.ctx.lineTo(this.canvas.width / 2 + 8, this.canvas.height / 2);
        this.ctx.moveTo(this.canvas.width / 2, this.canvas.height / 2 - 8);
        this.ctx.lineTo(this.canvas.width / 2, this.canvas.height / 2 + 8);
        this.ctx.stroke();
    }

    castRay(angle) {
        const cos = Math.cos(angle), sin = Math.sin(angle);
        let x = this.player.x, y = this.player.y;

        // Algoritmo DDA principalmente para detecção precisa de paredes (simplificado aqui em passos mas otimizado)
        // Usando passos menores para melhor precisão
        const stepSize = 0.02;
        const maxDist = 20;

        for (let d = 0; d < maxDist; d += stepSize) {
            x += cos * stepSize; y += sin * stepSize;
            const mapX = Math.floor(x), mapY = Math.floor(y);

            if (mapY < 0 || mapY >= this.map.length || mapX < 0 || mapX >= this.map[0].length) {
                return { distance: d, side: false, texture: 0 }; // Fora dos limites
            }

            if (this.map[mapY][mapX] === 1) {
                // Corrigir olho de peixe
                const distance = d * Math.cos(angle - this.player.angle);
                // Determinar lado para sombreamento simples
                // Aproximação grosseira: verificar se estamos mais perto do limite x ou y
                const dx = x - mapX;
                const dy = y - mapY;
                // Se mais perto de 0 ou 1 em X do que Y... 
                // Na verdade o anterior apenas verificava passos. Vamos manter a lógica simples anterior mas melhorada
                const side = (Math.abs(x - Math.round(x)) < Math.abs(y - Math.round(y)));
                return { distance, side, xPos: side ? y % 1 : x % 1 };
            }
        }
        return { distance: maxDist, side: false };
    }

    isEnemyVisible(enemy) {
        const dx = enemy.x - this.player.x;
        const dy = enemy.y - this.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const RAY_STEPS_PER_UNIT = 20; // Número de passos do raio por unidade do mapa para verificação de visibilidade
        const OBJECT_PROXIMITY_THRESHOLD = 0.3; // Limiar de distância para considerar que alcançou o objeto
        const stepX = dx / (dist * RAY_STEPS_PER_UNIT);
        const stepY = dy / (dist * RAY_STEPS_PER_UNIT);

        let x = this.player.x;
        let y = this.player.y;

        for (let i = 0; i < dist * RAY_STEPS_PER_UNIT; i++) {
            x += stepX;
            y += stepY;
            const mapX = Math.floor(x);
            const mapY = Math.floor(y);

            if (mapY >= 0 && mapY < this.map.length && mapX >= 0 && mapX < this.map[0].length) {
                if (this.map[mapY][mapX] === 1) {
                    return false;
                }
            }

            if (Math.sqrt((x - enemy.x) ** 2 + (y - enemy.y) ** 2) < OBJECT_PROXIMITY_THRESHOLD) {
                return true;
            }
        }
        return true;
    }

    drawHUD() {
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(10, this.canvas.height - 30, 104, 20);
        this.ctx.fillStyle = this.player.health > 30 ? '#22c55e' : '#ef4444';
        this.ctx.fillRect(12, this.canvas.height - 28, this.player.health, 16);
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '12px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`HP: ${this.player.health}`, 15, this.canvas.height - 15);
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Munição: ${this.player.ammo}`, this.canvas.width - 10, this.canvas.height - 15);
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Nível ${this.level}/${this.maxLevel}`, 10, 20);
        this.ctx.fillText(`Inimigos: ${this.enemies.length}`, 10, 38);
    }

    drawMinimap() {
        const mapSize = 60, tileSize = mapSize / this.map.length;
        const offsetX = this.canvas.width - mapSize - 10, offsetY = 10;
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(offsetX - 2, offsetY - 2, mapSize + 4, mapSize + 4);
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                this.ctx.fillStyle = this.map[y][x] === 1 ? '#666' : '#333';
                this.ctx.fillRect(offsetX + x * tileSize, offsetY + y * tileSize, tileSize, tileSize);
            }
        }
        this.ctx.fillStyle = '#ef4444';
        this.enemies.forEach(e => {
            this.ctx.beginPath();
            this.ctx.arc(offsetX + e.x * tileSize, offsetY + e.y * tileSize, 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.fillStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.arc(offsetX + this.player.x * tileSize, offsetY + this.player.y * tileSize, 3, 0, Math.PI * 2);
        this.ctx.fill();
        this.ctx.strokeStyle = '#22c55e';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.moveTo(offsetX + this.player.x * tileSize, offsetY + this.player.y * tileSize);
        this.ctx.lineTo(offsetX + (this.player.x + Math.cos(this.player.angle) * 1.5) * tileSize, offsetY + (this.player.y + Math.sin(this.player.angle) * 1.5) * tileSize);
        this.ctx.stroke();
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const infoEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (infoEl) infoEl.textContent = `HP: ${this.player.health} | Munição: ${this.player.ammo} | Nível ${this.level}`;
    }

    drawShotAnimations() {
        const now = Date.now();
        this.shotAnimations = this.shotAnimations.filter(shot => {
            const elapsed = now - shot.startTime;
            const duration = 200; // Duração da animação em ms

            if (elapsed > duration) return false;

            const progress = elapsed / duration;
            const currentRadius = shot.radius + (shot.maxRadius - shot.radius) * progress;
            const opacity = 1 - progress;

            // Desenhar círculo expandido
            this.ctx.strokeStyle = `rgba(255, 200, 0, ${opacity * 0.7})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(shot.x, shot.y, currentRadius, 0, Math.PI * 2);
            this.ctx.stroke();

            // Desenhar ponto central amarelo
            this.ctx.fillStyle = `rgba(255, 255, 0, ${opacity})`;
            this.ctx.beginPath();
            this.ctx.arc(shot.x, shot.y, 3, 0, Math.PI * 2);
            this.ctx.fill();

            return true;
        });
    }

    endGame() {
        this.gameOver = true;
        this.onScore(this.score);
    }
}

class TypingGame {
    constructor(canvas, onScore) {
        this.canvas = canvas;
        this.onScore = onScore;
        this.container = canvas.parentElement;

        // Lista expandida de palavras em português
        this.portugueseWords = [
            // Palavras comuns
            'casa', 'bola', 'vida', 'amor', 'tempo', 'mundo', 'coisa', 'pessoa', 'olho', 'mao',
            'lugar', 'parte', 'forma', 'lado', 'hora', 'ponto', 'agua', 'nome', 'terra', 'cidade',
            'trabalho', 'momento', 'governo', 'empresa', 'projeto', 'sistema', 'problema', 'processo',
            'desenvolvimento', 'informacao', 'tecnologia', 'conhecimento', 'comunicacao', 'educacao',
            // Palavras do dia a dia
            'hoje', 'ontem', 'amanha', 'agora', 'sempre', 'nunca', 'muito', 'pouco', 'mais', 'menos',
            'bem', 'mal', 'sim', 'nao', 'talvez', 'aqui', 'ali', 'la', 'onde', 'quando',
            'como', 'porque', 'para', 'com', 'sem', 'sobre', 'entre', 'desde', 'ate', 'apos',
            // Verbos comuns
            'ser', 'estar', 'ter', 'fazer', 'poder', 'dizer', 'dar', 'ver', 'saber', 'querer',
            'chegar', 'passar', 'ficar', 'deixar', 'parecer', 'levar', 'seguir', 'encontrar', 'chamar', 'vir',
            'pensar', 'sair', 'voltar', 'tomar', 'conhecer', 'viver', 'sentir', 'criar', 'falar', 'trazer',
            'lembrar', 'acabar', 'comecar', 'mostrar', 'ouvir', 'continuar', 'aprender', 'entender', 'perder', 'ganhar',
            // Substantivos comuns
            'familia', 'amigo', 'crianca', 'homem', 'mulher', 'pai', 'mae', 'filho', 'filha', 'irmao',
            'escola', 'livro', 'porta', 'janela', 'mesa', 'cadeira', 'carro', 'rua', 'praia', 'sol',
            'lua', 'estrela', 'flor', 'arvore', 'animal', 'cachorro', 'gato', 'passaro', 'peixe', 'comida',
            'roupa', 'sapato', 'bolsa', 'telefone', 'computador', 'musica', 'filme', 'jogo', 'festa', 'viagem',
            // Adjetivos comuns
            'bom', 'mau', 'grande', 'pequeno', 'novo', 'velho', 'jovem', 'bonito', 'feio', 'forte',
            'fraco', 'rapido', 'lento', 'alto', 'baixo', 'largo', 'estreito', 'longo', 'curto', 'cheio',
            'vazio', 'quente', 'frio', 'claro', 'escuro', 'limpo', 'sujo', 'facil', 'dificil', 'certo',
            'errado', 'feliz', 'triste', 'rico', 'pobre', 'doce', 'amargo', 'salgado', 'azedo', 'macio',
            // Números por extenso
            'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
            'cem', 'mil', 'primeiro', 'segundo', 'terceiro', 'ultimo', 'metade', 'dobro', 'triplo', 'zero',
            // Mais palavras úteis
            'banco', 'hospital', 'mercado', 'restaurante', 'hotel', 'aeroporto', 'estacao', 'parque', 'praca', 'igreja',
            'dinheiro', 'preco', 'conta', 'cartao', 'documento', 'passaporte', 'endereco', 'numero', 'email', 'senha'
        ];

        this.englishWords = [
            'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
            'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
            'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
            'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
            'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
            'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
            'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
            'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
            'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
            'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us'
        ];

        this.punctuationMarks = ['.', ',', '!', '?', ';', ':'];
        this.numbers = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];

        // Configurações do jogo
        this.language = 'pt'; // 'pt' or 'en'
        this.includePunctuation = false;
        this.includeNumbers = false;
        this.gameMode = 'time'; // 'time' or 'words'
        this.timeLimit = 30;
        this.wordLimit = 25;

        // Estado do jogo
        this.running = false;
        this.gameEnded = false;
        this.timeLeft = this.timeLimit;
        this.elapsedTime = 0;
        this.currentWordIndex = 0;
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.extraChars = 0;
        this.totalTyped = 0;
        this.wordsCompleted = 0;
        this.wordInputs = [];
        this.timerInterval = null;
        this.tabPressed = false;

        this.createUI();
    }

    createUI() {
        this.canvas.style.display = 'none';

        let typingUI = document.getElementById('typing-game-ui');
        if (typingUI) typingUI.remove();

        typingUI = document.createElement('div');
        typingUI.id = 'typing-game-ui';
        typingUI.className = 'w-full max-w-4xl mx-auto select-none';
        typingUI.innerHTML = `
            <style>
                #typing-game-ui .word { display: inline-block; margin: 0 5px 5px 0; }
                #typing-game-ui .letter { transition: color 0.1s; }
                #typing-game-ui .letter.correct { color: #22c55e; }
                #typing-game-ui .letter.incorrect { color: #ef4444; }
                #typing-game-ui .letter.extra { color: #ef4444; opacity: 0.7; }
                #typing-game-ui .word.current { border-bottom: 2px solid var(--color-primary, #3b82f6); }
                #typing-game-ui .caret {
                    position: absolute;
                    width: 2px;
                    height: 1.5em;
                    background: var(--color-primary, #3b82f6);
                    animation: caret-blink 1s infinite;
                    transition: left 0.08s ease-out, top 0.08s ease-out;
                }
                @keyframes caret-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                #typing-game-ui .typing-input-hidden {
                    position: fixed;
                    left: -9999px;
                    top: 0;
                    width: 1px;
                    height: 1px;
                    opacity: 0.01;
                }
                #typing-game-ui .stats-row { display: flex; gap: 2rem; justify-content: center; margin-bottom: 1rem; }
                #typing-game-ui .stat-item { text-align: center; }
                #typing-game-ui .stat-value { font-size: 2rem; font-weight: bold; color: var(--color-primary, #3b82f6); }
                #typing-game-ui .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
                #typing-game-ui .options-bar { 
                    display: flex; 
                    flex-wrap: wrap;
                    gap: 0.75rem; 
                    justify-content: center; 
                    align-items: center;
                    margin-bottom: 1rem; 
                    padding: 0.75rem;
                    background: var(--bg-secondary, rgba(30, 41, 59, 0.5));
                    border-radius: 0.5rem;
                    border: 1px solid var(--border-color, rgba(71, 85, 105, 0.3));
                }
                #typing-game-ui .option-group {
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                }
                #typing-game-ui .option-separator {
                    width: 1px;
                    height: 24px;
                    background: #475569;
                    margin: 0 0.25rem;
                }
                #typing-game-ui .toggle-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.35rem 0.65rem;
                    border-radius: 0.375rem;
                    background: transparent;
                    color: #64748b;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                #typing-game-ui .toggle-btn:hover { color: #94a3b8; }
                #typing-game-ui .toggle-btn.active { color: var(--color-primary, #3b82f6); background: color-mix(in srgb, var(--color-primary, #3b82f6), transparent 85%); }
                #typing-game-ui .mode-btn {
                    padding: 0.35rem 0.65rem;
                    border-radius: 0.375rem;
                    background: transparent;
                    color: #64748b;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                #typing-game-ui .mode-btn:hover { color: #94a3b8; }
                #typing-game-ui .mode-btn.active { color: var(--color-primary, #3b82f6); }
                #typing-game-ui .value-btn {
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    background: transparent;
                    color: #64748b;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                #typing-game-ui .value-btn:hover { color: #94a3b8; }
                #typing-game-ui .value-btn.active { color: var(--color-primary, #3b82f6); }
                #typing-game-ui .lang-btn {
                    display: flex;
                    align-items: center;
                    gap: 0.35rem;
                    padding: 0.35rem 0.65rem;
                    border-radius: 0.375rem;
                    background: transparent;
                    color: #64748b;
                    border: none;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.8rem;
                    font-weight: 500;
                }
                #typing-game-ui .lang-btn:hover { color: #94a3b8; }
                #typing-game-ui .lang-btn.active { color: var(--color-primary, #3b82f6); }
                #typing-game-ui .words-container {
                    position: relative;
                    font-size: 1.4rem;
                    line-height: 2;
                    color: #64748b;
                    font-family: 'Roboto Mono', 'Consolas', monospace;
                    min-height: 150px;
                    max-height: 180px;
                    overflow: hidden;
                    padding: 1rem;
                    background: var(--bg-secondary, rgba(15, 23, 42, 0.6));
                    border-radius: 0.5rem;
                    border: 1px solid var(--border-color, rgba(71, 85, 105, 0.3));
                    cursor: text;
                }
                #typing-game-ui .focus-warning {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: var(--bg-primary, rgba(15, 23, 42, 0.95));
                    padding: 1rem 2rem;
                    border-radius: 0.5rem;
                    color: #94a3b8;
                    font-size: 0.95rem;
                    display: none;
                    z-index: 10;
                    border: 1px solid var(--border-color, rgba(71, 85, 105, 0.5));
                }
                #typing-game-ui .words-container.blur .words-wrap { filter: blur(5px); pointer-events: none; }
                #typing-game-ui .words-container.blur .focus-warning { display: flex; align-items: center; }
                #typing-game-ui .result-screen {
                    text-align: center;
                    padding: 2rem;
                    background: var(--bg-primary, #1e293b);
                    border-radius: 1rem;
                }
                #typing-game-ui .result-wpm { font-size: 4rem; color: var(--color-primary, #3b82f6); font-weight: bold; }
                #typing-game-ui .result-label { color: #64748b; font-size: 1rem; margin-bottom: 0.5rem; text-transform: uppercase; }
                #typing-game-ui .result-stats { 
                    display: flex; 
                    justify-content: center; 
                    gap: 2.5rem; 
                    margin-top: 1.5rem;
                    flex-wrap: wrap;
                }
                #typing-game-ui .result-stat-value { font-size: 1.5rem; color: var(--text-primary, #e2e8f0); font-weight: 600; }
                #typing-game-ui .result-stat-detail { font-size: 0.85rem; color: #64748b; margin-top: 0.25rem; }
                #typing-game-ui .restart-hint { color: #64748b; margin-top: 2rem; font-size: 0.85rem; }
                #typing-game-ui .restart-hint kbd {
                    background: #334155;
                    padding: 0.25rem 0.5rem;
                    border-radius: 0.25rem;
                    font-family: inherit;
                    border: 1px solid #475569;
                }
                #typing-game-ui .restart-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.5rem;
                    margin: 1.5rem auto 0;
                    padding: 0.6rem 1.5rem;
                    background: color-mix(in srgb, var(--color-primary, #3b82f6), transparent 85%);
                    border: 1px solid color-mix(in srgb, var(--color-primary, #3b82f6), transparent 70%);
                    border-radius: 0.5rem;
                    color: var(--color-primary, #3b82f6);
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                #typing-game-ui .restart-btn:hover {
                    background: color-mix(in srgb, var(--color-primary, #3b82f6), transparent 75%);
                    border-color: color-mix(in srgb, var(--color-primary, #3b82f6), transparent 50%);
                }
                #typing-game-ui .bottom-bar {
                    display: flex;
                    justify-content: center;
                    margin-top: 1rem;
                }
                #typing-game-ui .bottom-restart-btn {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 0.5rem;
                    background: transparent;
                    border: none;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                    border-radius: 0.375rem;
                }
                #typing-game-ui .bottom-restart-btn:hover {
                    color: var(--color-primary, #3b82f6);
                    background: color-mix(in srgb, var(--color-primary, #3b82f6), transparent 90%);
                }
            </style>
            
            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 transition-colors">
                <!-- Options Bar -->
                <div class="options-bar" id="options-bar">
                    <!-- Toggles -->
                    <div class="option-group">
                        <button class="toggle-btn" id="punctuation-toggle" title="Adicionar pontuação">
                            <span>@</span>
                            <span>pontuação</span>
                        </button>
                        <button class="toggle-btn" id="numbers-toggle" title="Adicionar números">
                            <span>#</span>
                            <span>números</span>
                        </button>
                    </div>
                    
                    <div class="option-separator"></div>
                    
                    <!-- Game Mode -->
                    <div class="option-group">
                        <button class="mode-btn active" id="mode-time" data-mode="time">
                            <i data-lucide="clock" class="w-4 h-4 inline mr-1"></i>tempo
                        </button>
                        <button class="mode-btn" id="mode-words" data-mode="words">
                            <i data-lucide="text" class="w-4 h-4 inline mr-1"></i>palavras
                        </button>
                    </div>
                    
                    <div class="option-separator"></div>
                    
                    <!-- Time/Word Values -->
                    <div class="option-group" id="time-values">
                        <button class="value-btn" data-time="15">15</button>
                        <button class="value-btn active" data-time="30">30</button>
                        <button class="value-btn" data-time="60">60</button>
                        <button class="value-btn" data-time="120">120</button>
                    </div>
                    <div class="option-group" id="word-values" style="display: none;">
                        <button class="value-btn" data-words="10">10</button>
                        <button class="value-btn active" data-words="25">25</button>
                        <button class="value-btn" data-words="50">50</button>
                        <button class="value-btn" data-words="100">100</button>
                    </div>
                    
                    <div class="option-separator"></div>
                    
                    <!-- Language -->
                    <div class="option-group">
                        <button class="lang-btn active" id="lang-pt" data-lang="pt">
                            <i data-lucide="globe" class="w-4 h-4"></i>
                            <span>português</span>
                        </button>
                        <button class="lang-btn" id="lang-en" data-lang="en">
                            <span>english</span>
                        </button>
                    </div>
                </div>
                
                <!-- Live Stats -->
                <div class="stats-row" id="typing-stats">
                    <div class="stat-item">
                        <div class="stat-value" id="typing-wpm">0</div>
                        <div class="stat-label">wpm</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="typing-accuracy">100%</div>
                        <div class="stat-label">precisão</div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-value" id="typing-time">${this.gameMode === 'time' ? this.timeLimit : '0'}</div>
                        <div class="stat-label" id="time-label">${this.gameMode === 'time' ? 'segundos' : 'tempo'}</div>
                    </div>
                    <div class="stat-item" id="words-progress-item" style="${this.gameMode === 'words' ? '' : 'display: none;'}">
                        <div class="stat-value" id="typing-words-progress">0/${this.wordLimit}</div>
                        <div class="stat-label">palavras</div>
                    </div>
                </div>
                
                <!-- Words Container -->
                <div class="words-container blur bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700" id="words-container">
                    <div class="focus-warning bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                        <i data-lucide="mouse-pointer-click" class="w-5 h-5 mr-2"></i>
                        <span>Clique aqui ou pressione qualquer tecla para focar</span>
                    </div>
                    <div class="words-wrap" id="words-display"></div>
                    <div class="caret" id="typing-caret" style="display: none;"></div>
                </div>
                
                <input type="text" id="typing-input" class="typing-input-hidden" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false">
                
                <!-- Bottom Bar with Restart -->
                <div class="bottom-bar" id="bottom-bar">
                    <button class="bottom-restart-btn" id="restart-btn" title="Reiniciar teste">
                        <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                    </button>
                </div>
                
                <!-- Results Screen -->
                <div id="typing-results" class="result-screen hidden bg-slate-50 dark:bg-slate-800 shadow-xl">
                    <div class="result-label">wpm</div>
                    <div class="result-wpm" id="result-wpm">0</div>
                    <div class="result-stats">
                        <div class="stat-item">
                            <div class="result-stat-value text-slate-800 dark:text-slate-200" id="result-accuracy">100%</div>
                            <div class="stat-label">precisão</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value text-slate-800 dark:text-slate-200" id="result-correct">0</div>
                            <div class="result-stat-detail">corretos</div>
                            <div class="stat-label">caracteres</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value text-slate-800 dark:text-slate-200" id="result-incorrect">0</div>
                            <div class="result-stat-detail">incorretos</div>
                            <div class="stat-label">caracteres</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value text-slate-800 dark:text-slate-200" id="result-extra">0</div>
                            <div class="result-stat-detail">extras</div>
                            <div class="stat-label">caracteres</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value text-slate-800 dark:text-slate-200" id="result-time">0s</div>
                            <div class="stat-label">tempo</div>
                        </div>
                    </div>
                    <button class="restart-btn" id="result-restart-btn">
                        <i data-lucide="rotate-ccw" class="w-4 h-4"></i>
                        <span>Reiniciar</span>
                    </button>
                    <div class="restart-hint">
                        <kbd>Tab</kbd> + <kbd>Enter</kbd> - reiniciar teste
                    </div>
                </div>
            </div>
        `;

        this.container.appendChild(typingUI);
        lucide.createIcons();

        // Armazenar elementos DOM em cache
        this.wordsContainer = document.getElementById('words-container');
        this.wordsDisplay = document.getElementById('words-display');
        this.input = document.getElementById('typing-input');
        this.caret = document.getElementById('typing-caret');
        this.resultsDiv = document.getElementById('typing-results');
        this.statsDiv = document.getElementById('typing-stats');
        this.optionsBar = document.getElementById('options-bar');
        this.bottomBar = document.getElementById('bottom-bar');

        this.setupEventListeners(typingUI);
        this.generateWords();
        this.renderWords();
    }

    setupEventListeners(typingUI) {
        // Alternar pontuação
        const punctToggle = document.getElementById('punctuation-toggle');
        punctToggle.addEventListener('click', () => {
            if (this.running) return;
            this.includePunctuation = !this.includePunctuation;
            punctToggle.classList.toggle('active', this.includePunctuation);
            this.reset();
        });

        // Alternar números
        const numToggle = document.getElementById('numbers-toggle');
        numToggle.addEventListener('click', () => {
            if (this.running) return;
            this.includeNumbers = !this.includeNumbers;
            numToggle.classList.toggle('active', this.includeNumbers);
            this.reset();
        });

        // Botões de modo de jogo
        const modeTime = document.getElementById('mode-time');
        const modeWords = document.getElementById('mode-words');
        const timeValues = document.getElementById('time-values');
        const wordValues = document.getElementById('word-values');

        modeTime.addEventListener('click', () => {
            if (this.running) return;
            this.gameMode = 'time';
            modeTime.classList.add('active');
            modeWords.classList.remove('active');
            timeValues.style.display = '';
            wordValues.style.display = 'none';
            this.updateStatsDisplay();
            this.reset();
        });

        modeWords.addEventListener('click', () => {
            if (this.running) return;
            this.gameMode = 'words';
            modeWords.classList.add('active');
            modeTime.classList.remove('active');
            wordValues.style.display = '';
            timeValues.style.display = 'none';
            this.updateStatsDisplay();
            this.reset();
        });

        // Botões de valor de tempo
        typingUI.querySelectorAll('#time-values .value-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.running) return;
                typingUI.querySelectorAll('#time-values .value-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeLimit = parseInt(btn.dataset.time);
                this.reset();
            });
        });

        // Botões de valor de palavras
        typingUI.querySelectorAll('#word-values .value-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.running) return;
                typingUI.querySelectorAll('#word-values .value-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.wordLimit = parseInt(btn.dataset.words);
                this.reset();
            });
        });

        // Botões de idioma
        const langPt = document.getElementById('lang-pt');
        const langEn = document.getElementById('lang-en');

        langPt.addEventListener('click', () => {
            if (this.running) return;
            this.language = 'pt';
            langPt.classList.add('active');
            langEn.classList.remove('active');
            this.reset();
        });

        langEn.addEventListener('click', () => {
            if (this.running) return;
            this.language = 'en';
            langEn.classList.add('active');
            langPt.classList.remove('active');
            this.reset();
        });

        // Botões de reiniciar
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
            this.focusInput();
        });

        document.getElementById('result-restart-btn').addEventListener('click', () => {
            this.reset();
            this.focusInput();
        });

        // Clique no container de palavras
        this.wordsContainer.addEventListener('click', () => this.focusInput());

        // Eventos de entrada
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('blur', () => this.handleBlur());
        this.input.addEventListener('focus', () => this.handleFocus());

        // Reiniciar com Tab + Enter
        this.keydownHandler = (e) => {
            if (e.key === 'Tab' && this.gameEnded) {
                e.preventDefault();
                this.tabPressed = true;
            }
            if (e.key === 'Enter' && this.tabPressed && this.gameEnded) {
                e.preventDefault();
                this.reset();
                this.focusInput();
                this.tabPressed = false;
            }
        };

        this.keyupHandler = (e) => {
            if (e.key === 'Tab') this.tabPressed = false;
        };

        document.addEventListener('keydown', this.keydownHandler);
        document.addEventListener('keyup', this.keyupHandler);
    }

    updateStatsDisplay() {
        const timeEl = document.getElementById('typing-time');
        const timeLabel = document.getElementById('time-label');
        const wordsProgressItem = document.getElementById('words-progress-item');
        const wordsProgress = document.getElementById('typing-words-progress');

        if (this.gameMode === 'time') {
            timeEl.textContent = this.timeLimit;
            timeLabel.textContent = 'segundos';
            wordsProgressItem.style.display = 'none';
        } else {
            timeEl.textContent = '0';
            timeLabel.textContent = 'tempo';
            wordsProgressItem.style.display = '';
            wordsProgress.textContent = `0/${this.wordLimit}`;
        }
    }

    focusInput() {
        this.input.focus();
    }

    handleFocus() {
        this.wordsContainer.classList.remove('blur');
        this.caret.style.display = 'block';
        this.updateCaretPosition();
    }

    handleBlur() {
        if (!this.gameEnded) {
            this.wordsContainer.classList.add('blur');
            this.caret.style.display = 'none';
        }
    }

    reset() {
        this.timeLeft = this.timeLimit;
        this.elapsedTime = 0;
        this.currentWordIndex = 0;
        this.correctChars = 0;
        this.incorrectChars = 0;
        this.extraChars = 0;
        this.totalTyped = 0;
        this.wordsCompleted = 0;
        this.running = false;
        this.gameEnded = false;
        this.wordInputs = [];

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        this.generateWords();
        this.renderWords();

        if (this.input) {
            this.input.value = '';
            this.input.disabled = false;
        }

        if (this.resultsDiv) this.resultsDiv.classList.add('hidden');
        if (this.statsDiv) this.statsDiv.classList.remove('hidden');
        if (this.optionsBar) this.optionsBar.classList.remove('hidden');
        if (this.bottomBar) this.bottomBar.classList.remove('hidden');
        if (this.wordsContainer) {
            this.wordsContainer.style.display = 'block';
            this.wordsContainer.classList.add('blur');
        }

        // Resetar estatísticas ao vivo
        const wpmEl = document.getElementById('typing-wpm');
        const accEl = document.getElementById('typing-accuracy');
        const timeEl = document.getElementById('typing-time');
        const wordsProgress = document.getElementById('typing-words-progress');

        if (wpmEl) wpmEl.textContent = '0';
        if (accEl) accEl.textContent = '100%';

        if (this.gameMode === 'time') {
            if (timeEl) timeEl.textContent = this.timeLimit;
        } else {
            if (timeEl) timeEl.textContent = '0';
            if (wordsProgress) wordsProgress.textContent = `0/${this.wordLimit}`;
        }

        this.updateStatsDisplay();
    }

    getWordList() {
        return this.language === 'pt' ? this.portugueseWords : this.englishWords;
    }

    generateSingleWord() {
        const wordList = this.getWordList();
        let word = wordList[Math.floor(Math.random() * wordList.length)];

        // Adicionar pontuação aleatoriamente
        if (this.includePunctuation && Math.random() < 0.15) {
            const punct = this.punctuationMarks[Math.floor(Math.random() * this.punctuationMarks.length)];
            word = word + punct;
        }

        // Adicionar números aleatoriamente
        if (this.includeNumbers && Math.random() < 0.1) {
            const num = Math.floor(Math.random() * 100).toString();
            word = Math.random() < 0.5 ? num + word : word + num;
        }

        return word;
    }

    generateWords() {
        const wordCount = this.gameMode === 'words' ? this.wordLimit : 150;

        this.testWords = [];
        for (let i = 0; i < wordCount; i++) {
            this.testWords.push(this.generateSingleWord());
        }
        this.wordInputs = this.testWords.map(() => '');
    }

    renderWords() {
        if (!this.wordsDisplay) return;

        let html = '';
        this.testWords.forEach((word, wordIndex) => {
            const wordInput = this.wordInputs[wordIndex] || '';
            let wordClass = 'word';
            if (wordIndex === this.currentWordIndex) wordClass += ' current';

            let wordHtml = `<span class="${wordClass}" data-word="${wordIndex}">`;

            for (let i = 0; i < word.length; i++) {
                let letterClass = 'letter';
                if (wordIndex < this.currentWordIndex) {
                    letterClass += wordInput[i] === word[i] ? ' correct' : ' incorrect';
                } else if (wordIndex === this.currentWordIndex && i < wordInput.length) {
                    letterClass += wordInput[i] === word[i] ? ' correct' : ' incorrect';
                }
                wordHtml += `<span class="${letterClass}" data-char="${i}">${word[i]}</span>`;
            }

            if (wordInput.length > word.length) {
                for (let i = word.length; i < wordInput.length; i++) {
                    wordHtml += `<span class="letter extra">${wordInput[i]}</span>`;
                }
            }

            wordHtml += '</span>';
            html += wordHtml;
        });

        this.wordsDisplay.innerHTML = html;
        this.scrollToCurrentWord();
    }

    scrollToCurrentWord() {
        const currentWordEl = this.wordsDisplay.querySelector('.word.current');
        if (currentWordEl && this.wordsContainer) {
            const containerRect = this.wordsContainer.getBoundingClientRect();
            const wordRect = currentWordEl.getBoundingClientRect();

            if (wordRect.top > containerRect.top + 80) {
                this.wordsContainer.scrollTop += 48;
            }
        }
    }

    updateCaretPosition() {
        if (!this.caret || !this.wordsDisplay) return;

        const currentWordEl = this.wordsDisplay.querySelector('.word.current');
        if (!currentWordEl) return;

        const chars = currentWordEl.querySelectorAll('.letter');
        const currentInput = this.wordInputs[this.currentWordIndex] || '';
        let targetEl;

        if (currentInput.length === 0) {
            targetEl = chars[0];
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const containerRect = this.wordsContainer.getBoundingClientRect();
                this.caret.style.left = (rect.left - containerRect.left) + 'px';
                this.caret.style.top = (rect.top - containerRect.top + this.wordsContainer.scrollTop) + 'px';
            }
        } else if (currentInput.length >= chars.length) {
            targetEl = chars[chars.length - 1];
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const containerRect = this.wordsContainer.getBoundingClientRect();
                this.caret.style.left = (rect.right - containerRect.left) + 'px';
                this.caret.style.top = (rect.top - containerRect.top + this.wordsContainer.scrollTop) + 'px';
            }
        } else {
            targetEl = chars[currentInput.length];
            if (targetEl) {
                const rect = targetEl.getBoundingClientRect();
                const containerRect = this.wordsContainer.getBoundingClientRect();
                this.caret.style.left = (rect.left - containerRect.left) + 'px';
                this.caret.style.top = (rect.top - containerRect.top + this.wordsContainer.scrollTop) + 'px';
            }
        }
    }

    start() {
        if (this.input) {
            this.input.focus();
        }
    }

    startTimer() {
        if (this.running) return;

        this.running = true;
        this.startTime = Date.now();

        this.timerInterval = setInterval(() => {
            const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
            this.elapsedTime = elapsed;

            const timeEl = document.getElementById('typing-time');

            if (this.gameMode === 'time') {
                this.timeLeft = Math.max(0, this.timeLimit - elapsed);
                if (timeEl) timeEl.textContent = this.timeLeft;

                if (this.timeLeft <= 0) {
                    this.endGame();
                }
            } else {
                // Modo palavras - contar para cima
                if (timeEl) timeEl.textContent = elapsed;
            }

            // Atualizar WPM e precisão ao vivo
            this.updateLiveStats();
        }, 100);
    }

    updateLiveStats() {
        const wpmEl = document.getElementById('typing-wpm');
        const accEl = document.getElementById('typing-accuracy');
        const wordsProgress = document.getElementById('typing-words-progress');

        // Calcular WPM ao vivo
        const elapsedMinutes = this.elapsedTime / 60;
        const liveWpm = elapsedMinutes > 0 ? Math.round((this.correctChars / 5) / elapsedMinutes) : 0;

        // Calcular precisão ao vivo
        const liveAccuracy = this.totalTyped > 0 ? Math.round((this.correctChars / this.totalTyped) * 100) : 100;

        if (wpmEl) wpmEl.textContent = liveWpm;
        if (accEl) accEl.textContent = liveAccuracy + '%';

        if (this.gameMode === 'words' && wordsProgress) {
            wordsProgress.textContent = `${this.wordsCompleted}/${this.wordLimit}`;
        }
    }

    stop() {
        this.running = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Remover event listeners
        if (this.keydownHandler) {
            document.removeEventListener('keydown', this.keydownHandler);
        }
        if (this.keyupHandler) {
            document.removeEventListener('keyup', this.keyupHandler);
        }

        const typingUI = document.getElementById('typing-game-ui');
        if (typingUI) typingUI.remove();
        this.canvas.style.display = 'block';
    }

    handleKeyDown(e) {
        if (e.key === 'Backspace' && this.input.value === '' && this.currentWordIndex > 0) {
            e.preventDefault();
            this.currentWordIndex--;
            this.input.value = this.wordInputs[this.currentWordIndex];
            this.renderWords();
            this.updateCaretPosition();
        }
    }

    handleInput() {
        if (this.gameEnded) return;

        if (!this.running) {
            this.startTimer();
        }

        const typed = this.input.value;

        if (typed.endsWith(' ')) {
            const wordTyped = typed.slice(0, -1);
            this.wordInputs[this.currentWordIndex] = wordTyped;

            const currentWord = this.testWords[this.currentWordIndex];

            // Contar caracteres corretos, incorretos e extras
            for (let i = 0; i < Math.max(wordTyped.length, currentWord.length); i++) {
                this.totalTyped++;
                if (i < currentWord.length && i < wordTyped.length) {
                    if (wordTyped[i] === currentWord[i]) {
                        this.correctChars++;
                    } else {
                        this.incorrectChars++;
                    }
                } else if (i >= currentWord.length) {
                    // Caracteres extras - contar apenas como extra, não como incorreto
                    this.extraChars++;
                } else {
                    // Caracteres faltando
                    this.incorrectChars++;
                }
            }

            this.wordsCompleted++;
            this.currentWordIndex++;
            this.input.value = '';

            // Verificar se o modo palavras está completo
            if (this.gameMode === 'words' && this.wordsCompleted >= this.wordLimit) {
                this.endGame();
                return;
            }

            // Gerar mais palavras se necessário
            if (this.currentWordIndex >= this.testWords.length) {
                if (this.gameMode === 'time') {
                    // No modo tempo, regenerar palavras usando método auxiliar
                    const additionalWords = [];
                    for (let i = 0; i < 50; i++) {
                        additionalWords.push(this.generateSingleWord());
                    }
                    this.testWords = this.testWords.concat(additionalWords);
                    this.wordInputs = this.wordInputs.concat(additionalWords.map(() => ''));
                }
            }

            this.renderWords();
        } else {
            this.wordInputs[this.currentWordIndex] = typed;
            this.renderWords();
        }

        this.updateCaretPosition();
        this.updateLiveStats();
    }

    endGame() {
        this.running = false;
        this.gameEnded = true;

        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }

        // Calcular estatísticas finais
        let elapsedMinutes;
        if (this.gameMode === 'time') {
            elapsedMinutes = this.timeLimit / 60;
        } else {
            elapsedMinutes = this.elapsedTime / 60;
        }

        const wpm = elapsedMinutes > 0 ? Math.round((this.correctChars / 5) / elapsedMinutes) : 0;
        const accuracy = this.totalTyped > 0 ? Math.round((this.correctChars / this.totalTyped) * 100) : 100;

        this.input.disabled = true;
        this.wordsContainer.style.display = 'none';
        this.statsDiv.classList.add('hidden');
        this.optionsBar.classList.add('hidden');
        this.bottomBar.classList.add('hidden');
        this.resultsDiv.classList.remove('hidden');
        this.caret.style.display = 'none';

        // Atualizar exibição do resultado
        document.getElementById('result-wpm').textContent = wpm;
        document.getElementById('result-accuracy').textContent = accuracy + '%';
        document.getElementById('result-correct').textContent = this.correctChars;
        document.getElementById('result-incorrect').textContent = this.incorrectChars;
        document.getElementById('result-extra').textContent = this.extraChars;

        if (this.gameMode === 'time') {
            document.getElementById('result-time').textContent = this.timeLimit + 's';
        } else {
            document.getElementById('result-time').textContent = this.elapsedTime + 's';
        }

        this.onScore(wpm);
    }
}

class MemoryGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.onScore = onScore;
        this.manager = manager;
        this.container = canvas.parentElement;

        // Ícones com tema de bicicleta
        this.allIcons = ['bike', 'circle', 'hard-hat', 'map', 'route', 'compass', 'mountain', 'flag', 'trophy', 'medal', 'timer', 'gauge'];

        // Configurações de dificuldade
        this.difficulties = {
            easy: { cols: 3, rows: 4, pairs: 6, name: 'Fácil' },
            medium: { cols: 4, rows: 4, pairs: 8, name: 'Médio' },
            hard: { cols: 4, rows: 6, pairs: 12, name: 'Difícil' }
        };

        this.difficulty = 'medium';
        this.running = false;
        this.comboCount = 0;
        this.lastMatchTime = 0;

        this.createUI();
    }

    createUI() {
        this.canvas.style.display = 'none';

        let memoryUI = document.getElementById('memory-game-ui');
        if (memoryUI) memoryUI.remove();

        memoryUI = document.createElement('div');
        memoryUI.id = 'memory-game-ui';
        memoryUI.className = 'w-full max-w-lg mx-auto select-none';
        memoryUI.innerHTML = `
            <style>
                #memory-game-ui .diff-btn {
                    transition: all 0.2s;
                    border: 1px solid transparent;
                }
                #memory-game-ui .diff-btn.active {
                    background: var(--color-primary, #3b82f6);
                    color: white;
                    border-color: var(--color-primary, #3b82f6);
                }
                #memory-game-ui .diff-btn:not(.active) {
                    background: var(--bg-secondary, rgba(30, 41, 59, 0.5));
                    color: #64748b;
                    border-color: var(--border-color, rgba(71, 85, 105, 0.3));
                }
                #memory-game-ui .diff-btn:not(.active):hover {
                    color: var(--color-primary, #3b82f6);
                    border-color: var(--color-primary, #3b82f6);
                }
                #memory-game-ui .memory-card-inner {
                    transform-style: preserve-3d;
                    transition: transform 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
                }
                #memory-game-ui .memory-card.flipped .memory-card-inner {
                    transform: rotateY(180deg);
                }
                #memory-game-ui .memory-face {
                    backface-visibility: hidden;
                    position: absolute;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    border-radius: 0.75rem;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                }
                #memory-game-ui .memory-front {
                    background: linear-gradient(135deg, var(--color-primary, #3b82f6), var(--color-secondary, #a855f7));
                    transform: rotateY(180deg);
                }
                #memory-game-ui .memory-back {
                    background: var(--bg-secondary, #1e293b);
                    border: 2px solid var(--border-color, #334155);
                }
                #memory-game-ui .stat-value {
                    color: var(--color-primary, #3b82f6);
                }
            </style>

            <div class="bg-slate-50 dark:bg-slate-800 rounded-xl p-6 border border-slate-200 dark:border-slate-700 shadow-xl transition-colors">
                <div id="memory-difficulty-selector" class="flex gap-2 mb-6 justify-center">
                    <button data-diff="easy" class="diff-btn px-4 py-2 rounded-lg font-medium">Fácil</button>
                    <button data-diff="medium" class="diff-btn px-4 py-2 rounded-lg font-medium active">Médio</button>
                    <button data-diff="hard" class="diff-btn px-4 py-2 rounded-lg font-medium">Difícil</button>
                </div>
                
                <div class="flex justify-between items-center mb-6 px-2">
                    <div class="text-center">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Movimentos</p>
                        <p id="memory-moves" class="text-xl font-bold text-slate-700 dark:text-slate-200">0</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Pares</p>
                        <p id="memory-pairs" class="text-xl font-bold text-slate-700 dark:text-slate-200">0/8</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Combo</p>
                        <p id="memory-combo" class="text-xl font-bold stat-value">x1</p>
                    </div>
                    <div class="text-center">
                        <p class="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Tempo</p>
                        <p id="memory-time" class="text-xl font-bold text-slate-700 dark:text-slate-200">0:00</p>
                    </div>
                </div>
                
                <div id="memory-grid" class="grid gap-3 mb-6 perspective-1000"></div>
                
                <button id="memory-reset" class="w-full px-6 py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 active:translate-y-0" style="background: linear-gradient(to right, var(--color-primary, #3b82f6), var(--color-secondary, #a855f7)); color: white;">
                    <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                    Novo Jogo
                </button>
            </div>
        `;

        this.container.appendChild(memoryUI);

        // Configurar botões de dificuldade
        memoryUI.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (btn.classList.contains('active')) return;
                memoryUI.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.difficulty = btn.dataset.diff;
                this.reset();
            });
        });

        document.getElementById('memory-reset').addEventListener('click', () => this.reset());

        lucide.createIcons();
        this.reset();
    }

    updateDifficultyButtons() {
        // Tratado pela alternância de classe no event listener
    }

    reset() {
        const settings = this.difficulties[this.difficulty];
        this.icons = this.allIcons.slice(0, settings.pairs);
        this.cols = settings.cols;
        this.rows = settings.rows;

        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.score = 0;
        this.comboCount = 0;
        this.startTime = null;
        this.running = false;

        // Atualizar layout da grade
        const grid = document.getElementById('memory-grid');
        if (grid) {
            grid.style.gridTemplateColumns = `repeat(${this.cols}, 1fr)`;
        }

        const shuffled = [...this.icons, ...this.icons].sort(() => Math.random() - 0.5);
        this.cards = shuffled.map((icon, index) => ({
            id: index,
            icon,
            flipped: false,
            matched: false,
            animating: false
        }));

        this.renderGrid();
        this.updateStats();

        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    renderGrid() {
        const grid = document.getElementById('memory-grid');
        if (!grid) return;

        grid.innerHTML = this.cards.map(card => `
            <div class="memory-card aspect-square relative cursor-pointer ${card.flipped || card.matched ? 'flipped' : ''}" data-id="${card.id}">
                <div class="memory-card-inner w-full h-full relative">
                    <div class="memory-face memory-back">
                        <i data-lucide="help-circle" class="w-8 h-8 text-slate-400 opacity-50"></i>
                    </div>
                    <div class="memory-face memory-front">
                        <i data-lucide="${card.icon}" class="w-8 h-8 text-white drop-shadow-md"></i>
                    </div>
                </div>
            </div>
        `).join('');

        lucide.createIcons();

        grid.querySelectorAll('.memory-card').forEach(cardEl => {
            cardEl.addEventListener('click', () => {
                if (cardEl.classList.contains('flipped')) return;
                const id = parseInt(cardEl.dataset.id);
                this.flipCard(id);
            });
        });
    }

    flipCard(id) {
        const card = this.cards[id];

        if (card.flipped || card.matched || this.flippedCards.length >= 2) return;

        if (!this.running) {
            this.running = true;
            this.startTime = Date.now();
            this.timerInterval = setInterval(() => this.updateTimer(), 1000);
        }

        card.flipped = true;
        this.flippedCards.push(card);
        this.renderGrid();

        if (this.flippedCards.length === 2) {
            this.moves++;

            const [first, second] = this.flippedCards;

            if (first.icon === second.icon) {
                first.matched = true;
                second.matched = true;
                first.animating = true;
                second.animating = true;
                this.matchedPairs++;

                // Sistema de combo
                const now = Date.now();
                if (now - this.lastMatchTime < 3000) {
                    this.comboCount = Math.min(this.comboCount + 1, 5);
                } else {
                    this.comboCount = 1;
                }
                this.lastMatchTime = now;

                // Pontuação com bônus de combo
                const baseScore = this.difficulty === 'hard' ? 150 : this.difficulty === 'medium' ? 100 : 50;
                this.score += baseScore * this.comboCount;

                this.flippedCards = [];
                this.updateStats();
                this.renderGrid();

                // Resetar animação
                setTimeout(() => {
                    first.animating = false;
                    second.animating = false;
                    this.renderGrid();
                }, 300);

                if (this.matchedPairs === this.icons.length) {
                    this.endGame();
                }
            } else {
                // Resetar combo ao errar
                this.comboCount = 0;
                this.updateStats();

                setTimeout(() => {
                    first.flipped = false;
                    second.flipped = false;
                    this.flippedCards = [];
                    this.renderGrid();
                }, 1000);
            }
        }
    }

    updateStats() {
        const movesEl = document.getElementById('memory-moves');
        const pairsEl = document.getElementById('memory-pairs');
        const comboEl = document.getElementById('memory-combo');

        if (movesEl) movesEl.textContent = this.moves;
        if (pairsEl) pairsEl.textContent = `${this.matchedPairs}/${this.icons.length}`;
        if (comboEl) {
            comboEl.textContent = `x${Math.max(1, this.comboCount)}`;
            if (this.comboCount >= 3) {
                comboEl.classList.add('text-yellow-500', 'animate-pulse');
            } else {
                comboEl.classList.remove('text-yellow-500', 'animate-pulse');
            }
        }
    }

    updateTimer() {
        if (!this.startTime) return;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        const timeEl = document.getElementById('memory-time');
        if (timeEl) timeEl.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    start() {
        // Jogo começa na primeira carta virada
    }

    stop() {
        if (this.timerInterval) clearInterval(this.timerInterval);
        const memoryUI = document.getElementById('memory-game-ui');
        if (memoryUI) memoryUI.remove();
        this.canvas.style.display = 'block';
    }

    endGame() {
        clearInterval(this.timerInterval);
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);

        // Bônus de tempo
        const timeBonus = Math.max(0, 300 - elapsed) * 2;

        // Bônus de eficiência (menos movimentos = melhor)
        const minMoves = this.icons.length;
        const efficiencyBonus = Math.max(0, (minMoves * 3 - this.moves)) * 20;

        const finalScore = this.score + timeBonus + efficiencyBonus;

        // Verificar conquista do modo difícil
        if (this.difficulty === 'hard' && this.manager) {
            this.manager.unlockAchievement('elephant_memory');
        }

        setTimeout(() => {
            Modals.showAlert(`Parabéns! Você completou em ${this.moves} movimentos!\nTempo: ${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}\nPontuação: ${finalScore}`, 'Jogo Concluído').then(() => {
                this.onScore(finalScore);
            });
        }, 500);
    }
}

class SpaceInvadersGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.canvas.width = 400;
        this.canvas.height = 500;

        this.stars = [];
        for (let i = 0; i < 80; i++) {
            this.stars.push({ x: Math.random() * 400, y: Math.random() * 500, s: Math.random() * 1.5 + 0.5, sp: Math.random() * 0.3 + 0.1, a: Math.random() * Math.PI * 2 });
        }
        this.particles = [];
        this.setupControls();
        this.reset();
    }

    reset() {
        this.player = {
            x: this.canvas.width / 2 - 15,
            y: this.canvas.height - 45,
            width: 30,
            height: 20,
            speed: 4,
            bullets: [],
            hasShield: false,
            hasTripleShot: false,
            speedBoost: false,
            shieldTimer: 0,
            tripleShotTimer: 0,
            speedBoostTimer: 0
        };

        this.enemies = [];
        this.enemyBullets = [];
        this.powerUps = [];
        this.wave = 1;
        this.maxWave = 5;
        this.lives = 3;
        this.score = 0;
        this.gameOver = false;
        this.won = false;
        this.lastShot = 0;
        this.shootCooldown = 280;
        this.specialEnemy = null;
        this.specialTimer = 0;
        this.bossActive = false;
        this.boss = null;
        this.enemyDir = 1;
        this.enemyDrop = 12;
        this.enemyMoveTimer = 0;
        this.enemyMoveInterval = 700;
        this.particles = [];
        this.graceTimer = 1500;

        this.spawnWave();
        this.updateScoreDisplay();
    }

    spawnWave() {
        this.enemies = [];
        this.enemyBullets = [];
        this.bossActive = false;
        this.boss = null;
        const rows = 3 + Math.min(this.wave - 1, 2);
        const cols = 6 + Math.min(this.wave - 1, 2);
        const ew = 28, eh = 22, pad = 8;
        const ox = (this.canvas.width - cols * (ew + pad)) / 2;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const hp = r < 2 ? 1 : 2;
                this.enemies.push({
                    x: ox + c * (ew + pad), y: 50 + r * (eh + pad),
                    width: ew, height: eh, hp, maxHp: hp,
                    row: r, points: (rows - r) * 10 * this.wave
                });
            }
        }
        this.enemyDir = 1;
        this.enemyMoveTimer = 0;
        this.enemyMoveInterval = Math.max(250, 700 - (this.wave - 1) * 100);

        if (this.wave === this.maxWave) this.spawnBoss();
    }

    spawnBoss() {
        this.bossActive = true;
        const hp = 15 + this.wave * 5;
        this.boss = {
            x: this.canvas.width / 2 - 45, y: 35, width: 90, height: 50,
            hp, maxHp: hp, dir: 1, speed: 2, lastShot: 0, shootCD: 1200,
            points: 500 * this.wave
        };
    }

    spawnParticles(x, y, color, count) {
        const n = count || 8;
        for (let i = 0; i < n; i++) {
            this.particles.push({
                x, y, vx: (Math.random() - 0.5) * 5, vy: (Math.random() - 0.5) * 5,
                life: 1, color, r: Math.random() * 2.5 + 1
            });
        }
    }

    setupControls() {
        this.keys = { left: false, right: false, shoot: false };
        this.keyDownHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameOver || this.won) { this.reset(); this.start(); }
                else this.keys.shoot = true;
            }
        };
        this.keyUpHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
            if (e.key === ' ') this.keys.shoot = false;
        };
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = Date.now();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        this.animationId = null;
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
    }

    gameLoop() {
        if (!this.running) return;
        const now = Date.now();
        const dt = Math.min(now - this.lastUpdate, 50);
        this.lastUpdate = now;
        if (!this.gameOver && !this.won) this.update(dt);
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown) return;
        this.lastShot = now;
        const cx = this.player.x + this.player.width / 2 - 2;
        const py = this.player.y;
        if (this.player.hasTripleShot) {
            this.player.bullets.push({ x: cx, y: py, dx: 0, dy: -7, width: 4, height: 10 });
            this.player.bullets.push({ x: cx, y: py, dx: -1.5, dy: -7, width: 4, height: 10 });
            this.player.bullets.push({ x: cx, y: py, dx: 1.5, dy: -7, width: 4, height: 10 });
        } else {
            this.player.bullets.push({ x: cx, y: py, dx: 0, dy: -7, width: 4, height: 10 });
        }
    }

    update(dt) {
        if (this.graceTimer > 0) this.graceTimer -= dt;
        if (this.player.hasShield) { this.player.shieldTimer -= dt; if (this.player.shieldTimer <= 0) this.player.hasShield = false; }
        if (this.player.hasTripleShot) { this.player.tripleShotTimer -= dt; if (this.player.tripleShotTimer <= 0) this.player.hasTripleShot = false; }
        if (this.player.speedBoost) { this.player.speedBoostTimer -= dt; if (this.player.speedBoostTimer <= 0) this.player.speedBoost = false; }

        const spd = this.player.speedBoost ? this.player.speed * 1.5 : this.player.speed;
        if (this.keys.left) this.player.x = Math.max(0, this.player.x - spd);
        if (this.keys.right) this.player.x = Math.min(this.canvas.width - this.player.width, this.player.x + spd);
        if (this.keys.shoot) this.shoot();

        this.player.bullets = this.player.bullets.filter(b => {
            b.y += b.dy; b.x += b.dx;
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.hitTest(b, this.enemies[i])) {
                    this.enemies[i].hp--;
                    if (this.enemies[i].hp <= 0) {
                        const e = this.enemies[i];
                        this.score += e.points;
                        this.spawnParticles(e.x + e.width / 2, e.y + e.height / 2, this.rowColor(e.row));
                        if (Math.random() < 0.08) this.spawnPowerUp(e.x, e.y);
                        this.enemies.splice(i, 1);
                    }
                    this.updateScoreDisplay();
                    return false;
                }
            }
            if (this.specialEnemy && this.hitTest(b, this.specialEnemy)) {
                this.score += this.specialEnemy.points;
                this.spawnParticles(this.specialEnemy.x + 20, this.specialEnemy.y + 10, '#facc15', 12);
                this.spawnPowerUp(this.specialEnemy.x, this.specialEnemy.y);
                this.specialEnemy = null;
                this.updateScoreDisplay();
                return false;
            }
            if (this.bossActive && this.boss && this.hitTest(b, this.boss)) {
                this.boss.hp--;
                this.spawnParticles(b.x, b.y, '#f87171', 4);
                if (this.boss.hp <= 0) {
                    this.score += this.boss.points;
                    this.spawnParticles(this.boss.x + 45, this.boss.y + 25, '#ef4444', 20);
                    this.bossActive = false; this.boss = null;
                    if (this.wave >= this.maxWave) {
                        this.won = true; this.onScore(this.score);
                        if (this.manager) this.manager.unlockAchievement('galaxy_defender');
                    } else { this.wave++; this.spawnWave(); }
                    this.updateScoreDisplay();
                }
                return false;
            }
            return b.y > -10 && b.y < this.canvas.height + 10;
        });

        this.enemyBullets = this.enemyBullets.filter(b => {
            b.y += b.dy;
            if (this.hitTest({ x: b.x - 3, y: b.y, width: 6, height: 10 }, this.player)) {
                if (!this.player.hasShield) {
                    this.lives--;
                    this.spawnParticles(this.player.x + 15, this.player.y + 10, '#22c55e');
                    this.updateScoreDisplay();
                    if (this.lives <= 0) this._endGame();
                }
                return false;
            }
            return b.y < this.canvas.height + 10;
        });

        this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.life -= 0.04; return p.life > 0; });
        this.stars.forEach(s => { s.y += s.sp; if (s.y > this.canvas.height) { s.y = 0; s.x = Math.random() * this.canvas.width; } });

        this.powerUps = this.powerUps.filter(pu => {
            pu.y += pu.speed;
            if (this.hitTest(pu, this.player)) {
                if (pu.type === 'triple') { this.player.hasTripleShot = true; this.player.tripleShotTimer = 8000; }
                else if (pu.type === 'shield') { this.player.hasShield = true; this.player.shieldTimer = 5000; }
                else if (pu.type === 'speed') { this.player.speedBoost = true; this.player.speedBoostTimer = 6000; }
                else if (pu.type === 'life') { this.lives = Math.min(this.lives + 1, 5); this.updateScoreDisplay(); }
                return false;
            }
            return pu.y < this.canvas.height;
        });

        if (this.specialEnemy) { this.specialEnemy.x += this.specialEnemy.speed; if (this.specialEnemy.x > this.canvas.width + 40) this.specialEnemy = null; }
        this.specialTimer += dt;
        if (!this.specialEnemy && this.specialTimer > 8000 && Math.random() < 0.005) {
            this.specialEnemy = { x: -40, y: 22, width: 40, height: 18, speed: 2.5, points: 100 * this.wave };
            this.specialTimer = 0;
        }

        if (this.bossActive && this.boss) {
            this.boss.x += this.boss.speed * this.boss.dir;
            if (this.boss.x <= 5 || this.boss.x + this.boss.width >= this.canvas.width - 5) this.boss.dir *= -1;
            const now = Date.now();
            if (this.graceTimer <= 0 && now - this.boss.lastShot > this.boss.shootCD) {
                this.boss.lastShot = now;
                this.enemyBullets.push({ x: this.boss.x + 15, y: this.boss.y + this.boss.height, dy: 4, width: 6, height: 8 });
                this.enemyBullets.push({ x: this.boss.x + this.boss.width / 2, y: this.boss.y + this.boss.height, dy: 4.5, width: 6, height: 8 });
                this.enemyBullets.push({ x: this.boss.x + this.boss.width - 15, y: this.boss.y + this.boss.height, dy: 4, width: 6, height: 8 });
            }
        } else if (this.enemies.length > 0) {
            this.enemyMoveTimer += dt;
            if (this.enemyMoveTimer >= this.enemyMoveInterval) {
                this.enemyMoveTimer = 0;
                let drop = false;
                for (const e of this.enemies) {
                    if ((this.enemyDir > 0 && e.x + e.width >= this.canvas.width - 12) || (this.enemyDir < 0 && e.x <= 12)) { drop = true; break; }
                }
                if (drop) { this.enemies.forEach(e => e.y += this.enemyDrop); this.enemyDir *= -1; }
                else this.enemies.forEach(e => e.x += 14 * this.enemyDir);
                if (this.graceTimer <= 0 && Math.random() < 0.15 + this.wave * 0.06) {
                    const s = this.enemies[Math.floor(Math.random() * this.enemies.length)];
                    this.enemyBullets.push({ x: s.x + s.width / 2, y: s.y + s.height, dy: 3 + this.wave * 0.4, width: 4, height: 8 });
                }
            }
            for (const e of this.enemies) { if (e.y + e.height >= this.player.y) { this._endGame(); break; } }
        } else if (!this.bossActive) {
            this.wave++;
            if (this.wave > this.maxWave) { this.won = true; this.onScore(this.score); }
            else this.spawnWave();
        }
    }

    hitTest(a, b) {
        return a.x < b.x + b.width && a.x + a.width > b.x && a.y < b.y + b.height && a.y + a.height > b.y;
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.2) {
            const types = ['triple', 'shield', 'speed', 'life'];
            this.powerUps.push({ x, y, type: types[Math.floor(Math.random() * types.length)], width: 18, height: 18, speed: 1.5 });
        }
    }

    rowColor(row) {
        return ['#3b82f6', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e'][row % 5];
    }

    draw() {
        const ctx = this.ctx, W = this.canvas.width, H = this.canvas.height;
        ctx.fillStyle = '#0a0e1a';
        ctx.fillRect(0, 0, W, H);

        ctx.fillStyle = '#fff';
        this.stars.forEach(s => {
            ctx.globalAlpha = 0.4 + 0.4 * Math.sin(Date.now() * 0.002 + s.a);
            ctx.beginPath(); ctx.arc(s.x, s.y, s.s, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        this.particles.forEach(p => {
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath(); ctx.arc(p.x, p.y, p.r * p.life, 0, Math.PI * 2); ctx.fill();
        });
        ctx.globalAlpha = 1;

        if (this.specialEnemy) {
            const se = this.specialEnemy;
            ctx.fillStyle = '#facc15';
            ctx.shadowBlur = 12; ctx.shadowColor = '#facc15';
            ctx.beginPath();
            ctx.ellipse(se.x + se.width / 2, se.y + se.height / 2, se.width / 2, se.height / 2.5, 0, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = '#a16207';
            ctx.fillRect(se.x + 10, se.y + 4, 4, 4);
            ctx.fillRect(se.x + 26, se.y + 4, 4, 4);
            ctx.shadowBlur = 0;
        }

        this.enemies.forEach(e => {
            const c = this.rowColor(e.row);
            ctx.shadowBlur = 6; ctx.shadowColor = c; ctx.fillStyle = c;
            const cx = e.x + e.width / 2, cy = e.y + e.height / 2;
            const hw = e.width / 2, hh = e.height / 2;
            ctx.beginPath();
            ctx.moveTo(cx, cy - hh);
            ctx.lineTo(cx + hw, cy - hh * 0.3);
            ctx.lineTo(cx + hw * 0.7, cy + hh);
            ctx.lineTo(cx - hw * 0.7, cy + hh);
            ctx.lineTo(cx - hw, cy - hh * 0.3);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#0a0e1a';
            ctx.fillRect(cx - 6, cy - 3, 4, 4);
            ctx.fillRect(cx + 2, cy - 3, 4, 4);
            if (e.hp > 1) {
                ctx.strokeStyle = '#fff';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
            ctx.shadowBlur = 0;
        });

        if (this.bossActive && this.boss) {
            const b = this.boss;
            ctx.shadowBlur = 15; ctx.shadowColor = '#ef4444';
            ctx.fillStyle = '#dc2626';
            ctx.beginPath();
            ctx.moveTo(b.x + b.width / 2, b.y);
            ctx.lineTo(b.x + b.width, b.y + b.height * 0.4);
            ctx.lineTo(b.x + b.width - 10, b.y + b.height);
            ctx.lineTo(b.x + 10, b.y + b.height);
            ctx.lineTo(b.x, b.y + b.height * 0.4);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = '#fca5a5';
            ctx.fillRect(b.x + 25, b.y + 15, 8, 8);
            ctx.fillRect(b.x + b.width - 33, b.y + 15, 8, 8);
            ctx.fillStyle = '#0a0e1a';
            ctx.fillRect(b.x + 27, b.y + 17, 4, 4);
            ctx.fillRect(b.x + b.width - 31, b.y + 17, 4, 4);
            const hpPct = b.hp / b.maxHp;
            ctx.fillStyle = '#1e293b';
            ctx.fillRect(b.x, b.y - 10, b.width, 5);
            ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#eab308' : '#ef4444';
            ctx.fillRect(b.x, b.y - 10, b.width * hpPct, 5);
            ctx.shadowBlur = 0;
        }

        ctx.shadowBlur = 10; ctx.shadowColor = '#22c55e'; ctx.fillStyle = '#22c55e';
        const p = this.player;
        ctx.beginPath();
        ctx.moveTo(p.x + p.width / 2, p.y);
        ctx.lineTo(p.x, p.y + p.height);
        ctx.lineTo(p.x + p.width * 0.35, p.y + p.height - 5);
        ctx.lineTo(p.x + p.width / 2, p.y + p.height);
        ctx.lineTo(p.x + p.width * 0.65, p.y + p.height - 5);
        ctx.lineTo(p.x + p.width, p.y + p.height);
        ctx.closePath();
        ctx.fill();

        if (this.player.hasShield) {
            ctx.strokeStyle = 'rgba(96,165,250,0.6)';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(p.x + p.width / 2, p.y + p.height / 2, 22, 0, Math.PI * 2);
            ctx.stroke();
        }
        ctx.shadowBlur = 0;

        ctx.fillStyle = '#60a5fa'; ctx.shadowBlur = 4; ctx.shadowColor = '#60a5fa';
        this.player.bullets.forEach(b => ctx.fillRect(b.x, b.y, b.width, b.height));
        ctx.fillStyle = '#f87171'; ctx.shadowColor = '#f87171';
        this.enemyBullets.forEach(b => ctx.fillRect(b.x - 1, b.y, b.width, b.height));
        ctx.shadowBlur = 0;

        this.powerUps.forEach(pu => {
            const colors = { triple: '#60a5fa', shield: '#38bdf8', speed: '#a78bfa', life: '#4ade80' };
            const icons = { triple: '⫸', shield: '🛡', speed: '⚡', life: '♥' };
            ctx.fillStyle = colors[pu.type] || '#fff';
            ctx.shadowBlur = 8; ctx.shadowColor = colors[pu.type];
            ctx.beginPath(); ctx.arc(pu.x + 9, pu.y + 9, 10, 0, Math.PI * 2); ctx.fill();
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#0a0e1a';
            ctx.font = 'bold 11px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(icons[pu.type], pu.x + 9, pu.y + 13);
        });

        ctx.fillStyle = '#22c55e';
        for (let i = 0; i < this.lives; i++) {
            const lx = 12 + i * 22, ly = H - 18;
            ctx.beginPath(); ctx.moveTo(lx + 5, ly - 5); ctx.lineTo(lx, ly + 5); ctx.lineTo(lx + 10, ly + 5); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#94a3b8'; ctx.font = '12px Arial'; ctx.textAlign = 'right';
        ctx.fillText(`Onda ${this.wave}/${this.maxWave}`, W - 12, H - 10);

        if (this.gameOver || this.won) {
            ctx.fillStyle = 'rgba(10, 14, 26, 0.88)';
            ctx.fillRect(0, 0, W, H);
            ctx.textAlign = 'center';
            ctx.fillStyle = this.won ? '#10b981' : '#ef4444';
            ctx.font = 'bold 32px Arial';
            ctx.fillText(this.won ? 'VITÓRIA!' : 'GAME OVER', W / 2, H / 2 - 35);
            ctx.fillStyle = '#fff'; ctx.font = 'bold 26px Arial';
            ctx.fillText(`${this.score}`, W / 2, H / 2 + 10);
            ctx.font = '14px Arial'; ctx.fillStyle = '#94a3b8';
            ctx.fillText('PONTOS', W / 2, H / 2 + 30);
            ctx.fillText('Pressione ESPAÇO para jogar', W / 2, H / 2 + 65);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const waveEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (waveEl) waveEl.textContent = `Onda ${this.wave}/${this.maxWave} | Vidas: ${this.lives}`;
    }

    _endGame() {
        if (this.gameOver) return;
        this.gameOver = true;
        this.onScore(this.score);
    }
}

class BreakoutGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;

        this.canvas.width = 400;
        this.canvas.height = 500;

        this.phase = 1;
        this.maxPhase = 5;

        this.running = false;
        this.theme = this.getThemeColors();
        this.particles = [];

        this.reset();
        this.setupControls();
    }

    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        const isDark = document.documentElement.classList.contains('dark');
        const getVar = (name, fallback) => { const val = style.getPropertyValue(name).trim(); return val || fallback; };
        return {
            isDark,
            primary: getVar('--color-primary', '#3b82f6'),
            secondary: getVar('--color-secondary', '#a855f7'),
            accent: getVar('--color-accent', '#ef4444'),
            bg: isDark ? '#0f172a' : '#f8fafc',
            text: isDark ? '#f1f5f9' : '#1e293b'
        };
    }

    spawnParticles(x, y, color) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x, y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: color,
                size: Math.random() * 3 + 2
            });
        }
    }

    reset() {
        this.paddle = {
            width: 80,
            height: 12,
            x: this.canvas.width / 2 - 40,
            speed: 8,
            originalWidth: 80
        };

        this.balls = [{
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            radius: 8,
            dx: 4,
            dy: -4,
            speed: 5, // Velocidade normalizada
            originalRadius: 8
        }];

        this.powerUps = [];
        this.activePowerUps = {
            bigPaddle: 0,
            bigBall: 0,
            multiball: false
        };

        this.score = this.score || 0;
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        this.particles = [];

        this.keys = { left: false, right: false };

        this.generateBricks();
        this.updateScoreDisplay();

        // Atualizar tema
        this.theme = this.getThemeColors();
    }

    generateBricks() {
        this.bricks = [];
        const layouts = this.getPhaseLayout(this.phase);
        const brickWidth = 45;
        const brickHeight = 18;
        const brickPadding = 4;
        const offsetTop = 60;
        const offsetLeft = (this.canvas.width - (8 * (brickWidth + brickPadding))) / 2;

        layouts.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell > 0) {
                    // Gradientes modernos para tijolos
                    const hue = (rowIndex * 40) % 360;
                    this.bricks.push({
                        x: offsetLeft + colIndex * (brickWidth + brickPadding),
                        y: offsetTop + rowIndex * (brickHeight + brickPadding),
                        width: brickWidth,
                        height: brickHeight,
                        color: `hsl(${hue}, 70%, 55%)`,
                        points: cell * 10 * this.phase,
                        hits: cell,
                        maxHits: cell,
                        visible: true
                    });
                }
            });
        });
    }

    getPhaseLayout(phase) {
        // Reutilizar layouts existentes, pode melhorar depois
        const layouts = {
            1: [[1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1]],
            2: [[2, 2, 2, 2, 2, 2, 2, 2], [1, 1, 1, 1, 1, 1, 1, 1], [1, 1, 1, 1, 1, 1, 1, 1], [2, 2, 2, 2, 2, 2, 2, 2]],
            3: [[3, 1, 3, 1, 1, 3, 1, 3], [2, 2, 2, 2, 2, 2, 2, 2], [1, 1, 1, 1, 1, 1, 1, 1], [3, 1, 3, 1, 1, 3, 1, 3]],
            4: [[0, 3, 3, 0, 0, 3, 3, 0], [3, 2, 2, 3, 3, 2, 2, 3], [2, 1, 1, 2, 2, 1, 1, 2], [1, 0, 0, 1, 1, 0, 0, 1]],
            5: [[3, 3, 3, 3, 3, 3, 3, 3], [2, 2, 2, 2, 2, 2, 2, 2], [1, 1, 1, 1, 1, 1, 1, 1], [3, 2, 1, 1, 1, 2, 3]]
        };
        return layouts[phase] || layouts[1];
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.2) {
            const types = ['paddle', 'ball', 'multi', 'life'];
            const type = types[Math.floor(Math.random() * types.length)];
            const colors = { paddle: '#3b82f6', ball: '#22c55e', multi: '#a855f7', life: '#ef4444' };
            const icons = { paddle: '↔', ball: '●', multi: '⁂', life: '❤' };
            this.powerUps.push({
                x, y, type,
                color: colors[type],
                icon: icons[type],
                width: 24, height: 24,
                speed: 2,
                angle: 0
            });
        }
    }

    setupControls() {
        this.keyDownHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
            if (e.key === ' ' && (this.gameOver || this.won)) {
                e.preventDefault();
                this.phase = 1;
                this.score = 0;
                this.reset();
                this.start();
            }
        };
        this.keyUpHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = false;
        };
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = Date.now();
        this.gameLoop();
    }

    stop() {
        this.running = false;
        if (this.animationId) cancelAnimationFrame(this.animationId);
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
    }

    gameLoop() {
        if (!this.running) return;
        const now = Date.now();
        const delta = now - this.lastUpdate;
        if (!this.gameOver && !this.won) this.update(delta);
        this.draw();
        this.lastUpdate = now;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(delta) {
        // Temporização dos power-ups
        if (this.activePowerUps.bigPaddle > 0) {
            this.activePowerUps.bigPaddle -= delta;
            if (this.activePowerUps.bigPaddle <= 0) this.paddle.width = this.paddle.originalWidth;
        }
        if (this.activePowerUps.bigBall > 0) {
            this.activePowerUps.bigBall -= delta;
            if (this.activePowerUps.bigBall <= 0) this.balls.forEach(b => b.radius = b.originalRadius);
        }

        // Movimento da raquete
        if (this.keys.left) this.paddle.x = Math.max(0, this.paddle.x - this.paddle.speed);
        if (this.keys.right) this.paddle.x = Math.min(this.canvas.width - this.paddle.width, this.paddle.x + this.paddle.speed);

        // Atualizar partículas
        this.particles = this.particles.filter(p => p.life > 0);
        this.particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;
            p.life -= 0.05;
            p.size *= 0.95;
        });

        // Atualizar Power-ups
        this.powerUps = this.powerUps.filter(p => {
            p.y += p.speed;
            p.angle += 0.05;

            // Colisão com a raquete
            if (p.y + p.height >= this.canvas.height - this.paddle.height - 10 &&
                p.x + p.width > this.paddle.x && p.x < this.paddle.x + this.paddle.width) {
                switch (p.type) {
                    case 'paddle': this.paddle.width = 120; this.activePowerUps.bigPaddle = 10000; break;
                    case 'ball': this.balls.forEach(b => b.radius = 12); this.activePowerUps.bigBall = 8000; break;
                    case 'multi':
                        if (this.balls.length < 10) {
                            const b = this.balls[0];
                            this.balls.push({ ...b, dx: b.dx + 2, dy: b.dy }, { ...b, dx: b.dx - 2, dy: b.dy });
                        }
                        break;
                    case 'life': this.lives++; this.updateScoreDisplay(); break;
                }
                return false;
            }
            return p.y < this.canvas.height;
        });

        // Lógica das bolas
        this.balls = this.balls.filter(ball => {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Paredes
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
                ball.dx *= -1;
                ball.x = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.x));
            }
            if (ball.y - ball.radius < 0) ball.dy *= -1;

            // Raquete
            if (ball.y + ball.radius > this.canvas.height - this.paddle.height - 10 &&
                ball.y - ball.radius < this.canvas.height - 10 &&
                ball.x > this.paddle.x && ball.x < this.paddle.x + this.paddle.width) {

                ball.dy = -Math.abs(ball.dy);
                // Efeito de direção
                const hitPos = (ball.x - (this.paddle.x + this.paddle.width / 2)) / (this.paddle.width / 2);
                ball.dx = hitPos * 6;
                this.spawnParticles(ball.x, ball.y, this.theme.primary);
            }

            // Tijolos
            this.bricks.forEach(brick => {
                if (brick.visible) {
                    if (ball.x > brick.x && ball.x < brick.x + brick.width &&
                        ball.y > brick.y && ball.y < brick.y + brick.height) {

                        brick.hits--;
                        if (brick.hits <= 0) {
                            brick.visible = false;
                            this.spawnParticles(brick.x + brick.width / 2, brick.y + brick.height / 2, brick.color);
                            this.spawnPowerUp(brick.x + brick.width / 2, brick.y);
                            this.score += brick.points;
                        } else {
                            // Efeito de flash?
                        }
                        ball.dy *= -1;
                        this.updateScoreDisplay();
                    }
                }
            });

            // Perdeu
            if (ball.y - ball.radius > this.canvas.height) {
                if (this.balls.length > 1) return false;
                this.lives--;
                this.updateScoreDisplay();
                if (this.lives <= 0) this.endGame();
                else {
                    ball.x = this.canvas.width / 2;
                    ball.y = this.canvas.height - 50;
                    ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
                    ball.dy = -4;
                }
            }
            return true;
        });

        if (this.bricks.every(b => !b.visible)) {
            if (this.phase < this.maxPhase) {
                this.phase++;
                this.generateBricks();
                this.balls.forEach(b => {
                    b.x = this.canvas.width / 2;
                    b.y = this.canvas.height - 50;
                    b.dx *= 1.1; b.dy *= 1.1;
                });
            } else {
                this.won = true;
                this.onScore(this.score);
                if (this.manager) this.manager.unlockAchievement('destroyer');
            }
        }
    }

    draw() {
        // Limpar e Fundo
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, this.theme.bg);
        gradient.addColorStop(1, '#000');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Estrelas/Grade para visual premium
        this.ctx.strokeStyle = this.theme.isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)';
        this.ctx.beginPath();
        for (let i = 0; i < this.canvas.width; i += 20) { this.ctx.moveTo(i, 0); this.ctx.lineTo(i, this.canvas.height); }
        for (let i = 0; i < this.canvas.height; i += 20) { this.ctx.moveTo(0, i); this.ctx.lineTo(this.canvas.width, i); }
        this.ctx.stroke();

        // Partículas
        this.particles.forEach(p => {
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.globalAlpha = 1;

        // Tijolos
        this.bricks.forEach(brick => {
            if (brick.visible) {
                this.ctx.fillStyle = brick.color;
                this.ctx.shadowBlur = this.theme.isDark ? 10 : 0;
                this.ctx.shadowColor = brick.color;
                this.ctx.beginPath();
                this.ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 4);
                this.ctx.fill();

                // Brilho
                this.ctx.fillStyle = 'rgba(255,255,255,0.2)';
                this.ctx.fillRect(brick.x, brick.y, brick.width, brick.height / 2);

                if (brick.maxHits > 1) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.shadowBlur = 0;
                    this.ctx.fillText(brick.hits, brick.x + brick.width / 2, brick.y + 12);
                }
            }
        });
        this.ctx.shadowBlur = 0;

        // Raquete
        this.ctx.fillStyle = this.theme.primary;
        this.ctx.shadowBlur = this.theme.isDark ? 15 : 0;
        this.ctx.shadowColor = this.theme.primary;
        this.ctx.beginPath();
        this.ctx.roundRect(this.paddle.x, this.canvas.height - this.paddle.height - 10, this.paddle.width, this.paddle.height, 6);
        this.ctx.fill();

        // Luzes da raquete
        this.ctx.fillStyle = '#60a5fa';
        this.ctx.fillRect(this.paddle.x + 5, this.canvas.height - this.paddle.height - 8, this.paddle.width - 10, 2);

        // Power-ups
        this.powerUps.forEach(p => {
            this.ctx.save();
            this.ctx.translate(p.x + 12, p.y + 12);
            this.ctx.rotate(p.angle);
            this.ctx.fillStyle = p.color;
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = p.color;
            this.ctx.beginPath();

            // Forma de estrela para power-up
            for (let i = 0; i < 5; i++) {
                this.ctx.lineTo(Math.cos((18 + i * 72) * Math.PI / 180) * 10, -Math.sin((18 + i * 72) * Math.PI / 180) * 10);
                this.ctx.lineTo(Math.cos((54 + i * 72) * Math.PI / 180) * 4, -Math.sin((54 + i * 72) * Math.PI / 180) * 4);
            }
            this.ctx.fill();
            this.ctx.restore();
        });

        // Bolas
        this.balls.forEach(ball => {
            this.ctx.fillStyle = '#fff';
            this.ctx.shadowBlur = 10;
            this.ctx.shadowColor = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });
        this.ctx.shadowBlur = 0;

        // Interface
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Fase ${this.phase}/${this.maxPhase}`, this.canvas.width - 10, 20);

        if (this.gameOver || this.won) {
            this.ctx.fillStyle = 'rgba(0,0,0,0.85)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 30px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? 'VITÓRIA' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.font = '14px Arial';
            this.ctx.fillText('Pressione ESPAÇO', this.canvas.width / 2, this.canvas.height / 2 + 30);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const livesEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = `Vidas: ${this.lives} | Fase ${this.phase}`;
    }

    endGame() {
        this.gameOver = true;
        this.onScore(this.score);
    }
}


class TermoGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;

        this.canvas.width = 400;
        this.canvas.height = 500;

        // Palavras portuguesas de 5 letras (similar ao term.ooo)
        this.words = [
            'ABRIR', 'ACASO', 'ACIMA', 'ADEUS', 'AGORA',
            'AINDA', 'ACHAR', 'ALUNO', 'AMBOS', 'AMIGO',
            'ANDAR', 'ANTES', 'APOIO', 'AREIA', 'ATUAL',
            'AVIAO', 'BAIXO', 'BANCO', 'BARCO', 'BEBER',
            'BEIJO', 'BELOS', 'BOLSA', 'BORDA', 'BRACO',
            'BREVE', 'BRUXA', 'CALMA', 'CALOR', 'CAMPO',
            'CANTO', 'CARNE', 'CARRO', 'CASAL', 'CAUSA',
            'CERTO', 'CHAVE', 'CHEFE', 'CHUVA', 'CLARO',
            'CLIMA', 'COBRA', 'COMUM', 'CONTA', 'COPIA',
            'CORPO', 'COISA', 'CORTE', 'CREME', 'CUSTO',
            'DADOS', 'DANCA', 'DENTE', 'DESDE', 'DEVER',
            'DIABO', 'DISCO', 'DOIDO', 'DOLAR', 'DRAMA',
            'DUPLA', 'DURAR', 'ECRAN', 'ELITE', 'ENTAO',
            'ENTRE', 'ENVIO', 'ERRAR', 'EXATO', 'EXTRA',
            'FALAR', 'FALTA', 'FATOS', 'FAVOR', 'FAZER',
            'FELIZ', 'FESTA', 'FICAR', 'FINAL', 'FIRME',
            'FLUXO', 'FOLHA', 'FORCA', 'FORMA', 'FORTE',
            'FRACO', 'FRASE', 'FUNDO', 'GENTE', 'GERAL',
            'GESTO', 'GLOBO', 'GOLPE', 'GOSTO', 'GRADE',
            'GRAMA', 'GRAVE', 'GREVE', 'GRUPO', 'HEROI',
            'HORAS', 'HOTEL', 'HUMOR', 'IDADE', 'IDEAL',
            'IDEIA', 'IGUAL', 'ILHAS', 'IMPAR', 'INDIO',
            'JANTA', 'JOGOS', 'JOVEM', 'JULHO', 'JUNHO',
            'JUSTO', 'LADOS', 'LAPIS', 'LARGO', 'LEGAL',
            'LEITE', 'LEVAR', 'LICAO', 'LIDAR', 'LIMPO',
            'LINHA', 'LIVRO', 'LOCAL', 'LOUCO', 'LUGAR',
            'MAGIA', 'MAIOR', 'MANCO', 'MANHA', 'MARCA',
            'MARIA', 'MASSA', 'MATAR', 'MEDIA', 'MEDIR',
            'MEIOS', 'MENOR', 'MENOS', 'MESMO', 'METAL',
            'MINHA', 'MISTO', 'MOEDA', 'MONTE', 'MORAL',
            'MORRO', 'MORTO', 'MOTOR', 'MUDOU', 'MUITO',
            'MUNDO', 'MUSEU', 'NAVIO', 'NEGRO', 'NERVO',
            'NOITE', 'NOIVA', 'NORTE', 'NOSSO', 'NOTAR',
            'NOVOS', 'NUNCA', 'OBRAS', 'OBVIO', 'OLHAR',
            'OLHOS', 'ORDEM', 'OUTRO', 'OUVIR', 'PADRE',
            'PAGAR', 'PAGOU', 'PAPEL', 'PARAR', 'PASSO',
            'PASTA', 'PATIO', 'PAUSA', 'PEDRA', 'PEGAR',
            'PEITO', 'PELOS', 'PENSO', 'PERDA', 'PERTO',
            'PIANO', 'PILHA', 'PINGA', 'PISTA', 'PLACA',
            'PLANO', 'PLENA', 'PODER', 'PONTO', 'PORTA',
            'POSSE', 'POSTO', 'PRAIA', 'PRATA', 'PRAZO',
            'PRECO', 'PRESA', 'PRIMA', 'PROVA', 'PULSO',
            'QUASE', 'QUEDA', 'QUERO', 'QUOTA', 'RADIO',
            'RAIVA', 'RAMOS', 'RAPAZ', 'RAZAO', 'REDOR',
            'REGRA', 'REINO', 'RELAX', 'RESTO', 'REZAR',
            'RITMO', 'RIVAL', 'ROCHA', 'ROLHA', 'ROSTO',
            'RUIDO', 'RURAL', 'SABER', 'SABOR', 'SAIDA',
            'SALDO', 'SALTO', 'SANTA', 'SANTO', 'SAUDE',
            'SECAR', 'SETOR', 'SEXTO', 'SIGLA', 'SILVA',
            'SOBRE', 'SOLAR', 'SOLTO', 'SONHO', 'SORTE',
            'SUAVE', 'SUBIR', 'SUCOS', 'SUJOS', 'SUPER',
            'SURDO', 'SURRA', 'TANGO', 'TANTO', 'TARDE',
            'TAXIS', 'TECTO', 'TEMAS', 'TEMPO', 'TENDA',
            'TENHO', 'TERRA', 'TESTE', 'TIGRE', 'TINHA',
            'TODAS', 'TOMAR', 'TOQUE', 'TOTAL', 'TRACO',
            'TRAJE', 'TROCA', 'TRONO', 'TROPA', 'TURNO',
            'UNIAO', 'UNICO', 'UNIDO', 'URSOS', 'USADO',
            'VAMOS', 'VAPOR', 'VENDA', 'VENTO', 'VERDE',
            'VERAO', 'VIDEO', 'VIGOR', 'VINDA', 'VINHO',
            'VIRAR', 'VISTA', 'VITAL', 'VIVER', 'VOCES',
            'VOGAL', 'VOLTA', 'VOTAR', 'VULTO', 'ZEBRA',
            'ZEROS', 'ZOMBI', 'ZORRA', 'AGUAS', 'AMPLO',
            'ASPAS', 'BALAO', 'BINGO', 'CACAU', 'CACHO',
            'CEDRO', 'CERCO', 'CHAMA', 'CHATO', 'CHEGA',
            'CIRCO', 'COLAR', 'COLMO', 'COMER', 'CONTO',
            'CORAR', 'CORES', 'COSMO', 'COXAS', 'COZER',
            'CRAVO', 'CRIME', 'CUECA', 'CULPA', 'DAMAS',
            'DEDOS', 'DIZER', 'DOBRO', 'DORES', 'DOTAR',
            'DURAS', 'DUROS', 'ERROS', 'ESTOU', 'FALAM',
            'FALSO', 'FAUNA', 'FEIRA', 'FERRO', 'FEUDO',
            'FIBRA', 'FILME', 'FLORA', 'FOCAR', 'FOCOS',
            'FOLIA', 'FONTE', 'FORUM', 'FROTA', 'FRUTA',
            'FUSAO', 'GALHO', 'GARRA', 'GATOS', 'GENIO',
            'GERAR', 'GIRAR', 'GIROS', 'GLOTE', 'GORRO',
            'GOTAS', 'GRACA', 'GRIPE', 'GUETO', 'HAVIA',
            'HASTE', 'HOMEM', 'HONRA', 'HORTA', 'JAULA',
            'JOGAR', 'LAMAS', 'LENTO', 'LETRA', 'LIMAO',
            'LINDA', 'LOJAS', 'LONGE', 'LOTAR', 'LOTES',
            'LUCRO', 'LUNAR', 'LUXOS', 'MANDO', 'MANGA',
            'MANTA', 'MARES', 'MICRO', 'MIOLO', 'MISSA',
            'MODAL', 'MODOS', 'MOSCA', 'MOVEM', 'MUDAR',
            'MULTA', 'NADAR', 'NATAS', 'NEXOS', 'NOBRE',
            'NOMES', 'NOTAS', 'NOVAS', 'NULOS', 'OBTER',
            'OCASO', 'OMEGA', 'OPTAR', 'OPCAO', 'OSSOS',
            'OUVEM', 'PACTO', 'PALAS', 'PALCO', 'PALHA',
            'PANOS', 'PAPAS', 'PAPOS', 'PARES', 'PASSE',
            'PAUTA', 'PAVIO', 'PECAS', 'PENAS', 'PESCA',
            'PESOS', 'PILAR', 'PINOS', 'PIPER', 'PIQUE',
            'PIRES', 'PLEBE', 'PLUMA', 'PODRE', 'POLAR',
            'POLIR', 'POLPA', 'POLVO', 'POMAR', 'PONDE',
            'PONTE', 'POUPA', 'PRECE', 'PREGO', 'PRETO',
            'PRIMO', 'PUDIM', 'PUROS', 'RAIOS', 'RALAR',
            'RAMPA', 'RANCO', 'RAROS', 'RASAR', 'RASTO',
            'RATOS', 'REGUA', 'RELER', 'RENDA', 'RENTE',
            'REPOR', 'REZAS', 'RISCO', 'RODAR', 'RODAS',
            'ROLAR', 'ROLOS', 'ROMBO', 'RONCO', 'ROUPA',
            'SABIA', 'SACRO', 'SAFOS', 'SAGAS', 'SAGUI',
            'SALMO', 'SAMPA', 'SANAR', 'SAQUE', 'SARAR',
            'SARNA', 'SECOS', 'SEDAS', 'SELOS', 'SEMEN',
            'SENHA', 'SENSO', 'SERAO', 'SERIO', 'SERVO',
            'SESTA', 'SIGMA', 'SINAL', 'SISMA', 'SISMO',
            'SOCAR', 'SODIO', 'SOFAS', 'SOLDA', 'SOLOS',
            'SOMAR', 'SONDA', 'SOPAS', 'SOPRO', 'SOROS',
            'SOVAR', 'TABUS', 'TACOS', 'TALAS', 'TALHO',
            'TANGA', 'TAPAR', 'TAPAS', 'TARSO', 'TASAR',
            'TELAS', 'TERCO', 'TERMA', 'TERNO', 'TETRA',
            'TEXTO', 'TIBIA', 'TIPOS', 'TIRAR', 'TIRAS',
            'TITAN', 'TOADA', 'TODOS', 'TOLDO', 'TONAL',
            'TONER', 'TOPIA', 'TOPOS', 'TORAX', 'TORPE',
            'TORRE', 'TORSO', 'TOSCO', 'TOSSE', 'TRAIR',
            'TRAMA', 'TREVO', 'TRIBO', 'TRICO', 'TRIFO',
            'TROCO', 'TROVA', 'TUBOS', 'TUMOR', 'TURVO',
            'TUTUS', 'UMBRO', 'UNTAR', 'URNAS', 'USUAL',
            'VACAS', 'VAGAS', 'VAGOS', 'VAIAR', 'VALER',
            'VALOR', 'VALSA', 'VARAL', 'VAZIO', 'VEIAS',
            'VELAR', 'VELHA', 'VELHO', 'VENAL', 'VENCE',
            'VERBA', 'VERBO', 'VESPA', 'VESTE', 'VIBES',
            'VIELA', 'VIGIA', 'VILAS', 'VIRAL', 'VIRIL',
            'VISAR', 'VISOR', 'VIUVA', 'VIUVO', 'VIVAR',
            'VOADO', 'VOGAR', 'VOGOU', 'VOTOS', 'VULGO'
        ];

        this.maxAttempts = 6;
        this.wordLength = 5;
        this.running = false;

        this.theme = this.getThemeColors();
        this.particles = [];
        this.reset();
        this.setupControls();
    }

    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        const isDark = document.documentElement.classList.contains('dark');
        const getVar = (name, fallback) => { const val = style.getPropertyValue(name).trim(); return val || fallback; };
        return {
            isDark,
            primary: getVar('--color-primary', '#3b82f6'),
            bg: isDark ? '#0f172a' : '#f8fafc',
            text: isDark ? '#f1f5f9' : '#1e293b',
            surface: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '#334155' : '#e2e8f0',
            success: '#22c55e',
            warning: '#eab308',
            absent: isDark ? '#475569' : '#94a3b8'
        };
    }

    reset() {
        this.theme = this.getThemeColors();
        // Selecionar palavra aleatória
        this.targetWord = this.words[Math.floor(Math.random() * this.words.length)].toUpperCase();
        this.attempts = [];
        this.currentAttempt = '';
        this.currentRow = 0;
        this.gameOver = false;
        this.won = false;
        this.score = 0;
        this.shake = false;
        this.shakeTimer = 0;
        this.revealIndex = -1;
        this.message = '';
        this.messageTimer = 0;

        this.updateScoreDisplay();
    }

    setupControls() {
        this.keyHandler = (e) => {
            if (this.gameOver || this.won) {
                if (e.key === ' ' || e.key === 'Enter') {
                    this.reset();
                    this.start();
                }
                return;
            }

            if (e.key === 'Backspace') {
                e.preventDefault();
                this.currentAttempt = this.currentAttempt.slice(0, -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.submitAttempt();
            } else if (/^[a-zA-ZçÇ]$/.test(e.key) && this.currentAttempt.length < this.wordLength) {
                // Tratar caracteres acentuados convertendo para letra base
                let letter = e.key.toUpperCase();
                // Normalizar caracteres acentuados
                letter = letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (letter === 'Ç') letter = 'C';
                this.currentAttempt += letter;
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    submitAttempt() {
        if (this.currentAttempt.length !== this.wordLength) {
            this.showMessage('Palavra incompleta!');
            this.shake = true;
            this.shakeTimer = 300;
            return;
        }

        const attempt = this.currentAttempt.toUpperCase();
        this.attempts.push(attempt);
        this.currentAttempt = '';
        this.currentRow++;

        // Iniciar animação de revelação
        this.revealIndex = 0;
        this.revealTimer = setInterval(() => {
            this.revealIndex++;
            if (this.revealIndex >= this.wordLength) {
                clearInterval(this.revealTimer);
                this.checkGameEnd(attempt);
            }
        }, 150);
    }

    checkGameEnd(attempt) {
        if (attempt === this.targetWord) {
            this.won = true;
            // Pontuação baseada no número de tentativas (menos = melhor)
            const baseScore = 1000;
            const attemptBonus = (this.maxAttempts - this.attempts.length + 1) * 200;
            this.score = baseScore + attemptBonus;
            this.onScore(this.score);

            // Verificar conquista de primeira tentativa
            if (this.attempts.length === 1 && this.manager) {
                this.manager.unlockAchievement('termo_master');
            }

            this.showMessage('Parabéns! 🎉');
        } else if (this.attempts.length >= this.maxAttempts) {
            this.gameOver = true;
            this.score = 0;
            this.onScore(this.score);
            this.showMessage(`Era: ${this.targetWord}`);
        }

        this.updateScoreDisplay();
    }

    showMessage(msg) {
        this.message = msg;
        this.messageTimer = 2000;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = Date.now();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.revealTimer) {
            clearInterval(this.revealTimer);
        }
        document.removeEventListener('keydown', this.keyHandler);
    }

    gameLoop() {
        if (!this.running) return;

        const now = Date.now();
        const delta = now - this.lastUpdate;

        // Atualizar temporizadores
        if (this.shake) {
            this.shakeTimer -= delta;
            if (this.shakeTimer <= 0) {
                this.shake = false;
            }
        }

        if (this.messageTimer > 0) {
            this.messageTimer -= delta;
        }

        this.draw();
        this.lastUpdate = now;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    getLetterStatus(letter, index, word) {
        const targetWord = this.targetWord;

        if (targetWord[index] === letter) {
            return 'correct'; // Verde - posição correta
        } else if (targetWord.includes(letter)) {
            // Verificar se esta letra já foi correspondida corretamente em outro lugar
            let letterCount = 0;
            let matchedCount = 0;

            for (let i = 0; i < targetWord.length; i++) {
                if (targetWord[i] === letter) letterCount++;
            }

            for (let i = 0; i < word.length; i++) {
                if (word[i] === letter && targetWord[i] === letter) {
                    matchedCount++;
                }
            }

            // Contar quantas vezes esta letra aparece antes da posição atual em posições erradas
            let wrongSpotCount = 0;
            for (let i = 0; i < index; i++) {
                if (word[i] === letter && targetWord[i] !== letter && targetWord.includes(letter)) {
                    wrongSpotCount++;
                }
            }

            if (wrongSpotCount < letterCount - matchedCount) {
                return 'present'; // Amarelo - posição errada
            }
        }

        return 'absent'; // Cinza - não está na palavra
    }

    draw() {
        // Fundo
        this.ctx.fillStyle = this.theme.bg;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Título
        this.ctx.fillStyle = this.theme.text;
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TERMO', this.canvas.width / 2, 35);

        // Subtítulo
        this.ctx.fillStyle = this.theme.isDark ? '#94a3b8' : '#64748b';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Adivinhe a palavra de 5 letras!', this.canvas.width / 2, 55);

        // Configurações da grade
        const tileSize = 56;
        const gap = 6;
        const gridWidth = this.wordLength * tileSize + (this.wordLength - 1) * gap;
        const gridHeight = this.maxAttempts * tileSize + (this.maxAttempts - 1) * gap;
        const startX = (this.canvas.width - gridWidth) / 2;
        const startY = 75;

        // Desenhar grade
        for (let row = 0; row < this.maxAttempts; row++) {
            const isCurrentRow = row === this.currentRow && !this.gameOver && !this.won;
            const isCompletedRow = row < this.attempts.length;
            const attempt = isCompletedRow ? this.attempts[row] : (isCurrentRow ? this.currentAttempt : '');

            // Efeito de tremor para linha atual
            let rowOffsetX = 0;
            if (isCurrentRow && this.shake) {
                rowOffsetX = Math.sin(Date.now() / 20) * 5;
            }

            for (let col = 0; col < this.wordLength; col++) {
                const x = startX + col * (tileSize + gap) + rowOffsetX;
                const y = startY + row * (tileSize + gap);
                const letter = attempt[col] || '';

                let bgColor, borderColor, textColor;

                if (isCompletedRow) {
                    // Linha revelada
                    const isRevealed = row < this.attempts.length - 1 || col <= this.revealIndex;

                    if (isRevealed) {
                        const status = this.getLetterStatus(letter, col, attempt);

                        if (status === 'correct') {
                            bgColor = this.theme.success;
                            borderColor = this.theme.success;
                            textColor = '#ffffff';
                        } else if (status === 'present') {
                            bgColor = this.theme.warning;
                            borderColor = this.theme.warning;
                            textColor = '#ffffff';
                        } else {
                            bgColor = this.theme.absent;
                            borderColor = this.theme.absent;
                            textColor = '#ffffff';
                        }
                    } else {
                        // Ainda não revelada
                        bgColor = this.theme.surface;
                        borderColor = this.theme.border;
                        textColor = this.theme.text;
                    }
                } else if (isCurrentRow && letter) {
                    // Linha atual com letra
                    bgColor = this.theme.surface;
                    borderColor = this.theme.isDark ? '#cbd5e1' : '#475569'; // Borda destacada
                    textColor = this.theme.text;
                } else {
                    // Célula vazia
                    bgColor = this.theme.surface;
                    borderColor = this.theme.border;
                    textColor = this.theme.text;
                }

                // Sombra para visual premium
                if (!isCompletedRow) {
                    this.ctx.shadowColor = 'rgba(0,0,0,0.05)';
                    this.ctx.shadowBlur = 4;
                    this.ctx.shadowOffsetY = 2;
                }

                // Desenhar fundo da célula
                this.ctx.fillStyle = bgColor;
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, tileSize, tileSize, 6);
                this.ctx.fill();
                this.ctx.shadowBlur = 0;
                this.ctx.shadowOffsetY = 0;

                // Desenhar borda da célula
                if (!isCompletedRow || !isCompletedRow) { // Sempre contornar, a menos que preenchido com cor sólida? 
                    // Células preenchidas ficam melhores sem borda ou com borda combinando
                    this.ctx.strokeStyle = borderColor;
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();
                }

                // Desenhar letra
                if (letter) {
                    this.ctx.fillStyle = textColor;
                    this.ctx.font = 'bold 28px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(letter, x + tileSize / 2, y + tileSize / 2 + 2);
                }
            }
        }

        // Desenhar texto auxiliar (sem teclado virtual)
        this.ctx.fillStyle = this.theme.isDark ? '#64748b' : '#94a3b8';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use o teclado para digitar • ENTER para confirmar • BACKSPACE para apagar', this.canvas.width / 2, startY + gridHeight + 25);

        // Desenhar mensagem
        if (this.messageTimer > 0) {
            const alpha = Math.min(1, this.messageTimer / 500);
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * alpha})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 100, startY + gridHeight / 2 - 20, 200, 40, 8);
            this.ctx.fill();

            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.message, this.canvas.width / 2, startY + gridHeight / 2);
        }

        // Sobreposição de game over / vitória
        if (this.gameOver || this.won) {
            const overlayGradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
            );
            overlayGradient.addColorStop(0, this.won ? 'rgba(34, 197, 94, 0.9)' : 'rgba(100, 116, 139, 0.9)');
            overlayGradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const time = Date.now() / 1000;

            // Tiles de letras animados
            const letters = this.won ? this.targetWord : 'TERMO';
            for (let i = 0; i < 5; i++) {
                const x = this.canvas.width / 2 - 100 + i * 42;
                const y = this.canvas.height / 2 - 80 + Math.sin(time * 3 + i * 0.5) * 10;

                this.ctx.fillStyle = this.won ? '#22c55e' : '#475569';
                this.ctx.beginPath();
                this.ctx.roundRect(x, y, 38, 38, 4);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 20px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(letters[i], x + 19, y + 26);
            }

            this.ctx.shadowColor = this.won ? '#22c55e' : '#64748b';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? '🎉 PARABÉNS!' : '😔 GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 90, this.canvas.height / 2 - 5, 180, 65, 12);
            this.ctx.fill();

            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#fff';
            if (this.won) {
                this.ctx.fillText(`Acertou em ${this.attempts.length} tentativa${this.attempts.length > 1 ? 's' : ''}!`, this.canvas.width / 2, this.canvas.height / 2 + 18);
            } else {
                this.ctx.fillText(`Palavra: ${this.targetWord}`, this.canvas.width / 2, this.canvas.height / 2 + 18);
            }
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(`${this.score} pontos`, this.canvas.width / 2, this.canvas.height / 2 + 42);

            const pulse = 0.5 + Math.sin(time * 4) * 0.2;
            this.ctx.fillStyle = `rgba(34, 197, 94, ${0.3 + pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 130, this.canvas.height / 2 + 70, 260, 30, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '13px Arial';
            this.ctx.fillText('⏎ ENTER ou ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 89);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const infoEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (infoEl) infoEl.textContent = `Tentativa ${Math.min(this.attempts.length + 1, this.maxAttempts)}/${this.maxAttempts}`;
    }
}

class TermoDuoGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;

        this.canvas.width = 650;
        this.canvas.height = 500;

        // Palavras portuguesas de 5 letras (similar ao term.ooo)
        this.words = [
            'ABRIR', 'ACASO', 'ACIMA', 'ADEUS', 'AGORA',
            'AINDA', 'ACHAR', 'ALUNO', 'AMBOS', 'AMIGO',
            'ANDAR', 'ANTES', 'APOIO', 'AREIA', 'ATUAL',
            'AVIAO', 'BAIXO', 'BANCO', 'BARCO', 'BEBER',
            'BEIJO', 'BELOS', 'BOLSA', 'BORDA', 'BRACO',
            'BREVE', 'BRUXA', 'CALMA', 'CALOR', 'CAMPO',
            'CANTO', 'CARNE', 'CARRO', 'CASAL', 'CAUSA',
            'CERTO', 'CHAVE', 'CHEFE', 'CHUVA', 'CLARO',
            'CLIMA', 'COBRA', 'COMUM', 'CONTA', 'COPIA',
            'CORPO', 'COISA', 'CORTE', 'CREME', 'CUSTO',
            'DADOS', 'DANCA', 'DENTE', 'DESDE', 'DEVER',
            'DIABO', 'DISCO', 'DOIDO', 'DOLAR', 'DRAMA',
            'DUPLA', 'DURAR', 'ECRAN', 'ELITE', 'ENTAO',
            'ENTRE', 'ENVIO', 'ERRAR', 'EXATO', 'EXTRA',
            'FALAR', 'FALTA', 'FATOS', 'FAVOR', 'FAZER',
            'FELIZ', 'FESTA', 'FICAR', 'FINAL', 'FIRME',
            'FLUXO', 'FOLHA', 'FORCA', 'FORMA', 'FORTE',
            'FRACO', 'FRASE', 'FUNDO', 'GENTE', 'GERAL',
            'GESTO', 'GLOBO', 'GOLPE', 'GOSTO', 'GRADE',
            'GRAMA', 'GRAVE', 'GREVE', 'GRUPO', 'HEROI',
            'HORAS', 'HOTEL', 'HUMOR', 'IDADE', 'IDEAL',
            'IDEIA', 'IGUAL', 'ILHAS', 'IMPAR', 'INDIO',
            'JANTA', 'JOGOS', 'JOVEM', 'JULHO', 'JUNHO',
            'JUSTO', 'LADOS', 'LAPIS', 'LARGO', 'LEGAL',
            'LEITE', 'LEVAR', 'LICAO', 'LIDAR', 'LIMPO',
            'LINHA', 'LIVRO', 'LOCAL', 'LOUCO', 'LUGAR',
            'MAGIA', 'MAIOR', 'MANCO', 'MANHA', 'MARCA',
            'MARIA', 'MASSA', 'MATAR', 'MEDIA', 'MEDIR',
            'MEIOS', 'MENOR', 'MENOS', 'MESMO', 'METAL',
            'MINHA', 'MISTO', 'MOEDA', 'MONTE', 'MORAL',
            'MORRO', 'MORTO', 'MOTOR', 'MUDOU', 'MUITO',
            'MUNDO', 'MUSEU', 'NAVIO', 'NEGRO', 'NERVO',
            'NOITE', 'NOIVA', 'NORTE', 'NOSSO', 'NOTAR',
            'NOVOS', 'NUNCA', 'OBRAS', 'OBVIO', 'OLHAR',
            'OLHOS', 'ORDEM', 'OUTRO', 'OUVIR', 'PADRE',
            'PAGAR', 'PAGOU', 'PAPEL', 'PARAR', 'PASSO',
            'PASTA', 'PATIO', 'PAUSA', 'PEDRA', 'PEGAR',
            'PEITO', 'PELOS', 'PENSO', 'PERDA', 'PERTO',
            'PIANO', 'PILHA', 'PINGA', 'PISTA', 'PLACA',
            'PLANO', 'PLENA', 'PODER', 'PONTO', 'PORTA',
            'POSSE', 'POSTO', 'PRAIA', 'PRATA', 'PRAZO',
            'PRECO', 'PRESA', 'PRIMA', 'PROVA', 'PULSO',
            'QUASE', 'QUEDA', 'QUERO', 'QUOTA', 'RADIO',
            'RAIVA', 'RAMOS', 'RAPAZ', 'RAZAO', 'REDOR',
            'REGRA', 'REINO', 'RELAX', 'RESTO', 'REZAR',
            'RITMO', 'RIVAL', 'ROCHA', 'ROLHA', 'ROSTO',
            'RUIDO', 'RURAL', 'SABER', 'SABOR', 'SAIDA',
            'SALDO', 'SALTO', 'SANTA', 'SANTO', 'SAUDE',
            'SECAR', 'SETOR', 'SEXTO', 'SIGLA', 'SILVA',
            'SOBRE', 'SOLAR', 'SOLTO', 'SONHO', 'SORTE',
            'SUAVE', 'SUBIR', 'SUCOS', 'SUJOS', 'SUPER',
            'SURDO', 'SURRA', 'TANGO', 'TANTO', 'TARDE',
            'TAXIS', 'TECTO', 'TEMAS', 'TEMPO', 'TENDA',
            'TENHO', 'TERRA', 'TESTE', 'TIGRE', 'TINHA',
            'TODAS', 'TOMAR', 'TOQUE', 'TOTAL', 'TRACO',
            'TRAJE', 'TROCA', 'TRONO', 'TROPA', 'TURNO',
            'UNIAO', 'UNICO', 'UNIDO', 'URSOS', 'USADO',
            'VAMOS', 'VAPOR', 'VENDA', 'VENTO', 'VERDE',
            'VERAO', 'VIDEO', 'VIGOR', 'VINDA', 'VINHO',
            'VIRAR', 'VISTA', 'VITAL', 'VIVER', 'VOCES',
            'VOGAL', 'VOLTA', 'VOTAR', 'VULTO', 'ZEBRA',
            'ZEROS', 'ZOMBI', 'ZORRA', 'AGUAS', 'AMPLO',
            'ASPAS', 'BALAO', 'BINGO', 'CACAU', 'CACHO',
            'CEDRO', 'CERCO', 'CHAMA', 'CHATO', 'CHEGA',
            'CIRCO', 'COLAR', 'COLMO', 'COMER', 'CONTO',
            'CORAR', 'CORES', 'COSMO', 'COXAS', 'COZER',
            'CRAVO', 'CRIME', 'CUECA', 'CULPA', 'DAMAS',
            'DEDOS', 'DIZER', 'DOBRO', 'DORES', 'DOTAR',
            'DURAS', 'DUROS', 'ERROS', 'ESTOU', 'EXAME',
            'FALAM', 'FALSO', 'FAUNA', 'FEIRA', 'FERRO',
            'FEUDO', 'FIBRA', 'FILME', 'FLORA', 'FOCAR',
            'FOCOS', 'FOLIA', 'FONTE', 'FORUM', 'FROTA',
            'FRUTA', 'FUSAO', 'GALHO', 'GARRA', 'GATOS',
            'GENIO', 'GERAR', 'GIRAR', 'GIROS', 'GLOTE',
            'GORRO', 'GOTAS', 'GRACA', 'GRIPE', 'GUETO',
            'HAVIA', 'HASTE', 'HOMEM', 'HONRA', 'HORTA',
            'JAULA', 'JOGAR', 'LAMAS', 'LENTO', 'LETRA',
            'LIMAO', 'LINDA', 'LOJAS', 'LONGE', 'LOTAR',
            'LOTES', 'LUCRO', 'LUNAR', 'LUXOS', 'MANDO',
            'MANGA', 'MANTA', 'MARES', 'MICRO', 'MIOLO',
            'MISSA', 'MODAL', 'MODOS', 'MOSCA', 'MOVEM',
            'MUDAR', 'MULTA', 'NADAR', 'NATAS', 'NEXOS',
            'NOBRE', 'NOMES', 'NOTAS', 'NOVAS', 'NULOS',
            'OBTER', 'OCASO', 'OMEGA', 'OPTAR', 'OPCAO',
            'OSSOS', 'OUVEM', 'PACTO', 'PALAS', 'PALCO',
            'PALHA', 'PANOS', 'PAPAS', 'PAPOS', 'PARES',
            'PASSE', 'PAUTA', 'PAVIO', 'PECAS', 'PENAS',
            'PESCA', 'PESOS', 'PILAR', 'PINOS', 'PIPER',
            'PIQUE', 'PIRES', 'PLEBE', 'PLUMA', 'PODRE',
            'POLAR', 'POLIR', 'POLPA', 'POLVO', 'POMAR',
            'PONDE', 'PONTE', 'POUPA', 'PRECE', 'PREGO',
            'PRETO', 'PRIMO', 'PUDIM', 'PUROS', 'RAIOS',
            'RALAR', 'RAMPA', 'RANCO', 'RAROS', 'RASAR',
            'RASTO', 'RATOS', 'REGUA', 'RELER', 'RENDA',
            'RENTE', 'REPOR', 'REZAS', 'RISCO', 'RODAR',
            'RODAS', 'ROLAR', 'ROLOS', 'ROMBO', 'RONCO',
            'ROUPA', 'SABIA', 'SACRO', 'SAFOS', 'SAGAS',
            'SAGUI', 'SALMO', 'SAMPA', 'SANAR', 'SAQUE',
            'SARAR', 'SARNA', 'SECOS', 'SEDAS', 'SELOS',
            'SEMEN', 'SENHA', 'SENSO', 'SERAO', 'SERIO',
            'SERVO', 'SESTA', 'SIGMA', 'SINAL', 'SISMA',
            'SISMO', 'SOCAR', 'SODIO', 'SOFAS', 'SOLDA',
            'SOLOS', 'SOMAR', 'SONDA', 'SOPAS', 'SOPRO',
            'SOROS', 'SOVAR', 'TABUS', 'TACOS', 'TALAS',
            'TALHO', 'TANGA', 'TAPAR', 'TAPAS', 'TARSO',
            'TASAR', 'TELAS', 'TERCO', 'TERMA', 'TERNO',
            'TETRA', 'TEXTO', 'TIBIA', 'TIPOS', 'TIRAR',
            'TIRAS', 'TITAN', 'TOADA', 'TODOS', 'TOLDO',
            'TONAL', 'TONER', 'TOPIA', 'TOPOS', 'TORAX',
            'TORPE', 'TORRE', 'TORSO', 'TOSCO', 'TOSSE',
            'TRAIR', 'TRAMA', 'TREVO', 'TRIBO', 'TRICO',
            'TRIFO', 'TROCO', 'TROVA', 'TUBOS', 'TUMOR',
            'TURVO', 'TUTUS', 'UMBRO', 'UNTAR', 'URNAS',
            'USUAL', 'VACAS', 'VAGAS', 'VAGOS', 'VAIAR',
            'VALER', 'VALOR', 'VALSA', 'VARAL', 'VAZIO',
            'VEIAS', 'VELAR', 'VELHA', 'VELHO', 'VENAL',
            'VENCE', 'VERBA', 'VERBO', 'VESPA', 'VESTE',
            'VIBES', 'VIELA', 'VIGIA', 'VILAS', 'VIRAL',
            'VIRIL', 'VISAR', 'VISOR', 'VIUVA', 'VIUVO',
            'VIVAR', 'VOADO', 'VOGAR', 'VOGOU', 'VOTOS',
            'VULGO', 'ALTAS', 'ALTAR', 'ALTOS', 'AMADO',
            'AMEBA', 'ANEXO', 'ANJOS', 'ARCOS', 'AREAS',
            'ARMAS', 'ATLAS', 'ATOMO', 'AUTOR', 'BASES',
            'BICHO', 'BOCAS', 'BOLAS', 'BOTES', 'BRAOS',
            'CABOS', 'CACOS', 'CAIXA', 'CALOS', 'CAMAS',
            'CAPIM', 'CASOS', 'CAVES', 'CELAS', 'CENAS',
            'CERCA', 'CHORO', 'CINCO', 'CISNE', 'CIVIL',
            'CLUBE', 'CODAS', 'COLAS', 'COMER', 'COPAS',
            'CREIA', 'CULTO', 'CURSO', 'DATAS', 'DEITA',
            'DELTA', 'DEPOR', 'DESSA', 'DIETA', 'DIGNO',
            'DITOS', 'DIVOS', 'DOCES', 'DOSSO', 'DOTES',
            'DUETO', 'DUNAS', 'DUQUE', 'EIXOS', 'ELITE',
            'ENTES', 'ERVAS', 'ESSES', 'ESTAR', 'EUROS',
            'FACAS', 'FADAS', 'FADAS', 'FASES', 'FAXAS',
            'FECHO', 'FEDOR', 'FEIAS', 'FEIOS', 'FEIXE',
            'FENDA', 'FETAL', 'FETOS', 'FIBRA', 'FILHA',
            'FILHO', 'FILOS', 'FITAS', 'FITAS', 'FIXAS',
            'FIXOS', 'FOBIA', 'FOCOS', 'FOGOS', 'FOICE',
            'FOSSE', 'FOTOS', 'FRACA', 'FREAR', 'FUGAS',
            'FUMAR', 'FUMOS', 'FURAS', 'FUROS', 'GAITA',
            'GALAO', 'GALOS', 'GAMAS', 'GANGA', 'GANHO',
            'GASES', 'GAZES', 'GELAM', 'GELAS', 'GELOS',
            'GEMAS', 'GENES', 'GERAL', 'GESSO', 'GOELA',
            'GOLAS', 'GOLES', 'GOMAS', 'GONGO', 'GOZAR',
            'GOZOS', 'GRACA', 'GRAPA', 'GRAOS', 'GRATA',
            'GRATO', 'GRILO', 'GRUTA', 'GUIAS', 'GUIAR'
        ];

        this.numWords = 2;
        this.maxAttempts = 7;
        this.wordLength = 5;
        this.running = false;

        this.theme = this.getThemeColors();
        this.reset();
        this.setupControls();
    }

    getThemeColors() {
        const style = getComputedStyle(document.documentElement);
        const isDark = document.documentElement.classList.contains('dark');
        const getVar = (name, fallback) => { const val = style.getPropertyValue(name).trim(); return val || fallback; };
        return {
            isDark,
            primary: getVar('--color-primary', '#3b82f6'),
            bg: isDark ? '#0f172a' : '#f8fafc',
            text: isDark ? '#f1f5f9' : '#1e293b',
            surface: isDark ? '#1e293b' : '#ffffff',
            border: isDark ? '#334155' : '#e2e8f0',
            success: '#22c55e',
            warning: '#eab308',
            absent: isDark ? '#475569' : '#94a3b8'
        };
    }

    reset() {
        this.theme = this.getThemeColors();
        // Selecionar palavras aleatórias (garantir que sejam diferentes)
        const shuffled = [...this.words].sort(() => Math.random() - 0.5);
        this.targetWords = shuffled.slice(0, this.numWords).map(w => w.toUpperCase());
        this.solvedWords = new Array(this.numWords).fill(false);
        this.attempts = [];
        this.currentAttempt = '';
        this.gameOver = false;
        this.won = false;
        this.score = 0;
        this.shake = false;
        this.shakeTimer = 0;
        this.revealIndex = -1;
        this.message = '';
        this.messageTimer = 0;

        this.updateScoreDisplay();
    }

    setupControls() {
        this.keyHandler = (e) => {
            if (this.gameOver || this.won) {
                if (e.key === ' ' || e.key === 'Enter') {
                    this.reset();
                    this.start();
                }
                return;
            }

            if (e.key === 'Backspace') {
                e.preventDefault();
                this.currentAttempt = this.currentAttempt.slice(0, -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.submitAttempt();
            } else if (/^[a-zA-ZçÇ]$/.test(e.key) && this.currentAttempt.length < this.wordLength) {
                let letter = e.key.toUpperCase();
                letter = letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (letter === 'Ç') letter = 'C';
                this.currentAttempt += letter;
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    submitAttempt() {
        if (this.currentAttempt.length !== this.wordLength) {
            this.showMessage('Palavra incompleta!');
            this.shake = true;
            this.shakeTimer = 300;
            return;
        }

        const attempt = this.currentAttempt.toUpperCase();
        this.attempts.push(attempt);
        this.currentAttempt = '';

        // Verificar se alguma palavra foi resolvida
        for (let i = 0; i < this.numWords; i++) {
            if (!this.solvedWords[i] && attempt === this.targetWords[i]) {
                this.solvedWords[i] = true;
            }
        }

        // Iniciar animação de revelação
        this.revealIndex = 0;
        this.revealTimer = setInterval(() => {
            this.revealIndex++;
            if (this.revealIndex >= this.wordLength) {
                clearInterval(this.revealTimer);
                this.checkGameEnd();
            }
        }, 100);
    }

    checkGameEnd() {
        const allSolved = this.solvedWords.every(s => s);

        if (allSolved) {
            this.won = true;
            const baseScore = 2000;
            const attemptBonus = (this.maxAttempts - this.attempts.length + 1) * 300;
            this.score = baseScore + attemptBonus;
            this.onScore(this.score);
            this.showMessage('Parabéns! 🎉');
        } else if (this.attempts.length >= this.maxAttempts) {
            this.gameOver = true;
            this.score = 0;
            this.onScore(this.score);
            const unsolved = this.targetWords.filter((_, i) => !this.solvedWords[i]);
            this.showMessage(`Faltou: ${unsolved.join(', ')}`);
        }

        this.updateScoreDisplay();
    }

    showMessage(msg) {
        this.message = msg;
        this.messageTimer = 2000;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = Date.now();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.revealTimer) {
            clearInterval(this.revealTimer);
        }
        document.removeEventListener('keydown', this.keyHandler);
    }

    gameLoop() {
        if (!this.running) return;

        const now = Date.now();
        const delta = now - this.lastUpdate;

        if (this.shake) {
            this.shakeTimer -= delta;
            if (this.shakeTimer <= 0) this.shake = false;
        }

        if (this.messageTimer > 0) this.messageTimer -= delta;

        this.draw();
        this.lastUpdate = now;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    getLetterStatus(letter, index, attempt, targetWord) {
        if (targetWord[index] === letter) {
            return 'correct';
        } else if (targetWord.includes(letter)) {
            let letterCount = 0;
            let matchedCount = 0;

            for (let i = 0; i < targetWord.length; i++) {
                if (targetWord[i] === letter) letterCount++;
            }

            for (let i = 0; i < attempt.length; i++) {
                if (attempt[i] === letter && targetWord[i] === letter) {
                    matchedCount++;
                }
            }

            let wrongSpotCount = 0;
            for (let i = 0; i < index; i++) {
                if (attempt[i] === letter && targetWord[i] !== letter && targetWord.includes(letter)) {
                    wrongSpotCount++;
                }
            }

            if (wrongSpotCount < letterCount - matchedCount) {
                return 'present';
            }
        }

        return 'absent';
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');

        // Fundo
        this.ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Título
        this.ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        this.ctx.font = 'bold 24px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TERMO DUETO', this.canvas.width / 2, 35);

        // Subtítulo
        this.ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('Adivinhe 2 palavras aleatórias ao mesmo tempo!', this.canvas.width / 2, 55);

        // Configurações da grade
        const tileSize = 48;
        const gap = 5;
        const gridWidth = this.wordLength * tileSize + (this.wordLength - 1) * gap;
        const gridHeight = this.maxAttempts * tileSize + (this.maxAttempts - 1) * gap;
        const gridSpacing = 40;
        const totalWidth = this.numWords * gridWidth + (this.numWords - 1) * gridSpacing;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = 70;

        // Desenhar grades para cada palavra
        for (let wordIdx = 0; wordIdx < this.numWords; wordIdx++) {
            const gridStartX = startX + wordIdx * (gridWidth + gridSpacing);
            const targetWord = this.targetWords[wordIdx];
            const isSolved = this.solvedWords[wordIdx];

            // Desenhar indicador da palavra
            this.ctx.fillStyle = isSolved ? '#22c55e' : (isDark ? '#64748b' : '#94a3b8');
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(isSolved ? '✓' : `${wordIdx + 1}`, gridStartX + gridWidth / 2, startY - 10);

            for (let row = 0; row < this.maxAttempts; row++) {
                const isCurrentRow = row === this.attempts.length && !this.gameOver && !this.won;
                const isCompletedRow = row < this.attempts.length;
                const attempt = isCompletedRow ? this.attempts[row] : (isCurrentRow ? this.currentAttempt : '');

                let rowOffsetX = 0;
                if (isCurrentRow && this.shake) {
                    rowOffsetX = Math.sin(Date.now() / 20) * 5;
                }

                for (let col = 0; col < this.wordLength; col++) {
                    const x = gridStartX + col * (tileSize + gap) + rowOffsetX;
                    const y = startY + row * (tileSize + gap);
                    const letter = attempt[col] || '';

                    let bgColor, borderColor, textColor;

                    if (isSolved && row >= this.attempts.findIndex(a => a === targetWord)) {
                        // Palavra resolvida, mostrar tudo verde a partir da linha da solução
                        if (row === this.attempts.findIndex(a => a === targetWord)) {
                            bgColor = '#22c55e';
                            borderColor = '#16a34a';
                            textColor = '#ffffff';
                        } else {
                            bgColor = isDark ? '#1e293b' : '#ffffff';
                            borderColor = isDark ? '#334155' : '#e2e8f0';
                            textColor = isDark ? '#e2e8f0' : '#1e293b';
                        }
                    } else if (isCompletedRow) {
                        const isRevealed = row < this.attempts.length - 1 || col <= this.revealIndex;

                        if (isRevealed) {
                            const status = this.getLetterStatus(letter, col, attempt, targetWord);

                            if (status === 'correct') {
                                bgColor = '#22c55e';
                                borderColor = '#16a34a';
                            } else if (status === 'present') {
                                bgColor = '#eab308';
                                borderColor = '#ca8a04';
                            } else {
                                bgColor = isDark ? '#475569' : '#94a3b8';
                                borderColor = isDark ? '#334155' : '#64748b';
                            }
                            textColor = '#ffffff';
                        } else {
                            bgColor = isDark ? '#1e293b' : '#ffffff';
                            borderColor = isDark ? '#475569' : '#cbd5e1';
                            textColor = isDark ? '#e2e8f0' : '#1e293b';
                        }
                    } else if (isCurrentRow && letter) {
                        bgColor = isDark ? '#1e293b' : '#ffffff';
                        borderColor = isDark ? '#64748b' : '#94a3b8';
                        textColor = isDark ? '#e2e8f0' : '#1e293b';
                    } else {
                        bgColor = isDark ? '#1e293b' : '#ffffff';
                        borderColor = isDark ? '#334155' : '#e2e8f0';
                        textColor = isDark ? '#e2e8f0' : '#1e293b';
                    }

                    this.ctx.fillStyle = bgColor;
                    this.ctx.beginPath();
                    this.ctx.roundRect(x, y, tileSize, tileSize, 4);
                    this.ctx.fill();

                    this.ctx.strokeStyle = borderColor;
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();

                    if (letter) {
                        this.ctx.fillStyle = textColor;
                        this.ctx.font = 'bold 22px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(letter, x + tileSize / 2, y + tileSize / 2 + 2);
                    }
                }
            }
        }

        // Desenhar texto auxiliar
        this.ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use o teclado para digitar • ENTER para confirmar • BACKSPACE para apagar', this.canvas.width / 2, startY + gridHeight + 25);

        // Desenhar mensagem
        if (this.messageTimer > 0) {
            const alpha = Math.min(1, this.messageTimer / 500);
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * alpha})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 120, startY + gridHeight / 2 - 20, 240, 40, 8);
            this.ctx.fill();

            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.message, this.canvas.width / 2, startY + gridHeight / 2);
        }

        // Sobreposição de game over / vitória
        if (this.gameOver || this.won) {
            const overlayGradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
            );
            overlayGradient.addColorStop(0, this.won ? 'rgba(34, 197, 94, 0.9)' : 'rgba(100, 116, 139, 0.9)');
            overlayGradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const time = Date.now() / 1000;

            // Tiles duo animados
            for (let i = 0; i < 2; i++) {
                for (let j = 0; j < 5; j++) {
                    const x = this.canvas.width / 2 - 150 + i * 180 + j * 30;
                    const y = this.canvas.height / 2 - 100 + Math.sin(time * 2 + i + j) * 5;
                    this.ctx.fillStyle = this.won ? '#22c55e' : '#475569';
                    this.ctx.globalAlpha = 0.6;
                    this.ctx.beginPath();
                    this.ctx.roundRect(x, y, 26, 26, 3);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1;
                }
            }

            this.ctx.shadowColor = this.won ? '#22c55e' : '#64748b';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? '🎉 PARABÉNS!' : '😔 GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 35);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 110, this.canvas.height / 2 - 10, 220, 70, 12);
            this.ctx.fill();

            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#fff';
            if (this.won) {
                this.ctx.fillText(`Acertou em ${this.attempts.length} tentativas!`, this.canvas.width / 2, this.canvas.height / 2 + 15);
            } else {
                const unsolved = this.targetWords.filter((_, i) => !this.solvedWords[i]);
                this.ctx.fillText(`Palavras: ${unsolved.join(', ')}`, this.canvas.width / 2, this.canvas.height / 2 + 15);
            }
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(`${this.score} pontos`, this.canvas.width / 2, this.canvas.height / 2 + 40);

            const pulse = 0.5 + Math.sin(time * 4) * 0.2;
            this.ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 130, this.canvas.height / 2 + 70, 260, 30, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '13px Arial';
            this.ctx.fillText('⏎ ENTER ou ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 89);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const infoEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        const solved = this.solvedWords.filter(s => s).length;
        if (infoEl) infoEl.textContent = `Tentativa ${Math.min(this.attempts.length + 1, this.maxAttempts)}/${this.maxAttempts} | ${solved}/${this.numWords}`;
    }
}

class TermoQuartetGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;

        this.canvas.width = 700;
        this.canvas.height = 600;

        // Palavras portuguesas de 4 letras para modo Quarteto
        this.words = [
            'AMOR', 'ALMA', 'AGUA', 'ALTO', 'AZUL', 'BOLA', 'BOCA', 'BELO', 'BEBE', 'BICO',
            'CADA', 'CASA', 'CARA', 'CAFE', 'CAMA', 'CEDO', 'CEIA', 'CERA', 'CIMA', 'COLA',
            'DADO', 'DATA', 'DEDO', 'DELE', 'DEUS', 'DIAS', 'DICA', 'DOCE', 'DOIS', 'DONO',
            'ESSA', 'ESSE', 'ESTA', 'ESTE', 'ELAS', 'ELES', 'FACA', 'FALA', 'FAMA', 'FASE',
            'FATO', 'FEIA', 'FEIO', 'FENO', 'FERA', 'FILA', 'FOGO', 'FOME', 'FORA', 'FOTO',
            'GALO', 'GATA', 'GATO', 'GELO', 'GIRA', 'GOLA', 'GOTA', 'HORA', 'HOJE', 'ILHA',
            'ISSO', 'JOGO', 'JOIA', 'LADO', 'LAGO', 'LATA', 'LEAO', 'LEVE', 'LIDO', 'LIMA',
            'LISA', 'LISO', 'LOBO', 'LOJA', 'LOGO', 'LOJA', 'LOTE', 'LUCA', 'LUPA', 'LUXO',
            'MACA', 'MAGO', 'MAIO', 'MALA', 'MAPA', 'MAIS', 'MATO', 'MEDO', 'MEIO', 'MESA',
            'META', 'MICO', 'MINA', 'MODO', 'MOLE', 'MOTO', 'MUDO', 'MURO', 'NADA', 'NATA',
            'NAVE', 'NEGO', 'NEVE', 'NETO', 'NIDO', 'NOME', 'NOTA', 'NOVA', 'NOVO', 'NUCA',
            'OBRA', 'OITO', 'ONDE', 'ONDA', 'OURO', 'OSSO', 'OUVI', 'PACO', 'PAGO', 'PAIS',
            'PANO', 'PARA', 'PARE', 'PATA', 'PATO', 'PECA', 'PELE', 'PELO', 'PENA', 'PESO',
            'PICO', 'PIPA', 'PISO', 'PODE', 'POLO', 'POMO', 'PORO', 'POSE', 'POTE', 'PRUA',
            'RABO', 'RAMO', 'RATO', 'RAIO', 'REAL', 'REDE', 'RELA', 'REMO', 'RICA', 'RICO',
            'RIMA', 'RIOS', 'RISO', 'ROBO', 'RODA', 'ROLA', 'ROSA', 'ROTA', 'RUDE', 'RUIM',
            'SACO', 'SALA', 'SACO', 'SAIA', 'SAIR', 'SEDE', 'SELO', 'SETA', 'SETE', 'SINO',
            'SOBE', 'SOLO', 'SOMA', 'SONO', 'SOPA', 'SUCO', 'SUJO', 'TACA', 'TALO', 'TAPA',
            'TATU', 'TAXA', 'TEIA', 'TELA', 'TEMA', 'TETO', 'TIPO', 'TOCA', 'TODO', 'TOMA',
            'TOPO', 'TUDO', 'TUBO', 'URNA', 'USAR', 'VACA', 'VAGA', 'VALE', 'VASO', 'VEIA',
            'VELA', 'VEJO', 'VIDA', 'VIDE', 'VILA', 'VIRA', 'VIVE', 'VIVO', 'VOCE', 'VOTO',
            'XALE', 'ZERO', 'ZONA', 'ARCO', 'ARTE', 'ASNO', 'BALA', 'BECO', 'BIBI', 'BIFE',
            'CABO', 'CACO', 'CALO', 'CANO', 'CAPO', 'CARO', 'CASO', 'CAVA', 'CELA', 'CEPO',
            'CHAO', 'COCO', 'COLO', 'COMO', 'CONE', 'COPO', 'CORO', 'COTA', 'COVA', 'COXA',
            'CUBO', 'DAMA', 'DANO', 'DITA', 'DITO', 'DIVA', 'DOCA', 'DOMO', 'DOSE', 'DOTE',
            'DURO', 'EIXO', 'ERRA', 'FADO', 'FARO', 'FAVA', 'FICO', 'FIGO', 'FINA', 'FINO',
            'FITA', 'FOCO', 'FURO', 'GADO', 'GALO', 'GANA', 'GAZE', 'GENE', 'GIRO', 'GOLE',
            'GOMA', 'GOZO', 'GUIA', 'HINO', 'IOGA', 'JADE', 'JATO', 'JUIZ', 'JURA', 'JURO',
            'LACA', 'LACO', 'LAMA', 'LAPA', 'LAVA', 'LEAL', 'LEIA', 'LEME', 'LENO', 'LERO',
            'LEVA', 'LIDE', 'LIMO', 'LIRA', 'LITE', 'LOCA', 'LONA', 'LOTE', 'LOTO', 'LOUA'
        ];

        this.numWords = 4;
        this.maxAttempts = 9;
        this.wordLength = 4;
        this.running = false;

        this.reset();
        this.setupControls();
    }

    reset() {
        const shuffled = [...this.words].sort(() => Math.random() - 0.5);
        this.targetWords = shuffled.slice(0, this.numWords).map(w => w.toUpperCase());
        this.solvedWords = new Array(this.numWords).fill(false);
        this.attempts = [];
        this.currentAttempt = '';
        this.gameOver = false;
        this.won = false;
        this.score = 0;
        this.shake = false;
        this.shakeTimer = 0;
        this.revealIndex = -1;
        this.message = '';
        this.messageTimer = 0;

        this.updateScoreDisplay();
    }

    setupControls() {
        this.keyHandler = (e) => {
            if (this.gameOver || this.won) {
                if (e.key === ' ' || e.key === 'Enter') {
                    this.reset();
                    this.start();
                }
                return;
            }

            if (e.key === 'Backspace') {
                e.preventDefault();
                this.currentAttempt = this.currentAttempt.slice(0, -1);
            } else if (e.key === 'Enter') {
                e.preventDefault();
                this.submitAttempt();
            } else if (/^[a-zA-ZçÇ]$/.test(e.key) && this.currentAttempt.length < this.wordLength) {
                let letter = e.key.toUpperCase();
                letter = letter.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                if (letter === 'Ç') letter = 'C';
                this.currentAttempt += letter;
            }
        };

        document.addEventListener('keydown', this.keyHandler);
    }

    submitAttempt() {
        if (this.currentAttempt.length !== this.wordLength) {
            this.showMessage('Palavra incompleta!');
            this.shake = true;
            this.shakeTimer = 300;
            return;
        }

        const attempt = this.currentAttempt.toUpperCase();
        this.attempts.push(attempt);
        this.currentAttempt = '';

        for (let i = 0; i < this.numWords; i++) {
            if (!this.solvedWords[i] && attempt === this.targetWords[i]) {
                this.solvedWords[i] = true;
            }
        }

        this.revealIndex = 0;
        this.revealTimer = setInterval(() => {
            this.revealIndex++;
            if (this.revealIndex >= this.wordLength) {
                clearInterval(this.revealTimer);
                this.checkGameEnd();
            }
        }, 80);
    }

    checkGameEnd() {
        const allSolved = this.solvedWords.every(s => s);

        if (allSolved) {
            this.won = true;
            const baseScore = 4000;
            const attemptBonus = (this.maxAttempts - this.attempts.length + 1) * 400;
            this.score = baseScore + attemptBonus;
            this.onScore(this.score);
            this.showMessage('Parabéns! 🎉');
        } else if (this.attempts.length >= this.maxAttempts) {
            this.gameOver = true;
            this.score = 0;
            this.onScore(this.score);
            const unsolved = this.targetWords.filter((_, i) => !this.solvedWords[i]);
            this.showMessage(`Faltou: ${unsolved.slice(0, 2).join(', ')}...`);
        }

        this.updateScoreDisplay();
    }

    showMessage(msg) {
        this.message = msg;
        this.messageTimer = 2000;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastUpdate = Date.now();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        if (this.revealTimer) {
            clearInterval(this.revealTimer);
        }
        document.removeEventListener('keydown', this.keyHandler);
    }

    gameLoop() {
        if (!this.running) return;

        const now = Date.now();
        const delta = now - this.lastUpdate;

        if (this.shake) {
            this.shakeTimer -= delta;
            if (this.shakeTimer <= 0) this.shake = false;
        }

        if (this.messageTimer > 0) this.messageTimer -= delta;

        this.draw();
        this.lastUpdate = now;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    getLetterStatus(letter, index, attempt, targetWord) {
        if (targetWord[index] === letter) {
            return 'correct';
        } else if (targetWord.includes(letter)) {
            let letterCount = 0;
            let matchedCount = 0;

            for (let i = 0; i < targetWord.length; i++) {
                if (targetWord[i] === letter) letterCount++;
            }

            for (let i = 0; i < attempt.length; i++) {
                if (attempt[i] === letter && targetWord[i] === letter) {
                    matchedCount++;
                }
            }

            let wrongSpotCount = 0;
            for (let i = 0; i < index; i++) {
                if (attempt[i] === letter && targetWord[i] !== letter && targetWord.includes(letter)) {
                    wrongSpotCount++;
                }
            }

            if (wrongSpotCount < letterCount - matchedCount) {
                return 'present';
            }
        }

        return 'absent';
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');

        // Fundo
        this.ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Título
        this.ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        this.ctx.font = 'bold 22px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('TERMO QUARTETO', this.canvas.width / 2, 30);

        // Subtítulo
        this.ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        this.ctx.font = '11px Arial';
        this.ctx.fillText('Adivinhe 4 palavras aleatórias ao mesmo tempo!', this.canvas.width / 2, 48);

        // Configurações da grade - layout 2x2 com todas as tentativas visíveis em cada grade
        const tileSize = 28;
        const gap = 3;
        const gridWidth = this.wordLength * tileSize + (this.wordLength - 1) * gap;
        const gridHeight = this.maxAttempts * tileSize + (this.maxAttempts - 1) * gap;
        const gridSpacingX = 20;
        const gridSpacingY = 15;
        const totalWidth = 2 * gridWidth + gridSpacingX;
        const totalHeight = 2 * gridHeight + gridSpacingY;
        const startX = (this.canvas.width - totalWidth) / 2;
        const startY = 55;

        // Desenhar grades em layout 2x2 - cada grade mostra todas as tentativas da sua palavra
        for (let wordIdx = 0; wordIdx < this.numWords; wordIdx++) {
            const gridCol = wordIdx % 2;
            const gridRow = Math.floor(wordIdx / 2);
            const gridStartX = startX + gridCol * (gridWidth + gridSpacingX);
            const gridStartY = startY + gridRow * (gridHeight + gridSpacingY);
            const targetWord = this.targetWords[wordIdx];
            const isSolved = this.solvedWords[wordIdx];

            // Mostrar todas as tentativas em cada grade
            for (let row = 0; row < this.maxAttempts; row++) {
                const isCurrentRow = row === this.attempts.length && !this.gameOver && !this.won;
                const isCompletedRow = row < this.attempts.length;
                const attempt = isCompletedRow ? this.attempts[row] : (isCurrentRow ? this.currentAttempt : '');

                let rowOffsetX = 0;
                if (isCurrentRow && this.shake) {
                    rowOffsetX = Math.sin(Date.now() / 20) * 3;
                }

                for (let col = 0; col < this.wordLength; col++) {
                    const x = gridStartX + col * (tileSize + gap) + rowOffsetX;
                    const y = gridStartY + row * (tileSize + gap);
                    const letter = attempt[col] || '';

                    let bgColor, borderColor, textColor;

                    if (isSolved && row >= this.attempts.findIndex(a => a === targetWord)) {
                        if (row === this.attempts.findIndex(a => a === targetWord)) {
                            bgColor = '#22c55e';
                            borderColor = '#16a34a';
                            textColor = '#ffffff';
                        } else {
                            bgColor = isDark ? '#1e293b' : '#ffffff';
                            borderColor = isDark ? '#334155' : '#e2e8f0';
                            textColor = isDark ? '#e2e8f0' : '#1e293b';
                        }
                    } else if (isCompletedRow) {
                        const isRevealed = row < this.attempts.length - 1 || col <= this.revealIndex;

                        if (isRevealed) {
                            const status = this.getLetterStatus(letter, col, attempt, targetWord);

                            if (status === 'correct') {
                                bgColor = '#22c55e';
                                borderColor = '#16a34a';
                            } else if (status === 'present') {
                                bgColor = '#eab308';
                                borderColor = '#ca8a04';
                            } else {
                                bgColor = isDark ? '#475569' : '#94a3b8';
                                borderColor = isDark ? '#334155' : '#64748b';
                            }
                            textColor = '#ffffff';
                        } else {
                            bgColor = isDark ? '#1e293b' : '#ffffff';
                            borderColor = isDark ? '#475569' : '#cbd5e1';
                            textColor = isDark ? '#e2e8f0' : '#1e293b';
                        }
                    } else if (isCurrentRow && letter) {
                        bgColor = isDark ? '#1e293b' : '#ffffff';
                        borderColor = isDark ? '#64748b' : '#94a3b8';
                        textColor = isDark ? '#e2e8f0' : '#1e293b';
                    } else {
                        bgColor = isDark ? '#1e293b' : '#ffffff';
                        borderColor = isDark ? '#334155' : '#e2e8f0';
                        textColor = isDark ? '#e2e8f0' : '#1e293b';
                    }

                    this.ctx.fillStyle = bgColor;
                    this.ctx.beginPath();
                    this.ctx.roundRect(x, y, tileSize, tileSize, 3);
                    this.ctx.fill();

                    this.ctx.strokeStyle = borderColor;
                    this.ctx.lineWidth = 2;
                    this.ctx.stroke();

                    if (letter) {
                        this.ctx.fillStyle = textColor;
                        this.ctx.font = 'bold 14px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(letter, x + tileSize / 2, y + tileSize / 2 + 1);
                    }
                }
            }

            // Desenhar indicador de resolvido
            if (isSolved) {
                this.ctx.fillStyle = '#22c55e';
                this.ctx.font = 'bold 12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('✓', gridStartX + gridWidth + 8, gridStartY + gridHeight / 2);
            }
        }

        // Desenhar texto auxiliar na parte inferior
        this.ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
        this.ctx.font = '10px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use o teclado para digitar • ENTER para confirmar • BACKSPACE para apagar', this.canvas.width / 2, this.canvas.height - 10);

        // Desenhar mensagem
        if (this.messageTimer > 0) {
            const alpha = Math.min(1, this.messageTimer / 500);
            this.ctx.fillStyle = `rgba(0, 0, 0, ${0.8 * alpha})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 120, this.canvas.height / 2 - 20, 240, 40, 8);
            this.ctx.fill();

            this.ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
            this.ctx.font = 'bold 14px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(this.message, this.canvas.width / 2, this.canvas.height / 2);
        }

        // Sobreposição de game over / vitória
        if (this.gameOver || this.won) {
            const overlayGradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
            );
            overlayGradient.addColorStop(0, this.won ? 'rgba(34, 197, 94, 0.9)' : 'rgba(100, 116, 139, 0.9)');
            overlayGradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const time = Date.now() / 1000;

            // Padrão animado de grade quarteto
            for (let i = 0; i < 2; i++) {
                for (let k = 0; k < 2; k++) {
                    for (let j = 0; j < 4; j++) {
                        const x = this.canvas.width / 2 - 110 + k * 120 + j * 25;
                        const y = this.canvas.height / 2 - 110 + i * 50 + Math.sin(time * 2 + i + k + j) * 4;
                        this.ctx.fillStyle = this.won ? '#22c55e' : '#475569';
                        this.ctx.globalAlpha = 0.5;
                        this.ctx.beginPath();
                        this.ctx.roundRect(x, y, 22, 22, 3);
                        this.ctx.fill();
                        this.ctx.globalAlpha = 1;
                    }
                }
            }

            this.ctx.shadowColor = this.won ? '#22c55e' : '#64748b';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 26px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? '🎉 PARABÉNS!' : '😔 GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 120, this.canvas.height / 2 - 5, 240, 65, 12);
            this.ctx.fill();

            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#fff';
            if (this.won) {
                this.ctx.fillText(`Acertou em ${this.attempts.length} tentativas!`, this.canvas.width / 2, this.canvas.height / 2 + 18);
            } else {
                const unsolved = this.targetWords.filter((_, i) => !this.solvedWords[i]);
                this.ctx.fillText(`Palavras: ${unsolved.slice(0, 3).join(', ')}`, this.canvas.width / 2, this.canvas.height / 2 + 18);
            }
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.font = '13px Arial';
            this.ctx.fillText(`${this.score} pontos`, this.canvas.width / 2, this.canvas.height / 2 + 40);

            const pulse = 0.5 + Math.sin(time * 4) * 0.2;
            this.ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 130, this.canvas.height / 2 + 70, 260, 28, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('⏎ ENTER ou ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 88);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const infoEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        const solved = this.solvedWords.filter(s => s).length;
        if (infoEl) infoEl.textContent = `Tentativa ${Math.min(this.attempts.length + 1, this.maxAttempts)}/${this.maxAttempts} | ${solved}/${this.numWords}`;
    }
}

class WordSearchGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;

        this.canvas.width = 650;
        this.canvas.height = 500;

        this.words = [
            ['BICICLETA', 'PEDAL', 'RODA', 'FREIO', 'GUIDAO'],
            ['CAPACETE', 'CORRENTE', 'SELIM', 'PNEU', 'RAIO'],
            ['CICLISTA', 'GARFO', 'CUBO', 'ARO', 'MESA'],
            ['QUADRO', 'CAMBIO', 'MANOPLA', 'BANCO', 'CABO']
        ];

        this.gridSize = 12;
        this.cellSize = 32;
        this.running = false;
        this.level = 0;
        this.score = 0;

        this.reset();
        this.setupControls();
    }

    reset() {
        this.grid = [];
        this.targetWords = this.words[this.level % this.words.length];
        this.foundWords = [];
        this.selection = { start: null, end: null };
        this.selecting = false;
        this.gameOver = false;
        this.won = false;

        for (let i = 0; i < this.gridSize; i++) {
            this.grid[i] = [];
            for (let j = 0; j < this.gridSize; j++) {
                this.grid[i][j] = '';
            }
        }

        this.placeWords();
        this.fillEmptyCells();
        this.updateScoreDisplay();
    }

    placeWords() {
        const directions = [
            { dx: 1, dy: 0 },
            { dx: 0, dy: 1 },
            { dx: 1, dy: 1 },
            { dx: 1, dy: -1 }
        ];

        this.wordPositions = [];

        for (const word of this.targetWords) {
            let placed = false;
            let attempts = 0;

            while (!placed && attempts < 100) {
                const dir = directions[Math.floor(Math.random() * directions.length)];
                const maxX = this.gridSize - (dir.dx > 0 ? word.length : 1);
                const maxY = this.gridSize - (dir.dy > 0 ? word.length : 1);
                const minY = dir.dy < 0 ? word.length - 1 : 0;

                const startX = Math.floor(Math.random() * (maxX + 1));
                const startY = minY + Math.floor(Math.random() * (maxY - minY + 1));

                let canPlace = true;
                for (let i = 0; i < word.length; i++) {
                    const x = startX + i * dir.dx;
                    const y = startY + i * dir.dy;
                    if (x < 0 || x >= this.gridSize || y < 0 || y >= this.gridSize) {
                        canPlace = false;
                        break;
                    }
                    if (this.grid[y][x] !== '' && this.grid[y][x] !== word[i]) {
                        canPlace = false;
                        break;
                    }
                }

                if (canPlace) {
                    for (let i = 0; i < word.length; i++) {
                        const x = startX + i * dir.dx;
                        const y = startY + i * dir.dy;
                        this.grid[y][x] = word[i];
                    }
                    this.wordPositions.push({
                        word,
                        start: { x: startX, y: startY },
                        end: { x: startX + (word.length - 1) * dir.dx, y: startY + (word.length - 1) * dir.dy }
                    });
                    placed = true;
                }
                attempts++;
            }
        }
    }

    fillEmptyCells() {
        const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        for (let i = 0; i < this.gridSize; i++) {
            for (let j = 0; j < this.gridSize; j++) {
                if (this.grid[i][j] === '') {
                    this.grid[i][j] = letters[Math.floor(Math.random() * letters.length)];
                }
            }
        }
    }

    setupControls() {
        this.mouseDownHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.getCellFromCoords(x, y);
            if (cell) {
                this.selecting = true;
                this.selection.start = cell;
                this.selection.end = cell;
            }
        };

        this.mouseMoveHandler = (e) => {
            if (!this.selecting) return;
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            const cell = this.getCellFromCoords(x, y);
            if (cell) {
                this.selection.end = cell;
            }
        };

        this.mouseUpHandler = (e) => {
            if (this.selecting) {
                this.checkSelection();
                this.selecting = false;
                this.selection = { start: null, end: null };
            }
        };

        this.keyHandler = (e) => {
            if ((this.gameOver || this.won) && (e.key === ' ' || e.key === 'Enter')) {
                this.level++;
                this.reset();
                this.start();
            }
        };

        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpHandler);
        document.addEventListener('keydown', this.keyHandler);
    }

    getCellFromCoords(x, y) {
        const offsetX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
        const offsetY = 60;
        const col = Math.floor((x - offsetX) / this.cellSize);
        const row = Math.floor((y - offsetY) / this.cellSize);
        if (col >= 0 && col < this.gridSize && row >= 0 && row < this.gridSize) {
            return { x: col, y: row };
        }
        return null;
    }

    getSelectedWord() {
        if (!this.selection.start || !this.selection.end) return '';

        const dx = Math.sign(this.selection.end.x - this.selection.start.x);
        const dy = Math.sign(this.selection.end.y - this.selection.start.y);

        if (dx !== 0 && dy !== 0 && Math.abs(dx) !== Math.abs(dy)) return '';

        let word = '';
        let x = this.selection.start.x;
        let y = this.selection.start.y;
        const length = Math.max(
            Math.abs(this.selection.end.x - this.selection.start.x),
            Math.abs(this.selection.end.y - this.selection.start.y)
        ) + 1;

        for (let i = 0; i < length; i++) {
            if (x >= 0 && x < this.gridSize && y >= 0 && y < this.gridSize) {
                word += this.grid[y][x];
            }
            x += dx;
            y += dy;
        }

        return word;
    }

    checkSelection() {
        const selectedWord = this.getSelectedWord();
        const reversedWord = selectedWord.split('').reverse().join('');

        for (const word of this.targetWords) {
            if ((selectedWord === word || reversedWord === word) && !this.foundWords.includes(word)) {
                this.foundWords.push(word);
                this.score += word.length * 100;
                this.updateScoreDisplay();

                if (this.foundWords.length === this.targetWords.length) {
                    this.won = true;
                    this.score += 500;
                    this.onScore(this.score);
                }
            }
        }
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
        document.removeEventListener('keydown', this.keyHandler);
    }

    gameLoop() {
        if (!this.running) return;
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');

        this.ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CAÇA PALAVRAS', this.canvas.width / 2, 30);

        const offsetX = (this.canvas.width - this.gridSize * this.cellSize) / 2;
        const offsetY = 60;

        for (let row = 0; row < this.gridSize; row++) {
            for (let col = 0; col < this.gridSize; col++) {
                const x = offsetX + col * this.cellSize;
                const y = offsetY + row * this.cellSize;

                let isSelected = false;
                if (this.selection.start && this.selection.end) {
                    const dx = Math.sign(this.selection.end.x - this.selection.start.x);
                    const dy = Math.sign(this.selection.end.y - this.selection.start.y);
                    const length = Math.max(
                        Math.abs(this.selection.end.x - this.selection.start.x),
                        Math.abs(this.selection.end.y - this.selection.start.y)
                    ) + 1;

                    let sx = this.selection.start.x;
                    let sy = this.selection.start.y;
                    for (let i = 0; i < length; i++) {
                        if (sx === col && sy === row) {
                            isSelected = true;
                            break;
                        }
                        sx += dx;
                        sy += dy;
                    }
                }

                let isFound = false;
                for (const wp of this.wordPositions) {
                    if (this.foundWords.includes(wp.word)) {
                        const dx = Math.sign(wp.end.x - wp.start.x);
                        const dy = Math.sign(wp.end.y - wp.start.y);
                        let wx = wp.start.x;
                        let wy = wp.start.y;
                        for (let i = 0; i < wp.word.length; i++) {
                            if (wx === col && wy === row) {
                                isFound = true;
                                break;
                            }
                            wx += dx;
                            wy += dy;
                        }
                    }
                }

                if (isFound) {
                    this.ctx.fillStyle = '#22c55e';
                } else if (isSelected) {
                    this.ctx.fillStyle = '#3b82f6';
                } else {
                    this.ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
                }

                this.ctx.fillRect(x, y, this.cellSize - 2, this.cellSize - 2);
                this.ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
                this.ctx.strokeRect(x, y, this.cellSize - 2, this.cellSize - 2);

                this.ctx.fillStyle = (isSelected || isFound) ? '#ffffff' : (isDark ? '#e2e8f0' : '#1e293b');
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.textBaseline = 'middle';
                this.ctx.fillText(this.grid[row][col], x + this.cellSize / 2 - 1, y + this.cellSize / 2);
            }
        }

        const listY = offsetY + this.gridSize * this.cellSize + 20;
        this.ctx.fillStyle = isDark ? '#94a3b8' : '#64748b';
        this.ctx.font = '14px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Encontre as palavras:', this.canvas.width / 2, listY);

        let wordX = (this.canvas.width - this.targetWords.length * 100) / 2 + 50;
        for (const word of this.targetWords) {
            const found = this.foundWords.includes(word);
            this.ctx.fillStyle = found ? '#22c55e' : (isDark ? '#e2e8f0' : '#1e293b');
            this.ctx.font = found ? 'bold 12px Arial' : '12px Arial';
            this.ctx.fillText(found ? `✓ ${word}` : word, wordX, listY + 25);
            wordX += 100;
        }

        if (this.won) {
            const overlayGradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
            );
            overlayGradient.addColorStop(0, 'rgba(34, 197, 94, 0.9)');
            overlayGradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const time = Date.now() / 1000;

            // Marcas de verificação animadas
            for (let i = 0; i < 5; i++) {
                const x = this.canvas.width / 2 - 80 + i * 40;
                const y = this.canvas.height / 2 - 90 + Math.sin(time * 2 + i * 0.5) * 8;
                this.ctx.fillStyle = '#22c55e';
                this.ctx.beginPath();
                this.ctx.arc(x, y, 15, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.fillStyle = '#fff';
                this.ctx.font = 'bold 16px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('✓', x, y + 6);
            }

            this.ctx.shadowColor = '#22c55e';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🎯 PARABÉNS!', this.canvas.width / 2, this.canvas.height / 2 - 20);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 110, this.canvas.height / 2 + 5, 220, 55, 12);
            this.ctx.fill();

            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('Todas as palavras encontradas!', this.canvas.width / 2, this.canvas.height / 2 + 28);
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(`${this.score} pontos`, this.canvas.width / 2, this.canvas.height / 2 + 48);

            const pulse = 0.5 + Math.sin(time * 4) * 0.2;
            this.ctx.fillStyle = `rgba(59, 130, 246, ${0.3 + pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 130, this.canvas.height / 2 + 75, 260, 30, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '13px Arial';
            this.ctx.fillText('⏎ ENTER ou ESPAÇO para próximo nível', this.canvas.width / 2, this.canvas.height / 2 + 94);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const infoEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (infoEl) infoEl.textContent = `Nível ${this.level + 1} | ${this.foundWords.length}/${this.targetWords.length}`;
    }
}

class CrosswordGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;

        this.canvas.width = 650;
        this.canvas.height = 550;

        this.puzzles = [
            {
                grid: [
                    ['B', 'I', 'C', 'I', 'C', 'L', 'E', 'T', 'A', '#'],
                    ['#', '#', 'A', '#', '#', '#', '#', '#', 'R', '#'],
                    ['P', 'E', 'D', 'A', 'L', '#', 'R', 'O', 'D', 'A'],
                    ['#', '#', 'E', '#', '#', '#', '#', '#', 'O', '#'],
                    ['F', 'R', 'E', 'I', 'O', '#', 'C', 'A', 'B', 'O'],
                    ['#', '#', 'I', '#', '#', '#', '#', '#', '#', '#'],
                    ['S', 'E', 'L', 'I', 'M', '#', 'C', 'U', 'B', 'O'],
                    ['#', '#', 'A', '#', '#', '#', '#', '#', '#', '#']
                ],
                clues: {
                    across: [
                        { num: 1, clue: 'Veículo de duas rodas', answer: 'BICICLETA', row: 0, col: 0 },
                        { num: 3, clue: 'Onde apoiamos o pé', answer: 'PEDAL', row: 2, col: 0 },
                        { num: 4, clue: 'Parte circular', answer: 'RODA', row: 2, col: 6 },
                        { num: 5, clue: 'Para parar', answer: 'FREIO', row: 4, col: 0 },
                        { num: 6, clue: 'Fio condutor', answer: 'CABO', row: 4, col: 6 },
                        { num: 7, clue: 'Assento', answer: 'SELIM', row: 6, col: 0 },
                        { num: 8, clue: 'Forma geométrica', answer: 'CUBO', row: 6, col: 6 }
                    ],
                    down: [
                        { num: 2, clue: 'Proteção de metal', answer: 'CADEIA', row: 0, col: 2 },
                        { num: 3, clue: 'Parte traseira', answer: 'ARO', row: 0, col: 8 }
                    ]
                }
            }
        ];

        this.cellSize = 36;
        this.running = false;
        this.level = 0;
        this.score = 0;

        this.reset();
        this.setupControls();
    }

    reset() {
        const puzzle = this.puzzles[this.level % this.puzzles.length];
        this.solution = puzzle.grid;
        this.clues = puzzle.clues;
        this.rows = this.solution.length;
        this.cols = this.solution[0].length;

        this.userGrid = [];
        for (let i = 0; i < this.rows; i++) {
            this.userGrid[i] = [];
            for (let j = 0; j < this.cols; j++) {
                this.userGrid[i][j] = this.solution[i][j] === '#' ? '#' : '';
            }
        }

        this.selectedCell = { row: 0, col: 0 };
        while (this.solution[this.selectedCell.row][this.selectedCell.col] === '#') {
            this.selectedCell.col++;
            if (this.selectedCell.col >= this.cols) {
                this.selectedCell.col = 0;
                this.selectedCell.row++;
            }
        }

        this.direction = 'across';
        this.gameOver = false;
        this.won = false;

        this.updateScoreDisplay();
    }

    setupControls() {
        this.keyHandler = (e) => {
            if (this.won) {
                if (e.key === ' ' || e.key === 'Enter') {
                    this.level++;
                    this.reset();
                    this.start();
                }
                return;
            }

            const { row, col } = this.selectedCell;

            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.moveSelection(-1, 0);
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.moveSelection(1, 0);
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                this.moveSelection(0, -1);
            } else if (e.key === 'ArrowRight') {
                e.preventDefault();
                this.moveSelection(0, 1);
            } else if (e.key === 'Tab') {
                e.preventDefault();
                this.direction = this.direction === 'across' ? 'down' : 'across';
            } else if (e.key === 'Backspace') {
                e.preventDefault();
                if (this.userGrid[row][col] !== '' && this.userGrid[row][col] !== '#') {
                    this.userGrid[row][col] = '';
                } else {
                    if (this.direction === 'across') {
                        this.moveSelection(0, -1);
                    } else {
                        this.moveSelection(-1, 0);
                    }
                    if (this.userGrid[this.selectedCell.row][this.selectedCell.col] !== '#') {
                        this.userGrid[this.selectedCell.row][this.selectedCell.col] = '';
                    }
                }
            } else if (/^[a-zA-Z]$/.test(e.key)) {
                e.preventDefault();
                this.userGrid[row][col] = e.key.toUpperCase();

                if (this.direction === 'across') {
                    this.moveSelection(0, 1);
                } else {
                    this.moveSelection(1, 0);
                }

                this.checkWin();
            }
        };

        this.clickHandler = (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const offsetX = 20;
            const offsetY = 50;

            const col = Math.floor((x - offsetX) / this.cellSize);
            const row = Math.floor((y - offsetY) / this.cellSize);

            if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
                if (this.solution[row][col] !== '#') {
                    if (this.selectedCell.row === row && this.selectedCell.col === col) {
                        this.direction = this.direction === 'across' ? 'down' : 'across';
                    } else {
                        this.selectedCell = { row, col };
                    }
                }
            }
        };

        document.addEventListener('keydown', this.keyHandler);
        this.canvas.addEventListener('click', this.clickHandler);
    }

    moveSelection(dRow, dCol) {
        let newRow = this.selectedCell.row + dRow;
        let newCol = this.selectedCell.col + dCol;

        while (newRow >= 0 && newRow < this.rows && newCol >= 0 && newCol < this.cols) {
            if (this.solution[newRow][newCol] !== '#') {
                this.selectedCell = { row: newRow, col: newCol };
                return;
            }
            newRow += dRow;
            newCol += dCol;
        }
    }

    checkWin() {
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++) {
                if (this.solution[i][j] !== '#' && this.userGrid[i][j] !== this.solution[i][j]) {
                    return;
                }
            }
        }

        this.won = true;
        this.score += 1000 + this.level * 200;
        this.onScore(this.score);
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    stop() {
        this.running = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.removeEventListener('keydown', this.keyHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
    }

    gameLoop() {
        if (!this.running) return;
        this.draw();
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');

        this.ctx.fillStyle = isDark ? '#0f172a' : '#f1f5f9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        this.ctx.font = 'bold 20px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('CRUZADINHA', this.canvas.width / 2, 30);

        const offsetX = 20;
        const offsetY = 50;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const x = offsetX + col * this.cellSize;
                const y = offsetY + row * this.cellSize;
                const cell = this.solution[row][col];

                if (cell === '#') {
                    this.ctx.fillStyle = isDark ? '#1e293b' : '#334155';
                } else {
                    const isSelected = row === this.selectedCell.row && col === this.selectedCell.col;
                    const isCorrect = this.userGrid[row][col] === this.solution[row][col];

                    if (isSelected) {
                        this.ctx.fillStyle = '#3b82f6';
                    } else if (this.userGrid[row][col] && isCorrect) {
                        this.ctx.fillStyle = isDark ? '#166534' : '#dcfce7';
                    } else if (this.userGrid[row][col] && !isCorrect) {
                        this.ctx.fillStyle = isDark ? '#991b1b' : '#fee2e2';
                    } else {
                        this.ctx.fillStyle = isDark ? '#1e293b' : '#ffffff';
                    }
                }

                this.ctx.fillRect(x, y, this.cellSize - 2, this.cellSize - 2);

                if (cell !== '#') {
                    this.ctx.strokeStyle = isDark ? '#475569' : '#cbd5e1';
                    this.ctx.strokeRect(x, y, this.cellSize - 2, this.cellSize - 2);

                    if (this.userGrid[row][col]) {
                        const isSelected = row === this.selectedCell.row && col === this.selectedCell.col;
                        this.ctx.fillStyle = isSelected ? '#ffffff' : (isDark ? '#e2e8f0' : '#1e293b');
                        this.ctx.font = 'bold 18px Arial';
                        this.ctx.textAlign = 'center';
                        this.ctx.textBaseline = 'middle';
                        this.ctx.fillText(this.userGrid[row][col], x + this.cellSize / 2 - 1, y + this.cellSize / 2);
                    }
                }
            }
        }

        const clueX = offsetX + this.cols * this.cellSize + 30;
        let clueY = offsetY;

        this.ctx.fillStyle = isDark ? '#e2e8f0' : '#1e293b';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'left';
        this.ctx.fillText('Horizontal:', clueX, clueY);
        clueY += 20;

        this.ctx.font = '11px Arial';
        for (const clue of this.clues.across) {
            this.ctx.fillText(`${clue.num}. ${clue.clue}`, clueX, clueY);
            clueY += 16;
        }

        clueY += 15;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('Vertical:', clueX, clueY);
        clueY += 20;

        this.ctx.font = '11px Arial';
        for (const clue of this.clues.down) {
            this.ctx.fillText(`${clue.num}. ${clue.clue}`, clueX, clueY);
            clueY += 16;
        }

        this.ctx.fillStyle = isDark ? '#64748b' : '#94a3b8';
        this.ctx.font = '11px Arial';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Use as setas para navegar • Tab para mudar direção • Digite as letras', this.canvas.width / 2, this.canvas.height - 15);

        if (this.won) {
            const overlayGradient = this.ctx.createRadialGradient(
                this.canvas.width / 2, this.canvas.height / 2, 0,
                this.canvas.width / 2, this.canvas.height / 2, this.canvas.width
            );
            overlayGradient.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
            overlayGradient.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
            this.ctx.fillStyle = overlayGradient;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            const time = Date.now() / 1000;

            // Padrão animado de cruzadinha
            for (let i = 0; i < 3; i++) {
                for (let j = 0; j < 5; j++) {
                    const x = this.canvas.width / 2 - 80 + j * 35;
                    const y = this.canvas.height / 2 - 100 + i * 35 + Math.sin(time * 2 + i + j) * 3;
                    this.ctx.fillStyle = (i + j) % 2 === 0 ? '#a855f7' : '#7c3aed';
                    this.ctx.globalAlpha = 0.6;
                    this.ctx.beginPath();
                    this.ctx.roundRect(x, y, 28, 28, 3);
                    this.ctx.fill();
                    this.ctx.globalAlpha = 1;
                }
            }

            this.ctx.shadowColor = '#a855f7';
            this.ctx.shadowBlur = 20;
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('🧩 PARABÉNS!', this.canvas.width / 2, this.canvas.height / 2 - 10);
            this.ctx.shadowBlur = 0;

            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 100, this.canvas.height / 2 + 15, 200, 55, 12);
            this.ctx.fill();

            this.ctx.font = '16px Arial';
            this.ctx.fillStyle = '#fff';
            this.ctx.fillText('Cruzadinha completa!', this.canvas.width / 2, this.canvas.height / 2 + 38);
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.fillText(`${this.score} pontos`, this.canvas.width / 2, this.canvas.height / 2 + 58);

            const pulse = 0.5 + Math.sin(time * 4) * 0.2;
            this.ctx.fillStyle = `rgba(168, 85, 247, ${0.3 + pulse * 0.3})`;
            this.ctx.beginPath();
            this.ctx.roundRect(this.canvas.width / 2 - 130, this.canvas.height / 2 + 80, 260, 30, 8);
            this.ctx.fill();

            this.ctx.fillStyle = '#fff';
            this.ctx.font = '13px Arial';
            this.ctx.fillText('⏎ ENTER ou ESPAÇO para próximo nível', this.canvas.width / 2, this.canvas.height / 2 + 99);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const infoEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (infoEl) infoEl.textContent = `Nível ${this.level + 1}`;
    }
}

class Game2048 {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.canvas.width = 460;
        this.canvas.height = 600;
        this.size = 4;
        this.ts = 98;
        this.gp = 12;
        this.score = 0;
        this.best = parseInt(localStorage.getItem('2048_best') || '0');
        this.grid = [];
        this.running = false;
        this.won = false;
        this.keepPlaying = false;
        this.over = false;
        this.newTiles = [];
        this.mergedTiles = [];
        this.animFrame = 0;
        this.raf = null;
        this.dirty = true;
        this.boardX = (460 - (4 * (98 + 12) + 12)) / 2;
        this.boardY = 100;
        this.bW = 4 * (98 + 12) + 12;
        this.colors = {
            0:'#cdc1b4',2:'#eee4da',4:'#ede0c8',8:'#f2b179',16:'#f59563',
            32:'#f67c5f',64:'#f65e3b',128:'#edcf72',256:'#edcc61',512:'#edc850',
            1024:'#edc53f',2048:'#edc22e',4096:'#3c3a32',8192:'#3c3a32'
        };
        this.fgColors = {
            0:'#776e65',2:'#776e65',4:'#776e65',8:'#f9f6f2',16:'#f9f6f2',
            32:'#f9f6f2',64:'#f9f6f2',128:'#f9f6f2',256:'#f9f6f2',512:'#f9f6f2',
            1024:'#f9f6f2',2048:'#f9f6f2',4096:'#f9f6f2',8192:'#f9f6f2'
        };
        this.boardCanvas = null;
        this.keyHandler = this.handleKey.bind(this);
    }

    initBoardCache() {
        this.boardCanvas = document.createElement('canvas');
        this.boardCanvas.width = this.bW;
        this.boardCanvas.height = this.bW;
        const c = this.boardCanvas.getContext('2d');
        c.fillStyle = '#bbada0';
        c.beginPath(); c.roundRect(0, 0, this.bW, this.bW, 8); c.fill();
        for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
            c.fillStyle = '#cdc1b4';
            c.beginPath();
            c.roundRect(this.gp + col * (this.ts + this.gp), this.gp + r * (this.ts + this.gp), this.ts, this.ts, 6);
            c.fill();
        }
    }

    start() {
        this.stop();
        this.running = true;
        this.score = 0;
        this.won = false;
        this.keepPlaying = false;
        this.over = false;
        this.newTiles = [];
        this.mergedTiles = [];
        this.dirty = true;
        this.grid = Array.from({ length: 4 }, () => [0, 0, 0, 0]);
        this.addRandom();
        this.addRandom();
        if (!this.boardCanvas) this.initBoardCache();
        document.addEventListener('keydown', this.keyHandler);
        this.setupTouch();
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
        document.removeEventListener('keydown', this.keyHandler);
        if (this._ts) {
            this.canvas.removeEventListener('touchstart', this._ts);
            this.canvas.removeEventListener('touchend', this._te);
        }
    }

    setupTouch() {
        let sx, sy;
        this._ts = (e) => { e.preventDefault(); sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
        this._te = (e) => {
            if (this.over || (this.won && !this.keepPlaying)) { this.start(); return; }
            const dx = e.changedTouches[0].clientX - sx;
            const dy = e.changedTouches[0].clientY - sy;
            if (dx * dx + dy * dy < 900) return;
            if (Math.abs(dx) > Math.abs(dy)) this.move(dx > 0 ? 'right' : 'left');
            else this.move(dy > 0 ? 'down' : 'up');
        };
        this.canvas.addEventListener('touchstart', this._ts, { passive: false });
        this.canvas.addEventListener('touchend', this._te);
    }

    handleKey(e) {
        if (!this.running) return;
        if (this.won && !this.keepPlaying) {
            if (e.code === 'Space' || e.key === 'Enter') { this.keepPlaying = true; this.dirty = true; return; }
            if (e.key === 'n' || e.key === 'N') { this.start(); return; }
        }
        if (this.over) { if (e.code === 'Space' || e.key === 'Enter') { this.start(); return; } }
        const k = e.key;
        if (k === 'ArrowUp') { e.preventDefault(); this.move('up'); }
        else if (k === 'ArrowDown') { e.preventDefault(); this.move('down'); }
        else if (k === 'ArrowLeft') { e.preventDefault(); this.move('left'); }
        else if (k === 'ArrowRight') { e.preventDefault(); this.move('right'); }
    }

    addRandom() {
        const empty = [];
        const g = this.grid;
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if (!g[r][c]) empty.push((r << 2) | c);
        if (!empty.length) return;
        const idx = empty[(Math.random() * empty.length) | 0];
        const r = idx >> 2, c = idx & 3;
        g[r][c] = Math.random() < 0.9 ? 2 : 4;
        this.newTiles.push({ r, c, age: 0 });
    }

    move(dir) {
        if (!this.running || this.over || (this.won && !this.keepPlaying)) return;
        const g = this.grid;
        const prev = g.map(r => r.slice());
        const rot = (g) => { const n=[]; for(let i=0;i<4;i++){n[i]=[]; for(let j=0;j<4;j++) n[i][j]=g[3-j][i];} return n; };
        let t = g.map(r=>r.slice());
        const times = dir==='up'?3:dir==='down'?1:dir==='right'?2:0;
        for (let i = 0; i < times; i++) t = rot(t);
        const mergedRot = [];
        for (let ri = 0; ri < 4; ri++) {
            const nums = t[ri].filter(v => v);
            const merged = [];
            let i = 0;
            while (i < nums.length) {
                if (i + 1 < nums.length && nums[i] === nums[i + 1]) {
                    const val = nums[i] << 1;
                    merged.push(val);
                    this.score += val;
                    mergedRot.push([ri, merged.length - 1]);
                    if (val === 2048 && !this.keepPlaying) this.won = true;
                    i += 2;
                } else { merged.push(nums[i]); i++; }
            }
            while (merged.length < 4) merged.push(0);
            t[ri] = merged;
        }
        const rotBack = dir==='up'?1:dir==='down'?3:dir==='right'?2:0;
        for (let i = 0; i < rotBack; i++) t = rot(t);
        this.mergedTiles = [];
        const unrot = (r, c, n) => { for (let k = 0; k < n; k++) { const nr = c, nc = 3 - r; r = nr; c = nc; } return [r, c]; };
        for (let i = 0; i < mergedRot.length; i++) {
            const [mr, mc] = unrot(mergedRot[i][0], mergedRot[i][1], rotBack);
            this.mergedTiles.push({ r: mr, c: mc, age: 0 });
        }
        let changed = false;
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            this.grid[r][c] = t[r][c];
            if (t[r][c] !== prev[r][c]) changed = true;
        }
        if (changed) { this.newTiles = []; this.addRandom(); }
        if (this.score > this.best) { this.best = this.score; localStorage.setItem('2048_best', this.best); }
        this.checkGameOver();
        this.dirty = true;
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = this.score;
        if ((this.won && !this.keepPlaying) || this.over) this.onScore(this.score);
    }

    checkGameOver() {
        const g = this.grid;
        for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) {
            if (!g[r][c]) return;
            if (r < 3 && g[r][c] === g[r + 1][c]) return;
            if (c < 3 && g[r][c] === g[r][c + 1]) return;
        }
        this.over = true;
    }

    loop() {
        if (!this.running) return;
        this.animFrame++;
        let animating = false;
        for (let i = this.newTiles.length - 1; i >= 0; i--) {
            if (++this.newTiles[i].age < 8) animating = true;
        }
        for (let i = this.mergedTiles.length - 1; i >= 0; i--) {
            if (++this.mergedTiles[i].age < 10) animating = true;
        }
        if (this.dirty || animating) { this.draw(); this.dirty = false; }
        this.raf = requestAnimationFrame(() => this.loop());
    }

    draw() {
        const c = this.ctx, W = 460, H = 600, ts = this.ts, gp = this.gp;
        const bx = this.boardX, by = this.boardY;

        c.fillStyle = '#faf8ef'; c.fillRect(0, 0, W, H);
        c.fillStyle = '#776e65'; c.font = 'bold 52px "Segoe UI",Arial'; c.textAlign = 'left';
        c.fillText('2048', 14, 50);

        c.fillStyle = '#bbada0';
        c.beginPath(); c.roundRect(W - 210, 8, 95, 52, 6); c.fill();
        c.beginPath(); c.roundRect(W - 108, 8, 95, 52, 6); c.fill();
        c.fillStyle = 'rgba(238,228,218,0.5)'; c.font = 'bold 11px Arial'; c.textAlign = 'center';
        c.fillText('PONTOS', W - 162, 26); c.fillText('MELHOR', W - 60, 26);
        c.fillStyle = '#fff'; c.font = 'bold 20px "Segoe UI",Arial';
        c.fillText(this.score, W - 162, 48); c.fillText(this.best, W - 60, 48);

        c.fillStyle = '#776e65'; c.font = '13px Arial'; c.textAlign = 'left';
        c.fillText('Junte os numeros e chegue ao 2048!', 14, 80);

        c.drawImage(this.boardCanvas, bx, by);

        const g = this.grid;
        for (let r = 0; r < 4; r++) for (let col = 0; col < 4; col++) {
            const val = g[r][col];
            if (!val) continue;
            const x = bx + gp + col * (ts + gp);
            const y = by + gp + r * (ts + gp);
            let scale = 1;
            const nt = this.newTiles;
            for (let i = 0; i < nt.length; i++) {
                if (nt[i].r === r && nt[i].c === col && nt[i].age < 8) {
                    const p = nt[i].age / 8;
                    scale = 0.1 + p * 0.9;
                    if (p > 0.8) scale = 1 + (1 - p) / 0.2 * 0.06;
                    break;
                }
            }
            const mt = this.mergedTiles;
            for (let i = 0; i < mt.length; i++) {
                if (mt[i].r === r && mt[i].c === col && mt[i].age < 10) {
                    const p = mt[i].age / 10;
                    scale = p < 0.5 ? 1 + p * 0.4 : 1.2 - (p - 0.5) * 0.4;
                    break;
                }
            }
            c.save();
            c.translate(x + ts / 2, y + ts / 2);
            if (scale !== 1) c.scale(scale, scale);
            c.fillStyle = this.colors[val] || '#3c3a32';
            c.beginPath(); c.roundRect(-ts / 2, -ts / 2, ts, ts, 6); c.fill();
            c.fillStyle = this.fgColors[val] || '#f9f6f2';
            c.font = `bold ${val >= 8192 ? 24 : val >= 1024 ? 28 : val >= 128 ? 34 : val >= 16 ? 40 : 46}px "Segoe UI",Arial`;
            c.textAlign = 'center'; c.textBaseline = 'middle';
            c.fillText(val, 0, 2);
            c.restore();
        }
        c.textBaseline = 'alphabetic';

        if (this.over) {
            c.fillStyle = 'rgba(238,228,218,0.73)';
            c.beginPath(); c.roundRect(bx, by, this.bW, this.bW, 8); c.fill();
            c.fillStyle = '#776e65'; c.font = 'bold 48px "Segoe UI",Arial'; c.textAlign = 'center';
            c.fillText('Fim de Jogo!', W / 2, by + this.bW / 2 - 5);
            c.font = '16px Arial'; c.fillStyle = '#8f7a66';
            c.fillText('Toque ou Enter para tentar novamente', W / 2, by + this.bW / 2 + 30);
        }
        if (this.won && !this.keepPlaying) {
            c.fillStyle = 'rgba(237,194,46,0.5)';
            c.beginPath(); c.roundRect(bx, by, this.bW, this.bW, 8); c.fill();
            c.fillStyle = '#f9f6f2'; c.font = 'bold 48px "Segoe UI",Arial'; c.textAlign = 'center';
            c.fillText('Voce Venceu!', W / 2, by + this.bW / 2 - 20);
            c.font = '16px Arial';
            c.fillText('Enter = Continuar jogando', W / 2, by + this.bW / 2 + 15);
            c.font = '14px Arial'; c.fillStyle = 'rgba(255,255,255,0.8)';
            c.fillText('N = Novo jogo', W / 2, by + this.bW / 2 + 40);
        }
        c.fillStyle = '#776e65'; c.font = '11px Arial'; c.textAlign = 'center';
        c.fillText('Setas para mover | Toque para deslizar', W / 2, by + this.bW + 20);
    }
}


class FlappyBirdGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.canvas.width = 400;
        this.canvas.height = 600;
        this.running = false;
        this.started = false;
        this.score = 0;
        this.best = parseInt(localStorage.getItem('flappy_best') || '0');
        this.raf = null;
        this.W = 400;
        this.H = 600;
        this.groundY = 520;
        this.bgCache = null;
        this.groundCache = null;
        this.keyHandler = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); this.flap(); }
        };
        this.clickHandler = (e) => { e.preventDefault(); this.flap(); };
    }

    initCaches() {
        const W = this.W, gY = this.groundY, H = this.H;
        this.bgCache = document.createElement('canvas');
        this.bgCache.width = W; this.bgCache.height = gY;
        const bc = this.bgCache.getContext('2d');
        const sky = bc.createLinearGradient(0, 0, 0, gY);
        sky.addColorStop(0, '#4EC0CA'); sky.addColorStop(0.6, '#87CEEB'); sky.addColorStop(1, '#D4EEF7');
        bc.fillStyle = sky; bc.fillRect(0, 0, W, gY);

        this.groundCache = document.createElement('canvas');
        this.groundCache.width = W + 48; this.groundCache.height = H - gY;
        const gc = this.groundCache.getContext('2d');
        gc.fillStyle = '#8bc34a'; gc.fillRect(0, 0, W + 48, 8);
        gc.fillStyle = '#6d9b30';
        for (let i = 0; i < W + 48; i += 22) {
            gc.beginPath(); gc.moveTo(i, 3); gc.lineTo(i + 5, -4); gc.lineTo(i + 3, 3); gc.fill();
            gc.beginPath(); gc.moveTo(i + 11, 3); gc.lineTo(i + 16, -3); gc.lineTo(i + 14, 3); gc.fill();
        }
        gc.fillStyle = '#DED895'; gc.fillRect(0, 8, W + 48, 2);
        gc.fillStyle = '#C4BF6E'; gc.fillRect(0, 10, W + 48, 2);
        const dirtGrd = gc.createLinearGradient(0, 12, 0, H - gY);
        dirtGrd.addColorStop(0, '#F0C27F'); dirtGrd.addColorStop(1, '#D4A056');
        gc.fillStyle = dirtGrd; gc.fillRect(0, 12, W + 48, H - gY - 12);
    }

    start() {
        this.stop();
        this.running = true;
        this.started = false;
        this.score = 0;
        this.over = false;
        this.bird = { x: 80, y: 280, vy: 0, flapAnim: 0 };
        this.gravity = 0.42;
        this.flapPower = -7.2;
        this.pipes = [];
        this.pipeW = 54;
        this.gap = 145;
        this.pipeSpeed = 2.5;
        this.frameCount = 0;
        this.groundOffset = 0;
        this.clouds = [];
        for (let i = 0; i < 6; i++) this.clouds.push({ x: i * 75, y: 50 + Math.random() * 100, w: 40 + Math.random() * 30 });
        if (!this.bgCache) this.initCaches();
        document.addEventListener('keydown', this.keyHandler);
        this.canvas.addEventListener('click', this.clickHandler);
        this.canvas.addEventListener('touchstart', this.clickHandler, { passive: false });
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
        document.removeEventListener('keydown', this.keyHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
        this.canvas.removeEventListener('touchstart', this.clickHandler);
    }

    flap() {
        if (!this.running) return;
        if (this.over) { this.start(); return; }
        if (!this.started) this.started = true;
        this.bird.vy = this.flapPower;
        this.bird.flapAnim = 12;
    }

    spawnPipe() {
        const topH = 80 + ((Math.random() * (this.groundY - this.gap - 220)) | 0);
        this.pipes.push({ x: this.W + 10, topH, scored: false });
    }

    getMedal() {
        const s = this.score;
        if (s >= 40) return { n: 'Platina', c: '#e8e8e8', b: '#b0bec5', i: '#cfd8dc' };
        if (s >= 30) return { n: 'Ouro', c: '#ffd700', b: '#daa520', i: '#ffeb3b' };
        if (s >= 20) return { n: 'Prata', c: '#c0c0c0', b: '#9e9e9e', i: '#e0e0e0' };
        if (s >= 10) return { n: 'Bronze', c: '#cd7f32', b: '#8b4513', i: '#d4944a' };
        return null;
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.raf = requestAnimationFrame(() => this.loop());
    }

    update() {
        this.frameCount++;
        if (!this.started || this.over) {
            if (!this.started) this.bird.y = 280 + Math.sin(this.frameCount * 0.05) * 10;
            this.groundOffset = (this.groundOffset + 0.5) % 24;
            return;
        }
        this.groundOffset = (this.groundOffset + this.pipeSpeed) % 24;
        const b = this.bird;
        b.vy += this.gravity;
        b.y += b.vy;
        if (b.flapAnim > 0) b.flapAnim--;
        if (this.frameCount % 90 === 0) this.spawnPipe();
        const pw = this.pipeW, ps = this.pipeSpeed;
        const pipes = this.pipes;
        for (let i = pipes.length - 1; i >= 0; i--) {
            const p = pipes[i];
            p.x -= ps;
            if (!p.scored && p.x + pw < b.x) {
                p.scored = true;
                this.score++;
                const scoreEl = document.getElementById('game-score');
                if (scoreEl) scoreEl.textContent = this.score;
                if (this.score % 5 === 0) this.onScore(this.score);
            }
            if (p.x + pw < -10) { pipes.splice(i, 1); }
        }
        const bx = b.x, by = b.y, br = 13;
        if (by + br >= this.groundY || by - br <= 0) { this.die(); return; }
        for (let i = 0; i < pipes.length; i++) {
            const p = pipes[i];
            if (bx + br > p.x && bx - br < p.x + pw) {
                if (by - br < p.topH || by + br > p.topH + this.gap) { this.die(); return; }
            }
        }
    }

    die() {
        if (this.over) return;
        this.over = true;
        if (this.score > this.best) { this.best = this.score; localStorage.setItem('flappy_best', this.best); }
        this.onScore(this.score);
    }

    drawPipe(c, x, topH) {
        const W = this.pipeW, botY = topH + this.gap, gY = this.groundY;
        c.fillStyle = '#74BF2E';
        c.fillRect(x + 2, 0, W - 4, topH - 22);
        c.fillRect(x + 2, botY + 22, W - 4, gY - botY - 22);
        c.fillStyle = '#558B1E';
        c.fillRect(x + 2, 0, 4, topH - 22);
        c.fillRect(x + W - 6, 0, 4, topH - 22);
        c.fillRect(x + 2, botY + 22, 4, gY - botY - 22);
        c.fillRect(x + W - 6, botY + 22, 4, gY - botY - 22);
        c.fillStyle = '#8FD642';
        c.fillRect(x + 6, 0, 5, topH - 22);
        c.fillRect(x + 6, botY + 22, 5, gY - botY - 22);
        c.fillStyle = '#90D63A';
        c.fillRect(x - 4, topH - 24, W + 8, 26);
        c.fillRect(x - 4, botY - 2, W + 8, 26);
        c.strokeStyle = '#4A7C1F'; c.lineWidth = 1.5;
        c.strokeRect(x - 4, topH - 24, W + 8, 26);
        c.strokeRect(x - 4, botY - 2, W + 8, 26);
        c.fillStyle = '#B0E854';
        c.fillRect(x - 1, topH - 22, 6, 22);
        c.fillRect(x - 1, botY, 6, 22);
    }

    drawBird(c) {
        const { x, y, vy } = this.bird;
        const angle = this.started ? Math.min(Math.max(vy * 3, -25), 70) * 0.01745 : 0;
        c.save(); c.translate(x, y); c.rotate(angle);
        const wingY = this.bird.flapAnim > 6 ? -10 : this.bird.flapAnim > 0 ? 5 : Math.sin(this.frameCount * 0.15) * 3;
        c.fillStyle = '#E8B610';
        c.beginPath(); c.ellipse(-7, 3 + wingY, 14, 7, -0.2, 0, 6.283); c.fill();
        c.strokeStyle = '#573B14'; c.lineWidth = 1.2; c.stroke();
        c.fillStyle = '#F5C227';
        c.beginPath(); c.ellipse(0, 0, 17, 14, 0, 0, 6.283); c.fill();
        c.strokeStyle = '#573B14'; c.lineWidth = 1.5; c.stroke();
        c.fillStyle = '#F09B27';
        c.beginPath(); c.ellipse(0, 5, 12, 6, 0, 0, 3.14159); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.3)';
        c.beginPath(); c.ellipse(-2, -5, 10, 5, -0.2, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.ellipse(8, -4, 8, 7, 0.1, 0, 6.283); c.fill();
        c.strokeStyle = '#573B14'; c.lineWidth = 1; c.stroke();
        c.fillStyle = '#000'; c.beginPath(); c.arc(11, -4, 3.8, 0, 6.283); c.fill();
        c.fillStyle = '#fff'; c.beginPath(); c.arc(12, -5.5, 1.5, 0, 6.283); c.fill();
        c.fillStyle = '#F5A7A7';
        c.beginPath(); c.ellipse(-4, 5, 5, 3.5, 0, 0, 6.283); c.fill();
        c.fillStyle = '#F5882A';
        c.beginPath(); c.moveTo(14, -1); c.lineTo(25, 1); c.lineTo(25, 4); c.lineTo(14, 3); c.closePath(); c.fill();
        c.fillStyle = '#DB6B1B';
        c.beginPath(); c.moveTo(14, 3); c.lineTo(21, 6.5); c.lineTo(14, 5); c.closePath(); c.fill();
        c.restore();
    }

    draw() {
        const c = this.ctx, W = this.W, H = this.H, gY = this.groundY;

        c.drawImage(this.bgCache, 0, 0);

        const cls = this.clouds;
        c.fillStyle = 'rgba(255,255,255,0.8)';
        for (let i = 0; i < cls.length; i++) {
            const cl = cls[i];
            const cx = ((cl.x + this.frameCount * 0.06) % (W + 120)) - 60;
            c.beginPath(); c.ellipse(cx, cl.y, cl.w * 0.5, 10, 0, 0, 6.283); c.fill();
            c.beginPath(); c.ellipse(cx + 12, cl.y - 6, cl.w * 0.35, 8, 0, 0, 6.283); c.fill();
            c.beginPath(); c.ellipse(cx - 10, cl.y - 3, cl.w * 0.3, 7, 0, 0, 6.283); c.fill();
        }

        for (let i = 0; i < this.pipes.length; i++) {
            const p = this.pipes[i];
            this.drawPipe(c, p.x, p.topH);
        }

        const go = this.groundOffset | 0;
        c.drawImage(this.groundCache, -go, gY);

        this.drawBird(c);

        if (this.started || this.over) {
            c.fillStyle = '#fff'; c.font = 'bold 48px "Segoe UI",Arial'; c.textAlign = 'center';
            c.strokeStyle = 'rgba(0,0,0,0.4)'; c.lineWidth = 5; c.lineJoin = 'round';
            c.strokeText(this.score, W / 2, 60); c.fillText(this.score, W / 2, 60);
            c.lineJoin = 'miter';
        }

        if (!this.started && !this.over) {
            c.fillStyle = 'rgba(0,0,0,0.2)'; c.fillRect(0, 0, W, H);
            c.fillStyle = '#F5C227'; c.font = 'bold 38px "Segoe UI",Arial'; c.textAlign = 'center';
            c.strokeStyle = '#573B14'; c.lineWidth = 3; c.lineJoin = 'round';
            c.strokeText('Flappy Bird', W / 2, H / 2 - 65);
            c.fillText('Flappy Bird', W / 2, H / 2 - 65);
            c.lineJoin = 'miter';
            c.fillStyle = '#fff'; c.font = 'bold 18px Arial';
            c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 3; c.lineJoin = 'round';
            c.strokeText('Prepare-se!', W / 2, H / 2 - 25);
            c.fillText('Prepare-se!', W / 2, H / 2 - 25);
            c.lineJoin = 'miter';
            c.fillStyle = '#F5C227'; c.font = '36px Arial';
            c.fillText('\u{1F446}', W / 2, H / 2 + 15 + Math.sin(this.frameCount * 0.08) * 8);
            c.fillStyle = '#fff'; c.font = '13px Arial';
            c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 2; c.lineJoin = 'round';
            c.strokeText('Toque ou Espaco para voar', W / 2, H / 2 + 60);
            c.fillText('Toque ou Espaco para voar', W / 2, H / 2 + 60);
            c.lineJoin = 'miter';
        }

        if (this.over) {
            c.fillStyle = 'rgba(0,0,0,0.4)'; c.fillRect(0, 0, W, H);
            c.fillStyle = '#e74c3c'; c.font = 'bold 28px "Segoe UI",Arial'; c.textAlign = 'center';
            c.strokeStyle = 'rgba(0,0,0,0.3)'; c.lineWidth = 3; c.lineJoin = 'round';
            c.strokeText('Game Over', W / 2, H / 2 - 95); c.fillText('Game Over', W / 2, H / 2 - 95);
            c.lineJoin = 'miter';
            const px = W / 2 - 115, py = H / 2 - 75, pw = 230, ph = 130;
            c.fillStyle = '#DED895'; c.beginPath(); c.roundRect(px, py, pw, ph, 8); c.fill();
            c.strokeStyle = '#C4BF6E'; c.lineWidth = 3; c.stroke();
            c.fillStyle = '#8B7355'; c.beginPath(); c.roundRect(px + 8, py + 8, pw - 16, ph - 16, 4); c.fill();
            c.fillStyle = '#F0C27F'; c.beginPath(); c.roundRect(px + 12, py + 12, pw - 24, ph - 24, 3); c.fill();
            c.fillStyle = '#573B14'; c.font = 'bold 14px Arial';
            c.fillText('PONTOS', W / 2 + 30, py + 35);
            c.fillStyle = '#333'; c.font = 'bold 28px "Segoe UI",Arial';
            c.fillText(this.score, W / 2 + 30, py + 62);
            c.fillStyle = '#573B14'; c.font = 'bold 14px Arial';
            c.fillText('MELHOR', W / 2 + 30, py + 82);
            c.fillStyle = '#333'; c.font = 'bold 24px "Segoe UI",Arial';
            c.fillText(this.best, W / 2 + 30, py + 108);
            const medal = this.getMedal();
            if (medal) {
                const mx = px + 52, my = py + ph / 2;
                c.fillStyle = medal.b; c.beginPath(); c.arc(mx, my, 28, 0, 6.283); c.fill();
                c.fillStyle = medal.c; c.beginPath(); c.arc(mx, my, 24, 0, 6.283); c.fill();
                c.fillStyle = medal.i; c.beginPath(); c.arc(mx, my, 18, 0, 6.283); c.fill();
                c.fillStyle = medal.b; c.font = 'bold 10px Arial'; c.fillText(medal.n, mx, my + 4);
            }
            if (this.score >= this.best && this.score > 0) {
                c.fillStyle = '#e74c3c'; c.font = 'bold 10px Arial'; c.fillText('NOVO!', W / 2 + 80, py + 35);
            }
            const by = py + ph + 15;
            c.fillStyle = '#F5C227'; c.beginPath(); c.roundRect(W / 2 - 55, by, 110, 40, 6); c.fill();
            c.strokeStyle = '#573B14'; c.lineWidth = 2; c.stroke();
            c.fillStyle = '#573B14'; c.font = 'bold 16px Arial'; c.fillText('JOGAR', W / 2, by + 26);
        }
    }
}


class DinoGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.canvas.width = 700;
        this.canvas.height = 300;
        this.running = false;
        this.started = false;
        this.raf = null;
        this.best = parseInt(localStorage.getItem('dino_best') || '0');
        this.nightAlpha = 0;
        this.stars = [];
        for (let i = 0; i < 30; i++) this.stars.push({ x: Math.random() * 700, y: Math.random() * 120, s: 0.5 + Math.random() * 1.5, tw: Math.random() * 6.283 });
        this.groundBumps = [];
        for (let i = 0; i < 25; i++) this.groundBumps.push({ x: Math.random() * 700, w: 2 + Math.random() * 10, y: 8 + Math.random() * 10 });
        this.scoreStr = '00000';
        this.bestStr = String(this.best).padStart(5, '0');
        this.keyHandler = (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); this.jump(); }
            if (e.code === 'ArrowDown') this.duck(true);
        };
        this.keyUpHandler = (e) => { if (e.code === 'ArrowDown') this.duck(false); };
        this.clickHandler = (e) => { e.preventDefault(); this.jump(); };
    }

    start() {
        this.stop();
        this.running = true;
        this.started = false;
        this.over = false;
        this.score = 0;
        this.speed = 6;
        this.frameCount = 0;
        this.ground = 250;
        this.nightAlpha = 0;
        this.scoreFlash = 0;
        this.scoreStr = '00000';
        this.dino = { x: 60, y: 250, vy: 0, jumping: false, ducking: false, frame: 0 };
        this.obstacles = [];
        this.clouds = [];
        for (let i = 0; i < 4; i++) this.clouds.push({ x: 120 + i * 180, y: 25 + Math.random() * 50, w: 25 + Math.random() * 30 });
        this.bgOffset = 0;
        this.lastObstacleX = 0;
        document.addEventListener('keydown', this.keyHandler);
        document.addEventListener('keyup', this.keyUpHandler);
        this.canvas.addEventListener('click', this.clickHandler);
        this.canvas.addEventListener('touchstart', this.clickHandler, { passive: false });
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
        document.removeEventListener('keydown', this.keyHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
        this.canvas.removeEventListener('click', this.clickHandler);
        this.canvas.removeEventListener('touchstart', this.clickHandler);
    }

    jump() {
        if (!this.running) return;
        if (this.over) { this.start(); return; }
        if (!this.started) { this.started = true; return; }
        if (!this.dino.jumping) { this.dino.vy = -13; this.dino.jumping = true; }
    }

    duck(v) {
        if (!this.started || this.over) return;
        this.dino.ducking = v;
        if (v && this.dino.jumping) this.dino.vy = 10;
    }

    spawnObstacle() {
        if (this.lastObstacleX > 700 - 250 - Math.random() * 150) return;
        const types = ['cs', 'cm', 'cl', 'cg'];
        if (this.score > 400) types.push('b', 'b');
        const type = types[(Math.random() * types.length) | 0];
        const g = this.ground;
        const cfgs = { cs:[17,35,g-35], cm:[25,50,g-50], cl:[30,50,g-50], cg:[52,46,g-46], b:[46,26,g-60-(Math.random()>0.5?30:0)] };
        const cfg = cfgs[type];
        this.obstacles.push({ x: 720, type, w: cfg[0], h: cfg[1], y: cfg[2], frame: 0 });
        this.lastObstacleX = 720;
    }

    loop() {
        if (!this.running) return;
        this.update();
        this.draw();
        this.raf = requestAnimationFrame(() => this.loop());
    }

    update() {
        if (this.scoreFlash > 0) this.scoreFlash--;
        if (!this.started || this.over) return;
        this.frameCount++;
        this.speed = Math.min(13, 6 + this.frameCount * 0.00125);
        this.bgOffset = (this.bgOffset + this.speed) % 700;
        const nt = (((this.score / 700) | 0) % 2) === 1 ? 1 : 0;
        this.nightAlpha += (nt - this.nightAlpha) * 0.01;
        const d = this.dino;
        d.vy += 0.7; d.y += d.vy;
        if (d.y >= this.ground) { d.y = this.ground; d.vy = 0; d.jumping = false; }
        d.frame = (this.frameCount >> 2) & 1;
        const iv = Math.max(40, (90 - this.speed * 3) | 0);
        if (this.frameCount % iv === 0) this.spawnObstacle();
        const cls = this.clouds;
        for (let i = 0; i < cls.length; i++) { cls[i].x -= 1; if (cls[i].x < -60) { cls[i].x = 730 + Math.random() * 60; cls[i].y = 25 + Math.random() * 50; } }
        const obs = this.obstacles, sp = this.speed;
        for (let i = obs.length - 1; i >= 0; i--) { obs[i].x -= sp; obs[i].frame++; if (obs[i].x + obs[i].w < -20) obs.splice(i, 1); }
        this.lastObstacleX -= sp;
        this.score = (this.frameCount / 6) | 0;
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = this.score;
        if (this.score > 0 && this.score % 100 === 0 && this.frameCount % 6 === 0) {
            this.scoreFlash = 20;
            this.onScore(this.score);
        }
        this.scoreStr = String(this.score).padStart(5, '0');
        const pad = 6;
        const dy = d.ducking && !d.jumping ? d.y - 30 : d.y - 47;
        const dh = d.ducking && !d.jumping ? 30 : 47;
        for (let i = 0; i < obs.length; i++) {
            const o = obs[i], op = o.type === 'b' ? 6 : 4;
            if (d.x + pad < o.x + o.w - op && d.x + 44 - pad > o.x + op && dy + pad < o.y + o.h - op && dy + dh - pad > o.y + op) {
                this.over = true;
                if (this.score > this.best) { this.best = this.score; this.bestStr = String(this.best).padStart(5, '0'); localStorage.setItem('dino_best', this.best); }
                this.onScore(this.score);
                break;
            }
        }
    }

    draw() {
        const c = this.ctx, W = 700, H = 300, na = this.nightAlpha;
        const dn = na > 0.5;
        const r = (247 - 210 * na) | 0;
        const g = (247 - 210 * na) | 0;
        const bl = (247 - 200 * na) | 0;
        c.fillStyle = na < 0.01 ? '#f7f7f7' : `rgb(${r},${g},${bl})`; c.fillRect(0, 0, W, H);
        const tc = dn ? '#aaa' : '#535353';
        const gc = dn ? '#666' : '#535353';

        if (na > 0.1) {
            const st = this.stars;
            for (let i = 0; i < st.length; i++) {
                const s = st[i], tw = 0.2 + Math.sin(this.frameCount * 0.02 + s.tw) * 0.3;
                c.fillStyle = `rgba(255,255,255,${(tw * na).toFixed(2)})`;
                c.beginPath(); c.arc(s.x, s.y, s.s, 0, 6.283); c.fill();
            }
            c.fillStyle = `rgba(255,255,200,${(0.5 * na).toFixed(2)})`;
            c.beginPath(); c.arc(630, 40, 18, 0, 6.283); c.fill();
        }

        const cls = this.clouds;
        c.fillStyle = dn ? 'rgba(80,80,90,0.3)' : 'rgba(200,200,200,0.6)';
        for (let i = 0; i < cls.length; i++) {
            const cl = cls[i];
            c.beginPath(); c.ellipse(cl.x, cl.y, cl.w, 10, 0, 0, 6.283); c.fill();
            c.beginPath(); c.ellipse(cl.x + cl.w * 0.35, cl.y - 6, cl.w * 0.5, 8, 0, 0, 6.283); c.fill();
            c.beginPath(); c.ellipse(cl.x - cl.w * 0.25, cl.y - 2, cl.w * 0.4, 7, 0, 0, 6.283); c.fill();
        }

        const obs = this.obstacles;
        for (let i = 0; i < obs.length; i++) {
            const o = obs[i];
            if (o.type === 'b') this.drawBirdObs(c, o, tc);
            else this.drawCactus(c, o, tc);
        }

        this.drawDino(c, this.dino.x, this.dino.y, this.dino.ducking, this.dino.frame, tc, dn);

        c.fillStyle = gc; c.fillRect(0, this.ground + 4, W, 1);
        const bo = this.bgOffset, bumps = this.groundBumps;
        c.fillStyle = dn ? '#444' : '#bbb';
        for (let i = 0; i < bumps.length; i++) {
            const b = bumps[i], bx = (b.x - bo % 700 + 700) % 700;
            c.fillRect(bx, this.ground + b.y, b.w, 1);
        }

        c.font = '13px "Courier New",monospace'; c.textAlign = 'right';
        c.fillStyle = dn ? '#666' : '#aaa';
        c.fillText('HI ' + this.bestStr + '  ', 620, 25);
        if (this.scoreFlash > 0) c.globalAlpha = this.scoreFlash % 4 < 2 ? 1 : 0;
        c.fillStyle = tc; c.fillText(this.scoreStr, 685, 25);
        c.globalAlpha = 1;

        if (!this.started && !this.over) {
            c.fillStyle = tc; c.font = 'bold 18px "Courier New",monospace'; c.textAlign = 'center';
            c.fillText('PRESSIONE ESPACO OU TOQUE', 350, 140);
            c.font = '12px "Courier New",monospace'; c.fillStyle = dn ? '#666' : '#999';
            c.fillText('Pular   Agachar', 350, 162);
        }
        if (this.over) {
            c.fillStyle = tc; c.font = 'bold 20px "Courier New",monospace'; c.textAlign = 'center';
            c.fillText('G A M E   O V E R', 350, 125);
            this.drawRetry(c, 350, 160, dn);
        }
    }

    drawDino(c, x, y, duck, frame, col, dn) {
        const dk = dn ? '#777' : '#3a3a3a';
        if (duck && !this.dino.jumping) {
            c.fillStyle = col;
            c.fillRect(x - 2, y - 26, 56, 22);
            c.fillRect(x + 38, y - 32, 20, 12);
            c.fillStyle = '#fff'; c.fillRect(x + 50, y - 30, 5, 4);
            c.fillStyle = dk; c.fillRect(x + 52, y - 29, 2, 2);
            c.fillStyle = col;
            const l1 = frame ? 5 : 0, l2 = frame ? 0 : 5;
            c.fillRect(x + 10 + l1, y - 6, 7, 10); c.fillRect(x + 28 + l2, y - 6, 7, 10);
            c.fillStyle = dk; c.fillRect(x + 10 + l1, y + 2, 9, 3); c.fillRect(x + 28 + l2, y + 2, 9, 3);
        } else {
            c.fillStyle = col;
            c.fillRect(x + 10, y - 45, 30, 30);
            c.fillRect(x + 22, y - 58, 22, 16);
            c.fillStyle = '#fff'; c.fillRect(x + 36, y - 56, 5, 5);
            c.fillStyle = dk; c.fillRect(x + 38, y - 55, 3, 3);
            c.fillStyle = col;
            c.fillRect(x + 40, y - 48, 6, 3);
            c.fillRect(x + 6, y - 38, 6, 10);
            c.fillRect(x + 4, y - 32, 4, 8);
            if (this.dino.jumping) {
                c.fillRect(x + 16, y - 16, 7, 16); c.fillRect(x + 28, y - 16, 7, 16);
            } else {
                const l1 = frame ? 6 : 0, l2 = frame ? 0 : 6;
                c.fillRect(x + 16, y - 16 - l1, 7, 16 + l1); c.fillRect(x + 28, y - 16 - l2, 7, 16 + l2);
            }
            c.fillStyle = dk;
            c.fillRect(x + 15, y - 2, 9, 3); c.fillRect(x + 27, y - 2, 9, 3);
            c.fillStyle = col;
            c.fillRect(x + 4, y - 28, 8, 3); c.fillRect(x, y - 26, 6, 3);
        }
    }

    drawCactus(c, o, col) {
        c.fillStyle = col;
        const x = o.x, y = o.y, w = o.w, h = o.h;
        switch (o.type) {
            case 'cs': c.fillRect(x + 4, y, w - 8, h); c.fillRect(x, y + 10, w, 4); break;
            case 'cm': c.fillRect(x + 7, y, 11, h); c.fillRect(x, y + 14, 8, 20); c.fillRect(x, y + 14, 8, 4); c.fillRect(x + 17, y + 20, 8, 16); c.fillRect(x + 17, y + 20, 8, 4); break;
            case 'cl': c.fillRect(x + 8, y, 14, h); c.fillRect(x, y + 12, 10, 22); c.fillRect(x, y + 12, 10, 4); c.fillRect(x + 20, y + 18, 10, 18); c.fillRect(x + 20, y + 18, 10, 4); break;
            case 'cg': c.fillRect(x + 4, y + 6, 10, h - 6); c.fillRect(x, y + 18, 6, 14); c.fillRect(x + 20, y, 12, h); c.fillRect(x + 16, y + 12, 6, 18); c.fillRect(x + 30, y + 16, 6, 14); c.fillRect(x + 38, y + 4, 10, h - 4); c.fillRect(x + 46, y + 14, 6, 16); break;
        }
    }

    drawBirdObs(c, o, col) {
        const x = o.x, y = o.y, up = Math.sin(o.frame * 0.2) > 0;
        c.fillStyle = col;
        c.fillRect(x + 8, y + 8, 30, 10); c.fillRect(x + 30, y + 6, 14, 6); c.fillRect(x + 36, y + 10, 10, 4);
        if (up) c.fillRect(x + 12, y, 18, 10); else c.fillRect(x + 12, y + 16, 18, 10);
        c.fillStyle = '#fff'; c.fillRect(x + 34, y + 7, 3, 3);
    }

    drawRetry(c, cx, cy, dn) {
        const col = dn ? '#aaa' : '#535353';
        const fg = dn ? '#333' : '#f7f7f7';
        c.fillStyle = col; c.beginPath(); c.roundRect(cx - 30, cy - 27, 60, 54, 3); c.fill();
        c.strokeStyle = fg; c.lineWidth = 3;
        c.beginPath(); c.arc(cx, cy, 12, -2.67, 1.727, false); c.stroke();
        const t1 = 1.727, tx = cx + 12 * Math.cos(t1), ty = cy + 12 * Math.sin(t1);
        c.fillStyle = fg; c.beginPath();
        c.moveTo(tx + 5, ty - 2); c.lineTo(tx - 2, ty + 5); c.lineTo(tx - 3, ty - 5); c.closePath(); c.fill();
        const t2 = -2.67, sx = cx + 12 * Math.cos(t2), sy = cy + 12 * Math.sin(t2);
        c.beginPath(); c.moveTo(sx - 1, sy - 5); c.lineTo(sx + 5, sy + 1); c.lineTo(sx - 4, sy + 3); c.closePath(); c.fill();
    }
}


class BrainTestGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.canvas.width = 520;
        this.canvas.height = 500;
        this.running = false;
        this.level = 0;
        this.score = 0;
        this.lives = 3;
        this.state = 'playing';
        this.feedback = null;
        this.feedbackTimer = 0;
        this.hintShown = false;
        this.hintPenalty = false;
        this.clickCount = 0;
        this.dragTarget = null;
        this.dragOffX = 0;
        this.dragOffY = 0;
        this.levelData = {};
        this.raf = null;
        this.animFrame = 0;
        this.particles = [];
        this.wrongFlash = 0;
        this.levelTimer = 0;
        this.maxTime = 45 * 60;
        this.clickHandler = this.handleClick.bind(this);
        this.mouseDownHandler = this.handleMouseDown.bind(this);
        this.mouseMoveHandler = this.handleMouseMove.bind(this);
        this.mouseUpHandler = this.handleMouseUp.bind(this);
        this.keyHandler = (e) => {
            if (e.code === 'Space') { e.preventDefault(); this.handleSpace(); }
            if (e.code === 'KeyH') { e.preventDefault(); this.hintShown = true; this.hintPenalty = true; }
        };

        this.puzzles = [
            {
                question: 'Qual \u00e9 o MAIOR?',
                setup: (d) => {
                    d.items = [
                        { label: '5', x: 80, y: 210, w: 75, h: 75 },
                        { label: '33', x: 215, y: 210, w: 75, h: 75 },
                        { label: '12', x: 350, y: 210, w: 75, h: 75 },
                    ];
                    d.answerWord = { x: 220, y: 40, w: 120, h: 42 };
                },
                check: (x, y, d) => x >= d.answerWord.x && x <= d.answerWord.x + d.answerWord.w && y >= d.answerWord.y && y <= d.answerWord.y + d.answerWord.h,
                wrongCheck: (x, y, d) => {
                    for (const it of d.items) if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return true;
                    return false;
                },
                hint: 'Leia a pergunta com aten\u00e7\u00e3o... qual PALAVRA \u00e9 a maior fisicamente?',
                draw: (c, d, f) => {
                    d.items.forEach(it => {
                        c.fillStyle = '#e3f2fd'; c.beginPath(); c.roundRect(it.x, it.y, it.w, it.h, 14); c.fill();
                        c.strokeStyle = '#90caf9'; c.lineWidth = 2; c.beginPath(); c.roundRect(it.x, it.y, it.w, it.h, 14); c.stroke();
                        c.fillStyle = '#1565c0'; c.font = 'bold 30px Arial'; c.textAlign = 'center';
                        c.fillText(it.label, it.x + it.w / 2, it.y + it.h / 2 + 11);
                    });
                }
            },
            {
                question: 'Toque no bot\u00e3o AZUL',
                setup: (d) => {
                    d.buttons = [
                        { color: '#e74c3c', label: 'AZUL', x: 70, y: 210, w: 130, h: 60 },
                        { color: '#3498db', label: 'VERMELHO', x: 300, y: 210, w: 130, h: 60 },
                        { color: '#2ecc71', label: 'VERDE', x: 185, y: 300, w: 130, h: 60 },
                    ];
                },
                check: (x, y, d) => {
                    const b = d.buttons[1];
                    return x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
                },
                wrongCheck: (x, y, d) => {
                    for (const b of d.buttons) if (b !== d.buttons[1] && x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) return true;
                    return false;
                },
                hint: 'Cor do bot\u00e3o ou texto do bot\u00e3o? Qual \u00e9 AZUL de verdade?',
                draw: (c, d) => {
                    d.buttons.forEach(b => {
                        c.shadowColor = 'rgba(0,0,0,0.2)'; c.shadowBlur = 6; c.shadowOffsetY = 3;
                        c.fillStyle = b.color; c.beginPath(); c.roundRect(b.x, b.y, b.w, b.h, 14); c.fill();
                        c.shadowBlur = 0; c.shadowOffsetY = 0;
                        c.fillStyle = '#fff'; c.font = 'bold 18px Arial'; c.textAlign = 'center';
                        c.fillText(b.label, b.x + b.w / 2, b.y + b.h / 2 + 7);
                    });
                }
            },
            {
                question: 'Coloque o elefante na geladeira',
                setup: (d) => {
                    d.elephant = { x: 80, y: 200, w: 85, h: 85, draggable: true };
                    d.fridge = { x: 340, y: 160, w: 100, h: 140, open: false };
                    d.step = 0;
                },
                check: (x, y, d) => {
                    if (d.step === 0) {
                        if (x >= d.fridge.x && x <= d.fridge.x + d.fridge.w && y >= d.fridge.y && y <= d.fridge.y + d.fridge.h) {
                            d.step = 1; d.fridge.open = true;
                            return false;
                        }
                    }
                    return false;
                },
                dragCheck: (d) => {
                    if (d.step === 1) {
                        const ex = d.elephant.x + d.elephant.w / 2;
                        const ey = d.elephant.y + d.elephant.h / 2;
                        if (ex > d.fridge.x && ex < d.fridge.x + d.fridge.w && ey > d.fridge.y && ey < d.fridge.y + d.fridge.h) {
                            d.step = 2; return true;
                        }
                    }
                    return false;
                },
                hint: 'Primeiro abra a geladeira (clique nela), depois arraste o elefante para dentro!',
                draw: (c, d) => {
                    c.fillStyle = d.fridge.open ? '#b3e5fc' : '#e0e0e0';
                    c.shadowColor = 'rgba(0,0,0,0.15)'; c.shadowBlur = 8; c.shadowOffsetY = 3;
                    c.beginPath(); c.roundRect(d.fridge.x, d.fridge.y, d.fridge.w, d.fridge.h, 10); c.fill();
                    c.shadowBlur = 0; c.shadowOffsetY = 0;
                    c.strokeStyle = '#78909c'; c.lineWidth = 3;
                    c.beginPath(); c.roundRect(d.fridge.x, d.fridge.y, d.fridge.w, d.fridge.h, 10); c.stroke();
                    if (!d.fridge.open) {
                        c.fillStyle = '#90a4ae'; c.beginPath();
                        c.arc(d.fridge.x + d.fridge.w - 14, d.fridge.y + d.fridge.h / 2, 6, 0, Math.PI * 2); c.fill();
                        c.fillStyle = '#607d8b'; c.font = '13px Arial'; c.textAlign = 'center';
                        c.fillText('Fechada', d.fridge.x + d.fridge.w / 2, d.fridge.y + d.fridge.h + 20);
                    } else {
                        c.fillStyle = 'rgba(79,195,247,0.3)';
                        c.beginPath(); c.roundRect(d.fridge.x + 5, d.fridge.y + 5, d.fridge.w - 10, d.fridge.h - 10, 6); c.fill();
                        c.fillStyle = '#4fc3f7'; c.font = '13px Arial'; c.textAlign = 'center';
                        c.fillText('Aberta! Arraste aqui', d.fridge.x + d.fridge.w / 2, d.fridge.y + d.fridge.h + 20);
                    }
                    if (d.step < 2) {
                        c.font = '55px Arial'; c.textAlign = 'center';
                        c.fillText('\ud83d\udc18', d.elephant.x + d.elephant.w / 2, d.elephant.y + d.elephant.h / 2 + 18);
                    }
                }
            },
            {
                question: 'Encontre o GATO escondido',
                setup: (d) => {
                    d.animals = [
                        { emoji: '\ud83d\udc36', x: 55, y: 170, w: 65, h: 65 },
                        { emoji: '\ud83d\udc30', x: 155, y: 170, w: 65, h: 65 },
                        { emoji: '\ud83d\udc38', x: 255, y: 170, w: 65, h: 65 },
                        { emoji: '\ud83d\udc26', x: 355, y: 170, w: 65, h: 65 },
                        { emoji: '\ud83d\udc1f', x: 105, y: 265, w: 65, h: 65 },
                        { emoji: '\ud83d\udc0d', x: 205, y: 265, w: 65, h: 65 },
                        { emoji: '\ud83d\udc18', x: 305, y: 265, w: 65, h: 65 },
                    ];
                    d.catHidden = { x: 200, y: 36, w: 55, h: 35 };
                },
                check: (x, y, d) => x >= d.catHidden.x && x <= d.catHidden.x + d.catHidden.w && y >= d.catHidden.y && y <= d.catHidden.y + d.catHidden.h,
                wrongCheck: (x, y, d) => {
                    for (const a of d.animals) if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return true;
                    return false;
                },
                hint: 'O gato \u00e9 esperto... olhe na palavra GATO na pergunta!',
                draw: (c, d) => {
                    d.animals.forEach(a => {
                        c.fillStyle = '#fafafa'; c.beginPath(); c.roundRect(a.x, a.y, a.w, a.h, 12); c.fill();
                        c.strokeStyle = '#e0e0e0'; c.lineWidth = 2; c.beginPath(); c.roundRect(a.x, a.y, a.w, a.h, 12); c.stroke();
                        c.font = '34px Arial'; c.textAlign = 'center';
                        c.fillText(a.emoji, a.x + a.w / 2, a.y + a.h / 2 + 12);
                    });
                }
            },
            {
                question: 'Qual veio PRIMEIRO: ovo ou galinha?',
                setup: (d) => {
                    d.items = [
                        { emoji: '\ud83e\udd5a', label: 'Ovo', x: 90, y: 210, w: 110, h: 95 },
                        { emoji: '\ud83d\udc14', label: 'Galinha', x: 290, y: 210, w: 110, h: 95 },
                    ];
                    d.answerWord = { x: 168, y: 36, w: 130, h: 40 };
                },
                check: (x, y, d) => x >= d.answerWord.x && x <= d.answerWord.x + d.answerWord.w && y >= d.answerWord.y && y <= d.answerWord.y + d.answerWord.h,
                wrongCheck: (x, y, d) => {
                    for (const it of d.items) if (x >= it.x && x <= it.x + it.w && y >= it.y && y <= it.y + it.h) return true;
                    return false;
                },
                hint: 'Qual PALAVRA veio PRIMEIRO na frase da pergunta?',
                draw: (c, d) => {
                    d.items.forEach(it => {
                        c.fillStyle = '#fff8e1'; c.shadowColor = 'rgba(0,0,0,0.1)'; c.shadowBlur = 6;
                        c.beginPath(); c.roundRect(it.x, it.y, it.w, it.h, 14); c.fill();
                        c.shadowBlur = 0;
                        c.strokeStyle = '#ffb74d'; c.lineWidth = 2; c.beginPath(); c.roundRect(it.x, it.y, it.w, it.h, 14); c.stroke();
                        c.font = '44px Arial'; c.textAlign = 'center';
                        c.fillText(it.emoji, it.x + it.w / 2, it.y + 55);
                        c.fillStyle = '#e65100'; c.font = '15px Arial';
                        c.fillText(it.label, it.x + it.w / 2, it.y + it.h - 10);
                    });
                }
            },
            {
                question: 'Salve o peixe! Ele est\u00e1 fora da \u00e1gua!',
                setup: (d) => {
                    d.fish = { x: 290, y: 200, w: 65, h: 55, draggable: true, emoji: '\ud83d\udc1f', flopFrame: 0 };
                    d.bowl = { x: 100, y: 280, w: 95, h: 75 };
                },
                check: () => false,
                dragCheck: (d) => {
                    const fx = d.fish.x + d.fish.w / 2, fy = d.fish.y + d.fish.h / 2;
                    return fx > d.bowl.x && fx < d.bowl.x + d.bowl.w && fy > d.bowl.y && fy < d.bowl.y + d.bowl.h;
                },
                hint: 'Arraste o peixe para o aqu\u00e1rio!',
                animate: (d) => { d.fish.flopFrame = (d.fish.flopFrame || 0) + 1; },
                draw: (c, d) => {
                    c.fillStyle = 'rgba(187,222,251,0.5)';
                    c.beginPath(); c.roundRect(d.bowl.x, d.bowl.y, d.bowl.w, d.bowl.h, 12); c.fill();
                    c.fillStyle = 'rgba(66,165,245,0.3)';
                    c.beginPath(); c.roundRect(d.bowl.x + 4, d.bowl.y + d.bowl.h * 0.3, d.bowl.w - 8, d.bowl.h * 0.66, 8); c.fill();
                    c.strokeStyle = '#42a5f5'; c.lineWidth = 3; c.beginPath(); c.roundRect(d.bowl.x, d.bowl.y, d.bowl.w, d.bowl.h, 12); c.stroke();
                    c.fillStyle = '#42a5f5'; c.font = '13px Arial'; c.textAlign = 'center';
                    c.fillText('Aqu\u00e1rio', d.bowl.x + d.bowl.w / 2, d.bowl.y + d.bowl.h + 18);
                    const wobble = Math.sin((d.fish.flopFrame || 0) * 0.15) * 5;
                    c.save();
                    c.translate(d.fish.x + d.fish.w / 2, d.fish.y + d.fish.h / 2);
                    c.rotate(wobble * Math.PI / 180);
                    c.font = '40px Arial'; c.textAlign = 'center';
                    c.fillText(d.fish.emoji, 0, 14);
                    c.restore();
                }
            },
            {
                question: 'Fa\u00e7a o carro PARAR',
                setup: (d) => {
                    d.car = { x: 50, y: 230, speed: 1.8, emoji: '\ud83d\ude97' };
                    d.stopSign = { x: 350, y: 190, w: 75, h: 75 };
                    d.titleArea = { x: 320, y: 30, w: 110, h: 40 };
                },
                check: (x, y, d) => {
                    if (x >= d.titleArea.x && x <= d.titleArea.x + d.titleArea.w && y >= d.titleArea.y && y <= d.titleArea.y + d.titleArea.h) return true;
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    if (x >= d.stopSign.x && x <= d.stopSign.x + d.stopSign.w && y >= d.stopSign.y && y <= d.stopSign.y + d.stopSign.h) return true;
                    return false;
                },
                hint: 'A palavra PARAR est\u00e1 na pergunta... toque nela!',
                animate: (d) => { d.car.x += d.car.speed; if (d.car.x > 500) d.car.x = -50; },
                draw: (c, d) => {
                    c.fillStyle = '#bdbdbd';
                    c.beginPath(); c.roundRect(0, d.car.y + 52, 520, 10, 3); c.fill();
                    c.fillStyle = '#e0e0e0';
                    for (let i = 0; i < 520; i += 40) c.fillRect(i, d.car.y + 56, 20, 2);
                    c.font = '55px Arial'; c.textAlign = 'center';
                    c.fillText(d.car.emoji, d.car.x, d.car.y + 35);
                    c.fillStyle = '#f44336';
                    c.beginPath(); c.arc(d.stopSign.x + 37, d.stopSign.y + 37, 37, 0, Math.PI * 2); c.fill();
                    c.strokeStyle = '#c62828'; c.lineWidth = 3; c.stroke();
                    c.fillStyle = '#fff'; c.font = 'bold 16px Arial'; c.textAlign = 'center';
                    c.fillText('PARE', d.stopSign.x + 37, d.stopSign.y + 42);
                }
            },
            {
                question: 'Resolva: 5 + 3 x 0 = ?',
                setup: (d) => {
                    d.options = [
                        { label: '0', x: 60, y: 250, w: 80, h: 60 },
                        { label: '5', x: 180, y: 250, w: 80, h: 60 },
                        { label: '8', x: 300, y: 250, w: 80, h: 60 },
                        { label: '15', x: 400, y: 250, w: 80, h: 60 },
                    ];
                    d.answer = '5';
                },
                check: (x, y, d) => {
                    for (const o of d.options) {
                        if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h && o.label === d.answer) return true;
                    }
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    for (const o of d.options) {
                        if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h && o.label !== d.answer) return true;
                    }
                    return false;
                },
                hint: 'Multiplica\u00e7\u00e3o vem antes da soma! 3\u00d70=0, depois 5+0=5',
                draw: (c, d) => {
                    c.fillStyle = '#4527a0'; c.font = 'bold 48px "Courier New"'; c.textAlign = 'center';
                    c.fillText('5 + 3 \u00d7 0 = ?', 260, 200);
                    d.options.forEach(o => {
                        c.fillStyle = '#ede7f6'; c.beginPath(); c.roundRect(o.x, o.y, o.w, o.h, 12); c.fill();
                        c.strokeStyle = '#7e57c2'; c.lineWidth = 2; c.beginPath(); c.roundRect(o.x, o.y, o.w, o.h, 12); c.stroke();
                        c.fillStyle = '#4527a0'; c.font = 'bold 28px Arial'; c.textAlign = 'center';
                        c.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 10);
                    });
                }
            },
            {
                question: 'Toque nos n\u00fameros em ordem: 1, 2, 3, 4, 5',
                setup: (d) => {
                    d.nums = [
                        { v: 1, x: 320, y: 165, w: 58, h: 58, found: false },
                        { v: 2, x: 85, y: 260, w: 58, h: 58, found: false },
                        { v: 3, x: 370, y: 285, w: 58, h: 58, found: false },
                        { v: 4, x: 180, y: 180, w: 58, h: 58, found: false },
                        { v: 5, x: 65, y: 170, w: 58, h: 58, found: false },
                    ];
                    d.next = 1;
                },
                check: (x, y, d) => {
                    for (const n of d.nums) {
                        if (!n.found && n.v === d.next && x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
                            n.found = true; d.next++;
                            if (d.next > 5) return true;
                            return false;
                        }
                    }
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    for (const n of d.nums) {
                        if (!n.found && n.v !== d.next && x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) return true;
                    }
                    return false;
                },
                hint: 'Eles est\u00e3o embaralhados! Encontre o 1 primeiro.',
                draw: (c, d) => {
                    d.nums.forEach(n => {
                        c.fillStyle = n.found ? '#c8e6c9' : '#f5f5f5';
                        c.beginPath(); c.roundRect(n.x, n.y, n.w, n.h, 12); c.fill();
                        c.strokeStyle = n.found ? '#66bb6a' : '#bdbdbd';
                        c.lineWidth = 2;
                        c.beginPath(); c.roundRect(n.x, n.y, n.w, n.h, 12); c.stroke();
                        c.fillStyle = n.found ? '#2e7d32' : '#283593'; c.font = 'bold 26px Arial'; c.textAlign = 'center';
                        c.fillText(n.found ? '\u2713' : n.v, n.x + n.w / 2, n.y + n.h / 2 + 9);
                    });
                    c.fillStyle = '#5c6bc0'; c.font = '15px Arial'; c.textAlign = 'center';
                    c.fillText('Pr\u00f3ximo: ' + (d.next > 5 ? 'Completo!' : d.next), 260, 370);
                }
            },
            {
                question: 'Qual animal \u00e9 o mais pesado?',
                setup: (d) => {
                    d.animals = [
                        { emoji: '\ud83d\udc18', label: '100kg', x: 55, y: 175, w: 90, h: 80 },
                        { emoji: '\ud83d\udc2d', label: '200kg', x: 200, y: 175, w: 90, h: 80 },
                        { emoji: '\ud83d\udc14', label: '150kg', x: 345, y: 175, w: 90, h: 80 },
                    ];
                },
                check: (x, y, d) => {
                    const a = d.animals[0];
                    return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
                },
                wrongCheck: (x, y, d) => {
                    for (let i = 1; i < d.animals.length; i++) {
                        const a = d.animals[i];
                        if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return true;
                    }
                    return false;
                },
                hint: 'Ignore os n\u00fameros! Na vida real, qual animal \u00e9 mais pesado?',
                draw: (c, d) => {
                    d.animals.forEach(a => {
                        c.fillStyle = '#fafafa'; c.shadowColor = 'rgba(0,0,0,0.08)'; c.shadowBlur = 6;
                        c.beginPath(); c.roundRect(a.x, a.y, a.w, a.h, 14); c.fill();
                        c.shadowBlur = 0;
                        c.strokeStyle = '#e0e0e0'; c.lineWidth = 2;
                        c.beginPath(); c.roundRect(a.x, a.y, a.w, a.h, 14); c.stroke();
                        c.font = '40px Arial'; c.textAlign = 'center';
                        c.fillText(a.emoji, a.x + a.w / 2, a.y + 48);
                        c.fillStyle = '#f44336'; c.font = 'bold 14px Arial';
                        c.fillText(a.label, a.x + a.w / 2, a.y + a.h - 8);
                    });
                }
            },
            {
                question: 'Quantos tri\u00e2ngulos existem?',
                setup: (d) => {
                    d.options = [
                        { label: '3', x: 50, y: 340, w: 60, h: 50 },
                        { label: '5', x: 135, y: 340, w: 60, h: 50 },
                        { label: '7', x: 220, y: 340, w: 60, h: 50 },
                        { label: '9', x: 305, y: 340, w: 60, h: 50 },
                        { label: '11', x: 390, y: 340, w: 60, h: 50 },
                    ];
                    d.answer = '7';
                },
                check: (x, y, d) => {
                    for (const o of d.options) {
                        if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h && o.label === d.answer) return true;
                    }
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    for (const o of d.options) {
                        if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h && o.label !== d.answer) return true;
                    }
                    return false;
                },
                hint: 'Conte os tri\u00e2ngulos grandes E os pequenos formados dentro!',
                draw: (c, d) => {
                    const cx = 260, cy = 200;
                    c.strokeStyle = '#e67e22'; c.lineWidth = 3.5;
                    c.beginPath(); c.moveTo(cx, cy - 85); c.lineTo(cx - 95, cy + 65); c.lineTo(cx + 95, cy + 65); c.closePath(); c.stroke();
                    c.beginPath(); c.moveTo(cx, cy + 65); c.lineTo(cx, cy - 85); c.stroke();
                    c.beginPath(); c.moveTo(cx - 47, cy - 10); c.lineTo(cx + 47, cy - 10); c.stroke();
                    d.options.forEach(o => {
                        c.fillStyle = '#fff3e0'; c.beginPath(); c.roundRect(o.x, o.y, o.w, o.h, 10); c.fill();
                        c.strokeStyle = '#e67e22'; c.lineWidth = 2; c.beginPath(); c.roundRect(o.x, o.y, o.w, o.h, 10); c.stroke();
                        c.fillStyle = '#e65100'; c.font = 'bold 22px Arial'; c.textAlign = 'center';
                        c.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 8);
                    });
                }
            },
            {
                question: 'Qual copo tem MAIS \u00e1gua?',
                setup: (d) => {
                    d.cups = [
                        { x: 55, y: 190, w: 60, h: 85, level: 0.4, label: 'A' },
                        { x: 155, y: 190, w: 85, h: 65, level: 0.9, label: 'B' },
                        { x: 280, y: 190, w: 50, h: 105, level: 0.6, label: 'C' },
                        { x: 380, y: 190, w: 58, h: 75, level: 0.5, label: 'D' },
                    ];
                    d.answer = 'B';
                },
                check: (x, y, d) => {
                    for (const cup of d.cups) {
                        if (x >= cup.x && x <= cup.x + cup.w && y >= cup.y && y <= cup.y + cup.h + 25 && cup.label === d.answer) return true;
                    }
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    for (const cup of d.cups) {
                        if (x >= cup.x && x <= cup.x + cup.w && y >= cup.y && y <= cup.y + cup.h + 25 && cup.label !== d.answer) return true;
                    }
                    return false;
                },
                hint: 'Volume = largura \u00d7 altura da \u00e1gua. O B \u00e9 largo e quase cheio!',
                draw: (c, d, f) => {
                    d.cups.forEach(cup => {
                        c.strokeStyle = '#78909c'; c.lineWidth = 3;
                        c.beginPath(); c.roundRect(cup.x, cup.y, cup.w, cup.h, 4); c.stroke();
                        const waterH = cup.h * cup.level;
                        const waveOff = Math.sin((f || 0) * 0.04 + cup.x * 0.02) * 3;
                        c.fillStyle = 'rgba(33, 150, 243, 0.45)';
                        c.fillRect(cup.x + 2, cup.y + cup.h - waterH + waveOff, cup.w - 4, waterH - 2 - waveOff);
                        c.fillStyle = '#37474f'; c.font = 'bold 18px Arial'; c.textAlign = 'center';
                        c.fillText(cup.label, cup.x + cup.w / 2, cup.y + cup.h + 24);
                    });
                }
            },
            {
                question: 'Apague o inc\u00eandio!',
                setup: (d) => {
                    d.fire = { x: 210, y: 160, w: 100, h: 105 };
                    d.bucket = { x: 60, y: 290, w: 75, h: 65, draggable: true };
                    d.tapCount = 0;
                    d.smoke = [];
                },
                check: (x, y, d) => {
                    if (x >= d.fire.x && x <= d.fire.x + d.fire.w && y >= d.fire.y && y <= d.fire.y + d.fire.h) {
                        d.tapCount++;
                        d.smoke.push({ x: d.fire.x + 50 + (Math.random() - 0.5) * 30, y: d.fire.y, age: 0 });
                        if (d.tapCount >= 10) return true;
                    }
                    return false;
                },
                hint: 'Toque v\u00e1rias vezes no fogo para apagar! Clique r\u00e1pido!',
                draw: (c, d, f) => {
                    d.smoke = d.smoke.filter(s => { s.y -= 1; s.age++; return s.age < 40; });
                    d.smoke.forEach(s => {
                        c.globalAlpha = Math.max(0, 0.4 - s.age / 40);
                        c.fillStyle = '#9e9e9e';
                        c.beginPath(); c.arc(s.x + Math.sin(s.age * 0.1) * 5, s.y, 6 + s.age * 0.3, 0, Math.PI * 2); c.fill();
                    });
                    c.globalAlpha = 1;
                    const scale = Math.max(0.15, 1 - d.tapCount / 12);
                    c.save(); c.translate(d.fire.x + d.fire.w / 2, d.fire.y + d.fire.h);
                    c.scale(scale, scale);
                    c.font = '65px Arial'; c.textAlign = 'center';
                    c.fillText('\ud83d\udd25', 0, -25);
                    c.restore();
                    c.fillStyle = '#8d6e63';
                    c.beginPath(); c.roundRect(d.fire.x + 12, d.fire.y + d.fire.h - 8, 76, 22, 4); c.fill();
                    c.font = '42px Arial'; c.textAlign = 'center';
                    c.fillText('\ud83e\udea3', d.bucket.x + d.bucket.w / 2, d.bucket.y + d.bucket.h / 2 + 14);
                    const barW = 120, barH = 12;
                    const barX = d.fire.x + d.fire.w / 2 - barW / 2, barY = d.fire.y + d.fire.h + 30;
                    c.fillStyle = '#e0e0e0'; c.beginPath(); c.roundRect(barX, barY, barW, barH, 6); c.fill();
                    const pct = d.tapCount / 10;
                    const barColor = pct > 0.7 ? '#4caf50' : pct > 0.4 ? '#ff9800' : '#f44336';
                    c.fillStyle = barColor; c.beginPath(); c.roundRect(barX, barY, barW * pct, barH, 6); c.fill();
                    c.fillStyle = '#666'; c.font = '11px Arial'; c.textAlign = 'center';
                    c.fillText(d.tapCount + '/10 toques', d.fire.x + d.fire.w / 2, barY + barH + 14);
                }
            },
            {
                question: 'Acenda a luz! \ud83d\udca1',
                setup: (d) => {
                    d.bulb = { x: 200, y: 120, w: 80, h: 100 };
                    d.switches = [
                        { x: 70, y: 300, w: 60, h: 80, label: '1' },
                        { x: 170, y: 300, w: 60, h: 80, label: '2' },
                        { x: 270, y: 300, w: 60, h: 80, label: '3' },
                        { x: 370, y: 300, w: 60, h: 80, label: '4' },
                    ];
                    d.wordBulb = { x: 338, y: 36, w: 40, h: 40 };
                },
                check: (x, y, d) => {
                    return x >= d.wordBulb.x && x <= d.wordBulb.x + d.wordBulb.w && y >= d.wordBulb.y && y <= d.wordBulb.y + d.wordBulb.h;
                },
                wrongCheck: (x, y, d) => {
                    for (const sw of d.switches) {
                        if (x >= sw.x && x <= sw.x + sw.w && y >= sw.y && y <= sw.y + sw.h) return true;
                    }
                    if (x >= d.bulb.x && x <= d.bulb.x + d.bulb.w && y >= d.bulb.y && y <= d.bulb.y + d.bulb.h) return true;
                    return false;
                },
                hint: 'A luz j\u00e1 est\u00e1 na pergunta... toque no emoji!',
                draw: (c, d) => {
                    c.fillStyle = '#e0e0e0';
                    c.beginPath(); c.arc(d.bulb.x + d.bulb.w / 2, d.bulb.y + 40, 38, 0, Math.PI * 2); c.fill();
                    c.strokeStyle = '#bdbdbd'; c.lineWidth = 2; c.stroke();
                    c.fillStyle = '#bdbdbd';
                    c.beginPath(); c.roundRect(d.bulb.x + 20, d.bulb.y + 72, 40, 20, 4); c.fill();
                    c.fillStyle = '#9e9e9e'; c.font = '13px Arial'; c.textAlign = 'center';
                    c.fillText('OFF', d.bulb.x + d.bulb.w / 2, d.bulb.y + d.bulb.h + 20);
                    d.switches.forEach(sw => {
                        c.fillStyle = '#616161'; c.beginPath(); c.roundRect(sw.x, sw.y, sw.w, sw.h, 8); c.fill();
                        c.fillStyle = '#e0e0e0';
                        c.beginPath(); c.roundRect(sw.x + 10, sw.y + sw.h / 2, sw.w - 20, sw.h / 2 - 10, 4); c.fill();
                        c.fillStyle = '#fff'; c.font = 'bold 18px Arial'; c.textAlign = 'center';
                        c.fillText(sw.label, sw.x + sw.w / 2, sw.y + 30);
                    });
                }
            },
            {
                question: 'Toque no filhote da galinha',
                setup: (d) => {
                    d.animals = [
                        { emoji: '\ud83d\udc25', x: 60, y: 180, w: 70, h: 70 },
                        { emoji: '\ud83d\udc23', x: 170, y: 180, w: 70, h: 70 },
                        { emoji: '\ud83d\udc24', x: 280, y: 180, w: 70, h: 70 },
                        { emoji: '\ud83e\udd5a', x: 390, y: 180, w: 70, h: 70 },
                    ];
                    d.galinha = { x: 190, y: 285, w: 80, h: 80 };
                },
                check: (x, y, d) => {
                    const a = d.animals[3];
                    return x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h;
                },
                wrongCheck: (x, y, d) => {
                    for (let i = 0; i < 3; i++) {
                        const a = d.animals[i];
                        if (x >= a.x && x <= a.x + a.w && y >= a.y && y <= a.y + a.h) return true;
                    }
                    return false;
                },
                hint: 'O filhote da galinha come\u00e7a como... um ovo!',
                draw: (c, d) => {
                    d.animals.forEach(a => {
                        c.fillStyle = '#fff8e1'; c.beginPath(); c.roundRect(a.x, a.y, a.w, a.h, 14); c.fill();
                        c.strokeStyle = '#ffe082'; c.lineWidth = 2; c.beginPath(); c.roundRect(a.x, a.y, a.w, a.h, 14); c.stroke();
                        c.font = '38px Arial'; c.textAlign = 'center';
                        c.fillText(a.emoji, a.x + a.w / 2, a.y + a.h / 2 + 14);
                    });
                    c.font = '55px Arial'; c.textAlign = 'center';
                    c.fillText('\ud83d\udc14', d.galinha.x + d.galinha.w / 2, d.galinha.y + d.galinha.h / 2 + 18);
                    c.fillStyle = '#8d6e63'; c.font = '13px Arial';
                    c.fillText('Mam\u00e3e Galinha', d.galinha.x + d.galinha.w / 2, d.galinha.y + d.galinha.h + 16);
                }
            },
            {
                question: 'Qual bal\u00e3o \u00e9 o DIFERENTE?',
                setup: (d) => {
                    d.balloons = [];
                    const colors = ['#e74c3c', '#e74c3c', '#e74c3c', '#e74c3c', '#e74c3c', '#c0392b', '#e74c3c', '#e74c3c', '#e74c3c'];
                    for (let i = 0; i < 9; i++) {
                        d.balloons.push({
                            x: 50 + (i % 3) * 145, y: 140 + Math.floor(i / 3) * 100,
                            w: 65, h: 75, color: colors[i], idx: i
                        });
                    }
                    d.diff = 5;
                },
                check: (x, y, d) => {
                    for (const b of d.balloons) {
                        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h && b.idx === d.diff) return true;
                    }
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    for (const b of d.balloons) {
                        if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h && b.idx !== d.diff) return true;
                    }
                    return false;
                },
                hint: 'Olhe bem! Um tem uma cor ligeiramente diferente...',
                draw: (c, d, f) => {
                    d.balloons.forEach(b => {
                        const bob = Math.sin((f || 0) * 0.03 + b.idx * 0.8) * 4;
                        c.fillStyle = b.color;
                        c.beginPath(); c.ellipse(b.x + b.w / 2, b.y + b.h / 2 + bob, b.w / 2, b.h / 2, 0, 0, Math.PI * 2); c.fill();
                        c.strokeStyle = 'rgba(0,0,0,0.15)'; c.lineWidth = 1.5; c.stroke();
                        c.strokeStyle = '#888'; c.lineWidth = 1;
                        c.beginPath(); c.moveTo(b.x + b.w / 2, b.y + b.h + bob);
                        c.quadraticCurveTo(b.x + b.w / 2 + 5, b.y + b.h + 25 + bob, b.x + b.w / 2 - 3, b.y + b.h + 38 + bob);
                        c.stroke();
                    });
                }
            },
            {
                question: 'Toque em TODOS os n\u00fameros pares',
                setup: (d) => {
                    d.nums = [
                        { v: 3, x: 50, y: 170, w: 55, h: 55, tapped: false },
                        { v: 8, x: 130, y: 170, w: 55, h: 55, tapped: false },
                        { v: 15, x: 210, y: 170, w: 55, h: 55, tapped: false },
                        { v: 2, x: 290, y: 170, w: 55, h: 55, tapped: false },
                        { v: 11, x: 370, y: 170, w: 55, h: 55, tapped: false },
                        { v: 6, x: 90, y: 260, w: 55, h: 55, tapped: false },
                        { v: 7, x: 170, y: 260, w: 55, h: 55, tapped: false },
                        { v: 4, x: 250, y: 260, w: 55, h: 55, tapped: false },
                        { v: 9, x: 330, y: 260, w: 55, h: 55, tapped: false },
                    ];
                    d.needed = 4;
                    d.found = 0;
                },
                check: (x, y, d) => {
                    for (const n of d.nums) {
                        if (!n.tapped && x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) {
                            if (n.v % 2 === 0) { n.tapped = true; d.found++; if (d.found >= d.needed) return true; }
                            return false;
                        }
                    }
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    for (const n of d.nums) {
                        if (!n.tapped && n.v % 2 !== 0 && x >= n.x && x <= n.x + n.w && y >= n.y && y <= n.y + n.h) return true;
                    }
                    return false;
                },
                hint: 'N\u00fameros pares: divis\u00edveis por 2 (2, 4, 6, 8...)',
                draw: (c, d) => {
                    d.nums.forEach(n => {
                        c.fillStyle = n.tapped ? '#c8e6c9' : '#f5f5f5';
                        c.beginPath(); c.roundRect(n.x, n.y, n.w, n.h, 10); c.fill();
                        c.strokeStyle = n.tapped ? '#4caf50' : '#bdbdbd'; c.lineWidth = 2;
                        c.beginPath(); c.roundRect(n.x, n.y, n.w, n.h, 10); c.stroke();
                        c.fillStyle = n.tapped ? '#2e7d32' : '#333'; c.font = 'bold 22px Arial'; c.textAlign = 'center';
                        c.fillText(n.tapped ? '\u2713' : n.v, n.x + n.w / 2, n.y + n.h / 2 + 8);
                    });
                    c.fillStyle = '#666'; c.font = '14px Arial'; c.textAlign = 'center';
                    c.fillText(d.found + '/' + d.needed + ' encontrados', 260, 360);
                }
            },
            {
                question: 'Quanto \u00e9 100 \u00f7 2 \u00f7 2?',
                setup: (d) => {
                    d.options = [
                        { label: '0', x: 50, y: 250, w: 80, h: 60 },
                        { label: '25', x: 170, y: 250, w: 80, h: 60 },
                        { label: '50', x: 290, y: 250, w: 80, h: 60 },
                        { label: '100', x: 400, y: 250, w: 80, h: 60 },
                    ];
                    d.answer = '25';
                },
                check: (x, y, d) => {
                    for (const o of d.options) {
                        if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h && o.label === d.answer) return true;
                    }
                    return false;
                },
                wrongCheck: (x, y, d) => {
                    for (const o of d.options) {
                        if (x >= o.x && x <= o.x + o.w && y >= o.y && y <= o.y + o.h && o.label !== d.answer) return true;
                    }
                    return false;
                },
                hint: '100\u00f72=50, depois 50\u00f72=25!',
                draw: (c, d) => {
                    c.fillStyle = '#1565c0'; c.font = 'bold 44px "Courier New"'; c.textAlign = 'center';
                    c.fillText('100 \u00f7 2 \u00f7 2', 260, 195);
                    d.options.forEach(o => {
                        c.fillStyle = '#e3f2fd'; c.beginPath(); c.roundRect(o.x, o.y, o.w, o.h, 12); c.fill();
                        c.strokeStyle = '#42a5f5'; c.lineWidth = 2; c.beginPath(); c.roundRect(o.x, o.y, o.w, o.h, 12); c.stroke();
                        c.fillStyle = '#0d47a1'; c.font = 'bold 26px Arial'; c.textAlign = 'center';
                        c.fillText(o.label, o.x + o.w / 2, o.y + o.h / 2 + 9);
                    });
                }
            },
            {
                question: 'Ajude o pintinho a encontrar a mam\u00e3e!',
                setup: (d) => {
                    d.chick = { x: 60, y: 240, w: 55, h: 55, draggable: true };
                    d.hen = { x: 370, y: 230, w: 80, h: 75 };
                    d.walls = [
                        { x: 200, y: 130, w: 15, h: 200 },
                        { x: 300, y: 100, w: 15, h: 240 },
                    ];
                },
                check: () => false,
                dragCheck: (d) => {
                    const cx = d.chick.x + d.chick.w / 2, cy = d.chick.y + d.chick.h / 2;
                    return cx > d.hen.x && cx < d.hen.x + d.hen.w && cy > d.hen.y && cy < d.hen.y + d.hen.h;
                },
                hint: 'Arraste o pintinho por CIMA das paredes... n\u00e3o h\u00e1 regra contra isso!',
                draw: (c, d) => {
                    d.walls.forEach(w => {
                        c.fillStyle = '#795548';
                        c.beginPath(); c.roundRect(w.x, w.y, w.w, w.h, 3); c.fill();
                    });
                    c.font = '50px Arial'; c.textAlign = 'center';
                    c.fillText('\ud83d\udc14', d.hen.x + d.hen.w / 2, d.hen.y + d.hen.h / 2 + 18);
                    c.fillStyle = '#8d6e63'; c.font = '12px Arial';
                    c.fillText('Mam\u00e3e', d.hen.x + d.hen.w / 2, d.hen.y + d.hen.h + 14);
                    c.font = '36px Arial'; c.textAlign = 'center';
                    c.fillText('\ud83d\udc24', d.chick.x + d.chick.w / 2, d.chick.y + d.chick.h / 2 + 12);
                }
            },
        ];
    }

    start() {
        this.stop();
        this.running = true;
        this.level = 0;
        this.score = 0;
        this.lives = 3;
        this.state = 'playing';
        this.animFrame = 0;
        this.particles = [];
        this.feedbackTimer = 0;
        this.wrongFlash = 0;
        this.justDragged = false;
        document.addEventListener('keydown', this.keyHandler);
        this.canvas.addEventListener('click', this.clickHandler);
        this.canvas.addEventListener('mousedown', this.mouseDownHandler);
        this.canvas.addEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.addEventListener('mouseup', this.mouseUpHandler);
        this.canvas.addEventListener('touchstart', this.mouseDownHandler, { passive: false });
        this.canvas.addEventListener('touchmove', this.mouseMoveHandler, { passive: false });
        this.canvas.addEventListener('touchend', this.mouseUpHandler, { passive: false });
        this.setupLevel();
        this.loop();
    }

    stop() {
        this.running = false;
        if (this.raf) { cancelAnimationFrame(this.raf); this.raf = null; }
        this.canvas.removeEventListener('click', this.clickHandler);
        this.canvas.removeEventListener('mousedown', this.mouseDownHandler);
        this.canvas.removeEventListener('mousemove', this.mouseMoveHandler);
        this.canvas.removeEventListener('mouseup', this.mouseUpHandler);
        this.canvas.removeEventListener('touchstart', this.mouseDownHandler);
        this.canvas.removeEventListener('touchmove', this.mouseMoveHandler);
        this.canvas.removeEventListener('touchend', this.mouseUpHandler);
        document.removeEventListener('keydown', this.keyHandler);
    }

    setupLevel() {
        this.levelData = {};
        this.hintShown = false;
        this.hintPenalty = false;
        this.clickCount = 0;
        this.feedback = null;
        this.levelTimer = 0;
        const puzzle = this.puzzles[this.level % this.puzzles.length];
        if (puzzle.setup) puzzle.setup(this.levelData);
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = this.score;
        const infoEl = document.getElementById('game-phase');
        if (infoEl) infoEl.textContent = 'Fase ' + (this.level + 1) + '/' + this.puzzles.length;
    }

    getPos(e) {
        const rect = this.canvas.getBoundingClientRect();
        const t = e.touches ? e.touches[0] || e.changedTouches[0] : e;
        return {
            x: (t.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (t.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handleClick(e) {
        if (!this.running) return;
        if (this.justDragged) { this.justDragged = false; return; }
        if (this.state === 'correct') { this.nextLevel(); return; }
        if (this.state === 'gameover') { this.start(); return; }
        if (this.state !== 'playing') return;
        const { x, y } = this.getPos(e);
        const puzzle = this.puzzles[this.level % this.puzzles.length];

        if (x >= 420 && x <= 510 && y >= 440 && y <= 475) {
            this.hintShown = true;
            this.hintPenalty = true;
            return;
        }

        this.clickCount++;
        if (puzzle.check(x, y, this.levelData)) {
            this.success();
        } else if (puzzle.wrongCheck && puzzle.wrongCheck(x, y, this.levelData)) {
            this.wrongAnswer();
        }
    }

    wrongAnswer() {
        this.lives--;
        this.wrongFlash = 15;
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: 260 + (Math.random() - 0.5) * 200, y: 250 + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 4, vy: -Math.random() * 3,
                life: 15 + Math.random() * 10, color: '#f44336', r: 3
            });
        }
        if (this.lives <= 0) {
            this.state = 'gameover';
            this.onScore(this.score);
        }
    }

    handleMouseDown(e) {
        if (!this.running || this.state !== 'playing') return;
        e.preventDefault();
        const { x, y } = this.getPos(e);
        const d = this.levelData;
        const draggables = Object.values(d).filter(v => v && typeof v === 'object' && v.draggable);
        for (const obj of draggables) {
            if (x >= obj.x && x <= obj.x + obj.w && y >= obj.y && y <= obj.y + obj.h) {
                this.dragTarget = obj;
                this.dragOffX = x - obj.x;
                this.dragOffY = y - obj.y;
                return;
            }
        }
    }

    handleMouseMove(e) {
        if (!this.dragTarget) return;
        e.preventDefault();
        const { x, y } = this.getPos(e);
        this.dragTarget.x = Math.max(0, Math.min(this.canvas.width - this.dragTarget.w, x - this.dragOffX));
        this.dragTarget.y = Math.max(0, Math.min(this.canvas.height - this.dragTarget.h, y - this.dragOffY));
    }

    handleMouseUp(e) {
        if (!this.dragTarget) return;
        e.preventDefault();
        this.justDragged = true;
        const puzzle = this.puzzles[this.level % this.puzzles.length];
        if (puzzle.dragCheck && puzzle.dragCheck(this.levelData)) this.success();
        this.dragTarget = null;
    }

    handleSpace() {
        if (this.state === 'correct') { this.nextLevel(); }
        if (this.state === 'complete') { this.start(); }
        if (this.state === 'gameover') { this.start(); }
    }

    success() {
        this.state = 'correct';
        const timeBonus = Math.max(0, Math.floor((this.maxTime - this.levelTimer) / 120));
        const hintPenalty = this.hintPenalty ? 3 : 0;
        const points = Math.max(5, 15 + timeBonus - hintPenalty);
        this.score += points;
        this.feedback = 'correct';
        this.feedbackTimer = 90;
        const scoreEl = document.getElementById('game-score');
        if (scoreEl) scoreEl.textContent = this.score;
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: 260 + (Math.random() - 0.5) * 200, y: 250 + (Math.random() - 0.5) * 100,
                vx: (Math.random() - 0.5) * 5, vy: -Math.random() * 4 - 1,
                life: 25 + Math.random() * 15, color: ['#4caf50', '#ffd700', '#2196f3'][Math.floor(Math.random() * 3)], r: 3 + Math.random() * 2
            });
        }
    }

    nextLevel() {
        this.level++;
        if (this.level >= this.puzzles.length) {
            this.state = 'complete';
            this.onScore(this.score);
            return;
        }
        this.state = 'playing';
        this.setupLevel();
    }

    loop() {
        if (!this.running) return;
        this.animFrame++;
        if (this.state === 'playing') this.levelTimer++;
        const puzzle = this.puzzles[this.level % this.puzzles.length];
        if (puzzle.animate && this.state === 'playing') puzzle.animate(this.levelData);
        if (this.feedbackTimer > 0) this.feedbackTimer--;
        if (this.wrongFlash > 0) this.wrongFlash--;
        this.particles = this.particles.filter(p => { p.x += p.vx; p.y += p.vy; p.vy += 0.1; p.life--; return p.life > 0; });
        this.draw();
        this.raf = requestAnimationFrame(() => this.loop());
    }

    draw() {
        const c = this.ctx, W = this.canvas.width, H = this.canvas.height;

        const bgGrad = c.createLinearGradient(0, 0, 0, H);
        bgGrad.addColorStop(0, '#fafafa'); bgGrad.addColorStop(1, '#f0f0f0');
        c.fillStyle = bgGrad; c.fillRect(0, 0, W, H);

        if (this.state === 'complete') {
            const grad = c.createLinearGradient(0, 0, W, H);
            grad.addColorStop(0, '#667eea'); grad.addColorStop(0.5, '#764ba2'); grad.addColorStop(1, '#f093fb');
            c.fillStyle = grad; c.fillRect(0, 0, W, H);
            c.fillStyle = '#fff'; c.font = 'bold 40px "Segoe UI", Arial'; c.textAlign = 'center';
            c.fillText('\ud83e\udde0 PARAB\u00c9NS!', W / 2, H / 2 - 70);
            c.font = '22px Arial';
            c.fillText('Todas as ' + this.puzzles.length + ' fases completas!', W / 2, H / 2 - 25);
            c.font = 'bold 28px Arial';
            c.fillText(this.score + ' pontos', W / 2, H / 2 + 15);
            c.font = '16px Arial';
            c.fillText('Vidas restantes: ' + '\u2764\ufe0f'.repeat(this.lives), W / 2, H / 2 + 50);
            const pulse = 0.6 + Math.sin(this.animFrame * 0.05) * 0.4;
            c.globalAlpha = pulse;
            c.font = '16px Arial'; c.fillStyle = 'rgba(255,255,255,0.9)';
            c.fillText('Espa\u00e7o ou Clique para jogar novamente', W / 2, H / 2 + 90);
            c.globalAlpha = 1;
            return;
        }

        if (this.state === 'gameover') {
            c.fillStyle = 'rgba(0,0,0,0.6)'; c.fillRect(0, 0, W, H);
            c.fillStyle = '#fff';
            c.shadowColor = 'rgba(0,0,0,0.3)'; c.shadowBlur = 20;
            c.beginPath(); c.roundRect(W / 2 - 150, H / 2 - 100, 300, 200, 20); c.fill();
            c.shadowBlur = 0;
            c.fillStyle = '#e74c3c'; c.font = 'bold 32px "Segoe UI", Arial'; c.textAlign = 'center';
            c.fillText('Fim de Jogo!', W / 2, H / 2 - 50);
            c.fillStyle = '#333'; c.font = '18px Arial';
            c.fillText('Fase alcancada: ' + (this.level + 1) + '/' + this.puzzles.length, W / 2, H / 2 - 15);
            c.fillStyle = '#7c4dff'; c.font = 'bold 22px Arial';
            c.fillText(this.score + ' pontos', W / 2, H / 2 + 20);
            const pulse2 = 0.5 + Math.sin(this.animFrame * 0.06) * 0.5;
            c.globalAlpha = pulse2;
            c.fillStyle = '#888'; c.font = '14px Arial';
            c.fillText('Clique ou Espa\u00e7o para tentar de novo', W / 2, H / 2 + 65);
            c.globalAlpha = 1;
            return;
        }

        const puzzle = this.puzzles[this.level % this.puzzles.length];

        const headerGrad = c.createLinearGradient(0, 0, W, 0);
        headerGrad.addColorStop(0, '#667eea'); headerGrad.addColorStop(1, '#764ba2');
        c.fillStyle = headerGrad;
        c.beginPath(); c.roundRect(0, 0, W, 86, [0, 0, 12, 12]); c.fill();

        c.fillStyle = 'rgba(255,255,255,0.9)'; c.font = 'bold 12px Arial'; c.textAlign = 'left';
        c.fillText('FASE ' + (this.level + 1) + '/' + this.puzzles.length, 14, 20);

        c.fillStyle = '#fff'; c.font = '13px Arial'; c.textAlign = 'right';
        c.fillText(this.score + ' pts', W - 14, 20);

        c.fillStyle = 'rgba(255,255,255,0.9)'; c.font = '13px Arial'; c.textAlign = 'center';
        for (let i = 0; i < 3; i++) {
            c.fillText(i < this.lives ? '\u2764\ufe0f' : '\ud83d\udda4', W / 2 - 20 + i * 20, 20);
        }

        const progressW = W - 28;
        c.fillStyle = 'rgba(255,255,255,0.2)';
        c.beginPath(); c.roundRect(14, 28, progressW, 5, 3); c.fill();
        c.fillStyle = 'rgba(255,255,255,0.7)';
        c.beginPath(); c.roundRect(14, 28, progressW * ((this.level) / this.puzzles.length), 5, 3); c.fill();

        c.fillStyle = '#fff'; c.font = 'bold 18px "Segoe UI", Arial'; c.textAlign = 'center';
        c.fillText(puzzle.question, W / 2, 62);

        if (puzzle.draw) puzzle.draw(c, this.levelData, this.animFrame);

        c.fillStyle = '#e8e8e8'; c.beginPath(); c.roundRect(420, 440, 90, 32, 10); c.fill();
        c.strokeStyle = '#ccc'; c.lineWidth = 1; c.beginPath(); c.roundRect(420, 440, 90, 32, 10); c.stroke();
        c.fillStyle = '#888'; c.font = '12px Arial'; c.textAlign = 'center';
        c.fillText('\ud83d\udca1 Dica (H)', 465, 460);

        if (this.hintShown && puzzle.hint) {
            c.fillStyle = 'rgba(255, 243, 224, 0.97)';
            c.shadowColor = 'rgba(0,0,0,0.1)'; c.shadowBlur = 8;
            c.beginPath(); c.roundRect(25, 400, W - 50, 38, 10); c.fill();
            c.shadowBlur = 0;
            c.strokeStyle = '#ffb74d'; c.lineWidth = 1.5; c.beginPath(); c.roundRect(25, 400, W - 50, 38, 10); c.stroke();
            c.fillStyle = '#e65100'; c.font = '13px Arial'; c.textAlign = 'center';
            c.fillText(puzzle.hint, W / 2, 424);
        }

        this.particles.forEach(p => {
            c.globalAlpha = p.life / 30;
            c.fillStyle = p.color;
       