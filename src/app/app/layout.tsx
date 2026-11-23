import { currentUser, roleHome } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await currentUser();
  redirect(roleHome(profile.role));
}
