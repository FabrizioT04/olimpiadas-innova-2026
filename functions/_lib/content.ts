export interface ContentEnv { CONTENT_BUCKET?: R2Bucket; APP_ORIGIN: string }
export interface Item { id:string; kind:'foto'|'mascota'; album:string; subseccion:string; house:string; title:string; published:boolean; created:string; author:string; updatedBy?:string }
interface Catalog { revision:string; items:Item[]; mascotas:Record<string,string> }
const key='catalogo.json';
const json=(data:unknown,status=200)=>Response.json(data,{status,headers:{'Cache-Control':'no-store'}});
const houses=['dolphins','seagulls','eagles','horses'];
const albums=['convivencia','eco-house','deportes','encuentros'];
export async function catalog(bucket:R2Bucket) {
 const object=await bucket.get(key);
 const data:Catalog=object?await object.json():{revision:'empty',items:[],mascotas:{}};
 return {data,etag:object?.etag};
}
async function save(bucket:R2Bucket,data:Catalog,etag?:string) {
 data.revision=crypto.randomUUID();
 return bucket.put(key,JSON.stringify(data),{onlyIf:etag?{etagMatches:etag}:{etagDoesNotMatch:'*'},httpMetadata:{contentType:'application/json'}});
}
export async function imageResponse(bucket:R2Bucket,id:string,privateView=false) {
 const {data}=await catalog(bucket);const item=data.items.find(i=>i.id===id);
 if(!item || (!privateView && !(item.kind==='foto'?item.published:Object.values(data.mascotas).includes(id)))) return json({error:'Imagen no disponible.'},404);
 const image=await bucket.get('imagenes/'+id+'.webp');if(!image)return json({error:'Imagen no disponible.'},404);
 return new Response(image.body,{headers:{'Content-Type':'image/webp','X-Content-Type-Options':'nosniff','Cache-Control':'no-store','Content-Security-Policy':"default-src 'none'; sandbox"}});
}
export async function publicContent(bucket?:R2Bucket) {
 if(!bucket)return json({fotos:[],mascotas:{}});
 const {data}=await catalog(bucket);
 return json({fotos:data.items.filter(i=>i.kind==='foto'&&i.published).map(i=>({id:i.id,titulo:i.title,descripcion:i.title,album:i.album,subseccion:i.subseccion||undefined,url:'/api/media/'+i.id})),
 mascotas:Object.fromEntries(Object.entries(data.mascotas).map(([h,id])=>[h,'/api/media/'+id]))});
}
async function limitedBody(request:Request,max:number) {
 const reader=request.body?.getReader();if(!reader)throw Error('EMPTY');let size=0;const chunks:Uint8Array[]=[];
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>max){await reader.cancel();throw Error('SIZE');}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const c of chunks){bytes.set(c,offset);offset+=c.length;}return bytes;
}
export async function manageContent(request:Request,env:ContentEnv,email:string) {
 const bucket=env.CONTENT_BUCKET;if(!bucket)return json({error:'Falta conectar el almacenamiento de imágenes (CONTENT_BUCKET).'},503);
 const url=new URL(request.url);
 try {
  if(request.method==='GET') {
   const preview=url.searchParams.get('preview');
   if(preview){if(!/^[0-9a-f-]{36}$/.test(preview))return json({error:'Imagen inválida.'},400);return imageResponse(bucket,preview,true);}
   return json((await catalog(bucket)).data);
  }
  if(request.method!=='POST')return json({error:'Método no permitido.'},405);
  if(request.headers.get('Origin')!==env.APP_ORIGIN)return json({error:'Origen no autorizado.'},403);
  const {data,etag}=await catalog(bucket);
  if(request.headers.get('If-Match')!==data.revision)return json({error:'Otra persona actualizó el contenido. Recarga antes de continuar.'},409);
  if(url.searchParams.get('action')==='upload') {
   if(data.items.length>=1000)return json({error:'Se alcanzó el límite de imágenes. Contacta al administrador.'},409);
   if(request.headers.get('Content-Type')!=='image/webp')return json({error:'Solo se aceptan imágenes WebP procesadas.'},415);
   const kind=url.searchParams.get('kind'),album=url.searchParams.get('album')||'',subseccion=url.searchParams.get('subseccion')||'',house=url.searchParams.get('house')||'',title=(url.searchParams.get('title')||'').trim();
   if(!['foto','mascota'].includes(kind||'')||title.length<3||title.length>120 || (kind==='mascota'&&!houses.includes(house)) || (kind==='foto'&&(!albums.includes(album)||(album==='eco-house'?!['asamblea','mariquitas','carteles'].includes(subseccion):subseccion!==''))))return json({error:'Revisa el álbum, la House y el nombre de la imagen.'},400);
   const bytes=await limitedBody(request,4*1024*1024);
   const ascii=(start:number,end:number)=>String.fromCharCode(...bytes.slice(start,end));
   if(bytes.length<20||ascii(0,4)!=='RIFF'||ascii(8,12)!=='WEBP'||!['VP8 ','VP8L','VP8X'].includes(ascii(12,16)))return json({error:'La imagen no es un WebP válido.'},400);
   const id=crypto.randomUUID();const item:Item={id,kind:kind as Item['kind'],album,subseccion,house,title,published:false,author:email,created:new Date().toISOString()};
   await bucket.put('imagenes/'+id+'.webp',bytes,{httpMetadata:{contentType:'image/webp'}});data.items.push(item);
   if(!await save(bucket,data,etag)){await bucket.delete('imagenes/'+id+'.webp');return json({error:'El contenido cambió. Recarga y vuelve a subir la imagen.'},409);}
   return json(data);
  }
  if(!request.headers.get('Content-Type')?.startsWith('application/json'))return json({error:'Formato no permitido.'},415);
  const body=JSON.parse(new TextDecoder().decode(await limitedBody(request,2048))) as {action:string;id:string;house:string};
  if(body.action==='restore-default') {if(!houses.includes(body.house))return json({error:'House inválida.'},400);delete data.mascotas[body.house];}
  else {
   const item=data.items.find(i=>i.id===body.id);if(!item)return json({error:'Imagen no encontrada.'},404);
   if(body.action==='publish'){if(item.kind==='foto')item.published=true;else data.mascotas[item.house]=item.id;}
   else if(body.action==='hide'&&item.kind==='foto')item.published=false;
   else return json({error:'Acción inválida.'},400);
   item.updatedBy=email;
  }
  if(!await save(bucket,data,etag))return json({error:'Otra persona actualizó el contenido. Recarga antes de continuar.'},409);
  return json(data);
 }catch(e){return json({error:e instanceof Error&&e.message==='SIZE'?'La imagen supera el tamaño permitido.':'No se pudo completar la operación. Recarga para comprobar su estado.'},e instanceof Error&&e.message==='SIZE'?413:500);}
}
