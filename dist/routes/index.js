"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiRoutes = void 0;
const express_1 = require("express");
const payrollRoutes_js_1 = require("./payrollRoutes.js");
const transferRoutes_js_1 = require("./transferRoutes.js");
exports.apiRoutes = (0, express_1.Router)();
exports.apiRoutes.use(transferRoutes_js_1.transferRoutes);
exports.apiRoutes.use(payrollRoutes_js_1.payrollRoutes);
