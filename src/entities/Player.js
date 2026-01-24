import Phaser from 'phaser';
console.error("PLAYER_LOADED");

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'roark_idle_0');
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.setCollideWorldBounds(true);
        this.setScale(2);
        this.setBodySize(24, 32);
        this.setOffset(12, 14);
        if (this.body) this.body.setMaxVelocity(500, 900);
        
        this.state = 'SMALL';
        this.isInvulnerable = false;
        this.isSwimming = false;
        this.isDashing = false;
        this.dashTime = 0;
        this.upgrades = { jumpPower: -600, speed: 300 };
        this.jumpCount = 0;
        
        this.cursors = scene.input.keyboard.createCursorKeys();
        this.wasd = scene.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT,
            attack: Phaser.Input.Keyboard.KeyCodes.Z,
            fire: Phaser.Input.Keyboard.KeyCodes.X,
            swap: Phaser.Input.Keyboard.KeyCodes.C,
            esc: Phaser.Input.Keyboard.KeyCodes.ESC
        });
    }

    update(time, delta) {
        if (this.isInvulnerable) {
            this.setAlpha(0.5 + Math.sin(time / 50) * 0.2);
        } else {
            this.setAlpha(this.isDashing ? 0.7 : 1);
        }

        // Movement speed (cap to avoid tunneling)
        const baseSpeed = Math.min(this.upgrades.speed, 360);
        let speed = baseSpeed;
        
        // Glide logic for Feather state
        if (this.state === 'FEATHER' && !this.body.touching.down && (this.cursors.up.isDown || this.wasd.up.isDown) && this.body.velocity.y > 0) {
            this.setVelocityY(50);
        }

        // Dash logic
        if (Phaser.Input.Keyboard.JustDown(this.wasd.shift) && time > this.dashTime) {
            this.isDashing = true;
            this.dashTime = time + 1000;
            this.scene.time.delayedCall(200, () => this.isDashing = false);
        }
        if (this.isDashing) speed *= 2.2;
        const finalSpeed = Math.min(speed, 520);
        if (this.body) {
            if (this.body.setMaxVelocityX) this.body.setMaxVelocityX(this.isDashing ? 520 : 420);
            if (this.body.setMaxVelocityY) this.body.setMaxVelocityY(900);
        }

        // Horizontal movement
        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.setVelocityX(-finalSpeed);
            this.setFlipX(false);
            this.setOffset(12, 14);
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.setVelocityX(finalSpeed);
            this.setFlipX(true);
            this.setOffset(12, 14);
        } else {
            this.setVelocityX(0);
        }

        // Jump logic
        if (this.body.touching.down) {
            this.jumpCount = 0;
        }

        const jumpJustDown = Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
                            Phaser.Input.Keyboard.JustDown(this.wasd.up) || 
                            Phaser.Input.Keyboard.JustDown(this.cursors.space);

        if (jumpJustDown && (this.isSwimming || this.body.touching.down || this.jumpCount < 2)) {
            this.setVelocityY(this.isSwimming ? -300 : this.upgrades.jumpPower);
            if (!this.isSwimming) this.jumpCount++;
        }

        this.handleAnimations();
    }

    handleAnimations() {
        if (this.isAttacking) {
            this.play('roark_attack', true);
            return;
        }

        if (!this.body.touching.down && !this.isSwimming) {
            this.play(this.body.velocity.y < 0 ? 'roark_jump' : 'roark_fall', true);
        } else {
            if (this.body.velocity.x !== 0) {
                this.play('roark_run', true);
            } else {
                this.play('roark_idle', true);
            }
        }
    }

    becomeInvulnerable(duration = 2000) {
        this.isInvulnerable = true;
        this.scene.time.delayedCall(duration, () => {
            this.isInvulnerable = false;
            this.setAlpha(1);
        });
    }

    shrink() {
        this.state = 'SMALL';
        this.setBodySize(24, 32);
        this.setOffset(12, 14);
        this.becomeInvulnerable();
    }

    applyPowerup(type) {
        this.state = type === 'powerup_mushroom' ? 'SUPER' : 
                     (type === 'powerup_fire' ? 'FIRE' : 
                     (type === 'feather' ? 'FEATHER' : 'STONE'));
        
        // Adjust hitbox for Super state
        if (this.state === 'SUPER') {
            this.setBodySize(32, 48);
            this.setOffset(8, 0);
        } else {
            this.setBodySize(24, 32);
            this.setOffset(12, 14);
        }
    }
}
