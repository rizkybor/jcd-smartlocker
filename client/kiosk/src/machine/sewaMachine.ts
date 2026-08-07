import { assign, fromPromise, setup } from 'xstate';
import {
  ApiError,
  kioskApi,
  type BuatPembayaranResult,
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
  pilihanDurasi: UnitDurasiHarga | null;
  sesi: SesiTransaksi | null;
  pembayaran: BuatPembayaranResult | null;
  secondsLeft: number;
  struk: StrukResult | null;
  errorMessage: string | null;
};

const initialContext: SewaContext = {
  unit: null,
  nomorHp: '',
  pilihanDurasi: null,
  sesi: null,
  pembayaran: null,
  secondsLeft: QR_EXPIRY_SECONDS,
  struk: null,
  errorMessage: null,
};

function errorMessageOf(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  return 'Terjadi kesalahan jaringan. Silakan coba lagi.';
}

export const sewaMachine = setup({
  types: {} as {
    context: SewaContext;
    events:
      | { type: 'SENTUH' }
      | { type: 'PILIH_SEWA' }
      | { type: 'KEMBALI' }
      | { type: 'SET_NOMOR_HP'; value: string }
      | { type: 'LANJUT_NOMOR_HP' }
      | { type: 'PILIH_DURASI'; durasi: UnitDurasiHarga }
      | { type: 'BATAL' }
      | { type: 'ULANGI' }
      | { type: 'SELESAI' }
      | { type: 'TIMEOUT_SESI' };
  },
  actors: {
    muatStatusUnit: fromPromise(async () => {
      const res = await kioskApi.statusUnit();
      return res.data;
    }),
    mulaiSewa: fromPromise(async ({ input }: { input: { nomorHp: string; unitDurasiHargaId: string } }) => {
      const res = await kioskApi.mulaiSewa(input.nomorHp, input.unitDurasiHargaId);
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
        KEMBALI: 'idle',
      },
    },

    nomorHp: {
      on: {
        SET_NOMOR_HP: { actions: assign({ nomorHp: ({ event }) => event.value }) },
        LANJUT_NOMOR_HP: {
          guard: ({ context }) => /^08\d{8,13}$/.test(context.nomorHp),
          target: 'durasi',
        },
        KEMBALI: 'menu',
      },
    },

    durasi: {
      on: {
        PILIH_DURASI: 'memulaiSewa',
        KEMBALI: 'nomorHp',
      },
      exit: assign({ pilihanDurasi: ({ event }) => (event.type === 'PILIH_DURASI' ? event.durasi : null) }),
    },

    memulaiSewa: {
      invoke: {
        src: 'mulaiSewa',
        input: ({ context }) => ({
          nomorHp: context.nomorHp,
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
  },
});
