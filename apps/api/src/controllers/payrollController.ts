import { type NextFunction, type Request, type Response } from "express";
import { enqueuePayroll } from "../services/payrollService";
import { ok } from "../utils/response";
import {
  type ErrorResponse,
  type PayrollRequestBody,
  type PayrollSuccessResponse,
} from "../types/api";

export async function payrollController(
  req: Request<Record<string, never>, PayrollSuccessResponse | ErrorResponse, PayrollRequestBody>,
  res: Response<PayrollSuccessResponse | ErrorResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const jobId = await enqueuePayroll(req.body.transfers);
    ok(res, { success: true, jobId }, 202);
  } catch (error) {
    next(error);
  }
}
