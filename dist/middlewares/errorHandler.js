import { fail } from "../utils/response.js";
export class AppError extends Error {
    statusCode;
    constructor(message, statusCode = 400) {
        super(message);
        this.statusCode = statusCode;
    }
}
export function errorHandler(error, _req, res, _next) {
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
