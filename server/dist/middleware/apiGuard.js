import { Errors } from '../errors.js';
export function notFoundApiGuard(_req, _res, next) {
    next(Errors.notFound());
}
