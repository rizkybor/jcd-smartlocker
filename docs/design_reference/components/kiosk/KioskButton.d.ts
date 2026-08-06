import * as React from "react";

/**
 * Full-size touch button for the locker kiosk. Never below 88px tall.
 * @startingPoint section="Kiosk" subtitle="Touch buttons sized for standing use" viewport="700x260"
 */
export interface KioskButtonProps {
  children?: React.ReactNode;
  /** Visual role. Use exactly one `primary` per screen. */
  tone?: "primary" | "secondary" | "neutral" | "danger" | "success";
  /** md=88px (min touch), lg=112px (default), xl=128px (screen CTA). */
  size?: "md" | "lg" | "xl";
  fullWidth?: boolean;
  disabled?: boolean;
  /** Set false to remove the 8px solid lift shadow. */
  lifted?: boolean;
  icon?: React.ReactNode;
  ariaLabel?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function KioskButton(props: KioskButtonProps): JSX.Element;
