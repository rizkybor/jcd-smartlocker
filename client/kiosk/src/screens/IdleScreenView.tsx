import { IdleScreen } from '@smartbox/ui';

export function IdleScreenView({ onWake }: { onWake: () => void }) {
  return (
    <IdleScreen
      headline="Sentuh untuk Sewa Loker"
      subline="Tanpa aplikasi. Tanpa kunci. Bayar dengan QRIS."
      onWake={onWake}
    />
  );
}
