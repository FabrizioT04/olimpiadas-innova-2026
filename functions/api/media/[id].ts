import { imageResponse } from '../../_lib/content';
export const onRequest:PagesFunction<{CONTENT_BUCKET?:R2Bucket}>=async({request,env,params})=>{
 if(request.method!=='GET')return new Response(null,{status:405});
 const id=String(params.id);if(!env.CONTENT_BUCKET||!/^[0-9a-f-]{36}$/.test(id))return new Response(null,{status:404});
 try{return await imageResponse(env.CONTENT_BUCKET,id,false,request.headers.get('If-None-Match'));}catch{return new Response(null,{status:503});}
};
