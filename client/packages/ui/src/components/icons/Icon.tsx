import type { CSSProperties } from 'react';

/**
 * Lucide SVG di-mask supaya monokrom & inherit currentColor, tanpa build
 * step/CDN (docs/design_reference/components/icons/Icon.jsx, SMB-002).
 * File SVG fisik di-serve dari `/icons` public path tiap app.
 */
export const ICON_NAMES = [
  'activity', 'arrow-left', 'arrow-right', 'banknote', 'bell', 'building-2', 'calendar',
  'chart-column', 'check', 'chevron-down', 'chevron-left', 'chevron-right', 'chevron-up',
  'circle-alert', 'circle-check', 'circle-x', 'clock', 'cpu', 'credit-card', 'delete',
  'door-closed', 'door-open', 'download', 'dumbbell', 'ellipsis-vertical', 'eye', 'grid-2x2',
  'hand', 'house', 'info', 'key-round', 'layout-grid', 'list', 'lock', 'lock-open', 'log-out',
  'map-pin', 'monitor', 'nfc', 'package', 'package-open', 'panel-left', 'plus', 'power',
  'qr-code', 'receipt', 'refresh-cw', 'scan-line', 'search', 'settings', 'shield-check',
  'shopping-bag', 'smartphone', 'table', 'timer', 'trending-down', 'trending-up',
  'triangle-alert', 'user', 'users', 'wallet', 'wifi-off', 'wrench', 'x', 'zap',
] as const;

export type IconName = (typeof ICON_NAMES)[number];

export type IconProps = {
  name: IconName;
  size?: number;
  color?: string;
  label?: string;
  basePath?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 20, color, label, basePath = '/icons', style }: IconProps) {
  const url = `${basePath.replace(/\/$/, '')}/${name}.svg`;
  return (
    <span
      role={label ? 'img' : 'presentation'}
      aria-label={label}
      aria-hidden={label ? undefined : 'true'}
      style={{
        display: 'inline-block',
        flex: '0 0 auto',
        width: size,
        height: size,
        backgroundColor: color || 'currentColor',
        WebkitMask: `url(${url}) center/contain no-repeat`,
        mask: `url(${url}) center/contain no-repeat`,
        verticalAlign: 'middle',
        ...style,
      }}
    />
  );
}
