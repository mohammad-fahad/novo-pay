import { Router } from "express";
import { accountByIdController } from "../controllers/accountController";

export const accountRoutes = Router();

accountRoutes.get("/accounts/:id", accountByIdController);

