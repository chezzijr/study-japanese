import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
// prerender entries
const initialEntries = [
	'/',
	'/practice/verb'
]

// practice routes - dynamic across all levels
const practiceLevels = ['n1', 'n2', 'n3', 'n4', 'n5'];
const practiceUnitEntries = practiceLevels.flatMap(level => {
	const levelDir = `./src/lib/${level}`;
	if (!fs.existsSync(levelDir)) return [];
	const levelUnits = fs.readdirSync(levelDir).filter(f => f.endsWith('.json'));
	return [
		...levelUnits.map(file => `/practice/${level}/${file.replace('.json', '')}`),
		`/practice/${level}/all`
	];
});

// vocab routes - dynamic across all levels
const vocabLevels = ['n1', 'n2', 'n3', 'n4', 'n5'];
const vocabEntries = vocabLevels.flatMap(level => {
	const levelDir = `./src/lib/${level}`;
	if (!fs.existsSync(levelDir)) return [];
	const levelUnits = fs.readdirSync(levelDir).filter(f => f.endsWith('.json'));
	return [
		...levelUnits.map(file => `/vocab/${level}/${file.replace('.json', '')}`),
		`/vocab/${level}/all`
	];
});

const kanjiLevels = fs.readdirSync('./src/lib/kanji').map(file => file.replace('.json', ''))
const kanjiEntries = kanjiLevels.map(level => `/practice/kanji/${level}`)

const grammarEntries = [
	'/grammar/verb'
]

const entries = [
	...initialEntries,
	...practiceUnitEntries,
	...vocabEntries,
	...kanjiEntries,
	...grammarEntries,
]
// console.log(entries)

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: [vitePreprocess()],

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter({
			// Fallback page for SPA routes (flashcard routes that can't be prerendered)
			fallback: '200.html'
		}),
        paths: {
            base: process.env.NODE_ENV === 'production' ? '/study-japanese' : '',
        },
		prerender: {
			entries,
		}
	},

	extensions: ['.svelte', '.svx']
};

export default config;
