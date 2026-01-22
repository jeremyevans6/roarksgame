import Phaser from 'phaser';

export default class MenuScene extends Phaser.Scene {
    constructor() {
        super('MenuScene');
    }

    preload() {
        // Load background elements if any, or use graphics
    }

    create() {
        const { width, height } = this.scale;

        // Background
        this.add.rectangle(0, 0, width, height, 0x2c3e50).setOrigin(0);

        // Title
        const title = this.add.text(width / 2, height * 0.3, "ROARK'S GAME", {
            fontSize: '64px',
            fontFamily: 'monospace',
            fill: '#f1c40f',
            stroke: '#000',
            strokeThickness: 8
        }).setOrigin(0.5);

        // Start Text
        const startBtn = this.add.text(width / 2, height * 0.6, "PRESS SPACE TO START", {
            fontSize: '32px',
            fontFamily: 'monospace',
            fill: '#fff'
        }).setOrigin(0.5);

        // Animation for start button
        this.tweens.add({
            targets: startBtn,
            alpha: 0,
            duration: 800,
            yoyo: true,
            repeat: -1
        });

        // Instructions
        const controls = [
            "WASD / ARROWS: MOVE & JUMP",
            "SPACE: DOUBLE JUMP",
            "SHIFT: DASH",
            "Z: ATTACK (COTTON CANDY)",
            "X: FIREBALL (WHEN POWERED UP)"
        ];

        controls.forEach((text, i) => {
            this.add.text(width / 2, height * 0.75 + (i * 25), text, {
                fontSize: '18px',
                fontFamily: 'monospace',
                fill: '#bdc3c7'
            }).setOrigin(0.5);
        });

        // Input
        this.input.keyboard.once('keydown-SPACE', () => {
            this.scene.start('GameScene');
        });
    }
}
