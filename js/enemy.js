
import { Bullet,HomingMissile } from "./bullet.js";
import { Particle} from "./particles.js";
import { PowerUp } from "./powerup.js";
export class Enemy {
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

export class MediumEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 3, 1.8, 800);
        this.size = 40;
        this.element.innerHTML = '<i class="fas fa-space-shuttle fa-lg"></i>';
        this.element.style.fontSize = `${this.size * 0.7}px`; // Añadir esto
    }
}

export class CarrierEnemy extends Enemy {
    constructor(game, x, y) {
        super(game, x, y, 8, 0.7, 2000);
        this.size = 60;
        this.element.innerHTML = '<i class="fas fa-space-station"></i>';
        this.element.style.fontSize = `${this.size * 0.7}px`; // Añadir esto
    }
}
export class BossEnemy extends Enemy {
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
