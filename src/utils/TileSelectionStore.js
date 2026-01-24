import initSqlJs from 'sql.js';
import { createStore, get, set } from 'idb-keyval';

const STORAGE_KEY = 'roark_tileset_selections_v1';
const IDB_DB_NAME = 'roark_tileset_sqlite';
const IDB_STORE_NAME = 'tile-selection-db';
const IDB_KEY = 'tileset_sqlite_blob';

const defaultData = () => ({
    version: 1,
    tilesets: {}
});

const normalizeTileset = (data, tilesetKey) => {
    if (!data.tilesets[tilesetKey]) {
        data.tilesets[tilesetKey] = { selections: {}, ground: { top: null, fill: null } };
    }
    if (!data.tilesets[tilesetKey].selections) data.tilesets[tilesetKey].selections = {};
    if (!data.tilesets[tilesetKey].ground) data.tilesets[tilesetKey].ground = { top: null, fill: null };
};

const hasMeaningfulData = (data) => {
    if (!data || !data.tilesets) return false;
    return Object.values(data.tilesets).some((tileset) => {
        const selections = tileset.selections ? Object.keys(tileset.selections).length : 0;
        const ground = tileset.ground || {};
        return selections > 0 || ground.top || ground.fill;
    });
};

const writeMirror = (data) => {
    if (typeof localStorage === 'undefined') return;
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (err) {
        // Mirror writes are best-effort for sync access.
    }
};

export const loadTileSelections = () => {
    if (typeof localStorage === 'undefined') return defaultData();
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return defaultData();
        const parsed = JSON.parse(raw);
        if (!parsed || parsed.version !== 1 || !parsed.tilesets) return defaultData();
        return parsed;
    } catch (err) {
        return defaultData();
    }
};

export const saveTileSelections = (data) => {
    writeMirror(data);
};

const ensureSchema = (db) => {
    db.run(`
        CREATE TABLE IF NOT EXISTS tilesets (
            key TEXT PRIMARY KEY,
            ground_top TEXT,
            ground_fill TEXT
        );
    `);
    db.run(`
        CREATE TABLE IF NOT EXISTS selections (
            tileset_key TEXT NOT NULL,
            name TEXT NOT NULL,
            frame INTEGER,
            PRIMARY KEY (tileset_key, name)
        );
    `);
};

const loadFromDb = (db) => {
    const data = defaultData();
    const tilesetResult = db.exec('SELECT key, ground_top, ground_fill FROM tilesets;');
    if (tilesetResult[0]) {
        tilesetResult[0].values.forEach(([key, groundTop, groundFill]) => {
            normalizeTileset(data, key);
            data.tilesets[key].ground.top = groundTop || null;
            data.tilesets[key].ground.fill = groundFill || null;
        });
    }

    const selectionResult = db.exec('SELECT tileset_key, name, frame FROM selections;');
    if (selectionResult[0]) {
        selectionResult[0].values.forEach(([tilesetKey, name, frame]) => {
            normalizeTileset(data, tilesetKey);
            data.tilesets[tilesetKey].selections[name] = { frame: Number.isInteger(frame) ? frame : null };
        });
    }
    return data;
};

const writeToDb = (db, data) => {
    db.run('BEGIN;');
    db.run('DELETE FROM selections;');
    db.run('DELETE FROM tilesets;');
    const tilesetStmt = db.prepare('INSERT INTO tilesets (key, ground_top, ground_fill) VALUES (?, ?, ?);');
    Object.entries(data.tilesets || {}).forEach(([tilesetKey, tileset]) => {
        const ground = tileset.ground || {};
        tilesetStmt.run([tilesetKey, ground.top || null, ground.fill || null]);
    });
    tilesetStmt.free();

    const selectionStmt = db.prepare('INSERT INTO selections (tileset_key, name, frame) VALUES (?, ?, ?);');
    Object.entries(data.tilesets || {}).forEach(([tilesetKey, tileset]) => {
        Object.entries(tileset.selections || {}).forEach(([name, selection]) => {
            selectionStmt.run([tilesetKey, name, Number.isInteger(selection.frame) ? selection.frame : null]);
        });
    });
    selectionStmt.free();
    db.run('COMMIT;');
};

export const createTileSelectionStore = async () => {
    const wasmUrl = new URL('sql.js/dist/sql-wasm.wasm', import.meta.url).href;
    const SQL = await initSqlJs({
        locateFile: () => wasmUrl
    });
    const idbStore = createStore(IDB_DB_NAME, IDB_STORE_NAME);
    const stored = await get(IDB_KEY, idbStore);
    const db = stored ? new SQL.Database(new Uint8Array(stored)) : new SQL.Database();
    ensureSchema(db);

    let data = loadFromDb(db);
    const mirror = loadTileSelections();
    if (!hasMeaningfulData(data) && hasMeaningfulData(mirror)) {
        writeToDb(db, mirror);
        data = mirror;
        await set(IDB_KEY, db.export(), idbStore);
    }
    writeMirror(data);

    return {
        data,
        save: async (nextData) => {
            writeToDb(db, nextData);
            await set(IDB_KEY, db.export(), idbStore);
            writeMirror(nextData);
        },
        close: () => db.close()
    };
};

export const bootstrapTileSelections = async () => {
    try {
        const store = await createTileSelectionStore();
        return store.data;
    } catch (err) {
        return loadTileSelections();
    }
};

export const ensureTileset = (data, tilesetKey) => {
    normalizeTileset(data, tilesetKey);
    return data.tilesets[tilesetKey];
};

export const setTileSelection = (data, tilesetKey, name, frame) => {
    normalizeTileset(data, tilesetKey);
    data.tilesets[tilesetKey].selections[name] = { frame };
};

export const deleteTileSelection = (data, tilesetKey, name) => {
    normalizeTileset(data, tilesetKey);
    delete data.tilesets[tilesetKey].selections[name];
    const ground = data.tilesets[tilesetKey].ground;
    if (ground.top === name) ground.top = null;
    if (ground.fill === name) ground.fill = null;
};

export const setGroundMapping = (data, tilesetKey, topName, fillName) => {
    normalizeTileset(data, tilesetKey);
    data.tilesets[tilesetKey].ground.top = topName || null;
    data.tilesets[tilesetKey].ground.fill = fillName || null;
};
