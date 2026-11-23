import { NextRequest,NextResponse } from 'next/server';
export async function GET(req:NextRequest){const lang=req.nextUrl.searchParams.get('lang');const next=req.nextUrl.searchParams.get('next')||'/';
 const safe=next.startsWith('/')&&!next.startsWith('//')?next:'/';
 const res=NextResponse.redirect(new URL(safe,req.url));if(lang==='fr'||lang==='en'||lang==='ar')res.cookies.set('dariya_language',lang,{path:'/',sameSite:'lax',httpOnly:true,secure:process.env.NODE_ENV==='production',maxAge:31536000});return res;}
