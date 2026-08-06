import * as React from "react";

export interface DataTableColumn {
  key: string;
  header: React.ReactNode;
  align?: "left" | "right" | "center";
  width?: string;
  /** Render with Lexend tabular numerals — money, counts, durations. */
  numeric?: boolean;
  wrap?: boolean;
  render?: (row: any) => React.ReactNode;
}

/**
 * Data grid for transactions, units and compartments.
 * @startingPoint section="Dashboard" subtitle="Transaction / unit data grid" viewport="700x320"
 */
export interface DataTableProps {
  columns: DataTableColumn[];
  rows: any[];
  density?: "default" | "compact";
  striped?: boolean;
  onRowClick?: (row: any, index: number) => void;
  footer?: React.ReactNode;
  style?: React.CSSProperties;
}
export function DataTable(props: DataTableProps): JSX.Element;
