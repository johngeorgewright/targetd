// @ts-check

/**
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,mjs,cjs,ts,mts,cts,tsx,jsx,json,jsonc,md,markdown,yml,yaml}':
    'deno fmt',
}
