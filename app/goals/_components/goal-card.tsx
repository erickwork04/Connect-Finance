import { Badge } from "@/app/_components/ui/badge";
import { Card, CardContent, CardHeader } from "@/app/_components/ui/card";
import { Progress } from "@/app/_components/ui/progress";
import { formatCurrency } from "@/app/_utils/currency";

export interface GoalView {
  id: string;
  name: string;
  currentAmount: number;
  targetAmount: number;
  progressPercent: number;
  deadlineLabel: string;
  status: "ACTIVE" | "COMPLETED" | "OVERDUE";
}

const STATUS_LABELS: Record<GoalView["status"], string> = {
  ACTIVE: "Em andamento",
  COMPLETED: "Concluída",
  OVERDUE: "Atrasada",
};

export default function GoalCard({ goal }: { goal: GoalView }) {
  const progress = Math.max(0, Math.min(goal.progressPercent, 100));

  return (
    <Card className="min-w-0 border-border bg-zinc-950/70">
      <CardHeader className="gap-3 p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="min-w-0 break-words text-lg font-semibold">{goal.name}</h2>
          <Badge
            variant="outline"
            className={goal.status === "OVERDUE" ? "border-red-500/30 text-red-400" : "border-primary/30 text-primary"}
          >
            {STATUS_LABELS[goal.status]}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-5 p-5 pt-0 sm:p-6 sm:pt-0">
        <div className="grid grid-cols-2 gap-4 border-b border-border pb-5">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Valor atual</p>
            <p className="mt-1 break-words font-semibold tabular-nums text-primary">{formatCurrency(goal.currentAmount)}</p>
          </div>
          <div className="min-w-0 text-right">
            <p className="text-xs text-muted-foreground">Objetivo</p>
            <p className="mt-1 break-words font-semibold tabular-nums">{formatCurrency(goal.targetAmount)}</p>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="text-muted-foreground">Progresso</span>
            <span className="font-semibold tabular-nums">{progress}%</span>
          </div>
          <Progress value={progress} aria-label={`Progresso da meta ${goal.name}`} className="h-2 [&>div]:bg-primary" />
        </div>
        <p className="text-sm text-muted-foreground">Prazo: <span className="text-foreground">{goal.deadlineLabel}</span></p>
      </CardContent>
    </Card>
  );
}
