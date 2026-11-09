import { readFile } from 'node:fs/promises';
import { JSDOM, VirtualConsole } from 'jsdom';
import { describe, expect, it } from 'vitest';
import { analyzeSource, calculateDesignCraftScore, designGrade } from '../src/analyzer/slop-detector.js';
import { exportDesignTokens } from '../src/sync/token-exporter.js';
import { loadPreset, PRESET_NAMES } from '../src/presets/index.js';

const html = await readFile(new URL('../docs/index.html', import.meta.url), 'utf8');
function studio(fetcher?: (url: string) => Promise<unknown>) {
  const clipboard: string[] = [];
  const errors: string[] = [];
  const opened: string[] = [];
  const virtualConsole = new VirtualConsole();
  virtualConsole.on('jsdomError', error => errors.push(error.message));
  const dom = new JSDOM(html, {
    url: 'https://example.github.io/unslop/', runScripts: 'dangerously', virtualConsole,
    beforeParse(window) {
      Object.defineProperty(window.navigator, 'clipboard', { value: { writeText: async (text: string) => { clipboard.push(text); } } });
      (window as any).fetch = fetcher;
      (window as any).TextDecoder = TextDecoder;
      (window as any).structuredClone = structuredClone;
      (window as any).open = (url: string) => { opened.push(url); };
    },
  });
  const el = (id: string) => dom.window.document.getElementById(id)!;
  return { dom, el, clipboard, errors, opened };
}
const tick = () => new Promise(resolve => setTimeout(resolve, 25));

describe('self-contained Design Studio', () => {
  it('renders offline, runs the actual seven-pillar engine, copies a score badge, and shares', async () => {
    expect(html).not.toMatch(/<script[^>]+src=/i);
    expect(html).not.toMatch(/<link[^>]+stylesheet/i);
    const { dom, el, clipboard, errors, opened } = studio();
    expect(errors).toEqual([]);
    expect((el('archetype') as HTMLSelectElement).options).toHaveLength(10);
    el('demo').click(); await tick();
    const text = (el('source') as HTMLTextAreaElement).value;
    const expected = calculateDesignCraftScore(analyzeSource(text, 'snippet.tsx'));
    expect(el('score').textContent).toBe(String(expected));
    expect(el('grade').textContent).toBe(`GRADE ${designGrade(expected)}`);
    expect(el('pillars').children).toHaveLength(7);
    expect(el('findings').textContent).not.toContain('No verdict');
    expect(el('preview').querySelector('h3')?.textContent).toContain('Unleash the power');
    const source = el('source') as HTMLTextAreaElement;
    source.value = '<h1>Safe<img src=x onerror=alert(1)>heading</h1><p>Example</p>';
    el('run').click(); await tick();
    expect(el('preview').querySelector('h3')?.textContent).toBe('Safeheading');
    expect(el('preview').querySelector('img')).toBeNull();
    el('demo').click(); await tick();
    el('badge').click(); await tick();
    expect(clipboard[0]).toContain(`Grade_${encodeURIComponent(designGrade(expected))}-f97316`);
    el('share').click();
    expect(decodeURIComponent(opened[0]!)).toContain(`${expected}/100`);
    const select = el('archetype') as HTMLSelectElement;
    for (const name of PRESET_NAMES) {
      select.value = name; select.dispatchEvent(new dom.window.Event('change'));
      expect(el('preview-name').textContent).toBe(name);
    }
    select.value = 'stripe-atmospheric'; select.dispatchEvent(new dom.window.Event('change'));
    el('copy-tailwind').click(); el('copy-css').click(); await tick();
    expect(clipboard[1]).toBe(exportDesignTokens(loadPreset('stripe-atmospheric'), 'tailwind-v4'));
    expect(clipboard[2]).toBe(exportDesignTokens(loadPreset('stripe-atmospheric'), 'css'));
    dom.window.close();
  });

  it('samples public GitHub files and renders untrusted source as text', async () => {
    const code = '<h1 class="from-purple-500">Unleash the power</h1>';
    const requests: string[] = [];
    const { dom, el } = studio(async url => {
      requests.push(url);
      const body = url.endsWith('/demo/repo') ? { default_branch: 'main' }
        : url.includes('/git/trees/') ? { truncated: false, tree: [{ type: 'blob', path: 'src/page.tsx', size: 100, sha: 'abc' }] }
        : { encoding: 'base64', content: Buffer.from(code).toString('base64') };
      return { ok: true, json: async () => body };
    });
    el('repo-tab').click(); (el('repo') as HTMLInputElement).value = 'demo/repo'; el('run').click(); await tick();
    expect(requests).toHaveLength(3);
    expect(el('score').textContent).toBe(String(calculateDesignCraftScore(analyzeSource(code, 'src/page.tsx'))));
    expect(el('scope').textContent).toContain('Sampled 1 of 1 eligible files');
    expect(el('scope').textContent).toContain('Not a full repository audit');
    dom.window.close();
  });

  it('rejects invalid repository input without sending a request and shows API errors', async () => {
    let calls = 0;
    const { dom, el } = studio(async () => { calls++; return { ok: false, status: 403 }; });
    el('repo-tab').click(); (el('repo') as HTMLInputElement).value = 'https://evil.test/path'; el('run').click(); await tick();
    expect(calls).toBe(0); expect(el('status').textContent).toContain('owner/repo');
    (el('repo') as HTMLInputElement).value = 'owner/repo'; el('run').click(); await tick();
    expect(el('status').textContent).toContain('rate limit');
    expect((el('badge') as HTMLButtonElement).disabled).toBe(true);
    dom.window.close();
  });
});
