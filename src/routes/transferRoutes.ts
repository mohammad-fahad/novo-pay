import { Router } from "express";
import {
  fxQuoteController,
  transferController,
} from "../controllers/transferController.js";
import { requireIdempotencyKey } from "../middlewares/idempotency.js";

export const transferRoutes = Router();

transferRoutes.post("/transfer", requireIdempotencyKey, transferController);
transferRoutes.post("/fx/quote", fxQuoteController);
