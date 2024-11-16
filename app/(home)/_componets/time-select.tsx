"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/_components/ui/select";
import { useRouter, useSearchParams } from "next/navigation";

const MONPH_OPTIONS = [
  { value: "01", Label: "January" },
  { value: "02", Label: "February" },
  { value: "03", Label: "March" },
  { value: "04", Label: "April" },
  { value: "05", Label: "May" },
  { value: "06", Label: "June" },
  { value: "07", Label: "July" },
  { value: "08", Label: "August" },
  { value: "09", Label: "September" },
  { value: "10", Label: "October" },
  { value: "11", Label: "November" },
  { value: "12", Label: "December" },
];

const TimeSelect = () => {
  const { push } = useRouter();
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  const handleMonthChange = (month: string) => {
    push(`/?month=${month}`);
  };
  return (
    <Select
      onValueChange={(value) => handleMonthChange(value)}
      defaultValue={month ?? ""}
    >
      <SelectTrigger className="w-[150px] rounded-full">
        <SelectValue placeholder="Mês" />
      </SelectTrigger>
      <SelectContent>
        {MONPH_OPTIONS.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.Label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default TimeSelect;
