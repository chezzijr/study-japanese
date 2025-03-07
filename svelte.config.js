import { mdsvex } from 'mdsvex';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess(), mdsvex()],

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
        paths: {
            base: process.env.NODE_ENV === 'production' ? '/study-japanese' : '',
        },
		prerender: {
			entries: [
				'/',
				'/practice/hiragana',
				'/practice/kanji',
				'/practice/katakana',
				'/practice/n5/u1', 
				'/practice/n5/u2', 
				'/practice/n5/u3', 
				'/practice/n5/u4', 
				'/practice/n5/u5', 
				'/practice/n5/u6', 
				'/practice/n5/u7',
				'/practice/n5/u8',
				'/practice/n5/u9',
				'/practice/n5/all',
			]
		}
	},

	extensions: ['.svelte', '.svx']
};

export default config;
