import type { ReactNode } from "react";

import { Card, CardContent } from "./ui/card";

interface FeatureEmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
}

export default function FeatureEmptyState({
  icon,
  title,
  description,
}: FeatureEmptyStateProps) {
  return (
    <Card className="border-border bg-zinc-950/70">
      <CardContent className="flex min-h-[300px] flex-col items-start justify-center gap-4 p-6 sm:min-h-[340px] sm:p-10">
        <div aria-hidden="true" className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/10 text-primary">
          {icon}
        </div>
        <div className="max-w-xl space-y-2">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          <p className="text-sm leading-6 text-muted-foreground sm:text-base">
            {description}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
