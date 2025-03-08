const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// 动态设置画布大小
const SCREEN_WIDTH = window.innerWidth;
const SCREEN_HEIGHT = window.innerHeight;
canvas.width = SCREEN_WIDTH;
canvas.height = SCREEN_HEIGHT;

// 颜色
const WHITE = "#FFFFFF";
const BLACK = "#000000";
const RED = "#FF0000";
const GREEN = "#00FF00";
const BLUE = "#0000FF";
const YELLOW = "#FFFF00";

// 游戏状态
let gameState = {
    score: 0,
    level: 1,
    playerHealth: 100,
    playerArmor: 100,
    gameOver: false,
    paused: false
};

// 玩家战机
class Player {
    constructor() {
        this.x = SCREEN_WIDTH / 2;
        this.y = SCREEN_HEIGHT - 100;
        this.width = 50;
        this.height = 50;
        this.speed = 5;
        this.bullets = [];
        this.health = 100;
        this.armor = 100;
        this.moving = "stop"; // 添加移动状态
    }

    draw() {
        ctx.fillStyle = BLUE;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    move(direction) {
        this.moving = direction;
    }

    update() {
        if (this.moving === "left" && this.x > 0) {
            this.x -= this.speed;
        }
        if (this.moving === "right" && this.x < SCREEN_WIDTH - this.width) {
            this.x += this.speed;
        }
    }

    shoot() {
        this.bullets.push(new Bullet(this.x + this.width / 2, this.y));
    }

    updateBullets() {
        this.bullets.forEach((bullet, index) => {
            bullet.update();
            if (bullet.y < 0) {
                this.bullets.splice(index, 1);
            }
        });
    }

    drawBullets() {
        this.bullets.forEach(bullet => bullet.draw());
    }
}

// 子弹
class Bullet {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 5;
        this.height = 10;
        this.speed = 10;
    }

    draw() {
        ctx.fillStyle = YELLOW;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y -= this.speed;
    }
}

// 敌机
class Enemy {
    constructor(x, y, speed, health) {
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.speed = speed;
        this.health = health;
    }

    draw() {
        ctx.fillStyle = RED;
        ctx.fillRect(this.x, this.y, this.width, this.height);
    }

    update() {
        this.y += this.speed;
    }
}

// 关卡
class Level {
    constructor(level) {
        this.level = level;
        this.enemies = [];
        this.spawnRate = 1000 - (level - 1) * 100;
        this.lastSpawn = Date.now();
    }

    spawnEnemy() {
        const x = Math.random() * (SCREEN_WIDTH - 40);
        const y = -40;
        const speed = 1 + this.level * 0.5;
        const health = 10 + this.level * 5;
        this.enemies.push(new Enemy(x, y, speed, health));
    }

    update() {
        if (Date.now() - this.lastSpawn > this.spawnRate) {
            this.spawnEnemy();
            this.lastSpawn = Date.now();
        }

        this.enemies.forEach((enemy, index) => {
            enemy.update();
            if (enemy.y > SCREEN_HEIGHT) {
                this.enemies.splice(index, 1);
            }
        });
    }

    draw() {
        this.enemies.forEach(enemy => enemy.draw());
    }
}

// 初始化
let player = new Player();
let currentLevel = new Level(gameState.level);

// 游戏主循环
function gameLoop() {
    if (gameState.gameOver || gameState.paused) return;

    ctx.fillStyle = BLACK;
    ctx.fillRect(0, 0, SCREEN_WIDTH, SCREEN_HEIGHT);

    // 更新玩家位置
    player.update();

    // 绘制玩家
    player.draw();
    player.updateBullets();
    player.drawBullets();

    // 更新关卡
    currentLevel.update();
    currentLevel.draw();

    // 检测碰撞
    currentLevel.enemies.forEach((enemy, index) => {
        player.bullets.forEach((bullet, bulletIndex) => {
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                enemy.health -= 10;
                player.bullets.splice(bulletIndex, 1);
                if (enemy.health <= 0) {
                    currentLevel.enemies.splice(index, 1);
                    gameState.score += 10;
                }
            }
        });

        if (player.x < enemy.x + enemy.width &&
            player.x + player.width > enemy.x &&
            player.y < enemy.y + enemy.height &&
            player.y + player.height > enemy.y) {
            player.health -= 10;
            currentLevel.enemies.splice(index, 1);
            if (player.health <= 0) {
                gameState.gameOver = true;
            }
        }
    });

    // 绘制状态
    ctx.fillStyle = WHITE;
    ctx.font = "20px Arial";
    ctx.fillText(`Score: ${gameState.score}`, 10, 30);
    ctx.fillText(`Level: ${gameState.level}`, 10, 60);
    ctx.fillText(`Health: ${player.health}`, 10, 90);
    ctx.fillText(`Armor: ${player.armor}`, 10, 120);

    // 检查是否升级
    if (gameState.score >= gameState.level * 100) {
        gameState.level += 1;
        currentLevel = new Level(gameState.level);
    }

    requestAnimationFrame(gameLoop);
}

// 键盘事件（适用于PC）
window.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") player.move("left");
    if (e.key === "ArrowRight") player.move("right");
    if (e.key === " ") player.shoot();
    if (e.key === "Escape") gameState.paused = !gameState.paused;
});

// 触摸控制（适用于手机）
document.getElementById("left").addEventListener("touchstart", () => player.move("left"));
document.getElementById("right").addEventListener("touchstart", () => player.move("right"));
document.getElementById("shoot").addEventListener("touchstart", () => player.shoot());

document.getElementById("left").addEventListener("touchend", () => player.move("stop"));
document.getElementById("right").addEventListener("touchend", () => player.move("stop"));

// 启动游戏
gameLoop();
