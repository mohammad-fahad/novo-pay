"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ok = ok;
exports.fail = fail;
function ok(res, payload, status = 200) {
    res.status(status).json(payload);
}
function fail(res, error, status = 400, detail) {
    res.status(status).json({ error, ...(detail ? { detail } : {}) });
}
