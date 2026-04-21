import express from "express";
import { apiRoutes } from "./routes/index";
import { errorHandler } from "./middlewares/errorHandler";

export const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "live", timestamp: new Date().toISOString() });
});

app.use(apiRoutes);
app.use(errorHandler);
