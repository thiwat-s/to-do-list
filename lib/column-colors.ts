export const COLUMN_COLOR_OPTIONS = [
  {
    value: "slate",
    label: "Slate",
    badge: "bg-slate-200 text-slate-700",
    ring: "border-slate-300",
    soft: "bg-slate-50",
  },
  {
    value: "blue",
    label: "Blue",
    badge: "bg-blue-100 text-blue-700",
    ring: "border-blue-300",
    soft: "bg-blue-50",
  },
  {
    value: "violet",
    label: "Violet",
    badge: "bg-violet-100 text-violet-700",
    ring: "border-violet-300",
    soft: "bg-violet-50",
  },
  {
    value: "amber",
    label: "Amber",
    badge: "bg-amber-100 text-amber-700",
    ring: "border-amber-300",
    soft: "bg-amber-50",
  },
  {
    value: "emerald",
    label: "Emerald",
    badge: "bg-emerald-100 text-emerald-700",
    ring: "border-emerald-300",
    soft: "bg-emerald-50",
  },
  {
    value: "rose",
    label: "Rose",
    badge: "bg-rose-100 text-rose-700",
    ring: "border-rose-300",
    soft: "bg-rose-50",
  },
  {
    value: "teal",
    label: "Teal",
    badge: "bg-teal-100 text-teal-700",
    ring: "border-teal-300",
    soft: "bg-teal-50",
  },
] as const;

export type ColumnColor = (typeof COLUMN_COLOR_OPTIONS)[number]["value"];

export function isColumnColor(value: unknown): value is ColumnColor {
  return COLUMN_COLOR_OPTIONS.some((option) => option.value === value);
}
