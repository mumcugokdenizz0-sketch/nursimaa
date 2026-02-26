const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const text1 = document.getElementById('text1');
const text2 = document.getElementById('text2');
const progressBar = document.getElementById('progress-bar');
const finalScreen = document.getElementById('final-screen');

let width, height;
let currentStep = 1;
let progressValue = 0;
let isGameOver = false;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}
window.addEventListener('resize', resize);
resize();

const petalColors = [{ r: 255, g: 60, b: 90 }, { r: 255, g: 20, b: 60 }, { r: 255, g: 100, b: 150 }, { r: 200, g: 20, b: 180 }, { r: 255, g: 80, b: 40 }];
const stemColors = [{ r: 100, g: 180, b: 60 }, { r: 70, g: 150, b: 50 }, { r: 120, g: 190, b: 80 }];

function getRandomColor(list) { return list[Math.floor(Math.random() * list.length)]; }
function mixColors(c1, c2, ratio) { return { r: Math.round(c1.r * (1 - ratio) + c2.r * ratio), g: Math.round(c1.g * (1 - ratio) + c2.g * ratio), b: Math.round(c1.b * (1 - ratio) + c2.b * ratio) }; }

class Stem {
    constructor(endX, endY) {
        this.endX = endX; this.endY = endY;
        this.startX = endX + (Math.random() - 0.5) * 80;
        this.startY = height + 50;
        let dx = this.startX - this.endX; let dy = this.startY - this.endY;
        this.cp1x = this.startX - dx * 0.2 + (Math.random() - 0.5) * 100;
        this.cp1y = this.startY - dy * 0.3;
        this.cp2x = this.endX + dx * 0.2 + (Math.random() - 0.5) * 100;
        this.cp2y = this.endY + dy * 0.3;
        this.points = [];
        let dist = Math.hypot(this.endX - this.startX, this.endY - this.startY);
        this.totalSteps = Math.max(50, Math.floor(dist / 4));
        for (let i = 0; i <= this.totalSteps; i++) {
            let t = i / this.totalSteps;
            let x = Math.pow(1 - t, 3) * this.startX + 3 * Math.pow(1 - t, 2) * t * this.cp1x + 3 * (1 - t) * Math.pow(t, 2) * this.cp2x + Math.pow(t, 3) * this.endX;
            let y = Math.pow(1 - t, 3) * this.startY + 3 * Math.pow(1 - t, 2) * t * this.cp1y + 3 * (1 - t) * Math.pow(t, 2) * this.cp2y + Math.pow(t, 3) * this.endY;
            this.points.push({ x, y });
        }
        this.currentStep = 0; this.color = getRandomColor(stemColors);
        this.isFinished = false; this.growthSpeed = Math.random() * 1.2 + 1.0;
        this.width = Math.random() * 2 + 1.5;
        this.isSinking = false;
    }
    update() {
        if (!this.isSinking) {
            if (this.currentStep < this.totalSteps) this.currentStep += this.growthSpeed;
            else this.isFinished = true;
        } else {
            this.currentStep -= this.growthSpeed * 4;
            if (this.currentStep < 0) this.currentStep = 0;
        }
    }
    draw(ctx) {
        let maxIdx = Math.floor(this.currentStep);
        if (maxIdx <= 0) return;
        ctx.beginPath(); ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i <= Math.min(maxIdx, this.totalSteps); i++) ctx.lineTo(this.points[i].x, this.points[i].y);
        ctx.strokeStyle = `rgb(${this.color.r}, ${this.color.g}, ${this.color.b})`;
        ctx.lineWidth = this.width; ctx.lineCap = 'round'; ctx.stroke();
    }
}

class Flower {
    constructor(x, y) {
        this.x = x; this.y = y; this.scale = 0; this.targetScale = Math.random() * 0.5 + 0.5;
        this.growthRate = Math.random() * 0.03 + 0.01; this.rotation = (Math.random() - 0.5) * 0.5;
        this.petals = [];
        let numPetals = Math.floor(Math.random() * 3) + 4;
        let baseColor = getRandomColor(petalColors);
        let secondaryColor = getRandomColor(petalColors);
        for (let i = 0; i < numPetals; i++) {
            let angle = (i / numPetals) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
            let length = Math.random() * 30 + 40;
            let width = length * (Math.random() * 0.4 + 0.6);
            let pColor = mixColors(baseColor, secondaryColor, Math.random() * 0.5);
            this.petals.push({ angle, length, width, color: pColor, controlDist1: Math.random() * 0.5 + 0.5, controlDist2: Math.random() * 0.5 + 0.5 });
        }
        this.coreSize = Math.random() * 6 + 4; this.coreColor = { r: 40, g: 10, b: 10 };
        this.isSinking = false;
        this.shouldBeRemoved = false;
    }
    update() {
        if (!this.isSinking) {
            if (this.scale < this.targetScale) this.scale += this.growthRate;
        } else {
            this.scale -= this.growthRate * 5;
            if (this.scale <= 0) {
                this.scale = 0;
                this.shouldBeRemoved = true;
            }
        }
    }
    draw(ctx, time) {
        if (this.scale <= 0) return;
        ctx.save(); ctx.translate(this.x, this.y);
        let sway = Math.sin(time * 0.001 + this.x) * 0.05; ctx.rotate(this.rotation + sway); ctx.scale(this.scale, this.scale);
        for (let p of this.petals) {
            ctx.save(); ctx.rotate(p.angle); ctx.beginPath(); ctx.moveTo(0, 0);
            let cp1x = p.width * p.controlDist1; let cp1y = p.length * 0.5;
            let cp2x = -p.width * p.controlDist2; let cp2y = p.length * 0.5;
            let endY = p.length;
            ctx.bezierCurveTo(cp1x, cp1y, cp1x, endY, 0, endY); ctx.bezierCurveTo(-cp2x, endY, cp2x, cp1y, 0, 0);
            let gradient = ctx.createRadialGradient(0, p.length * 0.3, 0, 0, p.length * 0.5, p.length);
            gradient.addColorStop(0, `rgb(${p.color.r}, ${p.color.g}, ${p.color.b})`);
            let edgeR = Math.max(0, p.color.r - 30); let edgeG = Math.max(0, p.color.g - 30); let edgeB = Math.max(0, p.color.b - 30);
            gradient.addColorStop(1, `rgb(${edgeR}, ${edgeG}, ${edgeB})`);
            ctx.fillStyle = gradient; ctx.shadowColor = 'rgba(0,0,0,0.3)'; ctx.shadowBlur = 5; ctx.fill(); ctx.restore();
        }
        ctx.beginPath(); ctx.arc(0, 0, this.coreSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgb(${this.coreColor.r}, ${this.coreColor.g}, ${this.coreColor.b})`;
        ctx.fill(); ctx.restore();
    }
}

class Bubble {
    constructor(x, y) {
        this.x = x; this.y = y;
        this.size = Math.random() * 1.2 + 0.3;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = Math.random() * 3 + 1.5;
        this.life = 25;
        this.maxLife = 25;
    }
    update() { this.x += this.speedX; this.y += this.speedY; this.life--; }
    draw(ctx) {
        if (this.life <= 0) return;
        let alpha = this.life / this.maxLife;
        ctx.beginPath(); ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 143, 163, ${alpha})`;
        ctx.fill();
    }
}

let entities = [];
const bubbles = [];

function addEntityRandomly(x, y) {
    const newEntity = { stem: new Stem(x, y), flower: null };
    const randomIndex = Math.floor(Math.random() * (entities.length + 1));
    entities.splice(randomIndex, 0, newEntity);
}

function triggerBubbles() {
    const barRect = progressBar.getBoundingClientRect();
    const currentX = barRect.right;
    for (let i = 0; i < 15; i++) {
        bubbles.push(new Bubble(currentX, 5));
    }
}

function handleInteraction(x, y) {
    if (isGameOver) return;

    if (currentStep === 1) {
        text1.classList.add('fade-out');
        setTimeout(() => {
            text1.style.display = 'none';
            text2.classList.remove('hidden-step');
            currentStep = 2;
        }, 1500);
    }
    else if (currentStep === 2) {
        text2.classList.add('fade-out');
        currentStep = 3;
        progressValue = 2;
        progressBar.style.width = progressValue + '%';
        triggerBubbles();
        addEntityRandomly(x, y);
        setTimeout(() => { text2.style.display = 'none'; }, 1500);
    }
    else if (currentStep === 3) {
        progressValue = Math.min(progressValue + 2, 100);
        progressBar.style.width = progressValue + '%';
        triggerBubbles();
        addEntityRandomly(x, y);

        if (progressValue >= 100) {
            isGameOver = true;
            entities.forEach(ent => {
                ent.stem.isSinking = true;
                if (ent.flower) ent.flower.isSinking = true;
            });
            setTimeout(() => {
                finalScreen.classList.add('show-final');
            }, 3000);
        }
    }
}

function animate(time) {
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    for (let i = bubbles.length - 1; i >= 0; i--) {
        bubbles[i].update();
        bubbles[i].draw(ctx);
        if (bubbles[i].life <= 0) bubbles.splice(i, 1);
    }

    // Çizim sırası: Dizinin başından sonuna (Yeni eklenen rastgele katmanda görünür)
    for (let i = 0; i < entities.length; i++) {
        let ent = entities[i];
        ent.stem.update();
        ent.stem.draw(ctx);
        
        if (!ent.stem.isSinking && ent.stem.isFinished && !ent.flower) {
            ent.flower = new Flower(ent.stem.endX, ent.stem.endY);
        }

        if (ent.flower) {
            ent.flower.update();
            ent.flower.draw(ctx, time);
        }
    }

    // Temizlik döngüsü
    for (let i = entities.length - 1; i >= 0; i--) {
        let ent = entities[i];
        if (ent.stem.isSinking && ent.stem.currentStep <= 0 && (!ent.flower || ent.flower.shouldBeRemoved)) {
            entities.splice(i, 1);
        }
    }

    requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

window.addEventListener('mousedown', (e) => handleInteraction(e.clientX, e.clientY));
window.addEventListener('touchstart', (e) => {
    e.preventDefault();
    handleInteraction(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
}, { passive: false });
