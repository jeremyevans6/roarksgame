import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Asset loading with absolute paths for Vite compatibility
        this.load.spritesheet('roark', '/assets/roark.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('roark_running', '/assets/roarkRunning.png', { frameWidth: 128, frameHeight: 128 });
        
        // Roark Hero (Individual frames based on PixelLab counts)
        for (let i = 0; i < 4; i++) {
            this.load.image(`roark_idle_${i}`, `/assets/roark/animations/breathing-idle/west/frame_00${i}.png`);
        }
        for (let i = 0; i < 6; i++) {
            this.load.image(`roark_walk_${i}`, `/assets/roark/animations/walking/west/frame_00${i}.png`);
        }
        for (let i = 0; i < 9; i++) {
            this.load.image(`roark_jump_${i}`, `/assets/roark/animations/jumping-1/west/frame_00${i}.png`);
        }
        for (let i = 0; i < 3; i++) {
            this.load.image(`roark_attack_${i}`, `/assets/roark/animations/lead-jab/west/frame_00${i}.png`);
        }

        // Enemy Animations (Individual frames)
        for (let i = 0; i < 6; i++) {
            const frame = i.toString().padStart(3, '0');
            this.load.image(`mushroom_walk_${i}`, `/assets/mushroom/animations/walk/west/frame_${frame}.png`);
            this.load.image(`frog_walk_${i}`, `/assets/frog/animations/walking/west/frame_${frame}.png`);
            this.load.image(`turtle_walk_${i}`, `/assets/turtle/animations/walking/west/frame_${frame}.png`);
        }

        this.load.image('gem_icon', '/assets/gem.png');
        this.load.image('coin', '/assets/coin.png');
        this.load.image('spring', '/assets/spring.png');
        this.load.image('shop_bg', '/assets/shop.png');
        this.load.image('feather', '/assets/feather.png');
        this.load.image('sword_stone', '/assets/sword_stone.png');
        // Load tileset as a spritesheet for the platforms
        this.load.spritesheet('tileset', '/assets/tileset.png', { frameWidth: 32, frameHeight: 32 });

        const graphics = this.make.graphics();
        
        // Procedural fallbacks (remain in place so engine has backup textures)
        graphics.fillStyle(0x3498db);
        graphics.fillRect(0, 0, 32, 32);
        graphics.generateTexture('roark_placeholder', 32, 32);
        graphics.clear();

        graphics.fillStyle(0x2980b9);
        graphics.fillRect(0, 0, 48, 48);
        graphics.generateTexture('roark_super', 48, 48);
        graphics.clear();

        graphics.fillStyle(0x9b59b6);
        graphics.fillRect(0, 0, 48, 48);
        graphics.generateTexture('roark_fire', 48, 48);
        graphics.clear();

        graphics.fillStyle(0x2ecc71);
        graphics.fillRect(0, 0, 800, 64);
        graphics.generateTexture('floor', 800, 64);
        graphics.clear();

        graphics.fillStyle(0x1abc9c);
        graphics.fillRect(0, 0, 128, 32);
        graphics.generateTexture('moving_platform', 128, 32);
        graphics.clear();

        graphics.fillStyle(0x95a5a6);
        graphics.beginPath();
        graphics.moveTo(0, 32);
        graphics.lineTo(16, 0);
        graphics.lineTo(32, 32);
        graphics.closePath();
        graphics.fill();
        graphics.generateTexture('spikes', 32, 32);
        graphics.clear();

        graphics.fillStyle(0xe74c3c);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('mushroom', 32, 32);
        graphics.clear();

        graphics.fillStyle(0x00d2d3);
        graphics.fillRect(0, 0, 32, 24);
        graphics.generateTexture('frog', 32, 24);
        graphics.clear();

        graphics.fillStyle(0xf1c40f);
        graphics.fillCircle(16, 16, 16);
        graphics.generateTexture('turtle', 32, 32);
        graphics.clear();

        graphics.fillStyle(0xe67e22);
        graphics.fillRect(0, 0, 24, 24);
        graphics.generateTexture('powerup_mushroom', 24, 24);
        graphics.clear();

        graphics.fillStyle(0xf39c12);
        graphics.fillCircle(12, 12, 12);
        graphics.generateTexture('powerup_fire', 24, 24);
        graphics.clear();

        graphics.fillStyle(0xe74c3c);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('fireball', 16, 16);
        graphics.clear();

        graphics.fillStyle(0xffffff);
        graphics.fillRect(0, 0, 8, 48);
        graphics.fillStyle(0x2ecc71);
        graphics.fillRect(8, 0, 24, 16);
        graphics.generateTexture('flag', 32, 48);
        graphics.clear();

        graphics.fillStyle(0x00d2d3);
        graphics.beginPath();
        graphics.moveTo(12, 0);
        graphics.lineTo(24, 12);
        graphics.lineTo(12, 24);
        graphics.lineTo(0, 12);
        graphics.closePath();
        graphics.fill();
        graphics.generateTexture('gem', 24, 24);
        graphics.clear();

        graphics.fillStyle(0x8e44ad);
        graphics.fillRect(0, 16, 48, 32);
        graphics.beginPath();
        graphics.moveTo(0, 16);
        graphics.lineTo(24, 0);
        graphics.lineTo(48, 16);
        graphics.closePath();
        graphics.fill();
        graphics.generateTexture('shop', 48, 48);
        graphics.clear();

        graphics.fillStyle(0xffffff, 0.3);
        graphics.fillCircle(20, 20, 20);
        graphics.fillCircle(40, 20, 25);
        graphics.fillCircle(60, 20, 20);
        graphics.generateTexture('cloud', 80, 50);
        graphics.clear();

        graphics.fillStyle(0x2c3e50, 0.5);
        graphics.beginPath();
        graphics.moveTo(0, 200);
        graphics.lineTo(150, 0);
        graphics.lineTo(300, 200);
        graphics.closePath();
        graphics.fill();
        graphics.generateTexture('mountain', 300, 200);
        graphics.clear();
    }

    create() {
        // World setup - 480,000 pixels
        this.worldWidth = 480000;
        this.physics.world.setBounds(0, 0, this.worldWidth, 600);
        this.cameras.main.setBounds(0, 0, this.worldWidth, 600);

        this.createParallax();

        this.dayNightOverlay = this.add.rectangle(0, 0, 800, 600, 0x000033, 0)
            .setOrigin(0)
            .setScrollFactor(0)
            .setDepth(100);
        this.timeOfDay = 0;

        this.platforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.spikes = this.physics.add.staticGroup();
        this.mushrooms = this.physics.add.group();
        this.frogs = this.physics.add.group();
        this.turtles = this.physics.add.group();
        this.powerups = this.physics.add.group();
        this.fireballs = this.physics.add.group();
        this.checkpoints = this.physics.add.staticGroup();
        this.gems = this.physics.add.group({ allowGravity: false });
        this.coins = this.physics.add.group({ allowGravity: false });
        this.springs = this.physics.add.staticGroup();
        this.breakableBlocks = this.physics.add.staticGroup();
        this.shops = this.physics.add.staticGroup();

        this.generateWorld();

        // Use the new Roark Hero idle frame
        this.player = this.physics.add.sprite(100, 400, 'roark_idle_0');
        this.player.setCollideWorldBounds(true);
        
        // Physics body sized and offset to the character
        this.player.setBodySize(32, 40);
        this.player.setOffset(8, 8); 
        
        this.player.state = 'SMALL';
        this.player.isInvulnerable = false;
        this.player.lastCheckpoint = { x: 100, y: 450 };
        this.player.dashTime = 0;
        this.player.isDashing = false;
        this.player.isAttacking = false;
        this.player.upgrades = { jumpPower: -600, speed: 300 };
        
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.createAnimations();

        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatforms);
        this.physics.add.collider(this.mushrooms, this.platforms);
        this.physics.add.collider(this.mushrooms, this.movingPlatforms);
        this.physics.add.collider(this.frogs, this.platforms);
        this.physics.add.collider(this.turtles, this.platforms);
        this.physics.add.collider(this.powerups, this.platforms);
        
        this.physics.add.collider(this.fireballs, this.platforms, (fb) => {
            if (fb.body.blocked.left || fb.body.blocked.right) fb.destroy();
        });

        this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
        this.physics.add.overlap(this.player, this.mushrooms, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.frogs, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.turtles, this.hitEnemy, null, this);
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
        this.physics.add.overlap(this.player, this.checkpoints, this.reachCheckpoint, null, this);
        this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.springs, this.useSpring, null, this);
        this.physics.add.overlap(this.player, this.shops, this.enterShop, null, this);
        this.physics.add.collider(this.player, this.breakableBlocks, this.hitBreakableBlock, null, this);
        
        this.physics.add.overlap(this.fireballs, this.mushrooms, this.fireballHit, null, this);
        this.physics.add.overlap(this.fireballs, this.frogs, this.fireballHit, null, this);
        this.physics.add.overlap(this.fireballs, this.turtles, this.fireballHit, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT
        });
        this.swordKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
        this.fireKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

        this.jumpCount = 0;
        this.score = 0;
        this.lives = 3;
        this.gemCount = 0;

        this.setupHUD();

        this.weatherParticles = this.add.particles(0, 0, 'fireball', {
            x: { min: 0, max: 800 },
            y: 0,
            lifespan: 2000,
            speedY: { min: 200, max: 400 },
            scale: { start: 0.2, end: 0 },
            alpha: { start: 0.5, end: 0 },
            frequency: -1,
            blendMode: 'ADD'
        }).setScrollFactor(0).setDepth(150);
    }

    createAnimations() {
        // Roark Hero Animations
        this.anims.create({
            key: 'roark_idle',
            frames: [
                { key: 'roark_idle_0' }, { key: 'roark_idle_1' }, 
                { key: 'roark_idle_2' }, { key: 'roark_idle_3' }
            ],
            frameRate: 6,
            repeat: -1
        });

        this.anims.create({
            key: 'roark_run',
            frames: [
                { key: 'roark_walk_0' }, { key: 'roark_walk_1' }, { key: 'roark_walk_2' },
                { key: 'roark_walk_3' }, { key: 'roark_walk_4' }, { key: 'roark_walk_5' }
            ],
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'roark_jump',
            frames: [{ key: 'roark_jump_4' }], // Use mid-jump frame
            frameRate: 1,
            repeat: 0
        });

        this.anims.create({
            key: 'roark_fall',
            frames: [{ key: 'roark_jump_7' }], // Use falling frame
            frameRate: 1,
            repeat: -1
        });

        this.anims.create({
            key: 'roark_attack',
            frames: [
                { key: 'roark_attack_0' }, { key: 'roark_attack_1' }, { key: 'roark_attack_2' }
            ],
            frameRate: 15,
            repeat: 0
        });

        // Enemy Walk Animations
        this.anims.create({
            key: 'mushroom_walk',
            frames: [
                { key: 'mushroom_walk_0' }, { key: 'mushroom_walk_1' }, { key: 'mushroom_walk_2' },
                { key: 'mushroom_walk_3' }, { key: 'mushroom_walk_4' }, { key: 'mushroom_walk_5' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'frog_walk',
            frames: [
                { key: 'frog_walk_0' }, { key: 'frog_walk_1' }, { key: 'frog_walk_2' },
                { key: 'frog_walk_3' }, { key: 'frog_walk_4' }, { key: 'frog_walk_5' }
            ],
            frameRate: 8,
            repeat: -1
        });

        this.anims.create({
            key: 'turtle_walk',
            frames: [
                { key: 'turtle_walk_0' }, { key: 'turtle_walk_1' }, { key: 'turtle_walk_2' },
                { key: 'turtle_walk_3' }, { key: 'turtle_walk_4' }, { key: 'turtle_walk_5' }
            ],
            frameRate: 8,
            repeat: -1
        });
    }

    createParallax() {
        for (let i = 0; i < 200; i++) {
            const cloud = this.add.image(Math.random() * this.worldWidth, 50 + Math.random() * 200, 'cloud');
            cloud.setScrollFactor(0.2);
            cloud.setDepth(-20);
        }
        for (let i = 0; i < 100; i++) {
            const m = this.add.image(i * 1000 + Math.random() * 500, 400, 'mountain');
            m.setScrollFactor(0.5);
            m.setDepth(-10);
            m.setScale(1.5 + Math.random());
        }
    }

    generateWorld() {
        // Base ground
        for (let i = 0; i < this.worldWidth / 32; i++) {
            const ground = this.platforms.create(i * 32 + 16, 584, 'tileset', 1); // 584 is 600 - 16
            ground.setOrigin(0.5);
            ground.refreshBody();
        }

        // Periodic features
        for (let x = 800; x < this.worldWidth; x += 400) {
            const rand = Math.random();
            
            // High platform clusters
            if (rand < 0.3) {
                const py = 200 + Math.random() * 200;
                const width = Math.floor(2 + Math.random() * 5);
                for (let j = 0; j < width; j++) {
                    const frame = j === 0 ? 0 : (j === width - 1 ? 2 : 1);
                    const p = this.platforms.create(x + j * 32, py, 'tileset', frame);
                    p.setOrigin(0.5);
                    p.refreshBody();

                    // Add breakable blocks above some platforms
                    if (Math.random() > 0.8) {
                        this.breakableBlocks.create(x + j * 32, py - 96, 'tileset', 3); // Frame 3 for block
                    }
                }
                
                // Add spikes to some platforms
                if (Math.random() > 0.7) {
                    this.spikes.create(x + (width/2) * 32, py - 32, 'spikes');
                }

                // Add gems or coins to platforms
                if (Math.random() > 0.5) {
                    this.gems.create(x + (width/2) * 32, py - 60, 'gem');
                } else {
                    this.coins.create(x + (width/2) * 32, py - 60, 'coin');
                }
            }

            // Springs
            if (rand > 0.9 && rand < 0.95) {
                this.springs.create(x, 550, 'spring');
            }
            if (rand > 0.3 && rand < 0.4) {
                const mp = this.movingPlatforms.create(x, 300, 'moving_platform');
                mp.startX = x;
                mp.range = 200;
                mp.direction = 1;
                mp.speed = 100 + Math.random() * 100;
            }
            if (rand > 0.4 && rand < 0.7) {
                this.spawnEnemyAt(x);
                if (Math.random() > 0.5) this.spawnEnemyAt(x + 100);
            }
            if (rand > 0.7 && rand < 0.85) this.gems.create(x, 500, 'gem');
            if (x % 10000 === 0) {
                this.shops.create(x, 520, 'shop');
                this.add.text(x - 20, 450, 'SHOP', { fontSize: '16px', fill: '#fff' });
            }
            // Powerups
            if (rand > 0.95) {
                const pRand = Math.random();
                let type = 'powerup_mushroom';
                if (pRand > 0.75) type = 'powerup_fire';
                else if (pRand > 0.5) type = 'feather';
                else if (pRand > 0.25) type = 'sword_stone';
                
                this.powerups.create(x, 400, type);
            }
            if (x % 5000 === 0) this.checkpoints.create(x, 500, 'flag');
        }
    }

    spawnEnemyAt(x) {
        const r = Math.random();
        if (r < 0.4) {
            const m = this.mushrooms.create(x, 500, 'mushroom_walk_0');
            m.setVelocityX(-100);
            m.setBounce(1, 0);
            m.setCollideWorldBounds(true);
            m.play('mushroom_walk');
        } else if (r < 0.7) {
            const f = this.frogs.create(x, 500, 'frog_walk_0');
            f.nextJump = 0;
            f.setCollideWorldBounds(true);
            f.play('frog_walk');
        } else {
            const t = this.turtles.create(x, 500, 'turtle_walk_0');
            t.setVelocityX(-50);
            t.setBounce(1, 0);
            t.setCollideWorldBounds(true);
            t.play('turtle_walk');
        }
    }

    setupHUD() {
        this.scoreText = this.add.text(16, 16, 'Score: 0', { fontSize: '24px', fill: '#fff' }).setScrollFactor(0);
        this.livesText = this.add.text(16, 48, 'Lives: 3', { fontSize: '24px', fill: '#fff' }).setScrollFactor(0);
        this.gemText = this.add.text(16, 80, 'Gems: 0', { fontSize: '24px', fill: '#00d2d3' }).setScrollFactor(0);
        this.stateText = this.add.text(16, 112, 'State: SMALL', { fontSize: '18px', fill: '#fff' }).setScrollFactor(0);
    }

    update(time, delta) {
        this.timeOfDay += delta / 120000;
        if (this.timeOfDay > 1) this.timeOfDay = 0;
        const alpha = Math.abs(Math.sin(this.timeOfDay * Math.PI)) * 0.6;
        this.dayNightOverlay.setAlpha(alpha);

        // Biome Color Logic
        this.updateBiomeVisuals();

        if (Math.random() < 0.001) {
            this.weatherParticles.setFrequency(this.weatherParticles.frequency === -1 ? 10 : -1);
        }

        let currentSpeed = this.player.upgrades.speed;
        
        // Glide logic for Feather state
        if (this.player.state === 'FEATHER' && !this.player.body.touching.down && 
            (this.cursors.up.isDown || this.wasd.up.isDown || this.cursors.space.isDown)) {
            if (this.player.body.velocity.y > 0) {
                this.player.setVelocityY(50); // Slow fall
            }
        }

        if (Phaser.Input.Keyboard.JustDown(this.wasd.shift) && time > this.player.dashTime) {
            this.player.isDashing = true;
            this.player.dashTime = time + 1000;
            this.time.delayedCall(200, () => this.player.isDashing = false);
        }

        if (this.player.isDashing) {
            currentSpeed *= 3;
            this.player.setAlpha(0.7);
        } else {
            this.player.setAlpha(this.player.isInvulnerable ? 0.5 : 1);
        }

        if (this.cursors.left.isDown || this.wasd.left.isDown) {
            this.player.setVelocityX(-currentSpeed);
            this.player.setFlipX(true);
            this.player.setOffset(0, 32); 
        } else if (this.cursors.right.isDown || this.wasd.right.isDown) {
            this.player.setVelocityX(currentSpeed);
            this.player.setFlipX(false);
            this.player.setOffset(80, 32); 
        } else {
            this.player.setVelocityX(0);
        }

        if (this.player.body.touching.down) {
            this.jumpCount = 0;
        }

        if (Phaser.Input.Keyboard.JustDown(this.cursors.up) || 
            Phaser.Input.Keyboard.JustDown(this.wasd.up) ||
            Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            if (this.player.body.touching.down || this.jumpCount < 2) {
                this.player.setVelocityY(this.player.upgrades.jumpPower);
                this.jumpCount++;
            }
        }

        this.movingPlatforms.children.iterate(mp => {
            if (mp.x > mp.startX + mp.range) mp.direction = -1;
            if (mp.x < mp.startX - mp.range) mp.direction = 1;
            mp.setVelocityX(mp.speed * mp.direction);
        });

        // Turtle Shell movement
        this.turtles.children.iterate(t => {
            if (t.isShell && t.isMoving) {
                if (t.body.blocked.left || t.body.blocked.right) {
                    t.setVelocityX(-t.body.velocity.x);
                }
            } else if (!t.isShell) {
                if (t.body.blocked.left) t.setVelocityX(50);
                if (t.body.blocked.right) t.setVelocityX(-50);
            }
        });

        if (Phaser.Input.Keyboard.JustDown(this.swordKey)) this.attack();
        if (Phaser.Input.Keyboard.JustDown(this.fireKey) && this.player.state === 'FIRE') this.shootFireball();

        this.updateEnemyAI(time);
        this.handleAnimations();
    }

    updateBiomeVisuals() {
        const x = this.player.x;
        let biome = 'Meadows';
        let tint = 0xffffff;
        let bgTint = 0x87ceeb; // Sky blue

        if (x > 300000) {
            biome = 'Aquatic';
            tint = 0x3498db; // Deep blue
            bgTint = 0x2c3e50;
        } else if (x > 150000) {
            biome = 'Fungal';
            tint = 0x9b59b6; // Purple
            bgTint = 0x4b0082;
        }

        // Apply tints periodically to save performance
        if (Math.floor(x/1000) !== this.lastTintChunk) {
            this.lastTintChunk = Math.floor(x/1000);
            this.cameras.main.setBackgroundColor(bgTint);
            this.platforms.setTint(tint);
        }
    }

    handleAnimations() {
        if (!this.anims.exists('roark_idle')) return;

        if (this.player.isAttacking) {
            this.player.play('roark_attack', true);
            return;
        }

        if (this.player.body.touching.down) {
            if (this.player.body.velocity.x !== 0) {
                this.player.play('roark_run', true);
            } else {
                this.player.play('roark_idle', true);
            }
        } else {
            if (this.player.body.velocity.y < 0) {
                this.player.play('roark_jump', true);
            } else {
                this.player.play('roark_fall', true);
            }
        }
    }

    useSpring(player, spring) {
        player.setVelocityY(-1000); // Super jump
        this.tweens.add({
            targets: spring,
            scaleY: 0.5,
            duration: 50,
            yoyo: true
        });
    }

    collectCoin(player, coin) {
        coin.destroy();
        this.score += 10;
        this.updateHUD();
    }

    hitBreakableBlock(player, block) {
        // Break if hit from below by Super Roark
        if (player.body.touching.up && this.player.state !== 'SMALL') {
            block.destroy();
            this.score += 20;
            this.updateHUD();
        }
    }

    collectGem(player, gem) {
        gem.destroy();
        this.gemCount++;
        this.updateHUD();
    }

    enterShop(player, shop) {
        if (this.gemCount >= 10) {
            this.gemCount -= 10;
            this.gemText.setText('Gems: ' + this.gemCount);
            if (Math.random() > 0.5) {
                this.player.upgrades.jumpPower -= 50;
            } else {
                this.player.upgrades.speed += 50;
            }
            this.tweens.add({ targets: shop, scale: 1.2, duration: 100, yoyo: true });
        }
    }

    updateEnemyAI(time) {
        // Mushroom logic
        this.mushrooms.children.iterate(m => {
            if (m.body.blocked.left) m.setVelocityX(100);
            if (m.body.blocked.right) m.setVelocityX(-100);
        });

        // Frog logic
        this.frogs.children.iterate(f => {
            if (time > f.nextJump && f.body.touching.down) {
                f.setVelocityY(-400);
                f.setVelocityX(this.player.x > f.x ? 150 : -150);
                f.nextJump = time + 1500 + Math.random() * 1000;
            }
        });

        // Shell interactions
        this.turtles.children.iterate(t => {
            if (t.isShell && t.isMoving) {
                // Check if shell hits other enemies
                this.physics.add.overlap(t, this.mushrooms, (shell, enemy) => enemy.destroy());
                this.physics.add.overlap(t, this.frogs, (shell, enemy) => enemy.destroy());
                this.physics.add.overlap(t, this.turtles, (shell, enemy) => {
                    if (enemy !== shell) enemy.destroy();
                });
            }
        });
    }

    hitSpikes(player, spike) {
        if (this.player.isInvulnerable) return;
        if (this.player.state !== 'SMALL') {
            this.shrinkPlayer();
        } else {
            this.die();
        }
    }

    attack() {
        this.player.isAttacking = true;
        
        const isStone = this.player.state === 'STONE';
        const duration = isStone ? 200 : 300;
        this.time.delayedCall(duration, () => this.player.isAttacking = false);

        const attackRange = isStone ? 100 : 60;
        const xOffset = this.player.flipX ? -attackRange : attackRange;
        const hitbox = this.add.rectangle(
            this.player.x + xOffset/2, 
            this.player.y, 
            attackRange, 
            isStone ? 60 : 40, 
            isStone ? 0x9b59b6 : 0xffff00, 
            0.3
        );
        this.physics.add.existing(hitbox);
        
        const hit = (entity) => {
            this.score += 100;
            this.updateHUD();
            entity.destroy();
        };
        
        this.physics.add.overlap(hitbox, this.mushrooms, (h, e) => hit(e));
        this.physics.add.overlap(hitbox, this.frogs, (h, e) => hit(e));
        this.physics.add.overlap(hitbox, this.turtles, (h, e) => hit(e));
        this.time.delayedCall(150, () => hitbox.destroy());
    }

    shootFireball() {
        const fb = this.fireballs.create(this.player.x, this.player.y, 'fireball');
        fb.setVelocity(this.player.flipX ? -400 : 400, 200);
        fb.setBounce(0.8);
        fb.setCollideWorldBounds(false);
    }

    fireballHit(fb, entity) {
        fb.destroy();
        entity.destroy();
        this.score += 150;
        this.updateHUD();
    }

    hitEnemy(player, enemy) {
        if (this.player.isInvulnerable) return;

        // Special case for turtle shells
        if (enemy.isShell && !enemy.isMoving) {
            enemy.setVelocityX(player.x < enemy.x ? 500 : -500);
            enemy.isMoving = true;
            this.becomeInvulnerable(); // Briefly invulnerable to avoid self-collision damage
            return;
        }

        if (player.body.touching.down && player.y < enemy.y - 10) {
            if (enemy.texture.key.includes('turtle')) {
                this.handleTurtleStomp(enemy);
            } else {
                enemy.destroy();
            }
            player.setVelocityY(-450);
            this.score += 50;
            this.updateHUD();
        } else {
            if (this.player.state !== 'SMALL') {
                this.shrinkPlayer();
            } else {
                this.die();
            }
        }
    }

    handleTurtleStomp(turtle) {
        if (!turtle.isShell) {
            turtle.isShell = true;
            turtle.isMoving = false;
            turtle.setVelocityX(0);
            turtle.setTint(0x95a5a6); // Shell grey
            turtle.body.setSize(32, 24);
            turtle.setOffset(0, 8);
        } else if (turtle.isMoving) {
            turtle.setVelocityX(0);
            turtle.isMoving = false;
        }
    }

    collectPowerup(player, powerup) {
        const type = powerup.texture.key;
        powerup.destroy();
        
        // Reset to default size/offset
        this.player.body.setSize(32, 40);
        this.player.setOffset(this.player.flipX ? 0 : 8, 8);

        if (type === 'powerup_mushroom') {
            this.player.state = 'SUPER';
            this.player.body.setSize(40, 50);
            this.player.setOffset(this.player.flipX ? 0 : 12, 4);
        } else if (type === 'powerup_fire') {
            this.player.state = 'FIRE';
        } else if (type === 'feather') {
            this.player.state = 'FEATHER';
        } else if (type === 'sword_stone') {
            this.player.state = 'STONE';
        }
        this.updateHUD();
    }

    reachCheckpoint(player, flag) {
        if (this.player.lastCheckpoint.x !== flag.x) {
            this.player.lastCheckpoint = { x: flag.x, y: flag.y };
            flag.setTint(0x00ff00);
        }
    }

    shrinkPlayer() {
        this.player.state = 'SMALL';
        this.player.setTexture('roark');
        this.player.body.setSize(48, 96);
        this.player.setOffset(this.player.flipX ? 0 : 80, 32);
        this.becomeInvulnerable();
        this.updateHUD();
    }

    becomeInvulnerable() {
        this.player.isInvulnerable = true;
        this.player.setAlpha(0.5);
        this.time.delayedCall(2000, () => {
            this.player.isInvulnerable = false;
            this.player.setAlpha(1);
        });
    }

    die() {
        this.lives--;
        this.updateHUD();
        if (this.lives <= 0) {
            this.scene.restart();
        } else {
            this.player.setPosition(this.player.lastCheckpoint.x, this.player.lastCheckpoint.y - 50);
            this.becomeInvulnerable();
        }
    }

    updateHUD() {
        this.scoreText.setText('Score: ' + this.score);
        this.livesText.setText('Lives: ' + this.lives);
        this.stateText.setText('State: ' + this.player.state);
    }
}
