"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Menu, X } from "lucide-react";
import { getNavHref, isNavActive, NAV_ITEMS } from "../_lib/navigation";
import MonthSelector from "./month-selector";

const Navbar = () => {
  const pathname = usePathname();
  const month = useSearchParams().get("month");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="relative z-30 border-b border-border bg-background">
      <div className="mx-auto flex max-w-[1680px] flex-wrap items-center justify-between gap-x-4 gap-y-2 px-4 py-3 sm:px-6 xl:px-8">
        {/* ESQUERDA: Logo e links desktop */}
        <div className="flex min-w-0 items-center gap-4 xl:gap-7">
          <Link href={getNavHref("/dashboard", month)} className="shrink-0">
            <div className="flex h-12 w-[125px] items-center overflow-hidden sm:w-[170px] lg:w-[150px] xl:w-[185px]">
              <Image
                src="/logo.png"
                width={500}
                height={150}
                alt="Connect Finance"
                priority
                className="h-auto w-full object-contain"
              />
            </div>
          </Link>

          {/* Links Desktop */}
          <div className="hidden lg:flex items-center gap-3 xl:gap-5">
            {NAV_ITEMS.map((link) => (
              <Link
                key={link.href}
                href={getNavHref(link.href, month)}
                aria-current={isNavActive(pathname, link.href) ? "page" : undefined}
                className={
                  isNavActive(pathname, link.href)
                    ? "whitespace-nowrap font-bold text-primary"
                    : "whitespace-nowrap text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* DIREITA: Avatar e menu hamburguer mobile */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="hidden w-[205px] sm:block"><MonthSelector /></div>
          <div className="[&_.cl-userButtonOuterIdentifier]:hidden xl:[&_.cl-userButtonOuterIdentifier]:block">
            <UserButton showName />
          </div>

          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            id="mobile-nav-toggle"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground lg:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>
      <div className="px-4 pb-3 sm:hidden"><MonthSelector /></div>

      {/* Menu Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 lg:hidden space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {NAV_ITEMS.map((link) => {
            const isActive = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={getNavHref(link.href, month)}
                aria-current={isActive ? "page" : undefined}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors ${isActive
                  ? "bg-primary/10 text-primary font-bold"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
              >
                {link.label}
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
