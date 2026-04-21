"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountIdForm(props: { accountId: string }): React.ReactNode {
  const router = useRouter();
  const [value, setValue] = useState(props.accountId);

  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">Account context</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="accountId">Account ID (Prisma UUID)</Label>
        <div className="flex gap-3">
          <Input
            id="accountId"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="e.g. 2c2f6b7a-..."
            autoComplete="off"
          />
          <Button
            type="button"
            onClick={() => router.replace(value.trim() ? `/?accountId=${encodeURIComponent(value.trim())}` : "/")}
          >
            Load
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          This drives balance + totals and filters recent activity.
        </div>
      </CardContent>
    </Card>
  );
}

