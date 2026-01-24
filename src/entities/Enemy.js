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
        this.baseHealth = 1;
        this.maxHealth = this.baseHealth;
        this.health = this.baseHealth;
        this.patrolSpeed = 100;
        this.speedMultiplier = 1;
    }

    update(time, delta) {
        const speed = Math.abs(this.patrolSpeed || this.body.velocity.x || 100);
        if (this.body.blocked.left) {
            this.setVelocityX(speed);
            this.setFlipX(true);
        } else if (this.body.blocked.right) {
            this.setVelocityX(-speed);
            this.setFlipX(false);
        }
    }

    takeDamage(amount = 1) {
        this.health = Math.max(0, this.health - amount);
        this.setTint(0xff6b6b);
        if (this.scene?.time) this.scene.time.delayedCall(80, () => this.clearTint());
        if (this.health <= 0) {
            this.destroy();
            return true;
        }
        return false;
    }
}

export class Mushroom extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'mushroom');
        this.setBodySize(20, 24);
        this.setOffset(6, 8);
        this.patrolSpeed = 100;
        this.setVelocityX(-this.patrolSpeed);
    }
}

export class Frog extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'frog');
        this.setBodySize(20, 24);
        this.setOffset(6, 8);
        this.nextJump = 0;
        this.patrolSpeed = 100;
        this.leapSpeed = 150;
        this.setVelocityX(-this.patrolSpeed);
        this.setBounce(1, 0);
    }

    update(time, delta) {
        super.update(time, delta);
        if (time > this.nextJump && this.body.touching.down) {
            this.setVelocityY(-400);
            const player = this.scene.player;
            if (player) {
                const chaseSpeed = this.leapSpeed || 150;
                this.setVelocityX(player.x > this.x ? chaseSpeed : -chaseSpeed);
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
        this.patrolSpeed = 100;
        this.setVelocityX(-this.patrolSpeed);
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

    takeDamage(amount = 1) {
        if (this.isShell) {
            this.health = Math.max(0, this.health - amount);
            if (this.health <= 0) {
                this.destroy();
                return true;
            }
            return false;
        }
        this.health = Math.max(0, this.health - amount);
        this.setTint(0xff6b6b);
        if (this.scene?.time) this.scene.time.delayedCall(80, () => this.clearTint());
        if (this.health <= 0) {
            this.handleStomp();
            this.health = 1;
        }
        return false;
    }
}

export class Boss extends Enemy {
    constructor(scene, x, y) {
        super(scene, x, y, 'boss');
        this.setScale(4);
        this.baseHealth = 5;
        this.maxHealth = this.baseHealth;
        this.health = this.baseHealth;
        this.setBodySize(60, 80);
        this.setOffset(34, 48);
        this.patrolSpeed = 50;
        this.setVelocityX(-this.patrolSpeed);
        this.nextJump = 0;
        this.jumpPower = 600;
    }

    update(time, delta) {
        super.update(time, delta);
        if (time > this.nextJump && this.body.touching.down) {
            this.setVelocityY(-this.jumpPower);
            this.nextJump = time + 3000 + Math.random() * 2000;
        }
    }

    takeDamage() {
        this.health = Math.max(0, this.health - 1);
        this.setTint(0xff0000);
        if (this.scene?.time) this.scene.time.delayedCall(100, () => this.clearTint());
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
        this.patrolSpeed = key === 'jellyfish' ? 50 : 150;
        this.setVelocityX(-this.patrolSpeed);
        
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
