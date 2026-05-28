/**
 * Marketing-site design tokens.
 *
 * This file is the single source of truth for the public landing pages.
 * The same values are mirrored into Tailwind's @theme block in
 * globals.css under a `mk-` prefix (e.g. `bg-mk-primary-500`) so the
 * Tailwind toolchain can statically pick them up.
 *
 * Treat THIS file as authoritative — when you edit a token, also edit
 * the matching CSS variable in globals.css. No runtime style-injection;
 * static is faster and predictable.
 *
 * NB: This is intentionally scoped to /marketing pages so the existing
 * authenticated app keeps its own `brand-*` palette unchanged.
 */

/* ───────── Palette ─────────────────────────────────────────────────
 * Story: warm trustworthy ink + restrained money-toned primary + a
 * single supporting accent. Avoids generic fintech blue. Tuned for
 * WCAG AA on the chosen neutrals.
 */
export const colors = {
  // Primary — a deep, refined sienna. Reads as confident + financial,
  // not playful. Used on buttons, focused states, key emphasis.
  primary: {
    50: "#FDF1EB",
    100: "#F9DDCC",
    200: "#F1B79B",
    400: "#DD6B3A",
    500: "#D14A1F", // primary brand
    600: "#B23E18", // hover / pressed
    700: "#8E2F11",
    900: "#52180A",
  },
  // Accent — deep evergreen. Used sparingly: success states, small
  // badges, the comma between two metrics. Conveys "money / growth"
  // without competing with primary.
  accent: {
    50: "#E7F1ED",
    500: "#0E5240",
    600: "#0A3F31",
    700: "#062A21",
  },
  // Neutrals — warm-cool blend. Background is just off pure white so
  // surfaces above it have somewhere to "float" without shadow tricks.
  ink: {
    950: "#0B0F12", // deepest text + dark surfaces
    800: "#1B2025",
    700: "#3A4047", // body text
    500: "#6B7178", // captions / muted
    300: "#D7D3CD", // hairline borders
    100: "#F2EFEA", // subtle alt-surface (chips, table headers)
    50: "#FBFAF7", // page background
  },
  surface: "#FFFFFF",
  // Semantic colors that map to the palette above. Use these instead of
  // the literal hex so meaning is recoverable.
  semantic: {
    success: "#0E5240",
    warning: "#E8B14B",
    danger: "#B53D24",
  },
} as const;

/* ───────── Type scale ──────────────────────────────────────────────
 * Mobile-first. Each step is [fontSize, lineHeight, letterSpacing,
 * fontWeight]. The desktop column overrides at >=md.
 *
 * Font: Inter (loaded in app/layout.tsx). Display uses tighter tracking
 * to feel editorial.
 */
export const type = {
  display: {
    mobile: { size: "44px", line: "52px", tracking: "-0.03em", weight: 700 },
    desktop: { size: "72px", line: "80px", tracking: "-0.035em", weight: 700 },
  },
  h1: {
    mobile: { size: "32px", line: "40px", tracking: "-0.025em", weight: 700 },
    desktop: { size: "52px", line: "60px", tracking: "-0.028em", weight: 700 },
  },
  h2: {
    mobile: { size: "26px", line: "34px", tracking: "-0.02em", weight: 600 },
    desktop: { size: "36px", line: "44px", tracking: "-0.022em", weight: 600 },
  },
  h3: {
    mobile: { size: "20px", line: "28px", tracking: "-0.015em", weight: 600 },
    desktop: { size: "24px", line: "32px", tracking: "-0.015em", weight: 600 },
  },
  bodyLg: { size: "17px", line: "28px", tracking: "0", weight: 400 },
  body: { size: "15px", line: "24px", tracking: "0", weight: 400 },
  bodySm: { size: "13px", line: "20px", tracking: "0", weight: 400 },
  caption: {
    size: "11px",
    line: "16px",
    tracking: "0.16em",
    weight: 600,
    transform: "uppercase",
  },
  mono: {
    family:
      "ui-monospace, 'SF Mono', SFMono-Regular, Menlo, Consolas, monospace",
  },
} as const;

/* ───────── Spacing scale ──────────────────────────────────────────
 * 4px base. Section vertical padding uses the larger steps — keep
 * generous whitespace for the fintech-grade feel.
 */
export const space = {
  1: "4px",
  2: "8px",
  3: "12px",
  4: "16px",
  5: "20px",
  6: "24px",
  8: "32px",
  10: "40px",
  12: "48px",
  16: "64px",
  20: "80px",
  24: "96px",
  32: "128px",
  40: "160px",
} as const;

/* ───────── Border radius ──────────────────────────────────────────
 * Restrained scale. Cards never look like marshmallows.
 */
export const radius = {
  sm: "6px", // inputs, chips
  md: "10px", // buttons, small cards
  lg: "16px", // standard cards
  xl: "24px", // hero surfaces
  full: "9999px", // pills
} as const;

/* ───────── Shadows ────────────────────────────────────────────────
 * Three steps + a focus ring. Tuned cool-ish so they read as depth on
 * the warm cream background, not muddy.
 */
export const shadow = {
  // Almost invisible. Buttons, table edges.
  1: "0 1px 2px rgba(11, 15, 18, 0.06)",
  // Lift — cards, dropdowns.
  2: "0 4px 16px -4px rgba(11, 15, 18, 0.10), 0 2px 6px -2px rgba(11, 15, 18, 0.06)",
  // Hero — product mockup floating on the hero.
  3: "0 20px 48px -20px rgba(11, 15, 18, 0.18), 0 8px 16px -8px rgba(11, 15, 18, 0.10)",
  // Focus ring — primary at 18% alpha.
  focus: "0 0 0 3px rgba(209, 74, 31, 0.22)",
} as const;

/* ───────── Layout ─────────────────────────────────────────────────
 * Container widths + section paddings. Tuned for an editorial feel on
 * desktop, comfortable thumb zones on mobile.
 */
export const layout = {
  containerMax: "1120px",
  containerPaddingX: { mobile: "20px", desktop: "32px" },
  sectionPaddingY: { mobile: "64px", desktop: "112px" },
  sectionPaddingYTight: { mobile: "40px", desktop: "64px" },
} as const;

/* ───────── Motion ─────────────────────────────────────────────────
 * Two timings, two easings. Use these — don't invent new ones in
 * components.
 */
export const motion = {
  duration: {
    fast: "160ms",
    base: "240ms",
    slow: "420ms",
  },
  ease: {
    standard: "cubic-bezier(0.2, 0, 0, 1)",
    decel: "cubic-bezier(0.16, 1, 0.3, 1)",
  },
} as const;
