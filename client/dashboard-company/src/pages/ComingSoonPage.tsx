import { Panel } from '@smartbox/ui';

/** Placeholder untuk halaman Epic 6 yang belum dikerjakan di tahap ini. */
export function ComingSoonPage({ title }: { title: string }) {
  return (
    <div>
      <h1 style={{ fontFamily: 'var(--sl-font-display)', fontSize: 'var(--sl-fs-24)', fontWeight: 'var(--sl-fw-bold)', color: 'var(--sl-text-strong)', marginBottom: 'var(--sl-space-6)' }}>
        {title}
      </h1>
      <Panel>
        <div style={{ color: 'var(--sl-text-muted)' }}>Halaman ini belum dikerjakan — menyusul di tahap berikutnya.</div>
      </Panel>
    </div>
  );
}
