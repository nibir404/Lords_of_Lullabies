# Lords of Lullabies — ART//EVOLVED

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-5zyu0p.funchole.dev-blueviolet?style=for-the-badge&logo=google-chrome&logoColor=white)](https://5zyu0p.funchole.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r169-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-8.17-white?style=for-the-badge&logo=three.js&logoColor=black)](https://docs.pmnd.rs/react-three-fiber)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![FuncHole Deployed](https://img.shields.io/badge/Deployed%20on-FuncHole-00D26A?style=for-the-badge)](https://app.funchole.dev/functions/444b969d-d0f7-4397-b38c-ed3b8d46649c)

**The visual history of humanity — from marks on stone to machines that imagine.**

*A spatial, procedural 3D museum rendered entirely in real-time WebGL, GLSL, and WebAudio.*

[**Explore Live Exhibition →**](https://5zyu0p.funchole.dev/)

</div>

---

## Overview

**Lords of Lullabies (ART//EVOLVED)** is an interactive, spatial 3D procedural museum documenting how human visual expression evolved across millennia, civilizations, aesthetics, and technologies.

Unlike traditional virtual museums that rely on heavy pre-scanned 3D meshes or pre-rendered video loops, **every single chamber, texture, brushstroke, surface relief, preview, and ambient soundscape in ART//EVOLVED is synthesized procedurally in code** via:
- **Custom GLSL shaders** (procedural pigments, Bayer dithering, ASCII quantisation, CRT phosphor grids, and fluid curl noise).
- **GPU instanced geometries & GPGPU particle simulations** (millions of concurrent particles forming dynamic atmospheric fields).
- **Runtime 2D Canvas painters** for zero-network-asset textures and artist interpretations.
- **Parametric WebAudio synthesis engine** that dynamically morphs acoustics and harmonic frequency spectra across eras.

---

## Experience Wings & Key Interactions

| Wing | Experience Description |
| :--- | :--- |
| **Entrance Sculpture** | A procedural morphological monolith cycling through *primitive &rarr; organic &rarr; fragmented &rarr; particles &rarr; pixels &rarr; ASCII &rarr; wireframe &rarr; generative*, followed by a high-speed flight down the chronological corridor. |
| **The Archive** | **71 cultural chambers** arranged along a continuous spatial corridor, spanning prehistoric cave paintings to post-digital aesthetics across European, East Asian, South Asian, Islamic, African, Mesoamerican, and Indigenous traditions. Only the nearest chambers exist in memory at any time. |
| **Art Evolution** | **Signature interactive morpher.** A real-time spatial projection slider that deconstructs the geometry of one art movement into another (e.g. *Renaissance &rarr; Cubism*, *Baroque &rarr; Minimalism*, *Impressionism &rarr; Pixel*). The target geometry is mathematically derived from the source, rather than a generic cross-fade. |
| **How Art Changed** | A single archetypal tree rendered across eight distinct stylistic languages (prehistoric to autonomous neural generative) driven by the same 2,200 instanced spatial units. |
| **Material &times; Technology** | An interactive formation matrix illustrating the trajectory of human mediums: *Stone &rarr; AI* and *Cave Wall &rarr; Neural Latent Space*, where scene atmosphere, lighting, and post-processing shift with each medium. |
| **Art Map** | A force-directed 3D influence graph connecting art movements, 100 historical artists, and paradigm shifts with typed relational edges (*influence, reaction, evolution, collaboration, movement, technological breakthrough*). |
| **Create Studio** | An in-browser generative art laboratory featuring seeded vector flow fields, chaotic attractors, particle fields, chromatic dither, and high-resolution PNG / SVG vector export. |
| **Coda** | The architectural boundaries of the museum dissolve as all historical visual languages collapse into a unified morphological particle field. |

---

## Architectural Highlights

### 1. Zero-Stutter Parallel Shader Precompilation
Chamber transitions in WebGL traditionally suffer from severe frame drops when newly mounted materials trigger synchronous GPU shader compiles and program links. 

ART//EVOLVED solves this via [`Precompiled.tsx`](art-evolved/src/components/3d/Precompiled.tsx):
- Utilizes `KHR_parallel_shader_compile` to compile both **sRGB** (screen output) and **Linear** (StylePass post-process target) shader variants off the main render thread.
- Asynchronously initializes and uploads all procedural textures via `gl.initTexture()` before unveiling the chamber.
- [`visibility.ts`](art-evolved/src/utils/visibility.ts) ensures that dormant or compiling chambers skip all per-frame uniform updates and draw calls.

### 2. Comprehensive Historical Dossiers
Separated from high-frequency rendering loops, [`histories.ts`](art-evolved/src/data/histories.ts) powers rich historical dossiers for every movement:
- **`born`**: Pinpointed historical dates and founding locations.
- **`pioneers`**: The credited originators and innovators of each tradition.
- **`why`**: Societal, philosophical, and technological imperatives that triggered the movement.
- **`birth`**: The authentic technical execution method (e.g., ground ochre, tempera emulsion, oil glazes, halftone dot screens, lithography).

### 3. The Visual Operating System
Every movement declares a strongly typed `VisualSystem` configuration:
```typescript
visual: vs('cubism', palette, { variant: 'futurism', camera: 'theatrical' })
```
The application coordinates all sensory systems simultaneously:
- **`LightRig`**: Reconfigures a stable 5-light rig with zero uniform recompilations.
- **`CameraController`**: Interpolates between smooth cinematic orbits, intimate handheld sweeps, and isometric perspective.
- **`StylePass`**: Dynamically blends post-processing shaders (halftone, ASCII, dither, glitch, lens chromatic aberration).
- **`useThemeSync`**: Injects color tokens and `data-ui` attributes into CSS, causing the UI itself to adapt to the aesthetic of the active era.
- **`AmbientEngine`**: Re-synthesizes background acoustics and spatial reverb.

---

## Controls & Navigation

| Action | Keyboard / Mouse Control |
| :--- | :--- |
| **Travel Timeline** | `Scroll Wheel` or `←` / `→` Arrow Keys |
| **Enter Chamber** | `Enter` or Click Chamber Portal |
| **Exit to Corridor** | `Escape` |
| **Orbit Chamber** | Click & Drag Mouse |
| **Universal Search** | `⌘K` or `/` (Search artists, eras, movements, technologies) |
| **Surprise Me** | `R` (Random chronological leap) |
| **Navigation Menu** | `M` |
| **Zoom In / Out** | `+` / `-` |

---

## Repository Layout

```
Lords_of_Lullabies/
├── README.md                  # Root project documentation
├── docs/
│   └── MEMORY.md              # Persistent codebase memory & architectural log
├── .agents/                   # Workspace agents and tool configurations
├── .claude/                   # IDE launch configurations
└── art-evolved/               # Main application source
    ├── package.json           # Dependencies and build scripts
    ├── vite.config.ts         # Vite bundler configuration
    ├── tailwind.config.js     # Tailwind design system tokens
    ├── src/
    │   ├── App.tsx            # Main application root
    │   ├── main.tsx           # React entrypoint
    │   ├── components/
    │   │   ├── 3d/            # Three.js / R3F Canvas components
    │   │   ├── hud/           # HUD overlays, timelines, instruments
    │   │   ├── mobile/        # Mobile and touch-optimized experience
    │   │   ├── create/        # Generative Create Studio
    │   │   └── ui/            # Radix UI primitives & design tokens
    │   ├── scenes/            # 25+ procedural WebGL scene architectures
    │   ├── shaders/           # GLSL post-processing & procedural noise
    │   ├── data/              # Movements, eras, artists, and histories
    │   ├── audio/             # Ambient sound synthesis engine
    │   └── hooks/             # Theme, input, and environment synchronization
```

---

## Getting Started

### Prerequisites
- **Node.js** &ge; 18.0.0
- **npm** &ge; 9.0.0

### Local Development

1. Navigate to the application directory:
   ```bash
   cd art-evolved
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```
   Open [http://localhost:5173](http://localhost:5173) in your browser.

4. Build production bundle:
   ```bash
   npm run build
   ```

---

## Deployment

The application is deployed on [FuncHole](https://app.funchole.dev/) as a high-performance `STATIC` Function routed through the Default Gateway.

- **Funchole Function**: [`fn_art_evolved`](https://app.funchole.dev/functions/444b969d-d0f7-4397-b38c-ed3b8d46649c)
- **Gateway Domain**: `5zyu0p.funchole.dev`
- **Active Route**: `/*` (Marketing Landing — Wildcard)
- **Live Production URL**: [https://5zyu0p.funchole.dev/](https://5zyu0p.funchole.dev/)

---

## License

MIT © [nibir404](https://github.com/nibir404)
