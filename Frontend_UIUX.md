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

### Component Creation Rules

**Rule 1: Font Consistency**
- Always use the app-wide default font (Geist Mono)
- Do NOT override with `font-sans` or custom font-family
- The monospaced aesthetic is intentional for the trading platform

**Rule 2: Documentation**
- Document each component in this file under "Component Library"
- Include: Purpose, Props, Usage Example, and Key Features

**Rule 3: AI-Friendly Comments**
- Add comprehensive comments explaining component purpose
- Document animation logic, positioning, and technical decisions
- Include usage context and design philosophy
- Use structured comment blocks (PURPOSE, TECHNICAL NOTES, etc.)

### Component Library

#### CardWithCornerShine
**Location:** `src/components/CardWithCornerShine.tsx`

**Purpose:**
Premium dark-themed card component for displaying metrics, statistics, and interactive content. Features glowing L-shaped corner brackets that animate on hover for a high-tech aesthetic.

**Key Features:**
- **Transparent background by default** (configurable opacity: 0-100%)
  - Default: `bgOpacity = 0` (fully transparent)
  - Explicit `bg-black/0` class ensures proper transparent rendering
  - Set `bgOpacity={80}` or higher for semi-transparent dark background
- Four corner accent brackets with glow animation
- Smooth 300ms transitions on all interactive elements
- Configurable padding presets (sm: 16px, md: 24px, lg: 32px)
- Optional hover shadow effect
- Optional click handler for interactivity

**Props:**
```typescript
interface CardWithCornerShineProps {
  children: ReactNode;           // Card content
  className?: string;            // Additional CSS classes
  minHeight?: string;            // Default: "min-h-[320px] sm:min-h-[340px]"
  showHoverShadow?: boolean;     // Default: true
  padding?: 'sm' | 'md' | 'lg';  // Default: 'md'
  bgOpacity?: number;            // Default: 0 (0-100, transparent by default)
  onClick?: () => void;          // Optional click handler
}
```

**Usage Example:**
```tsx
{/* Transparent card (default) */}
<CardWithCornerShine padding="lg" showHoverShadow>
  <h3 className="text-label-12 text-white/60 mb-2">TOTAL TRADES</h3>
  <p className="text-heading-48 text-accent">1,234</p>
</CardWithCornerShine>

{/* Semi-transparent dark background */}
<CardWithCornerShine padding="md" bgOpacity={80}>
  <h3 className="text-label-12 text-white/60 mb-2">WIN RATE</h3>
  <p className="text-heading-48 text-green-400">68.5%</p>
</CardWithCornerShine>
```

**Animation Details:**
- Corner brackets: white/20% → white/100% on hover
- Glow effect: `shadow-[0_0_8px_rgba(255,255,255,0.6)]`
- Border: white/10% → white/20% on hover
- Duration: 300ms with ease transition

---

#### LivePulseIndicator
**Location:** `src/components/LivePulseIndicator.tsx`

**Purpose:**
Animated status indicator with pulsing animation and glowing dot. Ideal for showing live connection status, network indicators, or real-time activity in trading platforms and dashboards.

**Key Features:**
- Two-layer animation: expanding ping circle + solid glowing core
- 6 predefined color variants (devnet, mainnet, success, warning, danger, info)
- 4 size presets (sm, md, lg, xl)
- Custom color and glow support
- Optional ping animation disable
- Bonus: `LivePulseIndicatorWithLabel` component with text label

**Props:**
```typescript
interface LivePulseIndicatorProps {
  variant?: 'devnet' | 'mainnet' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  customColor?: string;
  customGlow?: string;
  noPing?: boolean;
  className?: string;
}
```

**Usage Example:**
```tsx
<LivePulseIndicator variant="devnet" size="md" />
<LivePulseIndicatorWithLabel variant="mainnet" label="Connected" />
```

**Color Variants:**
- `devnet`: Emerald green (`bg-emerald-400`)
- `mainnet`: Blue (`bg-blue-400`)
- `success`: Green (`bg-green-400`)
- `warning`: Yellow (`bg-yellow-400`)
- `danger`: Red (`bg-red-400`)
- `info`: Cyan (`bg-cyan-400`)

---

#### HamburgerButton
**Location:** `src/components/HamburgerButton.tsx`

**Purpose:**
Animated hamburger menu button that transforms into an X icon when toggled. Essential for mobile navigation patterns with smooth 300ms transitions.

**Key Features:**
- Three-bar design that's universally recognized
- Smooth transformation to X shape when open
- 3 size presets (sm, md, lg)
- 4 color presets (white, black, gray, custom)
- Full accessibility with ARIA attributes
- Hover effect with background glow

**Props:**
```typescript
interface HamburgerButtonProps {
  isOpen: boolean;
  onClick: () => void;
  size?: 'sm' | 'md' | 'lg';
  color?: 'white' | 'black' | 'gray' | 'custom';
  customColorClass?: string;
  className?: string;
  ariaLabel?: string;
  ariaControls?: string;
}
```

**Usage Example:**
```tsx
const [isOpen, setIsOpen] = useState(false);

<HamburgerButton 
  isOpen={isOpen} 
  onClick={() => setIsOpen(!isOpen)}
  size="md"
  ariaControls="mobile-menu"
/>
```

**Animation States:**
- **Closed**: Three horizontal bars with equal spacing
- **Open**: 
  - Top bar: rotates 45deg and translates down
  - Middle bar: fades out (opacity-0, scale-0)
  - Bottom bar: rotates -45deg and translates up

---

#### GlassmorphismNavbar
**Location:** `src/components/GlassmorphismNavbar.tsx`

**Purpose:**
Complete responsive navigation bar with glassmorphism styling, network status indicator, and full-screen mobile menu overlay. Perfect for modern trading platforms and dashboards.

**Key Features:**
- Glassmorphism effect: `bg-black/80` + `backdrop-blur-xl`
- Desktop: Horizontal nav with hover dropdown
- Mobile: Full-screen overlay with categorized sections
- Network selector with `LivePulseIndicator` integration
- Auto-close mobile menu on route change
- Prevents body scroll when mobile menu open
- Click-outside-to-close for dropdowns

**Props:**
```typescript
interface NavItem {
  title: string;
  href: string;
  category?: 'main' | 'dropdown' | 'info';
}

interface NetworkStatus {
  name: string;
  variant: 'devnet' | 'mainnet';
  isActive: boolean;
}

interface GlassmorphismNavbarProps {
  logo: ReactNode | string;
  logoHref?: string;
  navItems: NavItem[];
  activePath?: string;
  networkStatus?: NetworkStatus;
  dropdownTitle?: string;
  onNetworkChange?: (network: 'devnet' | 'mainnet') => void;
  className?: string;
}
```

**Usage Example:**
```tsx
const navItems = [
  { title: 'Dashboard', href: '/', category: 'main' },
  { title: 'Trade', href: '/trade', category: 'main' },
  { title: 'Analytics', href: '/analytics', category: 'dropdown' },
  { title: 'Docs', href: '/docs', category: 'info' },
];

<GlassmorphismNavbar
  logo={<img src="/logo.svg" alt="App" />}
  navItems={navItems}
  activePath="/dashboard"
  networkStatus={{ name: 'Devnet', variant: 'devnet', isActive: true }}
  onNetworkChange={(network) => console.log('Switched to:', network)}
/>
```

**Layout Structure:**
- **Desktop**: Horizontal menu with logo → main items → dropdown → info items → network selector
- **Mobile**: Full overlay with sections (Network → Main → Dropdown → Info)
- **Glassmorphism**: Semi-transparent background with backdrop blur
- **Network Selector**: Dropdown with devnet/mainnet options

---

#### Other Core Components
- Located in `src/components/`
- Must use functional components with TypeScript interfaces
- Existing components:
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
