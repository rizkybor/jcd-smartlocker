import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Field } from '@smartbox/ui';
import { wilayahApi, type WilayahOption } from '../lib/wilayah';

export type WilayahValue = {
  provinsiKode: string;
  provinsiNama: string;
  kabupatenKode: string;
  kabupatenNama: string;
  kecamatanKode: string;
  kecamatanNama: string;
  kelurahanKode: string;
  kelurahanNama: string;
};

/**
 * Cascading picker Provinsi -> Kab/Kota -> Kecamatan -> Kelurahan (di luar
 * cakupan PRD awal — permintaan bisnis langsung), data dari API publik
 * emsifa/api-wilayah-indonesia (`lib/wilayah.ts`). Dipakai di alur bikin
 * Lokasi baru — Mitra (`CreateMitraDialog.tsx`) & Unit (`CreateUnitDialog.tsx`).
 * Cuma emit `onChange` (dengan value lengkap) begitu SEMUA 4 level terpilih.
 */
export function WilayahPicker({ onChange }: { onChange: (value: WilayahValue | null) => void }) {
  const { t } = useTranslation();

  const [provinsiList, setProvinsiList] = useState<WilayahOption[]>([]);
  const [kabupatenList, setKabupatenList] = useState<WilayahOption[]>([]);
  const [kecamatanList, setKecamatanList] = useState<WilayahOption[]>([]);
  const [kelurahanList, setKelurahanList] = useState<WilayahOption[]>([]);

  const [provinsi, setProvinsi] = useState<WilayahOption | null>(null);
  const [kabupaten, setKabupaten] = useState<WilayahOption | null>(null);
  const [kecamatan, setKecamatan] = useState<WilayahOption | null>(null);
  const [kelurahan, setKelurahan] = useState<WilayahOption | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    wilayahApi.provinsi().then(setProvinsiList).catch(() => setError(t('wilayahPicker.gagalMuat')));
  }, [t]);

  useEffect(() => {
    if (kelurahan) {
      onChange({
        provinsiKode: provinsi!.id,
        provinsiNama: provinsi!.name,
        kabupatenKode: kabupaten!.id,
        kabupatenNama: kabupaten!.name,
        kecamatanKode: kecamatan!.id,
        kecamatanNama: kecamatan!.name,
        kelurahanKode: kelurahan.id,
        kelurahanNama: kelurahan.name,
      });
    } else {
      onChange(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kelurahan]);

  function handleProvinsiChange(id: string) {
    const found = provinsiList.find((p) => p.id === id) ?? null;
    setProvinsi(found);
    setKabupaten(null);
    setKecamatan(null);
    setKelurahan(null);
    setKabupatenList([]);
    setKecamatanList([]);
    setKelurahanList([]);
    if (found) {
      wilayahApi.kabupaten(found.id).then(setKabupatenList).catch(() => setError(t('wilayahPicker.gagalMuat')));
    }
  }

  function handleKabupatenChange(id: string) {
    const found = kabupatenList.find((k) => k.id === id) ?? null;
    setKabupaten(found);
    setKecamatan(null);
    setKelurahan(null);
    setKecamatanList([]);
    setKelurahanList([]);
    if (found) {
      wilayahApi.kecamatan(found.id).then(setKecamatanList).catch(() => setError(t('wilayahPicker.gagalMuat')));
    }
  }

  function handleKecamatanChange(id: string) {
    const found = kecamatanList.find((k) => k.id === id) ?? null;
    setKecamatan(found);
    setKelurahan(null);
    setKelurahanList([]);
    if (found) {
      wilayahApi.kelurahan(found.id).then(setKelurahanList).catch(() => setError(t('wilayahPicker.gagalMuat')));
    }
  }

  function handleKelurahanChange(id: string) {
    setKelurahan(kelurahanList.find((k) => k.id === id) ?? null);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sl-space-4)' }}>
      <Field
        label={t('wilayahPicker.provinsi')}
        required
        options={[{ value: '', label: t('wilayahPicker.pilih') }, ...provinsiList.map((p) => ({ value: p.id, label: p.name }))]}
        value={provinsi?.id ?? ''}
        onChange={(e) => handleProvinsiChange(e.target.value)}
      />
      <Field
        label={t('wilayahPicker.kabupaten')}
        required
        disabled={!provinsi}
        options={[{ value: '', label: t('wilayahPicker.pilih') }, ...kabupatenList.map((k) => ({ value: k.id, label: k.name }))]}
        value={kabupaten?.id ?? ''}
        onChange={(e) => handleKabupatenChange(e.target.value)}
      />
      <Field
        label={t('wilayahPicker.kecamatan')}
        required
        disabled={!kabupaten}
        options={[{ value: '', label: t('wilayahPicker.pilih') }, ...kecamatanList.map((k) => ({ value: k.id, label: k.name }))]}
        value={kecamatan?.id ?? ''}
        onChange={(e) => handleKecamatanChange(e.target.value)}
      />
      <Field
        label={t('wilayahPicker.kelurahan')}
        required
        disabled={!kecamatan}
        options={[{ value: '', label: t('wilayahPicker.pilih') }, ...kelurahanList.map((k) => ({ value: k.id, label: k.name }))]}
        value={kelurahan?.id ?? ''}
        onChange={(e) => handleKelurahanChange(e.target.value)}
      />
      {error ? <div style={{ fontSize: 'var(--sl-fs-13)', color: 'var(--sl-status-offline-strong)' }}>{error}</div> : null}
    </div>
  );
}
