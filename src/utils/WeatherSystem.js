export default class WeatherSystem {
    constructor(scene, config = {}) {
        this.scene = scene;
        this.nextCheckAt = 0;
        this.activeType = null;
        this.activeUntil = 0;
        this.rain = scene.add.particles(0, 0, 'rain_drop', {
            speedY: { min: 500, max: 800 },
            speedX: { min: -50, max: 50 },
            lifespan: 1200,
            scale: { start: 1, end: 1 },
            alpha: { start: 0.7, end: 0.1 },
            quantity: 4,
            emitting: false
        });
        this.snow = scene.add.particles(0, 0, 'snow_flake', {
            speedY: { min: 80, max: 140 },
            speedX: { min: -30, max: 30 },
            lifespan: 4000,
            scale: { start: 1, end: 1 },
            alpha: { start: 0.8, end: 0.2 },
            quantity: 3,
            emitting: false
        });
        this.rain.setScrollFactor(0);
        this.snow.setScrollFactor(0);
        this.settings = {
            meadows: { type: 'rain', chance: 0.3, duration: [5000, 9000] },
            fungal: { type: 'snow', chance: 0.25, duration: [6000, 11000] },
            aquatic: { type: 'rain', chance: 0.2, duration: [4000, 8000] }
        };
        this.override = config.override || null;
    }

    update(time, biome) {
        if (this.activeType && time > this.activeUntil) {
            this.stop();
        }

        if (time < this.nextCheckAt || this.activeType) {
            this.syncToCamera();
            return;
        }

        const setting = this.override || this.settings[biome];
        if (!setting) return;
        if (Math.random() < setting.chance) {
            const duration = setting.duration[0] + Math.random() * (setting.duration[1] - setting.duration[0]);
            this.start(setting.type, time + duration);
        }

        this.nextCheckAt = time + 3000;
    }

    start(type, until) {
        this.stop();
        this.activeType = type;
        this.activeUntil = until;
        if (type === 'rain') this.rain.start();
        if (type === 'snow') this.snow.start();
        this.syncToCamera();
    }

    stop() {
        this.activeType = null;
        this.activeUntil = 0;
        this.rain.stop();
        this.snow.stop();
    }

    syncToCamera() {
        const cam = this.scene.cameras.main;
        const x = cam.scrollX + cam.width / 2;
        const y = cam.scrollY - 20;
        this.rain.setPosition(x, y);
        this.snow.setPosition(x, y);
    }
}
