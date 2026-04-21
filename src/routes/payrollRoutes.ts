import { Router } from "express";
import { payrollController } from "../controllers/payrollController";

export const payrollRoutes = Router();

payrollRoutes.post("/payroll/disburse", payrollController);
