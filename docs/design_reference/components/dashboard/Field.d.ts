import * as React from "react";

/**
 * Labelled form control (input, textarea or select) for dashboard forms.
 * @startingPoint section="Dashboard" subtitle="Form fields with hint and error" viewport="700x220"
 */
export interface FieldProps {
  label?: React.ReactNode;
  value?: string;
  onChange?: (e: React.ChangeEvent<any>) => void;
  placeholder?: string;
  type?: string;
  /** Provide options to render a <select>. */
  options?: Array<{ value: string; label: string }>;
  multiline?: boolean;
  rows?: number;
  hint?: string;
  /** Presence switches the field to the error state and replaces the hint. */
  error?: string;
  required?: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
}
export function Field(props: FieldProps): JSX.Element;
