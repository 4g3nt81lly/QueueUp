import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { build, defineConfig, type PluginOption } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __pages_dirname = resolve(__dirname, 'app', 'pages');

const PRODUCTION = process.env.NODE_ENV === 'production';

export default defineConfig({
	appType: 'custom',
	root: 'app',
	plugins: [react(), tailwindcss(), buildSSREntry()],
	build: {
		rollupOptions: {
			input: {
				home: resolve(__pages_dirname, 'home/index.html'),
				login: resolve(__pages_dirname, 'login/index.html'),
				queueRoom: resolve(__pages_dirname, 'queue-room/index.html'),
			},
		},
		outDir: '../dist/client',
		emptyOutDir: true,
		minify: PRODUCTION,
		cssMinify: PRODUCTION,
		watch: PRODUCTION ? null : {},
	},
	envDir: '../',
});

function buildSSREntry(buildEnd?: (error?: Error) => Promise<void>): PluginOption {
	const serverEntryFile = 'server/entry-server.tsx';
	return {
		name: 'build-ssr-entry',
		apply: 'build',
		enforce: 'pre',
		async buildStart() {
			// build SSR server entry
			await build({
				build: {
					ssr: serverEntryFile,
					outDir: 'dist/server',
					emptyOutDir: true,
					minify: PRODUCTION,
					cssMinify: PRODUCTION,
				},
				configFile: false,
			});
			// watch SSR server entry for changes
			if (!PRODUCTION) {
				this.addWatchFile(resolve(__dirname, serverEntryFile));
			}
		},
		buildEnd,
	};
}
