const fs = require('fs');
const path = require('path');

const versionPlaceholder = '{@versionPlaceholder}';
const newVersion = process.env.__VERSION__ || '1.0.0';

const sourceFilePath = path.join(__dirname, 'dist/blip.min.mjs');
let sourceCode = fs.readFileSync(sourceFilePath, 'utf-8');

sourceCode = sourceCode.replace(versionPlaceholder, newVersion);

fs.writeFileSync(sourceFilePath, sourceCode, 'utf-8');
