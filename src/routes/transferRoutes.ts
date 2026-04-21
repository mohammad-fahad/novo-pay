import { Router } from "express";
import {
  fxQuoteController,
  transferController,
} from "../controllers/transferController";
import { requireIdempotencyKey } from "../middlewares/idempotency";

export const transferRoutes = Router();

transferRoutes.post("/transfer", requireIdempotencyKey, transferController);
transferRoutes.post("/fx/quote", fxQuoteController);
