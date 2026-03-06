# AnimatedGradient Component — Implementation Plan

## Overview
A GPU-accelerated animated gradient background component (`AnimatedGradient`) built with WebGL2 and GLSL shaders. It renders organic, flowing gradients with configurable swirl, distortion, noise, and shape patterns — all running entirely on the GPU via a `<canvas>` element.

Supports **preset themes** (e.g., "Prism") and fully **custom configurations** with 3 colors and 14 tunable parameters.

## Target File
- `src/components/ui/animated-gradient.tsx` (Core Component)

---

## Component API

### Props Interface

```typescript
import { CSSProperties, ReactNode } from "react";

// Preset names — each maps to a pre-defined config
type PresetName =
  | "Prism"
  | "Sunset"
  | "Ocean"
  | "Aurora"
  | "Ember"
  | "Midnight"
  | "Forest"
  | "Neon";

interface CustomGradientConfig {
  preset: "custom";
  /** First gradient color (hex) */
  color1: string;
  /** Second gradient color (hex) */
  color2: string;
  /** Third gradient color (hex) */
  color3: string;
  /** Rotation angle (-360 to 360) */
  rotation?: number;       // default: 0
  /** Color proportion (0-100) */
  proportion?: number;     // default: 35
  /** Scale of the pattern */
  scale?: number;          // default: 1
  /** Animation speed (0-100) */
  speed?: number;          // default: 25
  /** Noise distortion (0-100) */
  distortion?: number;     // default: 12
  /** Swirl intensity (0-100) */
  swirl?: number;          // default: 80
  /** Number of swirl layers (0-20) */
  swirlIterations?: number; // default: 10
  /** Edge softness (0-100) */
  softness?: number;       // default: 100
  /** Time offset (-1000 to 1000) */
  offset?: number;         // default: 0
  /** Base pattern shape */
  shape?: "Checks" | "Stripes" | "Edge"; // default: "Checks"
  /** Size of the pattern (0-100) */
  shapeSize?: number;      // default: 10
}

type PresetGradientConfig = { preset: PresetName };

export interface AnimatedGradientProps {
  /** Gradient configuration — use a preset name or custom settings */
  config?: PresetGradientConfig | CustomGradientConfig;
  /** Optional noise overlay configuration */
  noise?: { opacity: number; scale?: number };
  /** Border radius of the container */
  radius?: string;
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}
```

---

## Technical Implementation

### 1. Architecture: WebGL2 Canvas

The component renders a `<canvas>` element with a WebGL2 context. All gradient computation happens in a GLSL fragment shader — the CPU only passes uniform values (colors, time, config params) each frame.

```
┌─────────────────────────────────────┐
│  <div> wrapper (className, radius)  │
│  ┌───────────────────────────────┐  │
│  │  <canvas> (WebGL2 context)    │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │  Fragment Shader (GLSL) │  │  │
│  │  │  • 3-color blending     │  │  │
│  │  │  • Simplex noise        │  │  │
│  │  │  • Swirl transform      │  │  │
│  │  │  • Shape pattern        │  │  │
│  │  │  • Time animation       │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │  Noise overlay (CSS/SVG)      │  │ ← optional, if noise prop set
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

### 2. GLSL Shaders

**Vertex Shader** — Minimal full-screen quad:
```glsl
#version 300 es
in vec2 a_position;
out vec2 v_uv;

void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
```

**Fragment Shader** — Handles all visual computation:
```glsl
#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 fragColor;

// Uniforms passed from JavaScript
uniform float u_time;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform float u_rotation;
uniform float u_proportion;
uniform float u_scale;
uniform float u_speed;
uniform float u_distortion;
uniform float u_swirl;
uniform float u_swirlIterations;
uniform float u_softness;
uniform float u_offset;
uniform float u_shape;       // 0 = Checks, 1 = Stripes, 2 = Edge
uniform float u_shapeSize;
uniform vec2 u_resolution;

// Simplex noise function (embedded)
// ... (see section 3)

void main() {
  vec2 uv = v_uv;

  // Apply rotation
  float angle = radians(u_rotation);
  mat2 rot = mat2(cos(angle), -sin(angle), sin(angle), cos(angle));
  uv = (uv - 0.5) * rot + 0.5;

  // Apply scale
  uv = (uv - 0.5) / u_scale + 0.5;

  // Apply swirl distortion
  // ... (see section 5)

  // Compute shape pattern
  // ... (see section 4)

  // Add simplex noise distortion
  float n = snoise(uv * 4.0 + u_time * u_speed * 0.01) * u_distortion * 0.01;
  uv += n;

  // 3-color blending based on position + noise
  float t = uv.x * (1.0 - u_proportion * 0.01) + uv.y * u_proportion * 0.01;
  t = clamp(t + n, 0.0, 1.0);

  vec3 color;
  if (t < 0.5) {
    color = mix(u_color1, u_color2, smoothstep(0.0, 0.5, t));
  } else {
    color = mix(u_color2, u_color3, smoothstep(0.5, 1.0, t));
  }

  // Apply softness (edge fade)
  float edge = smoothstep(0.0, u_softness * 0.01, min(uv.x, min(uv.y, min(1.0 - uv.x, 1.0 - uv.y))));
  color *= edge;

  fragColor = vec4(color, 1.0);
}
```

### 3. Simplex Noise (GLSL)

Embed a 2D/3D simplex noise function directly in the fragment shader. This is a well-known public-domain algorithm (Ashima Arts / Stefan Gustavson). No external texture needed.

Key noise calls in the shader:
- **Background flow**: `snoise(vec3(uv * 4.0, u_time * speed))` — organic flowing movement
- **Distortion offset**: `snoise(uv * scale + time)` — warps UV coordinates
- **Multi-octave layering**: Stack 2-3 noise calls at different scales for richer visuals

### 4. Shape Patterns (Checks, Stripes, Edge)

Computed in the fragment shader before color blending:

```glsl
float shapePattern(vec2 uv, float shape, float size) {
  float s = size * 0.1; // normalize 0-100 to 0-10
  if (shape < 0.5) {
    // Checks
    return mod(floor(uv.x * s) + floor(uv.y * s), 2.0);
  } else if (shape < 1.5) {
    // Stripes
    return mod(floor(uv.x * s), 2.0);
  } else {
    // Edge — distance from center
    return length(uv - 0.5) * s;
  }
}
```

The pattern value modulates the noise distortion and color proportion, creating structured organic effects.

### 5. Swirl Effect

Applied as a UV coordinate transformation before sampling:

```glsl
vec2 applySwirl(vec2 uv, float intensity, float iterations) {
  vec2 center = vec2(0.5);
  vec2 delta = uv - center;
  float dist = length(delta);
  float angle = dist * intensity * 0.1;

  for (float i = 0.0; i < 20.0; i++) {
    if (i >= iterations) break;
    float a = angle * (1.0 - i / iterations);
    mat2 rot = mat2(cos(a), -sin(a), sin(a), cos(a));
    delta = rot * delta;
  }

  return center + delta;
}
```

### 6. Animation Loop

The JavaScript side drives the animation by updating `u_time` each frame:

```typescript
const startTime = performance.now();
let animId: number;

function render() {
  const elapsed = (performance.now() - startTime) / 1000 + offset;
  gl.uniform1f(uniforms.u_time, elapsed);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  animId = requestAnimationFrame(render);
}

animId = requestAnimationFrame(render);

// Cleanup:
return () => cancelAnimationFrame(animId);
```

### 7. Noise Overlay (CSS / SVG filter)

If the `noise` prop is provided, render an overlay div on top of the canvas:

```tsx
{noise && (
  <div
    className="pointer-events-none absolute inset-0"
    style={{
      opacity: noise.opacity,
      backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
        `<svg xmlns='http://www.w3.org/2000/svg' width='${noise.scale ?? 200}' height='${noise.scale ?? 200}'>
          <filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter>
          <rect width='100%' height='100%' filter='url(#n)' opacity='1'/></svg>`
      )}")`,
    }}
  />
)}
```

This uses an inline SVG `feTurbulence` filter as a data URI — no external asset needed. Same CSS-only philosophy as the PerspectiveBook texture.

### 8. Presets Dictionary

Each preset is a `CustomGradientConfig` with `preset` overridden:

```typescript
const PRESETS: Record<PresetName, Omit<CustomGradientConfig, "preset">> = {
  Prism: {
    color1: "#e73c7e",
    color2: "#23a6d5",
    color3: "#23d5ab",
    rotation: 30,
    speed: 25,
    swirl: 60,
    distortion: 15,
    proportion: 40,
    scale: 1,
    swirlIterations: 8,
    softness: 100,
    offset: 0,
    shape: "Checks",
    shapeSize: 10,
  },
  Sunset: {
    color1: "#ff6b35",
    color2: "#f7c59f",
    color3: "#1a0a2e",
    rotation: -15,
    speed: 20,
    swirl: 40,
    distortion: 10,
    proportion: 50,
    scale: 1.2,
    swirlIterations: 6,
    softness: 100,
    offset: 0,
    shape: "Stripes",
    shapeSize: 15,
  },
  Ocean: {
    color1: "#0077b6",
    color2: "#00b4d8",
    color3: "#90e0ef",
    rotation: 0,
    speed: 15,
    swirl: 80,
    distortion: 20,
    proportion: 35,
    scale: 1,
    swirlIterations: 12,
    softness: 100,
    offset: 0,
    shape: "Edge",
    shapeSize: 8,
  },
  Aurora: {
    color1: "#0d1b2a",
    color2: "#1b998b",
    color3: "#a3f7bf",
    rotation: 45,
    speed: 18,
    swirl: 70,
    distortion: 25,
    proportion: 30,
    scale: 1.5,
    swirlIterations: 10,
    softness: 90,
    offset: 0,
    shape: "Checks",
    shapeSize: 12,
  },
  Ember: {
    color1: "#2d0000",
    color2: "#ff4500",
    color3: "#ffd700",
    rotation: -30,
    speed: 30,
    swirl: 50,
    distortion: 18,
    proportion: 45,
    scale: 1,
    swirlIterations: 8,
    softness: 100,
    offset: 0,
    shape: "Stripes",
    shapeSize: 10,
  },
  Midnight: {
    color1: "#0D0D21",
    color2: "#1a1a3e",
    color3: "#4a148c",
    rotation: 0,
    speed: 10,
    swirl: 90,
    distortion: 8,
    proportion: 35,
    scale: 1,
    swirlIterations: 14,
    softness: 100,
    offset: 0,
    shape: "Checks",
    shapeSize: 6,
  },
  Forest: {
    color1: "#0b3d0b",
    color2: "#228b22",
    color3: "#90ee90",
    rotation: 20,
    speed: 12,
    swirl: 55,
    distortion: 14,
    proportion: 40,
    scale: 1.3,
    swirlIterations: 9,
    softness: 100,
    offset: 0,
    shape: "Edge",
    shapeSize: 10,
  },
  Neon: {
    color1: "#0D0D21",
    color2: "#ff00ff",
    color3: "#00ffff",
    rotation: 60,
    speed: 35,
    swirl: 45,
    distortion: 22,
    proportion: 50,
    scale: 1,
    swirlIterations: 7,
    softness: 80,
    offset: 0,
    shape: "Stripes",
    shapeSize: 14,
  },
};
```

> **Note:** "Midnight" uses the YDEX dark theme color `#0D0D21` as its base — ideal for blending with the app background.

### 9. React Integration

```tsx
'use client';

import React, { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

export default function AnimatedGradient({
  config = { preset: 'Prism' },
  noise,
  radius = '0px',
  className,
  style,
}: AnimatedGradientProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGL2RenderingContext | null>(null);
  const animRef = useRef<number>(0);

  // Resolve config: preset → full config
  const resolvedConfig = useMemo(() => {
    if (config.preset === 'custom') return config;
    return { preset: 'custom' as const, ...PRESETS[config.preset] };
  }, [config]);

  // WebGL setup (runs once)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false });
    if (!gl) {
      console.warn('[AnimatedGradient] WebGL2 not supported');
      return;
    }
    glRef.current = gl;

    // Compile shaders, create program, get uniform locations
    // ... (shader compilation utility)

    // Create full-screen quad
    const vertices = new Float32Array([-1,-1, 1,-1, -1,1, 1,1]);
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    return () => {
      cancelAnimationFrame(animRef.current);
      gl.deleteBuffer(buf);
      gl.deleteVertexArray(vao);
      // gl.deleteProgram(program);
    };
  }, []);

  // Canvas resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      const dpr = Math.min(window.devicePixelRatio, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      glRef.current?.viewport(0, 0, canvas.width, canvas.height);
    });
    ro.observe(canvas);
    return () => ro.disconnect();
  }, []);

  // Animation loop (re-runs when config changes)
  useEffect(() => {
    const gl = glRef.current;
    if (!gl) return;

    // Update uniforms from resolvedConfig
    // ... set colors, rotation, speed, etc.

    const startTime = performance.now();

    function render() {
      const elapsed = (performance.now() - startTime) / 1000
        + (resolvedConfig.offset ?? 0) * 0.01;
      // gl.uniform1f(u_time, elapsed);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animRef.current);
  }, [resolvedConfig]);

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      style={{ borderRadius: radius, ...style }}
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
      />

      {/* Optional noise overlay */}
      {noise && (
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            opacity: noise.opacity,
            backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(
              `<svg xmlns='http://www.w3.org/2000/svg' width='${noise.scale ?? 200}' height='${noise.scale ?? 200}'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(#n)'/></svg>`
            )}")`,
          }}
        />
      )}
    </div>
  );
}
```

---

## Validation Notes (Codebase Audit — 2026-03-06)

### Dependencies — All Available
| Dependency | Status | Notes |
|---|---|---|
| `cn()` utility | Available | `src/lib/utils.ts` — `twMerge(clsx(...))` |
| `clsx` + `tailwind-merge` | Installed | In `package.json` |
| WebGL2 | Browser API | No npm package needed |

### No New Dependencies Required
This component is self-contained — no external shader libraries, no Three.js, no additional npm packages. The simplex noise GLSL function is embedded directly in the shader source string.

### Codebase Context
- **First WebGL component** in YDEX — no existing WebGL usage found
- Existing Canvas usage is limited to 2D image compression in `AppearanceContext.tsx`
- Framer Motion v12.33.0 is available but not needed for this (GPU animation is faster)
- 28 existing components in `src/components/ui/` — correct target location
- Tailwind v4 — all sizing/layout via Tailwind, WebGL via inline canvas (no CSS conflicts)

### Performance Best Practices
| Practice | Implementation |
|---|---|
| SVG wrapper rule | N/A — using `<canvas>`, not SVG. Animations are GPU-native |
| DPR capping | `Math.min(devicePixelRatio, 2)` — prevents 3x/4x Retina overdraw |
| ResizeObserver | Canvas resizes reactively, no polling |
| requestAnimationFrame | Proper cleanup via `cancelAnimationFrame` on unmount |
| `will-change: auto` | Canvas elements are automatically GPU-composited |
| `antialias: false` | Faster shader execution, gradients don't need AA |
| Config memoization | `useMemo` prevents re-resolving presets on every render |

### WebGL2 Fallback
If `canvas.getContext('webgl2')` returns null (rare — WebGL2 has 97%+ browser support), the component logs a warning and renders nothing. A future enhancement could add a CSS gradient fallback.

---

## Usage Examples

### Basic Preset
```tsx
<div className="relative h-[300px] w-full">
  <AnimatedGradient config={{ preset: "Prism" }} />
  <div className="relative z-10">Your content here</div>
</div>
```

### Custom Dark Theme Background
```tsx
<AnimatedGradient
  config={{
    preset: "custom",
    color1: "#0D0D21",
    color2: "#1a1a3e",
    color3: "#4a148c",
    rotation: 0,
    speed: 10,
    swirl: 90,
    distortion: 8,
  }}
  noise={{ opacity: 0.15, scale: 300 }}
  radius="0px"
  className="absolute inset-0"
/>
```

### Card Background with Rounded Corners
```tsx
<div className="relative w-80 h-48 overflow-hidden">
  <AnimatedGradient
    config={{ preset: "Neon" }}
    radius="12px"
    noise={{ opacity: 0.1 }}
  />
  <div className="relative z-10 p-6 text-white">
    <h2>Card Title</h2>
    <p>Content overlays the gradient</p>
  </div>
</div>
```

---

## Potential YDEX Integration Points

| Location | Use Case | Preset |
|---|---|---|
| `LoadingScreen.tsx` | Replace static background with animated gradient during logo phase | Midnight |
| `WelcomeScreen.tsx` | Ambient animated background behind welcome text | Aurora |
| `Web3Hub.tsx` | Subtle gradient accent behind topic cards grid | Ocean |
| `CardWithCornerShine.tsx` | Optional gradient fill mode for premium cards | Neon |
| `AppBackground.tsx` | New background mode: "Animated Gradient" (alongside default/custom/color) | Any preset |

---

## Files to Create
1. **CREATE** `src/components/ui/animated-gradient.tsx` — Core component with WebGL2 + GLSL shader

## Implementation Steps
1. **Create** the simplex noise GLSL source as a string constant
2. **Create** the vertex + fragment shader source strings
3. **Build** WebGL2 setup helper (compile, link, get uniforms)
4. **Define** PRESETS dictionary
5. **Build** the React component with canvas ref, resize observer, animation loop
6. **Add** CSS noise overlay layer
7. **Export** as default from the file
8. **Test** across Chrome, Safari, Firefox — verify smooth 60fps animation
