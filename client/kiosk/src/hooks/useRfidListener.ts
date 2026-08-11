import { useEffect, useRef } from 'react';

// RFID reader USB (keyboard-wedge/HID) emit tiap karakter kode sebagai
// keydown super cepat lalu Enter — jauh lebih cepat dari mengetik manusia
// (§ konfirmasi bisnis: listener otomatis, BUKAN layar input manual).
// Ambang ini membedakan burst RFID dari orang benar-benar mengetik di
// keyboard fisik yang mungkin tercolok (kalau ada).
const MAX_MS_ANTAR_KARAKTER = 50;
const MIN_PANJANG_KODE = 4;

/**
 * Fitur member RFID (di luar cakupan PRD awal). Aktif secara global — kiosk
 * tidak punya input teks lain yang perlu fokus keyboard fisik (nomor
 * HP/OTP dipakai numpad on-screen kustom, bukan keyboard asli), jadi aman
 * mendengarkan `keydown` window-level tanpa bentrok dengan field lain.
 */
export function useRfidListener(onScan: (kode: string) => void, aktif: boolean) {
  const bufferRef = useRef('');
  const waktuTerakhirRef = useRef(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!aktif) {
      bufferRef.current = '';
      return;
    }

    function handleKeyDown(e: KeyboardEvent) {
      const sekarang = Date.now();
      if (sekarang - waktuTerakhirRef.current > MAX_MS_ANTAR_KARAKTER) {
        bufferRef.current = '';
      }
      waktuTerakhirRef.current = sekarang;

      if (e.key === 'Enter') {
        const kode = bufferRef.current;
        bufferRef.current = '';
        if (kode.length >= MIN_PANJANG_KODE) {
          onScanRef.current(kode);
        }
        return;
      }

      if (e.key.length === 1) {
        bufferRef.current += e.key;
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [aktif]);
}
