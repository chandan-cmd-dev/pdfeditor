import { useState } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import { api } from '../lib/api';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    try {
      await api<unknown>('/auth/signup', { json: { email, password } });
      setMessage('Check your email for a verification link.');
    } catch (err: any) {
      setMessage(err?.message || 'Signup failed');
    }
  };

  return (
    <Layout>
      <Head><title>Sign Up</title></Head>
      <div className="max-w-md mx-auto mt-10">
        <h2 className="text-2xl font-semibold mb-4">Create an account</h2>
        <form onSubmit={handleSignup} className="space-y-4">
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
            Sign Up
          </button>
        </form>
      </div>
    </Layout>
  );
}
