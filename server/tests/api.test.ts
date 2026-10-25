import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import request from 'supertest';
import type { Express } from 'express';

const LONG_TEXT =
  'Photosynthesis is the process by which green plants convert sunlight, water, and carbon dioxide into glucose and oxygen. ' +
  'It occurs in the chloroplasts, primarily in the leaves. The process has two stages: light-dependent reactions and the Calvin cycle.';

async function freshApp(env: Record<string, string | undefined> = {}): Promise<Express> {
  vi.resetModules();
  process.env.AI_API_KEY = env.AI_API_KEY;
  process.env.AI_PROVIDER = env.AI_PROVIDER;
  const { createApp } = await import('../src/app.js');
  return createApp();
}

afterEach(() => {
  vi.unstubAllGlobals();
  delete process.env.AI_API_KEY;
  delete process.env.AI_PROVIDER;
});

describe('GET /api/config-status', () => {
  it('reports not configured when no key is set', async () => {
    const app = await freshApp({ AI_API_KEY: '' });
    const res = await request(app).get('/api/config-status');
    expect(res.status).toBe(200);
    expect(res.body.aiConfigured).toBe(false);
    expect(res.body.limits.maxFileMb).toBeGreaterThan(0);
  });

  it('reports configured (without leaking the key) when set', async () => {
    const app = await freshApp({ AI_API_KEY: 'secret-key-123' });
    const res = await request(app).get('/api/config-status');
    expect(res.body.aiConfigured).toBe(true);
    expect(JSON.stringify(res.body)).not.toContain('secret-key-123');
  });
});

describe('POST /api/generate-notes', () => {
  it('returns a clear configuration message when the API key is missing', async () => {
    const app = await freshApp({ AI_API_KEY: '' });
    const res = await request(app)
      .post('/api/generate-notes')
      .send({ text: LONG_TEXT, settings: { length: 'medium', style: 'bullet_points', difficulty: 'intermediate', instructions: '' } });
    expect(res.status).toBe(503);
    expect(res.body.error.code).toBe('AI_NOT_CONFIGURED');
    expect(res.body.error.message).toMatch(/AI_API_KEY/);
  });

  it('rejects missing input', async () => {
    const app = await freshApp();
    const res = await request(app).post('/api/generate-notes').send({});
    expect(res.status).toBe(400);
  });

  it('rejects too-short input', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/generate-notes')
      .send({ text: 'too short', settings: { length: 'short', style: 'headings', difficulty: 'beginner' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INPUT_TOO_SHORT');
  });

  it('rejects invalid settings', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/generate-notes')
      .send({ text: LONG_TEXT, settings: { length: 'huge', style: 'bullet_points', difficulty: 'beginner' } });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('INVALID_SETTINGS');
  });

  it('generates notes through a configured (mocked) provider', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({
      choices: [{ message: { content: '# Photosynthesis\n\n- Converts sunlight to chemical energy.\n- Occurs in chloroplasts.' } }],
    }), { status: 200 })));
    const app = await freshApp({ AI_API_KEY: 'test-key' });
    const res = await request(app)
      .post('/api/generate-notes')
      .send({ text: LONG_TEXT, settings: { length: 'medium', style: 'bullet_points', difficulty: 'intermediate', instructions: 'Focus on definitions.' } });
    expect(res.status).toBe(200);
    expect(res.body.notes.title).toBe('Photosynthesis');
    expect(res.body.notes.content).toContain('chloroplasts');
    expect(res.body.meta.chunked).toBe(false);

    // The settings must actually reach the provider.
    const sentBody = JSON.parse((vi.mocked(fetch).mock.calls[0][1] as RequestInit).body as string);
    expect(sentBody.messages[1].content).toContain('Focus on definitions.');
    expect(sentBody.messages[1].content).toContain('bullet_points');
  });

  it('handles provider rate limiting', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 429 })));
    const app = await freshApp({ AI_API_KEY: 'test-key' });
    const res = await request(app)
      .post('/api/generate-notes')
      .send({ text: LONG_TEXT, settings: { length: 'short', style: 'headings', difficulty: 'beginner' } });
    expect(res.status).toBe(429);
    expect(res.body.error.code).toBe('AI_RATE_LIMITED');
  });

  it('handles an empty/malformed provider response', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ choices: [] }), { status: 200 })));
    const app = await freshApp({ AI_API_KEY: 'test-key' });
    const res = await request(app)
      .post('/api/generate-notes')
      .send({ text: LONG_TEXT, settings: { length: 'short', style: 'headings', difficulty: 'beginner' } });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_INVALID_RESPONSE');
  });

  it('handles provider unavailability', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('connection refused'); }));
    const app = await freshApp({ AI_API_KEY: 'test-key' });
    const res = await request(app)
      .post('/api/generate-notes')
      .send({ text: LONG_TEXT, settings: { length: 'short', style: 'headings', difficulty: 'beginner' } });
    expect(res.status).toBe(502);
    expect(res.body.error.code).toBe('AI_UNAVAILABLE');
  });
});

describe('POST /api/extract', () => {
  it('extracts text from an uploaded TXT file', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/extract')
      .attach('file', Buffer.from('Cell biology is the study of cells, the basic unit of life.'), 'bio.txt');
    expect(res.status).toBe(200);
    expect(res.body.extraction.text).toContain('Cell biology');
    expect(res.body.extraction.words).toBeGreaterThan(5);
  });

  it('rejects an unsupported upload', async () => {
    const app = await freshApp();
    const res = await request(app)
      .post('/api/extract')
      .attach('file', Buffer.from('x'), 'picture.png');
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe('UNSUPPORTED_FORMAT');
  });

  it('rejects a file with no file part', async () => {
    const app = await freshApp();
    const res = await request(app).post('/api/extract').send({});
    expect(res.status).toBe(400);
  });
});
