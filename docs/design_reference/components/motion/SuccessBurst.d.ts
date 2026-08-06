import * as React from "react";

/**
 * Payment / action success confirmation: ring-out, pop, drawn check, then staggered copy.
 * @startingPoint section="Motion" subtitle="Payment success confirmation" viewport="700x400"
 */
export interface SuccessBurstProps {
  title?: React.ReactNode;
  detail?: React.ReactNode;
  /** green = default success, brand = navy (non-transactional confirmations). */
  tone?: "success" | "brand";
  /** Badge diameter in px. Default 180 (kiosk); use 96 in the dashboard. */
  size?: number;
  style?: React.CSSProperties;
}
export function SuccessBurst(props: SuccessBurstProps): JSX.Element;
