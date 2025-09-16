import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nodePolyfills } from 'vite-plugin-node-polyfills'

// https://vite.dev/config/
export default defineConfig({
	plugins: [
		tailwindcss(),
		react(),
		nodePolyfills({
			protocolImports: true,
		}),
	],
	define: {
		'global': 'globalThis',
		'process.env': {},
	},
	resolve: {
		alias: {
			buffer: 'buffer',
			process: 'process/browser',
		},
	},
	esbuild: {
		define: {
			global: 'globalThis',
		},
	},
	optimizeDeps: {
		include: ['buffer', 'process'],
		esbuildOptions: {
			define: {
				global: 'globalThis',
			},
		},
	},
})
