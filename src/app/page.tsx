import { getUserFromToken } from '@/lib/auth';
import { redirect } from 'next/navigation';

export default async function Page() {
  const user = await getUserFromToken();

  if (user?.role === 'superadmin') redirect('/admin');
  if (user?.role === 'store')      redirect('/store/dashboard');
  redirect('/login');
}
