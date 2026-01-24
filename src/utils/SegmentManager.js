import Phaser from 'phaser';
import { getBiomeForLevel, getPitRangesForLevel } from './LevelConfig';
import { createRng } from './Random';
import PathPlanner from './PathPlanner';

export default class SegmentManager {
    constructor(scene, config, pools, frameResolver) {
        this.scene = scene;
        this.config = config;
        this.pools = pools;
        this.frameResolver = frameResolver;
        this.activeSegments = new Set();
        this.segmentObjects = new Map();
    }

    update(playerX) {
        const camera = this.scene?.cameras?.main;
        const worldView = camera?.worldView;
        const stride = this.config.levelStride;
        const maxIndex = this.config.levelCount - 1;
        const currentIndex = Math.max(0, Math.min(maxIndex, Math.floor(playerX / stride)));
        this.currentIndex = currentIndex;
        const screenWidth = worldView?.width ?? 0;
        const paddedLeft = (worldView?.left ?? playerX) - screenWidth * 2;
        const paddedRight = (worldView?.right ?? playerX) + screenWidth * 2;
        const startIndex = Math.max(0, Math.floor(paddedLeft / stride));
        const endIndex = Math.min(maxIndex, Math.floor(paddedRight / stride));
        const desired = new Set();

        for (let index = startIndex; index <= endIndex; index++) {
            desired.add(index);
        }

        for (const index of desired) {
            if (!this.activeSegments.has(index)) {
                this.spawnSegment(index);
            }
        }

        for (const index of Array.from(this.activeSegments)) {
            if (!desired.has(index)) {
                this.despawnSegment(index);
            }
        }

        this.ensureGateForCurrent();
        this.ensureBossForCurrent();
    }

    getSegmentPlacementData(index) {
        const tileSize = 32;
        const tileScale = 2;
        const segmentStart = index * this.config.levelStride;
        const segmentEnd = segmentStart + this.config.segmentLength;
        const groundSurfaceY = (this.config.groundY ?? 500) - (tileSize * tileScale / 2);
        const pitRanges = getPitRangesForLevel(index, this.config, tileSize * tileScale);
        const nudgeOutOfPit = (x) => {
            if (!this.isInPit(x, pitRanges)) return x;
            const step = tileSize * tileScale;
            for (let i = 1; i <= 6; i++) {
                const left = x - step * i;
                const right = x + step * i;
                if (left > segmentStart + 40 && !this.isInPit(left, pitRanges)) return left;
                if (right < segmentEnd - 40 && !this.isInPit(right, pitRanges)) return right;
            }
            return x;
        };
        return {
            segmentStart,
            segmentEnd,
            groundSurfaceY,
            pitRanges,
            nudgeOutOfPit
        };
    }

    ensureGateForCurrent() {
        const index = this.currentIndex ?? 0;
        const objects = this.segmentObjects.get(index);
        if (!objects) return;
        if (!objects.levelGates.length) {
            const placement = this.getSegmentPlacementData(index);
            this.spawnGateForSegment(index, { objects, ...placement });
        }
        const gate = objects.levelGates[0];
        if (!gate) return;
        const locked = typeof this.scene?.isBossDefeated === 'function' ? !this.scene.isBossDefeated(index) : true;
        gate.setData('locked', locked);
        if (locked) gate.setTint(0x636e72);
        else gate.clearTint();
    }

    ensureBossForCurrent() {
        const index = this.currentIndex ?? 0;
        const objects = this.segmentObjects.get(index);
        if (!objects) return;
        if (typeof this.scene?.isBossDefeated === 'function' && this.scene.isBossDefeated(index)) return;
        const hasBoss = objects.enemies.some(enemy => enemy?.enemyKey === 'boss');
        if (hasBoss) return;
        const placement = this.getSegmentPlacementData(index);
        this.spawnBossForSegment(index, { objects, ...placement });
    }

    spawnGateForSegment(index, context) {
        const { objects, groundSurfaceY, segmentStart, nudgeOutOfPit } = context;
        if (objects.levelGates.length) return;
        const gateX = nudgeOutOfPit(segmentStart + this.config.segmentLength - 70);
        const gateY = groundSurfaceY + 10;
        const gate = this.pools.getLevelGate(gateX, gateY, index);
        if (!gate) return;
        if (!this.resolvePlacement(gate, [ ...objects.platforms, ...objects.movingPlatforms, ...objects.breakables, ...objects.springs, ...objects.hazards, ...objects.windGusts, ...objects.enemies, ...objects.pickups ], 6, 10, 2)) {
            this.pools.releaseObject(gate, this.pools.levelGatePool);
            return;
        }
        objects.levelGates.push(gate);
    }

    spawnBossForSegment(index, context) {
        const { objects, groundSurfaceY, segmentStart, nudgeOutOfPit } = context;
        const bossX = nudgeOutOfPit(segmentStart + this.config.segmentLength - 160);
        const bossY = groundSurfaceY - 80;
        const boss = this.pools.getBoss(bossX, bossY, index);
        if (!boss) return;
        if (!this.resolvePlacement(boss, [ ...objects.platforms, ...objects.movingPlatforms, ...objects.breakables, ...objects.springs, ...objects.hazards, ...objects.windGusts, ...objects.enemies, ...objects.pickups, ...objects.levelGates ], 6, 10, 2)) {
            this.pools.releaseEnemy(boss);
            return;
        }
        objects.enemies.push(boss);
    }

    spawnSegment(index) {
        const rng = createRng(this.config.runSeed + (index + 1) * 1337);
        const segmentStart = index * this.config.levelStride;
        const biome = getBiomeForLevel(index, this.config);
        const tileSize = 32;
        const tileScale = 2;
        const groundSurfaceY = (this.config.groundY ?? 500) - (tileSize * tileScale / 2);
        const groundSpawnY = groundSurfaceY - 32;
        const tilesetKey = `tileset_${biome}`;
        const tileFrames = this.frameResolver.getFrames(tilesetKey, tileSize);
        const platformFrame = this.frameResolver.getNamedFrame(tilesetKey, 'platform_top') ?? tileFrames.top;
        const breakableFrame = this.frameResolver.getNamedFrame(tilesetKey, 'breakable_block') ?? tileFrames.top;
        const pitRanges = getPitRangesForLevel(index, this.config, tileSize * tileScale);
        const requiredFeatures = this.config.requiredFeaturesByLevel?.[index] ?? [];
        const segmentEnd = segmentStart + this.config.segmentLength;
        const terrainTiles = this.getTerrainTiles(segmentStart, segmentEnd, groundSurfaceY);
        const getBlockers = (...lists) => lists.flat().filter(Boolean);

        const objects = {
            platforms: [],
            movingPlatforms: [],
            breakables: [],
            springs: [],
            hazards: [],
            windGusts: [],
            enemies: [],
            pickups: [],
            checkpoints: [],
            shops: [],
            npcs: [],
            levelGates: [],
            decorations: []
        };

        const max = this.config.maxOnScreen;
        const archetype = this.getArchetype(index, biome);
        const rules = this.getRules(archetype, biome, groundSurfaceY);
        const budget = this.getArchetypeBudget(archetype, max);
        const clamp = (value, min, maxVal) => Math.max(min, Math.min(Math.round(value), maxVal));
        const lengthScale = Math.max(0.3, this.config.segmentLength / 700);
        const platformCount = clamp(budget.platforms * rules.platformDensity * lengthScale, 6, 24);
        const movingCount = clamp(budget.moving * rules.movingDensity * lengthScale, 0, 4);
        const breakableCount = clamp(budget.breakables * rules.breakableDensity * lengthScale, 0, 6);
        const springCount = clamp(budget.springs * rules.springDensity * lengthScale, 0, 6);
        const hazardCount = clamp(budget.hazards * rules.hazardDensity * lengthScale, 0, 6);
        const windCount = clamp(budget.wind * rules.windDensity * lengthScale, 1, 10);
        const enemyMultiplier = this.config.enemyMultiplier ?? 1;
        const enemyCount = clamp(budget.enemies * rules.enemyDensity * enemyMultiplier, 2, 120);
        const pickupCount = clamp(budget.pickups * rules.pickupDensity * lengthScale, 1, 6);

        const layout = rules.layout;
        const heights = layout.heights;
        const platformPositions = [];
        const occupied = [];
        const spacing = this.config.segmentLength / (platformCount + 1);
        const minGap = Math.max(layout.minGap, rules.minPlatformGap);

        const zoneCenter = (zone) => {
            const frac = zone === 'entry' ? 0.2 : (zone === 'exit' ? 0.8 : 0.5);
            return segmentStart + this.config.segmentLength * frac;
        };
        const pickZoneBase = (zone, spread, fallbackY) => {
            const center = zoneCenter(zone);
            const candidates = platformPositions.filter(p => Math.abs(p.x - center) < spread * 1.4);
            if (candidates.length) return candidates[Math.floor(rng() * candidates.length)];
            return { x: pickX(center, spread), y: fallbackY };
        };

        const pickX = (center, spread) => {
            for (let tries = 0; tries < 12; tries++) {
                const px = center + (rng() - 0.5) * spread;
                const snapped = this.snapX(px);
                const candidate = snapped;
                if (candidate < segmentStart + 40 || candidate > segmentStart + this.config.segmentLength - 40) continue;
                if (occupied.every(x => Math.abs(x - candidate) > minGap)) {
                    occupied.push(candidate);
                    return candidate;
                }
            }
            const fallback = Math.min(segmentStart + this.config.segmentLength - 40, Math.max(segmentStart + 40, center));
            const snapped = this.snapX(fallback);
            occupied.push(snapped);
            return snapped;
        };

        const isInPit = (x) => pitRanges.some(pit => x >= pit.start && x <= pit.end);
        const pickGroundX = (center, spread) => {
            for (let tries = 0; tries < 12; tries++) {
                const px = center + (rng() - 0.5) * spread;
                const snapped = this.snapX(px);
                const candidate = snapped;
                if (candidate < segmentStart + 40 || candidate > segmentStart + this.config.segmentLength - 40) continue;
                if (isInPit(candidate)) continue;
                if (occupied.every(x => Math.abs(x - candidate) > minGap)) {
                    occupied.push(candidate);
                    return candidate;
                }
            }
            return null;
        };
        const pickGroundXLoose = (center, spread) => {
            for (let tries = 0; tries < 12; tries++) {
                const px = center + (rng() - 0.5) * spread;
                const snapped = this.snapX(px);
                const candidate = snapped;
                if (candidate < segmentStart + 40 || candidate > segmentStart + this.config.segmentLength - 40) continue;
                if (isInPit(candidate)) continue;
                return candidate;
            }
            return null;
        };
        const nudgeOutOfPit = (x) => {
            if (!isInPit(x)) return x;
            const step = tileSize * tileScale;
            for (let i = 1; i <= 6; i++) {
                const left = x - step * i;
                const right = x + step * i;
                if (left > segmentStart + 40 && !isInPit(left)) return left;
                if (right < segmentEnd - 40 && !isInPit(right)) return right;
            }
            return x;
        };

        const jump = this.getJumpConstraints();
        const planner = new PathPlanner({
            heights,
            groundY: groundSurfaceY,
            maxJumpHeight: jump.maxJumpHeight,
            maxJumpDistance: jump.maxJumpDistance,
            maxDrop: jump.maxDrop,
            xStep: jump.xStep
        });
        const pathNodes = planner.buildPath(segmentStart, this.config.segmentLength);
        const pathSet = new Set(pathNodes.map(node => `${Math.round(node.x)}:${node.y}`));
        const pathXs = pathNodes.map(node => node.x);

        pathNodes.forEach((node) => {
            if (node.y >= groundSurfaceY) return;
            const platform = this.pools.getPlatform(node.x, node.y, tilesetKey, platformFrame, tileScale);
            if (!this.resolvePlacement(platform, getBlockers(terrainTiles, objects.platforms), 8, 8, 2)) {
                this.pools.releaseObject(platform, this.pools.platformPool);
                return;
            }
            objects.platforms.push(platform);
            platformPositions.push({ x: platform.x, y: platform.y });
            occupied.push(node.x);
        });

        // Side-path chain: only for treasure variants
        if (archetype === 'treasure') {
            const sideCount = Math.max(3, Math.floor(platformCount / 3));
            const sideStart = segmentStart + this.config.segmentLength * 0.2;
            const sideSpacing = this.config.segmentLength * 0.6 / (sideCount + 1);
            for (let i = 0; i < sideCount; i++) {
                const px = pickX(sideStart + sideSpacing * (i + 1), layout.sideSpread);
                if (this.isNearPath(px, pathXs, 80)) continue;
                const sideY = layout.sideY(i, sideCount);
                if (this.isPlatformClustered(px, sideY, platformPositions)) continue;
                const platform = this.pools.getPlatform(px, sideY, tilesetKey, platformFrame, tileScale);
                if (!this.resolvePlacement(platform, getBlockers(terrainTiles, objects.platforms), 8, 8, 2)) {
                    this.pools.releaseObject(platform, this.pools.platformPool);
                    continue;
                }
                objects.platforms.push(platform);
                platformPositions.push({ x: platform.x, y: platform.y });
            }
        }

        for (let i = 0; i < movingCount; i++) {
            const base = platformPositions[Math.floor(rng() * platformPositions.length)] || { x: pickX(segmentStart + this.config.segmentLength * 0.5, layout.spread * 2), y: groundSurfaceY - 120 };
            if (this.isNearPath(base.x, pathXs, rules.pathClearRadius)) continue;
            const mp = this.pools.getMovingPlatform(base.x, base.y - 40);
            if (!this.resolvePlacement(mp, getBlockers(terrainTiles, objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs), 6, 8, 2)) {
                this.pools.releaseMovingPlatform(mp);
                continue;
            }
            const travel = 120 + rng() * 80;
            const duration = 1200 + rng() * 800;
            mp.setData('tween', this.scene.tweens.add({
                targets: mp,
                x: base.x + (rng() > 0.5 ? travel : -travel),
                y: base.y - 40,
                duration,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.inOut'
            }));
            objects.movingPlatforms.push(mp);
        }

        for (let i = 0; i < breakableCount; i++) {
            const base = platformPositions[Math.floor(rng() * platformPositions.length)] || { x: pickX(segmentStart + this.config.segmentLength * 0.5, layout.spread * 2), y: groundSurfaceY - 120 };
            if (this.isOnPath(base, pathSet)) continue;
            const block = this.pools.getBreakableBlock(base.x, base.y - 60, tilesetKey, breakableFrame, tileScale);
            if (!this.resolvePlacement(block, getBlockers(terrainTiles, objects.platforms, objects.movingPlatforms, objects.breakables), 6, 8, 2)) {
                this.pools.releaseObject(block, this.pools.breakablePool);
                continue;
            }
            objects.breakables.push(block);
        }

        for (let i = 0; i < springCount; i++) {
            const base = platformPositions[Math.floor(rng() * platformPositions.length)] || { x: pickX(segmentStart + this.config.segmentLength * 0.5, layout.spread * 2.5), y: groundSurfaceY - 60 };
            if (this.isNearPath(base.x, pathXs, rules.springAvoidPathRadius)) continue;
            const spring = this.pools.getSpring(base.x + (rng() - 0.5) * 20, base.y - 10);
            if (!this.resolvePlacement(spring, getBlockers(terrainTiles, objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs), 4, 8, 2)) {
                this.pools.releaseObject(spring, this.pools.springPool);
                continue;
            }
            objects.springs.push(spring);
        }

        for (let i = 0; i < hazardCount; i++) {
            const zone = rules.hazardZone;
            const gx = pickGroundXLoose(zoneCenter(zone) + (i - hazardCount * 0.5) * 40, layout.spread * rules.zoneSpread);
            const hy = groundSurfaceY - 32;
            if (gx === null) continue;
            if (this.isNearPath(gx, pathXs, rules.pathClearRadius + 10)) continue;
            if (this.isTooClose(gx, hy, objects.hazards, rules.minDistances.hazard)) continue;
            if (this.isTooClose(gx, hy, objects.enemies, rules.minDistances.hazard)) continue;
            const hazard = this.pools.getSpike(gx, hy);
            if (!this.resolvePlacement(hazard, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.windGusts, objects.enemies, objects.pickups), 4, 8, 2)) {
                this.pools.releaseObject(hazard, this.pools.spikePool);
                continue;
            }
            objects.hazards.push(hazard);
        }

        for (let i = 0; i < windCount; i++) {
            const zone = rules.windZone;
            const wx = pickGroundXLoose(zoneCenter(zone) + (i - windCount * 0.5) * 60, layout.spread * rules.zoneSpread);
            if (wx === null) continue;
            if (this.isNearPath(wx, pathXs, rules.pathClearRadius)) continue;
            if (this.isTooClose(wx, groundSurfaceY - 120, objects.windGusts, rules.minDistances.wind)) continue;
            const scaleY = 2.2 + rng() * 2.6;
            const boost = 650 + rng() * 220;
            const gust = this.pools.getWindGust(wx, groundSurfaceY + 6, scaleY, boost);
            if (!this.resolvePlacement(gust, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.enemies, objects.pickups, objects.windGusts), 4, 8, 2)) {
                this.pools.releaseObject(gust, this.pools.windGustPool);
                continue;
            }
            objects.windGusts.push(gust);
        }

        for (let i = 0; i < enemyCount; i++) {
            const zone = rules.enemyZones[i % rules.enemyZones.length];
            const usePlatform = platformPositions.length > 0 && rng() < rules.enemyOnPlatformChance;
            const base = usePlatform ? pickZoneBase(zone, layout.spread * 2.5, groundSpawnY) : { x: pickGroundXLoose(zoneCenter(zone), layout.spread * 3), y: groundSpawnY };
            if (!base || base.x === null) continue;
            const ex = base.x + (rng() - 0.5) * 20;
            const ey = usePlatform ? base.y - 28 : groundSpawnY;
            if (this.isNearPath(ex, pathXs, rules.pathClearRadius) && rng() > rules.enemyNearPathChance) continue;
            if (this.isTooClose(ex, ey, objects.enemies, rules.minDistances.enemy)) continue;
            if (this.isTooClose(ex, ey, objects.hazards, rules.minDistances.enemy)) continue;
            const enemy = this.pools.spawnEnemy(biome, ex, ey, rng, index);
            if (!enemy) continue;
            if (!this.resolvePlacement(enemy, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 6, 10, 2)) {
                this.pools.releaseEnemy(enemy);
                continue;
            }
            objects.enemies.push(enemy);
        }

        for (let i = 0; i < pickupCount; i++) {
            const zone = rules.pickupZones[i % rules.pickupZones.length];
            const usePlatform = platformPositions.length > 0 && rng() < rules.pickupOnPlatformChance;
            const base = usePlatform ? pickZoneBase(zone, layout.spread * 2.5, groundSurfaceY - 140) : { x: pickGroundXLoose(zoneCenter(zone), layout.spread * 3), y: groundSurfaceY - 140 };
            if (!base || base.x === null) continue;
            const px = base.x + (rng() - 0.5) * 14;
            const py = base.y - 70 - rng() * 16;
            const roll = rng();
            if (this.isTooClose(px, py, objects.pickups, rules.minDistances.pickup)) continue;
            if (this.isTooClose(px, py, objects.enemies, rules.minDistances.pickup + 10)) continue;
            if (this.isTooClose(px, py, objects.hazards, rules.minDistances.pickup + 10)) continue;
            let pickup = null;
            if (roll < 0.6) pickup = this.pools.getCoin(px, py);
            else if (roll < 0.92) pickup = this.pools.getGem(px, py);
            else if (roll < 0.98) pickup = this.pools.getPowerup(px, py, rng() > 0.5 ? 'feather' : 'sword_stone');
            else pickup = this.pools.getPowerup(px, py, rng() > 0.5 ? 'powerup_mushroom' : 'powerup_fire');
            if (!pickup) continue;
            if (!this.resolvePlacement(pickup, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 6, 10, 2)) {
                if (pickup.texture && pickup.texture.key === 'coin') this.pools.releaseObject(pickup, this.pools.coinPool);
                else if (pickup.texture && pickup.texture.key === 'gem_icon') this.pools.releaseObject(pickup, this.pools.gemPool);
                else this.pools.releasePowerup(pickup);
                continue;
            }
            objects.pickups.push(pickup);
        }

        if (rng() > 0.9) {
            const base = platformPositions.length > 0 ? platformPositions[Math.floor(rng() * platformPositions.length)] : { x: pickGroundXLoose(segmentStart + this.config.segmentLength * 0.5, layout.spread * 2.5), y: groundSurfaceY - 140 };
            if (base && base.x !== null) {
            const orb = this.pools.getTimeOrb(base.x + (rng() - 0.5) * 12, base.y - 90);
            if (orb && this.resolvePlacement(orb, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 6, 10, 2)) {
                objects.pickups.push(orb);
            } else if (orb) {
                this.pools.releaseTimeOrb(orb);
            }
            }
        }

        if (rng() > 0.92) {
            const base = platformPositions.length > 0 ? platformPositions[Math.floor(rng() * platformPositions.length)] : { x: pickGroundXLoose(segmentStart + this.config.segmentLength * 0.5, layout.spread * 2.5), y: groundSurfaceY - 140 };
            if (base && base.x !== null) {
            const orb = this.pools.getMagnetOrb(base.x + (rng() - 0.5) * 12, base.y - 90);
            if (orb && this.resolvePlacement(orb, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 6, 10, 2)) {
                objects.pickups.push(orb);
            } else if (orb) {
                this.pools.releaseMagnetOrb(orb);
            }
            }
        }

        if (index % 5 === 0 || archetype === 'rest') {
            const checkpointX = nudgeOutOfPit(segmentStart + this.config.segmentLength - 80);
            const checkpoint = this.pools.getCheckpoint(checkpointX, groundSurfaceY - 50);
            if (checkpoint && this.resolvePlacement(checkpoint, getBlockers(terrainTiles, objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 4, 10, 2)) {
                objects.checkpoints.push(checkpoint);
            } else if (checkpoint) {
                this.pools.releaseObject(checkpoint, this.pools.checkpointPool);
            }
        }

        if (index % 8 === 3 || archetype === 'rest') {
            const shopX = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.5, layout.spread * 1.5);
            if (shopX !== null) {
                const shop = this.pools.getShop(shopX, groundSurfaceY - 50);
            if (shop && this.resolvePlacement(shop, getBlockers(terrainTiles, objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups, objects.checkpoints), 4, 10, 2)) {
                objects.shops.push(shop);
            } else if (shop) {
                this.pools.releaseObject(shop, this.pools.shopPool);
            }
            }
        }

        if (index % 6 === 2 || archetype === 'rest') {
            const base = platformPositions.length > 0 ? platformPositions[Math.floor(rng() * platformPositions.length)] : { x: pickGroundXLoose(segmentStart + this.config.segmentLength * 0.5, layout.spread * 2.5), y: groundSurfaceY - 120 };
            if (!base || base.x === null) {
                // Skip if no safe ground spot this segment.
            } else {
            const npc = this.pools.getNpc(biome, base.x, base.y - 28);
            if (npc && this.resolvePlacement(npc, getBlockers(terrainTiles, objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups, objects.checkpoints, objects.shops), 4, 10, 2)) {
                objects.npcs.push(npc);
            } else if (npc) {
                this.pools.releaseObject(npc, this.pools.npcPool);
            }
            }
        }

        if (index === this.currentIndex) {
            this.spawnGateForSegment(index, {
                objects,
                groundSurfaceY,
                getBlockers,
                nudgeOutOfPit
            });
        }

        if (rng() > 0.35) {
            const color = biome === 'aquatic' ? 0x3498db : (biome === 'fungal' ? 0x9b59b6 : 0x2ecc71);
            const deco = this.scene.add.circle(segmentStart + rng() * this.config.segmentLength, groundSurfaceY + 60 - rng() * 800, 5 + rng() * 10, color, 0.3);
            objects.decorations.push(deco);
        }

        this.ensureRequiredFeatures({
            requiredFeatures,
            objects,
            rng,
            segmentStart,
            segmentEnd,
            groundSurfaceY,
            groundSpawnY,
            tilesetKey,
            tileFrames,
            tileScale,
            platformFrame,
            breakableFrame,
            layout,
            pitRanges,
            pathXs,
            terrainTiles,
            getBlockers,
            pickGroundX,
            pickGroundXLoose,
            nudgeOutOfPit
        });

        this.ensureEnemyPresence({
            objects,
            rng,
            biome,
            segmentStart,
            levelIndex: index,
            groundSpawnY,
            layout,
            terrainTiles,
            getBlockers,
            pickGroundXLoose
        });

        this.segmentObjects.set(index, objects);
        this.activeSegments.add(index);
    }

    isOnPath(base, pathSet) {
        const key = `${Math.round(base.x)}:${base.y}`;
        return pathSet.has(key);
    }

    isNearPath(x, pathXs, radius) {
        return pathXs.some(px => Math.abs(px - x) < radius);
    }

    isPlatformClustered(x, y, platforms) {
        return platforms.some(p => Math.abs(p.x - x) < 70 && Math.abs(p.y - y) < 40);
    }

    isTooClose(x, y, list, minDist) {
        return list.some(obj => Math.hypot(obj.x - x, obj.y - y) < minDist);
    }

    getTerrainTiles(segmentStart, segmentEnd, groundSurfaceY) {
        const tiles = this.scene.platforms.getChildren();
        return tiles.filter(tile => tile.y >= groundSurfaceY - 2 && tile.x >= segmentStart - 80 && tile.x <= segmentEnd + 80);
    }

    getBodyRect(obj) {
        if (obj.body) return new Phaser.Geom.Rectangle(obj.body.x, obj.body.y, obj.body.width, obj.body.height);
        return obj.getBounds();
    }

    isOverlappingAny(obj, list, inset = 2) {
        if (!list || list.length === 0) return false;
        const rect = this.getBodyRect(obj);
        Phaser.Geom.Rectangle.Inflate(rect, -inset, -inset);
        return list.some(other => {
            if (!other || other === obj) return false;
            const otherRect = this.getBodyRect(other);
            Phaser.Geom.Rectangle.Inflate(otherRect, -inset, -inset);
            return Phaser.Geom.Intersects.RectangleToRectangle(rect, otherRect);
        });
    }

    isOverlappingAnyOf(obj, lists, inset = 2) {
        return lists.some(list => this.isOverlappingAny(obj, list, inset));
    }

    resolvePlacement(obj, blockers, step = 8, maxSteps = 8, inset = 2) {
        for (let i = 0; i <= maxSteps; i++) {
            if (!this.isOverlappingAny(obj, blockers, inset)) return true;
            obj.y -= step;
            if (obj.body && obj.body.isStatic) obj.refreshBody();
            else if (obj.body) obj.body.updateFromGameObject();
        }
        return !this.isOverlappingAny(obj, blockers, inset);
    }

    snapX(x) {
        const grid = 32;
        return Math.round(x / grid) * grid;
    }

    getArchetype(index, biome) {
        if (index % 10 === 0) return 'rest';
        if (index % 7 === 0) return 'treasure';
        if (index % 5 === 0) return 'gauntlet';
        if (biome === 'aquatic' && index % 3 === 0) return 'traversal';
        if (index % 3 === 0) return 'vertical';
        return 'traversal';
    }

    getArchetypeBudget(type, max) {
        const base = {
            platforms: 26,
            moving: 3,
            breakables: 4,
            springs: 3,
            hazards: 4,
            wind: 4,
            enemies: 13,
            pickups: 7
        };

        if (type === 'gauntlet') {
            return this.fitBudget({ ...base, hazards: 6, enemies: 18, pickups: 3, moving: 1, springs: 2, wind: 5 }, max);
        }
        if (type === 'treasure') {
            return this.fitBudget({ ...base, hazards: 2, enemies: 6, pickups: 10, breakables: 6, wind: 3 }, max);
        }
        if (type === 'rest') {
            return this.fitBudget({ ...base, hazards: 1, enemies: 4, pickups: 6, moving: 0, springs: 3, wind: 4 }, max);
        }
        if (type === 'vertical') {
            return this.fitBudget({ ...base, platforms: 34, springs: 7, moving: 1, hazards: 2, enemies: 7, pickups: 5, wind: 7 }, max);
        }
        return this.fitBudget(base, max);
    }

    getLayout(type, groundSurfaceY) {
        const skyHeights = this.getSkyHeights(groundSurfaceY);
        if (type === 'vertical') {
            return {
                heights: skyHeights.slice(0, 7),
                sideY: (i) => skyHeights[Math.min(i, skyHeights.length - 1)] ?? groundSurfaceY - 120,
                minGap: 80,
                spread: 50,
                sideSpread: 24
            };
        }
        if (type === 'gauntlet') {
            return {
                heights: skyHeights.slice(0, 4),
                sideY: () => skyHeights[Math.min(1, skyHeights.length - 1)] ?? groundSurfaceY - 120,
                minGap: 70,
                spread: 80,
                sideSpread: 40
            };
        }
        if (type === 'treasure') {
            return {
                heights: skyHeights.slice(0, 5),
                sideY: () => skyHeights[Math.min(2, skyHeights.length - 1)] ?? groundSurfaceY - 200,
                minGap: 60,
                spread: 70,
                sideSpread: 35
            };
        }
        if (type === 'rest') {
            return {
                heights: skyHeights.slice(0, 4),
                sideY: () => skyHeights[Math.min(1, skyHeights.length - 1)] ?? groundSurfaceY - 120,
                minGap: 80,
                spread: 60,
                sideSpread: 30
            };
        }
        // traversal (Mario-style steps)
        return {
            heights: skyHeights.slice(0, 5),
            sideY: (i) => skyHeights[Math.min(i % 5, skyHeights.length - 1)] ?? groundSurfaceY - 160,
            minGap: 60,
            spread: 70,
            sideSpread: 35
        };
    }

    getRules(type, biome, groundSurfaceY) {
        const base = {
            layout: this.getLayout(type, groundSurfaceY),
            platformDensity: 1.3,
            movingDensity: 1.1,
            breakableDensity: 1.4,
            springDensity: 1.4,
            hazardDensity: 1.3,
            windDensity: 1.7,
            enemyDensity: 1.5,
            pickupDensity: 0.5,
            pathClearRadius: 70,
            springAvoidPathRadius: 50,
            enemyNearPathChance: 0.7,
            enemyOnPlatformChance: 0.7,
            pickupOnPlatformChance: 0.5,
            hazardZone: 'mid',
            windZone: 'mid',
            enemyZones: ['entry', 'mid', 'exit'],
            pickupZones: ['exit'],
            zoneSpread: 1.2,
            minPlatformGap: 60,
            minDistances: { enemy: 75, hazard: 55, pickup: 70, wind: 80 }
        };

        let rules = { ...base };

        if (type === 'rest') {
            rules = { ...base,
                hazardDensity: 0.5,
                enemyDensity: 0.6,
                pickupDensity: 0.7,
                windDensity: 1.2,
                pathClearRadius: 100,
                springAvoidPathRadius: 70,
                enemyNearPathChance: 0.4,
                enemyZones: ['mid', 'exit'],
                pickupZones: ['exit'],
                zoneSpread: 1,
                minPlatformGap: 70
            };
        } else if (type === 'treasure') {
            rules = { ...base,
                hazardDensity: 0.7,
                enemyDensity: 0.9,
                pickupDensity: 0.8,
                windDensity: 1.4,
                enemyNearPathChance: 0.6,
                pickupZones: ['exit'],
                zoneSpread: 1.2
            };
        } else if (type === 'gauntlet') {
            rules = { ...base,
                hazardDensity: 1.4,
                enemyDensity: 1.7,
                pickupDensity: 0.3,
                windDensity: 1.8,
                pathClearRadius: 60,
                enemyNearPathChance: 0.9,
                enemyZones: ['entry', 'mid', 'exit'],
                pickupZones: ['exit'],
                zoneSpread: 1.4,
                minPlatformGap: 55
            };
        } else if (type === 'vertical') {
            rules = { ...base,
                movingDensity: 0.8,
                hazardDensity: 0.8,
                enemyDensity: 1.1,
                pickupDensity: 0.4,
                windDensity: 2.1,
                pathClearRadius: 80,
                springAvoidPathRadius: 55,
                enemyOnPlatformChance: 0.85,
                pickupOnPlatformChance: 0.6,
                enemyZones: ['mid', 'exit'],
                pickupZones: ['exit'],
                zoneSpread: 1.1,
                minPlatformGap: 65
            };
        }

        if (biome === 'aquatic') {
            rules.hazardDensity *= 0.6;
            rules.enemyOnPlatformChance = Math.min(rules.enemyOnPlatformChance, 0.5);
            rules.pickupOnPlatformChance = Math.min(rules.pickupOnPlatformChance, 0.75);
        }

        return rules;
    }

    getSkyHeights(groundSurfaceY) {
        const skyHeight = this.config.skyHeight ?? 320;
        const step = Math.max(120, Math.round(skyHeight / 9));
        const heights = [];
        for (let i = 1; i <= 10; i++) {
            const candidate = groundSurfaceY - i * step;
            if (candidate > 60) heights.push(candidate);
        }
        return heights.length ? heights : [groundSurfaceY - 120, groundSurfaceY - 220];
    }

    fitBudget(budget, max) {
        const keys = ['platforms', 'moving', 'breakables', 'springs', 'hazards', 'wind', 'enemies', 'pickups'];
        let total = keys.reduce((sum, key) => sum + budget[key], 0);
        while (total > max && budget.enemies > 4) {
            budget.enemies -= 1;
            total -= 1;
        }
        while (total > max && budget.pickups > 3) {
            budget.pickups -= 1;
            total -= 1;
        }
        while (total > max && budget.hazards > 2) {
            budget.hazards -= 1;
            total -= 1;
        }
        while (total > max && budget.wind > 2) {
            budget.wind -= 1;
            total -= 1;
        }
        return budget;
    }

    getJumpConstraints() {
        // Celeste-style tight routing: explicit constraints.
        return {
            maxJumpHeight: 180,
            maxJumpDistance: 140,
            maxDrop: 210,
            xStep: 60
        };
    }

    despawnSegment(index) {
        const objects = this.segmentObjects.get(index);
        if (!objects) return;
        objects.platforms.forEach(obj => this.pools.releaseObject(obj, this.pools.platformPool));
        objects.movingPlatforms.forEach(obj => this.pools.releaseMovingPlatform(obj));
        objects.breakables.forEach(obj => this.pools.releaseObject(obj, this.pools.breakablePool));
        objects.springs.forEach(obj => this.pools.releaseObject(obj, this.pools.springPool));
        objects.hazards.forEach(obj => this.pools.releaseObject(obj, this.pools.spikePool));
        objects.windGusts.forEach(obj => this.pools.releaseObject(obj, this.pools.windGustPool));
        objects.enemies.forEach(obj => this.pools.releaseEnemy(obj));
        objects.pickups.forEach(obj => {
            if (obj.texture && obj.texture.key === 'coin') this.pools.releaseObject(obj, this.pools.coinPool);
            else if (obj.texture && obj.texture.key === 'gem_icon') this.pools.releaseObject(obj, this.pools.gemPool);
            else if (obj.texture && obj.texture.key === 'time_orb') this.pools.releaseTimeOrb(obj);
            else if (obj.texture && obj.texture.key === 'magnet_orb') this.pools.releaseMagnetOrb(obj);
            else this.pools.releasePowerup(obj);
        });
        objects.checkpoints.forEach(obj => this.pools.releaseObject(obj, this.pools.checkpointPool));
        objects.shops.forEach(obj => this.pools.releaseObject(obj, this.pools.shopPool));
        objects.npcs.forEach(obj => this.pools.releaseObject(obj, this.pools.npcPool));
        objects.levelGates.forEach(obj => this.pools.releaseObject(obj, this.pools.levelGatePool));
        objects.decorations.forEach(obj => obj.destroy());
        this.segmentObjects.delete(index);
        this.activeSegments.delete(index);
    }

    ensureRequiredFeatures(context) {
        const {
            requiredFeatures,
            objects,
            rng,
            segmentStart,
            segmentEnd,
            groundSurfaceY,
            groundSpawnY,
            tilesetKey,
            tileFrames,
            tileScale,
            platformFrame,
            breakableFrame,
            layout,
            pitRanges,
            pathXs,
            terrainTiles,
            getBlockers,
            pickGroundX,
            pickGroundXLoose,
            nudgeOutOfPit
        } = context;

        if (!requiredFeatures.length) return;

        const hasPickupTexture = (key) => objects.pickups.some(obj => obj?.texture?.key === key);
        const isInPit = (x) => pitRanges.some(pit => x >= pit.start && x <= pit.end);

        requiredFeatures.forEach((feature) => {
            if (feature === 'spikes' && objects.hazards.length === 0) {
                const gx = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.55, layout.spread * 1.4);
                if (gx === null || isInPit(gx)) return;
                const hy = groundSurfaceY - 32;
                const spike = this.pools.getSpike(gx, hy);
                if (spike && this.resolvePlacement(spike, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.windGusts, objects.enemies, objects.pickups), 4, 8, 2)) {
                    objects.hazards.push(spike);
                } else if (spike) {
                    this.pools.releaseObject(spike, this.pools.spikePool);
                }
            }

            if (feature === 'springs' && objects.springs.length === 0) {
                const sx = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.45, layout.spread * 1.2);
                if (sx === null || isInPit(sx)) return;
                const spring = this.pools.getSpring(sx, groundSurfaceY - 10);
                if (spring && this.resolvePlacement(spring, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 4, 8, 2)) {
                    objects.springs.push(spring);
                } else if (spring) {
                    this.pools.releaseObject(spring, this.pools.springPool);
                }
            }

            if (feature === 'movingPlatforms' && objects.movingPlatforms.length === 0) {
                const mx = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.5, layout.spread * 1.6);
                if (mx === null) return;
                const baseY = groundSurfaceY - 140;
                const mp = this.pools.getMovingPlatform(mx, baseY);
                if (mp && this.resolvePlacement(mp, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.windGusts), 6, 8, 2)) {
                    const travel = 120 + rng() * 80;
                    const duration = 1200 + rng() * 800;
                    mp.setData('tween', this.scene.tweens.add({
                        targets: mp,
                        x: mx + (rng() > 0.5 ? travel : -travel),
                        y: baseY,
                        duration,
                        yoyo: true,
                        repeat: -1,
                        ease: 'Sine.inOut'
                    }));
                    objects.movingPlatforms.push(mp);
                } else if (mp) {
                    this.pools.releaseMovingPlatform(mp);
                }
            }

            if (feature === 'breakables' && objects.breakables.length === 0) {
                const bx = nudgeOutOfPit(segmentStart + this.config.segmentLength * 0.6);
                const by = groundSurfaceY - 60;
                const block = this.pools.getBreakableBlock(bx, by, tilesetKey, breakableFrame, tileScale);
                if (block && this.resolvePlacement(block, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.windGusts), 6, 8, 2)) {
                    objects.breakables.push(block);
                } else if (block) {
                    this.pools.releaseObject(block, this.pools.breakablePool);
                }
            }

            if (feature === 'timeOrbs' && !hasPickupTexture('time_orb')) {
                const ox = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.35, layout.spread * 1.4);
                if (ox === null) return;
                const orb = this.pools.getTimeOrb(ox, groundSpawnY - 120);
                if (orb && this.resolvePlacement(orb, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 6, 10, 2)) {
                    objects.pickups.push(orb);
                } else if (orb) {
                    this.pools.releaseTimeOrb(orb);
                }
            }

            if (feature === 'magnetOrbs' && !hasPickupTexture('magnet_orb')) {
                const ox = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.7, layout.spread * 1.4);
                if (ox === null) return;
                const orb = this.pools.getMagnetOrb(ox, groundSpawnY - 120);
                if (orb && this.resolvePlacement(orb, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.enemies, objects.pickups), 6, 10, 2)) {
                    objects.pickups.push(orb);
                } else if (orb) {
                    this.pools.releaseMagnetOrb(orb);
                }
            }

            if (feature === 'windGusts' && objects.windGusts.length === 0) {
                const wx = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.5, layout.spread * 1.6);
                if (wx === null) return;
                const gust = this.pools.getWindGust(wx, groundSurfaceY + 6, 3.2, 720);
                if (gust && this.resolvePlacement(gust, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.enemies, objects.pickups, objects.windGusts), 4, 8, 2)) {
                    objects.windGusts.push(gust);
                } else if (gust) {
                    this.pools.releaseObject(gust, this.pools.windGustPool);
                }
            }
        });
    }

    ensureEnemyPresence(context) {
        const {
            objects,
            rng,
            biome,
            segmentStart,
            levelIndex,
            groundSpawnY,
            layout,
            terrainTiles,
            getBlockers,
            pickGroundXLoose
        } = context;

        const hasGroundEnemy = objects.enemies.some(enemy => enemy?.body?.allowGravity);
        if (hasGroundEnemy) return;

        const ex = pickGroundXLoose(segmentStart + this.config.segmentLength * 0.55, layout.spread * 1.2);
        if (ex === null) return;
        const ey = groundSpawnY;
        let enemy = null;
        if (biome === 'aquatic') {
            enemy = this.pools.getFlyingEnemy('jellyfish', ex, ey - 140, levelIndex);
        } else if (biome === 'fungal') {
            enemy = this.pools.getEnemy(rng() > 0.5 ? 'mushroom' : 'frog', ex, ey, levelIndex);
        } else {
            enemy = this.pools.getEnemy(rng() > 0.5 ? 'mushroom' : 'turtle', ex, ey, levelIndex);
        }
        if (!enemy) return;
        if (!this.resolvePlacement(enemy, getBlockers(objects.platforms, objects.movingPlatforms, objects.breakables, objects.springs, objects.hazards, objects.windGusts, objects.pickups), 6, 10, 2)) {
            this.pools.releaseEnemy(enemy);
            return;
        }
        objects.enemies.push(enemy);
    }
}
