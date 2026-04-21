import { Decimal } from "decimal.js";
import { prisma } from "../config/database.js";
import { toPrismaDecimal } from "../utils/decimal.js";
import { AppError } from "../middlewares/errorHandler.js";

export async function createFxQuote(fromCurrency: string, toCurrency: string) {
  if (!fromCurrency || !toCurrency) {
    throw new AppError("Both currencies are required", 400);
  }

  const mockRate = new Decimal("0.85");
  return prisma.fxQuote.create({
    data: {
      fromCurrency,
      toCurrency,
      rate: toPrismaDecimal(mockRate),
      expiresAt: new Date(Date.now() + 60 * 1000),
    },
  });
}
