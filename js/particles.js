// Clases auxiliares
export class Star {
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

export class Particle {
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
