import { Router } from "express";
import { payrollController } from "../controllers/payrollController.js";
export const payrollRoutes = Router();
payrollRoutes.post("/payroll/bulk", payrollController);
