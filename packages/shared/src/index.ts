/**
 * Shared TypeScript interfaces used by the front‑end.  These should be kept
 * in sync with the OpenAPI specification (openapi.yaml) and the Go models.
 */
export interface User {
  id: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro' | 'team';
  created_at: string;
}

export interface File {
  id: string;
  owner_id: string;
  name: string;
  size: number;
  created_at: string;
  storage_key?: string;
}

export interface FileResponse {
  id: string;
  name: string;
  size: number;
  created_at: string;
  downloadUrl: string;
}

export interface AdminFile {
  id: string;
  name: string;
  owner_email: string;
  created_at: string;
}
