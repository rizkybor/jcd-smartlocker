import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { KioskButton } from '@smartbox/ui';
import { sewaMachine } from './machine/sewaMachine';
import { IdleScreenView } from './screens/IdleScreenView';
import { MenuScreen } from './screens/MenuScreen';
import { UnitPenuhScreen } from './screens/UnitPenuhScreen';
import { NomorHpScreen } from './screens/NomorHpScreen';
import { EmailScreen } from './screens/EmailScreen';
import { DurasiScreen } from './screens/DurasiScreen';
import { BayarScreen } from './screens/BayarScreen';
import { BayarGagalScreen } from './screens/BayarGagalScreen';
import { BukaPintuScreen } from './screens/BukaPintuScreen';
import { StrukScreen } from './screens/StrukScreen';
import { OtpScreen } from './screens/OtpScreen';
import { AMBIL_STEPS } from './screens/KioskShell';

// Session timeout (PRD §5.3, SMB-307) — reset ke idle setelah tidak ada
// interaksi. Idle sendiri dikecualikan (tidak ada apa-apa untuk di-timeout).
const SESSION_TIMEOUT_MS = 60_000;

export default function App() {
  const [state, send] = useMachine(sewaMachine);

  useEffect(() => {
    if (state.matches('idle')) return;
    const timer = setTimeout(() => send({ type: 'TIMEOUT_SESI' }), SESSION_TIMEOUT_MS);
    const reset = () => {
      clearTimeout(timer);
    };
    window.addEventListener('pointerdown', reset, { once: true });
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', reset);
    };
    // Re-arm tiap kali state berubah (setiap interaksi memicu transisi machine).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.value]);

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#000',
      }}
    >
      <div
        style={{
          width: 600,
          height: 1024,
          overflow: 'hidden',
          boxShadow: '0 0 40px rgba(0,0,0,.4)',
        }}
      >
        {renderScreen()}
      </div>
    </div>
  );

  function renderScreen() {
    if (state.matches('idle')) {
      return (
        <IdleScreenView
          onWake={() => send({ type: 'SENTUH' })}
          errorMessage={state.context.errorMessage}
        />
      );
    }
    if (state.matches('muatUnit')) {
      return <IdleScreenView onWake={() => {}} />;
    }
    if (state.matches('unitPenuh')) {
      return <UnitPenuhScreen onKembali={() => send({ type: 'KEMBALI' })} />;
    }
    if (state.matches('menu')) {
      return (
        <MenuScreen
          onSewa={() => send({ type: 'PILIH_SEWA' })}
          onAmbil={() => send({ type: 'PILIH_AMBIL' })}
        />
      );
    }
    if (state.matches('nomorHp')) {
      return (
        <NomorHpScreen
          nomorHp={state.context.nomorHp}
          onChange={(value) => send({ type: 'SET_NOMOR_HP', value })}
          onLanjut={() => send({ type: 'LANJUT_NOMOR_HP' })}
          onKembali={() => send({ type: 'KEMBALI' })}
          valid={/^08\d{8,13}$/.test(state.context.nomorHp)}
        />
      );
    }
    if (state.matches('email')) {
      return (
        <EmailScreen
          email={state.context.email}
          onChange={(value) => send({ type: 'SET_EMAIL', value })}
          onLanjut={() => send({ type: 'LANJUT_EMAIL' })}
          onKembali={() => send({ type: 'KEMBALI' })}
          valid={/^\S+@\S+\.\S+$/.test(state.context.email)}
        />
      );
    }
    if (state.matches('durasi') || state.matches('memulaiSewa')) {
      return (
        <DurasiScreen
          pilihan={state.context.unit?.durasiHarga ?? []}
          onPilih={(durasi) => send({ type: 'PILIH_DURASI', durasi })}
          onKembali={() => send({ type: 'KEMBALI' })}
          errorMessage={state.context.errorMessage}
        />
      );
    }
    if (state.matches('bayar')) {
      return (
        <BayarScreen
          qrString={state.context.pembayaran?.qrString ?? null}
          nominal={state.context.pembayaran?.nominal ?? null}
          expiredAt={state.context.pembayaran?.expiredAt ?? null}
          onBatal={() => send({ type: 'BATAL' })}
        />
      );
    }
    if (state.matches('bayarGagal')) {
      return <BayarGagalScreen onUlangi={() => send({ type: 'ULANGI' })} onBatal={() => send({ type: 'BATAL' })} />;
    }
    if (state.matches('bukaPintu')) {
      return <BukaPintuScreen />;
    }
    if (state.matches('struk')) {
      return <StrukScreen struk={state.context.struk} onSelesai={() => send({ type: 'SELESAI' })} />;
    }

    if (state.matches('ambilNomorHp') || state.matches('mulaiAmbil')) {
      return (
        <NomorHpScreen
          nomorHp={state.context.ambilNomorHp}
          onChange={(value) => send({ type: 'SET_AMBIL_NOMOR_HP', value })}
          onLanjut={() => send({ type: 'LANJUT_AMBIL_NOMOR_HP' })}
          onKembali={() => send({ type: 'KEMBALI' })}
          valid={/^08\d{8,13}$/.test(state.context.ambilNomorHp)}
          steps={AMBIL_STEPS}
          title="Masukkan Nomor HP Anda"
          subtitle="Nomor HP yang sama saat menyewa loker."
        />
      );
    }
    if (state.matches('ambilKirimOtp') || state.matches('ambilOtp') || state.matches('ambilVerifikasi')) {
      return (
        <OtpScreen
          kode={state.context.kodeOtp}
          onChange={(value) => send({ type: 'SET_KODE_OTP', value })}
          onVerifikasi={() => send({ type: 'VERIFIKASI_OTP' })}
          onKirimUlang={() => send({ type: 'KIRIM_ULANG_OTP' })}
          onKembali={() => send({ type: 'KEMBALI' })}
          valid={/^\d{6}$/.test(state.context.kodeOtp)}
          errorMessage={state.context.errorMessage}
        />
      );
    }
    if (state.matches('ambilBukaPintu')) {
      return <BukaPintuScreen label="Membuka pintu..." />;
    }
    if (state.matches('ambilSelesai')) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ flex: 1, minHeight: 0 }}>
            <BukaPintuScreen label="Silakan ambil barang Anda" />
          </div>
          <div style={{ padding: 'var(--sl-kiosk-pad)', display: 'flex', justifyContent: 'center' }}>
            <KioskButton tone="primary" size="lg" onClick={() => send({ type: 'SELESAI' })}>
              Selesai
            </KioskButton>
          </div>
        </div>
      );
    }
    return null;
  }
}
