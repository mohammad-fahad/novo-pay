"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferController = transferController;
exports.fxQuoteController = fxQuoteController;
const quoteService_js_1 = require("../services/quoteService.js");
const transferService_js_1 = require("../services/transferService.js");
const response_js_1 = require("../utils/response.js");
async function transferController(req, res, next) {
    try {
        const response = await (0, transferService_js_1.transferWithIdempotency)(req.body);
        (0, response_js_1.ok)(res, response);
    }
    catch (error) {
        next(error);
    }
}
async function fxQuoteController(req, res, next) {
    try {
        const quote = await (0, quoteService_js_1.createFxQuote)(req.body.fromCurrency, req.body.toCurrency);
        (0, response_js_1.ok)(res, { quoteId: quote.id, rate: quote.rate, expiresAt: quote.expiresAt });
    }
    catch (error) {
        next(error);
    }
}
