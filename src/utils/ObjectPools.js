import { Mushroom, Frog, Turtle, Boss, FlyingEnemy } from '../entities/Enemy';
import { Powerup } from '../entities/Collectible';

export default class ObjectPools {
    constructor(scene) {
        this.scene = scene;
        this.platformPool = [];
        this.movingPlatformPool = [];
        this.spikePool = [];
        this.springPool = [];
        this.breakablePool = [];
        this.coinPool = [];
        this.gemPool = [];
        this.timeOrbPool = [];
        this.magnetOrbPool = [];
        this.windGustPool = [];
        this.checkpointPool = [];
        this.shopPool = [];
        this.npcPool = [];
        this.levelGatePool = [];
        this.powerupPools = {
            feather: [],
            sword_stone: [],
            powerup_mushroom: [],
            powerup_fire: []
        };
        this.enemyPools = {
            mushroom: [],
            frog: [],
            turtle: [],
            boss: [],
            bird: [],
            jellyfish: []
        };
    }

    takeFromPool(pool) {
        let candidate = null;
        while (pool.length > 0 && !candidate) {
            const next = pool.pop();
            if (next && next.scene) candidate = next;
        }
        return candidate;
    }

    getPlatform(x, y, tilesetKey, frame, scale) {
        const platform = this.takeFromPool(this.platformPool) || this.scene.platforms.create(x, y, tilesetKey, frame);
        platform.setActive(true).setVisible(true);
        platform.setTexture(tilesetKey, frame);
        platform.setPosition(x, y);
        platform.setScale(scale);
        if (platform.body) platform.body.enable = true;
        platform.refreshBody();
        return platform;
    }

    getMovingPlatform(x, y) {
        const platform = this.takeFromPool(this.movingPlatformPool) || this.scene.movingPlatforms.create(x, y, 'moving_platform');
        platform.setActive(true).setVisible(true);
        platform.setPosition(x, y);
        platform.setScale(2);
        if (platform.body) {
            platform.body.enable = true;
            platform.body.setAllowGravity(false);
            platform.body.setImmovable(true);
        }
        return platform;
    }

    getSpike(x, y) {
        const spike = this.takeFromPool(this.spikePool) || this.scene.spikes.create(x, y, 'spikes');
        spike.setActive(true).setVisible(true);
        spike.setPosition(x, y);
        spike.setScale(2);
        if (spike.body) spike.body.enable = true;
        spike.refreshBody();
        return spike;
    }

    getSpring(x, y) {
        const spring = this.takeFromPool(this.springPool) || this.scene.springs.create(x, y, 'spring');
        spring.setActive(true).setVisible(true);
        spring.setPosition(x, y);
        spring.setScale(2);
        if (spring.body) spring.body.enable = true;
        spring.refreshBody();
        return spring;
    }

    getBreakableBlock(x, y, tilesetKey, frame, scale) {
        const block = this.takeFromPool(this.breakablePool) || this.scene.breakableBlocks.create(x, y, tilesetKey, frame);
        block.setActive(true).setVisible(true);
        block.setTexture(tilesetKey, frame);
        block.setPosition(x, y);
        block.setScale(scale);
        if (block.body) block.body.enable = true;
        block.refreshBody();
        return block;
    }

    getCoin(x, y) {
        const coin = this.takeFromPool(this.coinPool) || this.scene.coins.create(x, y, 'coin');
        coin.setActive(true).setVisible(true);
        coin.setPosition(x, y);
        coin.setScale(1.3);
        if (coin.body) coin.body.enable = true;
        return coin;
    }

    getGem(x, y) {
        const gem = this.takeFromPool(this.gemPool) || this.scene.gems.create(x, y, 'gem_icon');
        gem.setActive(true).setVisible(true);
        gem.setPosition(x, y);
        gem.setScale(1.2);
        if (gem.body) gem.body.enable = true;
        return gem;
    }

    getPowerup(x, y, key) {
        const pool = this.powerupPools[key];
        let powerup = null;
        while (pool.length > 0 && !powerup) {
            const candidate = pool.pop();
            if (candidate && candidate.scene) powerup = candidate;
        }
        if (!powerup) powerup = new Powerup(this.scene, x, y, key);
        if (!powerup.active) this.scene.powerups.add(powerup);
        powerup.setActive(true).setVisible(true);
        powerup.setTexture(key);
        powerup.setPosition(x, y);
        powerup.setScale(1.6);
        if (powerup.body) powerup.body.enable = true;
        return powerup;
    }

    getTimeOrb(x, y) {
        const orb = this.takeFromPool(this.timeOrbPool) || this.scene.timeOrbs.create(x, y, 'time_orb');
        orb.setActive(true).setVisible(true);
        orb.setPosition(x, y);
        orb.setScale(1.4);
        if (orb.body) orb.body.enable = true;
        return orb;
    }

    getMagnetOrb(x, y) {
        const orb = this.takeFromPool(this.magnetOrbPool) || this.scene.magnetOrbs.create(x, y, 'magnet_orb');
        orb.setActive(true).setVisible(true);
        orb.setPosition(x, y);
        orb.setScale(1.4);
        if (orb.body) orb.body.enable = true;
        return orb;
    }

    getWindGust(x, y, scaleY = 3, boost = 700) {
        const gust = this.takeFromPool(this.windGustPool) || this.scene.windGusts.create(x, y, 'wind_gust');
        gust.setActive(true).setVisible(true);
        gust.setPosition(x, y);
        gust.setOrigin(0.5, 1);
        gust.setScale(1.6, scaleY);
        gust.setAlpha(0.7);
        gust.setData('boost', boost);
        gust.setData('cooldownUntil', 0);
        if (gust.body) gust.body.enable = true;
        gust.refreshBody();
        return gust;
    }

    getCheckpoint(x, y) {
        const checkpoint = this.takeFromPool(this.checkpointPool) || this.scene.checkpoints.create(x, y, 'flag');
        checkpoint.setActive(true).setVisible(true);
        checkpoint.setPosition(x, y);
        checkpoint.setScale(2);
        checkpoint.setDepth(1);
        checkpoint.clearTint();
        if (checkpoint.body) checkpoint.body.enable = true;
        checkpoint.refreshBody();
        return checkpoint;
    }

    getShop(x, y) {
        const shop = this.takeFromPool(this.shopPool) || this.scene.shops.create(x, y, 'shop_bg');
        shop.setActive(true).setVisible(true);
        shop.setPosition(x, y);
        shop.setScale(2);
        if (shop.body) shop.body.enable = true;
        shop.refreshBody();
        const offers = [
            { id: 'jump', label: 'Jump+', price: 10 },
            { id: 'speed', label: 'Speed+', price: 10 }
        ];
        const offer = offers[Math.floor(Math.random() * offers.length)];
        shop.setData('offerId', offer.id);
        shop.setData('offerLabel', offer.label);
        shop.setData('price', offer.price);
        shop.setData('cooldownUntil', 0);
        return shop;
    }

    getNpc(biome, x, y) {
        const textureKey = `npc_${biome}`;
        const npc = this.takeFromPool(this.npcPool) || this.scene.npcs.create(x, y, textureKey);
        npc.setActive(true).setVisible(true);
        npc.setPosition(x, y);
        npc.setTexture(textureKey);
        npc.setScale(2);
        npc.setData('biome', biome);
        npc.setData('npcId', `${biome}_${Math.round(x)}`);
        if (npc.body) npc.body.enable = true;
        npc.refreshBody();
        return npc;
    }

    getLevelGate(x, y, levelIndex) {
        const gate = this.takeFromPool(this.levelGatePool) || this.scene.levelGates.create(x, y, 'goal_pole');
        gate.setActive(true).setVisible(true);
        gate.setOrigin(0.5, 1);
        gate.setPosition(x, y);
        gate.setScale(2);
        gate.setData('levelIndex', levelIndex);
        gate.setDepth(2);
        if (gate.body) gate.body.enable = true;
        gate.refreshBody();
        return gate;
    }

    spawnEnemy(biome, x, y, rng, levelIndex = 0) {
        if (biome === 'aquatic') {
            const roll = rng();
            const flyY = Number.isFinite(y) ? y - 160 : 220;
            return roll < 0.7 ? this.getFlyingEnemy('jellyfish', x, flyY, levelIndex) : this.getFlyingEnemy('bird', x, flyY, levelIndex);
        }
        if (biome === 'fungal') {
            return rng() < 0.5 ? this.getEnemy('mushroom', x, y, levelIndex) : this.getEnemy('frog', x, y, levelIndex);
        }
        const roll = rng();
        if (roll < 0.3) return this.getEnemy('mushroom', x, y, levelIndex);
        if (roll < 0.55) return this.getEnemy('frog', x, y, levelIndex);
        if (roll < 0.8) return this.getEnemy('turtle', x, y, levelIndex);
        const flyY = Number.isFinite(y) ? y - 160 : 180 + rng() * 120;
        return this.getFlyingEnemy('bird', x, flyY, levelIndex);
    }

    getBoss(x, y, levelIndex = 0) {
        const pool = this.enemyPools.boss;
        let boss = null;
        while (pool.length > 0 && !boss) {
            const candidate = pool.pop();
            if (candidate && candidate.scene) boss = candidate;
        }
        if (!boss) {
            boss = new Boss(this.scene, x, y);
            this.scene.bosses.add(boss);
        }
        boss.setActive(true).setVisible(true);
        boss.setPosition(x, y);
        if (boss.body) boss.body.enable = true;
        this.applyEnemyDifficulty(boss, 'boss', levelIndex);
        boss.clearTint();
        boss.health = boss.maxHealth;
        boss.setData('levelIndex', levelIndex);
        return boss;
    }

    getEnemy(type, x, y, levelIndex = 0) {
        const pool = this.enemyPools[type];
        if (!pool) return null;
        let enemy = null;
        while (pool.length > 0 && !enemy) {
            const candidate = pool.pop();
            if (candidate && candidate.scene) enemy = candidate;
        }
        if (!enemy) {
            if (type === 'mushroom') enemy = new Mushroom(this.scene, x, y);
            else if (type === 'frog') enemy = new Frog(this.scene, x, y);
            else enemy = new Turtle(this.scene, x, y);
            const groupKey = type === 'mushroom' ? 'mushrooms' : (type === 'frog' ? 'frogs' : 'turtles');
            if (this.scene[groupKey]) this.scene[groupKey].add(enemy);
        }
        if (!enemy) return null;
        enemy.setActive(true).setVisible(true);
        enemy.setPosition(x, y);
        if (enemy.body) enemy.body.enable = true;
        enemy.clearTint();
        this.applyEnemyDifficulty(enemy, type, levelIndex);
        if (type === 'mushroom') {
            enemy.setVelocityX(-enemy.patrolSpeed);
        } else if (type === 'frog') {
            enemy.nextJump = 0;
            enemy.setVelocityX(-enemy.patrolSpeed);
            if (enemy.setBounce) enemy.setBounce(1, 0);
        } else if (type === 'turtle') {
            enemy.isShell = false;
            enemy.isMoving = false;
            enemy.setVelocityX(-enemy.patrolSpeed);
            if (enemy.setBodySize) enemy.setBodySize(20, 24);
            if (enemy.setOffset) enemy.setOffset(6, 8);
        }
        enemy.setData('levelIndex', levelIndex);
        return enemy;
    }

    getFlyingEnemy(type, x, y, levelIndex = 0) {
        const pool = this.enemyPools[type];
        if (!pool) return null;
        let enemy = null;
        while (pool.length > 0 && !enemy) {
            const candidate = pool.pop();
            if (candidate && candidate.scene) enemy = candidate;
        }
        if (!enemy) {
            enemy = new FlyingEnemy(this.scene, x, y, type);
            this.scene[type === 'bird' ? 'birds' : 'jellyfish'].add(enemy);
        }
        if (!enemy) return null;
        enemy.setActive(true).setVisible(true);
        enemy.setPosition(x, y);
        if (enemy.body) {
            enemy.body.enable = true;
            enemy.body.setAllowGravity(false);
        }
        this.applyEnemyDifficulty(enemy, type, levelIndex);
        enemy.startY = y;
        enemy.setVelocityX(-enemy.patrolSpeed);
        enemy.setData('levelIndex', levelIndex);
        return enemy;
    }

    applyEnemyDifficulty(enemy, type, levelIndex = 0) {
        if (!enemy) return;
        const baseStats = {
            mushroom: { speed: 100, health: 1 },
            frog: { speed: 100, jumpSpeed: 150, health: 1 },
            turtle: { speed: 100, health: 1 },
            bird: { speed: 150, health: 1 },
            jellyfish: { speed: 50, health: 1 },
            boss: { speed: 50, health: 5 }
        };
        const stats = baseStats[type] || baseStats.mushroom;
        const speedMultiplier = 1 + levelIndex * 0.05;
        enemy.speedMultiplier = speedMultiplier;
        enemy.baseHealth = stats.health;
        enemy.maxHealth = stats.health + levelIndex;
        enemy.health = enemy.maxHealth;
        enemy.patrolSpeed = stats.speed * speedMultiplier;
        if (type === 'frog') enemy.leapSpeed = (stats.jumpSpeed || 150) * speedMultiplier;
        if (type === 'boss') enemy.jumpPower = 600 + levelIndex * 8;
    }

    releaseObject(obj, pool) {
        if (!obj || !obj.scene) return;
        if (obj.body) obj.disableBody(true, true);
        obj.setActive(false).setVisible(false);
        pool.push(obj);
    }

    releaseMovingPlatform(obj) {
        if (!obj || !obj.scene) return;
        const tween = obj.getData('tween');
        if (tween) {
            tween.stop();
            obj.setData('tween', null);
        }
        if (obj.body) obj.disableBody(true, true);
        obj.setActive(false).setVisible(false);
        this.movingPlatformPool.push(obj);
    }

    releasePowerup(obj) {
        if (!obj || !obj.scene) return;
        const key = obj.texture && obj.texture.key;
        if (obj.body) obj.disableBody(true, true);
        obj.setActive(false).setVisible(false);
        if (this.powerupPools[key]) this.powerupPools[key].push(obj);
    }

    releaseTimeOrb(obj) {
        if (!obj) return;
        if (obj.body) obj.disableBody(true, true);
        obj.setActive(false).setVisible(false);
        this.timeOrbPool.push(obj);
    }

    releaseMagnetOrb(obj) {
        if (!obj) return;
        if (obj.body) obj.disableBody(true, true);
        obj.setActive(false).setVisible(false);
        this.magnetOrbPool.push(obj);
    }

    releaseEnemy(obj) {
        if (!obj || !obj.scene) return;
        const key = obj.enemyKey;
        if (obj.body) obj.disableBody(true, true);
        obj.setActive(false).setVisible(false);
        if (this.enemyPools[key]) this.enemyPools[key].push(obj);
    }
}
