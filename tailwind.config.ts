import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import daisyui from 'daisyui';

export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],

	theme: {
		extend: {}
	},

	plugins: [typography(), daisyui],
	daisyui: {
		themes: [
			"retro",
			"dim",
		],
		darkTheme: "dim",
	},

} satisfies Config;
