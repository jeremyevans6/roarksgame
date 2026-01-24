import Phaser from 'phaser';
console.error("COLLECTIBLE_LOADED");

export default class Collectible extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, key, type) {
        super(scene, x, y, key);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setAllowGravity(false);
        this.type = type; // 'coin', 'gem', 'powerup'
        
        if (this.type === 'powerup') {
            this.setScale(2);
            this.body.setAllowGravity(true);
        } else {
            this.setScale(1);
        }
    }
}

export class Powerup extends Collectible {
    constructor(scene, x, y, key) {
        super(scene, x, y, key, 'powerup');
    }
}
