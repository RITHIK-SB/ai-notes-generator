import 'dotenv/config';
function intFromEnv(name, fallback) {
    const raw = process.env[name];
    if (!raw)
        return fallback;
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) && n > 0 ? n : fallback;
}
const providerEnv = (process.env.AI_PROVIDER ?? 'openai-compatible').toLowerCase();
export const AI_PROVIDER = providerEnv === 'anthropic' ? 'anthropic' : 'openai-compatible';
const defaultModel = AI_PROVIDER === 'anthropic' ? 'claude-3-5-haiku-latest' : 'gpt-4o-mini';
export const config = {
    port: intFromEnv('PORT', 4000),
    ai: {
        provider: AI_PROVIDER,
        apiKey: process.env.AI_API_KEY ?? '',
        model: process.env.AI_MODEL ?? defaultModel,
        baseUrl: (process.env.AI_BASE_URL ?? 'https://api.openai.com/v1').replace(/\/$/, ''),
        timeoutMs: intFromEnv('AI_TIMEOUT_MS', 60_000),
    },
    limits: {
        maxFileBytes: intFromEnv('MAX_FILE_MB', 10) * 1024 * 1024,
        maxTotalChars: intFromEnv('MAX_TOTAL_CHARS', 200_000),
        chunkChars: intFromEnv('CHUNK_CHARS', 12_000),
        minInputChars: intFromEnv('MIN_INPUT_CHARS', 50),
        rateLimitWindowMs: intFromEnv('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
        rateLimitMax: intFromEnv('RATE_LIMIT_MAX', 20),
    },
};
export function isAiConfigured() {
    return config.ai.apiKey.trim().length > 0;
}
