"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireIdempotencyKey = requireIdempotencyKey;
const errorHandler_js_1 = require("./errorHandler.js");
function requireIdempotencyKey(req, _res, next) {
    const key = req.body?.idempotencyKey;
    if (!key || typeof key !== "string") {
        next(new errorHandler_js_1.AppError("idempotencyKey is required", 400));
        return;
    }
    next();
}
