// Configuración de dificultad
const difficultySettings = {
    easy: {
        multipliers: { health: 0.8, damage: 0.7, speed: 0.8, fireRate: 1.2 },
        enemyCount: 0.8,
        description: "Fácil - Enemigos más débiles y lentos"
    },
    medium: {
        multipliers: { health: 1, damage: 1, speed: 1, fireRate: 1 },
        enemyCount: 1,
        description: "Normal - Equilibrado"
    },
    hard: {
        multipliers: { 
            health: 1.5, 
            damage: 1.5,  // Aumentado de 1.3
            speed: 1.2, 
            fireRate: 0.7 // Reducido de 0.8
        },
        enemyCount: 1.3,  // Aumentado de 1.2
        description: "Difícil - Enemigos mucho más fuertes y rápidos"
    }
};

// Configuración de niveles generados dinámicamente
function generateLevels(count, difficulty = 'medium') {
    const difficultyConfig = difficultySettings[difficulty] || difficultySettings.medium;
    const levels = [];
    
    for (let i = 1; i <= count; i++) {
        const baseEnemies = Math.floor((5 + Math.floor(i * 1.2)) * difficultyConfig.enemyCount);
        const health = Math.floor((1 + Math.floor(i / 3)) * difficultyConfig.multipliers.health);
        const speed = (1.5 + (i * 0.15)) * difficultyConfig.multipliers.speed;
        const fireRate = Math.max(300, 2000 - (i * 30) * difficultyConfig.multipliers.fireRate);
        
        const formations = ['line', 'square', 'circle', 'mixed', 'spiral', 'phalanx'];
        const formation = formations[(i - 1) % formations.length];
        
        // Enemigos especiales
        const hasBoss = i > 10 && i % 5 === 0;
        const hasElite = i > 7 && i % 3 === 0;
        const hasMissileEnemies = i > 15;
        
        levels.push({
            number: i,
            enemies: baseEnemies + (hasBoss ? 1 : 0) + (hasElite ? 2 : 0),
            enemyHealth: Math.min(15, health),
            enemySpeed: Math.min(6, speed),
            enemyFireRate: fireRate,
            formation: formation,
            description: getLevelDescription(i, formation, difficulty),
            hasBoss: hasBoss,
            hasElite: hasElite,
            hasMissileEnemies: hasMissileEnemies,
            difficulty: difficulty,
            fireRate: Math.max(250, 2000 - (i * 40) * difficultyConfig.multipliers.fireRate),
        });
    }
    return levels;
}

function getLevelDescription(level, formation, difficulty) {
    const formations = {
        'line': 'formación en línea',
        'square': 'formación cuadrada',
        'circle': 'formación circular',
        'mixed': 'formación combinada',
        'spiral': 'formación en espiral',
        'phalanx': 'formación en falange'
    };
    
    const difficulties = {
        easy: [
            'Oleada básica',
            'Enemigos lentos',
            'Enemigos débiles',
            'Oleada pequeña',
            'Enemigos novatos'
        ],
        medium: [
            'Oleada estándar',
            'Enemigos rápidos',
            'Enemigos resistentes',
            'Oleada doble',
            'Enemigos veteranos'
        ],
        hard: [
            'Oleada peligrosa',
            'Enemigos veloces',
            'Enemigos blindados',
            'Oleada múltiple',
            'Enemigos de élite'
        ]
    };
    
    const diff = difficulties[difficulty] || difficulties.medium;
    const difficultyText = diff[Math.min(level - 1, diff.length - 1)];
    
    return `${difficultyText} en ${formations[formation]}`;
}

// Configuración base del juego
const baseConfig = {
    bulletSpeed: 10,
    fireRate: 200,
    enemySpeed: 1.5,
    enemyFireRate: 1000,
    comboTime: 2000,
    starCount: 100,
    maxHighScores: 10,
    playerRespawnTime: 2000,
    difficulty: 'medium' // Valor por defecto
};

// Clases auxiliares
class Star {
    constructor(gameWidth, gameHeight) {
        this.x = Math.random() * gameWidth;
        this.y = Math.random() * gameHeight;
        this.size = Math.random() * 2 + 0.5;
        this.brightness = Math.random();
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.brightness})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

class Particle {
    constructor(x, y, vx, vy, color, size, lifetime) {
        this.x = x;
        this.y = y;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.size = size;
        this.lifetime = lifetime;
        this.maxLifetime = lifetime;
    }

    update(deltaTime) {
        const timeFactor = deltaTime / 16;
        this.x += this.vx * timeFactor;
        this.y += this.vy * timeFactor;
        this.vy += 0.05 * timeFactor; // Gravedad ajustada
        this.lifetime -= deltaTime / 1000;
        this.size = Math.max(0, this.size * (0.98 ** timeFactor));
    }

    draw(ctx) {
        const alpha = this.lifetime / this.maxLifetime;
        ctx.fillStyle = `${this.color.replace(')', `, ${alpha})`).replace('rgb', 'rgba')}`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Exportar configuración
const gameConfig = {
    ...baseConfig,
    levels: generateLevels(50, baseConfig.difficulty),
    difficultySettings: difficultySettings
};