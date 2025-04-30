
import { Bullet,HomingMissile } from "./bullet.js";
import { Particle,Star } from "./particles.js";

export class Player {
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