import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { Readable, Writable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { runCli } from '../bin/unslop.js';

const cta = '★ Fighting AI UI slop? Star Unslop on GitHub:';
async function invoke(args: string[], cwd: string) {
  let stdout = '', stderr = '';
  const code = await runCli(args, { cwd, stdout: s => { stdout += `${s}\n`; }, stderr: s => { stderr += `${s}\n`; } });
  return { stdout, stderr, code };
}
describe('terminal star CTA', () => {
  it('prints one footer on each human command, with actual audit/plan grades and example labels elsewhere', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unslop-footer-'));
    try {
      await writeFile(join(cwd, 'ui.tsx'), '<div className="from-purple-500">Unleash the power</div>');
      await writeFile(join(cwd, 'tokens.css'), ':root { --background: #090a0c; --foreground: #fafafa; }');
      const audit = await invoke(['audit', 'ui.tsx', '--json'], cwd);
      const grade = JSON.parse(audit.stdout).grade;
      const cases = [
        ['audit', 'ui.tsx'], ['audit', 'ui.tsx', '--prompt'], ['refactor-plan', 'ui.tsx'],
        ['extract', 'tokens.css'], ['extract', 'tokens.css', '--output', 'out.md'], ['preset', 'linear-precision'], ['presets'], ['init'],
      ];
      for (const args of cases) {
        const result = await invoke(args, cwd);
        expect(result.stdout.match(/★ Fighting AI UI slop/g), args.join(' ')).toHaveLength(1);
        expect(result.stdout).toContain('https://github.com/avivgerz-hue/unslop');
        expect(result.stdout).toContain('Instant terminal star: gh repo star avivgerz-hue/unslop');
        expect(result.stdout).toContain('https://img.shields.io/badge/Unslop_Craft-Grade_');
        if (args[0] === 'audit' || args[0] === 'refactor-plan') expect(result.stdout).toContain(`Grade_${encodeURIComponent(grade)}-f97316`);
        else expect(result.stdout).toContain('Example Design Craft badge');
      }
      expect(await readFile(join(cwd, 'out.md'), 'utf8')).not.toContain(cta);
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
  it('never pollutes JSON output, written reports, version output, or MCP stdio', async () => {
    const cwd = await mkdtemp(join(tmpdir(), 'unslop-footer-json-'));
    try {
      await writeFile(join(cwd, 'ui.tsx'), '<button>Go</button>');
      await writeFile(join(cwd, 'tokens.css'), ':root { --color: #123456; }');
      for (const args of [['audit','ui.tsx','--json'], ['refactor-plan','ui.tsx','--json'], ['preset','--json'], ['init','--json'], ['extract','tokens.css','--json']]) {
        const result = await invoke(args, cwd);
        expect(result.stdout, args.join(' ')).not.toContain(cta);
        expect(() => JSON.parse(result.stdout)).not.toThrow();
      }
      expect((await invoke(['--version'], cwd)).stdout.trim()).toBe('2.1.0');
      expect(await readFile(join(cwd, 'UNSLOP-REPORT.md'), 'utf8')).not.toContain(cta);
      let output = '';
      const input = Readable.from(['{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}\n']);
      const stream = new Writable({ write(chunk, _encoding, callback) { output += chunk.toString(); callback(); } });
      await runCli(['--mcp'], { cwd, input, output: stream });
      expect(output).not.toContain(cta);
      expect(JSON.parse(output).result.serverInfo.version).toBe('2.1.0');
    } finally { await rm(cwd, { recursive: true, force: true }); }
  });
});
