const fs = require('fs');
const path = require('path');

const root = process.cwd();
const featuresRoot = path.join(root, 'src', 'features');
const screensRoot = path.join(root, 'src', 'screens');
fs.mkdirSync(screensRoot, {recursive: true});

function rewriteScreenImports(content) {
  // features/cat/screens/File used ../../../X — screens/cat/File needs ../../X
  return content
    .replace(/from '(\.\.\/){3}/g, "from '../../")
    .replace(/from "(\.\.\/){3}/g, 'from "../../');
}

function rewriteIndex(content) {
  return content
    .replace(/from '\.\/screens\//g, "from './")
    .replace(/from "\.\/screens\//g, 'from "./');
}

const cats = fs
  .readdirSync(featuresRoot, {withFileTypes: true})
  .filter(d => d.isDirectory())
  .map(d => d.name);

const report = [];

for (const cat of cats) {
  const srcCat = path.join(featuresRoot, cat);
  const destCat = path.join(screensRoot, cat);
  fs.mkdirSync(destCat, {recursive: true});

  const screensDir = path.join(srcCat, 'screens');
  if (fs.existsSync(screensDir)) {
    for (const f of fs.readdirSync(screensDir)) {
      const from = path.join(screensDir, f);
      if (!fs.statSync(from).isFile()) continue;
      const content = rewriteScreenImports(fs.readFileSync(from, 'utf8'));
      fs.writeFileSync(path.join(destCat, f), content);
      report.push(`screen ${cat}/${f}`);
    }
  }

  for (const folder of ['hooks', 'utils', '__tests__']) {
    const fromDir = path.join(srcCat, folder);
    if (!fs.existsSync(fromDir)) continue;
    const toDir = path.join(destCat, folder);
    fs.mkdirSync(toDir, {recursive: true});
    for (const f of fs.readdirSync(fromDir)) {
      const from = path.join(fromDir, f);
      if (!fs.statSync(from).isFile()) continue;
      fs.writeFileSync(path.join(toDir, f), fs.readFileSync(from, 'utf8'));
      report.push(`${folder} ${cat}/${folder}/${f}`);
    }
  }

  for (const f of fs.readdirSync(srcCat)) {
    const from = path.join(srcCat, f);
    if (!fs.statSync(from).isFile()) continue;
    let content = fs.readFileSync(from, 'utf8');
    if (f === 'index.ts') content = rewriteIndex(content);
    fs.writeFileSync(path.join(destCat, f), content);
    report.push(`file ${cat}/${f}`);
  }
}

console.log(report.join('\n'));
console.log('CATEGORIES', cats.length);
