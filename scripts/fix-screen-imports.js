const fs = require('fs');
const path = require('path');

function walk(dir) {
  return fs.readdirSync(dir, {withFileTypes: true}).flatMap(e => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : [p];
  });
}

const files = walk('src/screens').filter(f => /\.(tsx|ts)$/.test(f));
let n = 0;

for (const f of files) {
  const rel = f.split(path.sep).join('/');
  const parts = rel.split('/');
  // src/screens/<cat>/<file>.tsx only
  if (parts.length !== 4) continue;

  let c = fs.readFileSync(f, 'utf8');
  const next = c
    .replace(/from '\.\.\/hooks\//g, "from './hooks/")
    .replace(/from "\.\.\/hooks\//g, 'from "./hooks/')
    .replace(/from '\.\.\/styles'/g, "from './styles'")
    .replace(/from "\.\.\/styles"/g, 'from "./styles"')
    .replace(/from '\.\.\/utils\//g, "from './utils/")
    .replace(/from "\.\.\/utils\//g, 'from "./utils/')
    .replace(/from '\.\.\/schema'/g, "from './schema'")
    .replace(/from "\.\.\/schema"/g, 'from "./schema"');

  if (next !== c) {
    fs.writeFileSync(f, next);
    n += 1;
    console.log('fixed', rel);
  }
}

console.log('updated', n);
