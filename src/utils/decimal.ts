import { Decimal } from "decimal.js";
import { Prisma } from "@prisma/client";
import { type DecimalInput } from "../types/api.js";

export type Money = InstanceType<typeof Decimal>;

export function toMoney(value: DecimalInput): Money {
  return new Decimal(value);
}

export function toPrismaDecimal(value: Money): Prisma.Decimal {
  return new Prisma.Decimal(value.toString());
}
