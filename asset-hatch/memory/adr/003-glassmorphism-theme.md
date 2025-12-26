# ADR-003: Glassmorphism + Aurora Design Theme

**Status:** Accepted (with P0 fixes needed)
**Date:** 2025-12-25
**Deciders:** User + Claude

---

## Context

Need to choose a visual design language for the Planning Interface and overall app aesthetic.

**Requirements:**
- Differentiate from generic admin dashboards
- Match "AI creative assistant" vibe
- Modern, trendy aesthetic (2024-2025)
- Support light and dark modes
- Accessible (WCAG 2.1 AA)

**Options considered:**
1. Material Design (Google's system)
2. Neumorphism (soft shadows, embossed look)
3. Glassmorphism (frosted glass, transparency)
4. Brutalism (raw, minimal, high contrast)

---

## Decision

We will use **Glassmorphism + Aurora color palette** (soft purples, blues, pinks, teals).

**Aesthetic:** Soft, ethereal, northern lights aesthetic - **NOT** cyberpunk or harsh neon.

**Rationale:**
- Unique visual identity (not corporate)
- Backdrop-filter creates depth without heavy graphics
- Aurora animations feel "AI-powered" and magical
- Trending in creative tools (Figma, Framer)
- Works well with dark mode

**Implementation:**
- CSS custom properties for theme (`--aurora-1`, `--glass-bg`, etc.)
- Utility classes (`.glass-panel`, `.aurora-gradient`, `.aurora-glow-hover`)
- Animated gradients for visual interest
- rem-based sizing for accessibility

---

## Consequences

### Positive
* **Unique identity:** Differentiates from Material Design clones
* **Depth without graphics:** Backdrop-filter creates visual interest
* **Modern feel:** Trendy 2024-2025 aesthetic
* **AI association:** Aurora animations evoke "magical AI assistant"
* **Dark mode native:** Glass effects work beautifully in dark mode

### Negative
* **Performance cost:** `backdrop-filter` is GPU-intensive
* **Browser support:** 95%+ but need fallbacks for older browsers
* **Visibility issue:** Requires colored background to see glass effects (**P0 bug**)
* **Accessibility:** Low contrast if not careful with color choices

### Trade-offs
* **Beauty vs Performance:** Accept GPU cost for visual polish
* **Modern vs Universal:** Target modern browsers, provide fallbacks

---

## Alternatives Considered

### Alternative 1: Material Design
* **Pros:** Well-documented, accessible, familiar to users
* **Cons:** Generic, corporate feel, doesn't differentiate
* **Why rejected:** Too similar to every other admin dashboard

### Alternative 2: Neumorphism
* **Pros:** Unique, soft aesthetic, modern
* **Cons:** Accessibility issues (low contrast), fell out of trend
* **Why rejected:** Hard to make accessible, less relevant in 2025

### Alternative 3: Brutalism
* **Pros:** Fast, accessible, unique
* **Cons:** Harsh aesthetic, not "creative AI assistant" vibe
* **Why rejected:** Doesn't match product personality

---

## Implementation Notes

**Files:**
- `app/globals.css:117-239` - Theme variables, animations, utility classes
- `.glass-panel` - Frosted glass effect with backdrop-filter
- `.aurora-gradient` - Animated gradient background (10s loop)
- `.aurora-glow-hover` - Soft glow on hover

**Critical P0 Bug:**
Glassmorphism is invisible on white background. Needs colored gradient on body:
```css
body {
  background: linear-gradient(135deg,
    oklch(0.95 0.02 270),
    oklch(0.97 0.01 240)
  );
}
```

**Performance mitigation:**
- Use `prefers-reduced-motion` to disable animations
- Provide solid color fallback if `backdrop-filter` unsupported
- Test on mid-range hardware (not just dev machines)

---

## Review Schedule

Review after P0 fixes applied (colored background added).

Re-evaluate after user testing - if performance issues, consider removing backdrop-filter.

---

## References

* [Glassmorphism Generator](https://hype4.academy/tools/glassmorphism-generator)
* [CSS backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
* [Aurora Borealis Color Palette](https://www.color-hex.com/color-palette/1034819)
* File: `app/globals.css:117-239`
* Issue: Glassmorphism invisible (P0 fix needed)
