import { useTranslation } from 'react-i18next';
import { StatusScreen } from '@smartbox/ui';

export function BayarDendaGagalScreen({ onUlangi, onBatal }: { onUlangi: () => void; onBatal: () => void }) {
  const { t } = useTranslation();
  return (
    <StatusScreen
      icon="circle-alert"
      iconLabel={t('bayarDendaGagal.iconLabel')}
      tone="danger"
      title={t('bayarDendaGagal.judul')}
      detail={t('bayarDendaGagal.detail')}
      primaryLabel={t('bayarGagal.cobaLagi')}
      onPrimary={onUlangi}
      secondaryLabel={t('common.batalkan')}
      onSecondary={onBatal}
    />
  );
}
