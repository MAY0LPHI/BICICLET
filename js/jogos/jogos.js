/**
 * Módulo de Jogos - Sistema de Jogos com Ranking
 * Gerencia jogos leves e sistema de pontuação por usuário
 */

import { Auth } from '../shared/auth.js';

const STORAGE_KEY_RANKINGS = 'bicicletario_game_rankings';

export class JogosManager {
    constructor(app) {
        this.app = app;
        this.currentGame = null;
        this.rankings = this.loadRankings();
    }

    loadRankings() {
        const data = localStorage.getItem(STORAGE_KEY_RANKINGS);
        return data ? JSON.parse(data) : {};
    }

    saveRankings() {
        localStorage.setItem(STORAGE_KEY_RANKINGS, JSON.stringify(this.rankings));
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
            { id: 'snake', name: 'Jogo da Cobrinha', icon: 'zap', description: 'Coma as frutas e cresça! Com fases e dificuldades.' },
            { id: 'pacman', name: 'Pac-Man', icon: 'ghost', description: 'Colete pontos e fuja dos fantasmas!' },
            { id: 'typing', name: 'Teste de Digitação', icon: 'keyboard', description: 'Teste sua velocidade de digitação!' },
            { id: 'memory', name: 'Jogo da Memória', icon: 'brain', description: 'Encontre os pares e treine sua memória!' },
            { id: 'tetris', name: 'Tetris', icon: 'layout-grid', description: 'Encaixe as peças e limpe as linhas!' },
            { id: 'breakout', name: 'Breakout', icon: 'square', description: 'Quebre todos os tijolos com a bolinha!' }
        ];

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
        `).join('');

        lucide.createIcons();
        this.setupEventListeners();
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
        
        if (this.currentGame && this.currentGame.stop) {
            this.currentGame.stop();
        }
        this.currentGame = null;
        
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
            tetris: { name: 'Tetris', class: TetrisGame },
            breakout: { name: 'Breakout', class: BreakoutGame }
        };

        const game = games[gameId];
        if (!game) return;

        if (gameTitle) {
            gameTitle.textContent = game.name;
        }

        this.currentGame = new game.class(canvas, (score) => {
            this.addScore(gameId, score);
        });
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
    constructor(canvas, onScore) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
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
        this.running = false;
        
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
            selector.className = 'flex gap-2 mb-4 justify-center';
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
        this.score = 0;
        this.phase = 1;
        this.gameOver = false;
        this.updateScoreDisplay();
    }

    generateFood() {
        let food;
        do {
            food = {
                x: Math.floor(Math.random() * this.tileCount),
                y: Math.floor(Math.random() * this.tileCount)
            };
        } while (this.snake.some(seg => seg.x === food.x && seg.y === food.y));
        return food;
    }

    generateSpecialFood() {
        if (Math.random() < 0.1 && !this.specialFood) {
            this.specialFood = {
                ...this.generateFood(),
                timer: 100,
                points: 50
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
                    if (this.gameOver) {
                        this.reset();
                        this.start();
                    }
                    break;
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    start() {
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        document.removeEventListener('keydown', this.keyHandler);
        const selector = document.getElementById('snake-difficulty');
        if (selector) selector.remove();
    }

    gameLoop() {
        if (!this.running) return;

        if (!this.gameOver) {
            this.update();
        }
        this.draw();

        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, this.difficulties[this.currentDifficulty].speed);
    }

    update() {
        this.direction = { ...this.nextDirection };

        if (this.direction.x === 0 && this.direction.y === 0) return;

        const head = {
            x: this.snake[0].x + this.direction.x,
            y: this.snake[0].y + this.direction.y
        };

        if (head.x < 0 || head.x >= this.tileCount || head.y < 0 || head.y >= this.tileCount) {
            this.endGame();
            return;
        }

        if (this.snake.some(seg => seg.x === head.x && seg.y === head.y)) {
            this.endGame();
            return;
        }

        this.snake.unshift(head);

        if (head.x === this.food.x && head.y === this.food.y) {
            this.score += 10 * this.phase;
            this.food = this.generateFood();
            this.generateSpecialFood();
            
            if (this.score >= this.phase * 100) {
                this.phase++;
            }
            this.updateScoreDisplay();
        } else if (this.specialFood && head.x === this.specialFood.x && head.y === this.specialFood.y) {
            this.score += this.specialFood.points * this.phase;
            this.specialFood = null;
            this.updateScoreDisplay();
        } else {
            this.snake.pop();
        }

        if (this.specialFood) {
            this.specialFood.timer--;
            if (this.specialFood.timer <= 0) {
                this.specialFood = null;
            }
        }
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');
        
        this.ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = 0; i < this.tileCount; i++) {
            for (let j = 0; j < this.tileCount; j++) {
                if ((i + j) % 2 === 0) {
                    this.ctx.fillStyle = isDark ? '#334155' : '#e2e8f0';
                    this.ctx.fillRect(i * this.gridSize, j * this.gridSize, this.gridSize, this.gridSize);
                }
            }
        }

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
                gradient.addColorStop(0, '#22c55e');
                gradient.addColorStop(1, '#16a34a');
            } else {
                gradient.addColorStop(0, '#4ade80');
                gradient.addColorStop(1, '#22c55e');
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
        });

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

        this.ctx.fillStyle = '#22c55e';
        this.ctx.beginPath();
        this.ctx.moveTo(this.food.x * this.gridSize + this.gridSize / 2, this.food.y * this.gridSize + 2);
        this.ctx.lineTo(this.food.x * this.gridSize + this.gridSize / 2 + 3, this.food.y * this.gridSize + 6);
        this.ctx.lineTo(this.food.x * this.gridSize + this.gridSize / 2 - 3, this.food.y * this.gridSize + 6);
        this.ctx.closePath();
        this.ctx.fill();

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

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`Pontuação: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            this.ctx.fillText(`Fase: ${this.phase}`, this.canvas.width / 2, this.canvas.height / 2 + 35);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('Pressione ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 70);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const phaseEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (phaseEl) phaseEl.textContent = `Fase ${this.phase}`;
    }

    endGame() {
        this.gameOver = true;
        this.onScore(this.score);
    }
}

class PacmanGame {
    constructor(canvas, onScore) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        this.tileSize = 20;
        this.canvas.width = 400;
        this.canvas.height = 400;
        
        this.map = [
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
        ];
        
        this.running = false;
        this.reset();
        this.setupControls();
    }

    reset() {
        this.pacman = { x: 10, y: 15, direction: 0, nextDirection: 0, mouthOpen: 0 };
        this.ghosts = [
            { x: 9, y: 9, color: '#ef4444', direction: 0, mode: 'scatter' },
            { x: 10, y: 9, color: '#ec4899', direction: 0, mode: 'scatter' },
            { x: 9, y: 10, color: '#06b6d4', direction: 0, mode: 'scatter' },
            { x: 10, y: 10, color: '#f97316', direction: 0, mode: 'scatter' }
        ];
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.powerMode = false;
        this.powerTimer = 0;
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
                    if (this.gameOver) {
                        this.reset();
                        this.start();
                    }
                    break;
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    start() {
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        document.removeEventListener('keydown', this.keyHandler);
    }

    gameLoop() {
        if (!this.running) return;

        if (!this.gameOver) {
            this.update();
        }
        this.draw();

        setTimeout(() => {
            requestAnimationFrame(() => this.gameLoop());
        }, 100);
    }

    canMove(x, y) {
        if (x < 0 || x >= 20 || y < 0 || y >= 20) return false;
        return this.map[y][x] !== 1;
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

        if (this.pacman.x < 0) this.pacman.x = 19;
        if (this.pacman.x > 19) this.pacman.x = 0;

        const dotIndex = this.dots.findIndex(d => d.x === this.pacman.x && d.y === this.pacman.y);
        if (dotIndex !== -1) {
            const dot = this.dots[dotIndex];
            if (dot.type === 'power') {
                this.score += 50;
                this.powerMode = true;
                this.powerTimer = 80;
                this.ghosts.forEach(g => g.mode = 'frightened');
            } else {
                this.score += 10;
            }
            this.dots.splice(dotIndex, 1);
            this.updateScoreDisplay();

            if (this.dots.length === 0) {
                this.endGame();
                return;
            }
        }

        if (this.powerMode) {
            this.powerTimer--;
            if (this.powerTimer <= 0) {
                this.powerMode = false;
                this.ghosts.forEach(g => g.mode = 'scatter');
            }
        }

        this.ghosts.forEach(ghost => {
            if (Math.random() < 0.3) {
                const validDirs = [];
                directions.forEach((d, i) => {
                    if (this.canMove(ghost.x + d.x, ghost.y + d.y) && i !== (ghost.direction + 2) % 4) {
                        validDirs.push(i);
                    }
                });
                if (validDirs.length > 0) {
                    ghost.direction = validDirs[Math.floor(Math.random() * validDirs.length)];
                }
            }

            const gDir = directions[ghost.direction];
            const gNewX = ghost.x + gDir.x;
            const gNewY = ghost.y + gDir.y;

            if (this.canMove(gNewX, gNewY)) {
                ghost.x = gNewX;
                ghost.y = gNewY;
            } else {
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
        
        this.ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.map.length; y++) {
            for (let x = 0; x < this.map[y].length; x++) {
                if (this.map[y][x] === 1) {
                    this.ctx.fillStyle = '#3b82f6';
                    this.ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
                }
            }
        }

        this.dots.forEach(dot => {
            if (dot.type === 'power') {
                this.ctx.fillStyle = '#fbbf24';
                this.ctx.beginPath();
                this.ctx.arc(
                    dot.x * this.tileSize + this.tileSize / 2,
                    dot.y * this.tileSize + this.tileSize / 2,
                    6,
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

        this.ghosts.forEach(ghost => {
            this.ctx.fillStyle = this.powerMode ? '#3b82f6' : ghost.color;
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

            this.ctx.fillStyle = '#fff';
            this.ctx.beginPath();
            this.ctx.arc(ghost.x * this.tileSize + 7, ghost.y * this.tileSize + 8, 3, 0, Math.PI * 2);
            this.ctx.arc(ghost.x * this.tileSize + 13, ghost.y * this.tileSize + 8, 3, 0, Math.PI * 2);
            this.ctx.fill();
            
            this.ctx.fillStyle = '#000';
            this.ctx.beginPath();
            this.ctx.arc(ghost.x * this.tileSize + 7, ghost.y * this.tileSize + 8, 1.5, 0, Math.PI * 2);
            this.ctx.arc(ghost.x * this.tileSize + 13, ghost.y * this.tileSize + 8, 1.5, 0, Math.PI * 2);
            this.ctx.fill();
        });

        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#facc15';
            this.ctx.beginPath();
            this.ctx.arc(20 + i * 25, this.canvas.height - 15, 8, 0.25 * Math.PI, 1.75 * Math.PI);
            this.ctx.lineTo(20 + i * 25, this.canvas.height - 15);
            this.ctx.fill();
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.dots.length === 0 ? 'VOCÊ VENCEU!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 10);
            
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
        if (livesEl) livesEl.textContent = `Vidas: ${this.lives}`;
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
        
        this.words = {
            easy: ['casa', 'bola', 'gato', 'carro', 'mesa', 'sol', 'lua', 'mar', 'rio', 'flor', 'ave', 'pão', 'luz', 'amor', 'vida', 'céu', 'dia', 'noite', 'paz', 'cor'],
            medium: ['bicicleta', 'computador', 'telefone', 'chocolate', 'borboleta', 'aventura', 'fantasia', 'universo', 'melodia', 'harmonia', 'esperança', 'liberdade', 'felicidade', 'natureza', 'saudade'],
            hard: ['extraordinário', 'desenvolvimento', 'estabelecimento', 'responsabilidade', 'inconstitucional', 'paralelepípedo', 'otorrinolaringologista', 'descompartimentalização', 'pneumoultramicroscopicossilicovulcanoconiose']
        };
        
        this.running = false;
        this.reset();
        this.createUI();
    }

    createUI() {
        this.canvas.style.display = 'none';
        
        let typingUI = document.getElementById('typing-game-ui');
        if (typingUI) typingUI.remove();
        
        typingUI = document.createElement('div');
        typingUI.id = 'typing-game-ui';
        typingUI.className = 'w-full max-w-2xl mx-auto';
        typingUI.innerHTML = `
            <div class="flex gap-2 mb-4 justify-center">
                <button data-diff="easy" class="diff-btn px-4 py-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 hover:bg-green-200 transition-colors">Fácil</button>
                <button data-diff="medium" class="diff-btn px-4 py-2 rounded-lg bg-blue-500 text-white">Médio</button>
                <button data-diff="hard" class="diff-btn px-4 py-2 rounded-lg bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 hover:bg-red-200 transition-colors">Difícil</button>
            </div>
            
            <div class="bg-slate-100 dark:bg-slate-700/50 rounded-xl p-6 mb-4">
                <div class="flex justify-between items-center mb-4">
                    <div class="text-center">
                        <p class="text-sm text-slate-500 dark:text-slate-400">Tempo</p>
                        <p id="typing-time" class="text-2xl font-bold text-slate-800 dark:text-slate-200">60</p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-slate-500 dark:text-slate-400">WPM</p>
                        <p id="typing-wpm" class="text-2xl font-bold text-blue-600 dark:text-blue-400">0</p>
                    </div>
                    <div class="text-center">
                        <p class="text-sm text-slate-500 dark:text-slate-400">Precisão</p>
                        <p id="typing-accuracy" class="text-2xl font-bold text-green-600 dark:text-green-400">100%</p>
                    </div>
                </div>
                
                <div id="typing-display" class="bg-white dark:bg-slate-800 rounded-lg p-4 mb-4 min-h-[100px] text-lg leading-relaxed font-mono select-none">
                    <span class="text-slate-400">Pressione Start para começar...</span>
                </div>
                
                <input type="text" id="typing-input" disabled class="w-full px-4 py-3 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-lg font-mono focus:outline-none focus:border-blue-500 dark:text-white" placeholder="Digite aqui...">
            </div>
            
            <div class="flex justify-center gap-4">
                <button id="typing-start" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2">
                    <i data-lucide="play" class="w-5 h-5"></i>
                    Iniciar
                </button>
                <button id="typing-reset" class="px-6 py-3 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-medium transition-colors flex items-center gap-2">
                    <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                    Reiniciar
                </button>
            </div>
            
            <div id="typing-results" class="hidden mt-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl p-6 text-white text-center">
                <h3 class="text-2xl font-bold mb-4">Resultados</h3>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <p class="text-blue-200 text-sm">Palavras</p>
                        <p id="result-words" class="text-3xl font-bold">0</p>
                    </div>
                    <div>
                        <p class="text-blue-200 text-sm">WPM</p>
                        <p id="result-wpm" class="text-3xl font-bold">0</p>
                    </div>
                    <div>
                        <p class="text-blue-200 text-sm">Precisão</p>
                        <p id="result-accuracy" class="text-3xl font-bold">0%</p>
                    </div>
                </div>
            </div>
        `;
        
        this.container.appendChild(typingUI);
        
        lucide.createIcons();
        
        typingUI.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficulty = btn.dataset.diff;
                this.updateDifficultyButtons();
                this.reset();
            });
        });
        
        document.getElementById('typing-start').addEventListener('click', () => this.start());
        document.getElementById('typing-reset').addEventListener('click', () => this.reset());
        
        const input = document.getElementById('typing-input');
        input.addEventListener('input', () => this.handleInput());
    }

    updateDifficultyButtons() {
        const btns = document.querySelectorAll('#typing-game-ui .diff-btn');
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
        this.difficulty = this.difficulty || 'medium';
        this.timeLimit = 60;
        this.timeLeft = this.timeLimit;
        this.currentWordIndex = 0;
        this.currentCharIndex = 0;
        this.correctChars = 0;
        this.totalChars = 0;
        this.wordsCompleted = 0;
        this.running = false;
        
        this.generateWords();
        this.updateDisplay();
        
        const input = document.getElementById('typing-input');
        if (input) {
            input.value = '';
            input.disabled = true;
        }
        
        document.getElementById('typing-time').textContent = this.timeLimit;
        document.getElementById('typing-wpm').textContent = '0';
        document.getElementById('typing-accuracy').textContent = '100%';
        document.getElementById('typing-results').classList.add('hidden');
    }

    generateWords() {
        const wordList = this.words[this.difficulty];
        this.testWords = [];
        for (let i = 0; i < 50; i++) {
            this.testWords.push(wordList[Math.floor(Math.random() * wordList.length)]);
        }
    }

    start() {
        if (this.running) return;
        
        this.running = true;
        const input = document.getElementById('typing-input');
        input.disabled = false;
        input.focus();
        
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            this.timeLeft = Math.max(0, this.timeLimit - Math.floor((Date.now() - this.startTime) / 1000));
            document.getElementById('typing-time').textContent = this.timeLeft;
            
            if (this.timeLeft <= 0) {
                this.endGame();
            }
        }, 100);
    }

    stop() {
        this.running = false;
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
        }
        const typingUI = document.getElementById('typing-game-ui');
        if (typingUI) typingUI.remove();
        this.canvas.style.display = 'block';
    }

    handleInput() {
        if (!this.running) return;
        
        const input = document.getElementById('typing-input');
        const typed = input.value;
        const currentWord = this.testWords[this.currentWordIndex];
        
        if (typed.endsWith(' ')) {
            const wordTyped = typed.trim();
            
            for (let i = 0; i < wordTyped.length; i++) {
                this.totalChars++;
                if (i < currentWord.length && wordTyped[i] === currentWord[i]) {
                    this.correctChars++;
                }
            }
            
            if (wordTyped === currentWord) {
                this.wordsCompleted++;
            }
            
            this.currentWordIndex++;
            this.currentCharIndex = 0;
            input.value = '';
            
            if (this.currentWordIndex >= this.testWords.length) {
                this.generateWords();
                this.currentWordIndex = 0;
            }
        } else {
            this.currentCharIndex = typed.length;
        }
        
        this.updateDisplay();
        this.updateStats();
    }

    updateDisplay() {
        const display = document.getElementById('typing-display');
        if (!display) return;
        
        const input = document.getElementById('typing-input');
        const typed = input ? input.value : '';
        
        let html = '';
        const visibleWords = this.testWords.slice(this.currentWordIndex, this.currentWordIndex + 15);
        
        visibleWords.forEach((word, wordIndex) => {
            if (wordIndex === 0) {
                let wordHtml = '';
                for (let i = 0; i < word.length; i++) {
                    if (i < typed.length) {
                        if (typed[i] === word[i]) {
                            wordHtml += `<span class="text-green-600 dark:text-green-400">${word[i]}</span>`;
                        } else {
                            wordHtml += `<span class="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30">${word[i]}</span>`;
                        }
                    } else if (i === typed.length) {
                        wordHtml += `<span class="border-l-2 border-blue-500 animate-pulse">${word[i]}</span>`;
                    } else {
                        wordHtml += `<span class="text-slate-600 dark:text-slate-300">${word[i]}</span>`;
                    }
                }
                if (typed.length > word.length) {
                    wordHtml += `<span class="text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30">${typed.slice(word.length)}</span>`;
                }
                html += wordHtml + ' ';
            } else {
                html += `<span class="text-slate-500 dark:text-slate-400">${word}</span> `;
            }
        });
        
        display.innerHTML = html;
    }

    updateStats() {
        const elapsedTime = (Date.now() - this.startTime) / 1000 / 60;
        const wpm = Math.round(this.wordsCompleted / Math.max(elapsedTime, 0.01));
        const accuracy = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 100;
        
        document.getElementById('typing-wpm').textContent = wpm;
        document.getElementById('typing-accuracy').textContent = `${accuracy}%`;
    }

    endGame() {
        this.running = false;
        clearInterval(this.timerInterval);
        
        const input = document.getElementById('typing-input');
        input.disabled = true;
        
        const elapsedTime = this.timeLimit / 60;
        const wpm = Math.round(this.wordsCompleted / elapsedTime);
        const accuracy = this.totalChars > 0 ? Math.round((this.correctChars / this.totalChars) * 100) : 100;
        
        const score = Math.round(wpm * (accuracy / 100));
        
        document.getElementById('result-words').textContent = this.wordsCompleted;
        document.getElementById('result-wpm').textContent = wpm;
        document.getElementById('result-accuracy').textContent = `${accuracy}%`;
        document.getElementById('typing-results').classList.remove('hidden');
        
        this.onScore(score);
    }
}

class MemoryGame {
    constructor(canvas, onScore) {
        this.canvas = canvas;
        this.onScore = onScore;
        this.container = canvas.parentElement;
        
        this.icons = ['bike', 'car', 'plane', 'train', 'ship', 'rocket', 'star', 'heart'];
        this.running = false;
        
        this.createUI();
        this.reset();
    }

    createUI() {
        this.canvas.style.display = 'none';
        
        let memoryUI = document.getElementById('memory-game-ui');
        if (memoryUI) memoryUI.remove();
        
        memoryUI = document.createElement('div');
        memoryUI.id = 'memory-game-ui';
        memoryUI.className = 'w-full max-w-lg mx-auto';
        memoryUI.innerHTML = `
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
                    <p class="text-sm text-slate-500 dark:text-slate-400">Tempo</p>
                    <p id="memory-time" class="text-2xl font-bold text-green-600 dark:text-green-400">0:00</p>
                </div>
            </div>
            
            <div id="memory-grid" class="grid grid-cols-4 gap-3 mb-4"></div>
            
            <button id="memory-reset" class="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2">
                <i data-lucide="rotate-ccw" class="w-5 h-5"></i>
                Novo Jogo
            </button>
        `;
        
        this.container.appendChild(memoryUI);
        
        document.getElementById('memory-reset').addEventListener('click', () => this.reset());
        
        lucide.createIcons();
    }

    reset() {
        this.cards = [];
        this.flippedCards = [];
        this.matchedPairs = 0;
        this.moves = 0;
        this.startTime = null;
        this.running = false;
        
        const shuffled = [...this.icons, ...this.icons].sort(() => Math.random() - 0.5);
        this.cards = shuffled.map((icon, index) => ({
            id: index,
            icon,
            flipped: false,
            matched: false
        }));
        
        this.renderGrid();
        this.updateStats();
        
        if (this.timerInterval) clearInterval(this.timerInterval);
    }

    renderGrid() {
        const grid = document.getElementById('memory-grid');
        grid.innerHTML = this.cards.map(card => `
            <div class="memory-card aspect-square rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${card.flipped || card.matched ? 'flipped' : ''}" data-id="${card.id}">
                <div class="w-full h-full ${card.flipped || card.matched ? 'bg-gradient-to-br from-blue-500 to-purple-600' : 'bg-gradient-to-br from-slate-600 to-slate-700'} rounded-xl flex items-center justify-center shadow-lg">
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
            this.updateStats();
            
            const [first, second] = this.flippedCards;
            
            if (first.icon === second.icon) {
                first.matched = true;
                second.matched = true;
                this.matchedPairs++;
                this.flippedCards = [];
                this.updateStats();
                
                if (this.matchedPairs === this.icons.length) {
                    this.endGame();
                }
            } else {
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
        document.getElementById('memory-moves').textContent = this.moves;
        document.getElementById('memory-pairs').textContent = `${this.matchedPairs}/${this.icons.length}`;
    }

    updateTimer() {
        if (!this.startTime) return;
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const minutes = Math.floor(elapsed / 60);
        const seconds = elapsed % 60;
        document.getElementById('memory-time').textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
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
        const score = Math.max(0, 1000 - (this.moves * 10) - elapsed);
        
        setTimeout(() => {
            alert(`Parabéns! Você completou em ${this.moves} movimentos!\nPontuação: ${score}`);
            this.onScore(score);
        }, 500);
    }
}

class TetrisGame {
    constructor(canvas, onScore) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        
        this.cols = 10;
        this.rows = 20;
        this.blockSize = 25;
        this.canvas.width = this.cols * this.blockSize;
        this.canvas.height = this.rows * this.blockSize;
        
        this.pieces = {
            I: { shape: [[1,1,1,1]], color: '#06b6d4' },
            O: { shape: [[1,1],[1,1]], color: '#eab308' },
            T: { shape: [[0,1,0],[1,1,1]], color: '#a855f7' },
            S: { shape: [[0,1,1],[1,1,0]], color: '#22c55e' },
            Z: { shape: [[1,1,0],[0,1,1]], color: '#ef4444' },
            J: { shape: [[1,0,0],[1,1,1]], color: '#3b82f6' },
            L: { shape: [[0,0,1],[1,1,1]], color: '#f97316' }
        };
        
        this.running = false;
        this.reset();
        this.setupControls();
    }

    reset() {
        this.board = Array(this.rows).fill().map(() => Array(this.cols).fill(null));
        this.score = 0;
        this.level = 1;
        this.lines = 0;
        this.gameOver = false;
        this.spawnPiece();
        this.updateScoreDisplay();
    }

    spawnPiece() {
        const pieceNames = Object.keys(this.pieces);
        const name = pieceNames[Math.floor(Math.random() * pieceNames.length)];
        const piece = this.pieces[name];
        
        this.currentPiece = {
            shape: piece.shape.map(row => [...row]),
            color: piece.color,
            x: Math.floor(this.cols / 2) - Math.floor(piece.shape[0].length / 2),
            y: 0
        };
        
        if (this.checkCollision()) {
            this.endGame();
        }
    }

    setupControls() {
        this.keyHandler = (e) => {
            if (this.gameOver) {
                if (e.key === ' ') {
                    this.reset();
                    this.start();
                }
                return;
            }
            
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                    this.movePiece(-1, 0);
                    break;
                case 'ArrowRight':
                case 'd':
                    this.movePiece(1, 0);
                    break;
                case 'ArrowDown':
                case 's':
                    this.movePiece(0, 1);
                    break;
                case 'ArrowUp':
                case 'w':
                    this.rotatePiece();
                    break;
                case ' ':
                    this.hardDrop();
                    break;
            }
        };
        document.addEventListener('keydown', this.keyHandler);
    }

    start() {
        this.running = true;
        this.lastDrop = Date.now();
        this.gameLoop();
    }

    stop() {
        this.running = false;
        document.removeEventListener('keydown', this.keyHandler);
    }

    gameLoop() {
        if (!this.running) return;

        if (!this.gameOver) {
            const dropInterval = Math.max(100, 500 - (this.level - 1) * 50);
            if (Date.now() - this.lastDrop > dropInterval) {
                if (!this.movePiece(0, 1)) {
                    this.lockPiece();
                    this.clearLines();
                    this.spawnPiece();
                }
                this.lastDrop = Date.now();
            }
        }
        
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }

    movePiece(dx, dy) {
        this.currentPiece.x += dx;
        this.currentPiece.y += dy;
        
        if (this.checkCollision()) {
            this.currentPiece.x -= dx;
            this.currentPiece.y -= dy;
            return false;
        }
        return true;
    }

    rotatePiece() {
        const rotated = this.currentPiece.shape[0].map((_, i) =>
            this.currentPiece.shape.map(row => row[i]).reverse()
        );
        const oldShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        if (this.checkCollision()) {
            this.currentPiece.shape = oldShape;
        }
    }

    hardDrop() {
        while (this.movePiece(0, 1)) {}
        this.lockPiece();
        this.clearLines();
        this.spawnPiece();
    }

    checkCollision() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardX = this.currentPiece.x + x;
                    const boardY = this.currentPiece.y + y;
                    
                    if (boardX < 0 || boardX >= this.cols || boardY >= this.rows) {
                        return true;
                    }
                    if (boardY >= 0 && this.board[boardY][boardX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    lockPiece() {
        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    const boardY = this.currentPiece.y + y;
                    if (boardY >= 0) {
                        this.board[boardY][this.currentPiece.x + x] = this.currentPiece.color;
                    }
                }
            }
        }
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let y = this.rows - 1; y >= 0; y--) {
            if (this.board[y].every(cell => cell !== null)) {
                this.board.splice(y, 1);
                this.board.unshift(Array(this.cols).fill(null));
                linesCleared++;
                y++;
            }
        }
        
        if (linesCleared > 0) {
            const points = [0, 100, 300, 500, 800];
            this.score += points[linesCleared] * this.level;
            this.lines += linesCleared;
            this.level = Math.floor(this.lines / 10) + 1;
            this.updateScoreDisplay();
        }
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');
        
        this.ctx.fillStyle = isDark ? '#1e293b' : '#f1f5f9';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        for (let y = 0; y < this.rows; y++) {
            for (let x = 0; x < this.cols; x++) {
                this.ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
                this.ctx.strokeRect(x * this.blockSize, y * this.blockSize, this.blockSize, this.blockSize);
                
                if (this.board[y][x]) {
                    this.drawBlock(x, y, this.board[y][x]);
                }
            }
        }

        for (let y = 0; y < this.currentPiece.shape.length; y++) {
            for (let x = 0; x < this.currentPiece.shape[y].length; x++) {
                if (this.currentPiece.shape[y][x]) {
                    this.drawBlock(
                        this.currentPiece.x + x,
                        this.currentPiece.y + y,
                        this.currentPiece.color
                    );
                }
            }
        }

        if (this.gameOver) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`Pontuação: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 45);
        }
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(
            x * this.blockSize + 1,
            y * this.blockSize + 1,
            this.blockSize - 2,
            this.blockSize - 2
        );
        
        this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
        this.ctx.fillRect(
            x * this.blockSize + 1,
            y * this.blockSize + 1,
            this.blockSize - 2,
            4
        );
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const levelEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (levelEl) levelEl.textContent = `Nível ${this.level}`;
    }

    endGame() {
        this.gameOver = true;
        this.onScore(this.score);
    }
}

class BreakoutGame {
    constructor(canvas, onScore) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.onScore = onScore;
        
        this.canvas.width = 400;
        this.canvas.height = 500;
        
        this.running = false;
        this.reset();
        this.setupControls();
    }

    reset() {
        this.paddle = {
            width: 80,
            height: 12,
            x: this.canvas.width / 2 - 40,
            speed: 8
        };
        
        this.ball = {
            x: this.canvas.width / 2,
            y: this.canvas.height - 50,
            radius: 8,
            dx: 4,
            dy: -4
        };
        
        this.bricks = [];
        const colors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4'];
        const brickRows = 5;
        const brickCols = 8;
        const brickWidth = 45;
        const brickHeight = 18;
        const brickPadding = 4;
        const offsetTop = 50;
        const offsetLeft = (this.canvas.width - (brickCols * (brickWidth + brickPadding))) / 2;
        
        for (let row = 0; row < brickRows; row++) {
            for (let col = 0; col < brickCols; col++) {
                this.bricks.push({
                    x: offsetLeft + col * (brickWidth + brickPadding),
                    y: offsetTop + row * (brickHeight + brickPadding),
                    width: brickWidth,
                    height: brickHeight,
                    color: colors[row],
                    points: (brickRows - row) * 10,
                    visible: true
                });
            }
        }
        
        this.score = 0;
        this.lives = 3;
        this.gameOver = false;
        this.won = false;
        
        this.keys = { left: false, right: false };
        this.updateScoreDisplay();
    }

    setupControls() {
        this.keyDownHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = true;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = true;
            if (e.key === ' ' && (this.gameOver || this.won)) {
                this.reset();
                this.start();
            }
        };
        
        this.keyUpHandler = (e) => {
            if (e.key === 'ArrowLeft' || e.key === 'a') this.keys.left = false;
            if (e.key === 'ArrowRight' || e.key === 'd') this.keys.right = false;
        };
        
        document.addEventListener('keydown', this.keyDownHandler);
        document.addEventListener('keyup', this.keyUpHandler);
    }

    start() {
        this.running = true;
        this.gameLoop();
    }

    stop() {
        this.running = false;
        document.removeEventListener('keydown', this.keyDownHandler);
        document.removeEventListener('keyup', this.keyUpHandler);
    }

    gameLoop() {
        if (!this.running) return;

        if (!this.gameOver && !this.won) {
            this.update();
        }
        this.draw();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update() {
        if (this.keys.left && this.paddle.x > 0) {
            this.paddle.x -= this.paddle.speed;
        }
        if (this.keys.right && this.paddle.x < this.canvas.width - this.paddle.width) {
            this.paddle.x += this.paddle.speed;
        }

        this.ball.x += this.ball.dx;
        this.ball.y += this.ball.dy;

        if (this.ball.x - this.ball.radius < 0 || this.ball.x + this.ball.radius > this.canvas.width) {
            this.ball.dx *= -1;
        }
        if (this.ball.y - this.ball.radius < 0) {
            this.ball.dy *= -1;
        }

        if (
            this.ball.y + this.ball.radius > this.canvas.height - this.paddle.height - 10 &&
            this.ball.x > this.paddle.x &&
            this.ball.x < this.paddle.x + this.paddle.width
        ) {
            this.ball.dy = -Math.abs(this.ball.dy);
            const hitPos = (this.ball.x - this.paddle.x) / this.paddle.width;
            this.ball.dx = (hitPos - 0.5) * 8;
        }

        if (this.ball.y + this.ball.radius > this.canvas.height) {
            this.lives--;
            this.updateScoreDisplay();
            
            if (this.lives <= 0) {
                this.endGame();
            } else {
                this.ball.x = this.canvas.width / 2;
                this.ball.y = this.canvas.height - 50;
                this.ball.dx = 4 * (Math.random() > 0.5 ? 1 : -1);
                this.ball.dy = -4;
            }
        }

        this.bricks.forEach(brick => {
            if (brick.visible) {
                if (
                    this.ball.x > brick.x &&
                    this.ball.x < brick.x + brick.width &&
                    this.ball.y - this.ball.radius < brick.y + brick.height &&
                    this.ball.y + this.ball.radius > brick.y
                ) {
                    brick.visible = false;
                    this.ball.dy *= -1;
                    this.score += brick.points;
                    this.updateScoreDisplay();
                }
            }
        });

        if (this.bricks.every(b => !b.visible)) {
            this.won = true;
            this.onScore(this.score);
        }
    }

    draw() {
        const isDark = document.documentElement.classList.contains('dark');
        
        this.ctx.fillStyle = isDark ? '#0f172a' : '#1e293b';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.bricks.forEach(brick => {
            if (brick.visible) {
                this.ctx.fillStyle = brick.color;
                this.ctx.beginPath();
                this.ctx.roundRect(brick.x, brick.y, brick.width, brick.height, 3);
                this.ctx.fill();
                
                this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
                this.ctx.fillRect(brick.x, brick.y, brick.width, 4);
            }
        });

        const gradient = this.ctx.createLinearGradient(
            this.paddle.x, this.canvas.height - 20,
            this.paddle.x, this.canvas.height - 8
        );
        gradient.addColorStop(0, '#3b82f6');
        gradient.addColorStop(1, '#1d4ed8');
        this.ctx.fillStyle = gradient;
        this.ctx.beginPath();
        this.ctx.roundRect(
            this.paddle.x,
            this.canvas.height - this.paddle.height - 10,
            this.paddle.width,
            this.paddle.height,
            6
        );
        this.ctx.fill();

        this.ctx.fillStyle = '#f1f5f9';
        this.ctx.beginPath();
        this.ctx.arc(this.ball.x, this.ball.y, this.ball.radius, 0, Math.PI * 2);
        this.ctx.fill();

        for (let i = 0; i < this.lives; i++) {
            this.ctx.fillStyle = '#ef4444';
            this.ctx.beginPath();
            this.ctx.arc(20 + i * 20, 20, 6, 0, Math.PI * 2);
            this.ctx.fill();
        }

        if (this.gameOver || this.won) {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = '#fff';
            this.ctx.font = 'bold 24px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(this.won ? 'VOCÊ VENCEU!' : 'GAME OVER', this.canvas.width / 2, this.canvas.height / 2 - 20);
            
            this.ctx.font = '18px Arial';
            this.ctx.fillText(`Pontuação: ${this.score}`, this.canvas.width / 2, this.canvas.height / 2 + 10);
            
            this.ctx.font = '14px Arial';
            this.ctx.fillStyle = '#94a3b8';
            this.ctx.fillText('ESPAÇO para jogar novamente', this.canvas.width / 2, this.canvas.height / 2 + 45);
        }
    }

    updateScoreDisplay() {
        const scoreEl = document.getElementById('game-score');
        const livesEl = document.getElementById('game-phase');
        if (scoreEl) scoreEl.textContent = this.score;
        if (livesEl) livesEl.textContent = `Vidas: ${this.lives}`;
    }

    endGame() {
        this.gameOver = true;
        this.onScore(this.score);
    }
}

window.JogosManager = JogosManager;
