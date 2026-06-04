import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{ts,tsx}',
    './src/components/**/*.{ts,tsx}',
    './src/app/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        /* Layered surface fills (raw colors, theme-aware via CSS vars) */
        surface: {
          0: 'var(--surface-0)',
          1: 'var(--surface-1)',
          2: 'var(--surface-2)',
          3: 'var(--surface-3)',
        },
        /* Semantic colors — now theme-aware with foreground pairs.
           Keep legacy single-value access via DEFAULT for back-compat. */
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger))',
          foreground: 'hsl(var(--danger-foreground))',
        },
      },
      borderRadius: {
        /* Unified scale: sm 10 / md 14 / lg 18 / xl 24 */
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
        /* Legacy aliases kept so existing screens don't break */
        '2xl': 'var(--radius-xl)',
        '3xl': '28px',
        full: '9999px',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        /* Crafted type scale (size / line-height / tracking) */
        'display': ['2.5rem', { lineHeight: '1.05', letterSpacing: '-0.03em', fontWeight: '800' }],
        'h1': ['1.75rem', { lineHeight: '1.15', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h2': ['1.375rem', { lineHeight: '1.2', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h3': ['1.125rem', { lineHeight: '1.3', letterSpacing: '-0.015em', fontWeight: '600' }],
      },
      boxShadow: {
        /* Layered elevation, theme-aware */
        'elevation-1': 'var(--shadow-1)',
        'elevation-2': 'var(--shadow-2)',
        'elevation-3': 'var(--shadow-3)',
        /* Legacy names remapped onto the new elevation scale */
        card: 'var(--shadow-1)',
        'card-hover': 'var(--shadow-2)',
        /* Brand glow for accent elements */
        glow: '0 8px 24px -6px rgba(108,99,255,0.45)',
      },
      maxWidth: {
        mobile: '430px',
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'fade-in': 'fadeIn 0.2s ease-out',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(8px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
}

export default config
