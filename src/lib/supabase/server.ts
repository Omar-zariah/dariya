import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
export function configured() { return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY); }
export async function supabaseServer() {
  if (!configured()) throw new Error('Supabase not configured. Read README.md');
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
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
