import { YEAR_MONTH_PATTERN } from "@/app/_lib/month-range";
import { z } from "zod";

export const generateAiReportSchema = z.object({
  month: z.string().regex(YEAR_MONTH_PATTERN),
});

export type GenerateAiReportSchema = z.infer<typeof generateAiReportSchema>;
