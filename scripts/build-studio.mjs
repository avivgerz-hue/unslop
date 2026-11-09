import { build } from 'esbuild';
import { readFile, writeFile } from 'node:fs/promises';

// The source analyzer's filesystem entrypoints are never used in the browser.
// Stub only those Node imports while bundling the exact shared analyzer and tokens.
const result = await build({
  entryPoints: ['studio/app.ts'], bundle: true, platform: 'browser', format: 'iife',
  target: ['es2022'], write: false, minify: true,
  plugins: [{ name: 'browser-node-stubs', setup(build) {
    build.onResolve({ filter: /^node:(fs\/promises|path)$/ }, args => ({ path: args.path, namespace: 'stub' }));
    build.onLoad({ filter: /.*/, namespace: 'stub' }, args => ({
      contents: args.path === 'node:path'
        ? 'export const sep="/"; export const extname=()=>"",relative=()=>"",resolve=()=>"";'
        : 'export const readFile=()=>{throw Error("Unavailable in browser")},readdir=readFile,stat=readFile;',
      loader: 'js',
    }));
  }}],
});
const template = await readFile('studio/template.html', 'utf8');
const js = result.outputFiles[0].text.replace(/<\/script/gi, '<\\/script');
if (!template.includes('/* STUDIO_BUNDLE */')) throw new Error('Missing studio bundle marker');
await writeFile('docs/index.html', template.replace('/* STUDIO_BUNDLE */', () => js));
