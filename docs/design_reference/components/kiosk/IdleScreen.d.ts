import * as React from "react";

/**
 * Attract / screensaver state shown when the kiosk is untouched.
 * @startingPoint section="Kiosk" subtitle="Idle attract screen" viewport="700x520"
 */
export interface IdleScreenProps {
  headline?: string;
  subline?: string;
  /** Path to a logo asset, usually assets/logo-mono-light.png. */
  logoSrc?: string;
  logoHeight?: number;
  /** Up to 3 glass stat tiles, e.g. availability counts. */
  stats?: Array<{ value: string; label: string }>;
  footnote?: string;
  onWake?: () => void;
  style?: React.CSSProperties;
}
export function IdleScreen(props: IdleScreenProps): JSX.Element;
