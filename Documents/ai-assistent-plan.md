# AI Assistant Response View — Customization Plan

## Current Structure

Located in: `src/app/assistant/page.tsx` (~line 126)

```tsx
{/* AI response bubble */}
<div className="px-5 py-4 rounded-none text-[15px]
    bg-white/5 border border-white/10 text-zinc-200
    whitespace-pre-wrap leading-relaxed
    shadow-xl shadow-black/50">
    {message.content}
</div>
```

---

## Options to Customize

### 1. Shape
| Style | Class |
|---|---|
| Sharp (current) | `rounded-none` |
| Slightly rounded | `rounded-lg` |
| Pill-style | `rounded-2xl` |

### 2. Background / Border
| Style | Class |
|---|---|
| Current (dim white) | `bg-white/5 border border-white/10` |
| Dark glassmorphism | `bg-white/3 backdrop-blur border border-white/8` |
| Purple-tinted | `bg-purple-500/10 border border-purple-500/20` |

### 3. Layout (bubble vs full-width)
- **Current**: max-width 75-85%, floats left
- **Option**: Full-width with a left-side colored bar (terminal-style):

```
│ ← Purple left border
│  AI response text here...
│  spans full width of the chat
```

### 4. Markdown Rendering
Currently plain text (`{message.content}`). Could use **`react-markdown`** to render:
- **Bold**, *italic*, headers
- Code blocks with syntax highlighting
- Bullet points and numbered lists

---

## Next Steps
Choose one or more of the following:
- [ ] Style changes only (shape, color, layout) — quick edit
- [ ] Add `react-markdown` for proper formatting
- [ ] Both — full upgrade
