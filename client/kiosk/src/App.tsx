import { useEffect } from 'react';
import { useMachine } from '@xstate/react';
import { sewaMachine } from './machine/sewaMachine';
import { IdleScreenView } from './screens/IdleScreenView';
import { MenuScreen } from './screens/MenuScreen';
import { UnitPenuhScreen } from './screens/UnitPenuhScreen';
import { NomorHpScreen } from './screens/NomorHpScreen';
import { DurasiScreen } from './screens/DurasiScreen';
import { BayarScreen } from './screens/BayarScreen';
import { BayarGagalScreen } from './screens/BayarGagalScreen';
import { BukaPintuScreen } from './screens/BukaPintuScreen';
import { StrukScreen } from './screens/StrukScreen';

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
      return <MenuScreen onSewa={() => send({ type: 'PILIH_SEWA' })} />;
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
    return null;
  }
}
