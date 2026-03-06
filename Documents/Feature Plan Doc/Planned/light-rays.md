# Light Rays Component — Implementation Plan

## Overview
A dynamic background UI component (`Rays`) that renders volumetric light rays emitting from a radial source. It supports custom colors, animations, multi-color gradients, and variable intensities.

Based on the provided component API, it functions as an absolute or relative background element designed to sit behind content (like Hero sections or interactive cards) while adding a cinematic lighting effect.

## Target File Structure
- `src/components/ui/light-rays.tsx` (Core Component)
- `src/components/ui/demo.tsx` (Example Usage - Single Color)
- `src/components/ui/demo-multi.tsx` (Example Usage - Multi Color)

---

## Component API (`Rays`)

### Props Interface

```typescript
import { CSSProperties } from "react";

export interface RaysProps {
  /** Brightness intensity of the rays (0-100) */
  intensity?: number;
  /** Number of light rays */
  rays?: number;
  /** How far the rays extend */
  reach?: number;
  /** Horizontal position of the light source (0-100) */
  position?: number;
  /** Border radius of the container */
  radius?: string;
  /** Background color of the canvas */
  backgroundColor?: string;
  /** Animation configuration */
  animation?: {
    animate: boolean;
    speed: number;
  };
  /** Color configuration for rays (single, multi gradient, or random) */
  raysColor?: 
    | { mode: "single"; color: string }
    | { mode: "multi"; color1: string; color2: string }
    | { mode: "random" };
  /** Additional CSS classes */
  className?: string;
  /** Additional inline styles */
  style?: CSSProperties;
}
```

---

## Technical Implementation Details

### 1. Structure and Container
The `Rays` component will use an `overflow-hidden` container so the rays do not bleed out of the specified area.
The `position` prop dictates the `left` percentage of the radial origin (e.g., `position={50}` places the light source dead center top/bottom depending on the mask).

### 2. Ray Generation & SVG vs CSS
Given the need for a specific number of rays (`rays={32}`) and the need to rotate them, we will use a loop in React to generate individual ray elements (either standard `div` elements or `<svg>` polygons).
- **CSS `conic-gradient` approach:** We could use a `conic-gradient` mask, but animating individual rays is harder.
- **Individual Elements approach (Recommended):** Generate `N` divs positioned absolutely at the origin, rotated by `(360 / N) * i` degrees. Scale their height based on the `reach` prop.

### 3. Masking & Fading (The "Reach")
To make the rays look like light instead of solid spokes, we apply a `mask-image: radial-gradient(...)` to the parent container. 
This will ensure the rays are bright at the origin and fade out smoothly into transparency as they extend toward the `reach` value.

### 4. Color Handling (`raysColor` Prop)
- **Single:** All ray elements inherit the same `color` value.
- **Multi:** Rays alternate between `color1` and `color2`, or are colored via a CSS custom property gradient that spans across the elements.
- **Random:** Each generated ray assigns itself a random HSL color value on mount.

### 5. Animation (`animation` Prop)
The `animation.animate` boolean will toggle a Tailwind CSS keyframe animation (`animate-spin-slow` or a custom arbitrary animation).
The `animation.speed` prop will dynamically generate an inline style for `animationDuration: ${100 / speed}s`. This makes the entire wheel of rays rotate slowly like a lighthouse or volumetric spotlight.

### 6. Code Skeleton

```tsx
import React, { useMemo } from "react";
import { cn } from "@/lib/utils";

type RayColorConfig =
  | { mode: "single"; color: string }
  | { mode: "multi"; color1: string; color2: string }
  | { mode: "random" };

export interface RaysProps {
  intensity?: number; // 0-100
  rays?: number; // count
  reach?: number; // size scaling
  position?: number; // 0-100 x-axis
  radius?: string;
  backgroundColor?: string;
  animation?: { animate: boolean; speed: number };
  raysColor?: RayColorConfig;
  className?: string;
  style?: React.CSSProperties;
}

export default function Rays({
  intensity = 13,
  rays = 32,
  reach = 16,
  position = 50,
  radius = "0px",
  backgroundColor = "#000",
  animation = { animate: true, speed: 10 },
  raysColor = { mode: "single", color: "#639AFF" },
  className,
  style,
}: RaysProps) {
  
  // Calculate duration based on speed prop
  const animDuration = animation.animate ? `${100 / animation.speed}s` : "0s";
  const opacity = intensity / 100;

  // Generate the rays
  const generatedRays = useMemo(() => {
    return Array.from({ length: rays }).map((_, i) => {
      const rotation = (360 / rays) * i;
      
      let colorToApply = "#fff";
      if (raysColor.mode === "single") colorToApply = raysColor.color;
      if (raysColor.mode === "multi") {
         colorToApply = i % 2 === 0 ? raysColor.color1 : raysColor.color2;
      }
      if (raysColor.mode === "random") {
         colorToApply = `hsl(${Math.random() * 360}, 100%, 70%)`;
      }

      return (
        <div
          key={i}
          className="absolute origin-bottom"
          style={{
            bottom: "50%",
            left: "50%",
            width: "4px", // Ray thickness
            height: `${reach * 10}%`,
            background: `linear-gradient(to top, transparent, ${colorToApply})`,
            transform: `translateX(-50%) rotate(${rotation}deg)`,
            filter: "blur(4px)", // Makes it look less solid
          }}
        />
      );
    });
  }, [rays, reach, raysColor]);

  return (
    <div
      className={cn("absolute inset-0 overflow-hidden pointer-events-none", className)}
      style={{
        borderRadius: radius,
        backgroundColor,
        ...style,
      }}
    >
      <div
        className="absolute w-[200%] h-[200%]"
        style={{
          left: `${position}%`,
          top: "50%", // Center light source vertically 
          transform: "translate(-50%, -50%)",
          maskImage: "radial-gradient(circle at center, black 0%, transparent 50%)",
          WebkitMaskImage: "radial-gradient(circle at center, black 0%, transparent 50%)",
          opacity: opacity,
        }}
      >
        <div
          className={cn("relative w-full h-full", animation.animate && "animate-spin")}
          style={{
            animationDuration: animDuration,
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
          }}
        >
          {generatedRays}
        </div>
      </div>
    </div>
  );
}
```

---

## Integration Steps

1. **Install Dependencies**: `clsx` and `tailwind-merge` (`cn` utility) must exist (they do in this project).
2. **Implement Component**: Save the core logic into `src/components/ui/light-rays.tsx`.
3. **Tailwind Config**: Ensure standard animations work. The standard `animate-spin` is sufficient since we override the `animationDuration` inline via the `speed` prop.
4. **Create Examples**: 
    - Build `demo.tsx` using the default blue single color.
    - Build `demo-multi.tsx` passing `{ mode: "multi", color1: "#FF0000", color2: "#0000FF" }`.
5. **Usage Context**: Warn developers to ensure the parent container holding `<Rays />` is set to `position: relative` (`relative`) and the content overlaying it has a defined `z-index` (e.g. `z-10 relative`).
