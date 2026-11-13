import type { Config } from 'tailwindcss'

/**
 * tailwind.config.ts — Social Sips, "Traditional bar".
 * Mirrors the @theme tokens in src/app/globals.css (loaded there via `@config`).
 * Bottle-green ground, cream type, brass detailing. Colour beyond brass only carries meaning.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        bg: '#0F2A22', surface: '#15342A', raised: '#1C3D32', rule: '#3C5A48', line: '#7E8F78',
        ink: '#F3EAD3', 'ink-2': '#D2C8AE', 'ink-3': '#ADA48A',
        accent: '#C9A55C', 'accent-hover': '#D8B46C', 'accent-press': '#B8944D', 'on-accent': '#0F2A22',
        'hangover-none': '#8FD3A6', 'hangover-mild': '#F0A95B', 'hangover-heavy': '#F48C7C',
        success: '#8FD3A6', danger: '#F48C7C',
        'danger-fill': '#B42318', 'danger-fill-hover': '#9A1D14', 'on-danger': '#FFFFFF',
        focus: '#C9A55C',
      },
      fontFamily: {
        display: ['var(--font-dm-serif)', 'Georgia', 'serif'],
        caps: ['var(--font-playfair-sc)', 'Georgia', 'serif'],
        sans: ['var(--font-libre-franklin)', 'system-ui', 'sans-serif'],
      },
      borderRadius: { sm: '2px' }, // the only override; no lg/xl/2xl usage anywhere
      spacing: { 20: '80px' }, // default already; listed so reviewers see 80 is allowed
      transitionDuration: { fast: '120ms', base: '180ms' },
      transitionTimingFunction: { brand: 'cubic-bezier(.2,.8,.2,1)' },
      keyframes: {
        // Only /play (dice-shake, card-flip, celebrate) and the tab-pending opacity pulse; defined in globals.css.
      },
    },
  },
  plugins: [],
}

export default config
