# Currency Change in Spot Concepts — Feature Plan

## Current State

Currently, the Demo Market supports switching between **USD** and **INR** via the Settings Modal. 
- The selected `currency` and the current `usdInrRate` are saved in Supabase and loaded into the `settings` object inside `useSpotTrade.ts`.
- `FutureConcepts.tsx` manually receives `currency` and `usdInrRate` as props and passes them to `LiquidationSimulator.tsx` to handle the math and symbols locally.
- **Spot Concepts** completely ignores the currency setting right now — everything is hardcoded to `$` and 1:1 USD math.

## The Goal
Apply the currency toggle to everything inside the Spot Trading tab:
1. Order Book (prices and totals)
2. Order Form (current price, input fields, and the new Order Info accordion)
3. Trade Summary Panel (Entry, TP, SL, PnL numbers)
4. Order Flow Visualiser (price nodes)
5. Spot Trade Chart (Y-axis formatting)

## Implementation Strategy

Instead of passing `currency` and `usdInrRate` as props through 5 levels of components and doing the math manually everywhere (like FutureConcepts did), there is a much cleaner, central way to do it: **Updating `formatPrice`**.

Every single component in Spot Concepts already receives and uses the `formatPrice` function from `useSpotTrade.ts` to display money. If we inject the currency conversion logic directly into `formatPrice`, the entire Spot tab converts instantly without changing any local component logic.

---

### Step 1: Update `formatPrice` in `useSpotTrade.ts`

Currently, `formatPrice` just fixes decimals and adds a `$`. We will update it to read from `settings.currency` and `settings.usdInrRate`.

```tsx
// Inside useSpotTrade.ts

const formatPrice = useCallback((amount: number, decimals: number = 2) => {
    // Default to USD
    let isINR = false;
    let rate = 1;
    let sym = '$';

    if (settings) {
        if (settings.currency === 'INR') {
            isINR = true;
            sym = '₹';
            rate = settings.usdInrRate || 86.5; // fallback just in case
        }
    }

    const convertedAmount = amount * rate;
    
    // Add comma separators and fixed decimals
    return `${sym}${convertedAmount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
    })}`;
}, [settings]);
```

**Impact:** Every component calling `formatPrice(100)` will automatically render as `$100.00` if USD is selected, or `₹8,650.00` if INR is selected.

---

### Step 2: Fix Hardcoded Symbols in Components

We need to audit components that assume `formatPrice` returns a string with a `$` and try to manipulate it, or components that hardcode `$` outside of `formatPrice`.

**1. `TradeSummaryPanel.tsx`**
- PnL values are currently formatted like: `${sign}${formatPrice(Math.abs(pnl.total))}`. This is perfectly fine because `formatPrice` will now return the localized symbol. No change needed here!

**2. `SpotOrderForm.tsx`**
- Input placeholders or labels might say "Price (USDC)". This should be updated to show the local currency or just "Price".
- The new `OrderInfoPanel` (planned) specifically needs to know the `currency` so it can swap the example texts ($10 tomatoes vs ₹10 tomatoes).

**3. Pass `currency` to `SpotConcepts`**
To support the Order Info Accordion examples, we need to pass `currency` down from `DemoMarket.tsx` to `SpotConcepts.tsx`, just like we do for `FutureConcepts.tsx`.

```tsx
// In DemoMarket.tsx
<SpotConcepts 
    trade={trade} 
    currency={settings?.currency ?? 'USD'} // NEW
/>

// In SpotConcepts.tsx
<SpotOrderForm 
    // ... existing props
    currency={currency} // Pass down to the form
/>
```

---

## Action Plan

1. **Modify `useSpotTrade.ts`**: Update the `formatPrice` `useCallback` to multiply by `settings.usdInrRate` and swap the `$` for `₹` based on `settings.currency`.
2. **Modify `DemoMarket.tsx`**: Pass `currency` as a prop into `<SpotConcepts>`.
3. **Modify `SpotConcepts.tsx`**: Receive `currency` and pass it down into `<SpotOrderForm>`.
4. **Modify `SpotOrderForm.tsx`**: Receive `currency` and pass it down to the `OrderInfoPanel` component (when built).
5. **Spot Check**: Once changed, manually flip the toggle in the Settings Modal and verify that the Order Book, Trade Summary Panel, and Order Flow Visualiser immediately jump by 86.5x and flip to `₹`.

## Why this is the best approach
By putting the logic inside `formatPrice`, we get 100% coverage across the Spot tab with zero math needed in the UI components themselves. The UI components remain completely agnostic to what currency they are displaying — they just print a string.
