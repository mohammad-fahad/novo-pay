import { Router } from "express";
import { recentTransactionsController } from "../controllers/transactionController";

export const transactionRoutes = Router();

transactionRoutes.get("/transactions", recentTransactionsController);

