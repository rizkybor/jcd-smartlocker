import * as React from "react";

/**
 * Animated compartment door — swings open on `open`, using sl-door-open (700ms, latch overshoot).
 * @startingPoint section="Motion" subtitle="Door open transition" viewport="700x400"
 */
export interface DoorTransitionProps {
  /** Toggling this plays the open/close animation. */
  open?: boolean;
  /** Compartment label printed on the door. */
  id?: string;
  /** Word revealed inside the cavity. Default "AMBIL". */
  contentLabel?: string;
  /** Caption under the door, e.g. "Pintu terbuka - silakan ambil barang". */
  label?: string;
  /** Door edge in px. Default 260. */
  size?: number;
  style?: React.CSSProperties;
}
export function DoorTransition(props: DoorTransitionProps): JSX.Element;
