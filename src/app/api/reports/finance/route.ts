import { NextResponse } from 'next/server';
import { configured, supabaseServer } from '@/lib/supabase/server';
export async function GET(){
 if(!configured())return NextResponse.json({error:'Database unavailable'}, {status:503});
 const db=await supabaseServer();const {data:{user}}=await db.auth.getUser();if(!user)return NextResponse.json({error:'Authentication required'},{status:401});
 const [ps,rs,es]=await Promise.all([db.from('properties').select('id,name'),db.from('rent_payments').select('property_id,received_on,amount,reference'),db.from('expenses').select('property_id,incurred_on,amount,category,note')]);
 if(ps.error||rs.error||es.error) return NextResponse.json({error:'Unable to prepare report'},{status:500});
 const names=new Map((ps.data||[]).map(x=>[x.id,x.name]));
 const rows=[['type','property','date','amount_mad','description']];
 for(const r of rs.data||[])rows.push(['rent',names.get(r.property_id)||'',r.received_on,String(r.amount),r.reference||'']);
 for(const e of es.data||[])rows.push(['expense',names.get(e.property_id)||'',e.incurred_on,String(e.amount),e.category+(e.note?' - '+e.note:'')]);
 const safe=(s:string)=>{let v=s.replaceAll('"','""');if(/^[\s]*[=+@-]/.test(v))v="'"+v;return '"'+v+'"';};
 return new NextResponse('\uFEFF'+rows.map(row=>row.map(safe).join(',')).join('\r\n'),{headers:{'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="dariya-ledger.csv"','Cache-Control':'no-store'}});
}
