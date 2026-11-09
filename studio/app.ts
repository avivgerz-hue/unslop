import { analyzeSource, calculateDesignCraftScore, calculatePillarScores, designGrade } from '../src/analyzer/slop-detector.js';
import { listPresets, loadPreset } from '../src/presets/index.js';
import { exportDesignTokens } from '../src/sync/token-exporter.js';

const $ = (id: string) => document.getElementById(id)!;
const source = $('source') as HTMLTextAreaElement;
const repo = $('repo') as HTMLInputElement;
const select = $('archetype') as HTMLSelectElement;
const status = $('status');
const studioStatus = $('studio-status');
const repoUrl = 'https://github.com/avivgerz-hue/unslop';
const demo = `<section className="bg-gradient-to-r from-purple-500 via-pink-500 to-indigo-500 rounded-3xl shadow-2xl text-center p-5">
  <h1 className="text-6xl font-bold">Unleash the power of AI</h1>
  <p>Revolutionize your workflow and unlock your potential.</p>
  <button className="rounded-full transition-all">Get started</button>
</section>`;
let mode: 'paste' | 'repo' = 'paste';
let currentScore: number | null = null;
let currentGrade = '';

function setMode(next: 'paste' | 'repo') {
  mode = next;
  for (const name of ['paste', 'repo']) {
    $(name + '-input').classList.toggle('hidden', name !== mode);
    $(name + '-tab').classList.toggle('active', name === mode);
    $(name + '-tab').setAttribute('aria-pressed', String(name === mode));
  }
  status.textContent = '';
}
$('paste-tab').addEventListener('click', () => setMode('paste'));
$('repo-tab').addEventListener('click', () => setMode('repo'));
$('demo').addEventListener('click', () => { setMode('paste'); source.value = demo; void run(); });
$('run').addEventListener('click', () => void run());

async function githubJson(url: string) {
  const response = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
  if (!response.ok) {
    if (response.status === 403 || response.status === 429) throw new Error('GitHub API rate limit reached. Try again later or paste code instead.');
    if (response.status === 404) throw new Error('Repository not found or not public. Check owner/repo and try again.');
    throw new Error(`GitHub request failed (${response.status}). Try again or paste code instead.`);
  }
  return response.json();
}
async function repoFiles(name: string): Promise<{ files: { path: string; text: string }[]; scope: string }> {
  const match = /^([A-Za-z0-9](?:[A-Za-z0-9-]{0,38}))\/([A-Za-z0-9_.-]+)$/.exec(name.trim());
  if (!match || match[2] === '.' || match[2] === '..') throw new Error('Enter a public repository as owner/repo (not a URL).');
  const base = `https://api.github.com/repos/${encodeURIComponent(match[1]!)}/${encodeURIComponent(match[2]!)}`;
  const metadata = await githubJson(base);
  const tree = await githubJson(`${base}/git/trees/${encodeURIComponent(metadata.default_branch)}?recursive=1`);
  if (!Array.isArray(tree.tree)) throw new Error('GitHub returned an invalid repository tree.');
  const candidates = tree.tree.filter((file: any) => file.type === 'blob' && /\.(tsx|jsx|vue|svelte|html|css)$/i.test(file.path) && !/(^|\/)(node_modules|dist|build|coverage|vendor|\.next|\.git)\//.test(file.path) && typeof file.size === 'number' && file.size <= 100000);
  if (!candidates.length) throw new Error('No supported frontend files under 100 KB were found.');
  const selected = candidates.slice(0, 20);
  const files: { path: string; text: string }[] = [];
  for (const file of selected) {
    status.textContent = `Reading public files ${files.length + 1}/${selected.length}…`;
    const blob = await githubJson(`${base}/git/blobs/${encodeURIComponent(file.sha)}`);
    if (blob.encoding !== 'base64' || typeof blob.content !== 'string') throw new Error(`Unable to decode ${file.path}. No partial score was calculated.`);
    const binary = atob(blob.content.replace(/\s/g, ''));
    const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
    files.push({ path: file.path, text: new TextDecoder().decode(bytes) });
  }
  return { files, scope: `Sampled ${files.length} of ${candidates.length} eligible files from ${name.trim()}${tree.truncated ? ' (GitHub tree truncated)' : ''}. Not a full repository audit.` };
}
function display(files: { path: string; text: string }[], scope: string) {
  // Adapt simple component copy into a safe, token-styled sample. Never execute input markup.
  const previewText = (pattern: RegExp): string | undefined => {
    const match = files[0]?.text.match(pattern);
    const text = match?.[1]?.replace(/<[^>]*>/g, '').replace(/\{[^}]*\}/g, '').replace(/\s+/g, ' ').trim();
    return text ? text.slice(0, 160) : undefined;
  };
  ($('preview').querySelector('h3') as HTMLElement).textContent = previewText(/<h[12]\b[^>]*>([\s\S]*?)<\/h[12]\s*>/i) ?? 'Make room for the work that matters.';
  ($('preview').querySelector('.preview-content p') as HTMLElement).textContent = previewText(/<p\b[^>]*>([\s\S]*?)<\/p\s*>/i) ?? 'A more thoughtful way to bring your ideas to life. Less noise, more intention, and space to make something real.';
  const violations = files.flatMap(file => analyzeSource(file.text, file.path));
  const score = calculateDesignCraftScore(violations);
  const grade = designGrade(score);
  currentScore = score; currentGrade = grade;
  $('score').textContent = String(score);
  $('grade').textContent = `GRADE ${grade}`;
  $('scope').textContent = `${scope} ${violations.length} finding${violations.length === 1 ? '' : 's'} detected.`;
  const pillars = $('pillars'); pillars.replaceChildren();
  for (const pillar of calculatePillarScores(violations)) {
    const row = document.createElement('div'); row.className = 'pillar';
    const name = document.createElement('span'); name.textContent = pillar.name.split(' & ')[0]; name.title = pillar.name;
    const track = document.createElement('div'); track.className = 'track';
    const fill = document.createElement('div'); fill.className = 'fill'; fill.style.width = `${pillar.score}%`; track.append(fill);
    const value = document.createElement('span'); value.className = 'pillar-value'; value.textContent = String(pillar.score);
    row.append(name, track, value); pillars.append(row);
  }
  const findings = $('findings'); findings.replaceChildren();
  const canonical = violations.filter(v => v.ruleId.startsWith('SLOP-'));
  if (!canonical.length) findings.textContent = 'No seven-pillar findings in this sample. Nice restraint.';
  else {
    const ul = document.createElement('ul');
    for (const v of canonical.slice(0, 5)) { const li = document.createElement('li'); li.textContent = `${v.message} (${v.file}:${v.line})`; ul.append(li); }
    findings.append(ul);
  }
  ( $('badge') as HTMLButtonElement ).disabled = false;
  ( $('share') as HTMLButtonElement ).disabled = false;
}
async function run() {
  const button = $('run') as HTMLButtonElement; button.disabled = true; status.textContent = 'Analyzing…';
  try {
    if (mode === 'paste') {
      if (!source.value.trim()) throw new Error('Paste a component or load the demo first.');
      display([{ path: 'snippet.tsx', text: source.value }], 'Analyzed one pasted snippet locally.');
    } else { const result = await repoFiles(repo.value); display(result.files, result.scope); }
    status.textContent = 'Audit complete. Scores use the Unslop CLI engine.';
  } catch (error) { status.textContent = error instanceof Error ? error.message : 'Unable to complete the audit.'; }
  finally { button.disabled = false; }
}
async function copy(text: string, target: HTMLElement) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
    await navigator.clipboard.writeText(text); target.textContent = 'Copied to clipboard.';
  } catch { target.textContent = 'Copy unavailable in this browser. Use HTTPS and allow clipboard access.'; }
}
$('badge').addEventListener('click', () => {
  if (currentScore === null) return;
  void copy(`[![Unslop Design Craft](https://img.shields.io/badge/Unslop_Craft-Grade_${encodeURIComponent(currentGrade)}-f97316)](${repoUrl})`, status);
});
$('share').addEventListener('click', () => {
  if (currentScore === null) return;
  const text = `My design scored ${currentScore}/100 (Grade ${currentGrade}) on Unslop's 7-Pillar Design Craft audit. Fight AI UI slop: ${repoUrl}`;
  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
});
for (const preset of listPresets()) { const option = document.createElement('option'); option.value = preset.name; option.textContent = preset.title; select.append(option); }
select.value = 'linear-precision';
function updatePreset() {
  const preset = loadPreset(select.value), tokens = preset.tokens, colors = tokens.colors;
  $('preset-description').textContent = preset.description;
  $('preview-name').textContent = preset.name;
  const preview = $('preview');
  preview.style.background = colors.background; preview.style.color = colors.text;
  preview.style.fontFamily = tokens.typography.fontFamily;
  const chrome = preview.querySelector('.preview-chrome') as HTMLElement; chrome.style.borderColor = colors.border;
  const p = preview.querySelector('.preview-content p') as HTMLElement; p.style.color = colors.textMuted;
  const action = preview.querySelector('.preview-button') as HTMLElement;
  action.style.background = colors.accent; action.style.color = colors.accentText; action.style.borderRadius = tokens.radii.md || '0';
  const swatches = $('swatches'); swatches.replaceChildren();
  for (const [name, color] of Object.entries({ Canvas: colors.background, Surface: colors.surface, Text: colors.text, Accent: colors.accent })) {
    const swatch = document.createElement('span'); swatch.className = 'swatch'; swatch.style.background = color; swatch.title = `${name}: ${color}`; swatches.append(swatch);
  }
  studioStatus.textContent = '';
}
select.addEventListener('change', updatePreset); updatePreset();
$('copy-tailwind').addEventListener('click', () => void copy(exportDesignTokens(loadPreset(select.value), 'tailwind-v4'), studioStatus));
$('copy-css').addEventListener('click', () => void copy(exportDesignTokens(loadPreset(select.value), 'css'), studioStatus));
