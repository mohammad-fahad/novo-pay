import { Router } from "express";
import { payrollRoutes } from "./payrollRoutes";
import { transferRoutes } from "./transferRoutes";
import { accountRoutes } from "./accountRoutes";
import { transactionRoutes } from "./transactionRoutes";

export const apiRoutes = Router();

apiRoutes.use(transferRoutes);
apiRoutes.use(payrollRoutes);
apiRoutes.use(accountRoutes);
apiRoutes.use(transactionRoutes);
