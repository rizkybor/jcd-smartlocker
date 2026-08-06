import * as React from "react";

export interface SidebarItem {
  id?: string;
  label?: string;
  /** Glyph or icon element rendered in a 20px slot. */
  icon?: React.ReactNode;
  badge?: React.ReactNode;
  /** Set instead of label/id to render an uppercase group heading. */
  section?: string;
}

/**
 * Persistent navy navigation rail for the admin dashboard.
 * @startingPoint section="Dashboard" subtitle="Navy navigation rail" viewport="700x520"
 */
export interface SidebarProps {
  items: SidebarItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  collapsed?: boolean;
  title?: string;
  logoSrc?: string;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export function Sidebar(props: SidebarProps): JSX.Element;
