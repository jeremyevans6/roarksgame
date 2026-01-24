import { getBiome } from './LevelConfig';
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
        let placedFungalLandmark = false;
        let placedAquaticLandmark = false;

        for (let levelIndex = 0; levelIndex < this.config.levelCount; levelIndex++) {
            const segmentStart = levelIndex * this.config.levelStride;
            const segmentEnd = segmentStart + this.config.segmentLength;
            const biome = getBiome(segmentStart, this.config.biomeThresholds);
            const tilesetKey = `tileset_${biome}`;
            const tileFrames = this.frameResolver.getFrames(tilesetKey, tileSize);

            for (let x = segmentStart; x < segmentEnd; x += tileWidth) {
                const tileCenterX = x + tileWidth / 2;

                const g1 = scene.platforms.create(tileCenterX, groundY, tilesetKey, tileFrames.top);
                g1.setScale(tileScale).refreshBody();

                const remaining = Math.max(1, Math.ceil((levelHeight - groundY) / tileWidth) + 1);
                for (let i = 0; i < remaining; i++) {
                    const fillY = groundY + tileWidth / 2 + i * tileWidth;
                    const fill = scene.platforms.create(tileCenterX, fillY, tilesetKey, tileFrames.fill);
                    fill.setScale(tileScale).refreshBody();
                }
            }

            if (segmentStart === 0) {
                scene.add.image(400, 400, 'meadows_chunk').setDepth(-1).setScale(2).setScrollFactor(0.8);
            }
            if (!placedFungalLandmark && biome === 'fungal') {
                placedFungalLandmark = true;
                scene.add.image(segmentStart + 400, 400, 'fungal_chunk').setDepth(-1).setScale(2).setScrollFactor(0.8);
            }
            if (!placedAquaticLandmark && biome === 'aquatic') {
                placedAquaticLandmark = true;
                scene.add.image(segmentStart + 400, 400, 'aquatic_chunk').setDepth(-1).setScale(2).setScrollFactor(0.8);
            }
        }

        // Level gates are handled per segment by SegmentManager.
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
