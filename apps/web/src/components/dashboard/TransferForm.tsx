"use client";

import { useId, useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRightLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type TransferResponse =
  | { success: true; transactionId: string }
  | { error: string; detail?: string };

export function TransferForm(): React.ReactNode {
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [amount, setAmount] = useState("");
  const [idempotencyKey, setIdempotencyKey] = useState("");
  const [quoteId, setQuoteId] = useState("");
  const [pending, setPending] = useState(false);
  const reactId = useId();

  const computedIdempotencyKey = useMemo(() => {
    return idempotencyKey.trim() || `novapay-${reactId}`;
  }, [idempotencyKey, reactId]);

  async function onSubmit(): Promise<void> {
    setPending(true);
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fromAccountId,
          toAccountId,
          amount,
          idempotencyKey: computedIdempotencyKey,
          ...(quoteId.trim() ? { quoteId: quoteId.trim() } : {}),
        }),
      });

      const data = (await res.json()) as TransferResponse;

      if (!res.ok || "error" in data) {
        toast.error("Transfer failed", {
          description: "error" in data ? data.error : `HTTP ${res.status}`,
        });
        return;
      }

      toast.success("Transfer completed", {
        description: `Transaction ${data.transactionId}`,
      });
      setIdempotencyKey(computedIdempotencyKey);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Transfer failed", { description: message });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base font-semibold">Transfer</CardTitle>
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fromAccountId">From Account</Label>
            <Input
              id="fromAccountId"
              value={fromAccountId}
              onChange={(e) => setFromAccountId(e.target.value)}
              placeholder="sender-uuid"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="toAccountId">To Account</Label>
            <Input
              id="toAccountId"
              value={toAccountId}
              onChange={(e) => setToAccountId(e.target.value)}
              placeholder="receiver-uuid"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="10.00"
              inputMode="decimal"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="quoteId">FX Quote (optional)</Label>
            <Input
              id="quoteId"
              value={quoteId}
              onChange={(e) => setQuoteId(e.target.value)}
              placeholder="quote-uuid"
              autoComplete="off"
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="idempotencyKey">Idempotency Key</Label>
            <Input
              id="idempotencyKey"
              value={idempotencyKey}
              onChange={(e) => setIdempotencyKey(e.target.value)}
              placeholder="Leave blank to auto-generate"
              autoComplete="off"
            />
            <div className="text-xs text-muted-foreground">
              Using:{" "}
              <span className="font-mono" suppressHydrationWarning>
                {computedIdempotencyKey}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end">
          <Button onClick={onSubmit} disabled={pending}>
            {pending ? "Sending..." : "Send transfer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
