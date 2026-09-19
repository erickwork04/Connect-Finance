import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

import GoalsScreen from "./_components/goals-screen";

export const dynamic = "force-dynamic";

export default async function GoalsPage() {
  const { userId } = await auth();
  if (!userId) redirect("/login");

  // O domínio de metas ainda não possui persistência; null indica fonte indisponível.
  return <GoalsScreen goals={null} />;
}
