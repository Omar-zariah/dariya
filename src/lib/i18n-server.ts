import { cookies } from 'next/headers';
import { Lang } from './i18n';

export async function language(): Promise<Lang> {
  const value = (await cookies()).get('dariya_language')?.value;
  return value === 'en' || value === 'ar' ? value : 'fr';
}
