import { Landmark } from "lucide-react";
import { TransferForm } from "@/components/dashboard/TransferForm";
import { PayrollHub } from "@/components/dashboard/PayrollHub";
import { AccountIdForm } from "@/components/dashboard/AccountIdForm";
import { AccountStats } from "@/components/dashboard/AccountStats";
import { RecentActivityPanel } from "@/components/dashboard/RecentActivityPanel";

export default async function Home(
  props: { searchParams: Promise<{ accountId?: string }> },
): Promise<React.ReactNode> {
  const searchParams = await props.searchParams;
  const accountId = searchParams.accountId ?? "";

  return (
    <div className="flex flex-col flex-1">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border bg-card">
              <Landmark className="h-4 w-4" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-5">NovaPay</div>
              <div className="text-xs text-muted-foreground">Operations dashboard</div>
            </div>
          </div>
          <div className="text-xs text-muted-foreground">
            Demo UI • API proxied via Next route handlers
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-6 py-8">
        <AccountIdForm accountId={accountId} />
        <AccountStats accountId={accountId} />

        <section className="grid gap-6 lg:grid-cols-2">
          <TransferForm />
          <PayrollHub />
        </section>

        <section>
          <RecentActivityPanel accountId={accountId} />
        </section>
      </main>
    </div>
  );
}
