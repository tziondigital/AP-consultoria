import {createClient} from "npm:@supabase/supabase-js@2.116.0";

function publishableKey(){
  const legacy=Deno.env.get("SUPABASE_ANON_KEY");
  if(legacy)return legacy;
  const keys=JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS")||"{}");
  if(!keys.default)throw new Error("Supabase publishable key is not configured");
  return keys.default as string;
}

export function userClient(req:Request){
  return createClient(Deno.env.get("SUPABASE_URL")!,publishableKey(),{
    global:{headers:{Authorization:req.headers.get("Authorization")||""}},
  });
}
