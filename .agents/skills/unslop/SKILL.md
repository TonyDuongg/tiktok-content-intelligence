---
name: unslop
description: "Review, audit and unslop frontend UI: eliminate decorative gradients, colored glows, emojis in UI, template look, low contrast, and unprincipled spacing. Enforces craft design tokens, typography hierarchy, and a 0-100 unslop score."
---

# Unslop Skill

This skill aliases and executes the `unslop-design` and `impeccable` methodologies for clean, intentional, production-grade frontend engineering.

## Core Rules
1. **No AI Slop:** Eliminate purple/cyan background gradients, glowing drop shadows, emoji in UI buttons/toasts, and gradient text.
2. **Tokens First:** Use strict 4px/8px spacing scale, solid surface elevations, and semantic role tokens.
3. **Hierarchy Over Color:** Interface must work in grayscale first. Color is reserved for purposeful action and specific status.
4. **Typography Craft:** Solid color headers, tabular figures (`font-variant-numeric: tabular-nums`) for metrics, and proper typography characters (… instead of ...).
5. **System Accessibility:** Real `:focus-visible` outlines, WCAG AAA contrast, and `prefers-reduced-motion` support.
