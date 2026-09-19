import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Navbar from "@/app/_components/navbar";
import { getCommitmentsForMonth } from "@/app/_actions/dashboard-v2";
import { resolveYearMonth } from "@/app/_lib/month-range";
import { getNavHref } from "@/app/_lib/navigation";
import CommitmentsManager from "../_componets/commitments-manager";

export default async function CommitmentsPage({ searchParams }: { searchParams: Promise<{ month?: string | string[] }> }) {
  const params = await searchParams;
  const { userId } = await auth();
  if (!userId) redirect("/login");
  const month = resolveYearMonth(params.month);
  if (params.month !== month) redirect(`/dashboard/commitments?month=${month}`);
  const data = await getCommitmentsForMonth(month);

  return <><Navbar /><main className="mx-auto w-full max-w-4xl min-w-0 space-y-5 p-4 sm:p-6">
    <div><Link href={getNavHref("/dashboard", month)} className="text-sm text-primary hover:underline">Voltar ao Dashboard</Link><h1 className="mt-3 text-2xl font-semibold">Compromissos · {month.slice(5)}/{month.slice(0, 4)}</h1></div>
    <CommitmentsManager key={month} month={month} initialData={data} />
  </main></>;
}
