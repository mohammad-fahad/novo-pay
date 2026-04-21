import { Decimal } from "decimal.js";
import { type NextFunction, type Request, type Response } from "express";
import { prisma } from "../config/database";
import { AppError } from "../middlewares/errorHandler";
import { ok } from "../utils/response";

type AccountSummaryResponse = {
  id: string;
  currency: string;
  balance: string;
  totalSent: string;
  totalReceived: string;
};

export async function accountByIdController(
  req: Request<{ id: string }, AccountSummaryResponse>,
  res: Response<AccountSummaryResponse>,
  next: NextFunction,
): Promise<void> {
  try {
    const account = await prisma.account.findUnique({
      where: { id: req.params.id },
      select: { id: true, currency: true, balance: true },
    });

    if (!account) {
      throw new AppError("ACCOUNT_NOT_FOUND", 404);
    }

    const debitAgg = await prisma.ledgerEntry.aggregate({
      where: { accountId: account.id, type: "DEBIT" },
      _sum: { amount: true },
    });

    const creditAgg = await prisma.ledgerEntry.aggregate({
      where: { accountId: account.id, type: "CREDIT" },
      _sum: { amount: true },
    });

    // Debits are stored as negative amounts (see transferService).
    const totalSent = new Decimal(debitAgg._sum.amount?.toString() ?? "0").abs();
    const totalReceived = new Decimal(creditAgg._sum.amount?.toString() ?? "0");

    ok(res, {
      id: account.id,
      currency: account.currency,
      balance: account.balance.toString(),
      totalSent: totalSent.toString(),
      totalReceived: totalReceived.toString(),
    });
  } catch (error) {
    next(error);
  }
}

