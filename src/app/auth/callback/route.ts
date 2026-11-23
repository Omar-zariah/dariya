import { NextResponse, type NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
export async function GET(request:NextRequest){
 const code=request.nextUrl.searchParams.get('code');const next=request.nextUrl.searchParams.get('next')||'/app';
 const safeNext=next.startsWith('/')&&!next.startsWith('//')?next:'/app';
 if(code){const db=await supabaseServer();const {error}=await db.auth.exchangeCodeForSession(code);if(!error) return NextResponse.redirect(new URL(safeNext,request.url));}
 return NextResponse.redirect(new URL('/login?error=Invalid%20or%20expired%20verification%20link',request.url));
}
