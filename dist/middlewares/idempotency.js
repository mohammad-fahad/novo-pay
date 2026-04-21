import { AppError } from "./errorHandler.js";
export function requireIdempotencyKey(req, _res, next) {
    const key = req.body?.idempotencyKey;
    if (!key || typeof key !== "string") {
        next(new AppError("idempotencyKey is required", 400));
        return;
    }
    next();
}
