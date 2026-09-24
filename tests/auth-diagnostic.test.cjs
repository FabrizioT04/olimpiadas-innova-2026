const {test}=require('node:test');
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const source=fs.readFileSync('apps-script/CodigoCompletoDiagnostico.gs','utf8');
test('diagnostic verifies signatures and timestamps without touching Sheets',()=>{
 const secret='test-only-key-'.repeat(4);
 const ctx={console:{error(){}},PropertiesService:{getScriptProperties:()=>({getProperty:()=>secret})},LockService:{getScriptLock:()=>({hasLock:()=>false,waitLock(){throw Error('Must not acquire write lock');}})},SpreadsheetApp:{getActiveSpreadsheet(){throw Error('Must not access Sheets');}},Utilities:{Charset:{UTF_8:'utf8'},computeHmacSha256Signature:(s,k)=>Array.from(crypto.createHmac('sha256',k).update(s).digest(),b=>b>127?b-256:b)},ContentService:{MimeType:{JSON:'json'},createTextOutput:s=>({setMimeType:()=>JSON.parse(s)})}};
 vm.createContext(ctx); vm.runInContext(source,ctx);
 const envelope={payload:JSON.stringify({action:'diagnostico-autorizacion'}),timestamp:Date.now()};
 const sign=e=>crypto.createHmac('sha256',secret).update(e.timestamp+'.'+e.payload).digest('hex');
 envelope.signature=sign(envelope);
 const call=e=>ctx.doPost({postData:{contents:JSON.stringify(e)}});
 assert.equal(call(envelope).diagnostico,'AUTH_OK');
 assert.equal(call({...envelope,signature:'0'.repeat(64)}).diagnostico,'AUTH_SIGNATURE_MISMATCH');
 assert.equal(call({...envelope,signature:'x'}).diagnostico,'AUTH_SIGNATURE_FORMAT');
 assert.equal(call({...envelope,timestamp:Date.now()-180000}).diagnostico,'AUTH_EXPIRED');
 assert.equal(call({...envelope,timestamp:'date'}).diagnostico,'AUTH_TIMESTAMP');
});
