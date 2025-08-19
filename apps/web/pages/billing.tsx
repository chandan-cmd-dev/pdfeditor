import { useState } from 'react';
import Layout from '../components/Layout';
import Head from 'next/head';

export default function BillingPage() {
  const [loading, setLoading] = useState(false);
  const handleSubscribe = async () => {
    setLoading(true);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/billing/subscribe`, {
      method: 'POST',
      credentials: 'include',
    });
    if (!res.ok) {
      setLoading(false);
      alert('Failed to start subscription');
      return;
    }
    const { checkoutUrl } = await res.json();
    // redirect to stripe checkout
    window.location.href = checkoutUrl;
  };
  return (
    <Layout>
      <Head>
        <title>Upgrade</title>
      </Head>
      <div className="max-w-lg mx-auto space-y-4">
        <h2 className="text-2xl font-bold">Upgrade to Pro</h2>
        <p className="text-gray-600 dark:text-gray-300">
          Unlock advanced features like redaction, OCR and ad‑free editing.
        </p>
        <button
          onClick={handleSubscribe}
          className="bg-primary text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Redirecting…' : 'Subscribe for $5/month'}
        </button>
      </div>
    </Layout>
  );
}
