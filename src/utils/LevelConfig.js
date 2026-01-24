import { createRng } from './Random';

const BIOMES = ['meadows', 'fungal', 'aquatic'];
const REQUIRED_FEATURES = [
    'spikes',
    'springs',
    'movingPlatforms',
    'breakables',
    'timeOrbs',
    'magnetOrbs',
    'windGusts'
];

const buildBiomePlan = (levelCount, rng) => {
    const plan = [];
    for (let i = 0; i < levelCount; i++) {
        const pick = BIOMES[Math.floor(rng() * BIOMES.length)];
        plan.push(pick);
    }
    return plan;
};

const buildRequiredFeaturePlan = (levelCount, rng) => {
    const plan = {};
    for (let i = 0; i < levelCount; i++) {
        plan[i] = [...REQUIRED_FEATURES];
    }
    return plan;
};

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
    const runSeed = overrides.runSeed ?? Math.floor(Math.random() * 1_000_000_000);
    const rng = createRng(runSeed);
    const biomeByLevel = overrides.biomeByLevel ?? buildBiomePlan(levelCount, rng);
    const requiredFeaturesByLevel = overrides.requiredFeaturesByLevel ?? buildRequiredFeaturePlan(levelCount, rng);
    const minPitsPerLevel = overrides.minPitsPerLevel ?? 1;
    const maxPitsPerLevel = overrides.maxPitsPerLevel ?? 2;

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
        runSeed,
        biomeByLevel,
        requiredFeaturesByLevel,
        minPitsPerLevel,
        maxPitsPerLevel
    };
}

export function getLevelIndexForX(x, config) {
    const index = Math.floor(x / config.levelStride);
    return Math.max(0, Math.min(config.levelCount - 1, index));
}

export function getBiomeForLevel(levelIndex, config) {
    return config.biomeByLevel?.[levelIndex] || 'meadows';
}

export function getPitRangesForLevel(levelIndex, config, tileWidth) {
    const rng = createRng(config.runSeed + (levelIndex + 1) * 4241);
    const segmentStart = levelIndex * config.levelStride;
    const segmentEnd = segmentStart + config.segmentLength;
    const safeEdge = tileWidth * 3;
    const minWidth = tileWidth * 2;
    const maxWidth = tileWidth * 5;
    const maxPitCount = Math.max(0, config.maxPitsPerLevel ?? 2);
    const minPitCount = Math.max(0, Math.min(config.minPitsPerLevel ?? 1, maxPitCount));
    const availableWidth = segmentEnd - segmentStart - safeEdge * 2;
    if (availableWidth <= minWidth) return [];

    const pits = [];
    const extra = rng() > 0.7 ? 1 : 0;
    const targetCount = Math.min(maxPitCount, minPitCount + extra);
    for (let i = 0; i < targetCount; i++) {
        const width = minWidth + rng() * (maxWidth - minWidth);
        const start = segmentStart + safeEdge + rng() * Math.max(1, availableWidth - width);
        pits.push({ start, end: start + width });
    }
    return pits;
}
