import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import fs from 'fs';
// prerender entries
const initialEntries = [
	'/',
	'/practice/hiragana',
	'/practice/katakana',
	'/practice/verb'
]

// list files in n5 folder
const units = fs.readdirSync('./src/lib/n5'); // ['u1.json', 'u2.json', ...]
const practiceUnitEntries = units.map(file => `/practice/n5/${file.replace('.json', '')}`)
const allUnitEntries = ['/practice/n5/all']
const vocabEntries = units.map(file => `/vocab/n5/${file.replace('.json', '')}`)
const allVocabEntries = ['/vocab/n5/all']

const kanjiLevels = fs.readdirSync('./src/lib/kanji').filter(file => !file.includes('_def')).map(file => file.replace('.json', ''))
const kanjiEntries = kanjiLevels.map(level => `/practice/kanji/${level}`)
const allKanjiEntries = ['/practice/kanji/all']

const grammarEntries = [
	'/grammar/verb'
]

const entries = [
	...initialEntries,
	...practiceUnitEntries,
	...allUnitEntries,
	...vocabEntries,
	...allVocabEntries,
	...kanjiEntries,
	...allKanjiEntries,
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
		adapter: adapter(),
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
