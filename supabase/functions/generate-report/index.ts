import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import {userClient} from "../_shared/client.ts";

Deno.serve(async(req)=>{
  if(req.method!=="POST")return Response.json({error:"method_not_allowed"},{status:405});
  const s=userClient(req);
  const{data:{user}}=await s.auth.getUser();
  if(!user)return Response.json({error:"unauthorized"},{status:401});
  const[{count:vagas},{count:entrevistas},{data:financeiro}]=await Promise.all([
    s.from("vagas").select("*",{count:"exact",head:true}),
    s.from("entrevistas").select("*",{count:"exact",head:true}),
    s.from("financeiro").select("valor,valor_comissao,status,pago"),
  ]);
  return Response.json({generated_at:new Date().toISOString(),vagas:vagas||0,entrevistas:entrevistas||0,financeiro:financeiro||[]});
});
