const fs = require('fs');
const path = require('path');

const screensRoot = path.join('src', 'screens');
const featuresRoot = path.join('src', 'features');

function ensureDir(p) {
  fs.mkdirSync(p, {recursive: true});
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.writeFileSync(to, fs.readFileSync(from));
}

function rmrf(p) {
  if (!fs.existsSync(p)) return;
  fs.rmSync(p, {recursive: true, force: true});
}

const categories = fs
  .readdirSync(screensRoot, {withFileTypes: true})
  .filter(d => d.isDirectory())
  .map(d => d.name);

const moved = [];

for (const cat of categories) {
  const hooksFrom = path.join(screensRoot, cat, 'hooks');
  if (fs.existsSync(hooksFrom)) {
    const hooksTo = path.join(featuresRoot, cat, 'hooks');
    for (const f of fs.readdirSync(hooksFrom)) {
      const from = path.join(hooksFrom, f);
      if (!fs.statSync(from).isFile()) continue;
      copyFile(from, path.join(hooksTo, f));
      moved.push(`${cat}/hooks/${f}`);
    }
    rmrf(hooksFrom);
  }

  // Move screen-level files that belong with feature logic
  if (cat === 'auth') {
    for (const f of ['schema.ts']) {
      const from = path.join(screensRoot, cat, f);
      if (fs.existsSync(from)) {
        copyFile(from, path.join(featuresRoot, cat, f));
        fs.unlinkSync(from);
        moved.push(`${cat}/${f}`);
      }
    }
    const testsFrom = path.join(screensRoot, cat, '__tests__');
    if (fs.existsSync(testsFrom)) {
      const testsTo = path.join(featuresRoot, cat, '__tests__');
      for (const f of fs.readdirSync(testsFrom)) {
        copyFile(path.join(testsFrom, f), path.join(testsTo, f));
        moved.push(`${cat}/__tests__/${f}`);
      }
      rmrf(testsFrom);
    }
  }

  if (cat === 'payments') {
    const utilsFrom = path.join(screensRoot, cat, 'utils');
    if (fs.existsSync(utilsFrom)) {
      const utilsTo = path.join(featuresRoot, cat, 'utils');
      for (const f of fs.readdirSync(utilsFrom)) {
        copyFile(path.join(utilsFrom, f), path.join(utilsTo, f));
        moved.push(`${cat}/utils/${f}`);
      }
      rmrf(utilsFrom);
    }
  }

  // Write feature barrel for hooks
  const hooksDir = path.join(featuresRoot, cat, 'hooks');
  if (fs.existsSync(hooksDir)) {
    const hooks = fs
      .readdirSync(hooksDir)
      .filter(f => f.endsWith('.ts'))
      .map(f => path.basename(f, '.ts'));
    const lines = hooks.map(h => `export {${h}} from './hooks/${h}';`);
    if (cat === 'auth' && fs.existsSync(path.join(featuresRoot, cat, 'schema.ts'))) {
      lines.push(`export {loginSchema, type LoginFormValues} from './schema';`);
    }
    if (cat === 'payments' && fs.existsSync(path.join(featuresRoot, cat, 'utils', 'inr.ts'))) {
      lines.push(`export {inr} from './utils/inr';`);
    }
    fs.writeFileSync(path.join(featuresRoot, cat, 'index.ts'), lines.join('\n') + '\n');
  }
}

// Update screen imports
function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

for (const file of walk(screensRoot).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
  const rel = file.split(path.sep).join('/');
  const parts = rel.split('/');
  // src/screens/<cat>/<file>
  if (parts.length !== 4) continue;
  const cat = parts[2];
  let c = fs.readFileSync(file, 'utf8');
  const next = c
    .replace(/from '\.\/hooks\//g, `from '../../features/${cat}/hooks/`)
    .replace(/from "\.\/hooks\//g, `from "../../features/${cat}/hooks/`)
    .replace(/from '\.\/utils\//g, `from '../../features/${cat}/utils/`)
    .replace(/from "\.\/utils\//g, `from "../../features/${cat}/utils/`)
    .replace(/from '\.\/schema'/g, `from '../../features/${cat}/schema'`)
    .replace(/from "\.\/schema"/g, `from "../../features/${cat}/schema"`);
  if (next !== c) {
    fs.writeFileSync(file, next);
    console.log('updated imports', rel);
  }
}

console.log('moved:\n' + moved.join('\n'));
