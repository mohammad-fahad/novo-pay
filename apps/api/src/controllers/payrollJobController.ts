import { type NextFunction, type Request, type Response } from "express";
import { getPayrollJobStatus, type PayrollJobStatusResponse } from "../services/payrollService";
import { ok } from "../utils/response";

export async function payrollJobStatusController(
  req: Request<{ jobId: string }, PayrollJobStatusResponse>,
  res: Response<PayrollJobStatusResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const status = await getPayrollJobStatus(req.params.jobId);
    ok(res, status);
  } catch (error) {
    next(error);
  }
}
