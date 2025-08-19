import { useQuery } from '@tanstack/react-query';
import Layout from '../../components/Layout';
import Head from 'next/head';

interface UserSummary {
  id: string;
  email: string;
  plan: string;
  created_at: string;
}

interface FileSummary {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
}

export default function AdminPage() {
  const { data: users, isLoading: usersLoading } = useQuery<UserSummary[]>(['admin', 'users'], async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/users`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch users');
    return res.json();
  });
  const { data: files, isLoading: filesLoading } = useQuery<FileSummary[]>(['admin', 'files'], async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/admin/files`, {
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch files');
    return res.json();
  });
  return (
    <Layout>
      <Head>
        <title>Admin Dashboard</title>
      </Head>
      <h2 className="text-2xl font-bold mb-4">Admin Dashboard</h2>
      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">Users</h3>
          {usersLoading ? (
            <p>Loading…</p>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto border rounded p-2">
              {users?.map((u) => (
                <li key={u.id} className="flex justify-between">
                  <span>{u.email}</span>
                  <span className="text-sm">{u.plan}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-2">Files</h3>
          {filesLoading ? (
            <p>Loading…</p>
          ) : (
            <ul className="space-y-1 max-h-64 overflow-y-auto border rounded p-2">
              {files?.map((f) => (
                <li key={f.id} className="flex justify-between text-sm">
                  <span>{f.name}</span>
                  <span className="text-gray-500 dark:text-gray-400">{f.owner_email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Layout>
  );
}
