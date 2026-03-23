```markdown
# Design System Specification: The Art of Presence

## 1. Overview & Creative North Star
**Creative North Star: "The Living Parchment"**

This design system rejects the clinical coldness of modern SaaS in favor of a "Living Parchment" philosophy. Our goal is to translate the tactile, slow-paced ritual of a Taiwanese tea ceremony into a digital interface. We break the "template" look by utilizing **Intentional Asymmetry**—placing elements off-center to mimic the natural placement of tea ware—and **Tonal Depth**, where hierarchy is defined by light and shadow rather than lines.

The experience must feel curated, not cluttered. We use expansive whitespace (Ma) to allow high-quality photography of steam, oxidized leaves, and New Zealand landscapes to breathe. This is an editorial experience that prioritizes "healing" through visual silence.

---

2. Colors & Surface Architecture
Our palette is rooted in the forest and the clay. We move away from pure whites and harsh blacks to maintain a "warm organic" temperature.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders for sectioning or containment. Boundaries must be defined solely through:
- **Background Shifts:** A `surface-container-low` section sitting on a `background` (`#fcf9f4`) base.
- **Negative Space:** Using the Spacing Scale (Scale 12 or 16) to create mental groupings.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of fine washi paper.
- **Base Layer:** `surface` (`#fcf9f4`) for the main canvas.
- **Secondary Content:** `surface-container-low` (`#f6f3ee`) for subtle grouping.
- **Interactive/Elevated Elements:** `surface-container-high` (`#ebe8e3`) or `surface-container-highest` (`#e5e2dd`) for cards and floating menus.

### The "Glass & Gradient" Rule
To avoid a flat, "out-of-the-box" feel:
- **Glassmorphism:** Use semi-transparent `surface` colors with a 12px-20px backdrop-blur for navigation bars and floating overlays. This allows the "tea greens" of photography to bleed through softly.
- **Signature Gradients:** For primary CTAs, use a subtle linear gradient from `primary` (`#17341c`) to `primary-container` (`#2d4b31`) at a 135-degree angle. This adds a "silk" sheen to the buttons.

---

## 3. Typography: The Editorial Voice
We pair the ancient weight of Serifs with the modern clarity of Humanist Sans-Serifs to bridge Taiwanese tradition with New Zealand's contemporary landscape.

- **Display & Headlines (Noto Serif):** These are our "anchors." Use `display-lg` (3.5rem) with generous letter-spacing (-0.02em) for hero moments. The Serif conveys authority, history, and the "Authentic" brand pillar.
- **Body & Labels (Manrope):** A clean, rhythmic sans-serif. Manrope’s open counters ensure readability even at `body-sm`.
- **The Contrast Rule:** Always pair a `headline-lg` with a `body-md` that has at least 1.6x line-height to maintain the "Zen" aesthetic.

---

## 4. Elevation & Depth
In this system, depth is a whisper, not a shout.

- **The Layering Principle:** Depth is achieved by "stacking" surface tiers. Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift.
- **Ambient Shadows:** When a "floating" effect is required (e.g., a booking modal), use a shadow with a 40px blur, 0% spread, and 6% opacity using the `on-surface` (`#1c1c19`) color. This mimics natural, filtered light.
- **The "Ghost Border" Fallback:** If a border is required for accessibility, use the `outline-variant` token at **15% opacity**. Never use 100% opaque lines.
- **Softness:** All containers must utilize the `lg` (1rem) or `xl` (1.5rem) roundedness tokens to evoke the organic shape of river stones and ceramic bowls.

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`), `on-primary` text. `full` roundedness (capsule). 
- **Secondary:** `surface-container-highest` fill with `primary` text. No border.
- **Tertiary/Ghost:** `primary` text with an underline that only appears on hover.

### Cards
Forbid the use of divider lines. Separate "Tea Origin" from "Steeping Instructions" using a `3.5rem` (Scale 10) vertical gap or a slight shift to `surface-container-lowest`. Use `xl` (1.5rem) corner radius.

### Input Fields
- **State:** Resting state uses `surface-container-low`. 
- **Focus:** Transitions to `surface-container-highest` with a 1px "Ghost Border" of `primary` at 20% opacity. 
- **Shape:** `md` (0.75rem) roundedness to differentiate from the "softer" buttons.

### Specialized Components: The "Ceremony Tracker"
- **Steeping Timer:** A circular progress element using `secondary` (`#6c5c43`) for the path and `primary` for the progress, utilizing a blur effect to make the timer feel like steam rising.
- **Texture Overlays:** Use a subtle grain texture (3% opacity) over large `primary` color blocks to mimic the feel of handmade paper.

---

## 6. Do's and Don'ts

### Do
- **Do** use asymmetrical layouts. Place an image on the left 60% and text on the right 30% with a large gap between.
- **Do** use `primary-fixed-dim` for secondary accents to maintain a "faded forest" look.
- **Do** lean heavily on `surface-bright` for hero sections to create a sense of morning light.

### Don't
- **Don't** use pure black (#000) for text. Use `on-surface` (`#1c1c19`) to keep the "warm wood" tone.
- **Don't** use standard 1px dividers to separate list items. Use white space (Scale 4).
- **Don't** use "bounce" animations. Use "fade-in-up" with long durations (600ms+) and "ease-out-expo" curves to mimic slow movement.
- **Don't** crowd the edges. Keep a minimum margin of `8.5rem` (Scale 24) on desktop for primary content containers.

---
**Director's Final Note:** 
Remember, we are not building a storefront; we are building a sanctuary. If a design element feels "busy," remove it. If a transition feels "fast," slow it down. The user should feel their heart rate drop the moment the page loads.```