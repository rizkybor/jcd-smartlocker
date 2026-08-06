import * as React from "react";

/**
 * A single locker compartment tile on the kiosk selection grid.
 * @startingPoint section="Kiosk" subtitle="Compartment status tiles" viewport="700x300"
 */
export interface CompartmentCardProps {
  /** Compartment label, e.g. "A-04". */
  id: string;
  state?: "available" | "occupied" | "offline";
  /** Overrides state styling with the selected (navy) treatment. */
  selected?: boolean;
  size?: "s" | "m" | "l" | "xl";
  /** Secondary line, e.g. "Rp 15.000 / 3 jam". */
  meta?: string;
  /** Override the Indonesian default status word. */
  statusLabel?: string;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function CompartmentCard(props: CompartmentCardProps): JSX.Element;
