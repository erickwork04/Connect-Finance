"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ArrowLeftRight,
  Building2,
  CalendarClock,
  CreditCard,
  House,
  Menu,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getNavHref, isNavActive, NAV_ITEMS } from "../_lib/navigation";
import MonthSelector from "./month-selector";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./ui/dialog";

const NAV_ICONS: Record<(typeof NAV_ITEMS)[number]["href"], LucideIcon> = {
  "/dashboard": House,
  "/transactions": ArrowLeftRight,
  "/banks": Building2,
  "/cards": CreditCard,
  "/installments": CalendarClock,
  "/goals": Target,
  "/subscription": Sparkles,
};

function NavigationLinks({
  pathname,
  month,
  onNavigate,
}: {
  pathname: string;
  month: string | null;
  onNavigate?: () => void;
}) {
  return (
    <div className="space-y-1">
      {NAV_ITEMS.map((item, index) => {
        const Icon = NAV_ICONS[item.href];
        const active = isNavActive(pathname, item.href);
        const showSettingsLabel = item.section === "settings" &&
          NAV_ITEMS[index - 1]?.section !== "settings";

        return (
          <div key={item.href}>
            {showSettingsLabel ? (
              <p className="mb-2 mt-7 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500">
                Configurações
              </p>
            ) : null}
            <Link
              href={getNavHref(item.href, month)}
              aria-current={active ? "page" : undefined}
              onClick={onNavigate}
              className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${active
                ? "bg-[#1c2b1c] text-white shadow-sm"
                : "text-slate-400 hover:bg-[#18201b] hover:text-slate-100"
                }`}
            >
              <Icon
                aria-hidden="true"
                className={`h-[18px] w-[18px] shrink-0 ${active ? "text-primary" : "text-slate-500 group-hover:text-slate-300"}`}
              />
              <span>{item.label}</span>
            </Link>
          </div>
        );
      })}
    </div>
  );
}

function Brand({ month }: { month: string | null }) {
  return (
    <Link href={getNavHref("/dashboard", month)} className="flex w-fit flex-col items-start rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary">
      <Image
        src="/logo.png"
        alt="Connect Finance"
        width={2172}
        height={724}
        priority
        className="h-auto w-[180px] scale-125 sm:w-[180px] lg:w-[220px]"
      />
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const month = useSearchParams().get("month");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <>
      <aside className="connect-sidebar fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-white/10 bg-[#0e1319] px-4 pb-6 pt-7 lg:flex lg:flex-col">
        <div className="px-2">
          <Brand month={month} />
        </div>
        <nav aria-label="Navegação principal" className="mt-8 flex-1 overflow-y-auto">
          <NavigationLinks pathname={pathname} month={month} />
        </nav>
      </aside>

      <header className="fixed inset-x-0 top-0 z-30 h-28 border-b border-white/10 bg-[#171c23] px-4 sm:px-6 md:h-16 lg:left-64 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label="Abrir menu de navegação"
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-navigation"
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-700 text-slate-300 transition hover:bg-[#1c211e] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary lg:hidden"
            >
              <Menu aria-hidden="true" className="h-5 w-5" />
            </button>
            <div className="lg:hidden"><Brand month={month} /></div>
            <div className="hidden w-[220px] md:block lg:w-[240px]">
              <MonthSelector />
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <UserButton />
          </div>
        </div>
        <div className="pb-3 md:hidden">
          <MonthSelector />
        </div>
      </header>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent
          id="mobile-navigation"
          className="!left-0 !top-0 !h-dvh !w-[min(84vw,18rem)] !max-w-none !translate-x-0 !translate-y-0 !rounded-none border-y-0 border-l-0 border-r border-white/10 bg-[#0e1319] p-5 pt-7"
        >
          <DialogTitle className="sr-only">Menu de navegação</DialogTitle>
          <div className="pr-10"><Brand month={month} /></div>
          <nav aria-label="Navegação principal" className="mt-5 overflow-y-auto">
            <NavigationLinks
              pathname={pathname}
              month={month}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </nav>
          <div className="mt-auto border-t border-slate-800 pt-4">
            <button
              type="button"
              aria-label="Fechar menu de navegação"
              onClick={() => setMobileMenuOpen(false)}
              className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-slate-400 hover:bg-[#18201b] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <X aria-hidden="true" className="h-4 w-4" />
              Fechar menu
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
