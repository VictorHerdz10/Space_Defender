
import { Particle } from "./particles.js";
export class Bullet {
    constructor(game, x, y, angle, isEnemy = false) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.angle = angle;
        this.speed = isEnemy ? 7 : 10;
        this.lifetime = 5000;
        this.born = Date.now();
        this.size = isEnemy ? 8 : 5; // Tamaño más grande para balas enemigas
        this.isEnemy = isEnemy;
        this.damage = isEnemy ? 25 : 1;
        this.glowIntensity = isEnemy ? 0.8 : 0; // Efecto de brillo para enemigos
    }

    update() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
    
        const margin = 50;
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

        if (this.isEnemy) {
            // Efecto de brillo para balas enemigas
            if (this.glowIntensity > 0) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = '#ff0000';
            }
            
            // Cuerpo de la bala más grande y visible
            ctx.fillStyle = '#ef4444';
            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.lineTo(30, 0); // Más larga que antes (era 20)
            ctx.lineWidth = this.size * 1.5; // Más gruesa
            ctx.stroke();
            
            // Punta de la bala más grande
            ctx.fillStyle = '#ff0000';
            ctx.beginPath();
            ctx.arc(30, 0, this.size, 0, Math.PI * 2); // Radio más grande (era size/2)
            ctx.fill();
            
            // Efecto de núcleo brillante
            ctx.fillStyle = '#ffffff';
            ctx.beginPath();
            ctx.arc(30, 0, this.size/2, 0, Math.PI * 2);
            ctx.fill();
        } else {
            // Balas del jugador (sin cambios o ajustes menores)
            ctx.fillStyle = '#f59e0b';
            ctx.fillRect(0, -this.size/2, 15, this.size);
        }

        ctx.restore();
    }
}

export class HomingMissile extends Bullet {
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
