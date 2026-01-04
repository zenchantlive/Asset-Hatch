# Aurora Glassmorphism Design System
## Complete Usage Guide for Game Asset Planning Interface

---

## 🎨 Color Palette Reference

### Primary Aurora Colors

| Color Name | Hex Code | Usage | Opacity |
|------------|----------|-------|---------|
| Deep Purple | `#2d1b4e` | Primary background, headers | 100% |
| Soft Purple | `#4a3768` | Secondary backgrounds | 100% |
| Lavender | `#6b5b95` | Accents, highlights | 100% |
| Twilight Blue | `#1e3a5f` | Deep backgrounds | 100% |
| Soft Blue | `#3d5a80` | Cards, panels | 100% |
| Sky Blue | `#5b7fa6` | Interactive elements | 100% |
| Aurora Pink | `#c27ba0` | Accent colors, badges | 100% |
| Soft Pink | `#d4a5c4` | Light accents | 100% |
| Ethereal Teal | `#4a7c7e` | Complementary accents | 100% |
| Soft Aqua | `#6ba3a6` | Hover states | 100% |
| Gentle Mint | `#88c5c7` | Subtle highlights | 100% |

### Glass Tints (with Transparency)

```css
/* Use these for glassmorphism overlays */
--aurora-purple-glass: rgba(74, 55, 104, 0.15);
--aurora-blue-glass: rgba(61, 90, 128, 0.12);
--aurora-pink-glass: rgba(194, 123, 160, 0.1);
--aurora-teal-glass: rgba(74, 124, 126, 0.13);
```

### Text Colors

```css
/* Hierarchy from most to least prominent */
--text-primary: rgba(255, 255, 255, 0.95);    /* Main content */
--text-secondary: rgba(255, 255, 255, 0.7);   /* Supporting text */
--text-tertiary: rgba(255, 255, 255, 0.5);    /* Captions, labels */
--text-disabled: rgba(255, 255, 255, 0.3);    /* Disabled states */
```

---

## 🔮 Component Library

### 1. Quality Dropdowns Bar

**Purpose**: Top navigation bar for quality selectors with subtle aurora shimmer effect.

**HTML Structure**:
```html
<div class="quality-dropdowns-bar">
  <select class="quality-dropdown">
    <option>Pixel Art (8-bit)</option>
    <option>Pixel Art (16-bit)</option>
    <option>Hand-painted 2D</option>
  </select>

  <select class="quality-dropdown">
    <option>512px</option>
    <option>1024px</option>
    <option>2048px</option>
  </select>

  <select class="quality-dropdown">
    <option>PBR Basic</option>
    <option>PBR Advanced</option>
  </select>
</div>
```

**Key Features**:
- Frosted glass background with purple tint
- Strong backdrop blur (20px)
- Animated shimmer sweep (8s loop)
- Soft purple glow on hover
- Lifts 2px on hover for depth

**Customization**:
```css
/* Increase blur intensity */
.quality-dropdowns-bar {
  backdrop-filter: blur(30px);
}

/* Change tint color */
.quality-dropdowns-bar {
  background: var(--glass-blue-tint);
}
```

---

### 2. Chat Message Bubbles

**Purpose**: Display user and assistant messages with glass effect and aurora glow.

**HTML Structure**:
```html
<!-- User message (right-aligned, blue tint) -->
<div class="chat-message user">
  <p class="chat-message-text">
    Create a medieval sword with high detail
  </p>
  <span class="chat-message-time">2:34 PM</span>
</div>

<!-- Assistant message (left-aligned, purple tint) -->
<div class="chat-message assistant">
  <p class="chat-message-text">
    I'll create a high-poly medieval sword with PBR textures...
  </p>
  <span class="chat-message-time">2:35 PM</span>
</div>
```

**Key Features**:
- Different tints for user (blue) vs assistant (purple)
- Colored left border (2px) for visual distinction
- Fade-in animation on appearance
- Soft glow on hover
- Subtle slide on hover (4px)
- Max-width 80% for readability

**States**:
- **Default**: Light glass background
- **Hover**: Increased opacity, purple glow, slight slide
- **Focus**: (for accessibility) Same as hover

**Accessibility**:
```html
<div class="chat-message user" role="article" aria-label="User message">
  <!-- content -->
</div>
```

---

### 3. Plan Preview Panel

**Purpose**: Large display panel for showing generated asset plans with animated aurora border.

**HTML Structure**:
```html
<div class="plan-preview-panel">
  <h2 class="plan-preview-title">Medieval Sword Asset Plan</h2>
  <div class="plan-preview-content">
    <p>Polygon Count: 5,000 triangles</p>
    <p>Texture Resolution: 2048x2048</p>
    <p>Material: PBR (Metallic workflow)</p>
    <!-- More content -->
  </div>
</div>
```

**Key Features**:
- Strong backdrop blur (20px)
- Animated aurora border (15s cycle)
- Radial gradient overlay from top
- Large padding for spacious feel
- Title with purple text glow
- Multi-layered shadow with aurora colors

**Animation**:
- Border: Continuously shifts colors (purple → blue → teal → pink)
- Background: Subtle aurora pulse on overlay
- Duration: 15 seconds per cycle

---

### 4. Glass Buttons

**Purpose**: Interactive buttons with multiple variants for different actions.

**HTML Structure**:
```html
<!-- Default glass button -->
<button class="btn-glass">
  Generate Asset
</button>

<!-- Primary variant (purple) -->
<button class="btn-glass btn-glass-primary">
  Save Plan
</button>

<!-- Secondary variant (blue) -->
<button class="btn-glass btn-glass-secondary">
  Export
</button>

<!-- Disabled state -->
<button class="btn-glass" disabled>
  Processing...
</button>
```

**Key Features**:
- Subtle backdrop blur
- Hover: lifts 2px, adds glow
- Active: ripple animation
- Disabled: 50% opacity, no pointer events
- Icon support with gap spacing

**States**:
- **Default**: Light glass with border
- **Hover**: Increased opacity, soft glow, lifts up
- **Active**: Ripple effect expands outward
- **Disabled**: Faded, non-interactive

**Best Practices**:
```css
/* Add icons */
<button class="btn-glass btn-glass-primary">
  <svg>...</svg>
  <span>Generate</span>
</button>

/* Loading state */
<button class="btn-glass" disabled aria-busy="true">
  <span class="spinner"></span>
  Generating...
</button>
```

---

### 5. Glass Input Fields

**Purpose**: Text inputs and textareas with glass styling for forms.

**HTML Structure**:
```html
<!-- Text input -->
<input
  type="text"
  class="input-glass"
  placeholder="Asset name..."
  aria-label="Asset name"
/>

<!-- Textarea -->
<textarea
  class="textarea-glass"
  placeholder="Describe your asset..."
  aria-label="Asset description"
></textarea>
```

**Key Features**:
- Light glass background
- Focus: purple border glow
- Hover: slightly increased opacity
- Smooth transitions (300ms)
- Placeholder text in tertiary color

**Focus States**:
```css
/* When user focuses input */
.input-glass:focus {
  /* Inner glow appears */
  /* Purple border intensifies */
  /* Background slightly more opaque */
}
```

**Validation States** (custom implementation):
```html
<div class="form-field">
  <input class="input-glass error" aria-invalid="true" />
  <span class="error-message">This field is required</span>
</div>
```

```css
.input-glass.error {
  border-color: rgba(239, 68, 68, 0.5);
  box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
}
```

---

### 6. Glass Cards

**Purpose**: Content containers with hover effects for displaying information.

**HTML Structure**:
```html
<div class="card-glass">
  <h3 class="card-glass-title">Recent Assets</h3>
  <div class="card-glass-content">
    <p>Medieval Sword - 2048px</p>
    <p>Fantasy Shield - 1024px</p>
  </div>
</div>
```

**Key Features**:
- Animated aurora top border (2px)
- Medium backdrop blur
- Hover: lifts 4px, adds glow
- Smooth 300ms transitions

**Variants**:
```css
/* Compact card */
.card-glass-compact {
  padding: var(--space-md);
}

/* Featured card (with stronger glow) */
.card-glass-featured {
  box-shadow: var(--shadow-glass-lg), var(--glow-aurora-mix);
}
```

---

### 7. Glass Badges/Tags

**Purpose**: Small labels for categories, status, or metadata.

**HTML Structure**:
```html
<span class="badge-glass badge-glass-purple">High Poly</span>
<span class="badge-glass badge-glass-blue">2048px</span>
<span class="badge-glass badge-glass-pink">PBR</span>
<span class="badge-glass badge-glass-teal">Metallic</span>
```

**Key Features**:
- Pill-shaped (fully rounded borders)
- Small size (12px font)
- Color-coded variants
- Hover: slight glow effect
- Icon support

**With Icons**:
```html
<span class="badge-glass badge-glass-purple">
  <svg width="12" height="12">...</svg>
  <span>High Quality</span>
</span>
```

---

### 8. Glass Modal/Dialog

**Purpose**: Overlay dialogs for important interactions.

**HTML Structure**:
```html
<div class="modal-glass-overlay">
  <div class="modal-glass" role="dialog" aria-labelledby="modal-title">
    <button class="modal-glass-close" aria-label="Close">
      ×
    </button>

    <h2 id="modal-title" class="modal-glass-title">
      Confirm Export
    </h2>

    <div class="modal-glass-content">
      <p>Are you sure you want to export this asset?</p>

      <div style="margin-top: 24px; display: flex; gap: 12px;">
        <button class="btn-glass btn-glass-primary">Confirm</button>
        <button class="btn-glass">Cancel</button>
      </div>
    </div>
  </div>
</div>
```

**Key Features**:
- Dark overlay with intense blur
- Animated aurora border
- Close button with rotate animation
- Fade-in animation (300ms)
- Centered positioning

**JavaScript Toggle**:
```javascript
function showModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'flex';
  document.body.style.overflow = 'hidden'; // Prevent scroll
}

function hideModal(modalId) {
  const modal = document.getElementById(modalId);
  modal.style.display = 'none';
  document.body.style.overflow = ''; // Restore scroll
}
```

---

## ✨ Animation Guidelines

### Aurora Background Shift

**What it does**: Slowly shifts the main background gradient across the viewport.

**Duration**: 20 seconds per cycle

**Usage**: Applied automatically to `<body>` element

**Customization**:
```css
/* Speed up animation */
body {
  animation: aurora-shift 10s ease infinite;
}

/* Add to other elements */
.my-element {
  background: var(--bg-primary-gradient);
  background-size: 400% 400%;
  animation: aurora-shift 15s ease infinite;
}
```

---

### Aurora Pulse

**What it does**: Gently pulses opacity and brightness for ethereal effect.

**Duration**: 8 seconds per cycle

**Usage**: Applied to background overlay

**Customization**:
```css
/* Apply to any element */
.my-element {
  animation: aurora-pulse 8s ease-in-out infinite;
}
```

---

### Soft Glow Pulse

**What it does**: Cycles through purple → blue → pink glows.

**Duration**: 12 seconds (4s per color)

**Usage**: Add to elements for color-shifting glow

**Example**:
```html
<div class="card-glass aurora-glow-purple">
  <!-- Content -->
</div>
```

**Variants**:
- `.aurora-glow-purple` - Starts with purple (0s delay)
- `.aurora-glow-blue` - Starts with blue (1.3s delay)
- `.aurora-glow-pink` - Starts with pink (2.6s delay)

---

### Shimmer Sweep

**What it does**: Creates a light sweep across element (like a scanning light).

**Duration**: 15 seconds per sweep

**Usage**: Applied to quality bar, can be added to other elements

**Example**:
```css
.my-element::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: var(--bg-aurora-shimmer);
  animation: shimmer-sweep 15s ease-in-out infinite;
  pointer-events: none;
}
```

---

### Float Gentle

**What it does**: Subtle vertical floating motion (±10px).

**Duration**: 6 seconds per cycle

**Usage**: Add to cards or decorative elements

**Example**:
```html
<div class="card-glass float-gentle">
  <!-- Content -->
</div>
```

---

### Fade In Glass

**What it does**: Fades in element while gradually increasing blur.

**Duration**: 500ms

**Usage**: Automatically applied to chat messages

**Trigger with JavaScript**:
```javascript
element.style.animation = 'fade-in-glass 0.5s ease-out';
```

---

### Ripple Glass

**What it does**: Creates expanding ripple effect on click.

**Duration**: 600ms

**Usage**: Automatically applied to button `:active` state

**Manual trigger**:
```javascript
button.addEventListener('click', (e) => {
  e.target.style.animation = 'none';
  setTimeout(() => {
    e.target.style.animation = 'ripple-glass 0.6s ease-out';
  }, 10);
});
```

---

### Border Aurora Flow

**What it does**: Animates gradient border colors flowing across element.

**Duration**: 6-8 seconds

**Usage**: Applied to dropdowns, cards, modals

**Implementation**:
```css
.my-element::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--border-aurora-multi);
  background-size: 200% 100%;
  animation: border-aurora-flow 6s linear infinite;
  opacity: 0.5;
  pointer-events: none;
}
```

---

## 🎯 Usage Best Practices

### 1. Layering Glass Elements

**DO**: Layer glass elements with varying blur intensities
```html
<div class="glass-container" style="backdrop-filter: blur(20px);">
  <div class="card-glass" style="backdrop-filter: blur(12px);">
    <button class="btn-glass" style="backdrop-filter: blur(8px);">
      Click me
    </button>
  </div>
</div>
```

**DON'T**: Use same blur on all nested elements (looks flat)
```html
<!-- ❌ All same blur -->
<div style="backdrop-filter: blur(12px);">
  <div style="backdrop-filter: blur(12px);">
    <button style="backdrop-filter: blur(12px);">...</button>
  </div>
</div>
```

---

### 2. Color Contrast for Accessibility

**Ensure WCAG AA compliance** (4.5:1 for normal text):

✅ **GOOD**:
```css
.text-on-glass {
  color: var(--text-primary); /* rgba(255,255,255,0.95) = High contrast */
}
```

❌ **BAD**:
```css
.text-on-glass {
  color: rgba(255, 255, 255, 0.3); /* Too low contrast for body text */
}
```

**Use text-tertiary only for:**
- Labels
- Captions
- Timestamps
- Non-essential information

---

### 3. Animation Performance

**DO**: Use `transform` and `opacity` for animations (GPU-accelerated)
```css
.smooth-animation {
  transition: transform 0.3s, opacity 0.3s;
}

.smooth-animation:hover {
  transform: translateY(-2px);
  opacity: 0.9;
}
```

**DON'T**: Animate expensive properties
```css
/* ❌ Causes repaints */
.expensive-animation {
  transition: width 0.3s, height 0.3s, top 0.3s;
}
```

---

### 4. Responsive Blur

On mobile devices, reduce blur intensity for better performance:

```css
@media (max-width: 768px) {
  .glass-container {
    backdrop-filter: blur(8px) !important;
  }

  .quality-dropdowns-bar {
    backdrop-filter: blur(12px) !important;
  }
}
```

---

### 5. Dark Mode Adaptation

The design system is already dark-themed, but you can create a lighter variant:

```css
/* Light mode (optional) */
body.light-mode {
  --bg-primary-gradient: linear-gradient(
    135deg,
    #e0d4f7 0%,
    #d4c5f9 25%,
    #c5e0f9 50%,
    #d4c5f9 75%,
    #e0d4f7 100%
  );

  --text-primary: rgba(0, 0, 0, 0.9);
  --text-secondary: rgba(0, 0, 0, 0.7);
  --text-tertiary: rgba(0, 0, 0, 0.5);

  --glass-bg-light: rgba(255, 255, 255, 0.6);
  --glass-bg-medium: rgba(255, 255, 255, 0.7);
  --glass-bg-strong: rgba(255, 255, 255, 0.8);
}
```

---

## 🛠️ Component Composition Examples

### Example 1: Asset Card with Badge

```html
<div class="card-glass">
  <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
    <h3 class="card-glass-title">Medieval Sword</h3>
    <span class="badge-glass badge-glass-purple">High Poly</span>
  </div>

  <div class="card-glass-content">
    <p>Created 2 hours ago</p>
    <p>5,000 triangles • 2048px textures</p>
  </div>

  <div style="margin-top: 16px; display: flex; gap: 8px;">
    <button class="btn-glass btn-glass-primary">Edit</button>
    <button class="btn-glass btn-glass-secondary">Export</button>
  </div>
</div>
```

---

### Example 2: Chat Interface

```html
<div class="glass-container" style="padding: 24px; max-width: 800px; margin: 0 auto;">
  <!-- Header -->
  <div class="quality-dropdowns-bar" style="margin-bottom: 24px;">
    <select class="quality-dropdown">
      <option>Pixel Art (8-bit)</option>
      <option selected>Pixel Art (16-bit)</option>
      <option>Hand-painted 2D</option>
    </select>
    <select class="quality-dropdown">
      <option>1024px</option>
      <option selected>2048px</option>
    </select>
  </div>

  <!-- Messages -->
  <div class="chat-container">
    <div class="chat-message user">
      <p class="chat-message-text">Create a fantasy shield</p>
      <span class="chat-message-time">3:15 PM</span>
    </div>

    <div class="chat-message assistant">
      <p class="chat-message-text">I'll create a fantasy shield with ornate details...</p>
      <span class="chat-message-time">3:16 PM</span>
    </div>
  </div>

  <!-- Input -->
  <div style="margin-top: 24px;">
    <textarea
      class="textarea-glass"
      placeholder="Describe your asset..."
    ></textarea>
    <button class="btn-glass btn-glass-primary" style="margin-top: 12px; width: 100%;">
      Generate
    </button>
  </div>
</div>
```

---

### Example 3: Plan Preview Dashboard

```html
<div style="display: grid; grid-template-columns: 2fr 1fr; gap: 24px; padding: 24px;">
  <!-- Main preview -->
  <div class="plan-preview-panel">
    <h2 class="plan-preview-title">Asset Generation Plan</h2>
    <div class="plan-preview-content">
      <h3>Model Specifications</h3>
      <p>Polygon count: 5,000 triangles</p>
      <p>UV unwrapping: Smart UV project</p>

      <div class="glass-divider"></div>

      <h3>Texture Details</h3>
      <p>Resolution: 2048x2048px</p>
      <p>Format: PBR Metallic workflow</p>
    </div>
  </div>

  <!-- Sidebar -->
  <div style="display: flex; flex-direction: column; gap: 16px;">
    <div class="card-glass">
      <h3 class="card-glass-title">Quick Settings</h3>
      <div class="card-glass-content">
        <label style="display: block; margin-bottom: 8px; color: var(--text-secondary);">
          Quality
        </label>
        <select class="quality-dropdown">
          <option>Low</option>
          <option>Medium</option>
          <option selected>High</option>
        </select>
      </div>
    </div>

    <div class="card-glass">
      <h3 class="card-glass-title">Recent</h3>
      <div class="card-glass-content">
        <div style="display: flex; flex-direction: column; gap: 8px;">
          <span class="badge-glass badge-glass-blue">Sword</span>
          <span class="badge-glass badge-glass-pink">Shield</span>
          <span class="badge-glass badge-glass-teal">Helmet</span>
        </div>
      </div>
    </div>
  </div>
</div>
```

---

## 🎨 Customization Guide

### Adjusting Aurora Colors

Want different aurora colors? Update the base palette:

```css
:root {
  /* Replace with your colors */
  --aurora-deep-purple: #your-color;
  --aurora-soft-blue: #your-color;
  --aurora-pink: #your-color;

  /* Update glass tints accordingly */
  --aurora-purple-glass: rgba(your-rgb, 0.15);
}
```

---

### Changing Animation Speeds

```css
/* Slower, more meditative */
body {
  animation: aurora-shift 30s ease infinite;
}

body::before {
  animation: aurora-pulse 12s ease-in-out infinite;
}

/* Faster, more energetic */
body {
  animation: aurora-shift 10s ease infinite;
}
```

---

### Adjusting Blur Intensity

```css
:root {
  /* Less blur (better performance) */
  --blur-subtle: blur(4px);
  --blur-medium: blur(8px);
  --blur-strong: blur(12px);

  /* More blur (dreamier look) */
  --blur-subtle: blur(12px);
  --blur-medium: blur(20px);
  --blur-strong: blur(30px);
}
```

---

### Adding New Component Variants

```css
/* Danger/error variant */
.btn-glass-danger {
  background: rgba(239, 68, 68, 0.15);
  border-color: rgba(239, 68, 68, 0.3);
}

.btn-glass-danger:hover {
  box-shadow: 0 4px 20px rgba(239, 68, 68, 0.3);
}

/* Success variant */
.btn-glass-success {
  background: rgba(34, 197, 94, 0.15);
  border-color: rgba(34, 197, 94, 0.3);
}
```

---

## ♿ Accessibility Checklist

- ✅ All interactive elements have `:focus-visible` states
- ✅ Text contrast meets WCAG AA (4.5:1 minimum)
- ✅ Reduced motion support (add this):

```css
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- ✅ Semantic HTML (`<button>`, `<input>`, proper headings)
- ✅ ARIA labels where needed (`aria-label`, `role`, `aria-labelledby`)
- ✅ Keyboard navigation works (tab through all interactive elements)
- ✅ Screen reader friendly (test with NVDA/JAWS)

---

## 📱 Responsive Considerations

### Mobile Adjustments

```css
@media (max-width: 768px) {
  /* Reduce blur for performance */
  .glass-container {
    backdrop-filter: blur(8px);
  }

  /* Stack dropdowns vertically */
  .quality-dropdowns-bar {
    flex-direction: column;
    align-items: stretch;
  }

  /* Full-width chat messages */
  .chat-message {
    max-width: 100%;
  }

  /* Larger touch targets */
  .btn-glass {
    min-height: 44px;
    padding: var(--space-md) var(--space-lg);
  }
}
```

### Tablet Adjustments

```css
@media (min-width: 769px) and (max-width: 1024px) {
  .plan-preview-panel {
    padding: var(--space-lg);
  }

  .modal-glass {
    max-width: 80%;
  }
}
```

---

## 🚀 Performance Tips

1. **Limit simultaneous animations**: Don't animate more than 3-4 elements at once
2. **Use `will-change` sparingly**: Only on elements about to animate
3. **Lazy load background effects**: Use Intersection Observer
4. **Optimize blur on scroll**: Reduce blur when scrolling fast
5. **Debounce resize events**: Don't recalculate on every pixel change

```javascript
// Example: Reduce blur on scroll
let ticking = false;

window.addEventListener('scroll', () => {
  if (!ticking) {
    window.requestAnimationFrame(() => {
      // Reduce blur when scrolling
      document.body.style.setProperty('--blur-medium', 'blur(6px)');

      // Restore after scroll ends
      clearTimeout(window.scrollTimeout);
      window.scrollTimeout = setTimeout(() => {
        document.body.style.setProperty('--blur-medium', 'blur(12px)');
      }, 150);

      ticking = false;
    });
    ticking = true;
  }
});
```

---

## 📦 Integration with React/Vue/Other Frameworks

### React Example

```jsx
import './aurora-design-system.css';

function ChatMessage({ text, type, time }) {
  return (
    <div className={`chat-message ${type}`}>
      <p className="chat-message-text">{text}</p>
      <span className="chat-message-time">{time}</span>
    </div>
  );
}

function QualityBar({ options, selected, onChange }) {
  return (
    <div className="quality-dropdowns-bar">
      {options.map((option) => (
        <select
          key={option.id}
          className="quality-dropdown"
          value={selected[option.id]}
          onChange={(e) => onChange(option.id, e.target.value)}
        >
          {option.values.map((val) => (
            <option key={val} value={val}>{val}</option>
          ))}
        </select>
      ))}
    </div>
  );
}
```

### Vue Example

```vue
<template>
  <div class="card-glass">
    <h3 class="card-glass-title">{{ title }}</h3>
    <div class="card-glass-content">
      <slot></slot>
    </div>
  </div>
</template>

<script>
export default {
  name: 'GlassCard',
  props: {
    title: {
      type: String,
      required: true
    }
  }
}
</script>

<style src="./aurora-design-system.css"></style>
```

---

## 🎭 Design Principles Summary

1. **Soft, Not Harsh**: All glows are subtle (15-20% opacity max)
2. **Ethereal Motion**: Animations are slow and dreamy (6-20s cycles)
3. **Layered Depth**: Use varying blur intensities for depth perception
4. **Aurora Inspiration**: Colors shift like northern lights (purple → blue → pink → teal)
5. **Accessible First**: Always maintain WCAG AA contrast ratios
6. **Performance Conscious**: Optimize blur and animations for mobile
7. **Consistent Spacing**: Use 8px grid system (`--space-*` tokens)
8. **Rounded Corners**: All components have soft, rounded borders

---

## 🌟 Final Tips

- **Start simple**: Begin with basic glass containers, add effects gradually
- **Test on real devices**: Blur effects vary across browsers/devices
- **Use sparingly**: Not every element needs maximum glass/glow effects
- **Consider context**: Aurora background works best for creative/magical themes
- **Iterate**: Adjust colors/blur to match your specific brand

**Remember**: The goal is **elegant, soft, and ethereal** — think "enchanted planning workspace", not "neon cyberpunk". Let the design breathe and shimmer gently.

---

## 📄 Files Reference

- `/mnt/c/Users/Zenchant/asset-hatch/asset-hatch-spec/asset-hatch/ui-system/aurora-design-system.css` - Complete CSS system
- `/mnt/c/Users/Zenchant/asset-hatch/asset-hatch-spec/asset-hatch/ui-system/DESIGN_SYSTEM_GUIDE.md` - This guide

**Questions or need custom components?** Refer back to the base tokens and composition patterns in this guide.

Enjoy building your magical asset planning interface! ✨
