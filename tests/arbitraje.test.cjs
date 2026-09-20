const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const crypto = require('node:crypto');
const secret = 'test-secret-only-012345678901234567890';
function setup() {
  let value = 10, formula = '', background = '#ffffff', writes = 0;
  const rows = [['headers']];
  const cell = { getValue: () => value, getFormula: () => formula, getBackground: () => background,
    setValue: v => { value = v; writes++; } };
  const history = { getLastRow: () => rows.length, appendRow: r => rows.push(r),
    getRange: (r,c) => ({ getValues: () => [rows[r-1]], setValue: v => { rows[r-1][c-1] = v; },
      createTextFinder: id => ({ matchEntireCell: () => ({ findNext: () => {
        const index = rows.findIndex(row => row[0] === id);
        return index < 0 ? null : { getRow: () => index+1 };
      } }) }) }) };
  const context = vm.createContext({ console, LockService: { getScriptLock: () => ({ waitLock() {}, hasLock: () => true, releaseLock() {} }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: () => secret }) },
    Utilities: { computeHmacSha256Signature: (s,k) => [...crypto.createHmac('sha256',k).update(s).digest()],
      DigestAlgorithm: { SHA_256: 'sha256' }, computeDigest: (a,s) => [...crypto.createHash(a).update(s).digest()] },
    SpreadsheetApp: { flush() {}, getActiveSpreadsheet: () => ({ getSheetByName: n => n === 'Sábana' ? { getRange: () => cell } : history }) },
    ContentService: { MimeType: { JSON: 'json' }, createTextOutput: s => ({ setMimeType: () => JSON.parse(s) }) } });
  vm.runInContext(fs.readFileSync('apps-script/ArbitrajeSeguro.gs','utf8'),context);
  const base = {id:crypto.randomUUID(), email:'test@example.com',house:'white',categoria:'promesas',fila:8,operacion:'sumar',puntos:5,motivo:'Resultado verificado'};
  function send(data=base, mutate=()=>{}) {
    const payload=JSON.stringify(data), timestamp=Date.now();
    const envelope={payload,timestamp,signature:crypto.createHmac('sha256',secret).update(`${timestamp}.${payload}`).digest('hex')};
    mutate(envelope);
    return context.doPost({postData:{contents:JSON.stringify(envelope)}});
  }
  return {send,base,rows,stats:()=>({value,writes}),formula:()=>{formula='=SUM(A1:A2)';},black:()=>{background='#000000';}};
}
test('firma inválida, ausente y caducada no escriben',()=>{
  const s=setup();
  for(const change of [e=>e.signature='0'.repeat(64),e=>delete e.signature,e=>e.timestamp-=300000]) assert.equal(s.send(s.base,change).success,false);
  assert.equal(s.stats().writes,0);
});
test('escritura confirmada e idempotencia; ID con datos diferentes se rechaza',()=>{
  const s=setup(); assert.equal(s.send().success,true); assert.equal(s.send().success,true);
  assert.equal(s.send({...s.base,puntos:7}).success,false);
  assert.deepEqual(s.stats(),{value:15,writes:1}); assert.equal(s.rows[1][11],'CONFIRMADO');
});
test('filas protegidas, valores negativos y operaciones desconocidas se rechazan',()=>{
  const s=setup();
  for(const update of [{fila:6},{fila:38},{fila:45},{puntos:-5},{puntos:1.5},{operacion:'otra'},{house:'__proto__'}]) assert.equal(s.send({...s.base,...update}).success,false);
  assert.equal(s.stats().writes,0);
});
test('fórmulas y celdas negras no se sobrescriben',()=>{
  for(const type of ['formula','black']) {const s=setup();s[type]();assert.equal(s.send().success,false);assert.equal(s.stats().writes,0);}
});
test('pendiente no se reaplica y resta no baja de cero',()=>{
  const s=setup();assert.equal(s.send({...s.base,operacion:'restar',puntos:50}).success,true);assert.equal(s.stats().value,0);
  s.rows[1][11]='PENDIENTE';const result=s.send({...s.base,operacion:'restar',puntos:50});
  assert.equal(result.pending,true);assert.equal(s.stats().writes,1);
});
