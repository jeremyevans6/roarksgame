# Asset Generation Guide: Roark's Game

This guide provides the exact prompts and technical specifications for generating sprite sheets and assets using **PixelLab MCP**.

## 1. Technical Implementation
Assets are generated as individual frames or ZIP packages and integrated into the `GameScene` preload loop.

- **Hero (Roark):** Generated at 48x48 base, scaled to 2x in-engine ($20 \times 28$ physics hit-box).
- **Enemies:** Generated at 32x32 base, scaled to 2x in-engine.
- **Boss:** Generated at 128x128 base, scaled to 4x in-engine.
- **World Icons:** 32x32 pixels.

---

## 2. Implementation Prompts (PixelLab)

### A. Character Creation (`create_character`)
Use these descriptions for new entities:

| Entity | Description |
| :--- | :--- |
| **Roark Hero** | `happy 5 year old boy with blonde hair and blue eyes, wearing a blue shirt and brown pants, 16-bit pixel art style, heroic stance` |
| **Mushroom** | `grumpy mushroom with a red cap and white spots, 16-bit pixel art style` |
| **Frog** | `cyan jumping frog, 16-bit pixel art style` |
| **Turtle** | `yellow turtle with a green shell, 16-bit pixel art style` |
| **Bird** | `small blue bird with white belly, 16-bit pixel art style, side view` |
| **Jellyfish** | `glowing pink jellyfish, translucent, 16-bit pixel art style, side view` |
| **Boss** | `giant angry mega mushroom boss, red cap with glowing white spots, 16-bit pixel art style, high detail` |

### B. Animation Templates (`animate_character`)
Required animations for all characters:
- **Template:** `walk` or `walking`
- **Direction:** `west` (primary side-scroller view)
- **Special (Hero):** `breathing-idle`, `jumping-1`, `lead-jab` (attack)

### C. Map Objects (`create_map_object`)
| Object | Description |
| :--- | :--- |
| **Gems** | `glowing cyan diamond gem, pixel art icon` |
| **Coins** | `spinning gold coin, 16-bit pixel art style` |
| **Spring** | `red bouncy spring board, pixel art style` |
| **Shop** | `purple peaked roof shop house, pixel art icon` |
| **Feather** | `white feather power-up with small wings, 16-bit pixel art style` |
| **Sword Stone**| `glowing magical stone for sword enhancement, 16-bit pixel art style` |
| **Goal Pole** | `tall golden goal pole with a blue flag at the top, 16-bit pixel art style` |

---

## 3. Deployment Workflow
1.  **Generate:** Call the appropriate MCP tool.
2.  **Download:** Use `curl.exe --fail -o [name].zip [url]` once status is `completed`.
3.  **Unzip:** Use `Expand-Archive -Path [name].zip -DestinationPath public/assets/[name]/ -Force`.
4.  **Load:** Update `GameScene.js` preload loop to iterate through the new frame folders.
