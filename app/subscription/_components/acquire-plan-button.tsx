import { Button } from "@/app/_components/ui/button";
import CaktoCheckout from "./cakto-checkout";

export default function AcquirePlanButton({ hasPremiumPlan }: { hasPremiumPlan: boolean }) {
  if (hasPremiumPlan) {
    return (
      <div className="space-y-2">
        <Button disabled type="button" title="O gerenciamento da assinatura ainda não está disponível" className="h-11 w-full rounded-full">Gerenciar assinatura (em breve)</Button>
        <p className="text-xs leading-5 text-muted-foreground">O gerenciamento online ainda não está disponível nesta aplicação.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <CaktoCheckout />
      <p className="text-xs leading-5 text-muted-foreground">
        O pagamento e os descontos são processados pela Cakto. Digite o cupom no checkout, se tiver um.
      </p>
    </div>
  );
}
