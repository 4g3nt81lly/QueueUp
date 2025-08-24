import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fg from 'fast-glob';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { build, defineConfig, type PluginOption } from 'vite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const __pages_dirname = resolve(__dirname, 'app', 'pages');

const PRODUCTION = process.env.NODE_ENV === 'production';

export default defineConfig({
	appType: 'custom',
	root: 'app',
	plugins: [react(), tailwindcss(), buildSSR()],
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

function buildSSR(buildEnd?: (error?: Error) => Promise<void>): PluginOption {
	const serverEntryFile = 'server/entry-server.tsx';

	const ssrConfigFiles = fg.sync('**/ssr.config.ts', { cwd: __pages_dirname });
	const input: Record<string, string> = {};
	for (const file of ssrConfigFiles) {
		const outFile = file.replace('/', '-').replace(/\.ts$/, '');
		input[outFile] = resolve(__pages_dirname, file);
	}

	return {
		name: 'build-ssr-entry',
		apply: 'build',
		enforce: 'pre',
		async buildStart() {
			// Build SSR server entry
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
			// Watch SSR server entry for changes
			if (!PRODUCTION) {
				this.addWatchFile(resolve(__dirname, serverEntryFile));
			}

			// Build **/ssr.config.ts for dynamic imports
			await build({
				build: {
					outDir: 'dist/server/configs',
					emptyOutDir: true,
					minify: PRODUCTION,
					rollupOptions: {
						input,
						output: {
							entryFileNames: '[name].js',
						},
						preserveEntrySignatures: 'exports-only',
					},
				},
				configFile: false,
			});
			// Watch **/ssr.config.ts for changes
			if (!PRODUCTION) {
				for (const configFile of Object.values(input)) {
					this.addWatchFile(configFile);
				}
			}
		},
		buildEnd,
	};
}
