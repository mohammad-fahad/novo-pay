"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toMoney = toMoney;
exports.toPrismaDecimal = toPrismaDecimal;
const decimal_js_1 = __importDefault(require("decimal.js"));
const client_1 = require("@prisma/client");
function toMoney(value) {
    return new decimal_js_1.default(value);
}
function toPrismaDecimal(value) {
    return new client_1.Prisma.Decimal(value.toString());
}
