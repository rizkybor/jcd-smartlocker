import * as React from "react";

/** Every Lucide glyph vendored into assets/icons/. */
export declare const ICON_NAMES: string[];
/** Resolves window.SL_ICON_BASE, else "assets/icons". */
export declare function iconBase(): string;

/**
 * Monochrome Lucide icon rendered from assets/icons/<name>.svg; inherits currentColor.
 * @startingPoint section="Foundations" subtitle="Lucide icon set, vendored" viewport="700x420"
 */
export interface IconProps {
  /** File stem in assets/icons, e.g. "door-open". See ICON_NAMES. */
  name: string;
  /** Px. Dashboard 16/20/24; kiosk never below 48. Default 20. */
  size?: number;
  /** Overrides currentColor — only for status colours. */
  color?: string;
  /** Accessible name. Omit for decorative icons that sit next to a label. */
  label?: string;
  /** Override the asset directory when the page is nested. Default window.SL_ICON_BASE || "assets/icons". */
  basePath?: string;
  style?: React.CSSProperties;
}
export function Icon(props: IconProps): JSX.Element;
