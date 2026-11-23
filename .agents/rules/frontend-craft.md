---
trigger: always_on
---

# Frontend Craft & Anti-Slop Guidelines (Impeccable & Unslop)

All frontend UI code (React, HTML, CSS, Tailwind) must adhere to these design engineering standards:

1. **No AI Clichés:**
   - Never use purple-to-blue or pink-to-cyan background radial/linear gradients.
   - Never use `-webkit-background-clip: text` gradient text for headlines.
   - Never add decorative glowing neon drop-shadows (e.g. `box-shadow: 0 0 25px rgba(...)`).
   - Never sprinkle emoji (`✨`, `🎬`, `🎯`, `⏱️`, `👉`, `⭐`) in UI labels, toasts, or buttons. Use crisp Lucide SVG icons instead.
   - Never use `backdrop-filter: blur(...)` over large content cards; use solid high-craft dark surfaces with 1px borders.

2. **Strict Spacing & Tokens:**
   - Use non-linear spacing scale based on 4px/8px: `4px, 8px, 12px, 16px, 20px, 24px, 32px, 48px, 64px`.
   - Never invent random off-scale values (`13px`, `25px`, `34px`).
   - All colors must reference CSS custom properties (`var(--...)`) defined in `:root`.

3. **Typography & Numbers:**
   - One primary font family (`Plus Jakarta Sans` or system UI font) with 2 deliberate weights (regular 400/500 and semibold 600/700).
   - Use tabular numbers (`font-variant-numeric: tabular-nums`) for all counts, statistics, and engagement rates.
   - Use real ellipsis character `…` instead of three periods `...`.

4. **Interactions & Accessibility:**
   - Always provide visible focus rings using `:focus-visible { outline: 2px solid var(--brand-primary); outline-offset: 2px; }`.
   - Animate only specific named properties (`transform`, `opacity`, `background-color`, `border-color`), never `transition: all`.
   - Include `@media (prefers-reduced-motion: reduce)` alternatives for keyframe animations.
