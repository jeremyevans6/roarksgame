import {
    loadTileSelections,
    saveTileSelections,
    createTileSelectionStore,
    ensureTileset,
    setTileSelection,
    deleteTileSelection,
    setGroundMapping
} from '../utils/TileSelectionStore';

export default class TileEditorPanel {
    constructor({ parent, tilesets, onExit }) {
        this.parent = parent;
        this.tilesets = tilesets;
        this.onExit = onExit;
        this.data = loadTileSelections();
        this.store = null;
        this.activeTileset = tilesets[0];
        this.selectedName = null;
        this.spritesheetImage = null;
        this.scale = 2;
        this.requiredSelections = [
            'ground_top',
            'ground_fill',
            'platform_top',
            'breakable_block'
        ];
    }

    mount() {
        this.root = document.createElement('div');
        this.root.className = 'tile-editor';
        this.root.innerHTML = `
            <div class="tile-editor__header">
                <div class="tile-editor__title">Tileset Selection Editor</div>
                <button class="tile-editor__exit" type="button">Back to Menu</button>
            </div>
            <div class="tile-editor__content">
                <div class="tile-editor__left">
                    <div class="tile-editor__tabs"></div>
                    <div class="tile-editor__canvas-wrap">
                        <canvas class="tile-editor__canvas"></canvas>
                    </div>
                </div>
                <div class="tile-editor__right">
                    <h3>Selections</h3>
                    <div class="tile-editor__new">
                        <input class="tile-editor__input" placeholder="Selection name (e.g. grass_top)" />
                        <button class="tile-editor__button" type="button">Add</button>
                    </div>
                    <div class="tile-editor__list"></div>
                    <h3>Ground Mapping</h3>
                    <div class="tile-editor__row">
                        <label>Top</label>
                        <select class="tile-editor__select tile-editor__ground-top"></select>
                    </div>
                    <div class="tile-editor__row">
                        <label>Fill</label>
                        <select class="tile-editor__select tile-editor__ground-fill"></select>
                    </div>
                    <div class="tile-editor__status"></div>
                    <div class="tile-editor__hint">
                        Select a name, then click a tile to assign it. Use Ground Mapping to
                        connect names to gameplay.
                    </div>
                </div>
            </div>
        `;
        this.parent.classList.add('is-active');
        this.parent.appendChild(this.root);

        this.tabsEl = this.root.querySelector('.tile-editor__tabs');
        this.canvas = this.root.querySelector('.tile-editor__canvas');
        this.ctx = this.canvas.getContext('2d');
        this.listEl = this.root.querySelector('.tile-editor__list');
        this.inputEl = this.root.querySelector('.tile-editor__input');
        this.addBtn = this.root.querySelector('.tile-editor__button');
        this.exitBtn = this.root.querySelector('.tile-editor__exit');
        this.statusEl = this.root.querySelector('.tile-editor__status');
        this.groundTopEl = this.root.querySelector('.tile-editor__ground-top');
        this.groundFillEl = this.root.querySelector('.tile-editor__ground-fill');

        this.handleCanvasClick = this.handleCanvasClick.bind(this);
        this.canvas.addEventListener('click', this.handleCanvasClick);
        this.addBtn.addEventListener('click', () => this.addSelection());
        this.exitBtn.addEventListener('click', () => this.handleExit());
        this.groundTopEl.addEventListener('change', () => this.updateGroundMapping());
        this.groundFillEl.addEventListener('change', () => this.updateGroundMapping());

        this.renderTabs();
        this.loadTilesetImage();
        this.ensureRequiredSelections();
        this.renderSelections();
        this.renderGroundMapping();
        this.initializeStore();
    }

    destroy() {
        if (this.canvas) this.canvas.removeEventListener('click', this.handleCanvasClick);
        if (this.root && this.parent.contains(this.root)) {
            this.parent.removeChild(this.root);
        }
        this.parent.classList.remove('is-active');
        if (this.store && this.store.close) this.store.close();
    }

    handleExit() {
        if (this.onExit) this.onExit();
    }

    async initializeStore() {
        this.setStatus('Loading SQLite...');
        try {
            this.store = await createTileSelectionStore();
            this.data = this.store.data;
            this.ensureRequiredSelections();
            this.renderSelections();
            this.renderGroundMapping();
            this.drawTileset();
            this.setStatus('SQLite ready.');
        } catch (err) {
            this.data = loadTileSelections();
            this.ensureRequiredSelections();
            this.setStatus('SQLite unavailable, using local cache.');
        }
    }

    renderTabs() {
        this.tabsEl.innerHTML = '';
        this.tilesets.forEach((tileset) => {
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'tile-editor__tab' + (tileset.key === this.activeTileset.key ? ' is-active' : '');
            button.textContent = tileset.label;
            button.addEventListener('click', () => {
                this.activeTileset = tileset;
                this.selectedName = null;
                this.renderTabs();
                this.loadTilesetImage();
                this.ensureRequiredSelections();
                this.renderSelections();
                this.renderGroundMapping();
            });
            this.tabsEl.appendChild(button);
        });
    }

    loadTilesetImage() {
        const image = new Image();
        image.src = this.activeTileset.src;
        image.onload = () => {
            this.spritesheetImage = image;
            this.scale = this.activeTileset.scale ?? 2;
            this.canvas.width = image.width * this.scale;
            this.canvas.height = image.height * this.scale;
            this.drawTileset();
            this.renderSelections();
        };
    }

    drawTileset() {
        if (!this.spritesheetImage) return;
        const { tileSize } = this.activeTileset;
        const image = this.spritesheetImage;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.drawImage(image, 0, 0, image.width * this.scale, image.height * this.scale);

        this.ctx.strokeStyle = 'rgba(255,255,255,0.08)';
        this.ctx.lineWidth = 1;
        const step = tileSize * this.scale;
        for (let x = 0; x <= this.canvas.width; x += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        for (let y = 0; y <= this.canvas.height; y += step) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }

        if (this.selectedName) {
            const selection = this.getSelections()[this.selectedName];
            if (selection && typeof selection.frame === 'number') {
                this.highlightFrame(selection.frame, 'rgba(241, 196, 15, 0.75)');
            }
        }
    }

    highlightFrame(frameIndex, color) {
        const { tileSize } = this.activeTileset;
        const framesAcross = Math.floor(this.spritesheetImage.width / tileSize);
        const fx = frameIndex % framesAcross;
        const fy = Math.floor(frameIndex / framesAcross);
        const step = tileSize * this.scale;
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = 2;
        this.ctx.strokeRect(fx * step + 1, fy * step + 1, step - 2, step - 2);
    }

    handleCanvasClick(event) {
        if (!this.selectedName) {
            this.setStatus('Select a name before assigning a tile.');
            return;
        }
        if (!this.spritesheetImage) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const { tileSize } = this.activeTileset;
        const step = tileSize * this.scale;
        const tileX = Math.floor(x / step);
        const tileY = Math.floor(y / step);
        const framesAcross = Math.floor(this.spritesheetImage.width / tileSize);
        const framesDown = Math.floor(this.spritesheetImage.height / tileSize);
        if (tileX < 0 || tileY < 0 || tileX >= framesAcross || tileY >= framesDown) {
            return;
        }
        const frameIndex = tileY * framesAcross + tileX;

        setTileSelection(this.data, this.activeTileset.key, this.selectedName, frameIndex);
        this.persistSelections();
        this.setStatus(`Assigned ${this.selectedName} → frame ${frameIndex}.`);
        this.drawTileset();
        this.renderSelections();
        this.renderGroundMapping();
    }

    addSelection() {
        const name = this.inputEl.value.trim();
        if (!name) return;
        const selections = this.getSelections();
        if (selections[name]) {
            this.setStatus('That name already exists.');
            return;
        }
        setTileSelection(this.data, this.activeTileset.key, name, null);
        this.persistSelections();
        this.selectedName = name;
        this.inputEl.value = '';
        this.renderSelections();
        this.renderGroundMapping();
        this.setStatus(`Created ${name}. Now click a tile.`);
    }

    getSelections() {
        const tilesetData = ensureTileset(this.data, this.activeTileset.key);
        return tilesetData.selections;
    }

    renderSelections() {
        const selections = this.getSelections();
        const entries = Object.entries(selections).sort(([a], [b]) => {
            const aRequired = this.requiredSelections.includes(a);
            const bRequired = this.requiredSelections.includes(b);
            if (aRequired && !bRequired) return -1;
            if (!aRequired && bRequired) return 1;
            return a.localeCompare(b);
        });
        this.listEl.innerHTML = '';
        if (!entries.length) {
            const empty = document.createElement('div');
            empty.className = 'tile-editor__hint';
            empty.textContent = 'No selections yet. Add a name to begin.';
            this.listEl.appendChild(empty);
            return;
        }

        entries.forEach(([name, selection]) => {
            const item = document.createElement('div');
            item.className = 'tile-editor__item' + (name === this.selectedName ? ' is-selected' : '');
            const isRequired = this.requiredSelections.includes(name);
            const preview = document.createElement('canvas');
            preview.className = 'tile-editor__preview';
            preview.width = 32;
            preview.height = 32;
            this.drawPreview(preview, selection.frame);

            const label = document.createElement('div');
            label.textContent = name;
            const meta = document.createElement('div');
            meta.className = 'tile-editor__meta';
            if (typeof selection.frame === 'number') {
                meta.textContent = `frame ${selection.frame}${isRequired ? ' • required' : ''}`;
            } else {
                meta.textContent = `unassigned${isRequired ? ' • required' : ''}`;
            }

            item.appendChild(preview);
            const textWrap = document.createElement('div');
            textWrap.appendChild(label);
            textWrap.appendChild(meta);
            item.appendChild(textWrap);
            if (!isRequired) {
                const deleteBtn = document.createElement('button');
                deleteBtn.type = 'button';
                deleteBtn.className = 'tile-editor__button';
                deleteBtn.textContent = 'Remove';
                deleteBtn.addEventListener('click', (event) => {
                    event.stopPropagation();
                    deleteTileSelection(this.data, this.activeTileset.key, name);
                    this.persistSelections();
                    if (this.selectedName === name) this.selectedName = null;
                    this.renderSelections();
                    this.renderGroundMapping();
                    this.drawTileset();
                });
                item.appendChild(deleteBtn);
            }
            item.addEventListener('click', () => {
                this.selectedName = name;
                this.renderSelections();
                this.drawTileset();
            });
            this.listEl.appendChild(item);
        });
    }

    drawPreview(canvas, frameIndex) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.imageSmoothingEnabled = false;
        if (!this.spritesheetImage || typeof frameIndex !== 'number') return;
        const { tileSize } = this.activeTileset;
        const framesAcross = Math.floor(this.spritesheetImage.width / tileSize);
        const fx = frameIndex % framesAcross;
        const fy = Math.floor(frameIndex / framesAcross);
        ctx.drawImage(
            this.spritesheetImage,
            fx * tileSize,
            fy * tileSize,
            tileSize,
            tileSize,
            0,
            0,
            canvas.width,
            canvas.height
        );
    }

    renderGroundMapping() {
        const tilesetData = ensureTileset(this.data, this.activeTileset.key);
        const selections = Object.keys(tilesetData.selections);
        const options = ['(none)', ...selections];
        this.populateSelect(this.groundTopEl, options, tilesetData.ground.top);
        this.populateSelect(this.groundFillEl, options, tilesetData.ground.fill);
    }

    ensureRequiredSelections() {
        const tilesetData = ensureTileset(this.data, this.activeTileset.key);
        let changed = false;
        this.requiredSelections.forEach((name) => {
            if (!tilesetData.selections[name]) {
                tilesetData.selections[name] = { frame: null };
                changed = true;
            }
        });
        if (!tilesetData.ground.top && tilesetData.selections.ground_top) {
            tilesetData.ground.top = 'ground_top';
            changed = true;
        }
        if (!tilesetData.ground.fill && tilesetData.selections.ground_fill) {
            tilesetData.ground.fill = 'ground_fill';
            changed = true;
        }
        if (changed) this.persistSelections();
    }

    populateSelect(select, options, selectedValue) {
        select.innerHTML = '';
        options.forEach((option) => {
            const opt = document.createElement('option');
            opt.value = option === '(none)' ? '' : option;
            opt.textContent = option;
            if (opt.value === (selectedValue || '')) opt.selected = true;
            select.appendChild(opt);
        });
    }

    updateGroundMapping() {
        setGroundMapping(
            this.data,
            this.activeTileset.key,
            this.groundTopEl.value,
            this.groundFillEl.value
        );
        this.persistSelections();
        this.setStatus('Ground mapping updated.');
    }

    persistSelections() {
        if (!this.store) {
            saveTileSelections(this.data);
            return;
        }
        this.store.save(this.data).catch(() => {
            saveTileSelections(this.data);
            this.setStatus('SQLite save failed, using local cache.');
        });
    }

    setStatus(message) {
        this.statusEl.textContent = message;
        clearTimeout(this.statusTimer);
        this.statusTimer = setTimeout(() => {
            this.statusEl.textContent = '';
        }, 2200);
    }
}
