import { Plus, Target } from "lucide-react";

import FeatureEmptyState from "@/app/_components/feature-empty-state";
import Navbar from "@/app/_components/navbar";
import PageHeader from "@/app/_components/page-header";
import { Button } from "@/app/_components/ui/button";
import GoalCard, { type GoalView } from "./goal-card";

interface GoalsScreenProps {
  goals: GoalView[] | null;
}

export default function GoalsScreen({ goals }: GoalsScreenProps) {
  return (
    <>
      <Navbar />
      <main className="mx-auto flex w-full max-w-7xl min-w-0 flex-col gap-5 p-4 sm:gap-6 sm:p-6">
        <PageHeader
          title="Metas"
          actions={
            <Button disabled aria-describedby="goals-availability" className="h-11 w-full rounded-full sm:w-auto">
              <Plus aria-hidden="true" /> Adicionar meta
            </Button>
          }
        />
        <p id="goals-availability" className="max-w-2xl text-sm leading-6 text-muted-foreground">
          Organize objetivos financeiros e acompanhe o progresso de cada um. O cadastro ficará disponível quando a persistência de metas for implementada.
        </p>
        {goals === null ? (
          <FeatureEmptyState
            icon={<Target className="h-6 w-6" />}
            title="Metas ainda não estão disponíveis"
            description="A estrutura para nome, valores, progresso, prazo e status está pronta para receber dados reais. Nenhuma meta é exibida até existir cadastro e armazenamento próprios."
          />
        ) : goals.length === 0 ? (
          <FeatureEmptyState
            icon={<Target className="h-6 w-6" />}
            title="Nenhuma meta cadastrada"
            description="Quando o cadastro estiver disponível, suas metas aparecerão aqui com valores, progresso, prazo e status."
          />
        ) : (
          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            {goals.map((goal) => <GoalCard key={goal.id} goal={goal} />)}
          </div>
        )}
      </main>
    </>
  );
}
