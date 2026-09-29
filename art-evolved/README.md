# ART//EVOLVED — The Visual History of Humanity

<div align="center">

[![Live Demo](https://img.shields.io/badge/Live%20Demo-5zyu0p.funchole.dev-blueviolet?style=for-the-badge&logo=google-chrome&logoColor=white)](https://5zyu0p.funchole.dev/)
[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/Three.js-r169-black?style=for-the-badge&logo=three.js&logoColor=white)](https://threejs.org/)
[![React Three Fiber](https://img.shields.io/badge/R3F-8.17-white?style=for-the-badge&logo=three.js&logoColor=black)](https://docs.pmnd.rs/react-three-fiber)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**The visual history of humanity — from marks on stone to machines that imagine.**

*A spatial, procedural 3D museum rendered entirely in real-time WebGL, GLSL, and WebAudio.*

[**Explore Live Exhibition →**](https://5zyu0p.funchole.dev/)

</div>

---

## Overview

A procedural 3D museum built with React Three Fiber. There are no image assets: every chamber, texture, artist interpretation, preview and export is generated dynamically by code (GLSL, instanced geometry, GPGPU particles, Canvas 2D painters, WebAudio synthesis).

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production bundle
```

---

## The Experience

| Wing | Description |
| :--- | :--- |
| **Entrance** | A procedural sculpture cycling *primitive &rarr; organic &rarr; fragmented &rarr; particles &rarr; pixels &rarr; ASCII &rarr; wireframe &rarr; generative*, followed by flight through a corridor of frames. |
| **The Archive** | 71 chambers along one continuous corridor, ordered by date across cultures (cave art to post-digital, including East Asian, South Asian, Islamic, African, Mesoamerican and Indigenous traditions). Only the nearest chambers exist in memory at any time. |
| **Art Evolution** | Signature interaction. A real-time spatial projection slider re-projects every block of one world into another (e.g. *Renaissance &rarr; Cubism*, *Baroque &rarr; Minimalism*, *Impressionism &rarr; Pixel*). The target geometry is *derived* mathematically from the source, not cross-faded. |
| **How Art Changed** | One archetypal tree, drawn eight ways (prehistoric &rarr; generative) by the same 2,200 instanced units. |
| **Material &times; Technology** | Stone &rarr; AI and cave wall &rarr; AI as morphing formations; the atmosphere and post-process follow the medium. |
| **Art Map** | Force-directed 3D graph of movements, 100 artists and technologies with typed edges (*influence, reaction, evolution, collaboration, movement, technological change*). |
| **Create** | Seeded flow-field playground with chaos, form, colour, density, scale, rotation, noise, particles, dither and pixelation. Exports PNG or SVG. |
| **Coda** | The museum disappears; all languages collapse into one changing form. |

**Controls:** `Scroll` or `←` `→` to travel &middot; `Enter` to explore &middot; `Esc` back &middot; drag to orbit &middot; `⌘K` or `/` to search &middot; `R` surprise me &middot; `M` menu &middot; `+`/`-` zoom.

---

## Architecture

```
src/
  data/                movements, eras, artists, materials, technologies, relations, histories
  state/               zustand store (UI state) + world.ts (mutable per-frame camera state)
  components/
    3d/                ArtWorld (Canvas), CameraController, Timeline, EraScene, StylePass,
                       LightRig, Atmosphere, MorphField, InfluenceGraph, Precompiled, views/*
    hud/               TopBar, BottomTimeline, EraPanel, Instruments, SearchCommand, MenuSheet,
                       ArtistSheet, ViewOverlays …
    ui/                shadcn-style primitives (Radix) with museum styling
    create/            CreateStudio
    mobile/            MobileExperience (vertical timeline, also the WebGL fallback)
  scenes/<kind>/       25 procedural scene archetypes, each a lazily-loaded chunk
  shaders/             noise/curl/Bayer GLSL + the post-process style engine
  art/painters.ts      2D procedural painters (textures, previews, artist interpretations)
  utils/formations.ts  the geometry vocabulary behind every morph
  utils/visibility.ts  scene graph visibility pruning
  audio/               AmbientEngine — parametric synthesis graph re-parameterised per era
```

### The Visual Operating System

Every movement declares a `VisualSystem` (see `src/data/types.ts`):

```ts
visual: vs('cubism', palette, { variant: 'futurism', camera: 'theatrical' })
// → scene, geometry, particles, lighting, camera, post shader, motion,
//   UI theme, transition, sound, fog — defaults come from SCENE_PRESETS
```

The world coordinates all sensory channels:
- `LightRig` re-configures a fixed five-light rig (constant light count means no shader recompiles when chambers mount).
- `CameraController` blends camera behaviours between neighbouring chambers.
- `StylePass` ramps the post-process between modes (pixel, ASCII, dither stages, CMYK halftone, glitch) and plays the chamber's transition during flights.
- `useThemeSync` pushes palette and `data-ui` theme into CSS so the interface itself changes (ink &rarr; vertical type, cubism &rarr; fragmented panels, minimalism &rarr; UI vanishes, ASCII &rarr; monospace, pixel &rarr; quantised chrome, generative &rarr; self-regenerating labels).
- `AmbientEngine` crossfades the era's sound.

### Performance & Precompilation

- **Parallel Shader Precompilation (`components/3d/Precompiled.tsx`)**: Compiles both sRGB and linear render target variants via `KHR_parallel_shader_compile` and uploads textures asynchronously off-frame, eliminating transition hitching.
- **Visibility Pruning (`utils/visibility.ts`)**: Dormant and suspended chambers skip per-frame computation.
- **Instanced meshes & GPU particles**: Post-Impressionist dynamic field driven by GPGPU compute.
- **Dynamic Level of Detail**: Chambers are code-split and mounted only around the camera (&plusmn;1, just the destination during long leaps).
- **Graceful degradation**: Supports `prefers-reduced-motion` and provides dedicated 2D touch experience on mobile devices.
