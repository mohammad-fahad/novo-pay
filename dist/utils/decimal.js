import { Decimal } from "decimal.js";
import { Prisma } from "@prisma/client";
export function toMoney(value) {
    return new Decimal(value);
}
export function toPrismaDecimal(value) {
    return new Prisma.Decimal(value.toString());
}
