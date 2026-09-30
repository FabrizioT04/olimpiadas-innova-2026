const fs = require('node:fs'), ts = require('typescript');
const code = require('./shared-module.cjs')(ts.transpileModule(fs.readFileSync('functions/_lib/content.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText);
module.exports = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
