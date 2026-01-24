import Phaser from 'phaser';
import TileEditorPanel from '../ui/TileEditorPanel';

export default class TileEditorScene extends Phaser.Scene {
    constructor() {
        super('TileEditorScene');
    }

    preload() {
        this.load.image('tileset_meadows_image', '/assets/tileset_meadows.png');
        this.load.image('tileset_fungal_image', '/assets/tileset_fungal.png');
        this.load.image('tileset_aquatic_image', '/assets/tileset_aquatic.png');
    }

    create() {
        const { width, height } = this.scale;
        this.add.rectangle(0, 0, width, height, 0x0c0c0e).setOrigin(0);
        this.add.text(width / 2, height / 2, 'Loading editor...', {
            fontSize: '18px',
            fontFamily: 'monospace',
            fill: '#888'
        }).setOrigin(0.5);

        const root = document.getElementById('editor-root');
        this.editorPanel = new TileEditorPanel({
            parent: root,
            tilesets: [
                { key: 'tileset_meadows', label: 'Meadows', src: '/assets/tileset_meadows.png', tileSize: 32, scale: 2 },
                { key: 'tileset_fungal', label: 'Fungal', src: '/assets/tileset_fungal.png', tileSize: 32, scale: 2 },
                { key: 'tileset_aquatic', label: 'Aquatic', src: '/assets/tileset_aquatic.png', tileSize: 32, scale: 2 }
            ],
            onExit: () => this.scene.start('MenuScene')
        });
        this.editorPanel.mount();
        this.events.once('shutdown', () => this.shutdown());
        this.events.once('destroy', () => this.shutdown());

        this.input.keyboard.once('keydown-ESC', () => {
            this.scene.start('MenuScene');
        });
    }

    shutdown() {
        if (this.editorPanel) {
            this.editorPanel.destroy();
            this.editorPanel = null;
        }
    }
}
