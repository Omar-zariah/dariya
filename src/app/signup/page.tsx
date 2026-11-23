import { configured } from '@/lib/supabase/server';
import { SignupForm } from '@/components/auth/SignupForm';

export default async function Signup({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; notice?: string }>;
}) {
  const params = await searchParams;
  const isConfigured = configured();

  return (
    <main className="auth-page" suppressHydrationWarning>
      <SignupForm
        error={params.error}
        notice={params.notice}
        configured={isConfigured}
      />
    </main>
  );
}
