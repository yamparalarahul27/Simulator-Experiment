# Frontend Development Guidelines

## Hydration Mismatch Handling

### Issue
Radix UI components (and similar libraries) generate random IDs on server-side rendering (SSR) and client-side hydration, causing hydration mismatches.

### Symptoms
Console warnings like:
```
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties.
```

### Solution
Add `suppressHydrationWarning` to components that use Radix UI or other libraries with dynamic ID generation:

```tsx
// For Radix UI components (Popover, DatePicker, etc.)
<Button suppressHydrationWarning>
  Content
</Button>

// For wrapper components
<Field suppressHydrationWarning>
  <Popover>
    <PopoverTrigger asChild>
      <Button suppressHydrationWarning>
        Content
      </Button>
    </PopoverTrigger>
  </Popover>
</Field>
```

### When to Use
- Radix UI components (Popover, Dialog, Dropdown, etc.)
- Date picker components
- Any component that generates random IDs
- Components with browser extension conflicts

### When NOT to Use
- Static content
- Components with consistent server/client rendering
- Form inputs with controlled values

### Best Practices
1. Apply `suppressHydrationWarning` at the lowest possible level
2. Only use it when absolutely necessary
3. Test functionality after adding to ensure no issues
4. Document why it was added in comments if needed

### Examples
```tsx
// ✅ Good - Targeted suppression
<Popover>
  <PopoverTrigger asChild>
    <Button suppressHydrationWarning>
      Open Dialog
    </Button>
  </PopoverTrigger>
</Popover>

// ❌ Avoid - Broad suppression
<div suppressHydrationWarning>
  <Popover>
    <PopoverTrigger asChild>
      <Button>
        Open Dialog
      </Button>
    </PopoverTrigger>
  </Popover>
</div>
```
