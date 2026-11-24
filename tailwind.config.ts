import type { Config } from "tailwindcss";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./pages/**/*.{js,ts,jsx,tsx,mdx}",
		"./components/**/*.{js,ts,jsx,tsx,mdx}",
		"./app/**/*.{js,ts,jsx,tsx,mdx}",
		"./lib/**/*.{js,ts,jsx,tsx,mdx}",
		"*.{js,ts,jsx,tsx,mdx}"
	],
	theme: {
		extend: {
			colors: {
				'wingman-orange': 'hsl(var(--wingman-orange) / <alpha-value>)',
				// defined by aryan
				'wingman-primary-text': 'hsl(var(--wingman-primary-text) / <alpha-value>)',//#E5E2E1
				'wingman-emphasis-text': 'hsl(var(--wingman-emphasis-text) / <alpha-value>)',//#FFFFFF
				'wingman-secondary-text': 'hsl(var(--wingman-secondary-text) / <alpha-value>)',//#BBC9CF
				'wingman-muted-text': 'hsl(var(--wingman-muted-text) / <alpha-value>)',//#9CA3AF
				'wingman-light-accent-text': 'hsl(var(--wingman-light-accent-text) / <alpha-value>)',//#003642
				'wingman-light-surface-text': 'hsl(var(--wingman-light-surface-text) / <alpha-value>)',//#050505
				'wingman-cyan': 'hsl(var(--wingman-cyan) / <alpha-value>)', // #A8E8FF;

				// button
				'wingman-green-button': 'hsl(var(--wingman-green-button) / <alpha-value>)',
				'wingman-green-button-text': 'hsl(var(--wingman-green-button-text) / <alpha-value>)',

				// 
				'wingman-orange-muted': 'hsl(var(--wingman-orange-muted) / <alpha-value>)',
				'wingman-orange-dark': 'hsl(var(--wingman-orange-dark) / <alpha-value>)',
				'wingman-purple': 'hsl(var(--wingman-purple) / <alpha-value>)',
				'wingman-purple-light': 'hsl(var(--wingman-purple-light) / <alpha-value>)',
				'wingman-lavender': 'hsl(var(--wingman-lavender) / <alpha-value>)',
				'wingman-green': 'hsl(var(--wingman-green) / <alpha-value>)',
				'wingman-dark': 'hsl(var(--wingman-dark) / <alpha-value>)',
				'wingman-gray': 'hsl(var(--wingman-gray) / <alpha-value>)',
				// Site canvas: light #F7F5F0, dark #0A0A0A (also --background in globals.css)
				canvas: {
					light: '#F7F5F0',
					dark: '#0A0A0A'
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))',
					purple: {
						DEFAULT: 'hsl(var(--secondary-purple) / <alpha-value>)',
						foreground: 'hsl(var(--secondary-purple-foreground) / <alpha-value>)'
					}
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				},
				sidebar: {
					DEFAULT: 'hsl(var(--sidebar-background))',
					foreground: 'hsl(var(--sidebar-foreground))',
					primary: 'hsl(var(--sidebar-primary))',
					'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
					accent: 'hsl(var(--sidebar-accent))',
					'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
					border: 'hsl(var(--sidebar-border))',
					ring: 'hsl(var(--sidebar-ring))'
				}
			},
			fontFamily: {
				sans: ['var(--font-poppins)', 'sans-serif'],
				sf: ['"SF Pro Display"', '"SF Pro Text"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
				'sf-compact': ['"SF Compact"', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'sans-serif'],
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			},
			keyframes: {
				'accordion-down': {
					from: {
						height: '0'
					},
					to: {
						height: 'var(--radix-accordion-content-height)'
					}
				},
				'accordion-up': {
					from: {
						height: 'var(--radix-accordion-content-height)'
					},
					to: {
						height: '0'
					}
				},
				'float': {
					'0%, 100%': { transform: 'translateY(0px)' },
					'50%': { transform: 'translateY(-20px)' }
				},
				'pulse-glow': {
					'0%, 100%': { boxShadow: '0 0 20px rgba(56, 189, 248, 0.3)' },
					'50%': { boxShadow: '0 0 40px rgba(56, 189, 248, 0.6)' }
				},
				'gradient-shift': {
					'0%': { backgroundPosition: '0% 50%' },
					'50%': { backgroundPosition: '100% 50%' },
					'100%': { backgroundPosition: '0% 50%' }
				},
				'shimmer': {
					'0%': { backgroundPosition: '-1000px 0' },
					'100%': { backgroundPosition: '1000px 0' }
				},
				'rotate-slow': {
					from: { transform: 'rotate(0deg)' },
					to: { transform: 'rotate(360deg)' }
				},
				'scale-in': {
					'0%': { transform: 'scale(0.8)', opacity: '0' },
					'100%': { transform: 'scale(1)', opacity: '1' }
				},
				'slide-up': {
					from: { transform: 'translateY(30px)', opacity: '0' },
					to: { transform: 'translateY(0)', opacity: '1' }
				},
				'bounce-subtle': {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-10px)' }
				},
				'wiggle': {
					'0%, 100%': { transform: 'rotate(0deg)' },
					'25%': { transform: 'rotate(-5deg)' },
					'75%': { transform: 'rotate(5deg)' }
				},
				'glow-pulse': {
					'0%, 100%': { opacity: '0.5' },
					'50%': { opacity: '1' }
				},
				'marquee': {
					'0%': { transform: 'translateX(0%)' },
					'100%': { transform: 'translateX(-50%)' }
				},
				'scan-line': {
					'0%': { top: '0%' },
					'50%': { top: '100%' },
					'100%': { top: '0%' }
				}
			},
			animation: {
				'accordion-down': 'accordion-down 0.2s ease-out',
				'accordion-up': 'accordion-up 0.2s ease-out',
				'float': 'float 6s ease-in-out infinite',
				'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
				'gradient-shift': 'gradient-shift 8s ease infinite',
				'shimmer': 'shimmer 3s infinite',
				'rotate-slow': 'rotate-slow 20s linear infinite',
				'scale-in': 'scale-in 0.5s ease-out',
				'slide-up': 'slide-up 0.6s ease-out',
				'bounce-subtle': 'bounce-subtle 2s ease-in-out infinite',
				'wiggle': 'wiggle 1s ease-in-out infinite',
				'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
				'marquee': 'marquee 8s linear infinite',
				'scan-line': 'scan-line 2s linear infinite'
			},
			// by aryan
			backgroundImage: {
				'gradient-brand': 'linear-gradient(90deg, #00D4FF 0%, #9D05FF 100%)', //for buttons
			},
			screens: {
				'desk': '768px',    // not in use
				'mobile': '768px',  
				'aside-hide': '1024px'
			}
		}
	},
	plugins: [require("tailwindcss-animate")],
};
export default config;
