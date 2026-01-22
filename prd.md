# Product Requirements Document: Roark's Game

## 1. Game Overview
**Roark's Game** is a 2D side-scrolling platformer built with Phaser 3. It draws heavy inspiration from early *Super Mario Bros.* titles but emphasizes exploration and longevity through expansive levels and a robust checkpoint system.

### Core Pillars
- **Legacy Feel, Modern Flow:** Classic tile-based platforming with smoother movement (double jumps) and combat.
- **Expansive Exploration:** Longer levels that reward thorough searching rather than just speed-running.
- **Forgiving Progression:** Frequent checkpoints to reduce frustration, focusing on the joy of movement rather than extreme "punishment" difficulty.

---

## 2. Technical Stack
- **Engine:** Phaser 3
- **Physics:** Arcade Physics (for snappy, predictable platforming)
- **Language:** JavaScript/TypeScript
- **Assets:** Tilemaps (Tiled JSON format), Sprite sheets for animations.

---

## 3. Game Mechanics

### 3.1 Player (Roark)
- **Movement:**
  - **Run:** Left/Right movement with acceleration/friction.
  - **Jump:** Variable jump height based on button hold duration.
  - **Double Jump:** A second mid-air leap (resets on ground touch).
- **Combat:**
  - **Sword Attack:** Short-range melee swipe. Can be used while running or jumping.
- **States:**
  - Small (Default)
  - Super (Larger, can take one extra hit)
  - Powered (Specific ability active)

### 3.2 Power-ups
- **Mushroom (Classic):** Grow to "Super Roark."
- **Fire Flower:** Grants ability to throw fireballs.
- **Feather (Wing):** Enhances double jump into a brief glide or higher leap.
- **Sword Stone:** Temporarily increases sword range or damage (elemental effects).

---

## 4. World Design

### 4.1 Level Structure
- **Length:** Levels are 3-4x longer than a standard Mario level.
- **Verticality:** Use of multiple paths (high/low routes).
- **Checkpoints:** "Flags" placed every ~30 seconds of gameplay.
- **Fewer Pits:** Obstacles are primarily enemies and environmental puzzles rather than "bottomless pit" death traps.

### 4.2 Environments
- **World 1:** Lush Meadows (Greens/Blues)
- **World 2:** Fungal Forest (Deep Purples/Neon Greens)
- **World 3:** Aquatic Caverns (Dark Blues/Teals)

---

## 5. Entities (NPCs & Enemies)

### 5.1 Enemies
- **Mushrooms (The "Pawn"):** Walk back and forth, turn at edges.
- **Frogs:** Jump periodically; some jump toward the player.
- **Turtles:** 
  - Green: Walk off edges.
  - Red: Turn at edges.
  - Shell: When hit, becomes a projectile.

---

## 6. User Interface (UI)
- **HUD:** Lives, Coins, Score, and current Power-up icon.
- **Menus:** Retro-inspired pixel art UI using Phaser's `Scene` system.

---

## 7. Implementation Roadmap

### Phase 1: Core Engine (Foundations)
- [ ] Project setup with Phaser 3.
- [ ] Implement Roark's movement (Run, Jump, Double Jump).
- [ ] Physics integration and collision with a basic floor.

### Phase 2: Combat & Entities
- [ ] Sword attack logic and hitboxes.
- [ ] Enemy AI (Mushrooms, Frogs, Turtles).
- [ ] Basic damage/health system.

### Phase 3: World & Systems
- [ ] Tilemap loading (Tiled).
- [ ] Checkpoint system.
- [ ] Power-up spawning and state management.

### Phase 4: Polish & Audio
- [ ] Animations for all states.
- [ ] Sound effects and background music.
- [ ] Menu and HUD implementation.
