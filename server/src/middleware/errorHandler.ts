import type { NextFunction, Request, Response } from 'express';
import multer from 'multer';
import { ZodError } from 'zod';
import { AppError, Errors } from '../errors.js';
import { config } from '../config.js';

export function notFoundHandler(_req: Request, res: Response): void {
  const err = Errors.notFound();
  res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
}

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction): void {
  if (err instanceof AppError) {
    res.status(err.status).json({ success: false, error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof ZodError) {
    const detail = err.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
    const appErr = Errors.invalidSettings(detail);
    res.status(appErr.status).json({ success: false, error: { code: appErr.code, message: appErr.message } });
    return;
  }
  if (err instanceof multer.MulterError) {
    const appErr =
      err.code === 'LIMIT_FILE_SIZE'
        ? Errors.fileTooLarge(Math.round(config.limits.maxFileBytes / (1024 * 1024)))
        : new AppError(400, 'UPLOAD_ERROR', 'The file upload failed. Please try again.');
    res.status(appErr.status).json({ success: false, error: { code: appErr.code, message: appErr.message } });
    return;
  }
  // Never leak stack traces or internals.
  console.error('[server] unexpected error:', (err as Error)?.message);
  res
    .status(500)
    .json({ success: false, error: { code: 'INTERNAL_ERROR', message: 'Something went wrong on the server. Please try again.' } });
}
