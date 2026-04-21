import express from "express";
import { apiRoutes } from "./routes/index.js";
import { errorHandler } from "./middlewares/errorHandler.js";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "live", timestamp: new Date().toISOString() });
});

app.use(apiRoutes);
app.use(errorHandler);
