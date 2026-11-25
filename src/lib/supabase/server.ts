import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function configured() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  return Boolean(url && key && /^https?:\/\//.test(url));
}
export async function supabaseServer() {
  if (!configured()) throw new Error('Supabase not configured. Read README.md');
  const jar = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!.trim(),
    {
    cookies: {
      getAll() { return jar.getAll(); },
      setAll(values: { name: string; value: string; options: CookieOptions }[]) {
        try {
          values.forEach(({name,value,options}) => jar.set(name,value,options));
        } catch {
          /* Server components are read-only. Session is refreshed in proxy. */
        }
      }
    }
  });
}
