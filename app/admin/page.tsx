import type { Metadata } from 'next';
import { isAdmin } from '@/lib/auth';
import Admin from './panel';
import { Login } from './login';
import './admin.css';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Administración', robots: { index: false, follow: false } };

export default async function Page() {
  if (!(await isAdmin())) return <Login configured={!!process.env.ADMIN_PASSWORD} />;
  return <Admin />;
}
