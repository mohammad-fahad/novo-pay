import { Router } from "express";
import { payrollRoutes } from "./payrollRoutes";
import { transferRoutes } from "./transferRoutes";

export const apiRoutes = Router();

apiRoutes.use(transferRoutes);
apiRoutes.use(payrollRoutes);
