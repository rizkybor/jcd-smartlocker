import * as React from "react";

/** Card / surface container carrying the dashboard elevation ladder (0-5). */
export interface PanelProps {
  title?: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  /** 0 flat, 1 default card, 2 raised, 3 popover, 4 modal, 5 command palette. */
  elevation?: 0 | 1 | 2 | 3 | 4 | 5;
  tone?: "card" | "sunken";
  /** Remove body padding — for tables that reach the panel edge. */
  flush?: boolean;
  padding?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Panel(props: PanelProps): JSX.Element;
