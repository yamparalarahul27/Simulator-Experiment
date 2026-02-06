# Frontend UI/UX Guidelines

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Library**: React 19
- **Styling**: Tailwind CSS v4
- **Language**: TypeScript

## Design System

### Philosophy
- **Premium**: "Premium", "Dynamic", "Vibrant". Avoid generic Bootstrap-like looks.
- **Theme**: Dark mode default, suitable for financial/trading dashboards.

### Color Palette
- **Brand Colors**:
  - Primary: `#2E2F5F`
  - Secondary: `#605CA8`
  - Accent: `#8C83E9` (vibrant purple)
  - Gradient Mid: `#705BE3`
- **UI Colors**:
  - Background Dark: `#0D0D21`
  - Background Light: `#BABACE`
  - Border: `#7C8EAA`
- **Text Colors**:
  - Primary (off-white): `#EDEDED` (WCAG compliant on dark backgrounds)
  - Dark: `#040515` (use ONLY on light backgrounds)
  - Muted: `#7C8EAA`

### Typography
- **Font Family**: **Geist Mono** (monospaced)
  - Technical aesthetic suitable for trading/financial dashboards
  - Applied globally via `body` element in `globals.css`
  - Loaded via Next.js Google Fonts integration in `layout.tsx`

#### Type Scale System
The app uses the **Geist Typography Scale** with semantic utility classes:

**1. Headings** (`text-heading-*`) - For titles and headers
- Hero sizes: `72, 64, 56, 48, 40`
- Standard: `32, 24, 20`
- Small: `16, 14`

**2. Buttons** (`text-button-*`) - For clickable elements only
- Sizes: `16, 14, 12`

**3. Labels** (`text-label-*`) - Single-line text (tags, metadata, form labels)
- Sizes: `20, 18, 16, 14, 13, 12`
- Mono variants: `14-mono, 13-mono, 12-mono`

**4. Copy** (`text-copy-*`) - Multi-line paragraphs and body text
- Sizes: `24, 20, 18, 16, 14, 13`
- Mono variant: `13-mono`

**Usage:** Apply as Tailwind classes: `className="text-heading-32"`. Use `<strong>` for bold variants.


### Layout & Background
- **Background**: Fixed gradient wallpaper (`/assets/background.png`)
  - `background-size: cover`
  - `background-attachment: fixed`
  - `background-position: center center`

### Components
- Located in `src/components/`
- Must use functional components with TypeScript interfaces
- Core components:
  - `TabNavigation.tsx`: Main navigation
  - `OrdersTable.tsx`: Data display
  - `LoadingScreen.tsx`: Initial loading animation with logo
  - `DeriverseLogo.tsx`: Animated SVG logo component

## Tools & Utilities
- **Agentation**: Installed in development mode (`process.env.NODE_ENV === "development"`).
    - Use this for visual bug reporting and pixel-perfect tweaks.
    - Located in the bottom-right corner of the screen in dev.

## Best Practices
- **Responsiveness**: Mobile-first design using Tailwind breakpoints.
- **Performance**: Use server components where fetching isn't interactive; use client components (`"use client"`) for interaction (forms, buttons).
- **Icons**: `lucide-react` for consistent iconography.
