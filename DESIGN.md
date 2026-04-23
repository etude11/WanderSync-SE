---
name: WanderSync

colors:
  # ── Surfaces ──────────────────────────────────────────────────────────────
  surface: "#eff1f3"
  surface-dim: "#e2e4e8"
  surface-bright: "#ffffff"
  surface-container-lowest: "#ffffff"
  surface-container-low: "#f5f6f8"
  surface-container: "#eff1f3"
  surface-container-high: "#e8eaed"
  surface-container-highest: "#dbd3d8"
  on-surface: "#223843"
  on-surface-variant: "rgba(34,56,67,0.55)"
  inverse-surface: "#223843"
  inverse-on-surface: "#eff1f3"
  outline: "#dbd3d8"
  outline-variant: "rgba(219,211,216,0.50)"
  surface-tint: "#d77a61"

  # ── Brand / Primary ───────────────────────────────────────────────────────
  primary: "#d77a61"
  on-primary: "#ffffff"
  primary-container: "rgba(215,122,97,0.12)"
  on-primary-container: "#c96248"
  inverse-primary: "#d8b4a0"

  # ── Secondary (Charcoal Blue) ─────────────────────────────────────────────
  secondary: "#223843"
  on-secondary: "#ffffff"
  secondary-container: "rgba(34,56,67,0.08)"
  on-secondary-container: "#223843"

  # ── Tertiary (Desert Sand / warm accent) ─────────────────────────────────
  tertiary: "#d8b4a0"
  on-tertiary: "#223843"
  tertiary-container: "rgba(216,180,160,0.25)"
  on-tertiary-container: "#a06840"

  # ── Error ─────────────────────────────────────────────────────────────────
  error: "#d77a61"
  on-error: "#ffffff"
  error-container: "rgba(215,122,97,0.08)"
  on-error-container: "#c96248"

  # ── Semantic extras ───────────────────────────────────────────────────────
  background: "#eff1f3"
  on-background: "#223843"
  surface-variant: "#dbd3d8"

  # ── Extended brand scale ──────────────────────────────────────────────────
  brand-50:  "#fdf5f3"
  brand-100: "#f9e8e2"
  brand-200: "#f2cfc3"
  brand-300: "#e8ad9b"
  brand-400: "#d77a61"
  brand-500: "#c96248"
  brand-600: "#b04d36"
  brand-700: "#8d3c29"
  brand-800: "#6b2e1f"
  brand-900: "#502318"

typography:
  # ── Serif display (Cormorant) ─────────────────────────────────────────────
  display-lg:
    fontFamily: Cormorant
    fontSize: 68px
    fontWeight: "300"
    lineHeight: 72px
    letterSpacing: -0.02em

  display-md:
    fontFamily: Cormorant
    fontSize: 48px
    fontWeight: "300"
    lineHeight: 52px
    letterSpacing: -0.02em

  headline-lg:
    fontFamily: Cormorant
    fontSize: 36px
    fontWeight: "400"
    lineHeight: 42px
    letterSpacing: -0.01em

  headline-md:
    fontFamily: Cormorant
    fontSize: 28px
    fontWeight: "500"
    lineHeight: 34px

  headline-sm:
    fontFamily: Cormorant
    fontSize: 20px
    fontWeight: "500"
    lineHeight: 26px

  # ── Sans-serif body (Montserrat) ──────────────────────────────────────────
  body-lg:
    fontFamily: Montserrat
    fontSize: 16px
    fontWeight: "400"
    lineHeight: 26px

  body-md:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: "400"
    lineHeight: 22px

  body-sm:
    fontFamily: Montserrat
    fontSize: 12px
    fontWeight: "400"
    lineHeight: 18px

  label-lg:
    fontFamily: Montserrat
    fontSize: 14px
    fontWeight: "600"
    lineHeight: 20px
    letterSpacing: 0.01em

  label-sm:
    fontFamily: Montserrat
    fontSize: 11px
    fontWeight: "600"
    lineHeight: 16px
    letterSpacing: 0.08em

  overline:
    fontFamily: Montserrat
    fontSize: 10px
    fontWeight: "700"
    lineHeight: 14px
    letterSpacing: 0.12em

  mono:
    fontFamily: ui-monospace, SFMono-Regular, monospace
    fontSize: 11px
    fontWeight: "400"
    lineHeight: 16px

rounded:
  sm: 0.375rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 0.75rem
  "2xl": 1rem
  "3xl": 1.5rem
  full: 9999px

spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 20px
  lg: 40px
  xl: 64px
  section: 96px
  gutter: 24px
  container-padding: 48px
  card-padding: 20px
  card-gap: 20px

elevation:
  soft:       "0 2px 16px rgba(34,56,67,0.06)"
  card:       "0 4px 32px rgba(34,56,67,0.08)"
  card-hover: "0 10px 48px rgba(34,56,67,0.13)"
  warm:       "0 4px 20px rgba(215,122,97,0.22)"
  warm-lg:    "0 8px 36px rgba(215,122,97,0.32)"
  pastel:     "0 8px 40px rgba(216,180,160,0.18)"
  inner-warm: "inset 0 2px 8px rgba(216,180,160,0.15)"

motion:
  duration-fast:    150ms
  duration-base:    200ms
  duration-slow:    300ms
  duration-float:   7s
  duration-drift:   20s
  easing-default:   ease-out
  easing-smooth:    ease-in-out

  # Named animation presets
  fade-in:    "fadeIn 0.4s ease-out both"
  slide-up:   "slideUp 0.5s ease-out both"
  scale-in:   "scaleIn 0.28s ease-out both"
  float:      "float 7s ease-in-out infinite"
  pulse-soft: "pulseSoft 3s ease-in-out infinite"
  drift:      "drift 20s linear infinite"

  # SVG path-drawing (flight route animation)
  draw-path:    "drawPath forwards"
  trail-pulse:  "trailPulse 2.4s ease-in-out infinite"
  cloud-drift:  "cloudDrift 18s ease-in-out infinite alternate"
  shimmer:      "shimmer 2s linear infinite"
  soft-glow:    "softGlow 3s ease-in-out infinite"

  # Stagger delays for sequential reveal
  stagger-1: 80ms
  stagger-2: 160ms
  stagger-3: 240ms
  stagger-4: 320ms
  stagger-5: 400ms

backgrounds:
  hero-warm:    "radial-gradient(ellipse 80% 60% at 60% -10%, rgba(216,180,160,0.22) 0%, transparent 70%)"
  cta-warm:     "linear-gradient(135deg, rgba(216,180,160,0.28) 0%, rgba(215,122,97,0.14) 100%)"
  auth-bg:      "radial-gradient(ellipse 70% 50% at 30% 20%, rgba(216,180,160,0.18) 0%, transparent 60%)"
  pastel-mesh:  "radial-gradient(ellipse at 20% 80%, rgba(216,180,160,0.18) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(219,211,216,0.25) 0%, transparent 50%)"
  pastel-dots:  "radial-gradient(rgba(219,211,216,0.35) 1px, transparent 1px) / 28px 28px"
  stats-bar:    "#223843"

components:
  # ── Buttons ───────────────────────────────────────────────────────────────
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    padding: "10px 20px"
    boxShadow: "{elevation.warm}"
  button-primary-hover:
    backgroundColor: "{colors.brand-500}"
    boxShadow: "{elevation.warm-lg}"
    transform: "translateY(-1px)"

  button-secondary:
    backgroundColor: transparent
    textColor: "{colors.on-surface}"
    typography: "{typography.label-lg}"
    rounded: "{rounded.xl}"
    padding: "10px 20px"
    border: "2px solid rgba(34,56,67,0.18)"
  button-secondary-hover:
    backgroundColor: "rgba(34,56,67,0.05)"
    border: "2px solid rgba(34,56,67,0.30)"
    transform: "translateY(-1px)"

  # ── Cards ─────────────────────────────────────────────────────────────────
  card:
    backgroundColor: "{colors.surface-container-lowest}"
    border: "1px solid rgba(219,211,216,0.60)"
    rounded: "{rounded.2xl}"
    padding: "{spacing.card-padding}"
    boxShadow: "{elevation.card}"

  card-hover:
    backgroundColor: "{colors.surface-container-lowest}"
    border: "1px solid rgba(219,211,216,0.50)"
    rounded: "{rounded.2xl}"
    padding: "24px"
    boxShadow: "{elevation.card}"
  card-hover-state:
    boxShadow: "{elevation.card-hover}"
    transform: "translateY(-4px)"

  card-feature:
    backgroundColor: "{colors.surface-container-lowest}"
    border: "1px solid rgba(219,211,216,0.50)"
    borderLeft: "3px solid {accent}"
    rounded: "{rounded.2xl}"
    padding: "24px"

  # ── Inputs ────────────────────────────────────────────────────────────────
  input-field:
    backgroundColor: "{colors.surface-container-lowest}"
    textColor: "{colors.on-surface}"
    typography: "{typography.body-md}"
    rounded: "{rounded.xl}"
    padding: "12px 14px"
    border: "1px solid {colors.outline}"
  input-field-focus:
    border: "1px solid transparent"
    boxShadow: "0 0 0 3px rgba(215,122,97,0.12)"

  # ── Navigation ────────────────────────────────────────────────────────────
  navbar:
    backgroundColor: "{colors.surface}"
    border: "1px solid rgba(219,211,216,0.50)"
    height: 64px
    padding: "0 24px"
    position: sticky
    zIndex: 40

  # ── Timeline (itinerary) ──────────────────────────────────────────────────
  timeline-line:
    width: 1px
    background: "linear-gradient(to bottom, rgba(215,122,97,0.45), rgba(216,180,160,0.30), transparent)"
  timeline-dot-default:
    size: 10px
    background: "{colors.outline}"
    border: "2px solid white"
  timeline-dot-alert:
    size: 10px
    background: "{colors.primary}"
    border: "2px solid white"
    boxShadow: "0 0 6px rgba(215,122,97,0.50)"

  timeline-item-default:
    backgroundColor: "rgba(239,241,243,0.70)"
    border: "1px solid rgba(219,211,216,0.50)"
    rounded: "{rounded.xl}"
    padding: "8px 12px"
  timeline-item-alert:
    backgroundColor: "rgba(215,122,97,0.08)"
    border: "1px solid rgba(215,122,97,0.22)"
    rounded: "{rounded.xl}"
    padding: "8px 12px"

  # ── Badges & Tags ─────────────────────────────────────────────────────────
  badge-live:
    backgroundColor: "rgba(215,122,97,0.12)"
    textColor: "{colors.primary}"
    border: "1px solid rgba(215,122,97,0.25)"
    rounded: "{rounded.full}"
    padding: "2px 8px"
    typography: "{typography.overline}"

  badge-tertiary:
    backgroundColor: "{colors.tertiary-container}"
    textColor: "{colors.on-tertiary-container}"
    border: "1px solid rgba(216,180,160,0.50)"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    typography: "{typography.overline}"

  # ── Section Divider ───────────────────────────────────────────────────────
  section-divider:
    height: 1px
    background: "linear-gradient(90deg, transparent, rgba(216,180,160,0.40), transparent)"

  # ── Scrollbar ─────────────────────────────────────────────────────────────
  scrollbar:
    width: 6px
    track: "#eff1f3"
    thumb: "#dbd3d8"
    thumb-hover: "#d8b4a0"
    thumbRadius: 3px

  # ── Error / Alert ─────────────────────────────────────────────────────────
  alert-error:
    backgroundColor: "rgba(215,122,97,0.08)"
    border: "1px solid rgba(215,122,97,0.25)"
    textColor: "{colors.on-primary-container}"
    rounded: "{rounded.xl}"
    padding: "12px 14px"

  # ── CTA Block ─────────────────────────────────────────────────────────────
  cta-block:
    background: "linear-gradient(135deg, rgba(216,180,160,0.30) 0%, rgba(215,122,97,0.15) 100%)"
    border: "1px solid rgba(215,122,97,0.20)"
    rounded: "{rounded.3xl}"
    padding: 48px

  # ── Stats Bar ─────────────────────────────────────────────────────────────
  stats-bar:
    backgroundColor: "{backgrounds.stats-bar}"
    padding: "48px 24px"
  stats-value:
    fontFamily: Cormorant
    fontSize: 30px
    fontWeight: "300"
    color: "{colors.tertiary}"
  stats-label:
    typography: "{typography.overline}"
    color: "rgba(255,255,255,0.45)"
---

## Brand & Style

WanderSync is a unified travel-management platform that aggregates flights, hotels, and transport into one chronological timeline, while surfacing real-time disruption alerts and privacy-first social discovery. The visual identity translates these ideas into a **solid pastel** aesthetic: grounded, clear, and quietly sophisticated, deliberately avoiding glassmorphism in favour of opaque surfaces that feel tactile and trustworthy.

The brand personality sits at the intersection of *editorial calm* and *functional precision* — like a well-designed travel journal that also knows your gate number. Every colour, weight, and animation choice serves one of two goals: **communicate trustworthiness** (through restraint and legibility) or **communicate intelligence** (through purposeful motion and data clarity).

## Colors

The palette is built around three anchoring hues that each carry a specific role:

- **Platinum (`#eff1f3`)** — the primary canvas. A cool off-white that feels clean without clinical sterility. Used as the global `background` and `surface`, it allows warmer elements to breathe.
- **Charcoal Blue (`#223843`)** — primary text and the stats-bar background. A deep teal-influenced near-black that reads "precision" without the coldness of pure black. At lower opacities (`.55`, `.45`, `.35`, `.30`) it becomes the text hierarchy, conveying depth without introducing new hues.
- **Burnt Peach (`#d77a61`)** — the brand accent. Every primary action, highlight, alert, and interactive state is painted in this muted terracotta. Warm enough to be welcoming, saturated enough to guide the eye. Its glow (`rgba(215,122,97,0.22–0.35)`) is used in drop-shadows to ensure CTAs feel alive rather than flat.
- **Desert Sand (`#d8b4a0`)** — the secondary warm accent. Used in step-counter numerals, timeline gradients, and scrollbar hover states. It acts as Burnt Peach's quieter sibling — present on surfaces where the stronger peach would feel too urgent.
- **Dust Grey (`#dbd3d8`)** — borders and dividers. A lavender-tinted grey that prevents hard lines from feeling clinical.

Colour at opacity is preferred over additional solid hues. Backgrounds use `rgba` tints of the brand palette (12–25%) so the page always feels like one unified wash rather than a collection of blocks.

## Typography

WanderSync uses a **two-family typographic system** that draws a clear line between aspiration and function:

- **Cormorant** (serif) — headlines, display numbers, the logotype. A refined high-contrast serif that evokes editorial travel magazines. Used at light to medium weights (`300–500`) with tight tracking (`-0.01em` to `-0.02em`) to feel modern rather than nostalgic. Its thin strokes contrast beautifully against the warm pastel backgrounds.
- **Montserrat** (sans-serif) — all body copy, labels, navigation, forms. A geometric humanist sans that reads cleanly at small sizes and projects quiet authority. Body text sits at `400` weight; interactive labels step up to `600` for distinction without aggression.

The logotype itself plays on the contrast: `Wander` renders in Cormorant, `Sync` in Burnt Peach — visually encoding the brand's dual DNA of wanderlust and technical reliability. An italic Cormorant (`<em>`) is used for hero sub-phrases to add editorial rhythm without introducing another weight.

Type sizing follows a modular scale. Hero display (`68px`, `lh 72px`) creates an immediate focal anchor; supporting headlines scale cleanly down through `48 → 36 → 28 → 20px`. Body copy at `16px / 26px` prioritises legibility over density.

## Layout & Spacing

Layout is structured around an **8px base grid** with generous proportions. The philosophy is one of *breathing room*: sections are separated by `96px` vertical rhythm, cards use `20–24px` internal padding, and the container max-width caps at `max-w-6xl` (~1152px) with `48px` lateral gutters.

Key spatial decisions:

- The hero section uses a **two-column flex layout** on large screens — editorial copy left, interactive flight visualization right — collapsing to a single column on mobile.
- The features grid is **1 → 2 → 4 columns** across breakpoints. Features are accented with a 3px left border in their individual brand colour rather than icon backgrounds, keeping the grid airy.
- The stats bar deliberately breaks the platinum background with solid Charcoal Blue, creating a visual anchor that bisects the landing page and signals "social proof."
- The auth pages centre a `max-w-sm` card within a full-viewport platinum canvas, using large radial bloom gradients (non-blurred, purely opacity-based) as decorative atmospheric layers.

## Elevation & Depth

Depth is expressed through **shadow warmth** rather than height. All elevation in WanderSync is achieved with shadows whose colour is tinted toward the brand palette (never neutral grey):

- **Resting cards** (`shadow-card`): `0 4px 32px rgba(34,56,67,0.08)` — cool tonal, almost imperceptible, suggesting a surface separation without drama.
- **Hovered cards** (`shadow-card-hover`): `0 10px 48px rgba(34,56,67,0.13)` — the lift is communicated by shadow expansion and a `translateY(-4px)` transform, not colour change.
- **Warm / CTA shadows** (`shadow-warm`, `shadow-warm-lg`): tinted with Burnt Peach at 22–32% opacity. Primary buttons have this shadow baked in so they appear to emit light in the brand colour, making them feel genuinely premium.
- **No glassmorphism**. An earlier design iteration used `backdrop-filter: blur()` but this was explicitly removed in favour of solid white card surfaces. The decision preserves rendering performance and accessibility; frosted glass cannot guarantee WCAG contrast ratios against arbitrary content below.

## Shapes

The shape language is **moderately rounded** — friendly without being playful:

- `rounded-xl` (`12px` equivalent) is used for all interactive elements: buttons, inputs, badges, and timeline entries. This gives a soft, tactile feeling.
- `rounded-2xl` / `rounded-3xl` are reserved for cards and CTA containers to spatially separate them from inline interactive elements.
- `rounded-full` (`9999px`) is used only for small badges (e.g., the "Live" pill) and loading spinners, where it communicates "a status chip" vs "a container."

Icon strokes throughout use `strokeWidth="1.8"` with `strokeLinecap="round"` and `strokeLinejoin="round"`, harmonising with the container border radius language.

## Motion

Motion is purposeful and **respectful of user preference**. All SVG flight-path animations (draw-path, cloud-drift, trail-pulse, plane float) are suppressed entirely under `prefers-reduced-motion: reduce`, and the SVG plane element is hidden to prevent content confusion.

For page-entry choreography, a **staggered slide-up system** (5 steps, 80ms apart) reveals the landing-page sections sequentially, creating a sense of the page assembling rather than dumping in all at once. This matches the WanderSync experience — your trip builds piece by piece.

The **flight animation** SVG is the centrepiece decorative element. It renders an SVG arc from a left-side IATA dot to a right-side dot using `stroke-dasharray`/`stroke-dashoffset` animation, with a floating ✈ plane icon following the path. This directly illustrates the product's core value proposition (aggregating flight data) while functioning as premium illustration.

Key timing rules:

- All hover state transitions: `200ms ease-out` — fast enough to feel responsive, slow enough to feel intentional.
- Card lift on hover: `300ms ease-out` to give the physical "picking up" sensation.
- Modal/form entry (`scaleIn`): `280ms ease-out` from `scale(0.96)` to prevent jarring pops.
- Loading spinner: CSS `border-top-white` on a `rounded-full` div — no heavy animation libraries.
- Float animation (`7s ease-in-out infinite`): used on the HeroCard to gently suggest it is "live" data.

## Components

### Buttons
There are two button variants: **primary** (Burnt Peach solid) and **secondary** (transparent with subtle border). Both share identical sizing (`px-5 py-2.5`, `rounded-xl`) to allow side-by-side placement without visual tension. Primary buttons carry a warm box-shadow baked in so they appear elevated even at rest. Hover states deepen the fill colour and add a `translateY(-1px)` lift — physical metaphor for pressing forward.

Disabled states are `opacity-60` with `cursor-not-allowed`, never using a grey fill, preserving palette coherence.

### Cards
The system has three card types:

1. **`card`** — static container for structured data (e.g., hero itinerary preview). White background, `shadow-card`, `1px dust-grey` border.
2. **`card-hover`** — interactive feature cards. Same base but with `cursor-default` and a hover state that lifts `10px` via shadow expansion + transform.
3. **`card-feature`** — feature-grid cards that use a 3px left border in a per-feature accent colour as the sole distinguishing mark, keeping the grid unified while affording individual identity.

### Timeline (Itinerary Display)
Timeline entries use a vertical `1px` gradient bar (Burnt Peach top → Desert Sand mid → transparent bottom) as the spine. Individual events are circles (10px, 2px white border): grey for normal, Burnt Peach with a glow pulse for disrupted events. Alert entries invert the card fill to a 8% Burnt Peach wash with a matching border, making disruptions visually unmissable without being alarming.

### Forms
Form inputs have a clean `bg-white` fill with a `1px dust-grey` border and a `3px Burnt Peach rgba(0.12)` focus ring — lightweight enough for dense auth flows without overwhelming the platinum page. Icon adornments (mail, lock) appear at 35% charcoal opacity so they read as helpful hints rather than heavy decoration.

Error messages use the `alert-error` pattern: a warm peach wash at 8% with a full-strength peach icon and text, consistent with the disruption-alert colour so the system-wide severity scale is learnable.

### Navigation Bar
The navbar is `sticky top-0`, 64px tall, platinum background with a `0.5 opacity dust-grey` bottom border. The logo uses the Cormorant/Burnt Peach split treatment. On desktop, the nav carries two actions: a ghost "Sign in" text link and a `btn-primary` "Plan Your Journey" CTA — intentionally asymmetric to push conversion.

### Pastel Background Decoration
Radial gradient blooms (Desert Sand and Burnt Peach at 13–22% opacity, no blur) are layered as `absolute pointer-events-none` elements to add atmosphere without affecting content legibility. A subtle dot pattern (`28px × 28px`, 1px circles at 35% dust-grey) at 30–40% opacity adds texture at zero perceptual cost.

### Scrollbar
The custom scrollbar is 6px wide with a `#eff1f3` track (matching the page background) and a `#dbd3d8` thumb that warms to Desert Sand on hover — a small refinement that reinforces the palette even in peripheral UI surfaces.
