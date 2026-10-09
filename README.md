# Type Garden — Living Typography

> An interactive generative typography experiment where keystrokes cultivate a living botanical garden climbing across letterforms.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff)](https://vitejs.dev/)

Type Garden treats text as a physical trellis. As you type, procedural vines seek out baseline and cap-height anchors, wrapping around, ducking behind, and emerging in front of glyphs. Buds swell, leaves unfurl, and flowers bloom in real time.

---

## ✨ Features

- **Dual-Layer Depth Sandwiching**: SVG elements are partitioned into `back` and `front` layers around an opaque typographic plane, creating an authentic physical sense of vines threading through the letter loops and counters.
- **Continuous Bézier Splines**: Custom Hermite-to-Bézier curve solvers generate smooth primary stems, secondary intertwining tendrils, and delicate curling spiral tips.
- **Botanical Variety**:
  - **5 Flower Architectures**: Simple blooms, wildflowers, layered double-petals, hanging bellflowers, and starry florets with radial stamens and sepals.
  - **3 Leaf Geometries**: Elongated willow blades, rounded ivy hearts, and serrated teardrops with micro-veins.
  - **Procedural Wild Berries**: Organic cluster formations with variable radii, specular highlights, and delicate connecting pedicels.
- **Prefix-Stable Determinism**: An incremental PRNG architecture ensures that typing forward adds new growth without mutating or shaking existing botanical nodes. Backspacing withers only the deleted characters.
- **8 Curated Color Themes**: *Herbarium*, *Sakura*, *Midnight*, *Moss*, *Terracotta*, *Wisteria*, *Autumn*, and *Monochrome*.
- **Poster & Type Modes**: Toggle between an interactive live typing canvas and an editorial poster layout with decorative framing.
- **Vector & High-Res Export**: Download production-ready standalone SVG vectors (layered with `<tspan>` typography) or high-DPI PNGs suitable for print.
- **Ergonomic Multiline Input**: Full support for `Shift+Enter` soft breaks with independent per-line horizontal centering and vertical clearance.
- **Zero Heavy Graph/Physics Engines**: Built purely on standard React, TypeScript, and mathematical SVG paths with zero heavyweight dependencies.

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/) (or yarn / pnpm)

### Installation

```bash
# Clone the repository
git clone https://github.com/hirensansanwal/TypeGarden.git
cd TypeGarden

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## ⌨️ Controls & Shortcuts

| Key / Action | Behavior |
| :--- | :--- |
| **Typing** | Sprouts botanical nodes along the typographic baseline |
| **Shift + Enter** | Creates a new line without clearing the garden |
| **Enter** | Clears the garden and rolls a new master seed |
| **Backspace** | Withers and removes the most recent character |
| **Theme Swatches** | Instantly recolors the garden and background palette |
| **Type / Poster Mode** | Toggles minimal typing mode vs. framed editorial layout |
| **PNG / SVG Export** | Generates high-resolution raster or clean vector artwork |

---

## 🛠️ Project Architecture

```
src/
├── components/
│   ├── Canvas/             # SVG botanical rendering layers
│   │   ├── Canvas.tsx      # SVG root container with back/front layering
│   │   ├── PlantNode.tsx   # Per-character plant element coordinator
│   │   ├── Stem.tsx        # Dynamic Bézier spline vine geometry
│   │   ├── Leaf.tsx        # Leaf shape generators & animations
│   │   ├── Flower.tsx      # Multi-architecture procedural blooms
│   │   ├── Berry.tsx       # Clustered wild berry geometry
│   │   └── Bud.tsx         # Nascent vine buds
│   ├── TextLayer/          # Typography layer & DOM measurement
│   └── UIOverlay/          # Controls, theme selector, mode switches & exports
├── hooks/
│   ├── useGardenNodes.ts   # Growth and withering lifecycle state
│   └── useKeyboardInput.ts # Keystroke handling & multiline events
├── utils/
│   ├── generation.ts       # Algorithmic vine routing & botanical math
│   ├── export.ts           # Standalone SVG serialization & PNG canvas rendering
│   ├── themes.ts           # 8 curated botanical color palettes
│   └── random.ts           # Seeded deterministic PRNG utilities
└── types/                  # TypeScript interface definitions
```

---

## 🧪 Testing

The repository includes a comprehensive regression suite verifying determinism, seed preservation, multiline vertical rhythm, berry geometry, and SVG export validity.

```bash
npm test
```

To run a production build:

```bash
npm run build
```

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).
