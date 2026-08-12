import { useTranslation } from 'react-i18next';
import { StatusScreen } from '@smartbox/ui';

export function BayarGagalScreen({ onUlangi, onBatal }: { onUlangi: () => void; onBatal: () => void }) {
  const { t } = useTranslation();
  return (
    <StatusScreen
      icon="circle-alert"
      iconLabel={t('bayarGagal.iconLabel')}
      tone="danger"
      title={t('bayarGagal.judul')}
      detail={t('bayarGagal.detail')}
      primaryLabel={t('bayarGagal.cobaLagi')}
      onPrimary={onUlangi}
      secondaryLabel={t('common.batalkan')}
      onSecondary={onBatal}
    />
  );
}
