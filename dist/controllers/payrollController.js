"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payrollController = payrollController;
const payrollService_js_1 = require("../services/payrollService.js");
const response_js_1 = require("../utils/response.js");
async function payrollController(req, res, next) {
    try {
        const jobId = await (0, payrollService_js_1.enqueuePayroll)(req.body.transfers);
        (0, response_js_1.ok)(res, { success: true, jobId }, 202);
    }
    catch (error) {
        next(error);
    }
}
