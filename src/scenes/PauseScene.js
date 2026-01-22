import Phaser from 'phaser';

export default class PauseScene extends Phaser.Scene {
    constructor() {
        super('PauseScene');
    }

    create() {
        const { width, height } = this.scale;

        // Overlay
        this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

        // Pause Text
        this.add.text(width / 2, height / 2, "PAUSED", {
            fontSize: '64px',
            fontFamily: 'monospace',
            fill: '#fff'
        }).setOrigin(0.5);

        this.add.text(width / 2, height / 2 + 60, "PRESS ESC TO RESUME", {
            fontSize: '24px',
            fontFamily: 'monospace',
            fill: '#bdc3c7'
        }).setOrigin(0.5);

        // Input
        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.resume('GameScene');
            this.scene.stop();
        });
    }
}
