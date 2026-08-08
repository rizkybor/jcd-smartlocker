import { useState, type CSSProperties, type ReactNode } from 'react';
import { Icon, type IconName } from '../icons/Icon';

export type SidebarItem =
  | { section: string }
  | { id: string; label: string; icon: IconName; badge?: ReactNode };

export type SidebarProps = {
  items: SidebarItem[];
  activeId?: string;
  onSelect?: (id: string) => void;
  collapsed?: boolean;
  logoSrc?: string;
  title?: string;
  footer?: ReactNode;
  style?: CSSProperties;
};

/** Navigasi sisi dashboard (docs/design_reference/components/dashboard/Sidebar.jsx). */
export function Sidebar({ items, activeId, onSelect, collapsed = false, logoSrc, title = 'Admin Console', footer, style }: SidebarProps) {
  return (
    <nav
      style={{
        width: collapsed ? 'var(--sl-sidebar-w-collapsed)' : 'var(--sl-sidebar-w)',
        flex: '0 0 auto',
        height: '100%',
        minHeight: 480,
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--sl-surface-inverse)',
        color: 'var(--sl-text-on-dark)',
        fontFamily: 'var(--sl-font-body)',
        transition: 'width var(--sl-dur-base) var(--sl-ease-standard)',
        ...style,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 'var(--sl-space-5) var(--sl-space-5)', borderBottom: '1px solid rgba(255,255,255,.1)', minHeight: 72 }}>
        {logoSrc ? <img src={logoSrc} alt="Sewa Smart Locker" style={{ height: 28, flex: '0 0 auto' }} /> : null}
        {!collapsed ? (
          <span style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-14)', fontWeight: 'var(--sl-fw-semibold)', color: '#fff', whiteSpace: 'nowrap' }}>
            {title}
          </span>
        ) : null}
      </div>
      <div style={{ flex: 1, padding: 'var(--sl-space-4) var(--sl-space-3)', display: 'flex', flexDirection: 'column', gap: 2, overflowY: 'auto' }}>
        {items.map((it, i) =>
          'section' in it ? (
            collapsed ? (
              <div key={i} style={{ height: 1, background: 'rgba(255,255,255,.1)', margin: 'var(--sl-space-3) var(--sl-space-2)' }} />
            ) : (
              <div
                key={i}
                style={{
                  padding: 'var(--sl-space-4) var(--sl-space-3) var(--sl-space-2)',
                  fontSize: 'var(--sl-fs-11)',
                  fontWeight: 'var(--sl-fw-bold)',
                  letterSpacing: 'var(--sl-ls-caps)',
                  textTransform: 'uppercase',
                  color: 'rgba(234,240,255,.45)',
                }}
              >
                {it.section}
              </div>
            )
          ) : (
            <SidebarButton key={i} item={it} active={activeId === it.id} collapsed={collapsed} onSelect={onSelect} />
          ),
        )}
      </div>
      {footer ? (
        <div style={{ padding: 'var(--sl-space-4) var(--sl-space-5)', borderTop: '1px solid rgba(255,255,255,.1)', fontSize: 'var(--sl-fs-12)', color: 'rgba(234,240,255,.6)' }}>
          {footer}
        </div>
      ) : null}
    </nav>
  );
}

function SidebarButton({
  item,
  active,
  collapsed,
  onSelect,
}: {
  item: Extract<SidebarItem, { id: string }>;
  active: boolean;
  collapsed: boolean;
  onSelect?: (id: string) => void;
}) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.id)}
      title={item.label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        width: '100%',
        height: 44,
        padding: '0 var(--sl-space-3)',
        appearance: 'none',
        textAlign: 'left',
        background: active ? 'var(--sl-secondary)' : hover ? 'rgba(255,255,255,.08)' : 'transparent',
        color: active ? '#fff' : 'rgba(234,240,255,.78)',
        border: 'none',
        borderRadius: 'var(--sl-radius-sm)',
        cursor: 'pointer',
        font: `var(--sl-fw-${active ? 'semibold' : 'medium'}) var(--sl-fs-14)/1 var(--sl-font-body)`,
        transition: 'background var(--sl-dur-fast) var(--sl-ease-standard)',
      }}
    >
      <span aria-hidden="true" style={{ width: 20, textAlign: 'center', flex: '0 0 auto', display: 'inline-flex', justifyContent: 'center' }}>
        <Icon name={item.icon} size={16} />
      </span>
      {!collapsed ? <span style={{ flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span> : null}
      {!collapsed && item.badge ? (
        <span style={{ padding: '2px 8px', borderRadius: 'var(--sl-radius-pill)', background: 'var(--sl-status-offline)', color: '#fff', fontSize: 'var(--sl-fs-11)', fontWeight: 'var(--sl-fw-bold)' }}>
          {item.badge}
        </span>
      ) : null}
    </button>
  );
}
