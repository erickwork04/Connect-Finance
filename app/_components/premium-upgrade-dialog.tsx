"use client";

import Link from "next/link";
import { LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/app/_components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/app/_components/ui/dialog";

export default function PremiumUpgradeDialog({
  title,
  description,
  open,
  onOpenChange,
}: {
  title: string;
  description: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  return <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="w-[calc(100%-24px)] max-w-md">
      <DialogHeader>
        <div className="mb-2 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><LockKeyhole aria-hidden="true" className="h-5 w-5" /></div>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button asChild className="w-full sm:w-auto"><Link href="/subscription"><Sparkles aria-hidden="true" className="mr-2 h-4 w-4" />Conhecer o Premium</Link></Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>;
}
