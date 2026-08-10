import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field, Button } from '@smartbox/ui';
import { companyApi, type Lokasi, type MitraFull, type LaporanFilter } from '../../api/client';

export function LaporanFilterBar({
  filter,
  onChange,
  onExport,
  exporting,
}: {
  filter: LaporanFilter;
  onChange: (filter: LaporanFilter) => void;
  onExport: () => void;
  exporting: boolean;
}) {
  const { t } = useTranslation();
  const [lokasiList, setLokasiList] = useState<Lokasi[]>([]);
  const [mitraList, setMitraList] = useState<MitraFull[]>([]);

  useEffect(() => {
    companyApi.lokasiList().then((res) => setLokasiList(res.data)).catch(() => {});
    companyApi.mitra.list(1, 100).then((res) => setMitraList(res.data)).catch(() => {});
  }, []);

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--sl-space-3)', alignItems: 'flex-end', marginBottom: 'var(--sl-space-5)' }}>
      <Field
        label={t('laporanFilterBar.dariTanggal')}
        type="date"
        value={filter.tanggalMulai ?? ''}
        onChange={(e) => onChange({ ...filter, tanggalMulai: e.target.value || undefined })}
        style={{ width: 170 }}
      />
      <Field
        label={t('laporanFilterBar.sampaiTanggal')}
        type="date"
        value={filter.tanggalSelesai ?? ''}
        onChange={(e) => onChange({ ...filter, tanggalSelesai: e.target.value || undefined })}
        style={{ width: 170 }}
      />
      <Field
        label={t('laporanFilterBar.lokasi')}
        options={[{ value: '', label: t('laporanFilterBar.semuaLokasi') }, ...lokasiList.map((l) => ({ value: l.id, label: l.nama }))]}
        value={filter.lokasiId ?? ''}
        onChange={(e) => onChange({ ...filter, lokasiId: e.target.value || undefined })}
        style={{ width: 200 }}
      />
      <Field
        label={t('laporanFilterBar.mitra')}
        options={[{ value: '', label: t('laporanFilterBar.semuaMitra') }, ...mitraList.map((m) => ({ value: m.id, label: m.nama }))]}
        value={filter.mitraId ?? ''}
        onChange={(e) => onChange({ ...filter, mitraId: e.target.value || undefined })}
        style={{ width: 200 }}
      />
      <Button tone="outline" onClick={onExport} disabled={exporting}>
        {exporting ? t('laporanFilterBar.menyiapkan') : t('laporanFilterBar.eksporCsv')}
      </Button>
    </div>
  );
}
