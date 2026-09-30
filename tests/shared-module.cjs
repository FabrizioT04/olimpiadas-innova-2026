const fs = require('node:fs'), ts = require('typescript');
const code = ts.transpileModule(fs.readFileSync('shared/olimpiadas.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 } }).outputText;
// Functions import the shared values by relative path; tests load them from this data URL instead.
const url = 'data:text/javascript;base64,' + Buffer.from(code).toString('base64');
module.exports = source => source.replace(/from '(?:\.\.\/)+shared\/olimpiadas'/, `from '${url}'`);
