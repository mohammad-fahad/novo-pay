import { type NextFunction, type Request, type Response } from "express";
import { fail } from "../utils/response.js";

export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    fail(res, error.message, error.statusCode);
    return;
  }

  if (error instanceof Error) {
    console.error("UNHANDLED_ERROR:", error.message);
    fail(res, "Internal Server Error", 500);
    return;
  }

  console.error("UNHANDLED_UNKNOWN_ERROR");
  fail(res, "Internal Server Error", 500);
}
