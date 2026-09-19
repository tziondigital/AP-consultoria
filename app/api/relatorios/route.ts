import {NextResponse} from 'next/server';
import {createClient} from '@/lib/supabase/server';

export async function GET(){
  const s=await createClient();
  const{data,error}=await s.functions.invoke('generate-report');
  if(error)return NextResponse.json({error:'Não foi possível gerar o relatório.',detail:error.message},{status:502});
  return new NextResponse(JSON.stringify(data,null,2),{status:200,headers:{'Content-Type':'application/json; charset=utf-8','Content-Disposition':`attachment; filename="relatorio-ap-${new Date().toISOString().slice(0,10)}.json"`}});
}
