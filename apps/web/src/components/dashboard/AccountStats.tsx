import { StatCard } from "@/components/dashboard/StatCard";
import { fetchBackendJson } from "@/lib/backend";

type AccountSummary =
  | { id: string; currency: string; balance: string; totalSent: string; totalReceived: string }
  | { error: string; detail?: string };

function formatMoney(currency: string, amount: string): string {
  const n = Number(amount);
  if (!Number.isFinite(n)) return amount;
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(n);
}

export async function AccountStats(props: { accountId: string }): Promise<React.ReactNode> {
  const accountId = props.accountId.trim();
  if (!accountId) {
    return (
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Balance" value="—" hint="Enter an Account ID to load real data" />
        <StatCard title="Total sent" value="—" hint="Computed from ledger debits" />
        <StatCard title="Total received" value="—" hint="Computed from ledger credits" />
      </section>
    );
  }

  try {
    const data = await fetchBackendJson<AccountSummary>(`/api/accounts/${encodeURIComponent(accountId)}`);
    if ("error" in data) {
      return (
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Balance" value="—" hint={data.error} />
          <StatCard title="Total sent" value="—" hint="—" />
          <StatCard title="Total received" value="—" hint="—" />
        </section>
      );
    }

    return (
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Balance" value={formatMoney(data.currency, data.balance)} hint={`Account ${data.id}`} />
        <StatCard title="Total sent" value={formatMoney(data.currency, data.totalSent)} hint="Sum of debits (absolute)" />
        <StatCard title="Total received" value={formatMoney(data.currency, data.totalReceived)} hint="Sum of credits" />
      </section>
    );
  } catch {
    return (
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Balance" value="—" hint="Failed to load account" />
        <StatCard title="Total sent" value="—" hint="—" />
        <StatCard title="Total received" value="—" hint="—" />
      </section>
    );
  }
}

