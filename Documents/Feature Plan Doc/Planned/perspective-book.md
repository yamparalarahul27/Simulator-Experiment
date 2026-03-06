# Perspective Book Component — Implementation Plan

## Overview
A reusable 3D UI component (`PerspectiveBook`) that presents content as a physical book. It leverages CSS 3D transforms (`perspective`, `rotateX`, `rotateY`) to create depth and can include dynamic texturing.

Based on the provided component API, it functions as a highly stylized card wrapper.

## Target File Structure
- `src/components/ui/perspective-book.tsx` (Core Component)
- `src/components/ui/demo.tsx` (Example Usage without Texture)
- `src/components/ui/demo-textured.tsx` (Example Usage with Texture)

---

## Component API (`PerspectiveBook`)

### Props Interface

```typescript
import { ReactNode } from "react";

export interface PerspectiveBookProps {
  children?: ReactNode;
  /** Size of the book */
  size?: "sm" | "default" | "lg";
  /** CSS classes for styling the book cover (e.g., bg-amber-500) */
  className?: string;
  /** Adds a realistic book texture overlay to the cover */
  textured?: boolean;
}
```

---

## Technical Implementation Details

### 1. 3D CSS Structure
The component will be built using a parent wrapper with `perspective` applied, containing nested divs for the book's physical dimensions:
- **Wrapper (`perspective-wrapper`)**: Applies `perspective: 1000px` to give 3D depth to the rotation.
- **Book Container (`book-container`)**: Holds the 3D transforms (`transform-style: preserve-3d`) and handles hover interactions. By default, it will be slightly rotated (e.g., `rotateX(15deg) rotateY(-20deg)`) to show the spine and pages. On hover, it can smoothly tilt toward the user.
- **Cover Face**: The front face holding the `children` and receiving the `className` for background colors.
- **Spine Face**: The left edge of the book (`transform: rotateY(-90deg)`). The background color here should be slightly darkened (`brightness-75` or overlay) to simulate shading.
- **Pages Face**: The right and bottom edges, styled with a white or off-white repeating linear gradient to simulate stacked paper sheets.

### 2. The `textured` Prop
If `textured={true}`, a pseudo-element or absolute overlay will be rendered on top of the cover.
- Use a CSS-only noise pattern via `repeating-linear-gradient` (mixed with opacity and blend modes like `mix-blend-mode: multiply` or `overlay`) to simulate a distressed or canvas book cover texture.
- No external SVG asset needed — pure CSS approach.

### 3. Sizing (`size` Prop)
We will map the `size` prop to predefined Tailwind height/width classes using `cva` from `class-variance-authority` (v0.7.1, already installed):
- `sm`: e.g., `w-40 h-56` (160x224px)
- `default`: e.g., `w-56 h-72` (224x288px)
- `lg`: e.g., `w-72 h-96` (288x384px)

The book depth (spine width) will also scale proportionally to the size.

### 4. Code Skeleton

```tsx
import React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const bookVariants = cva(
  "relative transition-transform duration-500 will-change-transform",
  {
    variants: {
      size: {
        sm: "w-40 h-56",
        default: "w-56 h-72",
        lg: "w-72 h-96",
      },
    },
    defaultVariants: {
      size: "default",
    },
  }
);

export function PerspectiveBook({
  children,
  size = "default",
  className,
  textured = false,
}: PerspectiveBookProps) {
  return (
    <div className="group relative" style={{ perspective: "1000px" }}>
      <div
        className={cn(bookVariants({ size }))}
        style={{
          transformStyle: "preserve-3d",
          transform: "rotateX(15deg) rotateY(-25deg)",
          transition: "transform 0.5s ease",
        }}
      >
        {/* Pages (Right Edge) */}
        <div
          className="absolute right-0 top-1 bottom-1 w-6 bg-white border-r border-[#e0e0e0] shadow-[inset_0_0_10px_rgba(0,0,0,0.1)]"
          style={{
            transform: "translateX(100%) rotateY(90deg)",
            transformOrigin: "left",
          }}
        />

        {/* Spine (Left Edge) */}
        <div
          className={cn("absolute left-0 top-0 bottom-0 w-6 brightness-75", className)}
          style={{
            transform: "translateX(-100%) rotateY(-90deg)",
            transformOrigin: "right",
          }}
        />

        {/* Front Cover */}
        <div className={cn("absolute inset-0 border border-white/10 shadow-xl overflow-hidden rounded-r-md", className)}>

          {/* Texture Overlay (CSS-only noise) */}
          {textured && (
            <div
              className="pointer-events-none absolute inset-0 opacity-30 mix-blend-multiply"
              style={{
                backgroundImage: `repeating-linear-gradient(
                  45deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.03) 2px,
                  rgba(0,0,0,0.03) 4px
                ), repeating-linear-gradient(
                  -45deg,
                  transparent,
                  transparent 2px,
                  rgba(0,0,0,0.02) 2px,
                  rgba(0,0,0,0.02) 4px
                )`,
              }}
            />
          )}

          {/* Content */}
          <div className="relative z-10 p-6 h-full">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
```

---

## Validation Notes (Codebase Audit — 2026-03-06)

### Dependencies — All Available
| Dependency | Status | Version |
|---|---|---|
| `class-variance-authority` | Installed | v0.7.1 (used in `button.tsx`) |
| `cn()` utility | Available | `src/lib/utils.ts` — `twMerge(clsx(...))` |
| `clsx` + `tailwind-merge` | Installed | In `package.json` |

### CSS Compatibility Fixes (Tailwind v4)
The project uses **Tailwind v4** (not v3+ as originally assumed). Three classes in the original skeleton are not valid:

| Original Class | Issue | Fix |
|---|---|---|
| `preserve-3d` | Not a default Tailwind v4 utility | Use `style={{ transformStyle: 'preserve-3d' }}` |
| `rotate-y-90`, `-rotate-y-90` | Not valid Tailwind v4 classes | Use `style={{ transform: 'rotateY(90deg)' }}` |
| `bg-[url('/assets/noise.svg')]` | `/assets/noise.svg` does not exist in the project | Use CSS-only `repeating-linear-gradient` pattern |

### Additional Notes
- This will be the **first 3D CSS component** in the YDEX codebase — no existing `perspective` or `preserve-3d` usage found.
- `src/components/ui/` directory has 27 existing components — correct target location.
- No `tailwind.config.ts` exists (v4 uses PostCSS plugin + `@theme inline` in globals.css).

---

## Integration Target: Web3Hub Page

### Current State
**File:** `src/components/features/Web3Hub.tsx`

The Web3 page renders 6 educational topic cards in a responsive grid (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3`). Each card is a flat `bg-black` div with title, badge, and description.

### Goal
**Layout: Book Left, Text Right** — each card becomes a horizontal flex row with a small 3D PerspectiveBook thumbnail on the left and the topic title + description on the right. The `TOPICS` data array stays unchanged.

### UI Structure (ASCII Mockup)

```text
┌───────────────────────────────────────────────────────────────────┐
│  grid-cols-1 md:grid-cols-2 lg:grid-cols-3                       │
│                                                                   │
│  ┌──────────────────────────┐ ┌──────────────────────────┐       │
│  │ ┌────────┐               │ │ ┌────────┐               │       │
│  │ │╱╱╱╱╱╱╱╱│ What is a DEX?│ │ │╱╱╱╱╱╱╱╱│ Wallets & Keys│       │
│  │ │╱What is╱│ ─────────     │ │ │╱Wallets╱│ ──────────    │       │
│  │ │╱a DEX? ╱│ CEX vs DEX,  │ │ │╱& Keys ╱│ Public/priv   │       │
│  │ ├────────┘ how AMMs...   │ │ ├────────┘ keys, dApps   │       │
│  │ │spine│         [Soon]   │ │ │spine│         [Soon]   │       │
│  └──────────────────────────┘ └──────────────────────────┘       │
│   ↑ textured + title on cover                                    │
│                                                                   │
│  ┌──────────────────────────┐ ┌──────────────────────────┐       │
│  │ ┌────────┐               │ │ ┌────────┐               │       │
│  │ │╱╱╱╱╱╱╱╱│ Order Types   │ │ │╱╱╱╱╱╱╱╱│ Risk Mgmt     │       │
│  │ │╱ Order ╱│ ─────────     │ │ │╱  Risk ╱│ ──────────    │       │
│  │ │╱ Types ╱│ Market, Limit │ │ │╱  Mgmt ╱│ Position      │       │
│  │ ├────────┘ Stop, OCO...  │ │ ├────────┘ sizing, SL... │       │
│  │ │spine│         [Soon]   │ │ │spine│         [Soon]   │       │
│  └──────────────────────────┘ └──────────────────────────┘       │
│                                                                   │
│  ┌──────────────────────────┐ ┌──────────────────────────┐       │
│  │ ┌────────┐               │ │ ┌────────┐               │       │
│  │ │╱╱╱╱╱╱╱╱│ Solana Eco    │ │ │╱╱╱╱╱╱╱╱│ Trading Psych │       │
│  │ │╱Solana ╱│ ──────────    │ │ │╱Trading╱│ ──────────    │       │
│  │ │╱  Eco  ╱│ Jupiter,      │ │ │╱ Psych ╱│ FOMO, revenge │       │
│  │ ├────────┘ Raydium...    │ │ ├────────┘ trading...    │       │
│  │ │spine│         [Soon]   │ │ │spine│         [Soon]   │       │
│  └──────────────────────────┘ └──────────────────────────┘       │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘

Each book cover shows: textured background + topic title as children.
The `children` prop renders above the texture overlay (z-10).
No API change needed — `textured` and `children` already coexist.
```

### Planned Integration

```tsx
import { PerspectiveBook } from '@/components/ui/perspective-book';

// Inside the grid mapping:
{TOPICS.map((topic) => (
    <div
        key={topic.title}
        className="bg-black border border-white/10 p-5 flex items-center gap-5
                   hover:border-white/20 transition-colors"
    >
        {/* Book thumbnail (left) — title on cover + texture overlay */}
        <PerspectiveBook size="sm" className="bg-black" textured>
            <span className="text-[10px] font-mono font-bold text-white/70 leading-tight">
                {topic.title}
            </span>
        </PerspectiveBook>

        {/* Text content (right) */}
        <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex items-center justify-between">
                <h2 className="text-base font-mono font-semibold text-white">
                    {topic.title}
                </h2>
                <span className="text-[9px] font-mono uppercase tracking-wider
                       text-purple-400/70 bg-purple-500/10 px-2 py-0.5
                       border border-purple-500/20">
                    Coming Soon
                </span>
            </div>
            <p className="text-xs font-mono text-white/40 leading-relaxed">
                {topic.description}
            </p>
        </div>
    </div>
))}
```

> **Note:** The `sm` size (`w-40 h-56`) may be too tall for a horizontal card. Consider a compact custom size or let the card's flex layout shrink-to-fit. The book should be a visual accent, not dominate the card.

### Files to Create/Modify
1. **CREATE** `src/components/ui/perspective-book.tsx` — the core component (code skeleton above)
2. **MODIFY** `src/components/features/Web3Hub.tsx` — replace flat cards with book-left, text-right layout

---

## Integration Steps

1. **Dependencies**: `class-variance-authority`, `clsx`, `tailwind-merge` — all already installed.
2. **Texture**: Using CSS-only `repeating-linear-gradient` — no external asset needed.
3. **3D Transforms**: All via inline `style` props to avoid Tailwind v4 compatibility issues.
4. **Create** `src/components/ui/perspective-book.tsx` with the corrected code skeleton.
5. **Update** `src/components/features/Web3Hub.tsx` to render `PerspectiveBook` instead of flat divs.
6. **Test** 3D rendering across Chrome and Safari. Verify hover tilt animation is smooth.
