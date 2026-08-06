import * as React from "react";

/**
 * Status pill for units, compartments and transactions in the dashboard.
 * @startingPoint section="Dashboard" subtitle="Status pills: online, terisi, offline" viewport="700x150"
 */
export interface StatusBadgeProps {
  status: "online" | "available" | "occupied" | "maintenance" | "offline" | "idle";
  /** Filled instead of tinted — for dark table rows or map pins. */
  solid?: boolean;
  size?: "md" | "lg";
  /** Halo around the dot, for live/realtime rows. */
  pulse?: boolean;
  /** Overrides the default Indonesian label. */
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function StatusBadge(props: StatusBadgeProps): JSX.Element;
