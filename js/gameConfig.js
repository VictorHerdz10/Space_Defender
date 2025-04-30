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
export function generateLevels(count, difficulty = 'medium') {
    const difficultyConfig = difficultySettings[difficulty] || difficultySettings.medium;
    const levels = [];
    
    for (let i = 1; i <= count; i++) {
        // Ajustar cantidad de enemigos para móvil
        const isMobile = window.matchMedia("(max-width: 768px)").matches;
        const baseEnemies = Math.floor((5 + Math.floor(i * 1.2)) * difficultyConfig.enemyCount * (isMobile ? 0.7 : 1));
        const health = Math.floor((1 + Math.floor(i / 3)) * difficultyConfig.multipliers.health);
        const speed = (1.5 + (i * 0.15)) * difficultyConfig.multipliers.speed;
        const fireRate = Math.max(300, 2000 - (i * 30) * difficultyConfig.multipliers.fireRate);
        
        // Formaciones ajustadas para móvil
        const formations = isMobile ? 
            ['line', 'square', 'circle', 'mixed'] : // Eliminamos formaciones complejas para móvil
            ['line', 'square', 'circle', 'mixed', 'spiral', 'phalanx'];
        
        const formation = formations[(i - 1) % formations.length];
        
        // Enemigos especiales con ajustes para móvil
        const hasBoss = i > 10 && i % 5 === 0;
        const hasElite = i > 7 && i % 3 === 0;
        const hasMissileEnemies = i > 15;
        
        levels.push({
            number: i,
            enemies: Math.min(isMobile ? 15 : 30, baseEnemies + (hasBoss ? 1 : 0) + (hasElite ? 2 : 0)),
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
            isMobileOptimized: isMobile // Añadimos flag para móvil
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


// Exportar configuración
export const gameConfig = {
    ...baseConfig,
    levels: generateLevels(100, baseConfig.difficulty),
    difficultySettings: difficultySettings
};