import * as React from "react";

/**
 * Summary metric tile for the admin overview (pendapatan, okupansi, unit online).
 * @startingPoint section="Dashboard" subtitle="Summary metric tiles" viewport="700x180"
 */
export interface StatCardProps {
  label: string;
  /** Preformatted value, e.g. "Rp 4,82jt" or "86%". */
  value: React.ReactNode;
  unit?: string;
  /** Change figure, e.g. "12,4%". */
  delta?: string;
  deltaDirection?: "up" | "down" | "flat";
  caption?: string;
  /** Colour of the 3px top rule. */
  accent?: "primary" | "accent" | "available" | "occupied" | "offline";
  badge?: React.ReactNode;
  style?: React.CSSProperties;
}
export function StatCard(props: StatCardProps): JSX.Element;
