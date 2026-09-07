"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";

const Navbar = () => {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasClerkKey = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

  const navLinks = [
    { href: "/", label: "Dashboard" },
    { href: "/transactions", label: "Transações" },
    { href: "/subscription", label: "Assinatura" },
  ];

  return (
    <nav className="relative border-b border-solid bg-background">
      <div className="flex items-center justify-between px-4 sm:px-8 py-3 sm:py-4">
        {/* ESQUERDA: Logo e links desktop */}
        <div className="flex items-center gap-6 lg:gap-10">
          <Link href="/" className="shrink-0">
            <Image
              src="/logo.svg"
              width={173}
              height={39}
              alt="Finance AI"
              className="h-7 w-auto sm:h-9"
              priority
            />
          </Link>

          {/* Links Desktop */}
          <div className="hidden md:flex items-center gap-6 lg:gap-10">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={
                  pathname === link.href
                    ? "font-bold text-primary"
                    : "text-muted-foreground transition-colors hover:text-foreground"
                }
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* DIREITA: Avatar e menu hamburguer mobile */}
        <div className="flex items-center gap-2 sm:gap-4">
          {hasClerkKey ? (
            <UserButton showName />
          ) : (
            <div className="flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs sm:text-sm">
              <div className="flex h-6 w-6 sm:h-7 sm:w-7 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">
                FA
              </div>
              <span className="hidden sm:inline font-medium text-foreground">
                Demo User
              </span>
            </div>
          )}

          {/* Botão Hambúrguer Mobile */}
          <button
            type="button"
            id="mobile-nav-toggle"
            aria-label={mobileMenuOpen ? "Fechar menu" : "Abrir menu"}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex h-11 w-11 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Menu Mobile Dropdown */}
      {mobileMenuOpen && (
        <div className="border-t border-border bg-background px-4 py-3 md:hidden space-y-1 animate-in fade-in slide-in-from-top-2 duration-150">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex h-11 items-center rounded-md px-3 text-sm font-medium transition-colors ${
                  isActive
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
