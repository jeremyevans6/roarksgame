import Phaser from 'phaser';
console.error("ENEMY_LOADED");

export default class Enemy extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key) {
        super(scene, x, y, `${key}_walk_0`);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setScale(2);
        this.setCollideWorldBounds(true);
        this.play(`${key}_walk`);
        
        this.enemyKey = key;
    }

    update(time, delta) {
        if (this.body.blocked.left) {
            this.setVelocityX(Math.abs(this.body.velocity.x || 100));
            this.setFlipX(true);
        } else if (this.body.blocked.right) {
            this.setVelocityX(-Math.abs(this.body.velocity.x || 100));
            this.setFlipX(false);
        }
    }
}

export class Mushroom extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'mushroom');
        this.setBodySize(20, 24);
        this.setOffset(6, 8);
        this.setVelocityX(-100);
    }
}

export class Frog extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'frog');
        this.setBodySize(20, 24);
        this.setOffset(6, 8);
        this.nextJump = 0;
        this.setVelocityX(-100);
        this.setBounce(1, 0);
    }

    update(time, delta) {
        super.update(time, delta);
        if (time > this.nextJump && this.body.touching.down) {
            this.setVelocityY(-400);
            const player = this.scene.player;
            if (player) {
                this.setVelocityX(player.x > this.x ? 150 : -150);
                this.setFlipX(this.body.velocity.x > 0);
            }
            this.nextJump = time + 1500 + Math.random() * 1000;
        }
    }
}

export class Turtle extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'turtle');
        this.setBodySize(20, 24);
        this.setOffset(6, 8);
        this.setVelocityX(-100);
        this.isShell = false;
        this.isMoving = false;
    }

    handleStomp() {
        if (!this.isShell) {
            this.isShell = true;
            this.isMoving = false;
            this.setVelocityX(0);
            this.setTint(0x95a5a6);
            this.body.setSize(32, 24);
            this.setOffset(0, 8);
            this.play('turtle_walk', false);
            this.stop();
        } else {
            this.setVelocityX(0);
            this.isMoving = false;
        }
    }

    kick(direction) {
        this.setVelocityX(direction * 500);
        this.isMoving = true;
    }
}

export class Boss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss');
        this.setScale(4);
        this.health = 5;
        this.setBodySize(60, 80);
        this.setOffset(34, 48);
        this.setVelocityX(-50);
        this.nextJump = 0;
    }

    update(time, delta) {
        super.update(time, delta);
        if (time > this.nextJump && this.body.touching.down) {
            this.setVelocityY(-600);
            this.nextJump = time + 3000 + Math.random() * 2000;
        }
    }

    takeDamage() {
        this.health--;
        this.setTint(0xff0000);
        this.scene.time.delayedCall(100, () => this.clearTint());
        if (this.health <= 0) {
            this.scene.events.emit('boss-defeated', this);
            this.destroy();
            return true;
        }
        return false;
    }
}

export class FlyingEnemy extends Enemy {
    constructor(scene, x, y, key) {
        super(scene, x, y, key);
        this.body.setAllowGravity(false);
        this.startY = y;
        this.setVelocityX(key === 'jellyfish' ? -50 : -150);
        
        if (key === 'jellyfish') {
            this.setBodySize(16, 24);
            this.setOffset(8, 4);
        } else {
            this.setBodySize(20, 24);
            this.setOffset(6, 8);
        }
    }

    update(time, delta) {
        super.update(time, delta);
        const amplitude = this.enemyKey === 'jellyfish' ? 30 : 50;
        const frequency = this.enemyKey === 'jellyfish' ? 500 : 200;
        this.y = this.startY + Math.sin(time / frequency) * amplitude;
    }
}
