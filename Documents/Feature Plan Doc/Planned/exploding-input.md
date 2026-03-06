# Exploding Input Component — Implementation Plan

## Overview
A playful UI component (`ExplodingInput`) that spawns animated particles (like emojis, SVGs, or text nodes) whenever a user types into an associated input field. Based on the provided component API, it acts as a sibling or wrapper element that attaches event listeners to a target input and uses animation/physics logic to render bursting particles.

## Target File Structure
- `src/components/ui/exploding-input.tsx` (Core Component)
- `src/components/ui/demo.tsx` (Example Usage)

---

## Component API (`ExplodingInput`)

### Props Interface

```typescript
import { ReactNode, CSSProperties } from "react";

export interface ExplodingInputProps {
  /** Array of React nodes to render as particles */
  content?: ReactNode[];
  /** Number of particles to spawn per input event (1-5) */
  count?: number;
  /** Direction of the particle burst */
  direction?: {
    horizontal: 'left' | 'center' | 'right';
    vertical: 'top' | 'center' | 'bottom';
  };
  /** Gravity value from -1 to 1 (negative = upward) */
  gravity?: number;
  /** Duration of particle animation in seconds */
  duration?: number;
  /** Scale configuration */
  scale?: {
    value: number;
    randomize: boolean;
    randomVariation: number; // percentage (0-100)
  };
  /** Rotation configuration */
  rotation?: {
    value: number;
    animate: boolean;
  };
  /** CSS classes for the container */
  className?: string;
  /** Custom styles for the container */
  style?: CSSProperties;
}
```

---

## Technical Implementation Details

### 1. Connecting to the Input Element
The example usage shows `<ExplodingInput>` as a sibling to `<input>` inside a `<label>`. 
To trigger explosions on typing:
- The `ExplodingInput` will use a React `ref` to find its parent node (the `<label>`).
- On mount, it searches for an `<input>` element within the parent.
- It attaches an `input`, `keydown`, or `keyup` event listener to that input to detect typing.
- When the event fires, it spawns particles.

### 2. Particle State Management
We need to manage a dynamic array of particles in React state.
- **Particle Object:** `{ id: string, node: ReactNode, x: number, y: number, vx: number, vy: number, rotation: number, scale: number, opacity: number, createdAt: number }`
- **Spawn Logic:** On keystroke, push `count` new particles into the state array. Assign each particle a random initial velocity (`vx`, `vy`) based on the `direction` prop.
- **Cleanup:** Particles should remove themselves from the state array after their `duration` expires to avoid memory leaks. An internal `setTimeout` or animation loop cleanup can handle this.

### 3. Animation Engine (Physics)
To animate the particles falling/rising with gravity, there are two primary approaches:
- **Framer Motion (Recommended):** Use `AnimatePresence` and `motion.div`. It handles entrance/exit animations automatically. We can use the layout and transition APIs to animate the particles moving to a target X/Y coordinate or use keyframes for the gravity arc.
- **Pure CSS/JS RequestAnimationFrame:** Use an internal `requestAnimationFrame` loop that updates the `x` and `y` coordinates of all active particles by applying velocity, factoring in the `gravity` prop, and triggering a re-render. Alternatively, calculate the trajectory once upon creation and apply it via CSS keyframes/transitions (`transform: translate(x, y)`). 

**Recommended Approach:** Calculate randomized CSS Custom Variables (`--x`, `--y`, `--r` for rotation) and CSS keyframe animations for maximum performance, as React state re-renders at 60fps for dozens of particles can cause input lag.

### 4. Code Skeleton (CSS Animation Approach)

```tsx
import React, { useEffect, useRef, useState, useId } from "react";
import { cn } from "@/lib/utils";

interface Particle {
  id: string;
  element: React.ReactNode;
  duration: number;
  // randomized translation goals
  tvx: number; 
  tvy: number;
  rotation: number;
  scale: number;
}

export function ExplodingInput({
  content = ["✨", "💥"],
  count = 1,
  direction = { horizontal: "center", vertical: "top" },
  gravity = 0.7,
  duration = 3,
  scale = { value: 1, randomize: false, randomVariation: 50 },
  rotation = { value: 0, animate: false },
  className,
  style,
}: ExplodingInputProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [particles, setParticles] = useState<Particle[]>([]);
  const internalId = useId();

  // 1. Hook into the sibling input
  useEffect(() => {
    if (!containerRef.current) return;
    const parent = containerRef.current.parentElement;
    if (!parent) return;

    const input = parent.querySelector("input");
    if (!input) return;

    const handleInput = () => {
      // Spawn logic
      const newParticles: Particle[] = Array.from({ length: count }).map(() => {
        // Randomize physics based on props
        const baseVy = direction.vertical === "top" ? -100 : direction.vertical === "bottom" ? 100 : 0;
        const baseVx = direction.horizontal === "left" ? -100 : direction.horizontal === "right" ? 100 : 0;
        
        return {
          id: `${internalId}-${Date.now()}-${Math.random()}`,
          element: content[Math.floor(Math.random() * content.length)],
          duration,
          tvx: baseVx + (Math.random() - 0.5) * 100, // random spread
          tvy: baseVy + (Math.random() - 0.5) * 100,
          rotation: rotation.animate ? Math.random() * 360 : rotation.value,
          scale: scale.randomize ? scale.value * (1 + (Math.random() - 0.5) * (scale.randomVariation / 100)) : scale.value,
        };
      });

      setParticles((prev) => [...prev, ...newParticles]);

      // Cleanup timeout
      setTimeout(() => {
        setParticles((prev) => prev.filter(p => !newParticles.find(n => n.id === p.id)));
      }, duration * 1000);
    };

    input.addEventListener("input", handleInput);
    return () => input.removeEventListener("input", handleInput);
  }, [content, count, direction, duration, scale, rotation, internalId]);

  return (
    <div
      ref={containerRef}
      className={cn("absolute pointer-events-none inset-0", className)}
      style={style}
    >
      {particles.map((p) => (
        <ParticleRenderer key={p.id} particle={p} gravity={gravity} />
      ))}
    </div>
  );
}

// Separate component for individual particle logic 
function ParticleRenderer({ particle, gravity }: { particle: Particle, gravity: number }) {
  // Uses pure CSS animations to prevent React state tick lag on rapid typing
  return (
    <div
      className="absolute left-1/2 top-1/2 opacity-0 animate-particle-burst"
      style={{
        "--tx": `${particle.tvx}px`,
        "--ty": `${particle.tvy}px`,
        "--gravity": `${gravity * 200}px`, // Add pull down/up
        "--rot": `${particle.rotation}deg`,
        transform: `scale(${particle.scale})`,
        animationDuration: `${particle.duration}s`,
        animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
      } as React.CSSProperties}
    >
      {particle.element}
    </div>
  );
}
```

### 5. Required CSS Additions (`globals.css` or `tailwind.config`)
A custom Tailwind animation `animate-particle-burst` needs to be defined in your config, mapping to a keyframe sequence that handles the parabola, rotation, and fade out.

```css
@keyframes particle-burst {
  0% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 1;
  }
  10% {
    opacity: 1;
  }
  100% {
    transform: translate(calc(-50% + var(--tx)), calc(-50% + var(--ty) + var(--gravity))) scale(0) rotate(var(--rot));
    opacity: 0;
  }
}
```

---

## Integration Steps

1. **Create Component:** Save the core logic into `src/components/ui/exploding-input.tsx`.
2. **Tailwind Config / Global CSS:** Add the `@keyframes particle-burst` logic.
3. **Container Context:** The component expects to be placed inside a container (like `<label>`) with `position: relative` so the absolute positioning anchors correctly behind/over the actual `<input>`.
4. **Create Examples:** Build `demo.tsx` using the spooky emojis as requested in the inspiration block.
