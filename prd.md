# Product Requirements Document: Roark's Game

## 1. Game Overview
**Roark's Game** is a massive 2D side-scrolling platformer built with Phaser 3. It features Roark, a happy 5-year-old hero, on an epic 480,000-pixel journey through diverse biomes.

### Current Implementation Status
- ✅ **Massive World:** 480,000px procedural level.
- ✅ **Dynamic Biomes:** Meadows, Fungal Forest, and Aquatic Caverns with unique visual tints and decorations.
- ✅ **Advanced Movement:** WASD/Arrows, Double Jump, Dash (Shift), and Biome-specific physics (Swimming/Gliding).
- ✅ **Combat System:** Sword/Cotton Candy attack (Z) and Fireball projectiles (X).
- ✅ **Entity Ecosystem:** 5 standard enemies (Mushroom, Frog, Turtle, Bird, Jellyfish) + 1 Mega Boss.
- ✅ **Interactive Objects:** Springs, Breakable Blocks, Coins, Gems, Shops, and Checkpoints.
- ✅ **Visual Polish:** Parallax backgrounds, Day/Night cycle, Weather systems, and Particle effects.

---

## 2. Technical Stack
- **Engine:** Phaser 3.90.0 (Arcade Physics)
- **Bundler:** Vite
- **Asset Gen:** PixelLab MCP (AI-generated 16-bit pixel art)
- **Architecture:** Multi-scene (Menu, Game, Pause) with procedural world generation.

---

## 3. Core Mechanics

### 3.1 Player (Roark)
- **Movement:**
  - **Run:** Smooth horizontal movement with custom physics hit-boxes.
  - **Double Jump:** Reset on ground contact.
  - **Dash:** High-speed burst with 1s cooldown.
  - **Glide (Feather State):** Slow fall while holding jump in mid-air.
  - **Swim (Aquatic Biome):** Reduced gravity and infinite vertical movement.
- **Combat:**
  - **Attack (Z):** Animated melee swipe. Stone state increases range and reduces cooldown.
  - **Fireball (X):** Bouncing projectiles that skip along platforms.
- **States & Power-ups:**
  - **Small:** Default ($32 \times 40$ hit-box).
  - **Super:** Larger ($40 \times 50$ hit-box), can break blocks from below.
  - **Fire:** Enables fireball projectiles.
  - **Feather:** Enables wing-based gliding.
  - **Stone:** Enhances sword range and power.

### 3.2 Economy & Progression
- **Gems:** Collect 10 to spend at **Shops** (found every 10,000px).
- **Upgrades:** Permanent boosts to Speed or Jump Power.
- **Checkpoints:** Flagpoles that save respawn coordinates and turn green when touched.
- **Victory:** Reach the golden Goal Pole at the absolute end of the world.

---

## 4. World Design

### 4.1 Biomes
1. **Meadows (0 - 150k px):** Lush green, flowers, standard platforming.
2. **Fungal Forest (150k - 300k px):** Purple tints, mushrooms, increased verticality.
3. **Aquatic Caverns (300k+ px):** Blue tints, bubbles, swimming physics, flying/bobbing enemies.

### 4.2 Environmental Systems
- **Day/Night Cycle:** 2-minute sinusoidal alpha transition from noon to midnight.
- **Weather:** Procedural rain/snow particle events.
- **Parallax:** Multi-layer cloud system for depth.

---

## 5. Entities (NPCs & Enemies)
- **Mushroom:** Ground patrol.
- **Frog:** Periodically jumps toward the player.
- **Turtle:** Patrols until stomped; becomes a kickable shell that destroys other enemies.
- **Bird:** Sinusoidal flying patrol in upper screen.
- **Jellyfish:** Translucent bobbing patrol in Aquatic biome.
- **Boss Mushroom:** Giant $4\times$ scaled enemy with 5 HP and jump-attack logic.

---

## 6. Proposed Future Content
1. **Biome-Unique Tiles:** Custom 32x32 tilesets for Fungal (vines/sludge) and Aquatic (coral/sand) to replace generic tints.
2. **Dynamic Soundtrack:** Cross-fading audio tracks that change based on current biome and boss proximity.
3. **Inventory System:** A "Power-up Reserve" slot (similar to Mario World) to store one extra item.
4. **Mini-Map:** A small HUD element showing Roark's relative position in the 480k px world.
5. **NPC Quests:** Non-hostile characters in biomes requesting specific gem counts for unique lore or temporary buffs.
6. **Local Save:** Persisting shop upgrades and high scores via `localStorage`.
