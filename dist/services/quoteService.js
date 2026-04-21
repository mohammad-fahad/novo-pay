"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createFxQuote = createFxQuote;
const decimal_js_1 = __importDefault(require("decimal.js"));
const database_js_1 = require("../config/database.js");
const decimal_js_2 = require("../utils/decimal.js");
const errorHandler_js_1 = require("../middlewares/errorHandler.js");
async function createFxQuote(fromCurrency, toCurrency) {
    if (!fromCurrency || !toCurrency) {
        throw new errorHandler_js_1.AppError("Both currencies are required", 400);
    }
    const mockRate = new decimal_js_1.default("0.85");
    return database_js_1.prisma.fxQuote.create({
        data: {
            fromCurrency,
            toCurrency,
            rate: (0, decimal_js_2.toPrismaDecimal)(mockRate),
            expiresAt: new Date(Date.now() + 60 * 1000),
        },
    });
}
