"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const index_js_1 = require("./routes/index.js");
const errorHandler_js_1 = require("./middlewares/errorHandler.js");
exports.app = (0, express_1.default)();
exports.app.use(express_1.default.json());
exports.app.get("/health", (_req, res) => {
    res.json({ status: "live", timestamp: new Date().toISOString() });
});
exports.app.use(index_js_1.apiRoutes);
exports.app.use(errorHandler_js_1.errorHandler);
