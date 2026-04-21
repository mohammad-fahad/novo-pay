"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
exports.errorHandler = errorHandler;
const response_js_1 = require("../utils/response.js");
class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
exports.AppError = AppError;
function errorHandler(error, _req, res, _next) {
    if (error instanceof AppError) {
        (0, response_js_1.fail)(res, error.message, error.statusCode);
        return;
    }
    if (error instanceof Error) {
        console.error("UNHANDLED_ERROR:", error.message);
        (0, response_js_1.fail)(res, "Internal Server Error", 500);
        return;
    }
    console.error("UNHANDLED_UNKNOWN_ERROR");
    (0, response_js_1.fail)(res, "Internal Server Error", 500);
}
