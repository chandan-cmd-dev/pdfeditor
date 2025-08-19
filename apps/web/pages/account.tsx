import { useQuery } from '@tanstack/react-query';
import Layout from '../components/Layout';
import Head from 'next/head';
import Link from 'next/link';

interface User {
  id: string;
  email: string;
  role: string;
  plan: string;
  created_at: string;
}

export default function AccountPage() {
  const { data: user, isLoading } = useQuery<User | null>(['me'], async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/me`, {
      credentials: 'include',
    });
    if (!res.ok) return null;
    return res.json();
  });
  return (
    <Layout>
      <Head>
        <title>Account</title>
      </Head>
      {isLoading || !user ? (
        <p>Loading…</p>
      ) : (
        <div className="max-w-lg mx-auto space-y-4">
          <h2 className="text-2xl font-bold">Account</h2>
          <p>Email: {user.email}</p>
          <p>Plan: {user.plan}</p>
          <p>Member since: {new Date(user.created_at).toLocaleDateString()}</p>
          {user.plan === 'free' && (
            <Link href="/billing" className="inline-block bg-primary text-white px-4 py-2 rounded">
              Upgrade to Pro
            </Link>
          )}
        </div>
      )}
    </Layout>
  );
}
