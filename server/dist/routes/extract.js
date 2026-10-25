import { Router } from 'express';
import multer from 'multer';
import { config } from '../config.js';
import { extractDocument } from '../services/extraction.js';
import { wordCount } from '../services/preprocess.js';
import { Errors } from '../errors.js';
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: config.limits.maxFileBytes, files: 1 },
});
export const extractRouter = Router();
extractRouter.post('/extract', upload.single('file'), async (req, res, next) => {
    try {
        if (!req.file)
            throw Errors.noInput();
        const result = await extractDocument(req.file.buffer, req.file.originalname ?? 'file');
        res.json({
            success: true,
            extraction: {
                filename: req.file.originalname,
                kind: result.kind,
                pages: result.pages ?? null,
                characters: result.text.length,
                words: wordCount(result.text),
                warnings: result.warnings,
                text: result.text,
            },
        });
    }
    catch (err) {
        next(err);
    }
});
