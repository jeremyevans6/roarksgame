import Phaser from 'phaser';
import Player from '../entities/Player';
import Enemy, { Mushroom, Frog, Turtle, Boss, FlyingEnemy } from '../entities/Enemy';
import Collectible, { Powerup } from '../entities/Collectible';
import WorldGenerator from '../utils/WorldGenerator';
import WeatherSystem from '../utils/WeatherSystem';
import { buildLevelConfig, getLevelIndexForX, getBiomeForLevel } from '../utils/LevelConfig';

export default class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // Hero Assets
        for (let i = 0; i < 4; i++) this.load.image(`roark_idle_${i}`, `/assets/roark/animations/breathing-idle/west/frame_00${i}.png`);
        for (let i = 0; i < 6; i++) this.load.image(`roark_walk_${i}`, `/assets/roark/animations/walking/west/frame_00${i}.png`);
        for (let i = 0; i < 9; i++) this.load.image(`roark_jump_${i}`, `/assets/roark/animations/jumping-1/west/frame_00${i}.png`);
        for (let i = 0; i < 3; i++) this.load.image(`roark_attack_${i}`, `/assets/roark/animations/lead-jab/west/frame_00${i}.png`);

        // Enemy Assets
        const enemies = ['mushroom', 'frog', 'turtle', 'boss', 'bird', 'jellyfish'];
        enemies.forEach(e => {
            const dir = (e === 'mushroom' || e === 'boss' || e === 'bird' || e === 'jellyfish') ? 'walk' : 'walking';
            for (let i = 0; i < 6; i++) {
                const f = i.toString().padStart(3, '0');
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
        
        this.load.spritesheet('tileset_meadows', '/assets/tileset_meadows.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('tileset_fungal', '/assets/tileset_fungal.png', { frameWidth: 32, frameHeight: 32 });
        this.load.spritesheet('tileset_aquatic', '/assets/tileset_aquatic.png', { frameWidth: 32, frameHeight: 32 });
        
        this.load.image('meadows_chunk', '/assets/meadows_chunk.png');
        this.load.image('fungal_chunk', '/assets/fungal_chunk.png');
        this.load.image('aquatic_chunk', '/assets/aquatic_chunk.png');
        this.load.image('moving_platform', '/assets/moving_platform.png');

        const graphics = this.make.graphics();
        graphics.lineStyle(2, 0x636e72); graphics.fillStyle(0x2d3436);
        graphics.beginPath(); graphics.moveTo(0, 32); graphics.lineTo(16, 0); graphics.lineTo(32, 32); graphics.closePath(); graphics.fillPath(); graphics.strokePath();
        graphics.generateTexture('spikes', 32, 32); graphics.clear();

        graphics.fillStyle(0x74b9ff, 0.25); graphics.fillRect(8, 0, 16, 64);
        graphics.fillStyle(0xffffff, 0.4); graphics.fillRect(12, 8, 8, 48);
        graphics.generateTexture('wind_gust', 32, 64); graphics.clear();

        graphics.fillStyle(0x2ecc71); graphics.fillRect(0, 0, 32, 24);
        graphics.fillStyle(0x7f8c8d); graphics.fillRect(0, 0, 4, 64);
        graphics.generateTexture('flag', 32, 64); graphics.clear();

        graphics.fillStyle(0xffffff, 0.3); graphics.fillCircle(20, 20, 20); graphics.fillCircle(40, 20, 25); graphics.fillCircle(60, 20, 20);
        graphics.generateTexture('cloud', 80, 50); graphics.clear();
        graphics.fillStyle(0xe74c3c); graphics.fillCircle(8, 8, 8); graphics.generateTexture('fireball', 16, 16); graphics.clear();

        graphics.fillStyle(0x74b9ff); graphics.fillCircle(12, 12, 12);
        graphics.fillStyle(0xffffff, 0.9); graphics.fillCircle(12, 12, 5);
        graphics.generateTexture('time_orb', 24, 24); graphics.clear();

        graphics.fillStyle(0xff7675); graphics.fillCircle(12, 12, 12);
        graphics.fillStyle(0x0984e3); graphics.fillCircle(12, 12, 6);
        graphics.generateTexture('magnet_orb', 24, 24); graphics.clear();

        graphics.fillStyle(0xe17055); graphics.fillCircle(12, 14, 10);
        graphics.fillStyle(0xffffff, 0.7); graphics.fillCircle(10, 12, 3);
        graphics.generateTexture('powerup_mushroom', 24, 24); graphics.clear();

        graphics.fillStyle(0xfdcb6e); graphics.fillCircle(12, 14, 10);
        graphics.fillStyle(0xe74c3c); graphics.fillCircle(12, 10, 6);
        graphics.generateTexture('powerup_fire', 24, 24); graphics.clear();

        graphics.fillStyle(0x2ecc71); graphics.fillRoundedRect(6, 6, 20, 20, 4);
        graphics.fillStyle(0xffffff); graphics.fillCircle(12, 14, 3); graphics.fillCircle(20, 14, 3);
        graphics.generateTexture('npc_meadows', 32, 32); graphics.clear();
        graphics.fillStyle(0x9b59b6); graphics.fillRoundedRect(6, 6, 20, 20, 4);
        graphics.fillStyle(0xffffff); graphics.fillCircle(12, 14, 3); graphics.fillCircle(20, 14, 3);
        graphics.generateTexture('npc_fungal', 32, 32); graphics.clear();
        graphics.fillStyle(0x3498db); graphics.fillRoundedRect(6, 6, 20, 20, 4);
        graphics.fillStyle(0xffffff); graphics.fillCircle(12, 14, 3); graphics.fillCircle(20, 14, 3);
        graphics.generateTexture('npc_aquatic', 32, 32); graphics.clear();

        graphics.fillStyle(0x74b9ff, 0.9); graphics.fillRect(0, 0, 2, 12);
        graphics.generateTexture('rain_drop', 2, 12); graphics.clear();
        graphics.fillStyle(0xffffff, 0.9); graphics.fillCircle(3, 3, 3);
        graphics.generateTexture('snow_flake', 6, 6); graphics.clear();
    }

    create() {
        this.tilesetFrameOverrides = {};
        this.platformTintEnabled = false;
        this.ensureBiomeTilesets();
        this.levelConfig = buildLevelConfig({
            levelCount: 40,
            segmentLength: 210,
            gapLength: 30,
            maxOnScreen: 160,
            levelHeight: 3000,
            groundY: 2500,
            skyHeight: 2100,
            enemyMultiplier: 5
        });
        this.worldGenerator = new WorldGenerator(this, this.levelConfig);
        this.worldWidth = this.worldGenerator.totalWidth;
        this.levelStride = this.levelConfig.levelStride;
        this.physics.world.setBounds(0, 0, this.worldWidth, this.levelConfig.levelHeight);
        this.physics.world.TILE_BIAS = 32;
        this.physics.world.OVERLAP_BIAS = 16;
        this.cameras.main.setBounds(0, 0, this.worldWidth, this.levelConfig.levelHeight);

        this.createAnimations();
        this.createParallax();
        this.dayNightOverlay = this.add.rectangle(0, 0, 800, 600, 0x000033, 0).setOrigin(0).setScrollFactor(0).setDepth(100);
        this.timeOfDay = 0;
        this.lastTintChunk = -1;

        // Physics Groups
        this.platforms = this.physics.add.staticGroup();
        this.movingPlatforms = this.physics.add.group({ allowGravity: false, immovable: true });
        this.spikes = this.physics.add.staticGroup();
        this.mushrooms = this.physics.add.group({ runChildUpdate: true });
        this.frogs = this.physics.add.group({ runChildUpdate: true });
        this.turtles = this.physics.add.group({ runChildUpdate: true });
        this.birds = this.physics.add.group({ allowGravity: false, runChildUpdate: true });
        this.jellyfish = this.physics.add.group({ allowGravity: false, runChildUpdate: true });
        this.powerups = this.physics.add.group();
        this.fireballs = this.physics.add.group();
        this.checkpoints = this.physics.add.staticGroup();
        this.gems = this.physics.add.group({ allowGravity: false });
        this.coins = this.physics.add.group({ allowGravity: false });
        this.timeOrbs = this.physics.add.group({ allowGravity: false });
        this.magnetOrbs = this.physics.add.group({ allowGravity: false });
        this.springs = this.physics.add.staticGroup();
        this.windGusts = this.physics.add.staticGroup();
        this.breakableBlocks = this.physics.add.staticGroup();
        this.shops = this.physics.add.staticGroup();
        this.npcs = this.physics.add.staticGroup();
        this.bosses = this.physics.add.group({ runChildUpdate: true });
        this.levelGates = this.physics.add.staticGroup();

        this.createEmitters();
        this.interactKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
        this.fullscreenKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

        // Player setup
        this.player = new Player(this, 100, this.levelConfig.groundY - 200);
        this.player.setDepth(5);
        this.player.lastCheckpoint = { x: 100, y: this.levelConfig.groundY - 150 };
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        // Generation
        this.worldGenerator.generate();

        // Physics Setup
        this.setupPhysics();

        // Initial State
        this.score = 0; this.gemCount = 0; this.gameTime = 0;
        this.bestScore = 0;
        this.bestScoreDirty = false;
        this.lastSaveAt = 0;
        this.questState = {};
        this.activeBuffs = {};
        this.currentLevelIndex = 0;
        this.defeatedBossLevels = new Set();
        this.nextGateHintAt = 0;
        this.magnetUntil = 0; this.magnetRadius = 220; this.magnetSpeed = 320;
        this.magnetRadiusBoost = 0;
        this.timeSlowUntil = 0; this.timeSlowFactor = 0.6;
        this.coinCombo = 0; this.lastCoinAt = 0;
        this.weatherSystem = new WeatherSystem(this);
        this.events.on('boss-defeated', (boss) => this.handleBossDefeated(boss));
        this.setupHUD();
        this.loadData();
    }

    setupPhysics() {
        // Player collisions
        this.physics.add.collider(this.player, this.platforms);
        this.physics.add.collider(this.player, this.movingPlatforms);
        this.physics.add.collider(this.player, this.breakableBlocks, this.hitBreakableBlock, null, this);
        
        // Floor collisions
        const floorGroups = [this.mushrooms, this.frogs, this.turtles, this.bosses, this.powerups];
        floorGroups.forEach(g => this.physics.add.collider(g, this.platforms));
        this.physics.add.collider(this.fireballs, this.platforms, (fb) => fb.destroy());

        // Player overlaps
        this.physics.add.overlap(this.player, this.spikes, this.hitSpikes, null, this);
        
        const enemyGroups = [this.mushrooms, this.frogs, this.turtles, this.birds, this.jellyfish, this.bosses];
        enemyGroups.forEach(g => {
            this.physics.add.overlap(this.player, g, this.hitEnemy, null, this);
            this.physics.add.overlap(this.fireballs, g, this.fireballHit, null, this);
        });
        
        this.physics.add.overlap(this.player, this.powerups, this.collectPowerup, null, this);
        this.physics.add.overlap(this.player, this.timeOrbs, this.collectTimeOrb, null, this);
        this.physics.add.overlap(this.player, this.magnetOrbs, this.collectMagnetOrb, null, this);
        this.physics.add.overlap(this.player, this.checkpoints, this.reachCheckpoint, null, this);
        this.physics.add.overlap(this.player, this.gems, this.collectGem, null, this);
        this.physics.add.overlap(this.player, this.coins, this.collectCoin, null, this);
        this.physics.add.overlap(this.player, this.springs, this.useSpring, null, this);
        this.physics.add.overlap(this.player, this.windGusts, this.useWindGust, null, this);
        this.physics.add.overlap(this.player, this.shops, this.enterShop, null, this);
        this.physics.add.overlap(this.player, this.levelGates, this.completeLevel, null, this);

        // Turtle interaction
        this.physics.add.overlap(this.turtles, enemyGroups, (shell, enemy) => {
            if (shell.isShell && shell.isMoving && shell !== enemy) {
                this.damageEnemy(enemy, 200);
            }
        }, null, this);
    }

    update(time, delta) {
        if (!this.player || !this.player.wasd || !this.player.wasd.esc) return;
        if (Phaser.Input.Keyboard.JustDown(this.player.wasd.esc)) { this.scene.pause(); this.scene.launch('PauseScene'); return; }
        
        this.gameTime += delta;
        this.updateHUD();
        this.dayNightOverlay.setAlpha(Math.abs(Math.sin((this.timeOfDay += delta / 120000) * Math.PI)) * 0.6);
        this.updateBiomeVisuals();
        this.worldGenerator.update(this.player.x);
        this.updateMagnet(time);
        this.updateTimeSlow(time);
        this.weatherSystem.update(time, this.getCurrentBiome());
        this.updateShopPrompt(time);
        this.updateQuestPrompt(time);
        this.updateBuffTimers(time);
        this.autoSave(time);

        this.player.update(time, delta);

        if (Phaser.Input.Keyboard.JustDown(this.player.wasd.attack)) this.attack();
        if (Phaser.Input.Keyboard.JustDown(this.player.wasd.fire) && this.player.state === 'FIRE') this.shootFireball();
        if (Phaser.Input.Keyboard.JustDown(this.player.wasd.swap)) this.swapPowerup();
        if (Phaser.Input.Keyboard.JustDown(this.fullscreenKey)) this.scale.toggleFullscreen();
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

    createParallax() {
        this.add.rectangle(0, 0, this.worldWidth, 600, 0x87ceeb).setOrigin(0).setScrollFactor(0);
        for (let i = 0; i < 50; i++) {
            const x = Math.random() * this.worldWidth;
            const y = 50 + Math.random() * 200;
            this.add.image(x, y, 'cloud').setScrollFactor(0.2).setAlpha(0.4).setScale(2 + Math.random() * 2);
        }
        for (let i = 0; i < 30; i++) {
            const x = Math.random() * this.worldWidth;
            const y = 100 + Math.random() * 300;
            this.add.image(x, y, 'cloud').setScrollFactor(0.5).setAlpha(0.7).setScale(1 + Math.random());
        }
    }

    createEmitters() {
        this.collectEmitter = this.add.particles(0, 0, 'gem_icon', { speed: { min: 50, max: 150 }, scale: { start: 0.5, end: 0 }, alpha: { start: 1, end: 0 }, lifespan: 500, emitting: false, blendMode: 'ADD' });
        this.smokeEmitter = this.add.particles(0, 0, 'cloud', { speed: { min: 20, max: 80 }, scale: { start: 0.2, end: 0 }, alpha: { start: 0.5, end: 0 }, lifespan: 400, emitting: false });
    }

    setupHUD() {
        this.hudBg = this.add.rectangle(0, 0, 800, 60, 0x000000, 0.5).setOrigin(0).setScrollFactor(0).setDepth(1000);
        const s = { fontSize: '18px', fontFamily: 'monospace', fill: '#fff' };
        this.scoreText = this.add.text(20, 12, 'ROARK: 000000', s).setScrollFactor(0).setDepth(1001);
        this.bestText = this.add.text(20, 34, 'BEST: 000000', { ...s, fill: '#f1c40f' }).setScrollFactor(0).setDepth(1001);
        this.gemText = this.add.text(220, 20, '♦ x0', { ...s, fill: '#00d2d3' }).setScrollFactor(0).setDepth(1001);
        this.stateText = this.add.text(350, 20, 'MODE: SMALL', s).setScrollFactor(0).setDepth(1001);
        this.levelText = this.add.text(520, 20, 'LEVEL: 1', s).setScrollFactor(0).setDepth(1001);
        this.timerText = this.add.text(680, 20, '00:00', s).setScrollFactor(0).setDepth(1001);
        this.reserveIcon = this.add.image(400, 100, 'gem_icon').setScrollFactor(0).setDepth(1001).setVisible(false);
        this.shopPrompt = this.add.text(400, 80, '', { fontSize: '16px', fontFamily: 'monospace', fill: '#ffd700', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 8, y: 4 } })
            .setScrollFactor(0)
            .setDepth(1002)
            .setOrigin(0.5)
            .setVisible(false);
        this.questPrompt = this.add.text(400, 130, '', { fontSize: '16px', fontFamily: 'monospace', fill: '#74b9ff', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 8, y: 4 } })
            .setScrollFactor(0)
            .setDepth(1002)
            .setOrigin(0.5)
            .setVisible(false);
        this.questToast = this.add.text(400, 180, '', { fontSize: '14px', fontFamily: 'monospace', fill: '#ffffff', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 8, y: 4 } })
            .setScrollFactor(0)
            .setDepth(1002)
            .setOrigin(0.5)
            .setVisible(false);
        this.levelToast = this.add.text(400, 230, '', { fontSize: '16px', fontFamily: 'monospace', fill: '#f1c40f', backgroundColor: 'rgba(0,0,0,0.6)', padding: { x: 8, y: 4 } })
            .setScrollFactor(0)
            .setDepth(1002)
            .setOrigin(0.5)
            .setVisible(false);
        const mmWidth = 200;
        this.mmX = 300; this.mmY = 50;
        this.add.rectangle(this.mmX, this.mmY, mmWidth, 10, 0xffffff, 0.2).setOrigin(0, 0.5).setScrollFactor(0).setDepth(1000);
        this.mmPlayer = this.add.rectangle(this.mmX, this.mmY, 4, 12, 0xf1c40f).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    }

    updateHUD() {
        this.scoreText.setText(`ROARK: ${this.score.toString().padStart(6, '0')}`);
        this.bestText.setText(`BEST: ${this.bestScore.toString().padStart(6, '0')}`);
        this.gemText.setText(`♦ x${this.gemCount}`);
        this.stateText.setText(`MODE: ${this.player.state}`);
        this.levelText.setText(`LEVEL: ${this.currentLevelIndex + 1}`);
        const mins = Math.floor(this.gameTime / 60000).toString().padStart(2, '0');
        const secs = Math.floor((this.gameTime % 60000) / 1000).toString().padStart(2, '0');
        this.timerText.setText(`${mins}:${secs}`);
        this.mmPlayer.x = this.mmX + (this.player.x / this.worldWidth * 200);
    }

    updateBiomeVisuals() {
        const x = this.player.x;
        const biome = getBiomeForLevel(getLevelIndexForX(x, this.levelConfig), this.levelConfig);
        this.player.isSwimming = biome === 'aquatic';
        this.physics.world.gravity.y = this.player.isSwimming ? 300 : 1200;

        const tint = this.platformTintEnabled ? (biome === 'aquatic' ? 0x3498db : (biome === 'fungal' ? 0x9b59b6 : 0xffffff)) : 0xffffff;
        const bg = biome === 'aquatic' ? 0x2c3e50 : (biome === 'fungal' ? 0x4b0082 : 0x87ceeb);
        
        const chunk = Math.floor(x / 1000);
        if (chunk !== this.lastTintChunk) {
            this.lastTintChunk = chunk;
            this.cameras.main.setBackgroundColor(bg);
            this.platforms.getChildren().forEach(c => {
                if (c.setTint) c.setTint(tint);
            });
        }

        // Kill player if they fall
        if (this.player.y > this.levelConfig.levelHeight + 200) {
            this.die();
        }
    }

    getCurrentBiome() {
        return getBiomeForLevel(getLevelIndexForX(this.player.x, this.levelConfig), this.levelConfig);
    }

    attack() {
        this.player.isAttacking = true; 
        const isStone = this.player.state === 'STONE'; 
        this.time.delayedCall(isStone ? 200 : 300, () => this.player.isAttacking = false);
        const range = isStone ? 100 : 60; 
        const h = this.add.rectangle(this.player.x + (this.player.flipX ? 1 : -1) * range/2, this.player.y, range, isStone ? 60 : 40, 0xffff00, 0);
        this.physics.add.existing(h); 
        h.setData('hitTargets', new Set());
        const enemyGroups = [this.mushrooms, this.frogs, this.turtles, this.bosses, this.birds, this.jellyfish];
        enemyGroups.forEach(g => {
            this.physics.add.overlap(h, g, (hi, enemy) => { 
                const hitTargets = h.getData('hitTargets');
                if (hitTargets && hitTargets.has(enemy)) return;
                if (hitTargets) hitTargets.add(enemy);
                this.damageEnemy(enemy, 100);
            });
        });
        this.time.delayedCall(150, () => h.destroy());
    }

    shootFireball() { 
        const fb = this.fireballs.create(this.player.x, this.player.y, 'fireball'); 
        fb.setVelocity(this.player.flipX ? 400 : -400, 200); fb.setBounce(0.8); 
    }

    fireballHit(fb, enemy) { 
        fb.destroy(); 
        this.damageEnemy(enemy, 150);
    }

    damageEnemy(enemy, points = 100) {
        if (!enemy || !enemy.active) return false;
        const ex = enemy.x;
        const ey = enemy.y;
        let destroyed = false;
        if (enemy.takeDamage) destroyed = enemy.takeDamage();
        else { enemy.destroy(); destroyed = true; }
        this.addScore(points);
        if (destroyed && !(enemy instanceof Boss)) {
            this.smokeEmitter.explode(12, ex, ey);
        }
        return destroyed;
    }

    hitEnemy(p, enemy) {
        if (this.player.isInvulnerable) return;
        if (enemy instanceof Turtle && enemy.isShell && !enemy.isMoving) { 
            enemy.kick(p.x < enemy.x ? 1 : -1); 
            this.player.becomeInvulnerable(); 
            return; 
        }
        if (p.body.touching.down && p.y < enemy.y - 10) { 
            this.damageEnemy(enemy, 50);
            p.setVelocityY(-450); 
        }
        else this.player.state !== 'SMALL' ? this.player.shrink() : this.die();
    }

    collectPowerup(p, pu) { 
        const type = pu.texture.key; pu.destroy(); 
        if (this.player.state !== 'SMALL') { 
            this.reserveType = type; 
            this.reserveIcon.setTexture(type).setVisible(true).setScale(1.5); 
        } else this.player.applyPowerup(type);
    }

    swapPowerup() { 
        if (!this.reserveType) return; 
        const next = this.reserveType;
        const current = this.player.state === 'SUPER' ? 'powerup_mushroom' : (this.player.state === 'FIRE' ? 'powerup_fire' : (this.player.state === 'FEATHER' ? 'feather' : 'sword_stone')); 
        this.player.applyPowerup(next); 
        this.reserveType = current; this.reserveIcon.setTexture(current); 
    }

    reachCheckpoint(p, f) { if (this.player.lastCheckpoint.x !== f.x) { this.player.lastCheckpoint = { x: f.x, y: f.y }; f.setTint(0x00ff00); this.saveData(); } }
    collectGem(p, g) { this.collectEmitter.explode(15, g.x, g.y); g.destroy(); this.gemCount++; }
    collectCoin(p, c) {
        this.collectEmitter.explode(10, c.x, c.y);
        c.destroy();
        const now = this.time.now;
        this.coinCombo = now - this.lastCoinAt < 1500 ? Math.min(this.coinCombo + 1, 5) : 1;
        this.lastCoinAt = now;
        this.addScore(10 * this.coinCombo);
    }
    useSpring(p, s) { p.setVelocityY(-1000); this.tweens.add({ targets: s, scaleY: 0.5, duration: 50, yoyo: true }); }
    useWindGust(p, gust) {
        const now = this.time.now;
        const cooldownUntil = gust.getData('cooldownUntil') || 0;
        if (now < cooldownUntil) return;
        const boost = gust.getData('boost') || 700;
        p.setVelocityY(-boost);
        gust.setData('cooldownUntil', now + 500);
        this.tweens.add({ targets: gust, scaleY: gust.scaleY * 0.9, duration: 80, yoyo: true });
    }
    enterShop(p, s) { this.shopInRange = s; }
    updateShopPrompt(time) {
        if (this.getNearestQuestNpcInRange()) {
            this.shopPrompt.setVisible(false);
            return;
        }
        const shop = this.getNearestShopInRange();
        if (!shop) {
            this.shopPrompt.setVisible(false);
            return;
        }
        const label = shop.getData('offerLabel') || 'Upgrade';
        const price = shop.getData('price') || 10;
        const canBuy = this.gemCount >= price && time >= (shop.getData('cooldownUntil') || 0);
        this.shopPrompt.setText(`Press E: ${label} (${price} gems)`);
        this.shopPrompt.setColor(canBuy ? '#ffd700' : '#ff7675');
        this.shopPrompt.setVisible(true);
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.purchaseShop(shop, time);
        }
    }
    getNearestShopInRange() {
        let nearest = null;
        let best = Infinity;
        const range = 120;
        this.shops.getChildren().forEach((shop) => {
            if (!shop.active) return;
            const dx = this.player.x - shop.x;
            const dy = this.player.y - shop.y;
            const dist = Math.hypot(dx, dy);
            if (dist < range && dist < best) {
                best = dist;
                nearest = shop;
            }
        });
        return nearest;
    }
    purchaseShop(shop, time) {
        const price = shop.getData('price') || 10;
        const cooldownUntil = shop.getData('cooldownUntil') || 0;
        if (time < cooldownUntil || this.gemCount < price) return;
        const offerId = shop.getData('offerId');
        if (offerId === 'jump') this.player.upgrades.jumpPower = Math.max(this.player.upgrades.jumpPower - 40, -900);
        if (offerId === 'speed') this.player.upgrades.speed = Math.min(this.player.upgrades.speed + 40, 520);
        if (offerId === 'life') return;
        this.gemCount -= price;
        shop.setData('cooldownUntil', time + 800);
        this.tweens.add({ targets: shop, scale: 2.2, duration: 100, yoyo: true });
        this.saveData();
    }
    hitBreakableBlock(p, b) { if (p.body.touching.up && this.player.state !== 'SMALL') { this.smokeEmitter.explode(20, b.x, b.y); b.destroy(); this.addScore(20); this.cameras.main.shake(100, 0.01); } }
    hitSpikes(p, s) { if (!this.player.isInvulnerable) this.player.state !== 'SMALL' ? this.player.shrink() : this.die(); }

    collectTimeOrb(p, orb) {
        this.worldGenerator.releaseTimeOrb(orb);
        this.applyTimeSlow(6000, this.timeSlowFactor);
    }

    collectMagnetOrb(p, orb) {
        this.worldGenerator.releaseMagnetOrb(orb);
        this.magnetUntil = this.time.now + 7000;
    }

    applyTimeSlow(duration, factor) {
        this.timeSlowUntil = this.time.now + duration;
        this.physics.world.timeScale = factor;
    }

    updateTimeSlow(time) {
        if (this.timeSlowUntil && time > this.timeSlowUntil) {
            this.timeSlowUntil = 0;
            this.physics.world.timeScale = 1;
        }
    }

    updateMagnet(time) {
        if (time > this.magnetUntil) return;
        const radius = this.magnetRadius + this.magnetRadiusBoost;
        const speed = this.magnetSpeed;
        this.coins.getChildren().forEach((coin) => {
            if (!coin.active) return;
            const dx = this.player.x - coin.x;
            const dy = this.player.y - coin.y;
            if (dx * dx + dy * dy < radius * radius) {
                this.physics.moveToObject(coin, this.player, speed);
            }
        });
        this.gems.getChildren().forEach((gem) => {
            if (!gem.active) return;
            const dx = this.player.x - gem.x;
            const dy = this.player.y - gem.y;
            if (dx * dx + dy * dy < radius * radius) {
                this.physics.moveToObject(gem, this.player, speed);
            }
        });
    }

    addScore(points) {
        this.score += points;
        if (this.score > this.bestScore) {
            this.bestScore = this.score;
            this.bestScoreDirty = true;
        }
    }

    autoSave(time) {
        if (!this.bestScoreDirty) return;
        if (time - this.lastSaveAt < 5000) return;
        this.lastSaveAt = time;
        this.bestScoreDirty = false;
        this.saveData();
    }

    updateQuestPrompt(time) {
        const npc = this.getNearestQuestNpcInRange();
        if (!npc) {
            this.questPrompt.setVisible(false);
            return;
        }
        if (this.shopPrompt.visible) this.shopPrompt.setVisible(false);
        const biome = npc.getData('biome');
        const quest = this.getQuestConfig(biome);
        const completed = this.questState[quest.id] === 'completed';
        const label = completed ? quest.doneLabel : quest.label;
        const price = quest.cost;
        const canBuy = completed || this.gemCount >= price;
        this.questPrompt.setText(completed ? `Press E: ${label}` : `Press E: ${label} (${price} gems)`);
        this.questPrompt.setColor(canBuy ? '#74b9ff' : '#ff7675');
        this.questPrompt.setVisible(true);
        if (Phaser.Input.Keyboard.JustDown(this.interactKey)) {
            this.tryCompleteQuest(npc, time);
        }
    }

    getQuestConfig(biome) {
        const configs = {
            meadows: {
                id: 'meadows',
                cost: 8,
                label: 'Trail Sprite Blessing',
                doneLabel: 'The meadow hums again',
                reward: 'speed',
                lore: 'The wind remembers your steps.'
            },
            fungal: {
                id: 'fungal',
                cost: 10,
                label: 'Mycelium Pact',
                doneLabel: 'Spores carry your name',
                reward: 'jump',
                lore: 'Roots deepen your leap.'
            },
            aquatic: {
                id: 'aquatic',
                cost: 12,
                label: 'Cavern Tide Whisper',
                doneLabel: 'The tide follows your light',
                reward: 'magnet',
                lore: 'Currents draw treasures to you.'
            }
        };
        return configs[biome] || configs.meadows;
    }

    getNearestQuestNpcInRange() {
        let nearest = null;
        let best = Infinity;
        const range = 140;
        this.npcs.getChildren().forEach((npc) => {
            if (!npc.active) return;
            const dx = this.player.x - npc.x;
            const dy = this.player.y - npc.y;
            const dist = Math.hypot(dx, dy);
            if (dist < range && dist < best) {
                best = dist;
                nearest = npc;
            }
        });
        return nearest;
    }

    tryCompleteQuest(npc, time) {
        const biome = npc.getData('biome');
        const quest = this.getQuestConfig(biome);
        if (this.questState[quest.id] === 'completed') {
            this.showQuestMessage(quest.lore);
            return;
        }
        if (this.gemCount < quest.cost) {
            this.showQuestMessage('Not enough gems yet.');
            return;
        }
        this.gemCount -= quest.cost;
        this.questState[quest.id] = 'completed';
        this.applyQuestReward(quest, time);
        this.showQuestMessage(quest.lore);
        this.saveData();
    }

    applyQuestReward(quest, time) {
        if (quest.reward === 'speed') this.applyTimedSpeedBuff(80, 12000);
        if (quest.reward === 'jump') this.applyTimedJumpBuff(-80, 12000);
        if (quest.reward === 'magnet') this.applyTimedMagnetBuff(120, 12000, time);
    }

    applyTimedSpeedBuff(amount, duration) {
        const existing = this.activeBuffs.speed;
        if (existing) {
            if (existing.timer) existing.timer.remove(false);
            this.player.upgrades.speed -= existing.amount;
        }
        this.player.upgrades.speed += amount;
        const timer = this.time.delayedCall(duration, () => {
            this.player.upgrades.speed -= amount;
            delete this.activeBuffs.speed;
        });
        this.activeBuffs.speed = { amount, timer };
    }

    applyTimedJumpBuff(amount, duration) {
        const existing = this.activeBuffs.jump;
        if (existing) {
            if (existing.timer) existing.timer.remove(false);
            this.player.upgrades.jumpPower -= existing.amount;
        }
        this.player.upgrades.jumpPower += amount;
        const timer = this.time.delayedCall(duration, () => {
            this.player.upgrades.jumpPower -= amount;
            delete this.activeBuffs.jump;
        });
        this.activeBuffs.jump = { amount, timer };
    }

    applyTimedMagnetBuff(radiusBoost, duration, time) {
        const existing = this.activeBuffs.magnet;
        if (existing) {
            if (existing.timer) existing.timer.remove(false);
            this.magnetRadiusBoost -= existing.radiusBoost;
        }
        this.magnetRadiusBoost += radiusBoost;
        this.magnetUntil = Math.max(this.magnetUntil, time + duration);
        const timer = this.time.delayedCall(duration, () => {
            this.magnetRadiusBoost -= radiusBoost;
            delete this.activeBuffs.magnet;
        });
        this.activeBuffs.magnet = { radiusBoost, timer };
    }

    updateBuffTimers(time) {
        if (time > this.magnetUntil) {
            this.magnetRadiusBoost = 0;
        }
    }

    showQuestMessage(message) {
        if (!this.questToast) return;
        this.questToast.setText(message).setVisible(true);
        if (this.questToastTimer) this.questToastTimer.remove(false);
        this.questToastTimer = this.time.delayedCall(3000, () => {
            this.questToast.setVisible(false);
        });
    }

    ensureBiomeTilesets() {
        this.createBiomeTileset('tileset_fungal', {
            top: '#8e44ad',
            topEdge: '#c678dd',
            fill: '#512b6b',
            speck: '#d4b5f5'
        });
        this.createBiomeTileset('tileset_aquatic', {
            top: '#2c7fb8',
            topEdge: '#74b9ff',
            fill: '#1b4f72',
            speck: '#a3d5ff'
        });
    }

    createBiomeTileset(key, palette) {
        if (this.textures.exists(key) && this.textures.get(key).frameTotal > 1) return;
        const tileSize = 32;
        const width = tileSize * 2;
        const height = tileSize;
        const sourceKey = `${key}_source`;
        if (this.textures.exists(sourceKey)) this.textures.remove(sourceKey);
        const canvasTexture = this.textures.createCanvas(sourceKey, width, height);
        const ctx = canvasTexture.getContext();
        ctx.clearRect(0, 0, width, height);

        ctx.fillStyle = palette.top;
        ctx.fillRect(0, 0, tileSize, tileSize);
        ctx.fillStyle = palette.topEdge;
        ctx.fillRect(0, 0, tileSize, 6);
        ctx.fillStyle = palette.speck;
        for (let i = 0; i < 10; i++) {
            ctx.fillRect(4 + i * 2, 12 + (i % 3) * 4, 2, 2);
        }

        ctx.fillStyle = palette.fill;
        ctx.fillRect(tileSize, 0, tileSize, tileSize);
        ctx.fillStyle = palette.topEdge;
        ctx.fillRect(tileSize, 0, tileSize, 4);
        ctx.fillStyle = palette.speck;
        for (let i = 0; i < 8; i++) {
            ctx.fillRect(tileSize + 6 + i * 2, 14 + (i % 3) * 4, 2, 2);
        }

        canvasTexture.refresh();
        if (this.textures.exists(key)) this.textures.remove(key);
        this.textures.addSpriteSheet(key, canvasTexture.getSourceImage(), { frameWidth: tileSize, frameHeight: tileSize });
        this.tilesetFrameOverrides[key] = { top: 0, fill: 1 };
    }

    die() { 
        this.player.setPosition(this.player.lastCheckpoint.x, this.player.lastCheckpoint.y - 100); 
        this.player.setVelocity(0, 0); 
        this.player.becomeInvulnerable(); 
        this.cameras.main.flash(500, 255, 0, 0); 
    }
    
    winGame() { if (this.isWinning) return; this.isWinning = true; this.saveData(); this.physics.pause(); this.add.text(400, 300, 'VICTORY!', { fontSize: '84px', fill: '#f1c40f' }).setOrigin(0.5).setScrollFactor(0); this.time.delayedCall(5000, () => { this.isWinning = false; this.scene.start('MenuScene'); }); }
    isBossDefeated(levelIndex) {
        return this.defeatedBossLevels.has(levelIndex);
    }
    handleBossDefeated(boss) {
        this.spawnBossRewards(boss);
        const storedIndex = boss.getData('levelIndex');
        const levelIndex = Number.isFinite(storedIndex) ? storedIndex : getLevelIndexForX(boss.x, this.levelConfig);
        this.defeatedBossLevels.add(levelIndex);
        this.unlockGateForLevel(levelIndex);
        this.showLevelMessage('BOSS DOWN - GRAB THE FLAG');
        this.saveData();
    }
    unlockGateForLevel(levelIndex) {
        this.levelGates.getChildren().forEach((gate) => {
            if (gate.getData('levelIndex') !== levelIndex) return;
            gate.setData('locked', false);
            gate.clearTint();
        });
    }
    spawnBossRewards(boss) {
        const pools = this.worldGenerator?.pools;
        if (!pools || !boss) return;
        const baseX = boss.x;
        const baseY = boss.y - 60;
        for (let i = 0; i < 6; i++) {
            const gem = pools.getGem(baseX + (i - 2.5) * 18, baseY - Math.abs(2 - i) * 10);
            if (gem && gem.body) gem.body.setVelocity(0, -80);
        }
        const powerupKey = Math.random() > 0.5 ? 'powerup_fire' : 'feather';
        pools.getPowerup(baseX, baseY - 40, powerupKey);
    }
    completeLevel(player, gate) {
        const gateIndex = gate.getData('levelIndex');
        if (gateIndex === undefined || gateIndex === null) return;
        if (gateIndex !== this.currentLevelIndex) return;
        if (!this.isBossDefeated(gateIndex)) {
            const now = this.time.now;
            if (now > this.nextGateHintAt) {
                this.showLevelMessage('DEFEAT THE BOSS');
                this.nextGateHintAt = now + 1200;
            }
            return;
        }
        const lastIndex = this.levelConfig.levelCount - 1;
        if (gateIndex >= lastIndex) {
            this.winGame();
            return;
        }
        this.currentLevelIndex = gateIndex + 1;
        this.player.lastCheckpoint = { x: gate.x + 120, y: this.levelConfig.groundY - 150 };
        this.showLevelMessage(`LEVEL ${this.currentLevelIndex + 1}`);
        this.saveData();
    }

    showLevelMessage(message) {
        if (!this.levelToast) return;
        this.levelToast.setText(message).setVisible(true);
        if (this.levelToastTimer) this.levelToastTimer.remove(false);
        this.levelToastTimer = this.time.delayedCall(2500, () => {
            this.levelToast.setVisible(false);
        });
    }
    saveData() {
        localStorage.setItem('roark_save', JSON.stringify({
            score: this.score,
            bestScore: this.bestScore,
            gemCount: this.gemCount,
            upgrades: this.player.upgrades,
            questState: this.questState,
            currentLevelIndex: this.currentLevelIndex,
            reserveType: this.reserveType,
            defeatedBossLevels: Array.from(this.defeatedBossLevels)
        }));
    }
    loadData() {
        const saved = localStorage.getItem('roark_save');
        if (saved) {
            const data = JSON.parse(saved);
            this.score = data.score || 0;
            this.bestScore = data.bestScore || 0;
            this.gemCount = data.gemCount || 0;
            if (data.upgrades) this.player.upgrades = data.upgrades;
            if (data.questState) this.questState = data.questState;
            if (typeof data.currentLevelIndex === 'number') this.currentLevelIndex = data.currentLevelIndex;
            if (Array.isArray(data.defeatedBossLevels)) {
                this.defeatedBossLevels = new Set(data.defeatedBossLevels);
            }
            if (data.reserveType) {
                this.reserveType = data.reserveType;
                this.reserveIcon.setTexture(this.reserveType).setVisible(true).setScale(1.5);
            }
            this.updateHUD();
        }
    }
}
