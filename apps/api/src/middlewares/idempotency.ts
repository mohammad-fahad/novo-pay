import { type NextFunction, type Request, type Response } from "express";
import { AppError } from "./errorHandler";

export function requireIdempotencyKey(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const key = req.body?.idempotencyKey;
  if (!key || typeof key !== "string") {
    next(new AppError("idempotencyKey is required", 400));
    return;
  }
  next();
}
