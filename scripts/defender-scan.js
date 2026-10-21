// Varre dist/extension e o zip da loja com o Microsoft Defender (somente leitura: -DisableRemediation não põe nada em
// quarentena). Falha se houver detecção. Existe porque heurísticas de aprendizado de máquina ("!ml") já marcaram o
// popup como falso positivo; rode antes de publicar um zip. Em outros sistemas operacionais, não faz nada.
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

function parseScanOutput(text) {
  const m = String(text).match(/found (\d+) threats?/i);
  if (m) return Number(m[1]);
  if (/found no threats/i.test(text)) return 0;
  throw new Error('Saída inesperada do MpCmdRun: ' + String(text).slice(0, 200));
}

function findMpCmdRun() {
  const base = path.join(process.env.ProgramData || 'C:\\ProgramData', 'Microsoft', 'Windows Defender', 'Platform');
  const candidates = [path.join(base, 'CurrentVersion', 'MpCmdRun.exe')];
  if (fs.existsSync(base)) {
    for (const d of fs.readdirSync(base).sort().reverse()) candidates.push(path.join(base, d, 'MpCmdRun.exe'));
  }
  return candidates.find((p) => fs.existsSync(p));
}

function scan(exe, target) {
  const r = spawnSync(exe, ['-Scan', '-ScanType', '3', '-File', target, '-DisableRemediation'], { encoding: 'utf8' });
  return parseScanOutput((r.stdout || '') + (r.stderr || ''));
}

if (require.main === module) {
  if (process.platform !== 'win32') { console.log('defender-scan: ignorado (só Windows).'); process.exit(0); }
  const exe = findMpCmdRun();
  if (!exe) { console.log('defender-scan: MpCmdRun.exe não encontrado; pulando.'); process.exit(0); }
  const dist = path.resolve(__dirname, '../dist');
  const targets = [path.join(dist, 'extension'), ...fs.readdirSync(dist).filter((f) => f.endsWith('.zip')).map((f) => path.join(dist, f))];
  let bad = 0;
  for (const t of targets) {
    const n = scan(exe, t);
    console.log(`${n === 0 ? 'limpo ' : 'AMEAÇA'}  ${path.relative(process.cwd(), t)}${n ? ` (${n})` : ''}`);
    bad += n;
  }
  process.exit(bad ? 1 : 0);
}

module.exports = { parseScanOutput };
