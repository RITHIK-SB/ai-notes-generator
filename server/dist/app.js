import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { rateLimit } from './middleware/rateLimit.js';
import { extractRouter } from './routes/extract.js';
import { generateRouter } from './routes/generate.js';
import { notFoundApiGuard } from './middleware/apiGuard.js';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export function createApp() {
    const app = express();
    app.disable('x-powered-by');
    app.set('trust proxy', true);
    app.use((_req, res, next) => {
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('X-Frame-Options', 'DENY');
        res.setHeader('Referrer-Policy', 'no-referrer');
        next();
    });
    // CORS is only needed for a separately hosted frontend; same-origin deployments need none.
    if (process.env.CORS_ORIGIN) {
        app.use(cors({ origin: process.env.CORS_ORIGIN }));
    }
    app.use(express.json({ limit: '2mb' }));
    app.use('/api/generate-notes', rateLimit);
    app.use('/api', extractRouter, generateRouter, notFoundApiGuard);
    // Serve the built client if present (production mode).
    const clientDist = path.resolve(__dirname, '../../client/dist');
    if (fs.existsSync(clientDist)) {
        app.use(express.static(clientDist));
        app.get('*', (_req, res) => res.sendFile(path.join(clientDist, 'index.html')));
    }
    app.use(notFoundHandler);
    app.use(errorHandler);
    return app;
}
