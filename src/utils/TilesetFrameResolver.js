import { loadTileSelections } from './TileSelectionStore';

export default class TilesetFrameResolver {
    constructor(scene) {
        this.scene = scene;
        this.cache = {};
    }

    getFrames(tilesetKey, tileSize) {
        if (this.scene && this.scene.tilesetFrameOverrides && this.scene.tilesetFrameOverrides[tilesetKey]) {
            return this.scene.tilesetFrameOverrides[tilesetKey];
        }

        const stored = loadTileSelections();
        const tilesetData = stored.tilesets ? stored.tilesets[tilesetKey] : null;
        const storedTop = tilesetData && tilesetData.ground ? tilesetData.selections?.[tilesetData.ground.top]?.frame : null;
        const storedFill = tilesetData && tilesetData.ground ? tilesetData.selections?.[tilesetData.ground.fill]?.frame : null;
        const hasStoredTop = Number.isInteger(storedTop);
        const hasStoredFill = Number.isInteger(storedFill);

        if (hasStoredTop && hasStoredFill) {
            return { top: storedTop, fill: storedFill };
        }

        if (this.cache[tilesetKey]) {
            const cached = this.cache[tilesetKey];
            return {
                top: hasStoredTop ? storedTop : cached.top,
                fill: hasStoredFill ? storedFill : cached.fill
            };
        }

        const texture = this.scene.textures.get(tilesetKey);
        const source = texture && texture.getSourceImage ? texture.getSourceImage() : null;
        if (!source || !source.width || !source.height || typeof document === 'undefined') {
            const fallback = {
                top: hasStoredTop ? storedTop : 0,
                fill: hasStoredFill ? storedFill : 1
            };
            this.cache[tilesetKey] = fallback;
            return fallback;
        }

        const width = source.width;
        const height = source.height;
        const framesAcross = Math.floor(width / tileSize);
        const framesDown = Math.floor(height / tileSize);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(source, 0, 0);
        const data = ctx.getImageData(0, 0, width, height).data;

        let bestTop = { index: 0, greenScore: -1, opaque: -1 };
        let bestFill = { index: 0, greenScore: Infinity, opaque: -1 };
        let bestOpaque = { index: 0, opaque: -1 };

        for (let fy = 0; fy < framesDown; fy++) {
            for (let fx = 0; fx < framesAcross; fx++) {
                const baseX = fx * tileSize;
                const baseY = fy * tileSize;
                let opaque = 0;
                let greenScore = 0;

                for (let y = 0; y < tileSize; y++) {
                    for (let x = 0; x < tileSize; x++) {
                        const idx = ((baseY + y) * width + (baseX + x)) * 4;
                        const a = data[idx + 3];
                        if (a > 10) {
                            opaque++;
                            if (y < 4) {
                                const r = data[idx];
                                const g = data[idx + 1];
                                const b = data[idx + 2];
                                const dominance = g - Math.max(r, b);
                                if (dominance > 0) greenScore += dominance;
                            }
                        }
                    }
                }

                const index = fy * framesAcross + fx;
                if (greenScore > bestTop.greenScore || (greenScore === bestTop.greenScore && opaque > bestTop.opaque)) {
                    bestTop = { index, greenScore, opaque };
                }

                if (opaque > bestOpaque.opaque) bestOpaque = { index, opaque };
            }
        }

        const fillThreshold = Math.max(15, bestTop.greenScore * 0.35);
        for (let fy = 0; fy < framesDown; fy++) {
            for (let fx = 0; fx < framesAcross; fx++) {
                const baseX = fx * tileSize;
                const baseY = fy * tileSize;
                let opaque = 0;
                let greenScore = 0;

                for (let y = 0; y < tileSize; y++) {
                    for (let x = 0; x < tileSize; x++) {
                        const idx = ((baseY + y) * width + (baseX + x)) * 4;
                        const a = data[idx + 3];
                        if (a > 10) {
                            opaque++;
                            if (y < 4) {
                                const r = data[idx];
                                const g = data[idx + 1];
                                const b = data[idx + 2];
                                const dominance = g - Math.max(r, b);
                                if (dominance > 0) greenScore += dominance;
                            }
                        }
                    }
                }

                const index = fy * framesAcross + fx;
                const isFillCandidate = greenScore <= fillThreshold;
                if (isFillCandidate && opaque > bestFill.opaque) {
                    bestFill = { index, greenScore, opaque };
                }
            }
        }

        if (bestFill.opaque < 0) bestFill = bestOpaque;
        if (bestFill.index === bestTop.index) {
            bestFill = bestOpaque;
        }

        const resolved = {
            top: hasStoredTop ? storedTop : bestTop.index,
            fill: hasStoredFill ? storedFill : (bestFill.index >= 0 ? bestFill.index : bestTop.index)
        };
        this.cache[tilesetKey] = resolved;
        return resolved;
    }

    getNamedFrame(tilesetKey, selectionName) {
        const stored = loadTileSelections();
        const tilesetData = stored.tilesets ? stored.tilesets[tilesetKey] : null;
        const frame = tilesetData?.selections?.[selectionName]?.frame;
        return Number.isInteger(frame) ? frame : null;
    }
}
