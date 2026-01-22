# Genuary 2026

Creative coding project for Genuary 2026 - a daily creative coding challenge for January.

## Project Overview

This project contains daily creative coding experiments using Three.js for 3D graphics, WebGL shaders (SDFs, raymarching), and custom easing functions. Each numbered folder (1/, 2/, 3/, etc.) represents a different day's challenge.

## Running the Project

This is a static HTML/JavaScript project. To run locally:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Using PHP
php -S localhost:8000
```

Then open `http://localhost:8000/1/` (or any numbered folder) in a browser.

## Directory Structure

```
/                           # Root directory
├── 1/, 2/, 3/, 4/, 5/     # Daily challenge folders
│   ├── index.html          # Entry point for each day
│   ├── main.js             # Main JavaScript code
│   └── README.md           # Notes about the day's work
├── modules/                # Shared JavaScript modules
│   ├── common.js           # Shared renderer, camera, controls setup
│   ├── easings.js          # Easing functions
│   ├── gui.js              # Custom GUI controls
│   ├── maf.js              # Math helper functions
│   ├── material.js         # Custom material utilities
│   ├── reactive.js         # Reactive/tweened values
│   └── ...                 # Other utility modules
├── shaders/                # GLSL shader code (as JS template strings)
│   ├── sdfs.js             # Signed distance functions
│   ├── easings.js          # GLSL easing functions
│   └── raymarch.js         # Raymarching utilities
├── third_party/            # External libraries
│   ├── three.module.min.js # Three.js (ES module)
│   ├── OrbitControls.js    # Camera controls
│   └── ...                 # Other third-party code
├── assets/                 # Shared assets (textures, HDR images)
├── css/                    # Shared stylesheets
└── index.html              # Gallery/index page
```

## Tech Stack

- **Three.js** - 3D graphics library (ES modules from `/third_party/`)
- **WebGL/GLSL** - Custom shaders for SDFs, raymarching, effects
- **Vanilla JavaScript** - ES modules, no build step required
- **Import Maps** - Module resolution configured in each `index.html`

## Coding Conventions

- ES modules with bare specifier imports (resolved via import maps)
- Shaders written as JavaScript template literal strings
- Each daily challenge is self-contained in its numbered folder
- Shared utilities go in `/modules/`
- GLSL code goes in `/shaders/` as exported string constants
- README.md in each day's folder documents the creative process

## Import Map Structure

Each day's `index.html` includes an import map like:

```html
<script type="importmap">
{
  "imports": {
    "three": "../third_party/three.module.min.js",
    "common": "../modules/common.js",
    "gui": "../modules/gui.js",
    ...
  }
}
</script>
```

## Key Patterns

### Creating a new day

1. Create folder `N/` where N is the day number
2. Copy `index.html` from a previous day and update imports as needed
3. Create `main.js` with the day's creative code
4. Add `README.md` documenting the concept and process

### Using shared modules

```javascript
import { renderer, camera, controls, render } from "common";
import GUI from "gui";
import { Easings } from "easings";
```

### Writing shaders

```javascript
// In shaders/myshader.js
export const shader = `
  // GLSL code here
`;

// In main.js
import { shader as myshader } from "shaders/myshader.js";
```
