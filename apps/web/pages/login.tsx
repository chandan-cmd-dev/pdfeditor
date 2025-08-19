import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api<unknown>('/auth/login', { json: { email, password } });
      window.location.href = '/files';
    } catch (err: any) {
      setMessage(err?.message || 'Login failed');
    }
  };

  return (
    <Layout>
      <Head><title>Login</title></Head>
      <div className="max-w-md mx-auto mt-10">
        <h2 className="text-2xl font-semibold mb-4">Sign in to your account</h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
              required className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
              required className="w-full rounded border border-gray-300 p-2 dark:bg-gray-700 dark:border-gray-600" />
          </div>
          {message && <p className="text-sm text-red-600 dark:text-red-400">{message}</p>}
          <button type="submit" className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark">
            Login
          </button>
        </form>
      </div>
    </Layout>
  );
}
