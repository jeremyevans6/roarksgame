import { getBiomeForLevel, getPitRangesForLevel } from './LevelConfig';
import TilesetFrameResolver from './TilesetFrameResolver';
import ObjectPools from './ObjectPools';
import SegmentManager from './SegmentManager';

export default class WorldGenerator {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.frameResolver = new TilesetFrameResolver(scene);
        this.pools = new ObjectPools(scene);
        this.segmentManager = new SegmentManager(scene, config, this.pools, this.frameResolver);
        this.totalWidth = config.totalWidth;
    }

    generate() {
        const { scene } = this;
        const tileSize = 32;
        const tileScale = 2;
        const tileWidth = tileSize * tileScale;
        const groundY = this.config.groundY ?? 500;
        const levelHeight = this.config.levelHeight ?? 600;
        const placedLandmarks = new Set();

        for (let levelIndex = 0; levelIndex < this.config.levelCount; levelIndex++) {
            const segmentStart = levelIndex * this.config.levelStride;
            const segmentEnd = segmentStart + this.config.segmentLength;
            const biome = getBiomeForLevel(levelIndex, this.config);
            const tilesetKey = `tileset_${biome}`;
            const tileFrames = this.frameResolver.getFrames(tilesetKey, tileSize);
            const platformFrame = this.frameResolver.getNamedFrame(tilesetKey, 'ground_top') ?? tileFrames.top;
            const fillFrame = this.frameResolver.getNamedFrame(tilesetKey, 'ground_fill') ?? tileFrames.fill;
            const pitRanges = getPitRangesForLevel(levelIndex, this.config, tileWidth);

            for (let x = segmentStart; x < segmentEnd; x += tileWidth) {
                if (this.isInPit(x + tileWidth / 2, pitRanges)) continue;
                const tileCenterX = x + tileWidth / 2;

                const g1 = scene.platforms.create(tileCenterX, groundY, tilesetKey, platformFrame);
                g1.setScale(tileScale).refreshBody();

                const remaining = Math.max(1, Math.ceil((levelHeight - groundY) / tileWidth) + 1);
                for (let i = 0; i < remaining; i++) {
                    const fillY = groundY + tileWidth / 2 + i * tileWidth;
                    const fill = scene.platforms.create(tileCenterX, fillY, tilesetKey, fillFrame);
                    fill.setScale(tileScale).refreshBody();
                }
            }

            if (!placedLandmarks.has(biome)) {
                placedLandmarks.add(biome);
                const chunkKey = biome === 'fungal' ? 'fungal_chunk' : (biome === 'aquatic' ? 'aquatic_chunk' : 'meadows_chunk');
                scene.add.image(segmentStart + 400, 400, chunkKey).setDepth(-1).setScale(2).setScrollFactor(0.8);
            }
        }

        // Level gates are handled per segment by SegmentManager.
    }

    isInPit(x, pits) {
        return pits.some(pit => x >= pit.start && x <= pit.end);
    }

    update(playerX) {
        this.segmentManager.update(playerX);
    }

    releaseTimeOrb(orb) {
        this.pools.releaseTimeOrb(orb);
    }

    releaseMagnetOrb(orb) {
        this.pools.releaseMagnetOrb(orb);
    }
}
