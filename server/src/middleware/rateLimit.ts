import type { NextFunction, Request, Response } from 'express';
import { config } from '../config.js';
import { Errors } from '../errors.js';

interface Bucket {
  timestamps: number[];
}

const buckets = new Map<string, Bucket>();

setInterval(() => {
  const cutoff = Date.now() - config.limits.rateLimitWindowMs;
  for (const [key, bucket] of buckets) {
    bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
    if (bucket.timestamps.length === 0) buckets.delete(key);
  }
}, 60_000).unref();

/** Simple in-memory sliding-window rate limiter (per IP). */
export function rateLimit(req: Request, _res: Response, next: NextFunction): void {
  const key = req.ip ?? 'unknown';
  const now = Date.now();
  const cutoff = now - config.limits.rateLimitWindowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
  if (bucket.timestamps.length >= config.limits.rateLimitMax) {
    buckets.set(key, bucket);
    next(Errors.rateLimited());
    return;
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  next();
}
