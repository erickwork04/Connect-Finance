import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { resolveYearMonth } from "@/app/_lib/month-range";

/** Keep old links working while Transactions is the single management area. */
export default async function CommitmentsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const params = await searchParams;
  const month = resolveYearMonth(params.month);
  redirect(`/transactions?month=${month}&view=commitments`);
}
