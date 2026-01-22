import Phaser from 'phaser';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Hero Assets
        this.load.spritesheet('roark', '/assets/roark.png', { frameWidth: 128, frameHeight: 128 });
        this.load.spritesheet('roark_running', '/assets/roarkRunning.png', { frameWidth: 128, frameHeight: 128 });
        
        // High-Quality Hero Frames (48x48 base)
        for (let i = 0; i < 4; i++) this.load.image(`roark_idle_${i}`, `/assets/roark/animations/breathing-idle/west/frame_00${i}.png`);
        for (let i = 0; i < 6; i++) this.load.image(`roark_walk_${i}`, `/assets/roark/animations/walking/west/frame_00${i}.png`);
        for (let i = 0; i < 9; i++) this.load.image(`roark_jump_${i}`, `/assets/roark/animations/jumping-1/west/frame_00${i}.png`);
        for (let i = 0; i < 3; i++) this.load.image(`roark_attack_${i}`, `/assets/roark/animations/lead-jab/west/frame_00${i}.png`);

        // Enemy Assets
        const enemies = ['mushroom', 'frog', 'turtle', 'boss', 'bird', 'jellyfish'];
        enemies.forEach(e => {
            for (let i = 0; i < 6; i++) {
                const f = i.toString().padStart(3, '0');
                const dir = (e === 'mushroom' || e === 'boss' || e === 'bird' || e === 'jellyfish') ? 'walk' : 'walking';
                this.load.image(`${e}_walk_${i}`, `/assets/${e}/animations/${dir}/west/frame_${f}.png`);
            }
        });

        // Icons & Level
        this.load.image('gem_icon', '/assets/gem.png');
        this.load.image('coin', '/assets/coin.png');
        this.load.image('spring', '/assets/spring.png');
        this.load.image('shop_bg', '/assets/shop.png');
        this.load.image('feather', '/assets/feather.png');
        this.load.image('sword_stone', '/assets/sword_stone.png');
        this.load.image('goal_pole', '/assets/goal_pole.png');
        this.load.spritesheet('tileset', '/assets/tileset.png', { frameWidth: 32, frameHeight: 32 });

        // HUD & Background
        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff, 0.3); graphics.fillCircle(20, 20, 20); graphics.fillCircle(40, 20, 25); graphics.fillCircle(60, 20, 20);
        graphics.generateTexture('cloud', 80, 50); graphics.clear();
        graphics.fillStyle(0xe74c3c); graphics.fillCircle(8, 8, 8); graphics.generateTexture('fireball', 16, 16); graphics.clear();
    }

    create() {
        this.worldWidth = 48000;
        this.physics.world.setBounds(0, 0, this.worldWidth, 600);
        this.cameras.main.setBounds(0, 0, this.worldWidth, 600);

        this.createParallax();
        this.dayNightOverlay = this.add.rectangle(0, 0, 800, 600, 0x000033, 0).setOrigin(0).setScrollFactor(0).setDepth(100);
        this.timeOfDay = 0;

        // Group setup
        this.platforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.spikes = this.physics.add.staticGroup();
        this.mushrooms = this.physics.add.group();
        this.frogs = this.physics.add.group();
        this.turtles = this.physics.add.group();
        this.birds = this.physics.add.group({ allowGravity: false });
        this.jellyfish = this.physics.add.group({ allowGravity: false });
        this.powerups = this.physics.add.group();
        this.fireballs = this.physics.add.group();
        this.checkpoints = this.physics.add.staticGroup();
        this.gems = this.physics.add.group({ allowGravity: false });
        this.coins = this.physics.add.group({ allowGravity: false });
        this.springs = this.physics.add.staticGroup();
        this.breakableBlocks = this.physics.add.staticGroup();
        this.shops = this.physics.add.staticGroup();
        this.bosses = this.physics.add.group();
        this.goal = this.physics.add.staticGroup();

        this.createAnimations();
        this.createEmitters();

        // Player setup
        this.player = this.physics.add.sprite(100, 400, 'roark_idle_0');
        this.player.setCollideWorldBounds(true);
        this.player.setScale(2);
        this.player.setBodySize(20, 28); // Standard hit-box for hero
        this.player.setOffset(14, 16); // Centered horizontally, aligned near bottom
        this.player.state = 'SMALL';
        this.player.isInvulnerable = false;
        this.player.isSwimming = false;
        this.player.lastCheckpoint = { x: 100, y: 450 };
        this.player.dashTime = 0;
        this.player.upgrades = { jumpPower: -600, speed: 300 };
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.generateWorld();

        // Collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatforms);
        this.physics.add.collider(this.player, this.breakableBlocks, this.hitBreakableBlock, null, this);
        this.physics.add.collider(this.mushrooms, this.platforms);
        this.physics.add.collider(this.frogs, this.platforms);
        this.physics.add.collider(this.turtles, this.platforms);
        this.physics.add.collider(this.bosses, this.platforms);
        this.physics.add.collider(this.powerups, this.platforms);
        this.physics.add.collider(this.fireballs, this.platforms, (fb) => fb.destroy());

        // Overlaps
        this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
        [this.mushrooms, this.frogs, this.turtles, this.birds, this.jellyfish, this.bosses].forEach(g => {
            this.physics.add.overlap(this.player, g, this.hitEnemy, null, this);
        });
        
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
        this.physics.add.overlap(this.player, this.checkpoints, this.reachCheckpoint, null, this);
        this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.springs, this.useSpring, null, this);
        this.physics.add.overlap(this.player, this.shops, this.enterShop, null, this);
        this.physics.add.overlap(this.player, this.goal, this.winGame, null, this);
        
        [this.mushrooms, this.frogs, this.turtles, this.birds, this.jellyfish, this.bosses].forEach(g => {
            this.physics.add.overlap(this.fireballs, g, this.fireballHit, null, this);
        });

        // Turtle Shell Overlap with Enemies
        this.physics.add.overlap(this.turtles, [this.mushrooms, this.frogs, this.turtles, this.birds, this.jellyfish, this.bosses], (shell, enemy) => {
            if (shell.isShell && shell.isMoving && shell !== enemy) {
                if (enemy.health) this.hitBoss(null, enemy);
                else {
                    this.smokeEmitter.explode(10, enemy.x, enemy.y);
                    enemy.destroy();
                }
                this.score += 200;
            }
        }, null, this);

        this.cursors = this.input.keyboard.createCursorKeys();
        this.wasd = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W, down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A, right: Phaser.Input.Keyboard.KeyCodes.D,
            shift: Phaser.Input.Keyboard.KeyCodes.SHIFT, esc: Phaser.Input.Keyboard.KeyCodes.ESC,
            attack: Phaser.Input.Keyboard.KeyCodes.Z, fire: Phaser.Input.Keyboard.KeyCodes.X
        });

        this.score = 0; this.lives = 3; this.gemCount = 0; this.gameTime = 0;
        this.setupHUD();
    }

    createParallax() {
        // Sky Background
        this.add.rectangle(0, 0, this.worldWidth, 600, 0x87ceeb).setOrigin(0).setScrollFactor(0);
        
        // Far Clouds
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.worldWidth;
            const y = 50 + Math.random() * 200;
            const cloud = this.add.image(x, y, 'cloud');
            cloud.setScrollFactor(0.2).setAlpha(0.4).setScale(2 + Math.random() * 2);
        }

        // Near Clouds
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * this.worldWidth;
            const y = 100 + Math.random() * 300;
            const cloud = this.add.image(x, y, 'cloud');
            cloud.setScrollFactor(0.5).setAlpha(0.7).setScale(1 + Math.random());
        }
    }

    createAnimations() {
        this.anims.create({ key: 'roark_idle', frames: [{ key: 'roark_idle_0' }, { key: 'roark_idle_1' }, { key: 'roark_idle_2' }, { key: 'roark_idle_3' }], frameRate: 6, repeat: -1 });
        this.anims.create({ key: 'roark_run', frames: [{ key: 'roark_walk_5' }, { key: 'roark_walk_4' }, { key: 'roark_walk_3' }, { key: 'roark_walk_2' }, { key: 'roark_walk_1' }, { key: 'roark_walk_0' }], frameRate: 10, repeat: -1 });
        this.anims.create({ key: 'roark_jump', frames: [{ key: 'roark_jump_4' }], frameRate: 1, repeat: 0 });
        this.anims.create({ key: 'roark_fall', frames: [{ key: 'roark_jump_7' }], frameRate: 1, repeat: -1 });
        this.anims.create({ key: 'roark_attack', frames: [{ key: 'roark_attack_2' }, { key: 'roark_attack_1' }, { key: 'roark_attack_0' }], frameRate: 15, repeat: 0 });

        ['mushroom', 'frog', 'turtle', 'boss', 'bird', 'jellyfish'].forEach(e => {
            this.anims.create({
                key: `${e}_walk`,
                frames: [{ key: `${e}_walk_5` }, { key: `${e}_walk_4` }, { key: `${e}_walk_3` }, { key: `${e}_walk_2` }, { key: `${e}_walk_1` }, { key: `${e}_walk_0` }],
                frameRate: (e === 'boss' || e === 'bird' || e === 'jellyfish') ? 6 : 8, repeat: -1
            });
        });
    }

    generateWorld() {
        // Base Foundation with actual tiles
        for (let i = 0; i < this.worldWidth / 64; i++) {
            const g = this.platforms.create(i * 64 + 32, 584, 'tileset', 1);
            g.setScale(2).refreshBody();
        }

        for (let x = 800; x < this.worldWidth; x += 400) {
            const rand = Math.random();
            this.addBiomeDecorations(x);
            if (rand < 0.3) {
                const py = 200 + Math.random() * 200;
                const width = Math.floor(2 + Math.random() * 5);
                for (let j = 0; j < width; j++) {
                    const frame = j === 0 ? 0 : (j === width - 1 ? 2 : 1);
                    const p = this.platforms.create(x + j * 64, py, 'tileset', frame);
                    p.setScale(2).refreshBody();
                    if (Math.random() > 0.8) this.breakableBlocks.create(x + j * 64, py - 128, 'tileset', 3).setScale(2).refreshBody();
                }
                if (Math.random() > 0.7) this.spikes.create(x + (width/2) * 64, py - 64, 'spikes').setScale(2).refreshBody();
                if (Math.random() > 0.5) this.gems.create(x + (width/2) * 64, py - 100, 'gem_icon').setScale(2);
                else this.coins.create(x + (width/2) * 64, py - 100, 'coin').setScale(2);
            }
            if (rand > 0.9 && rand < 0.95) this.springs.create(x, 550, 'spring').setScale(2).refreshBody();
            if (rand > 0.3 && rand < 0.4) {
                const mp = this.movingPlatforms.create(x, 300, 'moving_platform');
                mp.startX = x; mp.range = 200; mp.direction = 1; mp.speed = 100 + Math.random() * 100;
            }
            if (rand > 0.4 && rand < 0.7) this.spawnEnemyAt(x);
            if (x % 10000 === 0) this.shops.create(x, 520, 'shop_bg').setScale(2).refreshBody();
            if (rand > 0.95) {
                const pRand = Math.random();
                let type = pRand > 0.75 ? 'powerup_fire' : (pRand > 0.5 ? 'feather' : (pRand > 0.25 ? 'sword_stone' : 'powerup_mushroom'));
                this.powerups.create(x, 400, type).setScale(2);
            }
            if (x % 5000 === 0) this.checkpoints.create(x, 500, 'flag').setScale(2).refreshBody();
        }
        const boss = this.bosses.create(this.worldWidth - 2000, 400, 'boss_walk_0');
        boss.setScale(4); boss.health = 5; boss.setBodySize(40, 40); boss.setOffset(44, 44);
        boss.play('boss_walk'); boss.setCollideWorldBounds(true); boss.setVelocityX(-50);
        this.goal.create(this.worldWidth - 500, 450, 'goal_pole').setScale(2).refreshBody();
    }

    spawnEnemyAt(x) {
        const r = Math.random();
        let key = (x > 300000) ? (r < 0.7 ? 'jellyfish' : 'bird') : (r < 0.3 ? 'mushroom' : (r < 0.5 ? 'frog' : (r < 0.7 ? 'turtle' : 'bird')));
        const e = this[`${key}s`].create(x, (key === 'bird' || key === 'jellyfish') ? 200 + Math.random() * 200 : 500, `${key}_walk_0`);
        e.setScale(2);
        // Correct hit-boxes for enemies within 32x32 frames
        e.setBodySize(20, 24); 
        e.setOffset(6, 8);
        
        if (key === 'bird' || key === 'jellyfish') { e.setVelocityX(key === 'jellyfish' ? -50 : -150); e.startY = e.y; }
        else { e.setVelocityX(-100).setBounce(1, 0).setCollideWorldBounds(true); }
        e.play(`${key}_walk`);
        if (key === 'frog') e.nextJump = 0;
    }

    update(time, delta) {
        if (Phaser.Input.Keyboard.JustDown(this.wasd.esc)) { this.scene.pause(); this.scene.launch('PauseScene'); return; }
        this.gameTime += delta; this.updateHUD();
        this.dayNightOverlay.setAlpha(Math.abs(Math.sin((this.timeOfDay += delta / 120000) * Math.PI)) * 0.6);
        this.updateBiomeVisuals();

        // Movement
        let speed = this.player.upgrades.speed;
        if (this.player.state === 'FEATHER' && !this.player.body.touching.down && (this.cursors.up.isDown || this.wasd.up.isDown) && this.player.body.velocity.y > 0) this.player.setVelocityY(50);
        if (Phaser.Input.Keyboard.JustDown(this.wasd.shift) && time > (this.player.dashTime || 0)) { this.player.isDashing = true; this.player.dashTime = time + 1000; this.time.delayedCall(200, () => this.player.isDashing = false); }
        if (this.player.isDashing) speed *= 3;
        this.player.setAlpha(this.player.isDashing ? 0.7 : (this.player.isInvulnerable ? 0.5 : 1));

        if (this.cursors.left.isDown || this.wasd.left.isDown) { this.player.setVelocityX(-speed); this.player.setFlipX(true); this.player.setOffset(14, 16); }
        else if (this.cursors.right.isDown || this.wasd.right.isDown) { this.player.setVelocityX(speed); this.player.setFlipX(false); this.player.setOffset(14, 16); }
        else this.player.setVelocityX(0);

        if (this.player.body.touching.down) this.jumpCount = 0;
        const jumpKey = Phaser.Input.Keyboard.JustDown(this.cursors.up) || Phaser.Input.Keyboard.JustDown(this.wasd.up) || Phaser.Input.Keyboard.JustDown(this.cursors.space);
        if (jumpKey && (this.player.isSwimming || this.player.body.touching.down || this.jumpCount < 2)) {
            this.player.setVelocityY(this.player.isSwimming ? -300 : this.player.upgrades.jumpPower);
            if (!this.player.isSwimming) this.jumpCount++;
        }

        // Enemy AI & Shells
        this.updateEnemyAI(time);
        this.handleAnimations();

        // Attacks
        if (Phaser.Input.Keyboard.JustDown(this.wasd.attack)) this.attack();
        if (Phaser.Input.Keyboard.JustDown(this.wasd.fire) && this.player.state === 'FIRE') this.shootFireball();
    }

    updateBiomeVisuals() {
        const x = this.player.x;
        this.player.isSwimming = (x > 300000);
        this.physics.world.gravity.y = this.player.isSwimming ? 300 : 1200;
        const tint = x > 300000 ? 0x3498db : (x > 150000 ? 0x9b59b6 : 0xffffff);
        const bg = x > 300000 ? 0x2c3e50 : (x > 150000 ? 0x4b0082 : 0x87ceeb);
        if (Math.floor(x/1000) !== this.lastTintChunk) {
            this.lastTintChunk = Math.floor(x/1000);
            this.cameras.main.setBackgroundColor(bg);
            this.platforms.getChildren().forEach(c => { if (c.setTint) c.setTint(tint); });
        }
    }

    updateEnemyAI(time) {
        this.mushrooms.children.iterate(m => { if (m.body.blocked.left) m.setVelocityX(100); if (m.body.blocked.right) m.setVelocityX(-100); });
        this.frogs.children.iterate(f => { if (time > f.nextJump && f.body.touching.down) { f.setVelocityY(-400); f.setVelocityX(this.player.x > f.x ? 150 : -150); f.nextJump = time + 1500 + Math.random() * 1000; } });
        this.birds.children.iterate(b => { b.y = b.startY + Math.sin(time / 200) * 50; });
        this.jellyfish.children.iterate(j => { j.y = j.startY + Math.sin(time / 500) * 30; });
        this.bosses.children.iterate(b => { if (b.body.blocked.left) b.setVelocityX(50); if (b.body.blocked.right) b.setVelocityX(-50); if (time > (b.nextJump || 0) && b.body.touching.down) { b.setVelocityY(-600); b.nextJump = time + 3000 + Math.random() * 2000; } });
    }

    // Helper functions
    setupHUD() {
        this.hudBg = this.add.rectangle(0, 0, 800, 60, 0x000000, 0.5).setOrigin(0).setScrollFactor(0).setDepth(1000);
        const s = { fontSize: '20px', fontFamily: 'monospace', fill: '#fff' };
        this.scoreText = this.add.text(20, 18, 'ROARK: 000000', s).setScrollFactor(0).setDepth(1001);
        this.livesText = this.add.text(250, 18, '♥ x3', { ...s, fill: '#ff7675' }).setScrollFactor(0).setDepth(1001);
        this.gemText = this.add.text(400, 18, '♦ x0', { ...s, fill: '#00d2d3' }).setScrollFactor(0).setDepth(1001);
        this.stateText = this.add.text(550, 18, 'MODE: SMALL', s).setScrollFactor(0).setDepth(1001);
        this.timerText = this.add.text(700, 18, '00:00', s).setScrollFactor(0).setDepth(1001);

        // Mini-Map
        const mmWidth = 200;
        const mmHeight = 10;
        this.mmX = 300;
        this.mmY = 50;
        this.add.rectangle(this.mmX, this.mmY, mmWidth, mmHeight, 0xffffff, 0.2).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1000);
        this.mmPlayer = this.add.rectangle(this.mmX, this.mmY, 4, 12, 0xf1c40f).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    }

    updateHUD() {
        this.scoreText.setText(`ROARK: ${this.score.toString().padStart(6, '0')}`);
        this.livesText.setText(`♥ x${this.lives}`);
        this.gemText.setText(`♦ x${this.gemCount}`);
        this.stateText.setText(`MODE: ${this.player.state}`);
        const mins = Math.floor(this.gameTime / 60000).toString().padStart(2, '0');
        const secs = Math.floor((this.gameTime % 60000) / 1000).toString().padStart(2, '0');
        this.timerText.setText(`${mins}:${secs}`);

        // Update Mini-Map player position
        const progress = this.player.x / this.worldWidth;
        this.mmPlayer.x = this.mmX + (progress * 200);
    }
    createEmitters() {
        this.collectEmitter = this.add.particles(0, 0, 'gem_icon', { speed: { min: 50, max: 150 }, scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, lifespan: 500, emitting: false, blendMode: 'ADD' });
        this.smokeEmitter = this.add.particles(0, 0, 'cloud', { speed: { min: 20, max: 80 }, scale: { start: 0.2, end: 0 }, alpha: { start: 0.5, end: 0 }, lifespan: 400, emitting: false });
    }
    handleAnimations() {
        if (this.player.isAttacking) return this.player.play('roark_attack', true);
        if (this.player.body.touching.down) this.player.play(this.player.body.velocity.x !== 0 ? 'roark_run' : 'roark_idle', true);
        else this.player.play(this.player.body.velocity.y < 0 ? 'roark_jump' : 'roark_fall', true);
    }
    addBiomeDecorations(x) { if (Math.random() > 0.3) return; let color = x > 300000 ? 0x3498db : (x > 150000 ? 0x9b59b6 : 0x2ecc71); this.add.circle(x, 550 - Math.random() * 400, 5 + Math.random() * 10, color, 0.3); }
    useSpring(p, s) { p.setVelocityY(-1000); this.tweens.add({ targets: s, scaleY: 0.5, duration: 50, yoyo: true }); }
    collectCoin(p, c) { this.collectEmitter.explode(10, c.x, c.y); c.destroy(); this.score += 10; }
    hitBreakableBlock(p, b) { if (p.body.touching.up && this.player.state !== 'SMALL') { this.smokeEmitter.explode(20, b.x, b.y); b.destroy(); this.score += 20; this.cameras.main.shake(100, 0.01); } }
    collectGem(p, g) { this.collectEmitter.explode(15, g.x, g.y); g.destroy(); this.gemCount++; }
    enterShop(p, s) { if (this.gemCount >= 10) { this.gemCount -= 10; if (Math.random() > 0.5) this.player.upgrades.jumpPower -= 50; else this.player.upgrades.speed += 50; this.tweens.add({ targets: s, scale: 2.2, duration: 100, yoyo: true }); } }
    hitSpikes(p, s) { if (!this.player.isInvulnerable) this.player.state !== 'SMALL' ? this.shrinkPlayer() : this.die(); }
    attack() {
        this.player.isAttacking = true; const isStone = this.player.state === 'STONE'; this.time.delayedCall(isStone ? 200 : 300, () => this.player.isAttacking = false);
        const range = isStone ? 100 : 60; const h = this.add.rectangle(this.player.x + (this.player.flipX ? -range : range)/2, this.player.y, range, isStone ? 60 : 40, isStone ? 0x9b59b6 : 0xffff00, 0.3);
        this.physics.add.existing(h); [this.mushrooms, this.frogs, this.turtles, this.bosses, this.birds, this.jellyfish].forEach(g => this.physics.add.overlap(h, g, (hi, e) => { this.score += 100; if (e.health) this.hitBoss(null, e); else { this.smokeEmitter.explode(10, e.x, e.y); e.destroy(); } }));
        this.time.delayedCall(150, () => h.destroy());
    }
    shootFireball() { const fb = this.fireballs.create(this.player.x, this.player.y, 'fireball'); fb.setVelocity(this.player.flipX ? -400 : 400, 200); fb.setBounce(0.8); }
    fireballHit(fb, e) { fb.destroy(); if (e.health) this.hitBoss(fb, e); else { this.smokeEmitter.explode(10, e.x, e.y); e.destroy(); } this.score += 150; }
    hitEnemy(p, e) {
        if (this.player.isInvulnerable) return;
        if (e.isShell && !e.isMoving) { e.setVelocityX(p.x < e.x ? 500 : -500); e.isMoving = true; this.becomeInvulnerable(); return; }
        if (p.body.touching.down && p.y < e.y - 10) { 
            this.smokeEmitter.explode(15, e.x, e.y);
            e.texture.key.includes('turtle') ? this.handleTurtleStomp(e) : e.destroy(); p.setVelocityY(-450); this.score += 50; 
        }
        else this.player.state !== 'SMALL' ? this.shrinkPlayer() : this.die();
    }
    handleTurtleStomp(t) { if (!t.isShell) { t.isShell = true; t.isMoving = false; t.setVelocityX(0); t.setTint(0x95a5a6); t.body.setSize(32, 24); t.setOffset(0, 8); } else t.setVelocityX(0), t.isMoving = false; }
    collectPowerup(p, pu) { const type = pu.texture.key; pu.destroy(); this.player.state = type === 'powerup_mushroom' ? 'SUPER' : (type === 'powerup_fire' ? 'FIRE' : (type === 'feather' ? 'FEATHER' : 'STONE')); this.player.body.setSize(type === 'powerup_mushroom' ? 40 : 32, type === 'powerup_mushroom' ? 50 : 40); }
    reachCheckpoint(p, f) { if (this.player.lastCheckpoint.x !== f.x) { this.player.lastCheckpoint = { x: f.x, y: f.y }; f.setTint(0x00ff00); } }
    shrinkPlayer() { this.player.state = 'SMALL'; this.player.body.setSize(32, 40); this.becomeInvulnerable(); }
    becomeInvulnerable() { this.player.isInvulnerable = true; this.player.setAlpha(0.5); this.time.delayedCall(2000, () => { this.player.isInvulnerable = false; this.player.setAlpha(1); }); }
    die() {
        this.lives--;
        if (this.lives <= 0) { this.physics.pause(); this.add.text(400, 300, 'GAME OVER', { fontSize: '64px', fill: '#ff0000' }).setOrigin(0.5).setScrollFactor(0); this.time.delayedCall(3000, () => this.scene.start('MenuScene')); }
        else { this.player.setPosition(this.player.lastCheckpoint.x, this.player.lastCheckpoint.y - 100); this.player.setVelocity(0, 0); this.becomeInvulnerable(); this.cameras.main.flash(500, 255, 0, 0); }
    }
    hitBoss(fb, b) { b.health--; b.setTint(0xff0000); this.time.delayedCall(100, () => b.clearTint()); if (b.health <= 0) { this.score += 5000; this.cameras.main.shake(500, 0.05); b.destroy(); } }
    winGame() { if (this.isWinning) return; this.isWinning = true; this.physics.pause(); this.add.text(400, 300, 'VICTORY!', { fontSize: '84px', fill: '#f1c40f' }).setOrigin(0.5).setScrollFactor(0); this.time.delayedCall(5000, () => { this.isWinning = false; this.scene.start('MenuScene'); }); }
}
