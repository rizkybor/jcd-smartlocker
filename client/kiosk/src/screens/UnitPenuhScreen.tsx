import { useTranslation } from 'react-i18next';
import { StatusScreen } from '@smartbox/ui';

export function UnitPenuhScreen({ onKembali }: { onKembali: () => void }) {
  const { t } = useTranslation();
  return (
    <StatusScreen
      icon="package-open"
      iconLabel={t('unitPenuh.judul')}
      tone="neutral"
      title={t('unitPenuh.judul')}
      detail={t('unitPenuh.detail')}
      primaryLabel={t('common.kembali')}
      onPrimary={onKembali}
      primaryTone="neutral"
    />
  );
}
