import type { Config } from 'tailwindcss'

/**
 * tailwind.config.ts — Social Sips
 *
 * ⚠️  NOTE ON TAILWIND VERSIONS:
 * - If create-next-app gave you Tailwind v4 (likely in 2025+), your main
 *   design tokens live in globals.css under @theme {}. This file is still
 *   useful for extending the config and gets loaded via `@config` in CSS.
 * - If you have Tailwind v3, this file is your primary config source.
 *
 * Colour palette:
 *   Background:     #0F172A  (deep navy)
 *   Surface/Cards:  #1E293B
 *   Accent Purple:  #A855F7  (neon purple — primary CTA)
 *   Accent Cyan:    #67E8F9  (electric cyan — highlights)
 *   Accent Pink:    #F472B6  (warm pink — fun touches)
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // === Base backgrounds ===
        background: '#0F172A',
        surface: '#1E293B',
        'surface-hover': '#263348',
        border: '#334155',

        // === Brand accents ===
        'accent-purple': '#A855F7',
        'accent-cyan': '#67E8F9',
        'accent-pink': '#F472B6',

        // === Text hierarchy ===
        'text-primary': '#F1F5F9',
        'text-secondary': '#94A3B8',
        'text-muted': '#475569',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':
          'radial-gradient(ellipse at top, rgba(168,85,247,0.12) 0%, transparent 60%)',
        'card-gradient':
          'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
        'purple-cyan':
          'linear-gradient(135deg, #A855F7, #67E8F9)',
        'warm-gradient':
          'linear-gradient(135deg, #F472B6, #A855F7)',
      },
      boxShadow: {
        'neon-purple': '0 0 20px rgba(168, 85, 247, 0.35)',
        'neon-cyan': '0 0 20px rgba(103, 232, 249, 0.35)',
        'neon-pink': '0 0 20px rgba(244, 114, 182, 0.35)',
        card: '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-lg': '0 8px 40px rgba(0, 0, 0, 0.5)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },
      animation: {
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite alternate',
        float: 'float 6s ease-in-out infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
      },
      keyframes: {
        'glow-pulse': {
          '0%': { boxShadow: '0 0 20px rgba(168, 85, 247, 0.3)' },
          '100%': { boxShadow: '0 0 40px rgba(168, 85, 247, 0.6)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}

export default config
