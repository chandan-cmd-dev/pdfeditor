import { ReactNode } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';

interface LayoutProps { children: ReactNode; }
interface Me {
  id: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'team';
}

export default function Layout({ children }: LayoutProps) {
  const { data: user } = useQuery<Me | null>(['me'], () =>
    api<Me>('/me').catch(() => null)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-semibold text-primary dark:text-primary-light">
            PDF Editor
          </Link>
          <nav className="flex items-center space-x-4">
            {user ? (
              <>
                <Link href="/files" className="hover:underline">My Files</Link>
                <Link href="/account" className="hover:underline">Account</Link>
                {user.role === 'admin' && <Link href="/admin" className="hover:underline">Admin</Link>}
                <button
                  onClick={async () => {
                    await api<unknown>('/auth/logout', { method: 'POST' });
                    window.location.reload();
                  }}
                  className="text-red-500 hover:underline"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="hover:underline">Login</Link>
                <Link href="/signup" className="hover:underline">Sign Up</Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex-1 p-4 bg-gray-50 dark:bg-gray-900 overflow-y-auto">{children}</main>
    </div>
  );
}
