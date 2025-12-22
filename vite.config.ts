import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import Components from 'unplugin-vue-components/vite'
import { NaiveUiResolver } from 'unplugin-vue-components/resolvers'
import pkg from './package.json'

export default defineConfig(configEnv => {
	const buildTime = new Date().toISOString()
	const version = pkg.version

	return {
		plugins: [
			vue(),
			Components({
				resolvers: [NaiveUiResolver()],
			}),
		],
		define: {
			__DEV_MODE__: JSON.stringify(configEnv.mode === 'development'),
			__APP_VERSION__: JSON.stringify(version),
			__BUILD_TIME__: JSON.stringify(buildTime),
		},
		resolve: {
			alias: {
				'@': path.resolve(__dirname, 'src'),
			},
		},
		server: {
			host: '0.0.0.0',
			port: 5174,
			origin: 'http://admin.laravel11-base.test:5174',
			cors: true,
			proxy: {
				'/api': 'http://admin.laravel11-base.test',
				'/storage': 'http://admin.laravel11-base.test',
			},
		},
		build: {
			outDir: 'dist',
			emptyOutDir: true,
			rollupOptions: {
				output: {
					entryFileNames: 'assets/js/[name].js',
					chunkFileNames: 'assets/js/[name].js',
					assetFileNames: 'assets/[ext]/[name].[ext]',
				},
			},
		},
	}
})
