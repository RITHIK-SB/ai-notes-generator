import { Router } from 'express';
import { config, isAiConfigured } from '../config.js';
import { Errors } from '../errors.js';
import { completeChat } from '../services/ai.js';
import { chunkText } from '../services/chunking.js';
import { preprocessText } from '../services/preprocess.js';
import { SYSTEM_PROMPT, buildChunkPrompt, buildCombinePrompt, buildUserPrompt, extractTitle, } from '../services/prompt.js';
import { generateRequestSchema } from '../validation.js';
export const generateRouter = Router();
generateRouter.post('/generate-notes', async (req, res, next) => {
    try {
        const parsed = generateRequestSchema.safeParse(req.body);
        if (!parsed.success)
            throw parsed.error;
        const text = preprocessText(parsed.data.text);
        const settings = parsed.data.settings;
        if (text.length < config.limits.minInputChars) {
            throw Errors.inputTooShort(config.limits.minInputChars);
        }
        if (text.length > config.limits.maxTotalChars) {
            throw Errors.inputTooLarge(config.limits.maxTotalChars);
        }
        const chunks = chunkText(text, config.limits.chunkChars);
        let sourceForNotes = text;
        if (chunks.length > 1) {
            // Large document: summarize each chunk, then combine. Nothing is silently dropped.
            const partials = [];
            for (let i = 0; i < chunks.length; i++) {
                partials.push(await completeChat([
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: buildChunkPrompt(chunks[i], i, chunks.length) },
                ]));
            }
            const combined = await completeChat([
                { role: 'system', content: SYSTEM_PROMPT },
                { role: 'user', content: buildCombinePrompt(partials, settings) },
            ]);
            const { title, content } = extractTitle(combined);
            return res.json({
                success: true,
                notes: { title, content },
                meta: { provider: config.ai.provider, model: config.ai.model, chunked: true, chunks: chunks.length },
            });
        }
        const generated = await completeChat([
            { role: 'system', content: SYSTEM_PROMPT },
            { role: 'user', content: buildUserPrompt(sourceForNotes, settings) },
        ]);
        const { title, content } = extractTitle(generated);
        if (content.length === 0)
            throw Errors.aiInvalidResponse();
        res.json({
            success: true,
            notes: { title, content },
            meta: { provider: config.ai.provider, model: config.ai.model, chunked: false, chunks: 1 },
        });
    }
    catch (err) {
        next(err);
    }
});
generateRouter.get('/config-status', (_req, res) => {
    res.json({
        success: true,
        aiConfigured: isAiConfigured(),
        provider: config.ai.provider,
        model: isAiConfigured() ? config.ai.model : null,
        limits: {
            maxFileMb: Math.round(config.limits.maxFileBytes / (1024 * 1024)),
            maxTotalChars: config.limits.maxTotalChars,
            minInputChars: config.limits.minInputChars,
        },
    });
});
