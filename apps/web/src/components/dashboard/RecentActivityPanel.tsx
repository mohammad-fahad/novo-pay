import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchBackendJson } from "@/lib/backend";

type RecentLedgerEntry = {
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

type RecentActivityResponse =
  | { entries: RecentLedgerEntry[] }
  | { error: string; detail?: string };

function formatAmount(amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return Math.abs(n).toFixed(2);
}

export async function RecentActivityPanel(props: { accountId: string }): Promise<React.ReactNode> {
  const accountId = props.accountId.trim();
  if (!accountId) {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Enter an Account ID to view ledger activity.</div>
        </CardContent>
      </Card>
    );
  }

  try {
    const data = await fetchBackendJson<RecentActivityResponse>(
      `/api/transactions?accountId=${encodeURIComponent(accountId)}`,
    );

    if ("error" in data) {
      return (
        <Card className="shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">{data.error}</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {data.entries.length === 0 ? (
            <div className="text-sm text-muted-foreground">No recent ledger entries.</div>
          ) : (
            <div className="space-y-2">
              {data.entries.map((e) => {
                const sign = e.entryType === "DEBIT" ? "-" : "+";
                const tone = e.entryType === "DEBIT" ? "text-destructive" : "text-emerald-600";
                return (
                  <div key={e.id} className="flex items-center justify-between rounded-md border bg-card px-3 py-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">
                        {e.transactionType} • {e.status}
                      </div>
                      <div className="truncate font-mono text-xs text-muted-foreground">
                        {new Date(e.createdAt).toLocaleString()} • {e.idempotencyKey}
                      </div>
                    </div>
                    <div className={`ml-4 shrink-0 font-mono text-sm ${tone}`}>
                      {sign}
                      {formatAmount(e.amount)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    );
  } catch {
    return (
      <Card className="shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold">Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">Failed to load recent activity.</div>
        </CardContent>
      </Card>
    );
  }
}

