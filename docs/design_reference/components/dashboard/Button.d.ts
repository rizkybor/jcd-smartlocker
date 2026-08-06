import * as React from "react";

/** Standard 40px control for the admin dashboard. Never used on the kiosk. */
export interface ButtonProps {
  children?: React.ReactNode;
  tone?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
}
export function Button(props: ButtonProps): JSX.Element;
