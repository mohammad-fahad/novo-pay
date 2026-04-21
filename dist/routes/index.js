import { Router } from "express";
import { payrollRoutes } from "./payrollRoutes.js";
import { transferRoutes } from "./transferRoutes.js";
export const apiRoutes = Router();
apiRoutes.use(transferRoutes);
apiRoutes.use(payrollRoutes);
