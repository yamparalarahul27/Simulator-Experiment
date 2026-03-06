# App Background Customization — Feature Plan

## Goal
Allow wallet-connected users to dynamically customize the global application background (applying to both Analytica and Pedia modes). They can toggle between default image, custom uploaded image, or solid color modes, adjust the blur amount, set an overlay opacity, and reset to defaults.

## Current State
- Background is currently hardcoded in `src/app/globals.css` on the `<body>` tag.
- Trading-specific settings (like Currency) are stored in `demo_settings`.
- **Global app appearance preferences DO NOT belong in `demo_settings`.** They need a dedicated global preferences table.

---

## Implementation Strategy

### 1. Supabase Storage Bucket Setup
Create a **public** storage bucket called `user-backgrounds` in the Supabase Dashboard.
- **Bucket name:** `user-backgrounds`
- **Public access:** Enabled (so images can be loaded via CDN URL without auth)
- **File structure:** `{wallet_address}/bg.webp` (one image per user, overwritten on re-upload)
- **Max file size:** 300KB (enforced client-side after compression)

> **Why Supabase Storage instead of Base64 in DB?**
> A 2MB PNG → 2.67MB Base64 text in a PostgreSQL `TEXT` column. Every page load fetches the full payload. 200 users = 534MB consuming the DB quota. PostgreSQL isn't a blob store. Supabase Storage is S3-backed with CDN caching — the browser caches the image via HTTP headers, the DB stores only a ~100-byte URL path, and bandwidth is offloaded to the CDN. Free tier includes 1GB Storage + 2GB bandwidth/month, which supports 3,000+ user images at 300KB each.

### 2. Database Schema Update (Supabase)
Create a new table called `user_preferences` with a **hybrid design**: typed columns for identity/timestamps, a JSONB column for all preference data.

**New Table: `user_preferences`**
- `wallet_address` (text, Primary Key)
- `preferences` (JSONB, default: `'{}'`)
- `created_at` (timestamptz, default: `now()`)
- `updated_at` (timestamptz, default: `now()`)

**JSONB `preferences` Shape (TypeScript):**
```typescript
interface AppearancePreferences {
  bgType: 'default' | 'custom' | 'color';  // default: 'default'
  bgImagePath: string | null;               // Supabase Storage path e.g. '{wallet}/bg.webp'
  bgColor: string;                          // hex code, default: '#0D0D21'
  overlayOpacity: number;                   // 0-100, default: 0
  blurAmount: number;                       // 0-20, default: 0
  // Future settings go here with zero schema changes:
  // defaultTab?: string;
  // fontSize?: number;
  // language?: string;
}
```

**Auto-update trigger** for `updated_at` (matching existing pattern in `demo_orders`, `demo_balances`):
```sql
CREATE OR REPLACE FUNCTION update_user_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_user_preferences_updated_at
BEFORE UPDATE ON user_preferences
FOR EACH ROW EXECUTE FUNCTION update_user_preferences_updated_at();
```

> **Why JSONB?** The `demo_settings.price_overrides` column already uses JSONB in this codebase. A preferences table will grow over time (font size, default tab, language, notifications, etc.). JSONB requires zero ALTER TABLE migrations for new settings — just update the TypeScript interface and app code. Transactional tables (`demo_orders`, `trades`) keep typed columns since they need indexing and CHECK constraints.

### 3. Image Upload & Compression Pipeline
When a user clicks "Upload", the app validates and compresses before storing.

**Client-Side Pipeline:**
1. **Validate raw file:**
   - Must be `JPG`, `PNG`, or `WEBP` (`file.type` check).
   - Must be `≤ 2MB` raw (`file.size <= 2 * 1024 * 1024`).
   - If invalid → `toast.error('...')` and reject.

2. **Compress via Canvas:**
   - Load into an `Image` element.
   - Draw onto an offscreen `<canvas>` at max **1920px width** (maintain aspect ratio).
   - Export via `canvas.toBlob('image/webp', 0.7)` for lossy WebP compression.
   - Typical result: 80-90% smaller than raw PNG.

3. **Validate compressed output:**
   - Must be `≤ 300KB` after compression.
   - If still too large → `toast.error('Image too complex. Try a simpler background.')` and reject.

4. **Upload to Supabase Storage:**
   - Path: `{walletAddress}/bg.webp` (overwrites previous upload).
   - `supabase.storage.from('user-backgrounds').upload(path, blob, { upsert: true })`.
   - Get the public URL via `supabase.storage.from('user-backgrounds').getPublicUrl(path)`.

5. **Save URL reference in preferences:**
   - Update `preferences.bgImagePath` with the storage path.
   - Update `preferences.bgType` to `'custom'`.

### 4. State Management (`AppearanceContext.tsx` & `SupabaseProfileService.ts`)

**Service: `src/services/SupabaseProfileService.ts`**
- Follows the existing `SupabaseDemoService` pattern: static class methods, `isSupabaseConfigured()` guard, snake_case ↔ camelCase mapping, `console.error` + throw on failure.
- Methods:
  - `getPreferences(walletAddress)` → fetches row, auto-creates defaults if not found (PGRST116 pattern).
  - `updatePreferences(walletAddress, partialPrefs)` → merges into existing JSONB via Supabase `.update()`.
  - `uploadBackgroundImage(walletAddress, blob)` → uploads to Storage, returns public URL.
  - `deleteBackgroundImage(walletAddress)` → removes file from Storage, nulls `bgImagePath`.

**Context: `src/lib/context/AppearanceContext.tsx`**
- Provides `preferences` state + `updatePreference(key, value)` function to all consumers.
- **Debounce strategy:** Sliders update local React state immediately (instant visual feedback). DB save is debounced with `useRef + setTimeout` (500ms trailing-edge), matching the existing codebase pattern (no external debounce library needed).
- Integrates into `src/app/providers.tsx` alongside the existing wallet provider, keeping `layout.tsx` clean.

### 5. Caching Strategy
No Supabase call on every page load. Instead:

1. **On mount (wallet connected):**
   - Read `localStorage('deriverse.appearance.{walletAddress}')` → hydrate context immediately (instant background render).
   - Fetch `updated_at` only from Supabase (tiny query).
   - If remote `updated_at` > local `updated_at` → fetch full preferences row and update localStorage.
   - If equal → skip fetch entirely.

2. **On preference change:**
   - Update local state + localStorage immediately.
   - Debounced write to Supabase.

3. **For images:**
   - Supabase Storage URLs are CDN-backed → browser caches via standard HTTP cache headers (`Cache-Control`, `ETag`).
   - No re-download unless the image actually changes.
   - Append `?v={updated_at_timestamp}` to the URL for cache-busting on actual changes.

### 6. Fallback Chain
Background must never break or crash the app:

1. Try user's custom preference from context (localStorage-hydrated).
2. On Supabase fetch failure → keep using the localStorage-cached version.
3. On no cache / first visit / no wallet → fall back to default `/assets/background.png`.
4. Non-connected users always see default background (zero Supabase calls).
5. `AppBackground.tsx` wraps all logic in try/catch — never propagates errors.
6. `<img onError>` handler catches broken/corrupted images → reverts to default.

### 7. Rendering Component (`AppBackground.tsx`)
Create a root-level background component: `src/components/layout/AppBackground.tsx`.

Subscribes to `AppearanceContext` and renders two fixed layers:

1. **Base Layer:** The image (Storage URL or default `/assets/background.png`) or solid color (`bgColor`) spanning 100vw/100vh `position: fixed`.
2. **Overlay Layer:** A dark-navy `div` with `opacity: overlayOpacity / 100` and `backdrop-filter: blur(${blurAmount}px)`.

**Additional specs:**
- **Mobile:** Skip rendering entirely (`hidden md:block`) — mobile shows `MobileRestrictedView` with its own background, no need to render a hidden background layer underneath.
- **CSS Transitions:** Smooth background swaps matching the app's premium glassmorphism feel:
  - Background image/color: `transition: opacity 0.5s ease-in-out` (cross-fade by preloading new image offscreen, then swapping).
  - Overlay opacity: `transition: opacity 0.3s ease`.
  - Blur: `transition: backdrop-filter 0.3s ease`.

*(The hardcoded `body` background will be removed from `globals.css`)*

### 8. Layout Integration (`layout.tsx` / `providers.tsx`)
- Add `AppearanceProvider` inside `src/app/providers.tsx` (wrapping children alongside the existing wallet provider).
- Drop `<AppBackground />` as the first child inside the providers in `layout.tsx`, behind the main content area.

### 9. Customization UI (`ProfileSettings.tsx`)
Update `src/components/features/ProfileSettings.tsx` to include an **Appearance** section. Upload and save require a wallet connection.

**UI Structure (ASCII Mockup):**
```text
┌─────────────────────────────────────────────────────────┐
│                 Profile & Settings                      │
│      Configure your profile details and preferences     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ▼ Appearance (Saved to Wallet)                         │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Background Mode:                                 │  │
│  │  [ 🖼️ Default ]   [ 🔒 Upload... ]   [ ■ Color ]    │  │
│  │  *(Upload is disabled if Wallet is not connected)*   │  │
│  │                                                   │  │
│  │  (If Custom selected & image exists)              │  │
│  │  ┌──────────────┐                                 │  │
│  │  │  [preview]   │  [ Upload New ] [ ✕ Remove ]    │  │
│  │  └──────────────┘                                 │  │
│  │  *Max: 2MB input → compressed to ≤300KB WebP*     │  │
│  │  *Ideal: 2560px wide, JPG/PNG*                    │  │
│  │                                                   │  │
│  │  (If Solid Color selected)                        │  │
│  │  Background Color:                                │  │
│  │  [ #0D0D21 ] (Color Picker Dropdown)              │  │
│  │                                                   │  │
│  │  Image Overlay Darkness:              [ 40% ]     │  │
│  │  [----------●---------------------------]         │  │
│  │                                                   │  │
│  │  Image Blur Intensity:                [ 8px ]     │  │
│  │  [-------------●------------------------]         │  │
│  │                                                   │  │
│  │                     [ ↺ Reset to Default ]        │  │
│  └───────────────────────────────────────────────────┘  │
│                                                         │
│  [ Log out ]                                            │
└─────────────────────────────────────────────────────────┘
```

**Image Cleanup Behavior:**
- "Remove" button: deletes image from Supabase Storage, nulls `bgImagePath`, switches to default mode.
- Switching modes (Custom → Default/Color): keeps image in Storage so user can switch back without re-uploading.
- "Reset to Default" button: clears all preferences (including removing stored image from Storage).

---

## Action Plan (Execution Steps)

1. **STORAGE SETUP:** Create `user-backgrounds` public bucket in Supabase Dashboard.
2. **DB MIGRATION:** Run SQL in Supabase Dashboard to create `user_preferences` table (JSONB hybrid schema + auto-update trigger).
3. **CREATE** `src/services/SupabaseProfileService.ts` — preferences CRUD + Storage upload/delete.
4. **CREATE** `src/lib/context/AppearanceContext.tsx` — context with localStorage caching, conditional fetch, debounced saves, fallback chain, and client-side image compression pipeline.
5. **CREATE** `src/components/layout/AppBackground.tsx` — two-layer fixed background with CSS transitions and mobile skip.
6. **MODIFY** `src/app/globals.css` — remove `body` background image rules.
7. **MODIFY** `src/app/providers.tsx` — wrap children in `AppearanceProvider`.
8. **MODIFY** `src/app/layout.tsx` — add `<AppBackground />` behind main content.
9. **MODIFY** `src/components/features/ProfileSettings.tsx` — build Appearance UI section with upload, color picker, sliders, preview, remove, and reset.
10. **VERIFY** settings apply to both Analytica and Pedia views globally, fallback chain works when disconnected, and image loads from CDN cache on repeat visits.
