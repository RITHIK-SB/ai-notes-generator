export interface NoteSettings {
  length: 'short' | 'medium' | 'detailed';
  style: 'bullet_points' | 'headings' | 'qa' | 'exam_revision';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  instructions: string;
}

export interface GeneratedNotes {
  title: string;
  content: string;
}

export interface GenerateMeta {
  provider: string;
  model: string;
  chunked: boolean;
  chunks: number;
}

export interface ConfigStatus {
  aiConfigured: boolean;
  provider: string;
  model: string | null;
  limits: { maxFileMb: number; maxTotalChars: number; minInputChars: number };
}

export class ApiError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function parseResponse<T>(res: Response): Promise<T> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Could not reach the server. Check your connection and that the backend is running.');
  }
  const b = body as { success?: boolean; error?: { code?: string; message?: string } };
  if (!res.ok || b.success === false) {
    throw new ApiError(b.error?.code ?? 'UNKNOWN_ERROR', b.error?.message ?? 'Something went wrong. Please try again.');
  }
  return body as T;
}

export async function getConfigStatus(): Promise<ConfigStatus> {
  const res = await fetch('/api/config-status');
  const body = await parseResponse<{ success: boolean } & Omit<ConfigStatus, 'limits'> & { limits: ConfigStatus['limits'] }>(res);
  return {
    aiConfigured: body.aiConfigured,
    provider: body.provider,
    model: body.model,
    limits: body.limits,
  };
}

export async function extractFile(file: File): Promise<{ text: string; pages: number | null; warnings: string[] }> {
  const form = new FormData();
  form.append('file', file);
  let res: Response;
  try {
    res = await fetch('/api/extract', { method: 'POST', body: form });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Network connection lost while uploading. Check your connection and try again.');
  }
  const body = await parseResponse<{ extraction: { text: string; pages: number | null; warnings: string[] } }>(res);
  return body.extraction;
}

export async function generateNotes(
  text: string,
  settings: NoteSettings,
): Promise<{ notes: GeneratedNotes; meta: GenerateMeta }> {
  let res: Response;
  try {
    res = await fetch('/api/generate-notes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, settings }),
    });
  } catch {
    throw new ApiError('NETWORK_ERROR', 'Network connection lost while generating. Check your connection and try again.');
  }
  return parseResponse(res);
}
