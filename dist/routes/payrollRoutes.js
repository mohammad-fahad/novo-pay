"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollRoutes = void 0;
const express_1 = require("express");
const payrollController_js_1 = require("../controllers/payrollController.js");
exports.payrollRoutes = (0, express_1.Router)();
exports.payrollRoutes.post("/payroll/bulk", payrollController_js_1.payrollController);
