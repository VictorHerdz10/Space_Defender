import { Player } from "./player.js";
import { Star,Particle } from "./particles.js";
import { Enemy,BossEnemy,MediumEnemy,CarrierEnemy } from "./enemy.js";
import { gameConfig,generateLevels } from "./gameConfig.js";

class Game {
    constructor() {
        this.config = gameConfig;
    this.difficulty = 'medium';
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.lastTime = 0;
        this.deltaTime = 0;
        this.player = null;
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.stars = [];
        this.powerups = [];
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.comboTimeout = null;
        this.maxComboMultiplier = 150;
        this.isRunning = false;
        this.isPaused = false;
        this.keys = {};
        this.mouse = { x: 0, y: 0, isDown: false };
        this.gameWidth = 0;
        this.gameHeight = 0;
        this.playerName = '';
        this.highScores = [];
        this.level = 1;
        this.respawnTimer = null;
        this.invincible = false;
        this.specialBullets = [];
        this.lastTime = 0;
        this.fpsLastTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.deltaTime = 0;
        this.updateAccumulator = 0;
        this.showFPS = false; // Estado inicial
        this.fpsDisplay = null;
        this.fpsToggle = null;

        this.elements = {
            startScreen: document.getElementById('startScreen'),
            gameOverScreen: document.getElementById('gameOverScreen'),
            pauseScreen: document.getElementById('pauseScreen'),
            levelCompleteScreen: document.getElementById('levelCompleteScreen'),
            score: document.getElementById('score'),
            lives: document.getElementById('lives'),
            level: document.getElementById('level'),
            combo: document.getElementById('combo'),
            finalScore: document.getElementById('finalScore'),
            finalLevel: document.getElementById('finalLevel'),
            levelScore: document.getElementById('levelScore'),
            nextLevelInfo: document.getElementById('nextLevelInfo'),
            playerName: document.getElementById('playerName'),
            startButton: document.getElementById('startButton'),
            restartButton: document.getElementById('restartButton'),
            menuButton: document.getElementById('menuButton'),
            pauseButton: document.getElementById('pauseButton'),
            resumeButton: document.getElementById('resumeButton'),
            quitButton: document.getElementById('quitButton'),
            nextLevelButton: document.getElementById('nextLevelButton'),
            newHighScore: document.getElementById('newHighScore'),
            scoresList: document.getElementById('scoresList'),
            playerForm: document.getElementById('playerForm'),
            highScores: document.getElementById('highScores')
        };
        this.sounds = {
            shoot: new Audio('sounds/shoot.wav'),
            explosion: new Audio('sounds/explosion.wav'),
            powerup: new Audio('sounds/powerup.wav'),
            enemyShoot: new Audio('sounds/enemy_shoot.wav'),
            background: new Audio('sounds/background.wav')
        };
        this.isMobile = false;
        this.checkViewport();
        window.addEventListener('resize', this.handleResize.bind(this));
        this.init();
        this.touchControls = {
            left: false,
            right: false,
            up: false,
            down: false
        };
        this.initFpsDisplay();
    }
    initFpsDisplay() {
        // Crear elemento de visualización
        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.id = 'fpsDisplay';
        this.fpsDisplay.textContent = 'FPS: 0';
        this.fpsDisplay.style.display = 'none';
        document.body.appendChild(this.fpsDisplay);
    
        // Configurar el toggle
        this.fpsToggle = document.getElementById('fpsToggle');
        this.fpsToggle.addEventListener('click', () => {
            this.showFPS = !this.showFPS;
            this.fpsToggle.classList.toggle('active', this.showFPS);
            this.fpsToggle.textContent = `FPS: ${this.showFPS ? 'ON' : 'OFF'}`;
            this.fpsDisplay.style.display = this.showFPS ? 'block' : 'none';
        });
        
        // Mostrar elementos cuando empieza el juego
        this.fpsToggle.classList.remove('hidden');
    }
    checkViewport() {
        const wasMobile = this.isMobile;
        this.isMobile = window.matchMedia("(max-width: 768px)").matches;
        
        if (wasMobile !== this.isMobile) {
            this.applyViewportStyles();
        }
    }

    handleResize() {
        this.checkViewport();
        this.resizeCanvas(); // Asegurar que el canvas también se redimensione
    }

    applyViewportStyles() {
        if (this.isMobile) {
            // Estilos específicos para mobile
            document.body.classList.add('mobile-view');
            document.body.classList.remove('desktop-view');
            // Estilos específicos para desktop
            document.body.classList.add('desktop-view');
            document.body.classList.remove('mobile-view');
            console.log("Modo desktop activado");
        }
        
        // Reforzar estilos del canvas
        this.adjustCanvasStyles();
    }

    adjustCanvasStyles() {
        const canvas = document.getElementById('gameCanvas');
        if (this.isMobile) {
            canvas.style.position = 'fixed';
            canvas.style.touchAction = 'none';
            canvas.style.width = '100vw';
            canvas.style.height = '100vh';
        } else {
            canvas.style.position = 'absolute';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
        }
    }


    init() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
        
        this.setupEventListeners();
        this.loadHighScores();
        this.createStars();
        
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
    }

// Métodos para controlar sonidos
playSound(soundName, loop = false) {
    const sound = this.sounds[soundName];
    sound.currentTime = 0;
    sound.loop = loop;
    sound.play();
}

stopSound(soundName) {
    this.sounds[soundName].pause();
    this.sounds[soundName].currentTime = 0;
}

resizeCanvas() {
    this.gameWidth = window.innerWidth;
    this.gameHeight = window.innerHeight;
    this.canvas.width = this.gameWidth;
    this.canvas.height = this.gameHeight;
    
    // Ajustar posición del jugador si existe
    if (this.player) {
        this.player.x = Math.min(this.player.x, this.gameWidth - 20);
        this.player.y = Math.min(this.player.y, this.gameHeight - 30);
    }
    
    // Aplicar estilos específicos según el viewport
    this.adjustCanvasStyles();
}

    setupEventListeners() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'Escape' && this.isRunning) {
                this.togglePause();
            }
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            this.mouse.x = e.clientX - rect.left;
            this.mouse.y = e.clientY - rect.top;
        });
        
        this.canvas.addEventListener('mousedown', () => {
            this.mouse.isDown = true;
        });
        
        this.canvas.addEventListener('mouseup', () => {
            this.mouse.isDown = false;
        });
        
        // Control táctil mejorado
    this.canvas.addEventListener('touchmove', (e) => {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        this.mouse.x = touch.clientX - rect.left;
        this.mouse.y = touch.clientY - rect.top;
        
        // Mover jugador hacia la posición táctil
        if (this.player) {
            const moveSpeed = 10;
            const dx = this.mouse.x - this.player.x;
            const dy = this.mouse.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > 5) {
                this.player.x += (dx / distance) * moveSpeed;
                this.player.y += (dy / distance) * moveSpeed;
            }
        }
    }, { passive: false });
        
        this.canvas.addEventListener('touchstart', () => {
            this.mouse.isDown = true;
        });
        
        this.canvas.addEventListener('touchend', () => {
            this.mouse.isDown = false;
        });
        
        this.elements.startButton.addEventListener('click', () => this.startGame());
        this.elements.restartButton.addEventListener('click', () => this.startGame());
        this.elements.menuButton.addEventListener('click', () => this.showMainMenu());
        this.elements.pauseButton.addEventListener('click', () => this.togglePause());
        this.elements.resumeButton.addEventListener('click', () => this.togglePause());
        this.elements.quitButton.addEventListener('click', () => this.showMainMenu());
        this.elements.nextLevelButton.addEventListener('click', () => this.nextLevel());
    }

    createStars() {
        for (let i = 0; i < this.config.starCount; i++) {
            this.stars.push(new Star(this.gameWidth, this.gameHeight));
        }
    }

    loadHighScores() {
        
    const key = `spaceDefenderHighScores_${this.difficulty}`;
    const savedScores = localStorage.getItem(key);
        if (savedScores) {
            this.highScores = JSON.parse(savedScores);
            this.updateHighScoresDisplay();
        } else {
            this.elements.scoresList.innerHTML = '<p class="text-gray-400 py-2">No hay puntuaciones guardadas</p>';
        }
    }

    saveHighScores() {
        const key = `spaceDefenderHighScores_${this.difficulty}`;
        localStorage.setItem(key, JSON.stringify(this.highScores));
    }

    updateHighScoresDisplay() {
        this.elements.scoresList.innerHTML = '';
        
        if (this.highScores.length === 0) {
            this.elements.scoresList.innerHTML = '<p class="text-gray-400 py-2">No hay puntuaciones guardadas</p>';
            return;
        }
        
        this.highScores.forEach((score, index) => {
            const scoreElement = document.createElement('div');
            scoreElement.className = 'flex justify-between items-center py-2 border-b border-gray-700';
            scoreElement.innerHTML = `
                <span class="font-medium">${index + 1}. ${score.name}</span>
                <span class="font-bold text-yellow-400">${score.score}</span>
            `;
            this.elements.scoresList.appendChild(scoreElement);
        });
    }

    startGame() {
        this.difficulty = document.getElementById('difficulty').value;
    this.config.difficulty = this.difficulty;
    this.config.levels = generateLevels(50, this.difficulty);
        this.cleanGame();
        this.playerName = this.elements.playerName.value.trim();
    
    // Validar nombre
    if (!this.playerName) {
        this.showNameError("¡Debes ingresar un nombre!");
        return;
    }
    
    // Verificar si el jugador ya existe
    const existingPlayerIndex = this.highScores.findIndex(score => score.name === this.playerName);
    
    // Si existe pero el nuevo score es mayor, actualizarlo
    if (existingPlayerIndex !== -1) {
        const existingScore = this.highScores[existingPlayerIndex].score;
        // Solo continuar, se actualizará al final si supera el récord
    }
    
    // Resto del código de inicio del juego...
    this.playSound('background', true);
    document.querySelectorAll('.ship, .fa-space-shuttle, .powerup').forEach(el => el.remove());
        
        this.player = new Player(this, this.gameWidth / 2, this.gameHeight - 100);
        this.bullets = [];
        this.enemies = [];
        this.particles = [];
        this.powerups = [];
        this.score = 0;
        this.lives = 3;
        this.combo = 0;
        this.comboMultiplier = 1;
        this.level = 1;
        this.isRunning = true;
        this.isPaused = false;
        
        this.elements.score.textContent = this.score;
        this.updateLives();
        this.elements.level.textContent = this.level;
        this.elements.combo.textContent = `x${this.comboMultiplier}`;
        this.elements.newHighScore.classList.add('hidden');
        
        this.elements.startScreen.classList.add('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.levelCompleteScreen.classList.add('hidden');
        this.elements.pauseButton.classList.remove('hidden');
        
        this.createEnemiesForLevel();
    }

    showNameError(message) {
        const errorElement = document.createElement('div');
        errorElement.className = 'name-error absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white p-4 rounded-lg shadow-lg';
        errorElement.textContent = message;
        document.body.appendChild(errorElement);
        
        setTimeout(() => {
            if (errorElement.parentNode) {
                document.body.removeChild(errorElement);
            }
        }, 3000);
    }
    cleanGame() {
        // Limpiar arrays
        this.bullets = [];
        this.enemies.forEach(e => e.destroy());
        this.enemies = [];
        this.particles = [];
        this.powerups.forEach(p => p.destroy());
        this.powerups = [];
        
        // Limpiar elementos DOM residuales
        document.querySelectorAll(
            '.ship, .fa-space-shuttle, .powerup, .explosion, .shield-effect, .powerup-notification, .health-bar'
        ).forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        
        // Resetear combo
        this.combo = 0;
        this.comboMultiplier = 1;
        this.elements.combo.textContent = `x${this.comboMultiplier}`;
        this.elements.combo.classList.remove('combo-animation');
    }

    createEnemiesForLevel() {
        const levelConfig = this.config.levels.find(l => l.number === this.level) || this.config.levels[0];
        const difficulty = this.difficulty || 'medium';
        const diff = this.config.difficultySettings[difficulty] || this.config.difficultySettings.medium;
        
        // Ajustes para móvil
        const spacing = this.isMobile ? 30 : 40;
        const maxWidth = this.gameWidth * (this.isMobile ? 0.9 : 1);
        const maxEnemies = this.isMobile ? Math.min(15, levelConfig.enemies) : levelConfig.enemies;
    
        const createEnemy = (x, y) => {
            // Aplicar modificadores de dificultad (se mantiene igual)
            const health = Math.round(levelConfig.enemyHealth * diff.multipliers.health * 10) / 10;
            const speed = Math.round(levelConfig.enemySpeed * diff.multipliers.speed * 100) / 100;
            const fireRate = Math.round(levelConfig.enemyFireRate * diff.multipliers.fireRate);
            
            let enemy;
            const rand = Math.random();
            if (this.level > 5 && rand < 0.1) {
                enemy = new MediumEnemy(this, x, y);
            } else if (this.level > 10 && rand < 0.05) {
                enemy = new CarrierEnemy(this, x, y);
            } else {
                enemy = new Enemy(this, x, y, health, speed, fireRate);
            }
            
            return enemy;
        };
    
        // Generación de formaciones (adaptadas para móvil pero completas)
        switch(levelConfig.formation) {
            case 'line':
                const lineCount = Math.min(maxEnemies, Math.floor(maxWidth / spacing));
                for (let i = 0; i < lineCount; i++) {
                    const x = this.gameWidth / 2 - (lineCount * spacing) / 2 + i * spacing;
                    const y = this.isMobile ? 80 : 100;
                    this.enemies.push(createEnemy(x, y));
                }
                // Generación por oleadas si no caben todos
                if (levelConfig.enemies > lineCount) {
                    this.setupWaveSpawning(levelConfig.enemies - lineCount, lineCount, spacing);
                }
                break;
                
            case 'square':
                const side = Math.ceil(Math.sqrt(maxEnemies));
                for (let i = 0; i < maxEnemies; i++) {
                    const row = Math.floor(i / side);
                    const col = i % side;
                    const x = this.gameWidth / 2 - (side * spacing) / 2 + col * spacing;
                    const y = (this.isMobile ? 60 : 80) + row * spacing;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'circle':
                const radius = Math.min(this.isMobile ? 100 : 150, maxWidth * 0.4);
                for (let i = 0; i < maxEnemies; i++) {
                    const angle = (i / maxEnemies) * Math.PI * 2;
                    const x = this.gameWidth / 2 + Math.cos(angle) * radius;
                    const y = (this.isMobile ? 100 : 120) + Math.sin(angle) * radius;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'spiral':
                for (let i = 0; i < maxEnemies; i++) {
                    const angle = (i * 0.4) * Math.PI;
                    const radius = 50 + i * (this.isMobile ? 8 : 12);
                    const x = this.gameWidth / 2 + Math.cos(angle) * radius;
                    const y = (this.isMobile ? 80 : 100) + Math.sin(angle) * radius;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'phalanx':
                const phalanxRows = Math.ceil(maxEnemies / 5);
                for (let i = 0; i < maxEnemies; i++) {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const x = this.gameWidth / 2 - 100 + col * (this.isMobile ? 45 : 50);
                    const y = (this.isMobile ? 60 : 80) + row * (this.isMobile ? 35 : 40);
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'mixed':
                const half = Math.ceil(maxEnemies / 2);
                // Línea
                for (let i = 0; i < half; i++) {
                    const x = this.gameWidth / 2 - (half * spacing) / 2 + i * spacing;
                    const y = this.isMobile ? 80 : 100;
                    this.enemies.push(createEnemy(x, y));
                }
                // Círculo
                for (let i = 0; i < maxEnemies - half; i++) {
                    const angle = (i / (maxEnemies - half)) * Math.PI * 2;
                    const radius = this.isMobile ? 80 : 100;
                    const x = this.gameWidth / 2 + Math.cos(angle) * radius;
                    const y = (this.isMobile ? 120 : 150) + Math.sin(angle) * radius;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
        }
    
        // Jefe (se mantiene igual)
        if (levelConfig.hasBoss) {
            const bossX = this.gameWidth / 2;
            const bossY = this.isMobile ? 120 : 150;
            const boss = new BossEnemy(this, bossX, bossY);
            boss.health = levelConfig.enemyHealth * 3;
            boss.maxHealth = boss.health;
            boss.size = this.isMobile ? 50 : 70;
            boss.element.style.fontSize = this.isMobile ? '40px' : '50px';
            this.enemies.push(boss);
        }
    
        // Configurar enemigos con misiles (se mantiene igual)
        if (levelConfig.hasMissileEnemies) {
            const missileEnemiesCount = Math.min(3 + Math.floor(this.level / 5), this.enemies.length);
            for (let i = 0; i < missileEnemiesCount; i++) {
                this.enemies[i].isMissileEnemy = true;
                this.enemies[i].fireRate = 2000 - (this.level * 30);
                this.enemies[i].element.innerHTML = '<i class="fas fa-missile"></i>';
                this.enemies[i].element.style.color = '#ff5555';
            }
        }
    
        // Configurar enemigos kamikaze (se mantiene igual)
        if (this.level > 8) {
            const kamikazeCount = Math.min(2 + Math.floor(this.level / 10), this.enemies.length);
            for (let i = 0; i < kamikazeCount; i++) {
                this.enemies[i].isKamikaze = true;
                this.enemies[i].speed *= 1.5;
                this.enemies[i].element.style.color = '#ff0000';
            }
        }
    }
    
    // Nuevo método helper para generación por oleadas
    setupWaveSpawning(count, perWave, spacing) {
        this.delayedEnemies = count;
        this.delayedEnemyTimer = setInterval(() => {
            if (this.delayedEnemies > 0) {
                const enemiesToSpawn = Math.min(perWave, this.delayedEnemies);
                for (let i = 0; i < enemiesToSpawn; i++) {
                    const x = this.gameWidth / 2 - (perWave * spacing) / 2 + i * spacing;
                    const y = 50;
                    this.enemies.push(createEnemy(x, y));
                }
                this.delayedEnemies -= enemiesToSpawn;
            } else {
                clearInterval(this.delayedEnemyTimer);
            }
        }, 3000); // Cada 3 segundos
    }

    nextLevel() {
        this.level++;
        this.elements.level.textContent = this.level;
        
        // Guardar estado del escudo antes de limpiar
        const shieldActive = this.player?.shieldActive;
        const shieldElement = this.player?.shieldElement;
        const shieldTimer = this.player?.shieldTimer;
        
        // Limpiar todo completamente
        this.enemies.forEach(enemy => enemy.destroy());
        this.bullets = [];
        this.powerups.forEach(powerup => powerup.destroy());
        this.powerups = [];
        this.particles = [];
        
        // Limpiar cualquier elemento DOM residual
        document.querySelectorAll('.explosion, .powerup-notification').forEach(el => {
            if (el.parentNode) el.parentNode.removeChild(el);
        });
        
        this.elements.levelCompleteScreen.classList.add('hidden');
        
        // Restaurar el escudo si estaba activo
        if (shieldActive && this.player) {
            this.player.shieldActive = true;
            this.player.shieldElement = shieldElement;
            this.player.shieldTimer = shieldTimer;
        }
        
        setTimeout(() => {
            this.createEnemiesForLevel();
            this.isRunning = true;
        }, 300);
    }

    showMainMenu() {
        this.cleanGame();
        this.stopSound('background');
        document.querySelectorAll('.ship, .fa-space-shuttle, .powerup').forEach(el => el.remove());
        
        this.loadHighScores();
        
        this.elements.startScreen.classList.remove('hidden');
        this.elements.gameOverScreen.classList.add('hidden');
        this.elements.pauseScreen.classList.add('hidden');
        this.elements.levelCompleteScreen.classList.add('hidden');
        this.elements.pauseButton.classList.add('hidden');
        
        this.isRunning = false;
        this.isPaused = false;
    }

    togglePause() {
        this.isPaused = !this.isPaused;
        
        if (this.isPaused) {
            this.elements.pauseScreen.classList.remove('hidden');
        } else {
            this.elements.pauseScreen.classList.add('hidden');
        }
    }

    gameOver() {
        this.isRunning = false;
        this.elements.finalScore.textContent = this.score;
        this.elements.finalLevel.textContent = this.level;
        this.elements.gameOverScreen.classList.remove('hidden');
        this.elements.pauseButton.classList.add('hidden');
        
        const isNewHighScore = this.highScores.length < this.config.maxHighScores || 
                             this.score > this.highScores[this.highScores.length - 1]?.score;
        
        if (isNewHighScore) {
            this.elements.newHighScore.classList.remove('hidden');
            
            this.highScores.push({
                name: this.playerName,
                score: this.score,
                level: this.level,
                date: new Date().toISOString()
            });
            
            this.highScores.sort((a, b) => b.score - a.score);
            if (this.highScores.length > this.config.maxHighScores) {
                this.highScores = this.highScores.slice(0, this.config.maxHighScores);
            }
            
            this.saveHighScores();
            this.updateHighScoresDisplay();
        }
    }
    levelComplete() {
        this.isRunning = false;
        this.elements.levelScore.textContent = this.score;
        
        const nextLevel = this.config.levels.find(l => l.number === this.level + 1) || { 
            number: this.level + 1, 
            enemies: Math.floor(5 + (this.level + 1) * 1.2),
            enemyHealth: Math.min(15, 1 + Math.floor((this.level + 1) / 3)),
            hasBoss: (this.level + 1) % 5 === 0 && (this.level + 1) > 10,
            description: 'Nivel generado dinámicamente'
        };
    
        // Mensaje especial para nivel 100 (victoria final)
        if (this.level === 100) {
            this.elements.nextLevelInfo.innerHTML = `
                <div class="text-center p-4">
                    <h3 class="text-2xl font-bold text-yellow-400 mb-2">¡FELICIDADES!</h3>
                    <p class="mb-4">Has completado todos los niveles</p>
                    <div class="bg-yellow-900 bg-opacity-30 p-3 rounded-lg mb-4">
                        <i class="fas fa-trophy text-4xl text-yellow-400 mb-2"></i>
                        <p class="text-sm">Eres un verdadero maestro del espacio</p>
                    </div>
                    <div class="stats-grid grid grid-cols-2 gap-2">
                        <div class="bg-gray-700 p-2 rounded text-center">
                            <i class="fas fa-star text-yellow-400 block mb-1"></i>
                            <span class="text-sm">Puntuación: ${this.score}</span>
                        </div>
                        <div class="bg-gray-700 p-2 rounded text-center">
                            <i class="fas fa-medal text-blue-400 block mb-1"></i>
                            <span class="text-sm">Nivel máximo: 100</span>
                        </div>
                    </div>
                </div>
            `;
            this.elements.nextLevelButton.textContent = 'Volver al Menú';
            this.elements.nextLevelButton.onclick = () => this.showMainMenu();
            this.elements.levelCompleteScreen.classList.remove('hidden');
            this.elements.pauseButton.classList.add('hidden');
            return; // Salir temprano para el nivel 100
        }
    
        // Versión simplificada para móviles
        if (this.isMobile) {
            this.elements.nextLevelInfo.innerHTML = `
                <div class="mobile-level-info">
                    <h4 class="text-lg font-bold mb-2">Nivel ${nextLevel.number}</h4>
                    <div class="grid grid-cols-2 gap-2 mb-3">
                        <div class="bg-gray-700 p-2 rounded text-center">
                            <i class="fas fa-space-shuttle text-red-400 block mb-1"></i>
                            <span class="text-sm">${nextLevel.enemies} enemigos</span>
                        </div>
                        <div class="bg-gray-700 p-2 rounded text-center">
                            <i class="fas fa-shield-alt text-blue-400 block mb-1"></i>
                            <span class="text-sm">${Math.ceil(nextLevel.enemyHealth * 1.5)} balas</span>
                        </div>
                    </div>
                    ${nextLevel.hasBoss ? `
                    <div class="bg-red-900 bg-opacity-30 p-2 rounded text-center text-sm">
                        <i class="fas fa-skull mr-1"></i> ¡Viene un BOSS!
                    </div>
                    ` : ''}
                </div>
            `;
        } else {
            // Versión completa para desktop
            const difficulty = this.difficulty || 'medium';
            const diff = this.config.difficultySettings[difficulty] || this.config.difficultySettings.medium;
            
            const enemyCount = Math.floor(nextLevel.enemies * diff.enemyCount);
            const enemyHealth = Math.round(nextLevel.enemyHealth * diff.multipliers.health * 10) / 10;
            const bulletsNeeded = Math.ceil(enemyHealth / 1);
    
            this.elements.nextLevelInfo.innerHTML = `
                <div class="mb-3">
                    <h4 class="font-bold text-lg mb-1">Próximo Nivel ${nextLevel.number}:</h4>
                    <p class="text-sm">${nextLevel.description}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-3">
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="flex items-center">
                            <i class="fas fa-space-shuttle text-red-400 mr-2"></i>
                            <span>Enemigos:</span>
                        </div>
                        <div class="text-center text-xl font-bold mt-1">${enemyCount}</div>
                    </div>
                    
                    <div class="bg-gray-800 p-2 rounded">
                        <div class="flex items-center">
                            <i class="fas fa-shield-alt text-blue-400 mr-2"></i>
                            <span>Resistencia:</span>
                        </div>
                        <div class="text-center text-xl font-bold mt-1">
                            ${bulletsNeeded} <span class="text-sm">balas</span>
                        </div>
                    </div>
                </div>
                
                ${nextLevel.hasBoss ? `
                <div class="mt-3 bg-red-900 bg-opacity-30 p-2 rounded border border-red-600">
                    <i class="fas fa-skull mr-2"></i> ¡Cuidado! El próximo nivel incluye un BOSS
                </div>
                ` : ''}
            `;
        }
    
        this.elements.levelCompleteScreen.classList.remove('hidden');
        this.elements.pauseButton.classList.add('hidden');
    }
    updateLives() {
        this.elements.lives.textContent = this.lives;
    }
    addScore(points) {
        // Reiniciar el timeout del combo
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
    
        // Aumentar el combo y el multiplicador (linealmente)
        this.combo++;
        this.comboMultiplier = Math.min(this.maxComboMultiplier, 1 + Math.floor(this.combo / 1)); // x1 por nave
        
        // Calcular puntos ganados
        const earnedPoints = Math.floor(points * this.comboMultiplier);
        this.score += earnedPoints;
        this.elements.score.textContent = this.score;
        
        // Mostrar feedback visual
        this.showComboFeedback(earnedPoints);
        
        // Reiniciar el combo después de 5 segundos sin destruir naves
        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, 5000); // 5 segundos
    }
    
    // Simplificar el feedback visual
    showComboFeedback(pointsEarned) {
        this.elements.combo.textContent = `x${this.comboMultiplier}`;
        this.elements.combo.classList.add('combo-animation');
        
        const comboText = document.createElement('div');
        comboText.className = 'combo-feedback absolute font-bold pointer-events-none';
        comboText.style.left = `${this.player.x}px`;
        comboText.style.top = `${this.player.y - 50}px`;
    
       // Sistema de categorías de combo
if (this.comboMultiplier >= 100) {
    // COMBO MODO DIOS (100+)
    comboText.style.color = '#ffffff';
    comboText.style.fontSize = '20px';
    comboText.classList.add('god-mode');
    comboText.textContent = `MODO DIOS! x${this.comboMultiplier}`;
    this.playSound('godMode');
} else if (this.comboMultiplier >= 80) {
    // COMBO TITÁN (80-99)
    comboText.style.color = '#ff8c00';  // Naranja más oscuro
    comboText.style.fontSize = '15px';
    comboText.textContent = `FUERZA TITÁN! x${this.comboMultiplier}`;
} else if (this.comboMultiplier >= 60) {
    // COMBO LEGENDARIO (60-79)
    comboText.style.color = '#00bfff';  // Azul más brillante
    comboText.style.fontSize = '15px';
    comboText.textContent = `LEYENDA VIVIENTE! x${this.comboMultiplier}`;
} else if (this.comboMultiplier >= 40) {
    // COMBO ÉPICO (40-59)
    comboText.style.color = '#ff00ff';  // Magenta brillante
    comboText.style.fontSize = '15px';
    comboText.textContent = `PODER ÉPICO! x${this.comboMultiplier}`;
} else if (this.comboMultiplier >= 20) {
    // COMBO IMPRESIONANTE (20-39)
    comboText.style.color = '#00ffff';  // Cian brillante
    comboText.style.fontSize = '12px';
    comboText.textContent = `RACHA IMPRESIONANTE! x${this.comboMultiplier}`;
} else {
    // COMBO BÁSICO (1-19)
    comboText.style.color = '#ffff00';  // Amarillo
    comboText.style.fontSize = '15px';
    comboText.style.textShadow = '0 0 5px #000000';  // Sombra negra para mejor contraste
    comboText.textContent = `Combo x${this.comboMultiplier} +${pointsEarned}`;
}

// Efecto especial para combos altos
if (this.comboMultiplier >= 20) {
    comboText.classList.add('high-combo');
    this.createComboParticles(this.comboMultiplier);
}
    
        document.body.appendChild(comboText);
        setTimeout(() => comboText.remove(), 1000);
    }
    
    createComboParticles(multiplier) {
        const particleCount = Math.min(100, multiplier * 3);
        let particleColor;
        
        if (multiplier >= 100) {
            particleColor = '#ff0000';  // Rojo para modo dios
        } else if (multiplier >= 80) {
            particleColor = '#ff8c00';  // Naranja
        } else if (multiplier >= 60) {
            particleColor = '#00bfff';  // Azul
        } else if (multiplier >= 40) {
            particleColor = '#ff00ff';  // Magenta
        } else if (multiplier >= 20) {
            particleColor = '#00ffff';  // Cian
        } else {
            particleColor = '#ffff00';  // Amarillo
        }
    
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + multiplier * 0.15;
            this.particles.push(new Particle(
                this.player.x,
                this.player.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                particleColor,
                Math.random() * 5 + 3,  // Tamaño mayor
                2.0  // Vida más larga
            ));
        }
    }
    
    resetCombo() {
        if (this.combo > 0) {
            const comboEnd = document.createElement('div');
            comboEnd.className = 'combo-end absolute text-red-500 font-bold text-lg pointer-events-none';
            comboEnd.textContent = `COMBO PERDIDO (${this.combo} naves)`;
            comboEnd.style.left = `${this.player?.x || this.gameWidth/2}px`;
            comboEnd.style.top = `${this.player?.y || this.gameHeight/2}px`;
            document.body.appendChild(comboEnd);
            setTimeout(() => comboEnd.remove(), 1500);
        }
        
        this.combo = 0;
        this.comboMultiplier = 1;
        this.elements.combo.textContent = `x${this.comboMultiplier}`;
        this.elements.combo.classList.remove('combo-animation');
    }

    // Mejor método de colisión (circular)
checkCollision(obj1, obj2) {
    const radius1 = (obj1.size || Math.max(obj1.width, obj1.height))/2;
    const radius2 = (obj2.size || Math.max(obj2.width, obj2.height))/2;
    const dx = obj1.x - obj2.x;
    const dy = obj1.y - obj2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < radius1 + radius2;
}
    updateUI() {
        // Verificar si el jugador existe
        if (!this.player) return;
        
        // Actualizar salud del jugador
        const healthPercent = Math.floor((this.player.health / this.player.maxHealth) * 100);
        document.getElementById('health').textContent = `(${healthPercent}%)`;
        
        // Actualizar timers de power-ups
        const powerupTimers = document.getElementById('powerupTimers');
        powerupTimers.innerHTML = '';
        
        const types = {
            'fireRate': { icon: 'fa-bolt', color: 'text-yellow-400' },
            'firePower': { icon: 'fa-fire', color: 'text-orange-500' },
            'shield': { icon: 'fa-shield-alt', color: 'text-blue-400' }
        };
        
        for (const type in types) {
            if ((type === 'fireRate' && this.player.fireRate < 200) || 
                (type === 'firePower' && this.player.firePower > 1) ||
                (type === 'shield' && this.player.shieldActive)) {
                const timer = document.createElement('div');
                timer.className = `powerup-timer-icon ${types[type].color} text-sm`;
                timer.innerHTML = `<i class="fas ${types[type].icon}"></i>`;
                powerupTimers.appendChild(timer);
            }
        }
    }
    gameLoop(timestamp) {
        // Inicialización de tiempos en el primer frame
        if (!this.lastTime) {
            this.lastTime = timestamp;
            this.fpsLastTime = timestamp;
            this.frameCount = 0;
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }
    
        // Cálculo del tiempo transcurrido
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
    
        // 1. Cálculo de FPS (siempre se calcula, aunque no se muestre)
        this.frameCount++;
        if (timestamp - this.fpsLastTime >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.fpsLastTime = timestamp;
            
            // Actualizar display de FPS si está activo
            if (this.showFPS && this.fpsDisplay) {
                this.fpsDisplay.textContent = `FPS: ${this.fps} | Objs: ${this.enemies.length + this.bullets.length + this.particles.length}`;
                
                // Cambiar color según rendimiento
                if (this.fps < 30) {
                    this.fpsDisplay.style.color = 'red';
                } else if (this.fps < 50) {
                    this.fpsDisplay.style.color = 'yellow';
                } else {
                    this.fpsDisplay.style.color = 'limegreen';
                }
            }
           
        }
    
        // 2. Lógica de juego estable a 60 FPS
        if (!this.isPaused && this.isRunning) {
            this.updateAccumulator += this.deltaTime;
            const fixedDelta = 1000 / 60; // 16.67ms para 60 FPS
            
            // Ejecutar updates necesarios para ponerse al día
            while (this.updateAccumulator >= fixedDelta) {
                this.update(fixedDelta);
                this.updateAccumulator -= fixedDelta;
                
                // Prevenir spiral of death
                if (this.updateAccumulator > 1000) {
                    console.warn("Catch-up limitado para evitar sobrecarga");
                    this.updateAccumulator = 0;
                    break;
                }
            }
        } else {
            // Pausa: solo avanzar el tiempo de partículas
            this.particles.forEach(p => p.lifetime += this.deltaTime/1000);
        }
    
        // 3. Renderizado fluido a máxima tasa de refresco
        this.render();
        this.updateUI();
    
        // 4. Gestión inteligente del próximo frame
        const targetFPS = 120; // Máximo deseado (ajustable)
        const minFrameTime = 1000 / targetFPS;
        
        // Limitar FPS en dispositivos muy potentes para ahorrar energía
        if (this.deltaTime < minFrameTime) {
            const waitTime = minFrameTime - this.deltaTime;
            setTimeout(() => {
                requestAnimationFrame((t) => this.gameLoop(t));
            }, waitTime);
        } else {
            // Solicitar inmediatamente si estamos por debajo del target
            requestAnimationFrame((t) => this.gameLoop(t));
        }
    }

    update(deltaTime) {
        for (let i = this.specialBullets.length - 1; i >= 0; i--) {
            this.specialBullets[i].update();
            
            if (Date.now() - this.specialBullets[i].born > this.specialBullets[i].lifetime) {
                this.specialBullets.splice(i, 1);
            }
        }
        
        // Verificar colisiones con balas especiales
        for (let i = this.specialBullets.length - 1; i >= 0; i--) {
            if (this.specialBullets[i].isEnemy && this.player && 
                this.checkCollision(this.specialBullets[i], this.player)) {
                this.player.takeDamage(this.specialBullets[i].damage);
                this.specialBullets.splice(i, 1);
            }
        }
        if (this.player) {
            this.player.update(deltaTime);
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            this.bullets[i].update();
            
            if (Date.now() - this.bullets[i].born > this.bullets[i].lifetime) {
                this.bullets.splice(i, 1);
            }
        }
        
        for (let i = this.enemies.length - 1; i >= 0; i--) {
            this.enemies[i].update();
        
        if (this.player && !this.player.invincible && this.checkCollision(this.player, this.enemies[i])) {
            this.player.takeDamage();
            this.enemies[i].explode();
            this.enemies[i].destroy(); // Asegurar destrucción
            this.enemies.splice(i, 1);
            continue;
        }
            
            for (let j = this.bullets.length - 1; j >= 0; j--) {
                if (!this.bullets[j].isEnemy && this.checkCollision(this.bullets[j], this.enemies[i])) {
                    const points = this.enemies[i].takeDamage(this.bullets[j].damage);
                    if (points > 0) {
                        this.addScore(points);
                    }
                    this.bullets.splice(j, 1);
                    if (this.enemies[i] && this.enemies[i].health <= 0) {
                        this.enemies.splice(i, 1);
                    }
                    break;
                }
            }
        }
        
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            if (this.bullets[i].isEnemy && this.player && this.checkCollision(this.bullets[i], this.player)) {
                this.player.takeDamage();
                this.bullets.splice(i, 1);
            }
        }
        
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update();
            if (this.powerups[i].shouldRemove) {
                this.powerups.splice(i, 1);
            }
        }
        
        for (let i = this.particles.length - 1; i >= 0; i--) {
            this.particles[i].update(deltaTime);
            if (this.particles[i].lifetime <= 0) {
                this.particles.splice(i, 1);
            }
        }
        
        if (this.enemies.length === 0 && this.isRunning) {
            this.levelComplete();
        }
    }

    render() {
        this.ctx.fillStyle = '#000';
        this.ctx.fillRect(0, 0, this.gameWidth, this.gameHeight);
        
        this.stars.forEach(star => star.draw(this.ctx));
        this.particles.forEach(particle => particle.draw(this.ctx));
        this.bullets.forEach(bullet => bullet.draw(this.ctx));
        this.specialBullets.forEach(bullet => bullet.draw(this.ctx));
    }
    
   
}

window.addEventListener('load', () => {
    const game = new Game();
});