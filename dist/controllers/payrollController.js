import { enqueuePayroll } from "../services/payrollService.js";
import { ok } from "../utils/response.js";
export async function payrollController(req, res, next) {
    try {
        const jobId = await enqueuePayroll(req.body.transfers);
        ok(res, { success: true, jobId }, 202);
    }
    catch (error) {
        next(error);
    }
}
