const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');

test('puntajes ignores supplied callbacks and retains the fixed reader contract', () => {
  const context = vm.createContext({ ContentService: {
    MimeType: { JAVASCRIPT: 'javascript' },
    createTextOutput: text => ({ setMimeType: mime => ({ text, mime }) }),
  } });
  vm.runInContext(fs.readFileSync('apps-script/CodigoCompletoDiagnostico.gs', 'utf8'), context);
  const scores = { white: 12, blue: 7, orange: 0, green: 9, movimientos: [] };
  context.obtenerPuntajesCasasReales = () => scores;
  for (const callback of [undefined, '', 'procesarPodio', 'otraFuncion', 'alert(1);//', 'x);globalThis.attacked=true;//', '</script><script>alert(1)</script>']) {
    const result = context.doGet({ parameter: { page: 'api_puntos', callback } });
    assert.equal(result.mime, 'javascript');
    assert.equal(result.text, `procesarPodio(${JSON.stringify(scores)});`);
    // Same parsing used by the current score page: text + JSON.parse, never eval.
    assert.deepEqual(JSON.parse(result.text.replace(/^procesarPodio\(/, '').replace(/\);?$/, '')), scores);
    let calls = 0;
    const receiver = vm.createContext({ procesarPodio: () => { calls++; } });
    vm.runInContext(result.text, receiver);
    assert.equal(calls, 1);
    assert.equal(receiver.attacked, undefined);
  }
});
