import * as React from "react";

/**
 * Full-screen QR payment / access-code panel for the kiosk.
 * @startingPoint section="Kiosk" subtitle="Full-screen QR payment panel" viewport="700x760"
 */
export interface QRScreenProps {
  title?: string;
  subtitle?: string;
  /** Image URL of the generated QR. Renders a labelled placeholder when omitted. */
  qrSrc?: string;
  /** Rendered QR edge in px. Never below 320 on an 8" panel. Default 360. */
  qrSize?: number;
  /** Preformatted rupiah string, e.g. "Rp 15.000". */
  amount?: string;
  /** Remaining validity in seconds; renders a yellow countdown pill. */
  secondsLeft?: number;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export function QRScreen(props: QRScreenProps): JSX.Element;
