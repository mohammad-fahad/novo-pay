import { type Response } from "express";

export function ok<T>(res: Response<T>, payload: T, status = 200): void {
  res.status(status).json(payload);
}

export function fail(
  res: Response<{ error: string; detail?: string }>,
  error: string,
  status = 400,
  detail?: string,
): void {
  res.status(status).json({ error, ...(detail ? { detail } : {}) });
}
