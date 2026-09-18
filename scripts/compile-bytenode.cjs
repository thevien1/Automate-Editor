const path = require('path');
const fs = require('fs');
const bytenode = require('bytenode');
const v8 = require('v8');

v8.setFlagsFromString('--no-lazy');

const mainJsPath = path.join(__dirname, '../dist-electron/main.js');
const mainJscPath = path.join(__dirname, '../dist-electron/main.jsc');

if (!fs.existsSync(mainJsPath)) {
  console.error('[Bytenode] Error: dist-electron/main.js not found. Run tsc first.');
  process.exit(1);
}

console.log('[Bytenode] Compiling main.js to bytecode (main.jsc)...');

try {
  bytenode.compileFile({
    filename: mainJsPath,
    output: mainJscPath,
    electron: true,
  });

  const loaderContent = `'use strict';\nrequire('bytenode');\nrequire('./main.jsc');\n`;
  fs.writeFileSync(mainJsPath, loaderContent, 'utf-8');

  console.log('[Bytenode] Successfully compiled main.jsc and generated loader main.js!');
} catch (err) {
  console.error('[Bytenode] Failed to compile with bytenode:', err);
  process.exit(1);
}
