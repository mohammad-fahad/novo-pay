import { createFxQuote } from "../services/quoteService.js";
import { transferWithIdempotency } from "../services/transferService.js";
import { ok } from "../utils/response.js";
export async function transferController(req, res, next) {
    try {
        const response = await transferWithIdempotency(req.body);
        ok(res, response);
    }
    catch (error) {
        next(error);
    }
}
export async function fxQuoteController(req, res, next) {
    try {
        const quote = await createFxQuote(req.body.fromCurrency, req.body.toCurrency);
        ok(res, { quoteId: quote.id, rate: quote.rate, expiresAt: quote.expiresAt });
    }
    catch (error) {
        next(error);
    }
}
