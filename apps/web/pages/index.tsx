import Head from 'next/head';
import Layout from '../components/Layout';
import Link from 'next/link';

export default function Home() {
  return (
    <Layout>
      <Head>
        <title>PDF Editor</title>
      </Head>
      <div className="max-w-3xl mx-auto text-center py-12">
        <h1 className="text-4xl font-bold mb-4">Welcome to the PDF Editor</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-6">
          Edit, annotate, redact and optimise your PDFs right in your browser.  Start for free and upgrade anytime.
        </p>
        <Link
          href="/signup"
          className="inline-block bg-primary text-white px-6 py-3 rounded-md hover:bg-primary-dark transition"
        >
          Get Started
        </Link>
      </div>
    </Layout>
  );
}
