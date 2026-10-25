import { config, isAiConfigured } from '../config.js';
import { Errors } from '../errors.js';
async function callOpenAICompatible(messages) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);
    let res;
    try {
        res = await fetch(`${config.ai.baseUrl}/chat/completions`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${config.ai.apiKey}`,
            },
            body: JSON.stringify({ model: config.ai.model, messages, temperature: 0.3 }),
            signal: controller.signal,
        });
    }
    catch (err) {
        if (err.name === 'AbortError')
            throw Errors.aiTimeout();
        throw Errors.aiUnavailable();
    }
    finally {
        clearTimeout(timer);
    }
    if (res.status === 429)
        throw Errors.aiRateLimited();
    if (!res.ok)
        throw Errors.aiUnavailable();
    let data;
    try {
        data = await res.json();
    }
    catch {
        throw Errors.aiInvalidResponse();
    }
    const content = data?.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || content.trim().length === 0)
        throw Errors.aiInvalidResponse();
    return content.trim();
}
async function callAnthropic(messages) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.ai.timeoutMs);
    const system = messages.filter((m) => m.role === 'system').map((m) => m.content).join('\n');
    const userMessages = messages.filter((m) => m.role === 'user');
    let res;
    try {
        res = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': config.ai.apiKey,
                'anthropic-version': '2023-06-01',
            },
            body: JSON.stringify({
                model: config.ai.model,
                max_tokens: 4096,
                system,
                messages: userMessages,
            }),
            signal: controller.signal,
        });
    }
    catch (err) {
        if (err.name === 'AbortError')
            throw Errors.aiTimeout();
        throw Errors.aiUnavailable();
    }
    finally {
        clearTimeout(timer);
    }
    if (res.status === 429)
        throw Errors.aiRateLimited();
    if (!res.ok)
        throw Errors.aiUnavailable();
    let data;
    try {
        data = await res.json();
    }
    catch {
        throw Errors.aiInvalidResponse();
    }
    const blocks = data?.content;
    const text = Array.isArray(blocks)
        ? blocks.filter((b) => b?.type === 'text').map((b) => b.text).join('')
        : '';
    if (typeof text !== 'string' || text.trim().length === 0)
        throw Errors.aiInvalidResponse();
    return text.trim();
}
export async function completeChat(messages) {
    if (!isAiConfigured())
        throw Errors.aiNotConfigured();
    const providers = {
        'openai-compatible': callOpenAICompatible,
        anthropic: callAnthropic,
    };
    return providers[config.ai.provider](messages);
}
