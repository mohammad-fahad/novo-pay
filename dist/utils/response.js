export function ok(res, payload, status = 200) {
    res.status(status).json(payload);
}
export function fail(res, error, status = 400, detail) {
    res.status(status).json({ error, ...(detail ? { detail } : {}) });
}
