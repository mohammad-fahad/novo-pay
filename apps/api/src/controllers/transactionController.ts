import { type NextFunction, type Request, type Response } from "express";
import { prisma } from "../config/database";
import { ok } from "../utils/response";

export type RecentLedgerEntry = {
  id: string;
  accountId: string;
  transactionId: string;
  entryType: "DEBIT" | "CREDIT";
  amount: string;
  transactionType: "TRANSFER" | "PAYROLL";
  status: string;
  createdAt: string;
  idempotencyKey: string;
};

export async function recentTransactionsController(
  req: Request<Record<string, never>, { entries: RecentLedgerEntry[] }, Record<string, never>, { accountId?: string }>,
  res: Response<{ entries: RecentLedgerEntry[] }>,
  next: NextFunction,
): Promise<void> {
  try {
    const accountId = req.query.accountId?.trim();

    const entries = await prisma.ledgerEntry.findMany({
      where: accountId ? { accountId } : undefined,
      include: {
        transaction: {
          select: {
            id: true,
            type: true,
            status: true,
            createdAt: true,
            idempotencyKey: true,
          },
        },
      },
      orderBy: { transaction: { createdAt: "desc" } },
      take: 20,
    });

    ok(res, {
      entries: entries.map((e) => ({
        id: e.id,
        accountId: e.accountId,
        transactionId: e.transactionId,
        entryType: e.type,
        amount: e.amount.toString(),
        transactionType: e.transaction.type,
        status: e.transaction.status,
        createdAt: e.transaction.createdAt.toISOString(),
        idempotencyKey: e.transaction.idempotencyKey,
      })),
    });
  } catch (error) {
    next(error);
  }
}

