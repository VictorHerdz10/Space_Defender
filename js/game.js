class Player {
    constructor(game, x, y) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 60;
        this.speed = 0;
        this.maxSpeed = 5;
        this.maxHealth = 100;
        this.health = this.maxHealth;
        this.shieldActive = false;
        this.shieldElement = null;
        this.lastFire = 0;
        this.thrusting = false;
        this.invincible = false;
        this.invincibleTime = 0;
        this.firePower = 1;
        this.fireRate = 200;
        this.powerUpTimer = null;
        
        
        
        this.createElement();
        this.createHealthBar(); // Nueva función
    }
    createHealthBar() {
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'player-health absolute top-0 left-0 w-full h-1 bg-blue-500';
        this.element.appendChild(this.healthBar);
        this.updateHealthBar();
    }
    updateHealthBar() {
        const healthPercent = (this.health / this.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthBar.style.backgroundColor = 
            healthPercent > 50 ? '#3b82f6' : 
            healthPercent > 25 ? '#f59e0b' : '#ef4444';
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'ship absolute w-10 h-16 flex items-center justify-center text-3xl';
        this.element.innerHTML = '<i class="fas fa-rocket text-blue-500"></i>';
        document.body.appendChild(this.element);
    }

    update(deltaTime) {
        const moveX = (this.game.keys['ArrowRight'] || this.game.keys['d']) ? 1 : 
                     (this.game.keys['ArrowLeft'] || this.game.keys['a']) ? -1 : 0;
        const moveY = (this.game.keys['ArrowDown'] || this.game.keys['s']) ? 1 : 
                     (this.game.keys['ArrowUp'] || this.game.keys['w']) ? -1 : 0;

        this.x += moveX * this.maxSpeed;
        this.y += moveY * this.maxSpeed;

        this.x = Math.max(0, Math.min(this.game.gameWidth, this.x));
        this.y = Math.max(0, Math.min(this.game.gameHeight, this.y));

        this.element.style.left = `${this.x - 20}px`;
        this.element.style.top = `${this.y - 30}px`;

        if (Date.now() - this.lastFire > this.fireRate) {
            this.fire();
            this.lastFire = Date.now();
        }

        if (this.invincible) {
            this.invincibleTime -= deltaTime;
            this.element.classList.add('invincible');
            if (this.invincibleTime <= 0) {
                this.invincible = false;
                this.element.classList.remove('invincible');
            }
        }
        if (this.shieldElement) {
            this.shieldElement.style.left = `${this.x - 30}px`;
            this.shieldElement.style.top = `${this.y - 30}px`;
        }
    }

    fire() {
        this.game.playSound('shoot');
        for (let i = 0; i < this.firePower; i++) {
            const offset = (i - (this.firePower - 1) / 2) * 15;
            const bulletX = this.x + offset;
            const bulletY = this.y - this.height/2;
            this.game.bullets.push(new Bullet(this.game, bulletX, bulletY, -Math.PI/2));
        }
        this.createThrustParticles();
    }

    createThrustParticles() {
        for (let i = 0; i < 5; i++) {
            const angle = Math.PI + (Math.random() * 0.4 - 0.2);
            const speed = Math.random() * 2 + 1;
            this.game.particles.push(new Particle(
                this.x,
                this.y + this.height/2,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#3b82f6',
                1,
                0.5
            ));
        }
    }

    takeDamage(damage = 25) {
        if (this.invincible || this.shieldActive) return;
    
        // Reiniciar combo al recibir daño
        this.game.resetCombo();
        
        // Resto de la lógica de daño...
        this.health = Math.max(0, this.health - damage);
        this.updateHealthBar();
        
        if (this.health <= 0) {
            this.game.lives--;
            this.game.updateLives();
            this.createExplosion();
            
            if (this.game.lives <= 0) {
                this.game.gameOver();
            } else {
                this.respawn();
            }
        }
    }

    createExplosion() {
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${this.x - 30}px`;
        explosion.style.top = `${this.y - 30}px`;
        explosion.style.width = '60px';
        explosion.style.height = '60px';
        explosion.style.backgroundColor = '#3b82f6';
        document.body.appendChild(explosion);
        
        setTimeout(() => {
            if (explosion.parentNode) {
                document.body.removeChild(explosion);
            }
        }, 500);
        
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 5 + 2;
            this.game.particles.push(new Particle(
                this.x, this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#3b82f6',
                Math.random() * 3 + 1,
                Math.random() * 0.5 + 0.5
            ));
        }
    }

    respawn() {
        this.invincible = true;
        this.invincibleTime = 2000;
        this.x = this.game.gameWidth / 2;
        this.y = this.game.gameHeight - 100;
    }

    applyPowerUp(type, duration) {
        if (this.powerUpTimer) {
            clearTimeout(this.powerUpTimer);
        }
    
        this.showPowerUpNotification(type);
        this.game.playSound('powerup');
    
        switch(type) {
            case 'fireRate':
                this.fireRate = 100;
                break;
            case 'shield':
                this.activateShield(duration);
                break;
            case 'firePower':
                this.firePower = 3;
                break;
            case 'life':
                this.game.lives = Math.min(5, this.game.lives + 1);
                this.game.updateLives();
                return; // No necesitamos timer para vida
        }
    
        if (type !== 'life') {
            this.powerUpTimer = setTimeout(() => {
                this.resetPowerUp(type);
            }, duration);
        }
    }
    
    resetPowerUp(type) {
        switch(type) {
            case 'fireRate':
                this.fireRate = 200;
                break;
            case 'shield':
                this.shieldActive = false;
                if (this.shieldElement && this.shieldElement.parentNode) {
                    this.shieldElement.remove();
                }
                break;
            case 'firePower':
                this.firePower = 1;
                break;
        }
    }
    activateShield(duration) {
        // Limpiar escudo existente primero
        if (this.shieldElement && this.shieldElement.parentNode) {
            this.shieldElement.remove();
        }
        
        this.shieldActive = true;
        this.createShieldElement();
        
        // Limpiar timer existente
        if (this.shieldTimer) {
            clearTimeout(this.shieldTimer);
        }
        
        this.shieldTimer = setTimeout(() => {
            this.shieldActive = false;
            if (this.shieldElement && this.shieldElement.parentNode) {
                this.shieldElement.remove();
            }
        }, duration);
    }

    createShieldElement() {
        this.shieldElement = document.createElement('div');
        this.shieldElement.className = 'shield-effect absolute rounded-full border-2 border-blue-400';
        this.shieldElement.style.width = '60px';
        this.shieldElement.style.height = '60px';
        this.shieldElement.style.left = `${this.x - 30}px`;
        this.shieldElement.style.top = `${this.y - 30}px`;
        this.shieldElement.style.boxShadow = '0 0 15px rgba(59, 130, 246, 0.7)';
        document.body.appendChild(this.shieldElement);
    }
    showPowerUpNotification(type) {
        const effect = document.createElement('div');
        effect.className = 'powerup-notification absolute flex items-center justify-center text-2xl text-white font-bold';
        effect.style.left = `${this.x - 30}px`;
        effect.style.top = `${this.y - 50}px`;
        
        const colors = {
            'fireRate': 'text-yellow-400',
            'firePower': 'text-orange-500',
            'shield': 'text-blue-400',
            'life': 'text-red-400'
        };
        
        effect.className += ` ${colors[type]}`;
        
        const texts = {
            'fireRate': 'RÁPIDO DISPARO!',
            'firePower': 'PODER EXTRA!',
            'shield': 'ESCUDO ACTIVO!',
            'life': 'VIDA EXTRA!'
        };
        
        effect.textContent = texts[type];
        document.body.appendChild(effect);
        
        // Animación
        let pos = -50;
        const anim = setInterval(() => {
            pos -= 1;
            effect.style.top = `${this.y + pos}px`;
            effect.style.opacity = (100 - pos) / 100;
            
            if (pos < -100) {
                clearInterval(anim);
                if (effect.parentNode) {
                    document.body.removeChild(effect);
                }
            }
        }, 20);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            document.body.removeChild(this.element);
        }
    }
}

class Bullet {
    constructor(game, x, y, angle, isEnemy = false) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = isEnemy ? 7 : 10;
        this.lifetime = 5000; // Aumentamos el tiempo de vida (5 segundos)
        this.born = Date.now();
        this.size = 5;
        this.isEnemy = isEnemy;
        this.damage = isEnemy ? 25 : 1;
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    
        // Eliminar solo si el tiempo de vida expira o sale completamente de pantalla
        const margin = 50; // Margen fuera de la pantalla antes de eliminar
        if (Date.now() - this.born > this.lifetime || 
            this.x < -margin || this.x > this.game.gameWidth + margin || 
            this.y < -margin || this.y > this.game.gameHeight + margin) {
            this.lifetime = 0;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);

        // Balas enemigas más largas y visibles
        if (this.isEnemy) {
            ctx.fillStyle = '#ef4444';
            // Forma más larga para balas enemigas
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(20, 0);
            ctx.lineWidth = this.size;
            ctx.stroke();
            
            // Punta de la bala
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(20, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Balas del jugador
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(0, -this.size/2, 15, this.size);
        }

        ctx.restore();
    }
}

class Enemy {
    constructor(game, x, y, health = 1, speed = 1.5, fireRate = 1000) {
        // Validar y aplicar modificadores de dificultad
        const difficulty = game.difficulty || 'medium';
        const diff = game.config.difficultySettings[difficulty] || game.config.difficultySettings.medium;
        
        // Aplicar modificadores con redondeo
        this.health = Math.round(health * diff.multipliers.health * 10) / 10; // 1 decimal
        this.speed = Math.round(speed * diff.multipliers.speed * 100) / 100; // 2 decimales
        this.fireRate = Math.round(fireRate * diff.multipliers.fireRate);
        
        // Valores mínimos/máximos de seguridad
        this.health = Math.max(1, this.health);
        this.speed = Math.min(6, Math.max(0.5, this.speed));
        this.fireRate = Math.max(300, this.fireRate);

        this.game = game;
        this.x = x;
        this.y = y;
        this.size = 30;
        this.maxHealth = this.health; // Usar el valor ya modificado
        this.lastFire = 0;
        this.color = `hsl(${Math.random() * 60 + 330}, 100%, 50%)`;
        this.isKamikaze = Math.random() < 0.1;
        
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'absolute flex items-center justify-center text-red-500';
        this.element.innerHTML = '<i class="fas fa-space-shuttle"></i>';
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        this.element.style.fontSize = `${this.size * 0.7}px`;
        document.body.appendChild(this.element);
        
        this.healthBar = document.createElement('div');
        this.healthBar.className = 'absolute top-0 left-0 w-full h-1 bg-red-500';
        this.element.appendChild(this.healthBar);
    }

    update() {
        if (this.isKamikaze) {
            const dx = this.game.player.x - this.x;
            const dy = this.game.player.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            this.x += (dx / dist) * this.speed * 1.5;
            this.y += (dy / dist) * this.speed * 1.5;
        } else {
            this.x += Math.sin(Date.now() / 1000) * 0.5;
            this.y += this.speed * 0.2;
            
            if (Date.now() - this.lastFire > this.fireRate) {
                this.fire();
                this.lastFire = Date.now();
            }
        }

        this.element.style.left = `${this.x - this.size/2}px`;
        this.element.style.top = `${this.y - this.size/2}px`;
        this.element.style.color = this.color;
        
        const healthPercent = (this.health / this.maxHealth) * 100;
        this.healthBar.style.width = `${healthPercent}%`;
        this.healthBar.style.backgroundColor = healthPercent > 50 ? '#10B981' : 
                                              healthPercent > 25 ? '#F59E0B' : '#EF4444';
                                              if (this.y > this.game.gameHeight + this.size) {
                                                this.y = -this.size;
                                                this.x = Math.random() * this.game.gameWidth;
                                            }
    }

    fire() {
        this.game.playSound('enemyShoot');
        const dx = this.game.player.x - this.x;
        const dy = this.game.player.y - this.y;
        const angle = Math.atan2(dy, dx);
        
        // Balas normales hacen 25 de daño
        const bullet = new Bullet(this.game, this.x, this.y, angle, true);
        bullet.damage = 25;
        this.game.bullets.push(bullet);
        
        this.createFireParticles();
    }

    createFireParticles() {
        for (let i = 0; i < 5; i++) {
            const angle = this.isKamikaze ? Math.PI : Math.random() * Math.PI * 2;
            const speed = Math.random() * 2 + 1;
            this.game.particles.push(new Particle(
                this.x - Math.cos(angle) * 20,
                this.y - Math.sin(angle) * 20,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                '#ef4444',
                1,
                0.5
            ));
        }
    }

    takeDamage(damage) {
        this.health -= damage;
        
        if (this.health <= 0) {
            this.explode();
            this.destroy();
            return 200 * this.maxHealth;
        }
        return 0;
    }

    explode() {
        this.game.playSound('explosion');
        const explosion = document.createElement('div');
        explosion.className = 'explosion';
        explosion.style.left = `${this.x - this.size}px`;
        explosion.style.top = `${this.y - this.size}px`;
        explosion.style.width = `${this.size * 2}px`;
        explosion.style.height = `${this.size * 2}px`;
        explosion.style.backgroundColor = this.color;
        document.body.appendChild(explosion);
        
        setTimeout(() => {
            if (explosion.parentNode) {
                document.body.removeChild(explosion);
            }
        }, 500);
        
        for (let i = 0; i < 20; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 3 + 1;
            this.game.particles.push(new Particle(
                this.x, this.y,
                Math.cos(angle) * speed,
                Math.sin(angle) * speed,
                this.color,
                Math.random() * 3 + 1,
                Math.random() * 0.5 + 0.5
            ));
        }
        
        if (Math.random() < 0.3) {
            this.dropPowerUp();
        }
    }

    dropPowerUp() {
        const types = ['fireRate', 'firePower', 'shield', 'life'];
        const type = types[Math.floor(Math.random() * types.length)];
        const duration = type === 'life' ? 0 : 10000;
        
        this.game.powerups.push(new PowerUp(this.game, this.x, this.y, type, duration));
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            // Eliminar también la barra de salud
            if (this.healthBar && this.healthBar.parentNode) {
                this.element.removeChild(this.healthBar);
            }
            document.body.removeChild(this.element);
            this.element = null; // Añadir esto
            this.healthBar = null; // Añadir esto
        }
    }
}

class PowerUp {
    constructor(game, x, y, type, duration) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.size = 20;
        this.type = type;
        this.duration = duration;
        this.speed = 1;
        this.shouldRemove = false;
        this.duration = duration;
        this.timeLeft = duration;
        this.timerElement = null;
        
        this.createElement();
    }

    createElement() {
        this.element = document.createElement('div');
        this.element.className = 'powerup absolute flex items-center justify-center text-white';
        this.element.style.width = `${this.size}px`;
        this.element.style.height = `${this.size}px`;
        
        let icon, bgColor;
        switch(this.type) {
            case 'fireRate':
                icon = 'fa-bolt';
                bgColor = 'bg-yellow-500';
                break;
            case 'firePower':
                icon = 'fa-fire';
                bgColor = 'bg-orange-500';
                break;
            case 'shield':
                icon = 'fa-shield-alt';
                bgColor = 'bg-blue-500';
                break;
            case 'life':
                icon = 'fa-heart';
                bgColor = 'bg-red-500';
                break;
        }
        
        this.element.className += ` ${bgColor}`;
        this.element.innerHTML = `<i class="fas ${icon}"></i>`;
        document.body.appendChild(this.element);
        this.createTimerElement();
    }
    
    createTimerElement() {
        if (!this.element) return;
        
        this.timerElement = document.createElement('div');
        this.timerElement.className = 'powerup-timer absolute bottom-0 left-0 w-full h-1 bg-white';
        this.element.appendChild(this.timerElement);
    }

    update() {
        this.y += this.speed;
        
        this.element.style.left = `${this.x - this.size/2}px`;
        this.element.style.top = `${this.y - this.size/2}px`;
        
        if (this.checkCollisionWithPlayer()) {
            this.applyEffect();
            this.shouldRemove = true;
            this.destroy();
            return; // Salir del método después de destruir el power-up
        }
        
        if (this.y > this.game.gameHeight + this.size) {
            this.shouldRemove = true;
            this.destroy();
            return; // Salir del método después de destruir el power-up
        }
        
        // Solo actualizar el timer si el elemento existe
        if (this.timerElement && this.timerElement.parentNode) {
            this.timeLeft -= 16; // Aprox. 60fps
            const percent = (this.timeLeft / this.duration) * 100;
            this.timerElement.style.width = `${percent}%`;
        }
    }

    checkCollisionWithPlayer() {
        const player = this.game.player;
        const dx = this.x - player.x;
        const dy = this.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        return distance < (this.size + Math.max(player.width, player.height)) / 2;
    }

    applyEffect() {
        this.game.player.applyPowerUp(this.type, this.duration);
    }

    destroy() {
        if (this.element && this.element.parentNode) {
            if (this.timerElement && this.timerElement.parentNode) {
                this.element.removeChild(this.timerElement);
            }
            document.body.removeChild(this.element);
        }
        // Limpiar referencias
        this.element = null;
        this.timerElement = null;
        this.shouldRemove = true;
    }
}
class MediumEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 3, 1.8, 800);
        this.size = 40;
        this.element.innerHTML = '<i class="fas fa-space-shuttle fa-lg"></i>';
        this.element.style.fontSize = `${this.size * 0.7}px`; // Añadir esto
    }
}

class CarrierEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 8, 0.7, 2000);
        this.size = 60;
        this.element.innerHTML = '<i class="fas fa-space-station"></i>';
        this.element.style.fontSize = `${this.size * 0.7}px`; // Añadir esto
    }
}
class BossEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 15, 0.5, 2000);
        this.size = 70;
        this.missileCooldown = 3000;
        this.lastMissile = 0;
        this.color = '#ff0000';
        this.bossHealthBar = null;
    }

    createElement() {
        super.createElement();
        this.element.innerHTML = '<i class="fas fa-space-shuttle fa-2x"></i>';
        this.element.style.color = this.color;
        
        // Crear barra de salud especial para el boss
        this.bossHealthBar = document.createElement('div');
        this.bossHealthBar.className = 'boss-health-bar absolute bottom-full left-0 w-full h-3 bg-red-500 mb-1';
        this.bossHealthBar.style.borderRadius = '3px';
        this.element.appendChild(this.bossHealthBar);
        
        // Barra de fondo
        const healthBarBg = document.createElement('div');
        healthBarBg.className = 'absolute bottom-full left-0 w-full h-3 bg-gray-700 mb-1';
        healthBarBg.style.borderRadius = '3px';
        healthBarBg.style.zIndex = '-1';
        this.element.insertBefore(healthBarBg, this.bossHealthBar);
    }

    update() {
        super.update();
        
        // Actualizar barra de salud del boss
        if (this.bossHealthBar) {
            const healthPercent = (this.health / this.maxHealth) * 100;
            this.bossHealthBar.style.width = `${healthPercent}%`;
            
            // Cambiar color según salud
            if (healthPercent > 60) {
                this.bossHealthBar.style.backgroundColor = '#10B981'; // Verde
            } else if (healthPercent > 30) {
                this.bossHealthBar.style.backgroundColor = '#F59E0B'; // Amarillo
            } else {
                this.bossHealthBar.style.backgroundColor = '#EF4444'; // Rojo
            }
        }
        
        if (Date.now() - this.lastMissile > this.missileCooldown) {
            this.fireMissile();
            this.lastMissile = Date.now();
        }
    }

    destroy() {
        if (this.bossHealthBar && this.bossHealthBar.parentNode) {
            this.bossHealthBar.parentNode.removeChild(this.bossHealthBar);
        }
        super.destroy();
    }

    fireMissile() {
        const angles = [-0.3, 0, 0.3];
        angles.forEach(angle => {
            const missile = new HomingMissile(
                this.game, 
                this.x, 
                this.y, 
                Math.PI/2 + angle,
                true
            );
            // Añadir misiles al array de misiles especiales
            this.game.specialBullets.push(missile);
        });
    }
}

class HomingMissile extends Bullet {
    constructor(game, x, y, angle, isEnemy) {
        super(game, x, y, angle, isEnemy);
        this.speed = 5;
        this.turnSpeed = 0.05;
        this.size = 12; // Más grande que las balas normales
        this.damage = 25; // Daño reducido para balancear
        this.trailParticles = [];
        this.lastParticle = 0;
    }

    update() {
        super.update();
        
        // Crear partículas de estela
        if (Date.now() - this.lastParticle > 50) {
            this.trailParticles.push(new Particle(
                this.x, this.y,
                -Math.cos(this.angle) * 0.5,
                -Math.sin(this.angle) * 0.5,
                '#ff5555',
                3,
                1
            ));
            this.lastParticle = Date.now();
        }
        
        // Actualizar partículas de estela
        this.trailParticles.forEach(p => p.update(16));
        this.trailParticles = this.trailParticles.filter(p => p.lifetime > 0);
    }

    draw(ctx) {
        // Dibujar estela primero
        this.trailParticles.forEach(p => p.draw(ctx));
        
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.angle);
        
        // Cuerpo del misil más detallado
        ctx.fillStyle = '#ff3333';
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(20, 0);
        ctx.lineTo(15, -this.size/2);
        ctx.lineTo(20, 0);
        ctx.lineTo(15, this.size/2);
        ctx.closePath();
        ctx.fill();
        
        // Punta del misil
        ctx.fillStyle = '#ff0000';
        ctx.beginPath();
        ctx.arc(20, 0, this.size/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

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
        
        const createEnemy = (x, y) => {
            // Aplicar modificadores de dificultad
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
    
        switch(levelConfig.formation) {
            case 'line':
                for (let i = 0; i < levelConfig.enemies; i++) {
                    const x = this.gameWidth / 2 - (levelConfig.enemies * 40) / 2 + i * 40;
                    const y = 100;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'square':
                const side = Math.ceil(Math.sqrt(levelConfig.enemies));
                for (let i = 0; i < levelConfig.enemies; i++) {
                    const row = Math.floor(i / side);
                    const col = i % side;
                    const x = this.gameWidth / 2 - (side * 40) / 2 + col * 40;
                    const y = 50 + row * 40;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'circle':
                const radius = Math.min(150, levelConfig.enemies * 15);
                for (let i = 0; i < levelConfig.enemies; i++) {
                    const angle = (i / levelConfig.enemies) * Math.PI * 2;
                    const x = this.gameWidth / 2 + Math.cos(angle) * radius;
                    const y = 150 + Math.sin(angle) * radius;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'spiral':
                for (let i = 0; i < levelConfig.enemies; i++) {
                    const angle = (i * 0.4) * Math.PI;
                    const radius = 50 + i * 10;
                    const x = this.gameWidth / 2 + Math.cos(angle) * radius;
                    const y = 100 + Math.sin(angle) * radius;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'phalanx':
                const rows = Math.ceil(levelConfig.enemies / 5);
                for (let i = 0; i < levelConfig.enemies; i++) {
                    const row = Math.floor(i / 5);
                    const col = i % 5;
                    const x = this.gameWidth / 2 - 100 + col * 50;
                    const y = 80 + row * 40;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
                
            case 'mixed':
                const half = Math.ceil(levelConfig.enemies / 2);
                // Primera mitad en línea
                for (let i = 0; i < half; i++) {
                    const x = this.gameWidth / 2 - (half * 40) / 2 + i * 40;
                    const y = 100;
                    this.enemies.push(createEnemy(x, y));
                }
                // Segunda mitad en círculo
                for (let i = 0; i < levelConfig.enemies - half; i++) {
                    const angle = (i / (levelConfig.enemies - half)) * Math.PI * 2;
                    const x = this.gameWidth / 2 + Math.cos(angle) * 100;
                    const y = 150 + Math.sin(angle) * 100;
                    this.enemies.push(createEnemy(x, y));
                }
                break;
        }
    
        // Añadir jefe si corresponde
        if (levelConfig.hasBoss) {
            const bossX = this.gameWidth / 2;
            const bossY = 150;
            const boss = new BossEnemy(this, bossX, bossY);
            boss.health = levelConfig.enemyHealth * 3;
            boss.maxHealth = boss.health;
            boss.size = 70; // Tamaño más grande
            boss.element.style.fontSize = '50px'; // Ajustar icono
            this.enemies.push(boss);
        }
    
        // Configurar enemigos con misiles
        if (levelConfig.hasMissileEnemies) {
            const missileEnemiesCount = Math.min(3 + Math.floor(this.level / 5), this.enemies.length);
            for (let i = 0; i < missileEnemiesCount; i++) {
                this.enemies[i].isMissileEnemy = true;
                this.enemies[i].fireRate = 2000 - (this.level * 30);
                this.enemies[i].element.innerHTML = '<i class="fas fa-missile"></i>';
                this.enemies[i].element.style.color = '#ff5555';
            }
        }
    
        // Configurar enemigos kamikaze en niveles altos
        if (this.level > 8) {
            const kamikazeCount = Math.min(2 + Math.floor(this.level / 10), this.enemies.length);
            for (let i = 0; i < kamikazeCount; i++) {
                this.enemies[i].isKamikaze = true;
                this.enemies[i].speed *= 1.5;
                this.enemies[i].element.style.color = '#ff0000';
            }
        }
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
        
        const nextLevel = this.config.levels.find(l => l.number === this.level + 1) || 
                         { 
                           number: this.level + 1, 
                           enemies: Math.floor(5 + (this.level + 1) * 1.2),
                           enemyHealth: Math.min(15, 1 + Math.floor((this.level + 1) / 3))
                         };
        
        const difficulty = this.difficulty || 'medium';
        const diff = this.config.difficultySettings[difficulty] || this.config.difficultySettings.medium;
        
        // Calcular valores reales con dificultad
        const enemyCount = Math.floor(nextLevel.enemies * diff.enemyCount);
        const enemyHealth = Math.round(nextLevel.enemyHealth * diff.multipliers.health * 10) / 10;
        
        // Calcular resistencia en balas necesarias (basado en daño de bala del jugador)
        const playerBulletDamage = 1; // Daño base de las balas del jugador
        const bulletsNeeded = Math.ceil(enemyHealth / playerBulletDamage);
        
        this.elements.nextLevelInfo.innerHTML = `
            <div class="mb-3">
                <h4 class="font-bold text-lg mb-1">Próximo Nivel ${nextLevel.number}:</h4>
                <p class="text-sm">${nextLevel.description || 'Nivel generado dinámicamente'}</p>
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
                    <div class="text-xs text-center mt-1 text-gray-400">
                        (${enemyHealth.toFixed(1)} pts salud)
                    </div>
                </div>
            </div>
            
            <div class="mt-4 bg-gray-800 p-3 rounded">
                <h4 class="font-bold mb-2">Resistencias Especiales:</h4>
                <div class="text-sm">
                    <div class="flex justify-between items-center py-1">
                        <span class="flex items-center">
                            <i class="fas fa-space-shuttle text-red-400 mr-2"></i> Naves normales:
                        </span>
                        <span class="font-bold">${bulletsNeeded} balas</span>
                    </div>
                    ${nextLevel.hasElite ? `
                    <div class="flex justify-between items-center py-1">
                        <span class="flex items-center">
                            <i class="fas fa-star text-yellow-400 mr-2"></i> Naves élite:
                        </span>
                        <span class="font-bold">${Math.ceil(bulletsNeeded * 1.5)} balas</span>
                    </div>
                    ` : ''}
                    ${nextLevel.hasBoss ? `
                    <div class="flex justify-between items-center py-1">
                        <span class="flex items-center">
                            <i class="fas fa-skull text-red-500 mr-2"></i> Boss:
                        </span>
                        <span class="font-bold">${Math.ceil(bulletsNeeded * 3)} balas</span>
                    </div>
                    ` : ''}
                </div>
            </div>
            
            <div class="mt-4 bg-gray-800 p-3 rounded">
                <h4 class="font-bold mb-2">Tu Combo Actual:</h4>
                <div class="flex justify-between items-center">
                    <span>Naves seguidas:</span>
                    <span class="font-bold">${this.combo}</span>
                </div>
                <div class="flex justify-between items-center mt-1">
                    <span>Multiplicador:</span>
                    <span class="font-bold text-yellow-400">x${this.comboMultiplier}</span>
                </div>
                <div class="mt-2 text-xs text-gray-400">
                    Destruye naves consecutivamente sin recibir daño para mantener tu combo
                </div>
            </div>
            
            ${nextLevel.hasBoss ? `
            <div class="mt-3 bg-red-900 bg-opacity-30 p-2 rounded border border-red-600">
                <i class="fas fa-skull mr-2"></i> ¡Cuidado! El próximo nivel incluye un BOSS
            </div>
            ` : ''}
        `;
        
        
        
        this.elements.levelCompleteScreen.classList.remove('hidden');
        this.elements.pauseButton.classList.add('hidden');
    }
    updateLives() {
        this.elements.lives.textContent = this.lives;
    }

    addScore(points) {
        if (this.comboTimeout) {
            clearTimeout(this.comboTimeout);
        }
        
        // Incrementar combo con cada nave destruida
        this.combo++;
        
        // Actualizar multiplicador basado en kills consecutivos
        // Cada 3 naves aumenta el multiplicador (hasta máximo 5x)
        this.comboMultiplier = Math.min(5, Math.floor(this.combo / 3) + 1);
        
        // Calcular puntos con el multiplicador
        const earnedPoints = Math.floor(points * this.comboMultiplier);
        this.score += earnedPoints;
        this.elements.score.textContent = this.score;
        
        // Mostrar feedback visual del combo
        this.showComboFeedback(earnedPoints);
        
        // Resetear combo después de 3 segundos sin kills
        this.comboTimeout = setTimeout(() => {
            this.resetCombo();
        }, 3000);
    }
    
    showComboFeedback(pointsEarned) {
        // Actualizar display del multiplicador
        this.elements.combo.textContent = `x${this.comboMultiplier}`;
        
        // Mostrar animación solo si tenemos multiplicador > 1
        if (this.comboMultiplier > 1) {
            this.elements.combo.classList.add('combo-animation');
            
            // Crear efecto flotante de combo con los puntos ganados
            const comboText = document.createElement('div');
            comboText.className = 'combo-feedback absolute text-yellow-400 font-bold text-xl pointer-events-none';
            comboText.textContent = `+${pointsEarned} (x${this.comboMultiplier})`;
            comboText.style.left = `${this.player.x}px`;
            comboText.style.top = `${this.player.y - 50}px`;
            document.body.appendChild(comboText);
            
            // Eliminar después de la animación
            setTimeout(() => {
                if (comboText.parentNode) {
                    document.body.removeChild(comboText);
                }
            }, 1000);
        }
    }
    
    resetCombo() {
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
        if (!this.lastTime) this.lastTime = timestamp;
        this.deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;
        
        if (!this.isPaused && this.isRunning) {
            this.update(this.deltaTime);
        } else {
            // Pausar partículas
            this.particles.forEach(p => p.lifetime += this.deltaTime/1000);
        }
        this.particles = this.particles.filter(p => p.lifetime > 0);
        this.render();
        this.updateUI(); // Añadir esta línea
        requestAnimationFrame((timestamp) => this.gameLoop(timestamp));
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