"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transferRoutes = void 0;
const express_1 = require("express");
const transferController_js_1 = require("../controllers/transferController.js");
const idempotency_js_1 = require("../middlewares/idempotency.js");
exports.transferRoutes = (0, express_1.Router)();
exports.transferRoutes.post("/transfer", idempotency_js_1.requireIdempotencyKey, transferController_js_1.transferController);
exports.transferRoutes.post("/fx/quote", transferController_js_1.fxQuoteController);
