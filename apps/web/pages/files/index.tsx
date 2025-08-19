import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Head from 'next/head';
import Layout from '../../components/Layout';
import { useRef, useState } from 'react';
import { api } from '../../lib/api';

interface FileItem {
  id: string;
  name: string;
  size: number;
  created_at: string;
}

export default function FilesPage() {
  const queryClient = useQueryClient();

  const { data: files, isLoading } = useQuery<FileItem[]>(
    ['files'],
    () => api<FileItem[]>('/files')
  );

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadMutation = useMutation(async (file: File) => {
    setUploading(true);

    // ask API for an upload URL
    const { uploadUrl, fileId } = await api<{ uploadUrl: string; fileId: string }>(
      '/files',
      { json: { name: file.name, size: file.size } }
    );

    // PUT file to storage directly
    await fetch(uploadUrl, { method: 'PUT', body: file });
    setUploading(false);
    return fileId;
  }, {
    onSuccess: () => { queryClient.invalidateQueries(['files']); },
    onError: () => { setUploading(false); },
  });

  const handleUpload = () => {
    const file = fileInputRef.current?.files?.[0];
    if (file) uploadMutation.mutate(file);
  };

  return (
    <Layout>
      <Head><title>Your Files</title></Head>
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">My Files</h2>
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={handleUpload}
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="bg-primary text-white px-4 py-2 rounded hover:bg-primary-dark"
            disabled={uploading}
          >
            {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </div>

      {isLoading ? (
        <p>Loading…</p>
      ) : files && files.length > 0 ? (
        <ul className="space-y-2">
          {files.map((file) => (
            <li
              key={file.id}
              className="border rounded p-3 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
              onClick={() => (window.location.href = `/files/${file.id}`)}
            >
              <div className="font-medium">{file.name}</div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {(file.size / 1024 / 1024).toFixed(2)} MB • {new Date(file.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p>No files yet.</p>
      )}
    </Layout>
  );
}
