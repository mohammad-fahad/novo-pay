import { Router } from "express";
import { payrollController } from "../controllers/payrollController";
import { payrollJobStatusController } from "../controllers/payrollJobController";

export const payrollRoutes = Router();

payrollRoutes.post("/payroll/disburse", payrollController);
payrollRoutes.get("/payroll/jobs/:jobId", payrollJobStatusController);
