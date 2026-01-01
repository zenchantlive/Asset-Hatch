# Asset Hatch - Asset Types & Game Templates

## Asset Categories

Asset Hatch organizes all assets into five main categories. Every project can use all or any subset of these.

### 1. Characters
Animated entities representing players, NPCs, and enemies.

**What it includes:**
- Player character with multiple animation states
- NPC characters with dialogue/interaction states
- Enemy characters with combat/patrol states
- Bosses with multiple phase animations
- Animals/creatures with behavior-specific animations

**Common Animation States:**
- Idle (standing still)
- Walk (4-direction or 8-direction)
- Run (faster movement)
- Jump/Fall (aerial movement)
- Attack/Action (combat or interaction)
- Hurt/Damage (hit reaction)
- Death/Collapse (end state)
- Special ability animations

**Specifications:**
- Base resolution (16x16, 32x32, 64x64, etc.)
- Number of directions (4 or 8)
- Frame counts per animation state
- Sprite sheet dimensions
- Animation sequence

### 2. Environment
Static and dynamic world elements that form the game world.

**What it includes:**
- Tilesets (ground, walls, platforms, obstacles)
- Backgrounds (parallax layers, sky, scenery)
- Platforms and solid objects
- Hazards (spikes, lava, ice)
- Decorative elements (trees, rocks, structures)
- Water and fluid elements
- Weather effects (rain, snow, fog)

**Specifications:**
- Tile dimensions (typically 16x16, 32x32)
- Tileset size (how many unique tiles)
- Layer depth (foreground, midground, background)
- Parallax factor (for scrolling backgrounds)
- Animation frames (if animated)

### 3. Props
Interactive and decorative objects within the game world.

**What it includes:**
- Interactive objects (doors, chests, levers, buttons)
- Collectibles (coins, gems, health pickups)
- Equipment (weapons, armor, tools)
- Furniture (chairs, tables, beds)
- Decoration (vases, paintings, torches)
- Destructible objects (barrels, crates)
- Traps and mechanisms

**Specifications:**
- Object size
- Interactive states (closed/open, inactive/active)
- Animation frames
- Collision shape (if relevant)

### 4. UI Elements
All graphical elements for the game's user interface.

**What it includes:**
- Buttons (normal, hover, pressed states)
- Panels and windows
- Health bars and gauges
- Inventory slots
- Dialogue boxes
- Menu backgrounds
- Cursors
- Notification elements
- Text backgrounds

**Specifications:**
- Pixel dimensions
- State variations (normal, hover, active, disabled)
- Scalability (responsive sizing)
- Interaction states

### 5. Icons
Small, clear graphics representing game concepts.

**What it includes:**
- Item icons (weapons, potions, consumables)
- Ability/spell icons
- Status effect icons (poison, burn, freeze)
- Equipment icons (armor, helmet, boots)
- Skill icons
- Rarity indicators
- Directional indicators
- UI system icons

**Specifications:**
- Consistent size (typically 16x16, 32x32)
- Recognizable at small scale
- Clear visual distinction
- Background transparency

---

## Game Type Templates

Each game type comes with a suggested baseline asset list. Users can customize by adding, removing, or modifying items.

### 1. Platformer

**Core Concept:** 2D side-scrolling action game with jumping, running, and combat.

**Baseline Asset List:**

**Characters:**
- Player character
  - Idle, Run (left/right), Jump, Fall, Land
  - Attack, Hurt, Death
  - Resolution: 32x32, 4-frame animations
- Enemy Type 1 (Melee)
  - Idle, Walk, Attack, Hurt, Death
  - Resolution: 32x32, 4-frame
- Enemy Type 2 (Ranged)
  - Idle, Walk, Attack, Hurt, Death
  - Resolution: 32x32, 4-frame
- Boss (Optional)
  - Multiple phases with unique animations
  - Resolution: 64x64+, 8+ frames

**Environment:**
- Ground tileset (grass, stone, dirt)
  - 16 unique tiles, 16x16 each
  - Edges, corners, transitions
- Platform elements
  - Floating platforms, moving platforms
- Background layers (2-3 parallax)
- Hazards (spikes, lava, etc.)

**Props:**
- Collectibles (coins, gems, powerups)
- Destructible objects (barrels, boxes)
- Platforms and moving parts

**UI:**
- Health bar
- Score display
- Lives indicator
- Level indicator
- Game over screen

**Icons:**
- Powerup icons (shield, speed, invincibility)
- Health/life icons

**Total Assets:** ~25-40 unique items

---

### 2. Top-Down RPG

**Core Concept:** Bird's-eye-view fantasy or sci-fi adventure with exploration, NPCs, and combat.

**Baseline Asset List:**

**Characters:**
- Player character
  - Idle, Walk (4-direction), Run, Attack, Cast spell
  - Resolution: 32x32, 4-frame per direction
- NPC Type 1 (Villager)
  - Idle, Walk, Talk animation
  - Resolution: 32x32, 2-frame
- NPC Type 2 (Merchant)
  - Idle, Walk, Trade animation
- Enemy Type 1 (Goblin)
  - Idle, Patrol, Attack, Hurt, Death
  - Resolution: 32x32
- Enemy Type 2 (Skeleton)
  - Similar to enemy type 1
- Enemy Type 3 (Boss)
  - Multiple phases, larger sprite
  - Resolution: 64x64

**Environment:**
- Overworld tileset (grass, water, trees, paths)
  - 32+ unique tiles, 16x16
- Interior tileset (stone, wood, metal)
  - 32+ unique tiles for dungeons/buildings
- Background elements (mountains, sky, clouds)

**Props:**
- Doors (closed, open, locked states)
- Chests (closed, open states)
- Interactive objects (NPCs, merchants, quest items)
- Obstacles and walls

**UI:**
- Dialogue box
- Inventory slot background
- Health/mana bars
- Character portrait frame
- Menu background
- Quest log UI

**Icons:**
- Item icons (20-30 unique)
  - Weapons, armor, potions, quest items
- Ability icons (10-15)
  - Spells, skills, techniques
- Status effect icons (8-12)
  - Poison, burn, freeze, blessing, curse

**Total Assets:** ~60-80 unique items

---

### 3. Puzzle Game

**Core Concept:** Block-matching, slider, or logic-based puzzle game.

**Baseline Asset List:**

**Game Pieces:**
- Block/tile graphics (3-6 color variants)
- Animation frames for match/clear
- Particle effects for combos

**Environment:**
- Game board background
- Level background

**UI:**
- Score display background
- Move counter
- Timer display
- Combo counter
- Level complete screen
- Game over screen
- Pause menu

**Icons:**
- Powerup icons (clear row, shuffle, time add)
- Level indicators
- Star rating icons

**Props:**
- Block clear effects
- Combo particle effects
- Special block animations

**Total Assets:** ~15-25 unique items

---

### 4. Farming/Simulation

**Core Concept:** Top-down farming or life simulation with seasonal changes and progression.

**Baseline Asset List:**

**Characters:**
- Player character
  - Idle, Walk (4-direction), Work animation
  - Resolution: 32x32
- NPC characters
  - Villagers, merchants, animals
  - Simple animations (idle, walk)

**Environment:**
- Farm tileset
  - Soil, grass, tilled fields, water
  - 16x16 base
- Seasonal variations
  - Spring, summer, fall, winter versions
- Trees and vegetation in growth stages

**Props:**
- Crops (multiple growth stages)
  - Tomatoes, wheat, carrots, etc.
  - 4-5 frames per crop
- Farm structures
  - Barn, silo, greenhouse
  - Doors, fences, paths
- Animals (chickens, cows, sheep)
  - Idle, moving, interacting
- Furniture and decorations

**UI:**
- Inventory/toolbox
- Time of day display
- Money/currency display
- Season indicator
- Farm status panels

**Icons:**
- Item icons (crops, tools, animals)
- Seed icons
- Tool icons
- Currency/money

**Total Assets:** ~40-60 unique items

---

### 5. Visual Novel / Narrative Game

**Core Concept:** Story-driven game with character dialogue, branching narratives, and visual storytelling.

**Baseline Asset List:**

**Characters:**
- Character portraits (1 per character)
  - Multiple expressions (neutral, happy, sad, angry, surprised)
  - Upper and lower body if full-body
  - Resolution: 256x256+ for portraits
- Character sprites for in-game scenes
- Optional: Chibi versions for comedy moments

**Environment:**
- Background scenes (5-10 unique locations)
  - Indoors (house, tavern, castle)
  - Outdoors (forest, town, road)
  - UI-specific (menu backgrounds)

**UI:**
- Dialogue box background
- Text input area
- Choice buttons
- Menu backgrounds (main, settings, load/save)
- Navigation arrows
- Speaker name plate

**Props:**
- Interactive scene objects
- Visual novel-specific effects
- Transition effects

**Icons:**
- Menu icons
- Save slot indicators
- Fast-forward/pause icons

**Total Assets:** ~30-50 unique items

---

### 6. Action/Arcade Games

**Core Concept:** Fast-paced action game like Space Invaders, Galaga, or classic arcade.

**Baseline Asset List:**

**Characters/Objects:**
- Player ship/character
  - Normal state, powered-up state
  - Resolution: 32x32
- Enemy types (3-5 variants)
  - Multiple movement states
  - Hit/explosion states
- Boss (2-3 phases)

**Environment:**
- Static background or parallax scrolling

**UI:**
- Score display
- Lives display
- Wave indicator
- Health/shield bar
- Game over screen

**Props:**
- Bullets/projectiles (player and enemy)
- Explosions and impacts
- Powerup items
- Particle effects

**Icons:**
- Powerup icons
- Difficulty indicators
- Achievement icons

**Total Assets:** ~25-40 unique items

---

### 7. Fighting Game

**Core Concept:** 1v1 or arena-based combat with special moves and combos.

**Baseline Asset List:**

**Characters:**
- Player character
  - Stance, Walk, Jump, Attack (3+ variations)
  - Block, Hurt, Knockdown, Rise
  - Special move animations
  - Resolution: 64x64+, 8+ frames per state
- Opponent character(s)
  - Same animation set as player
- Boss character
  - Unique attacks and patterns

**Environment:**
- Battle arenas (3-5 themed locations)
- Background details and parallax

**UI:**
- Health bars (player and opponent)
- Special meter
- Round indicator
- Combo counter
- Versus screen
- Victory screen

**Props:**
- Impact effects
- Dust clouds
- Special move effects
- Stage hazards

**Icons:**
- Character select icons
- Combo symbols
- Power-up icons

**Total Assets:** ~35-50 unique items

---

## Quality Parameters & Options

Users select from these predefined qualities during planning, with ability to add custom values.

| Quality | Options |
|---------|---------|
| **Game Type** | Platformer, Top-down RPG, Roguelike, Puzzle, Visual Novel, Fighting, Racing, Shooter, Card Game, Idle/Clicker, Metroidvania, Tower Defense, Farming/Sim, Arcade, Strategy, Hack & Slash |
| **Art Style** | Pixel Art, Hand-painted, Vector/Flat, Anime, Realistic, Sketch/Lineart, Chibi, Voxel-style 2D, Watercolor, Minimalist, Isometric, Retro CRT, Low-poly 2D |
| **Resolution** | 16x16, 32x32, 64x64, 128x128, 256x256, Custom |
| **Palette** | Limited (8-16 colors), Retro (NES, SNES, GameBoy), Vibrant, Muted/Pastel, Dark/Desaturated, Monochrome, Custom |
| **Animation Frames** | Static only, 2-frame, 4-frame, 8-frame, 12+ frame |
| **Perspective** | Side-view, Top-down, Isometric, 3/4 view, Front-facing only |
| **Theme** | Fantasy, Sci-fi, Modern, Horror, Post-apocalyptic, Nature/Pastoral, Urban, Underwater, Space, Steampunk, Cyberpunk, Western, Medieval, Japanese, Retro |
| **Mood** | Cheerful, Dark, Mysterious, Intense, Calm, Comedic, Epic, Surreal, Noir, Dreamlike |
| **Custom Qualities** | Users can add custom qualities if dropdowns don't provide what they need |

---

## Dynamic Dropdown Behavior

For all quality parameters:
- **Dropdown Selection** — User picks from predefined options
- **Custom Input** — User types custom value if dropdown insufficient
- **Combined Prompt** — Backend meta-prompt combines dropdown selections + custom text into high-quality generation prompt
- **Backend Processing** — Custom inputs are validated and integrated into final generation prompts

Example:
- User selects: Art Style = "Pixel Art", but also types "but like Kirby's Dream Land, very round shapes"
- System sends both to backend which creates: "Pixel art style inspired by Kirby's Dream Land with round, soft character shapes..."

---

## Asset Generation Workflow per Type

### Single Generation (Most Common)
```
Single prompt → Single image
Example: "Generate a 32x32 idle sprite for a farmer character, pixel art, front-facing"
Result: One PNG file
```

### Sprite Sheet Generation (Recommended for Characters)
```
Single prompt → Single sprite sheet image
Example: "Generate a 4-frame walk cycle sprite sheet for knight character, 
32x32 per frame, arranged horizontally, pixel art"
Result: One PNG with all frames (128x32)
```

### Multi-Sheet Generation (Complex Characters)
```
Multiple prompts → Multiple sheets
Example: Character might need:
1. Walk/idle animations sheet
2. Attack/combat animations sheet
3. Special ability animations sheet
Result: Three separate PNG files
```

### Batch Generation (Common for Icons/Tiles)
```
Single prompt → Multiple related assets
Example: "Generate 16 different pixel art icons: sword, shield, potion, 
helmet, boots, gloves, chest armor, ring, wand, staff, bow, arrow, 
torch, key, coin, gem. All 16x16 pixel art style"
Result: Single sheet or 16 individual PNGs
```
