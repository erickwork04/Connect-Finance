"use client";

import { toast } from "sonner";
import type { CouponFailureCode } from "../_lib/coupon-eligibility";

const couponMessages = {
  invalid: ["Cupom inválido", "Verifique o código informado e tente novamente."],
  expired: ["Cupom expirado", "Este cupom não está mais disponível."],
  exhausted: ["Cupom indisponível", "O limite de utilizações deste cupom já foi atingido."],
  used: ["Cupom já utilizado", "Este cupom só pode ser usado uma vez por usuário."],
  inactive: ["Cupom inativo", "Este cupom não está disponível no momento."],
  unavailable: ["Não foi possível aplicar o cupom", "Tente novamente em alguns instantes."],
} as const;

export function showCouponError(code: CouponFailureCode) {
  const [title, description] = couponMessages[code];
  toast.error(title, { description });
}
