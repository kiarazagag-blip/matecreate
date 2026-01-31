import adapter from '@sveltejs/adapter-auto';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	kit: {
		// adapter-auto for Vercel deployment
		// For Capacitor mobile builds, see svelte.config.mobile.js
		adapter: adapter()
	}
};

export default config;
