import { assign, fromPromise, setup } from 'xstate';
import i18n from '../i18n';
import {
  ApiError,
  kioskApi,
  type AmbilSesi,
  type BayarDendaResult,
  type BuatPembayaranResult,
  type KategoriLoker,
  type SesiTransaksi,
  type StrukResult,
  type UnitDurasiHarga,
  type UnitStatus,
} from '../api/client';

const QR_EXPIRY_SECONDS = 300; // 5 menit (PRD §5.1 langkah 5)
const POLL_INTERVAL_MS = 2000;

export type SewaContext = {
  unit: UnitStatus | null;
  nomorHp: string;
  email: string;
  // --- Kategori ukuran loker (fitur harga & pilihan per ukuran, di luar PRD awal) ---
  pilihanKategori: KategoriLoker | null;
  pilihanDurasi: UnitDurasiHarga | null;
  sesi: SesiTransaksi | null;
  pembayaran: BuatPembayaranResult | null;
  secondsLeft: number;
  struk: StrukResult | null;
  errorMessage: string | null;
  // --- Ambil Barang (§5.2) ---
  ambilNomorHp: string;
  ambilSesi: AmbilSesi | null;
  kodeOtp: string;
  // --- Denda keterlambatan (fitur overdue/suspend, di luar PRD awal) ---
  pembayaranDenda: BayarDendaResult | null;
};

const initialContext: SewaContext = {
  unit: null,
  nomorHp: '',
  email: '',
  pilihanKategori: null,
  pilihanDurasi: null,
  sesi: null,
  pembayaran: null,
  secondsLeft: QR_EXPIRY_SECONDS,
  struk: null,
  errorMessage: null,
  ambilNomorHp: '',
  ambilSesi: null,
  kodeOtp: '',
  pembayaranDenda: null,
};

function errorMessageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return i18n.t('errors.jaringan');
}

export const sewaMachine = setup({
  types: {} as {
    context: SewaContext;
    events:
      | { type: 'SENTUH' }
      | { type: 'PILIH_SEWA' }
      | { type: 'PILIH_AMBIL' }
      | { type: 'KEMBALI' }
      | { type: 'BATAL' }
      | { type: 'ULANGI' }
      | { type: 'SELESAI' }
      | { type: 'TIMEOUT_SESI' }
      | { type: 'SET_NOMOR_HP'; value: string }
      | { type: 'LANJUT_NOMOR_HP' }
      | { type: 'SET_EMAIL'; value: string }
      | { type: 'LANJUT_EMAIL' }
      | { type: 'PILIH_KATEGORI'; kategori: KategoriLoker }
      | { type: 'PILIH_DURASI'; durasi: UnitDurasiHarga }
      | { type: 'SET_AMBIL_NOMOR_HP'; value: string }
      | { type: 'LANJUT_AMBIL_NOMOR_HP' }
      | { type: 'SET_KODE_OTP'; value: string }
      | { type: 'VERIFIKASI_OTP' }
      | { type: 'KIRIM_ULANG_OTP' };
  },
  actors: {
    muatStatusUnit: fromPromise(async () => {
      const res = await kioskApi.statusUnit();
      return res.data;
    }),
    mulaiSewa: fromPromise(async ({ input }: { input: { nomorHp: string; email: string; unitDurasiHargaId: string } }) => {
      const res = await kioskApi.mulaiSewa(input.nomorHp, input.email, input.unitDurasiHargaId);
      return res.data;
    }),
    buatPembayaran: fromPromise(async ({ input }: { input: { sesiId: string } }) => {
      const res = await kioskApi.buatPembayaran(input.sesiId);
      return res.data;
    }),
    pollStatusBayar: fromPromise(async ({ input, signal }: { input: { sesiId: string }; signal: AbortSignal }) => {
      // Poll sampai PAID/FAILED/EXPIRED, dibatasi durasi QR (§5.1 langkah 5,
      // API-Contract-Smartbox.md §7 — kiosk polling, bukan Supabase Realtime langsung).
      for (let elapsed = 0; elapsed < QR_EXPIRY_SECONDS * 1000; elapsed += POLL_INTERVAL_MS) {
        if (signal.aborted) throw new Error('aborted');
        const res = await kioskApi.cekStatusBayar(input.sesiId);
        if (res.data.statusBayar !== 'PENDING') return res.data.statusBayar;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      return 'EXPIRED' as const;
    }),
    bukaPintu: fromPromise(async ({ input }: { input: { sesiId: string } }) => {
      const res = await kioskApi.bukaPintu(input.sesiId);
      return res.data;
    }),
    muatStruk: fromPromise(async ({ input }: { input: { sesiId: string } }) => {
      const res = await kioskApi.struk(input.sesiId);
      return res.data;
    }),
    mulaiAmbil: fromPromise(async ({ input }: { input: { nomorHp: string } }) => {
      const res = await kioskApi.mulaiAmbil(input.nomorHp);
      return res.data;
    }),
    kirimOtpAmbil: fromPromise(async ({ input }: { input: { sesiId: string } }) => {
      const res = await kioskApi.kirimOtpAmbil(input.sesiId);
      return res.data;
    }),
    verifikasiOtpAmbil: fromPromise(async ({ input }: { input: { sesiId: string; kode: string } }) => {
      const res = await kioskApi.verifikasiOtpAmbil(input.sesiId, input.kode);
      return res.data;
    }),
    bukaPintuAmbil: fromPromise(async ({ input }: { input: { sesiId: string } }) => {
      const res = await kioskApi.bukaPintuAmbil(input.sesiId);
      return res.data;
    }),
    bayarDenda: fromPromise(async ({ input }: { input: { sesiId: string } }) => {
      const res = await kioskApi.bayarDenda(input.sesiId);
      return res.data;
    }),
    pollStatusDenda: fromPromise(async ({ input, signal }: { input: { sesiId: string }; signal: AbortSignal }) => {
      for (let elapsed = 0; elapsed < QR_EXPIRY_SECONDS * 1000; elapsed += POLL_INTERVAL_MS) {
        if (signal.aborted) throw new Error('aborted');
        const res = await kioskApi.cekStatusDenda(input.sesiId);
        if (res.data.statusBayar !== 'PENDING') return res.data.statusBayar;
        await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
      }
      return 'EXPIRED' as const;
    }),
  },
}).createMachine({
  id: 'sewa',
  initial: 'idle',
  context: initialContext,
  // Timeout sesi global (§5.3, SMB-307) — event TIMEOUT_SESI dikirim App.tsx
  // dari listener inaktivitas, ditangani tiap state interaktif di bawah.
  on: {
    TIMEOUT_SESI: '.idle',
  },
  states: {
    idle: {
      // Reset semua field KECUALI errorMessage — supaya pesan error dari
      // muatUnit.onError (mis. unit key salah/belum dibuat) tetap terlihat
      // di IdleScreen, bukan langsung hilang begitu masuk state ini.
      entry: assign(({ context }) => ({ ...initialContext, errorMessage: context.errorMessage })),
      on: { SENTUH: { target: 'muatUnit', actions: assign({ errorMessage: null }) } },
    },

    muatUnit: {
      invoke: {
        src: 'muatStatusUnit',
        onDone: [
          { guard: ({ event }) => event.output.unitPenuh, target: 'unitPenuh', actions: assign({ unit: ({ event }) => event.output }) },
          { target: 'menu', actions: assign({ unit: ({ event }) => event.output }) },
        ],
        onError: { target: 'idle', actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }) },
      },
    },

    unitPenuh: {
      on: { KEMBALI: 'idle' },
    },

    menu: {
      on: {
        PILIH_SEWA: 'nomorHp',
        PILIH_AMBIL: 'ambilNomorHp',
        KEMBALI: 'idle',
      },
    },

    // === Alur Sewa (§5.1) ===

    nomorHp: {
      on: {
        SET_NOMOR_HP: { actions: assign({ nomorHp: ({ event }) => event.value }) },
        LANJUT_NOMOR_HP: {
          guard: ({ context }) => /^08\d{8,13}$/.test(context.nomorHp),
          target: 'email',
        },
        KEMBALI: 'menu',
      },
    },

    email: {
      on: {
        SET_EMAIL: { actions: assign({ email: ({ event }) => event.value }) },
        LANJUT_EMAIL: {
          guard: ({ context }) => /^\S+@\S+\.\S+$/.test(context.email),
          target: 'pilihKategori',
        },
        KEMBALI: 'nomorHp',
      },
    },

    // Fitur harga & pilihan per ukuran loker (di luar PRD awal) — pelanggan
    // pilih KATEGORI ukuran dulu, baru durasi/harga YANG BERLAKU UNTUK
    // KATEGORI ITU ditampilkan di layar berikutnya (§ konfirmasi bisnis).
    pilihKategori: {
      on: {
        PILIH_KATEGORI: 'durasi',
        KEMBALI: 'email',
      },
      exit: assign({ pilihanKategori: ({ event }) => (event.type === 'PILIH_KATEGORI' ? event.kategori : null) }),
    },

    durasi: {
      on: {
        PILIH_DURASI: 'memulaiSewa',
        KEMBALI: 'pilihKategori',
      },
      exit: assign({ pilihanDurasi: ({ event }) => (event.type === 'PILIH_DURASI' ? event.durasi : null) }),
    },

    memulaiSewa: {
      invoke: {
        src: 'mulaiSewa',
        input: ({ context }) => ({
          nomorHp: context.nomorHp,
          email: context.email,
          unitDurasiHargaId: context.pilihanDurasi!.id,
        }),
        onDone: { target: 'bayar', actions: assign({ sesi: ({ event }) => event.output }) },
        onError: [
          {
            guard: ({ event }) => event.error instanceof ApiError && event.error.code === 'LOKER_TIDAK_TERSEDIA',
            target: 'durasi',
            actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }),
          },
          { target: 'durasi', actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }) },
        ],
      },
    },

    bayar: {
      initial: 'membuatCharge',
      states: {
        membuatCharge: {
          invoke: {
            src: 'buatPembayaran',
            input: ({ context }) => ({ sesiId: context.sesi!.id }),
            onDone: {
              target: 'menungguPembayaran',
              actions: assign({ pembayaran: ({ event }) => event.output, secondsLeft: QR_EXPIRY_SECONDS }),
            },
            onError: { target: '#sewa.durasi', actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }) },
          },
        },
        menungguPembayaran: {
          invoke: {
            src: 'pollStatusBayar',
            input: ({ context }) => ({ sesiId: context.sesi!.id }),
            onDone: [
              { guard: ({ event }) => event.output === 'PAID', target: '#sewa.bukaPintu' },
              { target: '#sewa.bayarGagal' },
            ],
            onError: { target: '#sewa.bayarGagal' },
          },
        },
      },
      on: { BATAL: 'idle' },
    },

    bayarGagal: {
      on: {
        ULANGI: 'durasi',
        BATAL: 'idle',
      },
    },

    bukaPintu: {
      invoke: {
        src: 'bukaPintu',
        input: ({ context }) => ({ sesiId: context.sesi!.id }),
        onDone: { target: 'struk', actions: assign({ sesi: ({ event }) => event.output }) },
        onError: { target: 'bukaPintu', actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }) },
      },
    },

    struk: {
      invoke: {
        src: 'muatStruk',
        input: ({ context }) => ({ sesiId: context.sesi!.id }),
        onDone: { actions: assign({ struk: ({ event }) => event.output }) },
      },
      on: { SELESAI: 'idle' },
    },

    // === Alur Ambil Barang (§5.2) ===

    ambilNomorHp: {
      on: {
        SET_AMBIL_NOMOR_HP: { actions: assign({ ambilNomorHp: ({ event }) => event.value }) },
        LANJUT_AMBIL_NOMOR_HP: {
          guard: ({ context }) => /^08\d{8,13}$/.test(context.ambilNomorHp),
          target: 'mulaiAmbil',
        },
        KEMBALI: 'menu',
      },
    },

    mulaiAmbil: {
      invoke: {
        src: 'mulaiAmbil',
        input: ({ context }) => ({ nomorHp: context.ambilNomorHp }),
        onDone: [
          // Terlambat >= 24 jam: loker disuspend, TIDAK ditawari jalur bayar
          // sendiri sama sekali — cuma Super Admin yang bisa buka (§ konfirmasi
          // bisnis, lihat overdue.util.ts di backend).
          {
            guard: ({ event }) => event.output.suspended,
            target: 'ambilSuspended',
            actions: assign({ ambilSesi: ({ event }) => event.output }),
          },
          // Terlambat tapi belum 24 jam: wajib bayar denda kekurangan dulu.
          {
            guard: ({ event }) => event.output.overdue,
            target: 'ambilBayarDenda',
            actions: assign({ ambilSesi: ({ event }) => event.output }),
          },
          { target: 'ambilKirimOtp', actions: assign({ ambilSesi: ({ event }) => event.output }) },
        ],
        onError: {
          target: 'ambilNomorHp',
          actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }),
        },
      },
    },

    // Loker disuspend (terlambat >= 24 jam) — dead end di kiosk, cuma
    // hubungi admin yang bisa lanjut (Super Admin buka lewat Dashboard
    // Company, lihat unit.service.ts::bukaLokerSuspended()).
    ambilSuspended: {
      on: { KEMBALI: 'idle', SELESAI: 'idle' },
    },

    ambilBayarDenda: {
      initial: 'membuatChargeDenda',
      states: {
        membuatChargeDenda: {
          invoke: {
            src: 'bayarDenda',
            input: ({ context }) => ({ sesiId: context.ambilSesi!.id }),
            onDone: {
              target: 'menungguPembayaranDenda',
              actions: assign({ pembayaranDenda: ({ event }) => event.output, secondsLeft: QR_EXPIRY_SECONDS }),
            },
            onError: [
              {
                guard: ({ event }) => event.error instanceof ApiError && event.error.code === 'LOKER_DISUSPEND',
                target: '#sewa.ambilSuspended',
                actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }),
              },
              {
                target: '#sewa.ambilNomorHp',
                actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }),
              },
            ],
          },
        },
        menungguPembayaranDenda: {
          invoke: {
            src: 'pollStatusDenda',
            input: ({ context }) => ({ sesiId: context.ambilSesi!.id }),
            onDone: [
              { guard: ({ event }) => event.output === 'PAID', target: '#sewa.ambilKirimOtp' },
              { target: '#sewa.ambilBayarDendaGagal' },
            ],
            onError: { target: '#sewa.ambilBayarDendaGagal' },
          },
        },
      },
      on: { BATAL: 'idle' },
    },

    ambilBayarDendaGagal: {
      on: {
        ULANGI: 'ambilBayarDenda',
        BATAL: 'idle',
      },
    },

    ambilKirimOtp: {
      invoke: {
        src: 'kirimOtpAmbil',
        input: ({ context }) => ({ sesiId: context.ambilSesi!.id }),
        onDone: { target: 'ambilOtp', actions: assign({ errorMessage: null }) },
        onError: {
          target: 'ambilNomorHp',
          actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }),
        },
      },
    },

    ambilOtp: {
      on: {
        SET_KODE_OTP: { actions: assign({ kodeOtp: ({ event }) => event.value }) },
        VERIFIKASI_OTP: {
          guard: ({ context }) => /^\d{6}$/.test(context.kodeOtp),
          target: 'ambilVerifikasi',
        },
        KIRIM_ULANG_OTP: { target: 'ambilKirimOtp', actions: assign({ kodeOtp: '' }) },
        KEMBALI: 'ambilNomorHp',
      },
    },

    ambilVerifikasi: {
      invoke: {
        src: 'verifikasiOtpAmbil',
        input: ({ context }) => ({ sesiId: context.ambilSesi!.id, kode: context.kodeOtp }),
        onDone: { target: 'ambilBukaPintu', actions: assign({ errorMessage: null }) },
        onError: {
          target: 'ambilOtp',
          actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error), kodeOtp: '' }),
        },
      },
    },

    ambilBukaPintu: {
      invoke: {
        src: 'bukaPintuAmbil',
        input: ({ context }) => ({ sesiId: context.ambilSesi!.id }),
        onDone: 'ambilSelesai',
        onError: {
          target: 'ambilBukaPintu',
          actions: assign({ errorMessage: ({ event }) => errorMessageOf(event.error) }),
        },
      },
    },

    ambilSelesai: {
      on: { SELESAI: 'idle' },
    },
  },
});
