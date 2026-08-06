import * as React from "react";

/**
 * Horizontal step indicator for the kiosk rental flow (pilih, bayar, ambil kode).
 * @startingPoint section="Kiosk" subtitle="Step-by-step flow indicator" viewport="700x180"
 */
export interface StepProgressProps {
  steps: string[];
  /** Zero-based index of the active step. */
  current?: number;
  /** 40px dots + 14px labels, for dashboard or narrow use. */
  compact?: boolean;
  style?: React.CSSProperties;
}
export function StepProgress(props: StepProgressProps): JSX.Element;
