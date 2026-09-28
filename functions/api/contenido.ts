import { publicContent } from '../_lib/content';
export const onRequest:PagesFunction<{CONTENT_BUCKET?:R2Bucket}>=async({request,env})=>{
 if(request.method!=='GET')return new Response(null,{status:405});
 try{return await publicContent(env.CONTENT_BUCKET);}catch{return Response.json({error:'Contenido temporalmente no disponible.'},{status:503,headers:{'Cache-Control':'no-store'}});}
};
