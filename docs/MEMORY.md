# Lords of Lullabies (Art Evolved) — Persistent Codebase Memory

> **Last Updated**: 2026-09-29
> **Status**: Active & Evergreen

---

## 1. Project Identity & Philosophy

**Art Evolved — Lords of Lullabies** is an interactive, spatial 3D procedural museum documenting the visual history of human expression—from prehistoric cave art to autonomous neural generative systems.

### Core Principles
1. **Procedural Authenticity**: Every visual chamber is rendered procedurally via WebGL, Three.js, React Three Fiber, custom GLSL shaders, and procedural meshes rather than static 3D models or prerecorded video.
2. **Seamless Spatial Traversal**: The timeline can be explored linearly, via era jumps, topological influence graphs, or continuous morph fields with zero transition stutter.
3. **Deep Educational Grounding**: Visual experiences are backed by rigorous historical narratives, founding dates, and pioneer dossiers across world traditions.

---

## 2. Process Topology & Runtime Ports

| Service / Stage | Technology | Port / URL | Purpose |
|---|---|---|---|
| **Local Dev** | Vite 5 + HMR | `http://localhost:5173` | Local development environment |
| **Production Build** | `tsc -b && vite build` | `dist/` | Optimized static client bundle |
| **Funchole Deployment** | Static Function (`fn_art_evolved`) | `https://5zyu0p.funchole.dev/` | Production cloud deployment served via Gateway Flow (`flw_landing`) |

---

## 3. Core Subsystems & Architecture

```
art-evolved/
├── src/
│   ├── components/
│   │   ├── 3d/                 # Three.js / R3F Canvas components
│   │   │   ├── ArtWorld.tsx    # Root 3D scene & camera coordinator
│   │   │   ├── EraScene.tsx    # Era chamber renderer with stage management
│   │   │   ├── Precompiled.tsx # KHR_parallel_shader_compile & texture pre-upload
│   │   │   ├── Timeline.tsx    # 3D spatial timeline path and checkpoints
│   │   │   ├── StylePass.tsx   # Post-processing and shader pass pipeline
│   │   │   ├── MorphField.tsx  # Particle field morphing between movements
│   │   │   └── Views.tsx       # View mode orchestration (Map, Morph, Evolution)
│   │   ├── hud/                # HUD overlays, timelines, search command, instruments
│   │   ├── mobile/             # Touch & gesture responsive mobile experience
│   │   └── ui/                 # Radix UI + Tailwind design tokens & primitives
│   ├── scenes/                 # Procedural chambers (cave, ink, temple, gothic, monument, etc.)
│   ├── data/                   # Art movements, artists, eras, visual systems, and histories
│   ├── audio/                  # Spatial ambient sound synthesis
│   └── hooks/                  # Input, keyboard, theme, and idle state synchronization
```

### Key Architectural Components

1. **Procedural Chamber Scenes (`scenes/`)**:
   - Distinct procedural algorithms per movement (e.g. geometric muqarnas in `temple`, stained glass & ribbed vaults in `gothic`, brushstroke ink physics in `ink`, monolith shadows in `monument`, cellular tessellations in `pattern`).
2. **Off-Thread Precompilation Engine (`components/3d/Precompiled.tsx`)**:
   - Uses `KHR_parallel_shader_compile` to link shaders for both sRGB (screen) and linear (StylePass) colour spaces in parallel before chamber reveals.
   - Eliminates room transition hitches by pre-uploading GPU textures off the render thread.
3. **Historical Dossier Engine (`data/histories.ts`)**:
   - Dedicated records for every movement (`born`, `why`, `birth`, `pioneers`) separating rich historical narratives from high-frequency visual parameters.
4. **Visibility & Performance Guards (`utils/visibility.ts`)**:
   - `isShown(o)` traverses scene graph visibility to halt per-frame computations for off-screen/suspended chambers.

---

## 4. Security & Safety Invariants

- **Static Deployment**: No server-side runtime code execution on Funchole; fully pre-compiled and served directly from high-performance static storage.
- **Client-Side Compute**: Shaders and procedural generations run entirely client-side on the user's WebGL context.
- **Resource Constraints**: Render targets and geometries are bounded to prevent GPU VRAM exhaustion on mobile devices.

---

## 5. Verification & Test Suite

```bash
# Typecheck & production build verification
cd art-evolved && npm run build
```

- **Type Safety**: TypeScript 5.6 strict mode (`tsc -b`).
- **Build Output**: Vite 5 production bundle with asset preloading and code splitting (`r3f`, `three`, `ui`).

---

## 6. Evolution & Decision Log

### 2026-09-29: Parallel Shader Precompilation, Movement Histories & Documentation Expansion
- **Precompiled Shader Engine**: Added `Precompiled.tsx` and `visibility.ts` to solve WebGL program linking frame drops during chamber switching.
- **Movement Histories**: Added `histories.ts` containing comprehensive founding records and pioneer archives for art movements across global cultures.
- **Scene Refinements**: Enriched procedural meshes, lighting, and materials across `temple`, `monument`, `pattern`, `ink`, `street`, `gothic`, and `generative` chambers.
- **Documentation**: Crafted comprehensive root `README.md` and updated `art-evolved/README.md` with architectural blueprints, control cheatsheets, live exhibition links, and technology badges.
- **Cloud Deployment**: Successfully deployed FunctionVersion `v2` on Funchole and adopted Gateway Flow `v5` serving live on `https://5zyu0p.funchole.dev/`.

