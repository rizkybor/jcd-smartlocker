import * as React from "react";

/**
 * On-screen numeric keypad with a PIN echo row, for kiosk PIN / phone entry.
 * @startingPoint section="Kiosk" subtitle="PIN entry with echo cells" viewport="700x620"
 */
export interface NumpadProps {
  /** Current entered digits. */
  value?: string;
  onChange?: (next: string) => void;
  /** Number of echo cells. Default 6. */
  length?: number;
  /** Render entered digits as dots instead of numerals. */
  mask?: boolean;
  label?: string;
  style?: React.CSSProperties;
}
export function Numpad(props: NumpadProps): JSX.Element;
