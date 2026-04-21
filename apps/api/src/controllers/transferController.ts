import { type Request, type Response, type NextFunction } from "express";
import { createFxQuote } from "../services/quoteService";
import { transferWithIdempotency } from "../services/transferService";
import { ok } from "../utils/response";
import {
  type ErrorResponse,
  type FxQuoteRequestBody,
  type TransferRequestBody,
  type TransferSuccessResponse,
} from "../types/api";

export async function transferController(
  req: Request<Record<string, never>, TransferSuccessResponse | ErrorResponse, TransferRequestBody>,
  res: Response<TransferSuccessResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const response = await transferWithIdempotency(req.body);
    ok(res, response);
  } catch (error) {
    next(error);
  }
}

export async function fxQuoteController(
  req: Request<Record<string, never>, { quoteId: string; rate: unknown; expiresAt: Date } | ErrorResponse, FxQuoteRequestBody>,
  res: Response<{ quoteId: string; rate: unknown; expiresAt: Date } | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const quote = await createFxQuote(req.body.fromCurrency, req.body.toCurrency);
    ok(res, { quoteId: quote.id, rate: quote.rate, expiresAt: quote.expiresAt });
  } catch (error) {
    next(error);
  }
}
