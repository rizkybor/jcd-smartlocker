import * as React from "react";

/**
 * Live realtime indicator — a status dot with a repeating halo, for "data is streaming" contexts.
 * @startingPoint section="Motion" subtitle="Realtime status indicator" viewport="700x150"
 */
export interface StatusPulseProps {
  status?: "available" | "occupied" | "offline";
  /** Set false to freeze the halo (stale / paused data). */
  live?: boolean;
  size?: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function StatusPulse(props: StatusPulseProps): JSX.Element;
