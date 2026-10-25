/* Inspect the actual ELF LOAD segments, not just the Gradle version. */
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(process.argv[2] || 'android/app/build/intermediates/merged_native_libs/debug/mergeDebugNativeLibs/out/lib');
let checked = 0;
const failures = [];
for (const abi of ['arm64-v8a', 'x86_64']) {
  const directory = path.join(root, abi);
  if (!fs.existsSync(directory)) { failures.push(abi + ': no libraries found'); continue; }
  for (const name of fs.readdirSync(directory).filter(file => file.endsWith('.so'))) {
    const data = fs.readFileSync(path.join(directory, name));
    if (data.toString('hex', 0, 4) !== '7f454c46' || data[4] !== 2 || data[5] !== 1) {
      failures.push(abi + '/' + name + ': invalid 64-bit ELF'); continue;
    }
    const offset = Number(data.readBigUInt64LE(32));
    const size = data.readUInt16LE(54);
    const count = data.readUInt16LE(56);
    let segments = 0;
    for (let i = 0; i < count; i++) {
      const start = offset + i * size;
      if (data.readUInt32LE(start) !== 1) continue;
      segments++;
      const alignment = data.readBigUInt64LE(start + 48);
      const fileOffset = data.readBigUInt64LE(start + 8);
      const address = data.readBigUInt64LE(start + 16);
      if (alignment < 16384n || fileOffset % 16384n !== address % 16384n) failures.push(abi + '/' + name + ': incompatible LOAD segment ' + i);
    }
    if (!segments) failures.push(abi + '/' + name + ': no LOAD segments');
    checked++;
  }
}
console.log(JSON.stringify({checkedLibraries: checked, pageSize: 16384, failures}, null, 2));
process.exitCode = failures.length || !checked ? 1 : 0;
