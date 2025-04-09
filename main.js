const canvas = document.getElementById("simulation");
const ctx = canvas.getContext("2d");
const statsBox = document.getElementById("stats");

let width = window.innerWidth;
let height = window.innerHeight;
canvas.width = width;
canvas.height = height;

window.addEventListener("resize", () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
});

// Настройки
const INITIAL_COUNT = 90;
const MAX_CREATURES = 150;
const MAX_FOOD = 50;
const RADIUS = 5;
const FOOD_RADIUS = 3;
const BASE_SPEED = 1.5;
const MUTATION_CHANCE = 0.1;

const COLORS = {
    red: "#ff3b3b",
    green: "#3bff3b",
    blue: "#3b3bff"
};

class Creature {
    constructor(type, x = Math.random() * width, y = Math.random() * height, speed = BASE_SPEED) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * speed;
        this.vy = (Math.random() - 0.5) * speed;
        this.type = type;
        this.color = COLORS[type];
        this.energy = 100;
        this.cooldown = 0;
        this.speed = speed;
        this.alpha = 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x < RADIUS || this.x > width - RADIUS) this.vx *= -1;
        if (this.y < RADIUS || this.y > height - RADIUS) this.vy *= -1;

        this.energy -= 0.05;
        if (this.cooldown > 0) this.cooldown--;

        if (this.energy <= 0) this.alpha -= 0.02;
    }

    interact(other) {
        if (this === other) return;
        const dx = other.x - this.x;
        const dy = other.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIUS * 4 && dist > 0) {
            // Поведение
            if (this.type === "green" && other.type === "red") {
                this.vx -= dx / dist * 0.05;
                this.vy -= dy / dist * 0.05;
            }
            if (this.type === "blue" && other.type === "green") {
                this.vx += dx / dist * 0.05;
                this.vy += dy / dist * 0.05;
            }

            // Размножение
            if (this.type === other.type && dist < RADIUS * 2 && this.cooldown === 0 && other.cooldown === 0) {
                if (creatures.length < MAX_CREATURES) {
                    const newType = Math.random() < MUTATION_CHANCE ? getRandomType() : this.type;
                    const newSpeed = mutateSpeed((this.speed + other.speed) / 2);
                    creatures.push(new Creature(newType, this.x, this.y, newSpeed));
                    this.energy -= 15;
                    other.energy -= 15;
                    this.cooldown = 100;
                    other.cooldown = 100;
                }
            }
        }
    }

    eat(food) {
        const dx = food.x - this.x;
        const dy = food.y - this.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < RADIUS + FOOD_RADIUS) {
            this.energy += 30;
            return true;
        }
        return false;
    }

    draw() {
        ctx.beginPath();
        ctx.globalAlpha = this.alpha;
        ctx.arc(this.x, this.y, RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.globalAlpha = 1;
    }

    isDead() {
        return this.alpha <= 0;
    }
}

class Food {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, FOOD_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = "yellow";
        ctx.fill();
    }
}

function mutateSpeed(base) {
    const variation = (Math.random() - 0.5) * 0.5;
    return Math.max(0.5, Math.min(3, base + variation));
}

function getRandomType() {
    const types = Object.keys(COLORS);
    return types[Math.floor(Math.random() * types.length)];
}

let creatures = [];
let foods = [];

for (let i = 0; i < INITIAL_COUNT; i++) {
    const type = i < INITIAL_COUNT / 3 ? "red" : i < (2 * INITIAL_COUNT / 3) ? "green" : "blue";
    creatures.push(new Creature(type));
}

function updateStats() {
    const counts = { red: 0, green: 0, blue: 0 };
    for (let c of creatures) counts[c.type]++;
    statsBox.innerHTML = `
        <b>Популяции:</b><br>
        <span style="color:${COLORS.red}">Красные: ${counts.red}</span><br>
        <span style="color:${COLORS.green}">Зелёные: ${counts.green}</span><br>
        <span style="color:${COLORS.blue}">Синие: ${counts.blue}</span><br>
        <span>Пищи: ${foods.length}</span><br>
        <span>Всего: ${creatures.length}</span>
    `;
}

function animate() {
    ctx.clearRect(0, 0, width, height);

    // Создание пищи
    if (foods.length < MAX_FOOD && Math.random() < 0.05) {
        foods.push(new Food());
    }

    // Еда
    for (let c of creatures) {
        for (let i = foods.length - 1; i >= 0; i--) {
            if (c.eat(foods[i])) {
                foods.splice(i, 1);
                break;
            }
        }
    }

    // Обновление и взаимодействие
    for (let c of creatures) {
        c.update();
        for (let other of creatures) c.interact(other);
    }

    creatures = creatures.filter(c => !c.isDead());

    for (let f of foods) f.draw();
    for (let c of creatures) c.draw();

    updateStats();
    requestAnimationFrame(animate);
}

animate();
