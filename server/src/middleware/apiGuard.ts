import type { Request, Response, NextFunction } from 'express';
import { Errors } from '../errors.js';

export function notFoundApiGuard(_req: Request, _res: Response, next: NextFunction): void {
  next(Errors.notFound());
}
