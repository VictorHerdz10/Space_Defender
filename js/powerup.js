export class PowerUp {
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