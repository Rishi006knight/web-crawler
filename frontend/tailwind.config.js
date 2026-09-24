import tailwindAnimate from 'tailwindcss-animate';

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    screens: {
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
    extend: {
      fontFamily: {
        sans: ['"Inter"', '"Poppins"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
        mono: ['"Fira Code"', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      colors: {
        canvas: 'var(--canvas)',
        surface: {
          DEFAULT: 'var(--surface)',
          raised: 'var(--surface-raised)',
          sunken: 'var(--surface-sunken)',
          glass: 'var(--surface-glass)',
        },
        ink: {
          DEFAULT: 'var(--text-body)',
          strong: 'var(--text-strong)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        line: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
          glass: 'var(--border-glass)',
        },
        brand: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
          subtle: 'var(--accent-subtle)',
          ring: 'var(--accent-ring)',
        },
        gradient: {
          start: 'var(--gradient-start)',
          end: 'var(--gradient-end)',
          pink: 'var(--accent-pink)',
        },
        status: {
          success: 'var(--status-success)',
          'success-bg': 'var(--status-success-bg)',
          'success-line': 'var(--status-success-line)',
          warning: 'var(--status-warning)',
          'warning-bg': 'var(--status-warning-bg)',
          'warning-line': 'var(--status-warning-line)',
          danger: 'var(--status-danger)',
          'danger-bg': 'var(--status-danger-bg)',
          'danger-line': 'var(--status-danger-line)',
          info: 'var(--status-info)',
          'info-bg': 'var(--status-info-bg)',
          'info-line': 'var(--status-info-line)',
          blocked: 'var(--status-blocked)',
          'blocked-bg': 'var(--status-blocked-bg)',
          'blocked-line': 'var(--status-blocked-line)',
        }
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
        '3xl': '20px',
        '4xl': '24px',
      },
      boxShadow: {
        'soft': '0 4px 12px rgba(0, 0, 0, 0.06)',
        'hairline': '0 1px 3px rgba(0, 0, 0, 0.06), 0 1px 2px rgba(0, 0, 0, 0.04)',
        'floating': '0 8px 30px -4px rgba(0, 0, 0, 0.12), 0 4px 10px -2px rgba(0, 0, 0, 0.06)',
        'glass': '0 8px 32px rgba(0, 0, 0, 0.08)',
        'glow': '0 0 16px rgba(0, 217, 255, 0.2), 0 0 32px rgba(168, 85, 247, 0.1)',
        'glow-sm': '0 0 8px rgba(0, 217, 255, 0.15)',
        'emboss': 'inset 0 1px 2px rgba(255, 255, 255, 0.5), inset 0 -1px 2px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0, 0, 0, 0.06)',
        'pressed': 'inset 0 2px 4px rgba(0, 0, 0, 0.08), inset 0 1px 2px rgba(0, 0, 0, 0.04)',
      },
      transitionDuration: {
        'fast': '120ms',
        'base': '200ms',
        'slow': '320ms',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(ellipse at center, var(--tw-gradient-stops))',
        'gradient-accent': 'linear-gradient(135deg, var(--gradient-start), var(--gradient-end))',
        'gradient-hero': 'linear-gradient(135deg, rgba(0, 217, 255, 0.08) 0%, rgba(168, 85, 247, 0.08) 50%, rgba(255, 107, 157, 0.04) 100%)',
      },
    },
  },
  plugins: [tailwindAnimate],
}
