import { Decimal } from "decimal.js";
import { prisma } from "../config/database";
import { toPrismaDecimal } from "../utils/decimal";
import { AppError } from "../middlewares/errorHandler";

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
