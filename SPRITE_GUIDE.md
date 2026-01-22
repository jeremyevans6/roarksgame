# Asset Generation Guide: Roark's Game

This guide provides the exact prompts and technical specifications for generating sprite sheets and assets for the game using an AI image generator (like Nano Banana or Midjourney).

## 1. Technical Specifications
All sprite sheets should be created on a transparent background with uniform grid spacing.

- **Standard Frame Size:** 32x32 pixels
- **Player (Roark) Sheet:** 8 columns, 4 rows (256x128 total)
- **Enemy Sheets:** 4 columns, 1 row (128x32 total)
- **Tiles/Icons:** 32x32 pixels

---

## 2. Generation Prompts

### A. Roark (The Hero)
**Prompt:**
> "A pixel art sprite sheet for a 2D platformer hero named Roark. Blue armor, heroic stance, 32x32 pixel frames. 8x4 grid. Row 1: Idle animation (4 frames). Row 2: Running animation (8 frames). Row 3: Jumping and falling (4 frames). Row 4: Sword attack swipe (4 frames). 16-bit aesthetic, vibrant colors, transparent background, flat lighting."

### B. Mushroom Enemy
**Prompt:**
> "Pixel art sprite sheet for a walking mushroom enemy. Red cap with white spots, grumpy face. 32x32 pixel frames. 4 frames of horizontal walking animation. 16-bit SNES style, transparent background, consistent proportions."

### C. Frog Enemy
**Prompt:**
> "Pixel art sprite sheet for a cyan jumping frog enemy. 32x32 pixel frames. 4 frames: idle, preparing to jump, mid-air leap, landing. 16-bit retro style, transparent background."

### D. Turtle Enemy
**Prompt:**
> "Pixel art sprite sheet for a yellow turtle enemy with a hard shell. 32x32 pixel frames. 4 frames: walking with head out, retreating into shell, spinning shell, and emerging. Retro pixel art, transparent background."

### E. Environment Icons (Gems & Shops)
**Prompt:**
> "A collection of 2D pixel art game icons. A glowing cyan diamond gem and a small purple fantasy shop house with a peaked roof. 32x32 pixels each, isolated on transparent background, high contrast, 16-bit style."

---

## 3. Implementation Steps
1. Generate the image using the prompts above.
2. Save the files as follows in the `/public/assets/` directory:
   - `roark_sheet.png`
   - `mushroom_sheet.png`
   - `frog_sheet.png`
   - `turtle_sheet.png`
   - `gem.png`
   - `shop.png`
3. The game will automatically detect these files and replace the procedural blocks with your new artwork.
