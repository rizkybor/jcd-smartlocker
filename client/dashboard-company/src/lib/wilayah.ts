/**
 * Data wilayah administratif Indonesia (Provinsi/Kab-Kota/Kecamatan/
 * Kelurahan) — di luar cakupan PRD awal, permintaan bisnis langsung.
 * Fetch LANGSUNG dari API publik emsifa/api-wilayah-indonesia dari
 * browser (§ konfirmasi bisnis) — backend kita tidak proxy data ini sama
 * sekali, cuma menyimpan hasil pilihan akhir (kode+nama).
 */

const BASE_URL = 'https://www.emsifa.com/api-wilayah-indonesia/api';

export type WilayahOption = { id: string; name: string };

const cache = new Map<string, Promise<WilayahOption[]>>();

async function fetchWilayah(path: string): Promise<WilayahOption[]> {
  const cached = cache.get(path);
  if (cached) return cached;

  const promise = fetch(`${BASE_URL}/${path}`)
    .then((res) => {
      if (!res.ok) throw new Error(`Gagal memuat data wilayah (${res.status}).`);
      return res.json() as Promise<WilayahOption[]>;
    })
    .catch((err) => {
      cache.delete(path);
      throw err;
    });

  cache.set(path, promise);
  return promise;
}

export const wilayahApi = {
  provinsi: () => fetchWilayah('provinces.json'),
  kabupaten: (provinsiKode: string) => fetchWilayah(`regencies/${provinsiKode}.json`),
  kecamatan: (kabupatenKode: string) => fetchWilayah(`districts/${kabupatenKode}.json`),
  kelurahan: (kecamatanKode: string) => fetchWilayah(`villages/${kecamatanKode}.json`),
};
