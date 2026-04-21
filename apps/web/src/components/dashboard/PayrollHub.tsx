"use client";

import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { BadgeCheck, Loader2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";

type PayrollDisburseResponse =
  | { success: true; jobId: string }
  | { error: string; detail?: string };

type PayrollJobStatus = {
  jobId: string;
  state: string;
  progress: { total: number; processed: number; failed: number } | null;
  result: { success: true; processed: number; failed: number } | null;
  failedReason?: string;
};

type PayrollTransferInput = {
  fromAccountId: string;
  toAccountId: string;
  amount: string | number;
  idempotencyKey?: string;
  quoteId?: string;
};

const SAMPLE = JSON.stringify(
  {
    transfers: [
      {
        fromAccountId: "",
        toAccountId: "",
        amount: "",
        idempotencyKey: "",
      },
    ],
  },
  null,
  2,
);

function safeParseJson(input: string): unknown {
  return JSON.parse(input);
}

export function PayrollHub(): React.ReactNode {
  const [raw, setRaw] = useState(SAMPLE);
  const [pending, setPending] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<PayrollJobStatus | null>(null);

  const pollAbort = useRef<AbortController | null>(null);

  const progressPct = useMemo(() => {
    const p = status?.progress;
    if (!p || p.total <= 0) return 0;
    return Math.round((p.processed / p.total) * 100);
  }, [status]);

  async function poll(jobIdValue: string): Promise<void> {
    pollAbort.current?.abort();
    const controller = new AbortController();
    pollAbort.current = controller;

    for (;;) {
      if (controller.signal.aborted) return;
      const res = await fetch(`/api/payroll/jobs/${encodeURIComponent(jobIdValue)}`, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });

      const data = (await res.json()) as PayrollJobStatus | { error: string };
      if (!res.ok || "error" in data) {
        toast.error("Failed to fetch payroll status");
        return;
      }

      setStatus(data);

      if (data.state === "completed" || data.state === "failed") {
        if (data.state === "completed") {
          toast.success("Payroll batch completed", {
            description: data.result
              ? `Processed ${data.result.processed}, failed ${data.result.failed}`
              : undefined,
          });
        } else {
          toast.error("Payroll batch failed", {
            description: data.failedReason || "Unknown failure",
          });
        }
        return;
      }

      await new Promise((r) => setTimeout(r, 1000));
    }
  }

  async function onSubmit(): Promise<void> {
    setPending(true);
    setStatus(null);
    setJobId(null);

    try {
      const parsed = safeParseJson(raw) as { transfers?: PayrollTransferInput[] };
      if (!parsed || !Array.isArray(parsed.transfers) || parsed.transfers.length === 0) {
        toast.error("Invalid payload", {
          description: 'Expected JSON like: { "transfers": [ ... ] }',
        });
        return;
      }

      const batchId = crypto.randomUUID();
      const transfers = parsed.transfers.map((t, idx) => ({
        ...t,
        idempotencyKey: t.idempotencyKey?.trim() || `payroll-${batchId}-${idx + 1}`,
      }));

      const res = await fetch("/api/payroll/disburse", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ transfers }),
      });

      const data = (await res.json()) as PayrollDisburseResponse;
      if (!res.ok || "error" in data) {
        toast.error("Payroll enqueue failed", {
          description: "error" in data ? data.error : `HTTP ${res.status}`,
        });
        return;
      }

      setJobId(data.jobId);
      toast.success("Payroll batch queued", { description: `Job ${data.jobId}` });
      await poll(data.jobId);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      toast.error("Payroll request failed", { description: message });
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className="shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <CardTitle className="text-base font-semibold">Payroll Hub</CardTitle>
        <Users className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="payrollPayload">Batch payload (JSON)</Label>
          <Textarea
            id="payrollPayload"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            className="min-h-52 font-mono text-xs"
          />
          <div className="text-xs text-muted-foreground">
            Tip: omit per-transfer `idempotencyKey` and NovaPay Web will generate stable keys for this batch.
          </div>
        </div>

        <div className="flex items-center justify-end gap-3">
          <Button onClick={() => setRaw(SAMPLE)} variant="secondary" disabled={pending}>
            Reset sample
          </Button>
          <Button onClick={onSubmit} disabled={pending}>
            {pending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting...
              </>
            ) : (
              "Disburse payroll"
            )}
          </Button>
        </div>

        {jobId ? (
          <div className="rounded-md border bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="text-sm font-medium">Job</div>
                <div className="font-mono text-xs text-muted-foreground">{jobId}</div>
              </div>
              {status?.state === "completed" ? (
                <div className="flex items-center gap-2 text-sm font-medium">
                  <BadgeCheck className="h-4 w-4" />
                  Completed
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{status?.state ?? "queued"}</div>
              )}
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Progress</span>
                <span>{progressPct}%</span>
              </div>
              <Progress value={progressPct} />
              {status?.progress ? (
                <div className="text-xs text-muted-foreground">
                  Processed {status.progress.processed}/{status.progress.total} • Failed {status.progress.failed}
                </div>
              ) : null}

              {status?.failedReason ? (
                <div className="text-xs text-destructive">Failed: {status.failedReason}</div>
              ) : null}

              {status?.result ? (
                <div className="text-xs text-muted-foreground">
                  Result: processed {status.result.processed}, failed {status.result.failed}
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
