import { Landmark } from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { TransferForm } from "@/components/dashboard/TransferForm";
import { PayrollHub } from "@/components/dashboard/PayrollHub";

export default function Home() {
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
        <section className="grid gap-4 md:grid-cols-3">
          <StatCard title="Balance" value="$12,450.20" hint="Mock value (wire to API when available)" />
          <StatCard title="Total sent" value="$4,120.00" hint="Mock value" />
          <StatCard title="Total received" value="$6,880.00" hint="Mock value" />
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <TransferForm />
          <PayrollHub />
        </section>
      </main>
    </div>
  );
}
