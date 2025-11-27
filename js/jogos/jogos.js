/**
 * Módulo de Jogos - Sistema de Jogos com Ranking
 * Gerencia jogos leves e sistema de pontuação por usuário
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
            'ghost_hunter': 'Caça-Fantasmas',
            'elephant_memory': 'Memória de Elefante',
            'destroyer': 'Destruidor',
            'galaxy_defender': 'Defensor da Galáxia'
        };
        const name = achievementNames[achievementId] || achievementId;
        
        const notification = document.createElement('div');
        notification.className = 'fixed top-4 right-4 z-50 bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-4 rounded-xl shadow-lg transform translate-x-full transition-transform duration-500';
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

        if (!this.rankings[gameId]) {
            this.rankings[gameId] = [];
        }

        this.rankings[gameId].push({
            username,
            nome,
            score,
            date: new Date().toISOString()
        });

        this.rankings[gameId].sort((a, b) => b.score - a.score);
        this.rankings[gameId] = this.rankings[gameId].slice(0, 100);

        // Update stats
        this.stats.gamesPlayed++;
        if (score > this.stats.bestScore) {
            this.stats.bestScore = score;
        }
        this.saveStats();

        // Check for first win achievement
        if (score > 0) {
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
        const container = document.getElementById('games-menu');
        if (!container) return;

        const games = [
            { id: 'snake', name: 'Jogo da Cobrinha', icon: 'zap', description: 'Com 5 fases, obstáculos e power-ups!' },
            { id: 'pacman', name: 'Pac-Man', icon: 'ghost', description: '3 níveis com IA melhorada e frutas bônus!' },
            { id: 'typing', name: 'Teste de Digitação', icon: 'keyboard', description: 'Teste sua velocidade de digitação!' },
            { id: 'memory', name: 'Jogo da Memória', icon: 'brain', description: '3 níveis de dificuldade com ícones de bicicleta!' },
            { id: 'spaceinvaders', name: 'Invasores Espaciais', icon: 'rocket', description: 'Defenda a Terra dos invasores espaciais!' },
            { id: 'breakout', name: 'Breakout', icon: 'square', description: '5 fases com power-ups e tijolos resistentes!' }
        ];

        // Stats and Achievements Section
        const statsHtml = `
            <div class="col-span-full bg-gradient-to-r from-blue-500/10 to-purple-600/10 dark:from-blue-500/20 dark:to-purple-600/20 p-6 rounded-xl border border-blue-200 dark:border-blue-800">
                <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-4 flex items-center gap-2">
                    <i data-lucide="bar-chart-2" class="w-5 h-5 text-blue-500"></i>
                    Suas Estatísticas
                </h3>
                <div class="grid grid-cols-3 gap-4 mb-6">
                    <div class="text-center">
                        <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">${this.stats.gamesPlayed}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Jogos</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">${this.stats.bestScore}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Melhor Pontuação</p>
                    </div>
                    <div class="text-center">
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">${Object.keys(this.achievements).length}</p>
                        <p class="text-sm text-slate-500 dark:text-slate-400">Conquistas</p>
                    </div>
                </div>
                <h4 class="text-md font-semibold text-slate-700 dark:text-slate-300 mb-3 flex items-center gap-2">
                    <i data-lucide="trophy" class="w-4 h-4 text-yellow-500"></i>
                    Conquistas
                </h4>
                <div class="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    ${this.renderAchievements()}
                </div>
            </div>
        `;

        container.innerHTML = games.map(game => `
            <div class="game-card bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:shadow-lg hover:border-blue-400 dark:hover:border-blue-500 transition-all transform hover:-translate-y-1" data-game="${game.id}">
                <div class="flex items-center justify-between mb-4">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <i data-lucide="${game.icon}" class="w-6 h-6 text-white"></i>
                    </div>
                    <div class="text-right">
                        <p class="text-xs text-slate-500 dark:text-slate-400">Seu Recorde</p>
                        <p class="text-lg font-bold text-blue-600 dark:text-blue-400">${this.getUserBestScore(game.id) || '-'}</p>
                    </div>
                </div>
                <h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mb-2">${game.name}</h3>
                <p class="text-sm text-slate-500 dark:text-slate-400">${game.description}</p>
            </div>
        `).join('') + statsHtml;

        lucide.createIcons();
        this.setupEventListeners();
    }

    renderAchievements() {
        const allAchievements = [
            { id: 'first_win', name: 'Primeira Vitória', icon: 'award', description: 'Complete qualquer jogo' },
            { id: 'snake_master', name: 'Mestre da Cobrinha', icon: 'zap', description: 'Alcance fase 5 no Snake' },
            { id: 'ghost_hunter', name: 'Caça-Fantasmas', icon: 'ghost', description: 'Complete todos os níveis do Pac-Man' },
            { id: 'elephant_memory', name: 'Memória de Elefante', icon: 'brain', description: 'Complete o modo difícil da memória' },
            { id: 'destroyer', name: 'Destruidor', icon: 'square', description: 'Complete todas as fases do Breakout' },
            { id: 'galaxy_defender', name: 'Defensor da Galáxia', icon: 'rocket', description: 'Derrote o boss do Space Invaders' }
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
                        <p class="font-bold text-lg ${isCurrentUser ? 'text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'}">${score.score.toLocaleString('pt-BR')}</p>
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
            pacman: { name: 'Pac-Man', class: PacmanGame },
            typing: { name: 'Teste de Digitação', class: TypingGame },
            memory: { name: 'Jogo da Memória', class: MemoryGame },
            spaceinvaders: { name: 'Invasores Espaciais', class: SpaceInvadersGame },
            breakout: { name: 'Breakout', class: BreakoutGame }
        };

        const game = games[gameId];
        if (!game) return;

        if (gameTitle) {
            gameTitle.textContent = game.name;
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
        this.food = this.generateFood();
        this.specialFood = null;
        this.powerUp = null;
        this.activePowerUp = null;
        this.powerUpTimer = 0;
        this.obstacles = [];
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
        // Obstacles appear from phase 3
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
                    (Math.abs(obstacle.x - 10) < 3 && Math.abs(obstacle.y - 10) < 3) // Keep spawn area clear
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
        
        // Slow-mo power-up effect
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

        // Ghost power-up allows passing through walls
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

        // Check collision with self
        if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.endGame();
            return;
        }

        // Check collision with obstacles (only if not ghost mode)
        if (this.activePowerUp !== 'ghost' && this.obstacles.some(obs => obs.x === head.x && obs.y === head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        // Check food collision
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
            
            // Check phase progression
            if (this.phaseProgress >= this.phaseTarget && this.phase < this.maxPhase) {
                this.phase++;
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

        // Update power-up timers
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
        const isDark = document.documentElement.classList.contains('dark');
        
        // Background with gradient
        const bgGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        if (isDark) {
            bgGradient.addColorStop(0, '#1e293b');
            bgGradient.addColorStop(1, '#0f172a');
        } else {
            bgGradient.addColorStop(0, '#f1f5f9');
            bgGradient.addColorStop(1, '#e2e8f0');
        }
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Grid pattern
        for (let i = 0; i < this.tileCount; i++) {
            for (let j = 0; j < this.tileCount; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
                    this.ctx.fillRect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
                }
            }
        }

        // Draw obstacles
        this.obstacles.forEach(obs => {
            const obsGradient = this.ctx.createRadialGradient(
                obs.x * this.gridSize + this.gridSize / 2,
                obs.y * this.gridSize + this.gridSize / 2,
                0,
                obs.x * this.gridSize + this.gridSize / 2,
                obs.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2
            );
            obsGradient.addColorStop(0, '#64748b');
            obsGradient.addColorStop(1, '#475569');
            this.ctx.fillStyle = obsGradient;
            this.ctx.fillRect(obs.x * this.gridSize + 2, obs.y * this.gridSize + 2, this.gridSize - 4, this.gridSize - 4);
        });

        // Draw snake with gradient (blue/purple theme)
        this.snake.forEach((seg, i) => {
            const gradient = this.ctx.createRadialGradient(
                seg.x * this.gridSize + this.gridSize / 2,
                seg.y * this.gridSize + this.gridSize / 2,
                0,
                seg.x * this.gridSize + this.gridSize / 2,
                seg.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2
            );
            
            if (i === 0) {
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(1, '#a855f7');
            } else {
                const ratio = i / this.snake.length;
                gradient.addColorStop(0, `rgba(59, 130, 246, ${1 - ratio * 0.5})`);
                gradient.addColorStop(1, `rgba(168, 85, 247, ${1 - ratio * 0.5})`);
            }
            
            // Ghost mode effect
            if (this.activePowerUp === 'ghost') {
                this.ctx.globalAlpha = 0.6 + Math.sin(Date.now() / 100) * 0.2;
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.beginPath();
            this.ctx.roundRect(
                seg.x * this.gridSize + 1,
                seg.y * this.gridSize + 1,
                this.gridSize - 2,
                this.gridSize - 2,
                4
            );
            this.ctx.fill();
            this.ctx.globalAlpha = 1;
        });

        // Draw food
        this.ctx.fillStyle = '#ef4444';
        this.ctx.beginPath();
        this.ctx.arc(
            this.food.x * this.gridSize + this.gridSize / 2,
            this.food.y * this.gridSize + this.gridSize / 2,
            this.gridSize / 2 - 2,
            0,
            Math.PI * 2
        );
        this.ctx.fill();

        // Food stem
        this.ctx.fillStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.moveTo(this.food.x * this.gridSize + this.gridSize / 2, this.food.y * this.gridSize + 2);
        this.ctx.lineTo(this.food.x * this.gridSize + this.gridSize / 2 + 3, this.food.y * this.gridSize + 6);
        this.ctx.lineTo(this.food.x * this.gridSize + this.gridSize / 2 - 3, this.food.y * this.gridSize + 6);
        this.ctx.closePath();
        this.ctx.fill();

        // Draw special food
        if (this.specialFood) {
            this.ctx.fillStyle = `rgba(250, 204, 21, ${0.5 + Math.sin(Date.now() / 100) * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(
                this.specialFood.x * this.gridSize + this.gridSize / 2,
                this.specialFood.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2 - 2,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fbbf24';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('★', this.specialFood.x * this.gridSize + this.gridSize / 2, this.specialFood.y * this.gridSize + this.gridSize / 2 + 4);
        }

        // Draw power-up
        if (this.powerUp) {
            const puType = this.powerUpTypes[this.powerUp.type];
            this.ctx.fillStyle = `rgba(${this.hexToRgb(puType.color)}, ${0.5 + Math.sin(Date.now() / 80) * 0.5})`;
            this.ctx.beginPath();
            this.ctx.arc(
                this.powerUp.x * this.gridSize + this.gridSize / 2,
                this.powerUp.y * this.gridSize + this.gridSize / 2,
                this.gridSize / 2 - 1,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(puType.icon, this.powerUp.x * this.gridSize + this.gridSize / 2, this.powerUp.y * this.gridSize + this.gridSize / 2 + 4);
        }

        // Draw active power-up indicator
        if (this.activePowerUp) {
            const puType = this.powerUpTypes[this.activePowerUp];
            this.ctx.fillStyle = puType.color;
            this.ctx.font = 'bold 12px Arial';
            this.ctx.textAlign = 'left';
            this.ctx.fillText(`${puType.icon} ${puType.name}: ${this.powerUpTimer}`, 5, 15);
        }

        // Draw phase progress bar
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(5, this.canvas.height - 15, this.canvas.width - 10, 10);
        
        const progressWidth = ((this.canvas.width - 10) * this.phaseProgress) / this.phaseTarget;
        const progressGradient = this.ctx.createLinearGradient(5, 0, 5 + progressWidth, 0);
        progressGradient.addColorStop(0, '#3b82f6');
        progressGradient.addColorStop(1, '#a855f7');
        this.ctx.fillStyle = progressGradient;
        this.ctx.fillRect(5, this.canvas.height - 15, progressWidth, 10);

        // Game over / Won screen
        if (this.gameOver || this.won) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? 'VOCÊ VENCEU!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`Pontuação: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText(`Fase: ${this.phase}/${this.maxPhase}`, this.canvas.width / 2, this.canvas.height / 2 + 35);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('Pressione ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 70);
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}` : '0, 0, 0';
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

class PacmanGame {
    constructor(canvas, onScore, manager) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.manager = manager;
        this.tileSize = 20;
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        // 3 different maps for levels
        this.maps = [
            // Level 1 - Original map
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
                [1,3,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,3,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,2,1,1,1,1,1,1,2,1,2,1,1,2,1],
                [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
                [1,1,1,1,2,1,1,1,0,1,1,0,1,1,1,2,1,1,1,1],
                [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
                [1,1,1,1,2,1,0,1,1,0,0,1,1,0,1,2,1,1,1,1],
                [0,0,0,0,2,0,0,1,0,0,0,0,1,0,0,2,0,0,0,0],
                [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
                [0,0,0,1,2,1,0,0,0,0,0,0,0,0,1,2,1,0,0,0],
                [1,1,1,1,2,1,0,1,1,1,1,1,1,0,1,2,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
                [1,3,2,1,2,2,2,2,2,2,2,2,2,2,2,2,1,2,3,1],
                [1,1,2,1,2,1,2,1,1,1,1,1,1,2,1,2,1,2,1,1],
                [1,2,2,2,2,1,2,2,2,1,1,2,2,2,1,2,2,2,2,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 2 - More complex maze
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,1,2,1,1,1,2,2,1,1,1,2,1,1,1,2,1],
                [1,3,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,3,1],
                [1,2,1,2,1,1,2,1,1,1,1,1,1,2,1,1,2,1,2,1],
                [1,2,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,2,1],
                [1,2,1,1,1,2,1,2,2,1,1,2,2,1,2,1,1,1,2,1],
                [1,2,2,2,2,2,1,2,0,0,0,0,2,1,2,2,2,2,2,1],
                [1,1,1,2,1,2,1,2,0,1,1,0,2,1,2,1,2,1,1,1],
                [0,0,0,2,1,2,2,2,0,0,0,0,2,2,2,1,2,0,0,0],
                [0,0,0,2,1,2,2,2,0,0,0,0,2,2,2,1,2,0,0,0],
                [1,1,1,2,1,2,1,2,1,1,1,1,2,1,2,1,2,1,1,1],
                [1,2,2,2,2,2,1,2,2,2,2,2,2,1,2,2,2,2,2,1],
                [1,2,1,1,1,2,1,1,1,2,2,1,1,1,2,1,1,1,2,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,2,1,2,1,1,1,2,1,1,1,1,2,1,1,1,2,1,2,1],
                [1,3,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,3,1],
                [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ],
            // Level 3 - Most complex maze
            [
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
                [1,3,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,3,1],
                [1,2,1,1,2,1,1,1,2,1,1,2,1,1,1,2,1,1,2,1],
                [1,2,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,2,1],
                [1,2,2,2,1,1,2,1,1,1,1,1,1,2,1,1,2,2,2,1],
                [1,2,1,2,2,2,2,2,2,1,1,2,2,2,2,2,2,1,2,1],
                [1,2,1,1,1,2,1,1,2,1,1,2,1,1,2,1,1,1,2,1],
                [1,2,2,2,2,2,2,2,0,0,0,0,2,2,2,2,2,2,2,1],
                [1,1,1,2,1,2,1,0,0,1,1,0,0,1,2,1,2,1,1,1],
                [0,0,0,2,1,2,2,0,0,0,0,0,0,2,2,1,2,0,0,0],
                [0,0,0,2,1,2,2,0,0,0,0,0,0,2,2,1,2,0,0,0],
                [1,1,1,2,1,2,1,1,1,1,1,1,1,1,2,1,2,1,1,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,2,1,1,1,2,1,1,1,1,1,1,1,1,2,1,1,1,2,1],
                [1,2,2,2,2,2,2,2,2,1,1,2,2,2,2,2,2,2,2,1],
                [1,2,1,2,1,1,1,2,1,1,1,1,2,1,1,1,2,1,2,1],
                [1,3,1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1,3,1],
                [1,2,1,1,2,1,1,1,1,1,1,1,1,1,1,2,1,1,2,1],
                [1,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,2,1],
                [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
            ]
        ];
        
        // Bonus fruits
        this.fruitTypes = [
            { name: 'cherry', color: '#ef4444', points: 100 },
            { name: 'strawberry', color: '#ec4899', points: 200 },
            { name: 'orange', color: '#f97316', points: 300 }
        ];
        
        this.level = 1;
        this.maxLevel = 3;
        this.running = false;
        this.reset();
        this.setupControls();
    }

    reset() {
        this.map = this.maps[this.level - 1].map(row => [...row]);
        this.pacman = { x: 10, y: 15, direction: 0, nextDirection: 0, mouthOpen: 0 };
        
        // Ghost speed increases with level
        const ghostSpeedMultiplier = 1 + (this.level - 1) * 0.15;
        this.ghosts = [
            { x: 9, y: 9, color: '#ef4444', direction: 0, mode: 'scatter', speed: ghostSpeedMultiplier, behavior: 'chase' },
            { x: 10, y: 9, color: '#ec4899', direction: 0, mode: 'scatter', speed: ghostSpeedMultiplier, behavior: 'ambush' },
            { x: 9, y: 10, color: '#06b6d4', direction: 0, mode: 'scatter', speed: ghostSpeedMultiplier, behavior: 'random' },
            { x: 10, y: 10, color: '#f97316', direction: 0, mode: 'scatter', speed: ghostSpeedMultiplier, behavior: 'patrol' }
        ];
        
        this.score = this.score || 0;
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        this.powerMode = false;
        this.powerTimer = 0;
        this.fruit = null;
        this.fruitTimer = 0;
        this.fruitSpawnTimer = 200;
        this.dots = [];
        
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 2) {
                    this.dots.push({ x, y, type: 'normal' });
                } else if (this.map[y][x] === 3) {
                    this.dots.push({ x, y, type: 'power' });
                }
            }
        }
        
        this.updateScoreDisplay();
    }

    setupControls() {
        this.keyHandler = (e) => {
            switch (e.key) {
                case 'ArrowUp':
                case 'w':
                    this.pacman.nextDirection = 3;
                    break;
                case 'ArrowDown':
                case 's':
                    this.pacman.nextDirection = 1;
                    break;
                case 'ArrowLeft':
                case 'a':
                    this.pacman.nextDirection = 2;
                    break;
                case 'ArrowRight':
                case 'd':
                    this.pacman.nextDirection = 0;
                    break;
                case ' ':
                    if (this.gameOver || this.won) {
                        this.level = 1;
                        this.score = 0;
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
    }

    gameLoop(timestamp) {
        if (!this.running) return;

        const speed = 150 - (this.level - 1) * 10; // Faster on higher levels
        
        if (timestamp - this.lastUpdate >= speed) {
            if (!this.gameOver && !this.won) {
                this.update();
            }
            this.lastUpdate = timestamp;
        }
        
        this.draw();
        this.animationId = requestAnimationFrame((ts) => this.gameLoop(ts));
    }

    canMove(x, y) {
        if (x < 0 || x >= 20 || y < 0 || y >= 20) return false;
        return this.map[y][x] !== 1;
    }

    // Improved ghost AI
    getGhostTarget(ghost) {
        const directions = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 0, y: -1 }
        ];
        
        if (this.powerMode) {
            // Run away from pacman when frightened
            return {
                x: this.pacman.x > 10 ? 0 : 19,
                y: this.pacman.y > 10 ? 0 : 19
            };
        }
        
        switch (ghost.behavior) {
            case 'chase':
                // Directly chase pacman
                return { x: this.pacman.x, y: this.pacman.y };
            case 'ambush':
                // Try to get ahead of pacman
                const dir = directions[this.pacman.direction];
                return {
                    x: this.pacman.x + dir.x * 4,
                    y: this.pacman.y + dir.y * 4
                };
            case 'patrol':
                // Patrol corners
                const corners = [[1, 1], [18, 1], [1, 18], [18, 18]];
                const corner = corners[Math.floor(Date.now() / 5000) % 4];
                return { x: corner[0], y: corner[1] };
            default:
                return { x: Math.random() * 20, y: Math.random() * 20 };
        }
    }

    moveGhostTowardsTarget(ghost, target) {
        const directions = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 0, y: -1 }
        ];
        
        const validDirs = [];
        directions.forEach((d, i) => {
            if (this.canMove(ghost.x + d.x, ghost.y + d.y) && i !== (ghost.direction + 2) % 4) {
                const newX = ghost.x + d.x;
                const newY = ghost.y + d.y;
                const dist = Math.abs(newX - target.x) + Math.abs(newY - target.y);
                validDirs.push({ dir: i, dist });
            }
        });
        
        if (validDirs.length > 0) {
            // Sort by distance to target (closest first for chase, farthest for flee)
            validDirs.sort((a, b) => this.powerMode ? b.dist - a.dist : a.dist - b.dist);
            
            // Add some randomness to make it less predictable
            if (Math.random() < 0.2 && validDirs.length > 1) {
                ghost.direction = validDirs[1].dir;
            } else {
                ghost.direction = validDirs[0].dir;
            }
        }
    }

    spawnFruit() {
        if (!this.fruit && Math.random() < 0.1) {
            const fruitType = this.fruitTypes[Math.min(this.level - 1, this.fruitTypes.length - 1)];
            // Find empty spot for fruit
            const emptySpots = [];
            for (let y = 0; y < 20; y++) {
                for (let x = 0; x < 20; x++) {
                    if (this.map[y][x] === 0 || this.map[y][x] === 2) {
                        emptySpots.push({ x, y });
                    }
                }
            }
            if (emptySpots.length > 0) {
                const spot = emptySpots[Math.floor(Math.random() * emptySpots.length)];
                this.fruit = {
                    x: spot.x,
                    y: spot.y,
                    ...fruitType,
                    timer: 200
                };
            }
        }
    }

    update() {
        this.pacman.mouthOpen = (this.pacman.mouthOpen + 0.3) % (Math.PI * 2);

        const directions = [
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
            { x: 0, y: -1 }
        ];

        const nextDir = directions[this.pacman.nextDirection];
        if (this.canMove(this.pacman.x + nextDir.x, this.pacman.y + nextDir.y)) {
            this.pacman.direction = this.pacman.nextDirection;
        }

        const dir = directions[this.pacman.direction];
        const newX = this.pacman.x + dir.x;
        const newY = this.pacman.y + dir.y;

        if (this.canMove(newX, newY)) {
            this.pacman.x = newX;
            this.pacman.y = newY;
        }

        // Tunnel wrap
        if (this.pacman.x < 0) this.pacman.x = 19;
        if (this.pacman.x > 19) this.pacman.x = 0;

        // Collect dots
        const dotIndex = this.dots.findIndex(d => d.x === this.pacman.x && d.y === this.pacman.y);
        if (dotIndex !== -1) {
            const dot = this.dots[dotIndex];
            if (dot.type === 'power') {
                this.score += 50;
                this.powerMode = true;
                this.powerTimer = 80 - (this.level - 1) * 10; // Shorter power mode on higher levels
                this.ghosts.forEach(g => g.mode = 'frightened');
            } else {
                this.score += 10;
            }
            this.dots.splice(dotIndex, 1);
            this.updateScoreDisplay();

            // Check level complete
            if (this.dots.length === 0) {
                if (this.level < this.maxLevel) {
                    this.level++;
                    this.reset();
                } else {
                    this.won = true;
                    this.onScore(this.score);
                    if (this.manager) {
                        this.manager.unlockAchievement('ghost_hunter');
                    }
                }
                return;
            }
        }

        // Collect fruit
        if (this.fruit && this.pacman.x === this.fruit.x && this.pacman.y === this.fruit.y) {
            this.score += this.fruit.points;
            this.fruit = null;
            this.updateScoreDisplay();
        }

        // Power mode timer
        if (this.powerMode) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.powerMode = false;
                this.ghosts.forEach(g => g.mode = 'scatter');
            }
        }

        // Fruit spawning and timer
        this.fruitSpawnTimer--;
        if (this.fruitSpawnTimer <= 0) {
            this.spawnFruit();
            this.fruitSpawnTimer = 200 + Math.random() * 200;
        }
        if (this.fruit) {
            this.fruit.timer--;
            if (this.fruit.timer <= 0) {
                this.fruit = null;
            }
        }

        // Update ghosts with improved AI
        this.ghosts.forEach(ghost => {
            const target = this.getGhostTarget(ghost);
            this.moveGhostTowardsTarget(ghost, target);

            const gDir = directions[ghost.direction];
            const gNewX = ghost.x + gDir.x;
            const gNewY = ghost.y + gDir.y;

            if (this.canMove(gNewX, gNewY)) {
                ghost.x = gNewX;
                ghost.y = gNewY;
            } else {
                // Try to find any valid direction
                const validDirs = [];
                directions.forEach((d, i) => {
                    if (this.canMove(ghost.x + d.x, ghost.y + d.y)) {
                        validDirs.push(i);
                    }
                });
                if (validDirs.length > 0) {
                    ghost.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
                }
            }

            // Ghost tunnel wrap
            if (ghost.x < 0) ghost.x = 19;
            if (ghost.x > 19) ghost.x = 0;

            // Collision with pacman
            if (ghost.x === this.pacman.x && ghost.y === this.pacman.y) {
                if (this.powerMode) {
                    this.score += 200;
                    ghost.x = 10;
                    ghost.y = 9;
                    this.updateScoreDisplay();
                } else {
                    this.lives--;
                    if (this.lives <= 0) {
                        this.endGame();
                    } else {
                        this.pacman.x = 10;
                        this.pacman.y = 15;
                        this.updateScoreDisplay();
                    }
                }
            }
        });
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Background with gradient
        const bgGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        bgGradient.addColorStop(0, isDark ? '#0f172a' : '#1e293b');
        bgGradient.addColorStop(1, isDark ? '#1e293b' : '#334155');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw maze with gradient walls
        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 1) {
                    const wallGradient = this.ctx.createLinearGradient(
                        x * this.tileSize, y * this.tileSize,
                        (x + 1) * this.tileSize, (y + 1) * this.tileSize
                    );
                    wallGradient.addColorStop(0, '#3b82f6');
                    wallGradient.addColorStop(1, '#a855f7');
                    this.ctx.fillStyle = wallGradient;
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        // Draw dots
        this.dots.forEach(dot => {
            if (dot.type === 'power') {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.beginPath();
                this.ctx.arc(
                    dot.x * this.tileSize + this.tileSize / 2,
                    dot.y * this.tileSize + this.tileSize / 2,
                    6 + Math.sin(Date.now() / 200) * 2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            } else {
                this.ctx.fillStyle = '#f1f5f9';
                this.ctx.beginPath();
                this.ctx.arc(
                    dot.x * this.tileSize + this.tileSize / 2,
                    dot.y * this.tileSize + this.tileSize / 2,
                    2,
                    0,
                    Math.PI * 2
                );
                this.ctx.fill();
            }
        });

        // Draw fruit
        if (this.fruit) {
            this.ctx.fillStyle = this.fruit.color;
            this.ctx.beginPath();
            this.ctx.arc(
                this.fruit.x * this.tileSize + this.tileSize / 2,
                this.fruit.y * this.tileSize + this.tileSize / 2,
                8,
                0,
                Math.PI * 2
            );
            this.ctx.fill();
            
            // Fruit stem
            this.ctx.fillStyle = '#22c55e';
            this.ctx.fillRect(
                this.fruit.x * this.tileSize + this.tileSize / 2 - 1,
                this.fruit.y * this.tileSize + 2,
                2,
                4
            );
        }

        // Draw pacman
        this.ctx.fillStyle = '#facc15';
        this.ctx.beginPath();
        const mouthAngle = Math.abs(Math.sin(this.pacman.mouthOpen)) * 0.5;
        const startAngle = this.pacman.direction * Math.PI / 2 + mouthAngle;
        const endAngle = this.pacman.direction * Math.PI / 2 + Math.PI * 2 - mouthAngle;
        this.ctx.arc(
            this.pacman.x * this.tileSize + this.tileSize / 2,
            this.pacman.y * this.tileSize + this.tileSize / 2,
            this.tileSize / 2 - 2,
            startAngle,
            endAngle
        );
        this.ctx.lineTo(this.pacman.x * this.tileSize + this.tileSize / 2, this.pacman.y * this.tileSize + this.tileSize / 2);
        this.ctx.fill();

        // Draw ghosts
        this.ghosts.forEach(ghost => {
            // Ghost body
            if (this.powerMode) {
                this.ctx.fillStyle = this.powerTimer < 20 && Math.floor(Date.now() / 200) % 2 === 0 ? '#fff' : '#3b82f6';
            } else {
                this.ctx.fillStyle = ghost.color;
            }
            this.ctx.beginPath();
            this.ctx.arc(
                ghost.x * this.tileSize + this.tileSize / 2,
                ghost.y * this.tileSize + this.tileSize / 2 - 2,
                this.tileSize / 2 - 2,
                Math.PI,
                0
            );
            this.ctx.lineTo(ghost.x * this.tileSize + this.tileSize - 2, ghost.y * this.tileSize + this.tileSize - 2);
            for (let i = 0; i < 3; i++) {
                const waveX = ghost.x * this.tileSize + 2 + (this.tileSize - 4) / 3 * (i + 0.5);
                this.ctx.lineTo(waveX, ghost.y * this.tileSize + this.tileSize - 6);
                this.ctx.lineTo(ghost.x * this.tileSize + 2 + (this.tileSize - 4) / 3 * (i + 1), ghost.y * this.tileSize + this.tileSize - 2);
            }
            this.ctx.closePath();
            this.ctx.fill();

            // Ghost eyes
            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(ghost.x * this.tileSize + 7, ghost.y * this.tileSize + 8, 3, 0, Math.PI * 2);
            this.ctx.arc(ghost.x * this.tileSize + 13, ghost.y * this.tileSize + 8, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = this.powerMode ? '#fff' : '#000';
            this.ctx.beginPath();
            this.ctx.arc(ghost.x * this.tileSize + 7, ghost.y * this.tileSize + 8, 1.5, 0, Math.PI * 2);
            this.ctx.arc(ghost.x * this.tileSize + 13, ghost.y * this.tileSize + 8, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw lives
        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.arc(20 + i * 25, this.canvas.height - 15, 8, 0.25 * Math.PI, 1.75 * Math.PI);
            this.ctx.lineTo(20 + i * 25, this.canvas.height - 15);
            this.ctx.fill();
        }

        // Draw level indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 12px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Nível ${this.level}/${this.maxLevel}`, this.canvas.width - 10, this.canvas.height - 8);

        // Game over / Won screen
        if (this.gameOver || this.won) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? 'VOCÊ VENCEU!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 10);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`Pontuação: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 20);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('Pressione ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 55);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const livesEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = `Vidas: ${this.lives} | Nível ${this.level}`;
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
        
        // Expanded Portuguese word list
        this.portugueseWords = [
            // Common words
            'casa', 'bola', 'vida', 'amor', 'tempo', 'mundo', 'coisa', 'pessoa', 'olho', 'mao',
            'lugar', 'parte', 'forma', 'lado', 'hora', 'ponto', 'agua', 'nome', 'terra', 'cidade',
            'trabalho', 'momento', 'governo', 'empresa', 'projeto', 'sistema', 'problema', 'processo',
            'desenvolvimento', 'informacao', 'tecnologia', 'conhecimento', 'comunicacao', 'educacao',
            // Day to day words
            'hoje', 'ontem', 'amanha', 'agora', 'sempre', 'nunca', 'muito', 'pouco', 'mais', 'menos',
            'bem', 'mal', 'sim', 'nao', 'talvez', 'aqui', 'ali', 'la', 'onde', 'quando',
            'como', 'porque', 'para', 'com', 'sem', 'sobre', 'entre', 'desde', 'ate', 'apos',
            // Common verbs
            'ser', 'estar', 'ter', 'fazer', 'poder', 'dizer', 'dar', 'ver', 'saber', 'querer',
            'chegar', 'passar', 'ficar', 'deixar', 'parecer', 'levar', 'seguir', 'encontrar', 'chamar', 'vir',
            'pensar', 'sair', 'voltar', 'tomar', 'conhecer', 'viver', 'sentir', 'criar', 'falar', 'trazer',
            'lembrar', 'acabar', 'comecar', 'mostrar', 'ouvir', 'continuar', 'aprender', 'entender', 'perder', 'ganhar',
            // Common nouns
            'familia', 'amigo', 'crianca', 'homem', 'mulher', 'pai', 'mae', 'filho', 'filha', 'irmao',
            'escola', 'livro', 'porta', 'janela', 'mesa', 'cadeira', 'carro', 'rua', 'praia', 'sol',
            'lua', 'estrela', 'flor', 'arvore', 'animal', 'cachorro', 'gato', 'passaro', 'peixe', 'comida',
            'roupa', 'sapato', 'bolsa', 'telefone', 'computador', 'musica', 'filme', 'jogo', 'festa', 'viagem',
            // Common adjectives
            'bom', 'mau', 'grande', 'pequeno', 'novo', 'velho', 'jovem', 'bonito', 'feio', 'forte',
            'fraco', 'rapido', 'lento', 'alto', 'baixo', 'largo', 'estreito', 'longo', 'curto', 'cheio',
            'vazio', 'quente', 'frio', 'claro', 'escuro', 'limpo', 'sujo', 'facil', 'dificil', 'certo',
            'errado', 'feliz', 'triste', 'rico', 'pobre', 'doce', 'amargo', 'salgado', 'azedo', 'macio',
            // Numbers as words
            'um', 'dois', 'tres', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove', 'dez',
            'cem', 'mil', 'primeiro', 'segundo', 'terceiro', 'ultimo', 'metade', 'dobro', 'triplo', 'zero',
            // More useful words
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
        
        // Game settings
        this.language = 'pt'; // 'pt' or 'en'
        this.includePunctuation = false;
        this.includeNumbers = false;
        this.gameMode = 'time'; // 'time' or 'words'
        this.timeLimit = 30;
        this.wordLimit = 25;
        
        // Game state
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
                #typing-game-ui .word.current { border-bottom: 2px solid #3b82f6; }
                #typing-game-ui .caret {
                    position: absolute;
                    width: 2px;
                    height: 1.5em;
                    background: #3b82f6;
                    animation: caret-blink 1s infinite;
                    transition: left 0.08s ease-out, top 0.08s ease-out;
                }
                @keyframes caret-blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
                #typing-game-ui .typing-input-hidden {
                    position: absolute;
                    opacity: 0;
                    pointer-events: none;
                }
                #typing-game-ui .stats-row { display: flex; gap: 2rem; justify-content: center; margin-bottom: 1rem; }
                #typing-game-ui .stat-item { text-align: center; }
                #typing-game-ui .stat-value { font-size: 2rem; font-weight: bold; color: #3b82f6; }
                #typing-game-ui .stat-label { font-size: 0.75rem; color: #64748b; text-transform: uppercase; }
                #typing-game-ui .options-bar { 
                    display: flex; 
                    flex-wrap: wrap;
                    gap: 0.75rem; 
                    justify-content: center; 
                    align-items: center;
                    margin-bottom: 1rem; 
                    padding: 0.75rem;
                    background: rgba(30, 41, 59, 0.5);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(71, 85, 105, 0.3);
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
                #typing-game-ui .toggle-btn.active { color: #3b82f6; background: rgba(59, 130, 246, 0.15); }
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
                #typing-game-ui .mode-btn.active { color: #3b82f6; }
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
                #typing-game-ui .value-btn.active { color: #3b82f6; }
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
                #typing-game-ui .lang-btn.active { color: #3b82f6; }
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
                    background: rgba(15, 23, 42, 0.6);
                    border-radius: 0.5rem;
                    border: 1px solid rgba(71, 85, 105, 0.3);
                    cursor: text;
                }
                #typing-game-ui .focus-warning {
                    position: absolute;
                    top: 50%;
                    left: 50%;
                    transform: translate(-50%, -50%);
                    background: rgba(15, 23, 42, 0.95);
                    padding: 1rem 2rem;
                    border-radius: 0.5rem;
                    color: #94a3b8;
                    font-size: 0.95rem;
                    display: none;
                    z-index: 10;
                    border: 1px solid rgba(71, 85, 105, 0.5);
                }
                #typing-game-ui .words-container.blur .words-wrap { filter: blur(5px); pointer-events: none; }
                #typing-game-ui .words-container.blur .focus-warning { display: flex; align-items: center; }
                #typing-game-ui .result-screen {
                    text-align: center;
                    padding: 2rem;
                }
                #typing-game-ui .result-wpm { font-size: 4rem; color: #3b82f6; font-weight: bold; }
                #typing-game-ui .result-label { color: #64748b; font-size: 1rem; margin-bottom: 0.5rem; text-transform: uppercase; }
                #typing-game-ui .result-stats { 
                    display: flex; 
                    justify-content: center; 
                    gap: 2.5rem; 
                    margin-top: 1.5rem;
                    flex-wrap: wrap;
                }
                #typing-game-ui .result-stat-value { font-size: 1.5rem; color: #e2e8f0; font-weight: 600; }
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
                    background: rgba(59, 130, 246, 0.15);
                    border: 1px solid rgba(59, 130, 246, 0.3);
                    border-radius: 0.5rem;
                    color: #3b82f6;
                    cursor: pointer;
                    transition: all 0.2s;
                    font-size: 0.9rem;
                    font-weight: 500;
                }
                #typing-game-ui .restart-btn:hover {
                    background: rgba(59, 130, 246, 0.25);
                    border-color: rgba(59, 130, 246, 0.5);
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
                    color: #3b82f6;
                    background: rgba(59, 130, 246, 0.1);
                }
            </style>
            
            <div class="bg-slate-800 rounded-xl p-6 border border-slate-700">
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
                <div class="words-container blur" id="words-container">
                    <div class="focus-warning">
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
                <div id="typing-results" class="result-screen hidden">
                    <div class="result-label">wpm</div>
                    <div class="result-wpm" id="result-wpm">0</div>
                    <div class="result-stats">
                        <div class="stat-item">
                            <div class="result-stat-value" id="result-accuracy">100%</div>
                            <div class="stat-label">precisão</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value" id="result-correct">0</div>
                            <div class="result-stat-detail">corretos</div>
                            <div class="stat-label">caracteres</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value" id="result-incorrect">0</div>
                            <div class="result-stat-detail">incorretos</div>
                            <div class="stat-label">caracteres</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value" id="result-extra">0</div>
                            <div class="result-stat-detail">extras</div>
                            <div class="stat-label">caracteres</div>
                        </div>
                        <div class="stat-item">
                            <div class="result-stat-value" id="result-time">0s</div>
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
        
        // Cache DOM elements
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
        // Punctuation toggle
        const punctToggle = document.getElementById('punctuation-toggle');
        punctToggle.addEventListener('click', () => {
            if (this.running) return;
            this.includePunctuation = !this.includePunctuation;
            punctToggle.classList.toggle('active', this.includePunctuation);
            this.reset();
        });
        
        // Numbers toggle
        const numToggle = document.getElementById('numbers-toggle');
        numToggle.addEventListener('click', () => {
            if (this.running) return;
            this.includeNumbers = !this.includeNumbers;
            numToggle.classList.toggle('active', this.includeNumbers);
            this.reset();
        });
        
        // Game mode buttons
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
        
        // Time value buttons
        typingUI.querySelectorAll('#time-values .value-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.running) return;
                typingUI.querySelectorAll('#time-values .value-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.timeLimit = parseInt(btn.dataset.time);
                this.reset();
            });
        });
        
        // Word value buttons
        typingUI.querySelectorAll('#word-values .value-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if (this.running) return;
                typingUI.querySelectorAll('#word-values .value-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.wordLimit = parseInt(btn.dataset.words);
                this.reset();
            });
        });
        
        // Language buttons
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
        
        // Restart buttons
        document.getElementById('restart-btn').addEventListener('click', () => {
            this.reset();
            this.focusInput();
        });
        
        document.getElementById('result-restart-btn').addEventListener('click', () => {
            this.reset();
            this.focusInput();
        });
        
        // Words container click
        this.wordsContainer.addEventListener('click', () => this.focusInput());
        
        // Input events
        this.input.addEventListener('input', () => this.handleInput());
        this.input.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.input.addEventListener('blur', () => this.handleBlur());
        this.input.addEventListener('focus', () => this.handleFocus());
        
        // Tab + Enter restart
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
        
        // Reset live stats
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
        
        // Add punctuation randomly
        if (this.includePunctuation && Math.random() < 0.15) {
            const punct = this.punctuationMarks[Math.floor(Math.random() * this.punctuationMarks.length)];
            word = word + punct;
        }
        
        // Add numbers randomly
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
                // Words mode - count up
                if (timeEl) timeEl.textContent = elapsed;
            }
            
            // Update live WPM and accuracy
            this.updateLiveStats();
        }, 100);
    }
    
    updateLiveStats() {
        const wpmEl = document.getElementById('typing-wpm');
        const accEl = document.getElementById('typing-accuracy');
        const wordsProgress = document.getElementById('typing-words-progress');
        
        // Calculate live WPM
        const elapsedMinutes = this.elapsedTime / 60;
        const liveWpm = elapsedMinutes > 0 ? Math.round((this.correctChars / 5) / elapsedMinutes) : 0;
        
        // Calculate live accuracy
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
        
        // Remove event listeners
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
            
            // Count correct, incorrect, and extra characters
            for (let i = 0; i < Math.max(wordTyped.length, currentWord.length); i++) {
                this.totalTyped++;
                if (i < currentWord.length && i < wordTyped.length) {
                    if (wordTyped[i] === currentWord[i]) {
                        this.correctChars++;
                    } else {
                        this.incorrectChars++;
                    }
                } else if (i >= currentWord.length) {
                    // Extra characters - only count as extra, not as incorrect
                    this.extraChars++;
                } else {
                    // Missing characters
                    this.incorrectChars++;
                }
            }
            
            this.wordsCompleted++;
            this.currentWordIndex++;
            this.input.value = '';
            
            // Check if words mode is complete
            if (this.gameMode === 'words' && this.wordsCompleted >= this.wordLimit) {
                this.endGame();
                return;
            }
            
            // Generate more words if needed
            if (this.currentWordIndex >= this.testWords.length) {
                if (this.gameMode === 'time') {
                    // In time mode, regenerate words using helper method
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
        
        // Calculate final stats
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
        
        // Update result display
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
        
        // Bicycle-themed icons
        this.allIcons = ['bike', 'circle', 'hard-hat', 'map', 'route', 'compass', 'mountain', 'flag', 'trophy', 'medal', 'timer', 'gauge'];
        
        // Difficulty settings
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
        memoryUI.className = 'w-full max-w-lg mx-auto';
        memoryUI.innerHTML = `
            <div id="memory-difficulty-selector" class="flex gap-2 mb-4 justify-center">
                <button data-diff="easy" class="diff-btn px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">Fácil (3x4)</button>
                <button data-diff="medium" class="diff-btn px-4 py-2 rounded-lg bg-blue-500 text-white">Médio (4x4)</button>
                <button data-diff="hard" class="diff-btn px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors">Difícil (4x6)</button>
            </div>
            
            <div class="flex justify-between items-center mb-4">
                <div class="text-center">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Movimentos</p>
                    <p id="memory-moves" class="text-2xl font-bold text-slate-800 dark:text-slate-200">0</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Pares</p>
                    <p id="memory-pairs" class="text-2xl font-bold text-blue-600 dark:text-blue-400">0/8</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Combo</p>
                    <p id="memory-combo" class="text-2xl font-bold text-purple-600 dark:text-purple-400">x1</p>
                </div>
                <div class="text-center">
                    <p class="text-sm text-slate-500 dark:text-slate-400">Tempo</p>
                    <p id="memory-time" class="text-2xl font-bold text-green-600 dark:text-green-400">0:00</p>
                </div>
            </div>
            
            <div id="memory-grid" class="grid gap-3 mb-4"></div>
            
            <button id="memory-reset" class="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-lg font-medium transition-all flex items-center justify-center gap-2 shadow-lg">
                <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                Novo Jogo
            </button>
        `;
        
        this.container.appendChild(memoryUI);
        
        // Setup difficulty buttons
        memoryUI.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficulty = btn.dataset.diff;
                this.updateDifficultyButtons();
                this.reset();
            });
        });
        
        document.getElementById('memory-reset').addEventListener('click', () => this.reset());
        
        lucide.createIcons();
        this.reset();
    }

    updateDifficultyButtons() {
        const btns = document.querySelectorAll('#memory-difficulty-selector .diff-btn');
        btns.forEach(btn => {
            if (btn.dataset.diff === this.difficulty) {
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
        
        // Update grid layout
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
        grid.innerHTML = this.cards.map(card => `
            <div class="memory-card aspect-square rounded-xl cursor-pointer transition-all duration-300 transform ${card.animating ? 'scale-110' : 'hover:scale-105'} ${card.matched ? 'opacity-80' : ''}" data-id="${card.id}">
                <div class="w-full h-full ${card.flipped || card.matched ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'} rounded-xl flex items-center justify-center shadow-lg border-2 ${card.matched ? 'border-green-400' : 'border-transparent'}">
                    ${card.flipped || card.matched ? `<i data-lucide="${card.icon}" class="w-8 h-8 text-white"></i>` : '<i data-lucide="help-circle" class="w-8 h-8 text-slate-400"></i>'}
                </div>
            </div>
        `).join('');
        
        lucide.createIcons();
        
        grid.querySelectorAll('.memory-card').forEach(cardEl => {
            cardEl.addEventListener('click', () => {
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
                
                // Combo system
                const now = Date.now();
                if (now - this.lastMatchTime < 3000) {
                    this.comboCount = Math.min(this.comboCount + 1, 5);
                } else {
                    this.comboCount = 1;
                }
                this.lastMatchTime = now;
                
                // Score with combo bonus
                const baseScore = this.difficulty === 'hard' ? 150 : this.difficulty === 'medium' ? 100 : 50;
                this.score += baseScore * this.comboCount;
                
                this.flippedCards = [];
                this.updateStats();
                this.renderGrid();
                
                // Reset animation
                setTimeout(() => {
                    first.animating = false;
                    second.animating = false;
                    this.renderGrid();
                }, 300);
                
                if (this.matchedPairs === this.icons.length) {
                    this.endGame();
                }
            } else {
                // Reset combo on miss
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
        // Game starts on first card flip
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
        
        // Time bonus
        const timeBonus = Math.max(0, 300 - elapsed) * 2;
        
        // Efficiency bonus (fewer moves = better)
        const minMoves = this.icons.length;
        const efficiencyBonus = Math.max(0, (minMoves * 3 - this.moves)) * 20;
        
        const finalScore = this.score + timeBonus + efficiencyBonus;
        
        // Check for hard mode achievement
        if (this.difficulty === 'hard' && this.manager) {
            this.manager.unlockAchievement('elephant_memory');
        }
        
        setTimeout(() => {
            alert(`Parabéns! Você completou em ${this.moves} movimentos!\nTempo: ${Math.floor(elapsed / 60)}:${(elapsed % 60).toString().padStart(2, '0')}\nPontuação: ${finalScore}`);
            this.onScore(finalScore);
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
        
        this.running = false;
        this.reset();
        this.setupControls();
    }

    reset() {
        // Player ship
        this.player = {
            x: this.canvas.width / 2 - 20,
            y: this.canvas.height - 50,
            width: 40,
            height: 30,
            speed: 6,
            hasShield: false,
            shieldTimer: 0,
            hasTripleShot: false,
            tripleShotTimer: 0,
            speedBoost: false,
            speedBoostTimer: 0
        };
        
        // Bullets
        this.bullets = [];
        this.enemyBullets = [];
        this.lastShot = 0;
        this.shootCooldown = 200;
        
        // Enemies
        this.enemies = [];
        this.wave = 1;
        this.maxWave = 5;
        this.enemyDirection = 1;
        this.enemyDropAmount = 20;
        this.enemyMoveTimer = 0;
        this.enemyMoveInterval = 800;
        
        // Power-ups
        this.powerUps = [];
        
        // Special enemy
        this.specialEnemy = null;
        this.specialEnemyTimer = 0;
        
        // Boss
        this.boss = null;
        this.bossActive = false;
        
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        
        this.keys = { left: false, right: false, shoot: false };
        
        this.spawnWave();
        this.updateScoreDisplay();
    }

    spawnWave() {
        this.enemies = [];
        const rows = 3 + Math.min(this.wave - 1, 2);
        const cols = 6 + Math.min(this.wave - 1, 2);
        const enemyWidth = 30;
        const enemyHeight = 24;
        const padding = 8;
        const offsetLeft = (this.canvas.width - (cols * (enemyWidth + padding))) / 2;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const health = row === 0 ? 1 : (row === 1 ? 1 : 2);
                this.enemies.push({
                    x: offsetLeft + col * (enemyWidth + padding),
                    y: 40 + row * (enemyHeight + padding),
                    width: enemyWidth,
                    height: enemyHeight,
                    health: health,
                    maxHealth: health,
                    points: (rows - row) * 10 * this.wave,
                    type: row % 3 // Different enemy types
                });
            }
        }
        
        // Speed up enemy movement on higher waves
        this.enemyMoveInterval = Math.max(300, 800 - (this.wave - 1) * 100);
    }

    spawnBoss() {
        this.bossActive = true;
        this.boss = {
            x: this.canvas.width / 2 - 50,
            y: 40,
            width: 100,
            height: 60,
            health: 20 + (this.wave - 1) * 10,
            maxHealth: 20 + (this.wave - 1) * 10,
            direction: 1,
            speed: 2,
            lastShot: 0,
            shootCooldown: 1500 - (this.wave - 1) * 200,
            points: 500 * this.wave
        };
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.15) {
            const types = ['triple', 'shield', 'speed', 'life'];
            const type = types[Math.floor(Math.random() * types.length)];
            this.powerUps.push({
                x,
                y,
                type,
                width: 20,
                height: 20,
                speed: 2
            });
        }
    }

    spawnSpecialEnemy() {
        if (!this.specialEnemy && Math.random() < 0.01) {
            this.specialEnemy = {
                x: -40,
                y: 20,
                width: 40,
                height: 20,
                speed: 3,
                points: 100 * this.wave
            };
        }
    }

    setupControls() {
        this.keyDownHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') this.keys.right = true;
            if (e.key === ' ') {
                e.preventDefault();
                if (this.gameOver || this.won) {
                    this.reset();
                    this.start();
                } else {
                    this.keys.shoot = true;
                }
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
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
    }

    gameLoop() {
        if (!this.running) return;

        const now = Date.now();
        const delta = now - this.lastUpdate;
        
        if (!this.gameOver && !this.won) {
            this.update(delta);
        }
        
        this.draw();
        this.lastUpdate = now;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShot < this.shootCooldown) return;
        
        this.lastShot = now;
        
        if (this.player.hasTripleShot) {
            // Triple shot
            this.bullets.push({ x: this.player.x + this.player.width / 2 - 2, y: this.player.y, dx: 0, dy: -8 });
            this.bullets.push({ x: this.player.x + this.player.width / 2 - 2, y: this.player.y, dx: -2, dy: -8 });
            this.bullets.push({ x: this.player.x + this.player.width / 2 - 2, y: this.player.y, dx: 2, dy: -8 });
        } else {
            this.bullets.push({ x: this.player.x + this.player.width / 2 - 2, y: this.player.y, dx: 0, dy: -8 });
        }
    }

    update(delta) {
        // Update power-up timers
        if (this.player.hasShield) {
            this.player.shieldTimer -= delta;
            if (this.player.shieldTimer <= 0) this.player.hasShield = false;
        }
        if (this.player.hasTripleShot) {
            this.player.tripleShotTimer -= delta;
            if (this.player.tripleShotTimer <= 0) this.player.hasTripleShot = false;
        }
        if (this.player.speedBoost) {
            this.player.speedBoostTimer -= delta;
            if (this.player.speedBoostTimer <= 0) this.player.speedBoost = false;
        }
        
        // Player movement
        const speed = this.player.speedBoost ? this.player.speed * 1.5 : this.player.speed;
        if (this.keys.left && this.player.x > 0) {
            this.player.x -= speed;
        }
        if (this.keys.right && this.player.x < this.canvas.width - this.player.width) {
            this.player.x += speed;
        }
        
        // Shooting
        if (this.keys.shoot) {
            this.shoot();
        }
        
        // Update bullets
        this.bullets = this.bullets.filter(bullet => {
            bullet.x += bullet.dx;
            bullet.y += bullet.dy;
            return bullet.y > -10;
        });
        
        // Update enemy bullets
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.y += bullet.dy;
            return bullet.y < this.canvas.height + 10;
        });
        
        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            
            // Check collision with player
            if (this.checkCollision(powerUp, this.player)) {
                switch (powerUp.type) {
                    case 'triple':
                        this.player.hasTripleShot = true;
                        this.player.tripleShotTimer = 8000;
                        break;
                    case 'shield':
                        this.player.hasShield = true;
                        this.player.shieldTimer = 5000;
                        break;
                    case 'speed':
                        this.player.speedBoost = true;
                        this.player.speedBoostTimer = 6000;
                        break;
                    case 'life':
                        this.lives = Math.min(this.lives + 1, 5);
                        this.updateScoreDisplay();
                        break;
                }
                return false;
            }
            
            return powerUp.y < this.canvas.height;
        });
        
        // Update special enemy
        if (this.specialEnemy) {
            this.specialEnemy.x += this.specialEnemy.speed;
            if (this.specialEnemy.x > this.canvas.width) {
                this.specialEnemy = null;
            }
        }
        this.spawnSpecialEnemy();
        
        // Boss logic
        if (this.bossActive && this.boss) {
            // Boss movement
            this.boss.x += this.boss.speed * this.boss.direction;
            if (this.boss.x <= 0 || this.boss.x + this.boss.width >= this.canvas.width) {
                this.boss.direction *= -1;
            }
            
            // Boss shooting
            const now = Date.now();
            if (now - this.boss.lastShot > this.boss.shootCooldown) {
                this.boss.lastShot = now;
                // Boss shoots multiple bullets
                this.enemyBullets.push({ x: this.boss.x + 20, y: this.boss.y + this.boss.height, dy: 4 });
                this.enemyBullets.push({ x: this.boss.x + this.boss.width / 2, y: this.boss.y + this.boss.height, dy: 4 });
                this.enemyBullets.push({ x: this.boss.x + this.boss.width - 20, y: this.boss.y + this.boss.height, dy: 4 });
            }
            
            // Check bullet collision with boss
            this.bullets = this.bullets.filter(bullet => {
                const bulletRect = { x: bullet.x, y: bullet.y, width: 4, height: 10 };
                if (this.checkCollision(bulletRect, this.boss)) {
                    this.boss.health--;
                    if (this.boss.health <= 0) {
                        this.score += this.boss.points;
                        this.bossActive = false;
                        this.boss = null;
                        
                        // Win condition - defeated boss on wave 5
                        if (this.wave >= this.maxWave) {
                            this.won = true;
                            this.onScore(this.score);
                            if (this.manager) {
                                this.manager.unlockAchievement('galaxy_defender');
                            }
                        } else {
                            this.wave++;
                            this.spawnWave();
                        }
                        this.updateScoreDisplay();
                    }
                    return false;
                }
                return true;
            });
        } else {
            // Regular enemy logic
            this.enemyMoveTimer += delta;
            
            if (this.enemyMoveTimer >= this.enemyMoveInterval) {
                this.enemyMoveTimer = 0;
                
                // Check if enemies need to move down
                let needsToMoveDown = false;
                this.enemies.forEach(enemy => {
                    if ((this.enemyDirection > 0 && enemy.x + enemy.width >= this.canvas.width - 10) ||
                        (this.enemyDirection < 0 && enemy.x <= 10)) {
                        needsToMoveDown = true;
                    }
                });
                
                if (needsToMoveDown) {
                    this.enemies.forEach(enemy => {
                        enemy.y += this.enemyDropAmount;
                    });
                    this.enemyDirection *= -1;
                } else {
                    this.enemies.forEach(enemy => {
                        enemy.x += 15 * this.enemyDirection;
                    });
                }
                
                // Enemy shooting
                if (this.enemies.length > 0 && Math.random() < 0.3 + (this.wave * 0.1)) {
                    const shooter = this.enemies[Math.floor(Math.random() * this.enemies.length)];
                    this.enemyBullets.push({
                        x: shooter.x + shooter.width / 2,
                        y: shooter.y + shooter.height,
                        dy: 3 + this.wave * 0.5
                    });
                }
            }
        }
        
        // Check bullet collision with enemies
        this.bullets = this.bullets.filter(bullet => {
            const bulletRect = { x: bullet.x, y: bullet.y, width: 4, height: 10 };
            
            // Check special enemy
            if (this.specialEnemy && this.checkCollision(bulletRect, this.specialEnemy)) {
                this.score += this.specialEnemy.points;
                this.spawnPowerUp(this.specialEnemy.x, this.specialEnemy.y);
                this.specialEnemy = null;
                this.updateScoreDisplay();
                return false;
            }
            
            // Check regular enemies
            for (let i = this.enemies.length - 1; i >= 0; i--) {
                if (this.checkCollision(bulletRect, this.enemies[i])) {
                    this.enemies[i].health--;
                    if (this.enemies[i].health <= 0) {
                        this.score += this.enemies[i].points;
                        this.spawnPowerUp(this.enemies[i].x, this.enemies[i].y);
                        this.enemies.splice(i, 1);
                        this.updateScoreDisplay();
                        
                        // Check if wave complete
                        if (this.enemies.length === 0 && !this.bossActive) {
                            if (this.wave % 5 === 0) {
                                this.spawnBoss();
                            } else if (this.wave < this.maxWave) {
                                this.wave++;
                                this.spawnWave();
                            } else {
                                this.spawnBoss();
                            }
                            this.updateScoreDisplay();
                        }
                    }
                    return false;
                }
            }
            return true;
        });
        
        // Check enemy bullet collision with player
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            const bulletRect = { x: bullet.x - 3, y: bullet.y, width: 6, height: 10 };
            if (this.checkCollision(bulletRect, this.player)) {
                if (!this.player.hasShield) {
                    this.lives--;
                    this.updateScoreDisplay();
                    if (this.lives <= 0) {
                        this.endGame();
                    }
                }
                return false;
            }
            return true;
        });
        
        // Check if enemies reached player
        this.enemies.forEach(enemy => {
            if (enemy.y + enemy.height >= this.player.y) {
                this.endGame();
            }
        });
    }

    checkCollision(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Background with stars
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(1, '#1e293b');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw stars
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 37) % this.canvas.width;
            const y = (i * 53 + Date.now() / 50) % this.canvas.height;
            this.ctx.fillRect(x, y, 1, 1);
        }
        
        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            const colors = {
                triple: '#eab308',
                shield: '#06b6d4',
                speed: '#22c55e',
                life: '#ef4444'
            };
            const icons = {
                triple: '⚡',
                shield: '🛡',
                speed: '💨',
                life: '❤'
            };
            
            this.ctx.fillStyle = colors[powerUp.type];
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + 10, powerUp.y + 10, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(icons[powerUp.type], powerUp.x + 10, powerUp.y + 14);
        });
        
        // Draw enemies with blue/purple gradient
        this.enemies.forEach(enemy => {
            const gradient = this.ctx.createLinearGradient(enemy.x, enemy.y, enemy.x + enemy.width, enemy.y + enemy.height);
            const healthRatio = enemy.health / enemy.maxHealth;
            
            if (enemy.type === 0) {
                gradient.addColorStop(0, '#3b82f6');
                gradient.addColorStop(1, '#8b5cf6');
            } else if (enemy.type === 1) {
                gradient.addColorStop(0, '#6366f1');
                gradient.addColorStop(1, '#a855f7');
            } else {
                gradient.addColorStop(0, '#8b5cf6');
                gradient.addColorStop(1, '#ec4899');
            }
            
            this.ctx.fillStyle = gradient;
            
            // Enemy body
            this.ctx.beginPath();
            this.ctx.moveTo(enemy.x + enemy.width / 2, enemy.y);
            this.ctx.lineTo(enemy.x + enemy.width, enemy.y + enemy.height * 0.6);
            this.ctx.lineTo(enemy.x + enemy.width * 0.8, enemy.y + enemy.height);
            this.ctx.lineTo(enemy.x + enemy.width * 0.2, enemy.y + enemy.height);
            this.ctx.lineTo(enemy.x, enemy.y + enemy.height * 0.6);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Health indicator for multi-hit enemies
            if (enemy.maxHealth > 1 && enemy.health < enemy.maxHealth) {
                this.ctx.fillStyle = 'rgba(255,0,0,0.5)';
                this.ctx.fillRect(enemy.x, enemy.y - 5, enemy.width * (1 - healthRatio), 3);
            }
        });
        
        // Draw special enemy
        if (this.specialEnemy) {
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.ellipse(
                this.specialEnemy.x + this.specialEnemy.width / 2,
                this.specialEnemy.y + this.specialEnemy.height / 2,
                this.specialEnemy.width / 2,
                this.specialEnemy.height / 2,
                0, 0, Math.PI * 2
            );
            this.ctx.fill();
        }
        
        // Draw boss
        if (this.bossActive && this.boss) {
            // Boss body
            const bossGradient = this.ctx.createLinearGradient(this.boss.x, this.boss.y, this.boss.x + this.boss.width, this.boss.y + this.boss.height);
            bossGradient.addColorStop(0, '#dc2626');
            bossGradient.addColorStop(0.5, '#7c3aed');
            bossGradient.addColorStop(1, '#dc2626');
            this.ctx.fillStyle = bossGradient;
            
            this.ctx.beginPath();
            this.ctx.moveTo(this.boss.x + this.boss.width / 2, this.boss.y);
            this.ctx.lineTo(this.boss.x + this.boss.width, this.boss.y + this.boss.height * 0.4);
            this.ctx.lineTo(this.boss.x + this.boss.width * 0.9, this.boss.y + this.boss.height);
            this.ctx.lineTo(this.boss.x + this.boss.width * 0.1, this.boss.y + this.boss.height);
            this.ctx.lineTo(this.boss.x, this.boss.y + this.boss.height * 0.4);
            this.ctx.closePath();
            this.ctx.fill();
            
            // Boss health bar
            this.ctx.fillStyle = '#333';
            this.ctx.fillRect(this.boss.x, this.boss.y - 12, this.boss.width, 8);
            this.ctx.fillStyle = '#ef4444';
            this.ctx.fillRect(this.boss.x, this.boss.y - 12, this.boss.width * (this.boss.health / this.boss.maxHealth), 8);
        }
        
        // Draw player ship
        const playerGradient = this.ctx.createLinearGradient(this.player.x, this.player.y, this.player.x + this.player.width, this.player.y + this.player.height);
        playerGradient.addColorStop(0, '#22c55e');
        playerGradient.addColorStop(1, '#10b981');
        this.ctx.fillStyle = playerGradient;
        
        this.ctx.beginPath();
        this.ctx.moveTo(this.player.x + this.player.width / 2, this.player.y);
        this.ctx.lineTo(this.player.x + this.player.width, this.player.y + this.player.height);
        this.ctx.lineTo(this.player.x + this.player.width / 2, this.player.y + this.player.height * 0.7);
        this.ctx.lineTo(this.player.x, this.player.y + this.player.height);
        this.ctx.closePath();
        this.ctx.fill();
        
        // Draw shield if active
        if (this.player.hasShield) {
            this.ctx.strokeStyle = `rgba(6, 182, 212, ${0.5 + Math.sin(Date.now() / 100) * 0.3})`;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(
                this.player.x + this.player.width / 2,
                this.player.y + this.player.height / 2,
                25,
                0, Math.PI * 2
            );
            this.ctx.stroke();
        }
        
        // Draw bullets
        this.ctx.fillStyle = '#facc15';
        this.bullets.forEach(bullet => {
            this.ctx.fillRect(bullet.x, bullet.y, 4, 10);
        });
        
        // Draw enemy bullets
        this.ctx.fillStyle = '#ef4444';
        this.enemyBullets.forEach(bullet => {
            this.ctx.beginPath();
            this.ctx.arc(bullet.x, bullet.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
        });
        
        // Draw lives
        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#22c55e';
            this.ctx.beginPath();
            this.ctx.moveTo(20 + i * 25, this.canvas.height - 8);
            this.ctx.lineTo(28 + i * 25, this.canvas.height - 20);
            this.ctx.lineTo(36 + i * 25, this.canvas.height - 8);
            this.ctx.closePath();
            this.ctx.fill();
        }
        
        // Draw wave indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Onda ${this.wave}/${this.maxWave}`, this.canvas.width - 10, this.canvas.height - 10);
        
        // Game over / Won screen
        if (this.gameOver || this.won) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? 'VITÓRIA!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Pontuação: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText(`Onda: ${this.wave}/${this.maxWave}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('Pressione ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 80);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const waveEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (waveEl) waveEl.textContent = `Onda ${this.wave}/${this.maxWave} | Vidas: ${this.lives}`;
    }

    endGame() {
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
        this.reset();
        this.setupControls();
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
        
        this.keys = { left: false, right: false };
        
        this.generateBricks();
        this.updateScoreDisplay();
    }

    generateBricks() {
        this.bricks = [];
        
        // Different layouts for each phase
        const layouts = this.getPhaseLayout(this.phase);
        const brickWidth = 45;
        const brickHeight = 18;
        const brickPadding = 4;
        const offsetTop = 50;
        const offsetLeft = (this.canvas.width - (8 * (brickWidth + brickPadding))) / 2;
        
        layouts.forEach((row, rowIndex) => {
            row.forEach((cell, colIndex) => {
                if (cell > 0) {
                    const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#8b5cf6'];
                    this.bricks.push({
                        x: offsetLeft + colIndex * (brickWidth + brickPadding),
                        y: offsetTop + rowIndex * (brickHeight + brickPadding),
                        width: brickWidth,
                        height: brickHeight,
                        color: colors[rowIndex % colors.length],
                        points: cell * 10 * this.phase,
                        hits: cell, // Number of hits needed
                        maxHits: cell,
                        visible: true
                    });
                }
            });
        });
    }

    getPhaseLayout(phase) {
        // 0 = no brick, 1 = 1 hit, 2 = 2 hits, 3 = 3 hits
        const layouts = {
            1: [
                [1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1],
                [1,1,1,1,1,1,1,1]
            ],
            2: [
                [1,1,1,2,2,1,1,1],
                [1,1,2,1,1,2,1,1],
                [1,2,1,1,1,1,2,1],
                [1,1,2,1,1,2,1,1],
                [1,1,1,2,2,1,1,1]
            ],
            3: [
                [2,1,2,1,1,2,1,2],
                [1,2,1,2,2,1,2,1],
                [0,1,2,3,3,2,1,0],
                [1,2,1,2,2,1,2,1],
                [2,1,2,1,1,2,1,2]
            ],
            4: [
                [1,0,2,0,0,2,0,1],
                [0,2,0,3,3,0,2,0],
                [2,0,3,0,0,3,0,2],
                [0,2,0,3,3,0,2,0],
                [1,0,2,0,0,2,0,1],
                [2,2,2,2,2,2,2,2]
            ],
            5: [
                [3,2,1,2,2,1,2,3],
                [2,3,2,1,1,2,3,2],
                [1,2,3,2,2,3,2,1],
                [2,1,2,3,3,2,1,2],
                [3,2,1,2,2,1,2,3],
                [1,1,1,1,1,1,1,1]
            ]
        };
        return layouts[phase] || layouts[1];
    }

    spawnPowerUp(x, y) {
        if (Math.random() < 0.2) {
            const types = ['paddle', 'ball', 'multi', 'life'];
            const type = types[Math.floor(Math.random() * types.length)];
            const colors = {
                paddle: '#3b82f6',
                ball: '#22c55e',
                multi: '#a855f7',
                life: '#ef4444'
            };
            const icons = {
                paddle: '↔',
                ball: '●',
                multi: '⁂',
                life: '❤'
            };
            this.powerUps.push({
                x: x,
                y: y,
                type,
                color: colors[type],
                icon: icons[type],
                width: 24,
                height: 24,
                speed: 2
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
    }

    gameLoop() {
        if (!this.running) return;

        const now = Date.now();
        const delta = now - this.lastUpdate;
        
        if (!this.gameOver && !this.won) {
            this.update(delta);
        }
        this.draw();
        
        this.lastUpdate = now;
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    update(delta) {
        // Update power-up timers
        if (this.activePowerUps.bigPaddle > 0) {
            this.activePowerUps.bigPaddle -= delta;
            if (this.activePowerUps.bigPaddle <= 0) {
                this.paddle.width = this.paddle.originalWidth;
            }
        }
        if (this.activePowerUps.bigBall > 0) {
            this.activePowerUps.bigBall -= delta;
            if (this.activePowerUps.bigBall <= 0) {
                this.balls.forEach(ball => ball.radius = ball.originalRadius);
            }
        }
        
        // Paddle movement
        if (this.keys.left && this.paddle.x > 0) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.keys.right && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += this.paddle.speed;
        }
        
        // Update power-ups
        this.powerUps = this.powerUps.filter(powerUp => {
            powerUp.y += powerUp.speed;
            
            // Check collision with paddle
            if (powerUp.y + powerUp.height >= this.canvas.height - this.paddle.height - 10 &&
                powerUp.x + powerUp.width > this.paddle.x &&
                powerUp.x < this.paddle.x + this.paddle.width) {
                
                switch (powerUp.type) {
                    case 'paddle':
                        this.paddle.width = 120;
                        this.activePowerUps.bigPaddle = 10000;
                        break;
                    case 'ball':
                        this.balls.forEach(ball => ball.radius = 12);
                        this.activePowerUps.bigBall = 8000;
                        break;
                    case 'multi':
                        if (this.balls.length < 5) {
                            const mainBall = this.balls[0];
                            this.balls.push({
                                x: mainBall.x,
                                y: mainBall.y,
                                radius: mainBall.radius,
                                dx: mainBall.dx + 2,
                                dy: mainBall.dy,
                                originalRadius: 8
                            });
                            this.balls.push({
                                x: mainBall.x,
                                y: mainBall.y,
                                radius: mainBall.radius,
                                dx: mainBall.dx - 2,
                                dy: mainBall.dy,
                                originalRadius: 8
                            });
                        }
                        break;
                    case 'life':
                        this.lives = Math.min(this.lives + 1, 5);
                        this.updateScoreDisplay();
                        break;
                }
                return false;
            }
            
            return powerUp.y < this.canvas.height;
        });

        // Update balls
        this.balls = this.balls.filter((ball, index) => {
            ball.x += ball.dx;
            ball.y += ball.dy;

            // Wall collision
            if (ball.x - ball.radius < 0 || ball.x + ball.radius > this.canvas.width) {
                ball.dx *= -1;
                ball.x = Math.max(ball.radius, Math.min(this.canvas.width - ball.radius, ball.x));
            }
            if (ball.y - ball.radius < 0) {
                ball.dy *= -1;
            }

            // Paddle collision
            if (
                ball.y + ball.radius > this.canvas.height - this.paddle.height - 10 &&
                ball.y - ball.radius < this.canvas.height - 10 &&
                ball.x > this.paddle.x &&
                ball.x < this.paddle.x + this.paddle.width
            ) {
                ball.dy = -Math.abs(ball.dy);
                const hitPos = (ball.x - this.paddle.x) / this.paddle.width;
                ball.dx = (hitPos - 0.5) * 10;
            }

            // Lost ball
            if (ball.y + ball.radius > this.canvas.height) {
                if (this.balls.length > 1) {
                    return false; // Remove this ball
                } else {
                    this.lives--;
                    this.updateScoreDisplay();
                    
                    if (this.lives <= 0) {
                        this.endGame();
                    } else {
                        ball.x = this.canvas.width / 2;
                        ball.y = this.canvas.height - 50;
                        ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
                        ball.dy = -4;
                    }
                }
            }

            // Brick collision
            this.bricks.forEach(brick => {
                if (brick.visible) {
                    if (
                        ball.x > brick.x - ball.radius &&
                        ball.x < brick.x + brick.width + ball.radius &&
                        ball.y - ball.radius < brick.y + brick.height &&
                        ball.y + ball.radius > brick.y
                    ) {
                        brick.hits--;
                        if (brick.hits <= 0) {
                            brick.visible = false;
                            this.spawnPowerUp(brick.x + brick.width / 2, brick.y);
                        }
                        ball.dy *= -1;
                        this.score += brick.points;
                        this.updateScoreDisplay();
                    }
                }
            });

            return true;
        });

        // Ensure at least one ball exists
        if (this.balls.length === 0) {
            this.balls.push({
                x: this.canvas.width / 2,
                y: this.canvas.height - 50,
                radius: 8,
                dx: 4,
                dy: -4,
                originalRadius: 8
            });
        }

        // Check phase complete
        if (this.bricks.every(b => !b.visible)) {
            if (this.phase < this.maxPhase) {
                this.phase++;
                this.generateBricks();
                this.balls = [{
                    x: this.canvas.width / 2,
                    y: this.canvas.height - 50,
                    radius: 8,
                    dx: 4 + this.phase * 0.5,
                    dy: -4 - this.phase * 0.5,
                    originalRadius: 8
                }];
                this.updateScoreDisplay();
            } else {
                this.won = true;
                this.onScore(this.score);
                if (this.manager) {
                    this.manager.unlockAchievement('destroyer');
                }
            }
        }
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');
        
        // Background gradient
        const bgGradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        bgGradient.addColorStop(0, '#0f172a');
        bgGradient.addColorStop(1, '#1e293b');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw bricks
        this.bricks.forEach(brick => {
            if (brick.visible) {
                // Brick color based on hits remaining
                const alpha = brick.hits / brick.maxHits;
                const gradient = this.ctx.createLinearGradient(brick.x, brick.y, brick.x, brick.y + brick.height);
                gradient.addColorStop(0, brick.color);
                gradient.addColorStop(1, this.adjustColorBrightness(brick.color, -30));
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
                this.ctx.fill();
                
                // Highlight
                this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                this.ctx.fillRect(brick.x + 2, brick.y + 2, brick.width - 4, 4);
                
                // Show hits remaining for multi-hit bricks
                if (brick.maxHits > 1) {
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 10px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText(brick.hits.toString(), brick.x + brick.width / 2, brick.y + brick.height / 2 + 3);
                }
            }
        });

        // Draw power-ups
        this.powerUps.forEach(powerUp => {
            this.ctx.fillStyle = powerUp.color;
            this.ctx.beginPath();
            this.ctx.arc(powerUp.x + 12, powerUp.y + 12, 12, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = '12px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(powerUp.icon, powerUp.x + 12, powerUp.y + 16);
        });

        // Draw paddle with gradient
        const paddleGradient = this.ctx.createLinearGradient(
            this.paddle.x, this.canvas.height - 20,
            this.paddle.x + this.paddle.width, this.canvas.height - 8
        );
        paddleGradient.addColorStop(0, '#3b82f6');
        paddleGradient.addColorStop(1, '#a855f7');
        this.ctx.fillStyle = paddleGradient;
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.paddle.x,
            this.canvas.height - this.paddle.height - 10,
            this.paddle.width,
            this.paddle.height,
            6
        );
        this.ctx.fill();

        // Draw balls
        this.balls.forEach(ball => {
            const ballGradient = this.ctx.createRadialGradient(
                ball.x - 2, ball.y - 2, 0,
                ball.x, ball.y, ball.radius
            );
            ballGradient.addColorStop(0, '#fff');
            ballGradient.addColorStop(1, '#94a3b8');
            this.ctx.fillStyle = ballGradient;
            this.ctx.beginPath();
            this.ctx.arc(ball.x, ball.y, ball.radius, 0, Math.PI * 2);
            this.ctx.fill();
        });

        // Draw lives
        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(20 + i * 20, 20, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        // Draw phase indicator
        this.ctx.fillStyle = '#fff';
        this.ctx.font = 'bold 14px Arial';
        this.ctx.textAlign = 'right';
        this.ctx.fillText(`Fase ${this.phase}/${this.maxPhase}`, this.canvas.width - 10, 22);

        // Draw active power-up indicators
        let indicatorY = 40;
        if (this.activePowerUps.bigPaddle > 0) {
            this.ctx.fillStyle = '#3b82f6';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Paddle: ${Math.ceil(this.activePowerUps.bigPaddle / 1000)}s`, this.canvas.width - 10, indicatorY);
            indicatorY += 15;
        }
        if (this.activePowerUps.bigBall > 0) {
            this.ctx.fillStyle = '#22c55e';
            this.ctx.font = '10px Arial';
            this.ctx.textAlign = 'right';
            this.ctx.fillText(`Ball: ${Math.ceil(this.activePowerUps.bigBall / 1000)}s`, this.canvas.width - 10, indicatorY);
        }

        // Game over / Won screen
        if (this.gameOver || this.won) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 28px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? 'VOCÊ VENCEU!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 30);
            
            this.ctx.font = '20px Arial';
            this.ctx.fillText(`Pontuação: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText(`Fase: ${this.phase}/${this.maxPhase}`, this.canvas.width / 2, this.canvas.height / 2 + 40);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 80);
        }
    }

    adjustColorBrightness(color, amount) {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `rgb(${r}, ${g}, ${b})`;
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

window.JogosManager = JogosManager;
