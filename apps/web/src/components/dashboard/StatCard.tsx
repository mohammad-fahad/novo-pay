import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function StatCard(props: {
  title: string;
  value: string;
  hint?: string;
}): React.ReactNode {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {props.title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        <div className="text-2xl font-semibold tracking-tight">{props.value}</div>
        {props.hint ? (
          <div className="text-xs text-muted-foreground">{props.hint}</div>
        ) : null}
      </CardContent>
    </Card>
  );
}
