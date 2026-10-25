import { createApp } from './app.js';
import { config, isAiConfigured } from './config.js';
const app = createApp();
app.listen(config.port, () => {
    console.log(`[server] AI Notes Generator API listening on http://localhost:${config.port}`);
    if (!isAiConfigured()) {
        console.log('[server] AI_API_KEY is not set - note generation will return a configuration message until it is provided.');
    }
    else {
        console.log(`[server] AI provider: ${config.ai.provider}, model: ${config.ai.model}`);
    }
});
