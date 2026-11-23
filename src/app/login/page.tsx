import { configured } from '@/lib/supabase/server';
import { LoginForm } from '@/components/auth/LoginForm';

export default async function Login({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const isConfigured = configured();

  return (
    <main className="auth-page" suppressHydrationWarning>
      <LoginForm
        error={params.error}
        notice={params.notice}
        configured={isConfigured}
      />
    </main>
  );
}
