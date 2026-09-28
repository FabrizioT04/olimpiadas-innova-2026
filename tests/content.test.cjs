const {test}=require('node:test');
const assert=require('node:assert/strict');
const modulePromise=import(require('./content-module.cjs'));
const origin='https://example.com';
function setup() {
 const objects=new Map();let count=0;
 const bucket={
  async get(key){const o=objects.get(key);return o?{etag:o.etag,json:async()=>JSON.parse(o.body),body:o.body}:null;},
  async put(key,body,options={}){const etag=objects.get(key)?.etag,c=options.onlyIf;if(c && ((c.etagMatches && c.etagMatches!==etag)||(c.etagDoesNotMatch==='*'&&etag)))return null;const o={body,etag:String(++count)};objects.set(key,o);return o;},
  async delete(key){objects.delete(key);}
 };
 const env={CONTENT_BUCKET:bucket,APP_ORIGIN:origin};
 return {bucket,env,objects};
}
const webp=Buffer.concat([Buffer.from('RIFF1234WEBPVP8 '),Buffer.alloc(32)]);
const request=(revision,body,query='',headers={})=>new Request(origin+'/arbitraje/api/contenido'+query,{method:'POST',headers:{Origin:origin,'Content-Type':query?'image/webp':'application/json','If-Match':revision,...headers},body:query?body:JSON.stringify(body)});
const query='?action=upload&kind=foto&album=convivencia&title=Asamblea';
async function upload(api,s,q=query){return (await api.manageContent(request((await api.catalog(s.bucket)).data.revision,webp,q),s.env,'staff@example.com')).json();}
test('draft is private; publish exposes only public metadata; hide revokes public image',async()=>{
 const api=await modulePromise,s=setup();let data=await upload(api,s);const id=data.items[0].id;
 assert.equal((await api.imageResponse(s.bucket,id)).status,404);
 assert.equal((await api.imageResponse(s.bucket,id,true)).status,200);
 assert.deepEqual((await (await api.publicContent(s.bucket)).json()).fotos,[]);
 data=await (await api.manageContent(request(data.revision,{action:'publish',id}),s.env,'staff@example.com')).json();
 const pub=await (await api.publicContent(s.bucket)).json();assert.equal(pub.fotos.length,1);assert.equal(JSON.stringify(pub).includes('staff@example.com'),false);assert.equal(pub.fotos[0].url,'/api/media/'+id);
 assert.equal((await api.imageResponse(s.bucket,id)).status,200);
 assert.equal((await api.manageContent(request(data.revision,{action:'hide',id}),s.env,'staff@example.com')).status,200);
 assert.equal((await api.imageResponse(s.bucket,id)).status,404);
});
test('mascot publish, replacement and restore default control public availability',async()=>{
 const api=await modulePromise,s=setup(),q='?action=upload&kind=mascota&house=dolphins&title=Mascota';
 let data=await upload(api,s,q);const id=data.items[0].id;
 await api.manageContent(request(data.revision,{action:'publish',id}),s.env,'staff@example.com');
 data=await upload(api,s,q);const other=data.items[1].id;
 data=await (await api.manageContent(request(data.revision,{action:'publish',id:other}),s.env,'staff@example.com')).json();
 assert.equal((await api.imageResponse(s.bucket,id)).status,404);assert.equal((await api.imageResponse(s.bucket,other)).status,200);
 assert.equal((await api.manageContent(request(data.revision,{action:'restore-default',house:'dolphins'}),s.env,'staff@example.com')).status,200);
 assert.deepEqual((await (await api.publicContent(s.bucket)).json()).mascotas,{});
});
test('origin, invalid images, album, oversized upload and outdated revision reject writes',async()=>{
 const api=await modulePromise,s=setup();
 for(const [req,status] of [
  [request('empty',webp,query,{Origin:'https://attacker.example'}),403],
  [request('empty',Buffer.from('<svg/>'),query),400],
  [request('empty',webp,query.replace('convivencia','bad')),400],
  [request('empty',webp,query,{'Content-Type':'image/svg+xml'}),415],
  [request('empty',Buffer.alloc(4*1024*1024+1),query),413],
  [request('old',webp,query),409]])assert.equal((await api.manageContent(req,s.env,'staff@example.com')).status,status);
 assert.equal(s.objects.size,0);
});
test('simultaneous catalog writes cannot overwrite one another; failed upload cleans its blob',async()=>{
 const api=await modulePromise,s=setup();
 const results=await Promise.all([1,2].map(()=>api.manageContent(request('empty',webp,query),s.env,'staff@example.com')));
 assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
 assert.equal((await api.catalog(s.bucket)).data.items.length,1);assert.equal(s.objects.size,2);
});
test('unconfigured storage retains static fallback and disables management',async()=>{
 const api=await modulePromise;
 assert.deepEqual(await (await api.publicContent()).json(),{fotos:[],mascotas:{}});
 assert.equal((await api.manageContent(new Request(origin),{APP_ORIGIN:origin},'staff@example.com')).status,503);
});

test('delete removes draft metadata and R2 image, stale revisions cannot delete',async()=>{
 const api=await modulePromise,s=setup();const data=await upload(api,s),id=data.items[0].id;
 assert.equal((await api.manageContent(request('empty',{action:'delete',id}),s.env,'staff@example.com')).status,409);
 assert.ok(s.objects.has('imagenes/'+id+'.webp'));
 const response=await api.manageContent(request(data.revision,{action:'delete',id}),s.env,'staff@example.com');
 assert.equal(response.status,200);assert.equal((await response.json()).items.length,0);
 assert.equal(s.objects.has('imagenes/'+id+'.webp'),false);
 assert.equal((await api.imageResponse(s.bucket,id,true)).status,404);
});
test('active photos and mascots cannot be deleted; hidden photos and old mascots can',async()=>{
 const api=await modulePromise;
 for(const kind of ['foto','mascota']) {
  const s=setup();let data=await upload(api,s,kind==='foto'?query:'?action=upload&kind=mascota&house=dolphins&title=Mascota');const id=data.items[0].id;
  data=await (await api.manageContent(request(data.revision,{action:'publish',id}),s.env,'staff@example.com')).json();
  assert.equal((await api.manageContent(request(data.revision,{action:'delete',id}),s.env,'staff@example.com')).status,409);
  assert.ok(s.objects.has('imagenes/'+id+'.webp'));
  data=await (await api.manageContent(request(data.revision,kind==='foto'?{action:'hide',id}:{action:'restore-default',house:'dolphins'}),s.env,'staff@example.com')).json();
  assert.equal((await api.manageContent(request(data.revision,{action:'delete',id}),s.env,'staff@example.com')).status,200);
  assert.equal(s.objects.has('imagenes/'+id+'.webp'),false);
 }
});
test('conflicting delete never removes image bytes; storage failure is reported as partial cleanup',async()=>{
 const api=await modulePromise,s=setup();const data=await upload(api,s),id=data.items[0].id;
 const put=s.bucket.put;s.bucket.put=async()=>null;
 assert.equal((await api.manageContent(request(data.revision,{action:'delete',id}),s.env,'staff@example.com')).status,409);
 assert.ok(s.objects.has('imagenes/'+id+'.webp'));
 s.bucket.put=put;s.bucket.delete=async()=>{throw Error('R2 down');};
 const result=await (await api.manageContent(request(data.revision,{action:'delete',id}),s.env,'staff@example.com')).json();
 assert.ok(result.warning);assert.equal(result.pendingDeletion,id);assert.equal(result.items.length,0);
});
