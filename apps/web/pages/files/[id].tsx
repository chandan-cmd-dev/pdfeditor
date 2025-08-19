// apps/web/pages/files/[id].tsx
import { useRouter } from 'next/router';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

type FileItem = {
  id: string;
  name: string;
  size: number;
  created_at: string;
  // API should include one of these so we can stream the PDF:
  storage_key?: string; // used with GET /download/:key
  content_url?: string; // optional: signed/absolute URL from API
};

export default function FileDetail() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;

  const { data: file, isLoading, error } = useQuery<FileItem>(
    ['file', id],
    () => api<FileItem>(`/files/${id}`),
    { enabled: Boolean(id) }
  );

  // Build an ABSOLUTE viewer source that always starts with /api (so Next proxies to API).
  // Priority: explicit content_url (if API returns it) → /api/download/:storage_key → /api/files/:id/content
  const viewerSrc = id ? `/api/files/${id}/content` : undefined;


  return (
    <Layout>
      <Head><title>{file?.name ?? 'File'}</title></Head>

      {isLoading && <p>Loading…</p>}
      {error && <p className="text-red-600">Failed to load file.</p>}

      {file && (
        <div className="space-y-4">
          <h1 className="text-2xl font-semibold break-words">{file.name}</h1>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleString()}
          </div>

          {viewerSrc ? (
            <iframe
              title="PDF Viewer"
              src={viewerSrc}     // ✅ absolute path → /api/... or full content_url
              className="w-full h-[80vh] border rounded"
            />
          ) : (
            <p>No viewer source available for this file.</p>
          )}
        </div>
      )}
    </Layout>
  );
}
