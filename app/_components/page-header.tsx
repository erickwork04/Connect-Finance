import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  actions?: ReactNode;
}

export default function PageHeader({ title, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row w-full sm:items-center sm:justify-between gap-3">
      <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
      {actions && <div className="flex items-center gap-2 sm:gap-3 flex-wrap">{actions}</div>}
    </div>
  );
}
