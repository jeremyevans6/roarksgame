import Phaser from 'phaser';
import MenuScene from './scenes/MenuScene';
import GameScene from './scenes/GameScene';
import PauseScene from './scenes/PauseScene';
import TileEditorScene from './scenes/TileEditorScene';
import { bootstrapTileSelections } from './utils/TileSelectionStore';

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH
    },
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1200 },
            debug: false
        }
    },
    scene: [MenuScene, GameScene, PauseScene, TileEditorScene]
};

const startGame = () => {
    new Phaser.Game(config);
};

bootstrapTileSelections()
    .catch(() => null)
    .finally(() => startGame());
