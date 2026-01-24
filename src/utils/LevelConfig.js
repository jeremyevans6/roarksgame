export function buildLevelConfig(overrides = {}) {
    const levelCount = overrides.levelCount ?? 40;
    const segmentLength = overrides.segmentLength ?? 700;
    const gapLength = overrides.gapLength ?? 100;
    const levelStride = segmentLength + gapLength;
    const totalWidth = levelCount * levelStride;
    const maxOnScreen = overrides.maxOnScreen ?? 50;
    const levelHeight = overrides.levelHeight ?? 600;
    const groundY = overrides.groundY ?? 500;
    const skyHeight = overrides.skyHeight ?? 320;
    const enemyMultiplier = overrides.enemyMultiplier ?? 1;
    const biomeThresholds = overrides.biomeThresholds ?? {
        fungal: Math.floor(totalWidth / 3),
        aquatic: Math.floor(totalWidth * 2 / 3)
    };

    return {
        levelCount,
        segmentLength,
        gapLength,
        levelStride,
        totalWidth,
        maxOnScreen,
        levelHeight,
        groundY,
        skyHeight,
        enemyMultiplier,
        biomeThresholds
    };
}

export function getBiome(x, thresholds) {
    return x >= thresholds.aquatic ? 'aquatic' : (x >= thresholds.fungal ? 'fungal' : 'meadows');
}
