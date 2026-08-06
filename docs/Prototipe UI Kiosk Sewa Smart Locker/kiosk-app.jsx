const { IdleScreen, KioskButton, Numpad, QRScreen, DoorTransition, SuccessBurst } = window.SewaSmartLockerDesignSystem_2be940;
const RENT_STEPS = ["Nomor HP","Durasi","Bayar","Simpan Barang"];
const PICK_STEPS = ["Nomor HP","Kode OTP","Ambil Barang"];
const DURATIONS = [{h:1,price:5000},{h:3,price:12000},{h:6,price:25000}];
const SESS = {menu:45,rentPhone:60,rentDuration:60,rentQR:90,rentDoor:60,pickPhone:60,pickOtp:60};
const HOLD = {full:6,pickSending:2.6,pickVerify:1.8};
const UNIT_ID = "A-04";

function App(){
  const [screen,setScreen]=React.useState("idle");
  const [unitFull,setUnitFull]=React.useState(false);
  const [fast,setFast]=React.useState(false);
  const [phone,setPhone]=React.useState("");
  const [phoneErr,setPhoneErr]=React.useState("");
  const [dur,setDur]=React.useState(null);
  const [otp,setOtp]=React.useState("");
  const [qrLeft,setQrLeft]=React.useState(300);
  const [doorOpen,setDoorOpen]=React.useState(false);
  const [left,setLeft]=React.useState(null);
  const [editingPhone,setEditingPhone]=React.useState(false);
  const [stored,setStored]=React.useState(false);
  const [taken,setTaken]=React.useState(false);

  const goIdle=React.useCallback(()=>{
    setScreen("idle");setPhone("");setPhoneErr("");setDur(null);setOtp("");setDoorOpen(false);setEditingPhone(false);setStored(false);setTaken(false);
  },[]);

  /* 1 Jam is preselected the first time the duration screen opens */
  React.useEffect(()=>{
    if(screen==="rentDuration" && !dur) setDur(DURATIONS[0]);
  },[screen,dur]);

  /* session timeout — active on every flow screen, reset by any touch */
  React.useEffect(()=>{
    const base=SESS[screen];
    if(!base){setLeft(null);return;}
    const total=fast?Math.max(8,Math.round(base/5)):base;
    let t=total; setLeft(t);
    const iv=setInterval(()=>{t-=1;setLeft(t);if(t<=0){clearInterval(iv);goIdle();}},1000);
    const bump=()=>{t=total;setLeft(t);};
    const el=document.querySelector(".kx-panel");
    if(el) el.addEventListener("pointerdown",bump);
    return ()=>{clearInterval(iv);if(el) el.removeEventListener("pointerdown",bump);};
  },[screen,fast,goIdle]);

  /* screens that advance on their own */
  React.useEffect(()=>{
    const h=HOLD[screen]; if(!h) return;
    const to=setTimeout(()=>{
      if(screen==="pickSending") setScreen("pickOtp");
      else if(screen==="pickVerify") setScreen("pickDoor");
      else goIdle();
    },h*1000);
    return ()=>clearTimeout(to);
  },[screen,goIdle]);

  /* QR validity + simulated payment webhook */
  React.useEffect(()=>{
    if(screen!=="rentQR") return;
    setQrLeft(300);
    const iv=setInterval(()=>setQrLeft(s=>s>0?s-1:0),1000);
    const pay=setTimeout(()=>setScreen("rentDoor"),7000);
    return ()=>{clearInterval(iv);clearTimeout(pay);};
  },[screen]);

  /* door swing on arrival, then the door sensor closes the flow on its own */
  React.useEffect(()=>{
    if(screen!=="rentDoor"){return;}
    setDoorOpen(false);setStored(false);
    const a=setTimeout(()=>setDoorOpen(true),320);
    const b=setTimeout(()=>setStored(true),6500);
    return ()=>{clearTimeout(a);clearTimeout(b);};
  },[screen]);

  React.useEffect(()=>{
    if(screen!=="rentDoor"||!stored) return;
    const to=setTimeout(goIdle,16000);
    return ()=>clearTimeout(to);
  },[screen,stored,goIdle]);

  /* pickup: door sensor closes the flow on its own */
  React.useEffect(()=>{
    if(screen!=="pickDoor"){return;}
    setTaken(false);
    const t=setTimeout(()=>setTaken(true),6500);
    return ()=>clearTimeout(t);
  },[screen]);

  React.useEffect(()=>{
    if(screen!=="pickDoor"||!taken) return;
    const to=setTimeout(goIdle,14000);
    return ()=>clearTimeout(to);
  },[screen,taken,goIdle]);

  const warn = left!==null && left<=10 ? left : undefined;
  const phoneOK = phone.length>=10 && phone.slice(0,2)==="08";
  const submitPhone = next => {
    if(!phoneOK){setPhoneErr("Nomor HP harus diawali 08 dan minimal 10 angka.");return;}
    setPhoneErr(""); setScreen(next);
  };
  const cancelBtn = <KioskButton tone="neutral" size="md" onClick={goIdle}>Batalkan</KioskButton>;

  let view=null;

  if(screen==="idle"){
    view=<div className="kx-idle"><IdleScreen logoSrc="assets/logo-mono-light.png" logoHeight={140}
      headline="Sentuh untuk Mulai" subline="Sewa loker per jam. Tanpa aplikasi, tanpa kunci."
      stats={[{value:unitFull?"0":"5",label:"Loker tersedia"},{value:"Rp 5.000",label:"Mulai / 1 jam"},{value:"24 jam",label:"Unit beroperasi"}]}
      footnote={unitFull?"Unit aktif · semua loker terisi":"Unit aktif · PT Jendela Cakra Digital"}
      onWake={()=>setScreen("menu")} style={{height:1280,minHeight:1280}}/></div>;
  }

  if(screen==="menu"){
    view=(
      <div className="kx-screen">
        <div className="kx-head kx-head--menu">
          <img className="kx-logo" src="assets/logo-horizontal-2x.png" alt="Sewa Smart Locker"/>
          {typeof warn==="number"?<div className="kx-sesspill">Sesi berakhir dalam 0:{String(warn).padStart(2,"0")}</div>:null}
        </div>
        <div className="kx-body">
          <UnitEyebrow text={unitFull?"Semua loker terisi":"5 dari 12 loker tersedia"}/>
          <div className="kx-title">Pilih Layanan</div>
          <div className="kx-slot kx-slot--hero">
            <image-slot id="unit-hero" radius="16" placeholder="Ilustrasi unit locker — 736 × 300 (2.45:1)"></image-slot>
          </div>
          <div className="kx-stack">
            <KioskButton tone="primary" size="xl" fullWidth onClick={()=>setScreen(unitFull?"full":"rentPhone")}>Sewa Loker</KioskButton>
            <KioskButton tone="secondary" size="xl" fullWidth onClick={()=>setScreen("pickPhone")}>Ambil Barang</KioskButton>
          </div>
        </div>
        <div className="kx-foot kx-foot--menu">
          <div className="kx-footnote">Butuh bantuan? Hubungi Customer Service ·</div>
        </div>
      </div>
    );
  }

  if(screen==="full"){
    view=(
      <FlowScreen bodyStyle={{justifyContent:"center",textAlign:"center"}}>
        <div className="kx-slot kx-slot--full">
          <image-slot id="unit-penuh" radius="16" placeholder="Ilustrasi unit penuh — 480 × 360 (4:3)"></image-slot>
        </div>
        <div className="kx-title kx-title--center">Unit Ini Sedang Penuh</div>
        <div className="kx-sub kx-sub--center">Semua loker di unit ini terisi. Silakan coba unit lain di lantai berikutnya.</div>
        <div className="kx-autoback">Kembali ke layar utama otomatis…</div>
      </FlowScreen>
    );
  }

  if(screen==="rentPhone"){
    view=(
      <FlowScreen steps={RENT_STEPS} current={0} warn={warn}
        title="Masukkan Nomor HP"
        subtitle="Nomor ini dipakai untuk menerima kode OTP saat pengambilan barang."
        footer={<div className="kx-footrow">{editingPhone
          ? <KioskButton tone="neutral" size="md" onClick={()=>{setEditingPhone(false);setPhoneErr("");setScreen("rentDuration");}}>Kembali</KioskButton>
          : cancelBtn}<KioskButton tone="primary" size="xl" disabled={!phoneOK} onClick={()=>{submitPhone("rentDuration");setEditingPhone(false);}} style={{flex:1}}>{editingPhone?"Simpan Nomor":"Lanjut"}</KioskButton></div>}>
        <PhoneEntry value={phone} onChange={v=>{setPhone(v);setPhoneErr("");}} error={phoneErr} hint="Contoh: 0812 3456 7890"/>
      </FlowScreen>
    );
  }

  if(screen==="rentDuration"){
    view=(
      <FlowScreen steps={RENT_STEPS} current={1} warn={warn}
        title="Pilih Durasi Sewa"
        subtitle="Loker otomatis ditentukan sistem setelah pembayaran berhasil."
        footer={<div className="kx-footrow">{cancelBtn}<KioskButton tone="primary" size="xl" onClick={()=>setScreen("rentQR")} style={{flex:1}}>Bayar Sekarang</KioskButton></div>}>
        <div className="kx-durlist">
          {DURATIONS.map(d=>(
            <DurationCard key={d.h} hours={d.h} price={d.price} selected={dur&&dur.h===d.h}
              note={"sampai "+clockPlus(d.h*60)} onClick={()=>setDur(d)}/>
          ))}
        </div>
        <div className="kx-summary">
          <span>Nomor HP</span>
          <span className="kx-sumright"><span className="sl-num kx-sumval">{formatPhone(phone)}</span>
            <button type="button" className="kx-changebtn" onClick={()=>{setEditingPhone(true);setScreen("rentPhone");}}>Ubah</button>
          </span>
        </div>
      </FlowScreen>
    );
  }

  if(screen==="rentQR"){
    view=(
      <FlowScreen steps={RENT_STEPS} current={2} warn={warn} bodyStyle={{padding:0}}
        footer={<div className="kx-footrow">{cancelBtn}<div className="kx-waiting"><span className="kx-pulse"></span>Menunggu pembayaran…</div></div>}>
        <QRScreen title="Scan untuk Bayar" subtitle={"QRIS · semua e-wallet dan m-banking · sewa "+(dur?dur.h:1)+" jam"}
          qrSize={360} amount={rupiah(dur?dur.price:5000)} secondsLeft={qrLeft}
          footer={<div className="kx-qrnote">Kode QR berlaku sampai {clockPlus(5)}. Setelah itu ulangi dari awal.</div>}
          style={{padding:"0",background:"transparent"}}/>
      </FlowScreen>
    );
  }

  if(screen==="rentDoor"){
    view=(
      <FlowScreen steps={RENT_STEPS} current={3} warn={warn}
        footer={<div className="kx-storefoot">{stored
          ? <KioskButton tone="primary" size="xl" fullWidth onClick={goIdle}>Selesai</KioskButton>
          : <div className="kx-waiting"><span className="kx-pulse"></span>Menunggu pintu ditutup…</div>}</div>}>
        <div className="kx-storehead">
          {stored ? (
            <SuccessBurst key="ok" size={140} title="Loker Anda Aktif"
              detail="Kode OTP akan dikirim ke WhatsApp saat Anda mengambil barang."/>
          ) : (
            <div key="wait" className="kx-storewait">
              <div className="kx-doorbox"><DoorTransition open={doorOpen} id={UNIT_ID} contentLabel="ISI" size={180}/></div>
              <div className="kx-title kx-title--center">Masukkan Barang Anda</div>
              <div className="kx-sub kx-sub--center">{"Loker "+UNIT_ID+" sudah terbuka. Masukkan barang Anda, lalu tutup pintu sampai berbunyi klik."}</div>
            </div>
          )}
        </div>
        <div className="kx-receipt">
          <div className="kx-rrow"><span>Nomor loker</span><span className="kx-rval sl-num">{UNIT_ID}</span></div>
          <div className="kx-rrow"><span>Durasi</span><span className="kx-rval">{(dur?dur.h:1)+" jam"}</span></div>
          <div className="kx-rrow"><span>Berlaku sampai</span><span className="kx-rval sl-num">{clockPlus((dur?dur.h:1)*60)}</span></div>
          <div className="kx-rrow"><span>Nomor HP</span><span className="kx-rval sl-num">{formatPhone(phone)}</span></div>
          <div className="kx-rrow"><span>ID transaksi</span><span className="kx-rval kx-mono">TRX-4827-2291</span></div>
        </div>
      </FlowScreen>
    );
  }

  if(screen==="pickPhone"){
    view=(
      <FlowScreen steps={PICK_STEPS} current={0} warn={warn}
        title="Masukkan Nomor HP"
        subtitle="Gunakan nomor yang sama seperti saat menyewa loker."
        footer={<div className="kx-footrow">{cancelBtn}<KioskButton tone="primary" size="xl" disabled={!phoneOK} onClick={()=>submitPhone("pickSending")} style={{flex:1}}>Kirim Kode</KioskButton></div>}>
        <PhoneEntry value={phone} onChange={v=>{setPhone(v);setPhoneErr("");}} error={phoneErr} hint="Kode OTP dikirim ke WhatsApp nomor ini"/>
      </FlowScreen>
    );
  }

  if(screen==="pickSending"){
    view=(
      <FlowScreen steps={PICK_STEPS} current={1} bodyStyle={{justifyContent:"center",textAlign:"center"}}>
        <div className="kx-pulsebig"></div>
        <div className="kx-title kx-title--center">Mengirim Kode…</div>
        <div className="kx-sub kx-sub--center">Menghubungi WhatsApp <span className="sl-num">{formatPhone(phone)}</span></div>
      </FlowScreen>
    );
  }

  if(screen==="pickOtp"){
    view=(
      <FlowScreen steps={PICK_STEPS} current={1} warn={warn}
        title="Masukkan Kode OTP"
        footer={<div className="kx-footrow">{cancelBtn}<KioskButton tone="primary" size="xl" disabled={otp.length<6} onClick={()=>setScreen("pickVerify")} style={{flex:1}}>Buka Loker</KioskButton></div>}>
        <div className="kx-banner">
          <span className="kx-bdot"></span>
          <span>Kode terkirim ke WhatsApp <span className="sl-num">{formatPhone(phone)}</span></span>
        </div>
        <Numpad value={otp} length={6} onChange={setOtp} style={{margin:"0 auto"}}/>
        <div className="kx-otpnote">Kode berlaku 5 menit. Belum masuk? Sentuh Batalkan lalu ulangi.</div>
      </FlowScreen>
    );
  }

  if(screen==="pickVerify"){
    view=(
      <FlowScreen steps={PICK_STEPS} current={1} bodyStyle={{justifyContent:"center",textAlign:"center"}}>
        <div className="kx-pulsebig"></div>
        <div className="kx-title kx-title--center">Memverifikasi Kode…</div>
        <div className="kx-sub kx-sub--center">Mohon tunggu, jangan tinggalkan layar.</div>
      </FlowScreen>
    );
  }

  if(screen==="pickDoor"){
    view=(
      <FlowScreen steps={PICK_STEPS} current={2} warn={warn}
        footer={<div className="kx-storefoot">{taken
          ? <KioskButton tone="primary" size="xl" fullWidth onClick={goIdle}>Selesai</KioskButton>
          : <div className="kx-waiting"><span className="kx-pulse"></span>Menunggu pintu ditutup…</div>}</div>}>
        {taken ? (
          <div className="kx-storehead" style={{flex:1}}>
            <SuccessBurst key="done" size={180} title="Terima Kasih"
              detail="Barang Anda sudah diambil. Sampai jumpa lagi!"/>
            <div className="kx-autoback">Kembali ke layar utama otomatis…</div>
          </div>
        ) : (
          <div key="wait" className="kx-storewait">
            <div className="kx-title kx-title--center">Silakan Ambil Barang Anda</div>
            <div className="kx-sub kx-sub--center">{"Loker "+UNIT_ID+" terbuka. Ambil barang, lalu tutup pintu sampai berbunyi klik."}</div>
            <div className="kx-slot kx-slot--door">
              <image-slot id="pintu-terbuka" radius="16" placeholder="Animasi pintu terbuka — 440 × 440 (1:1)"></image-slot>
            </div>
            <div className="kx-lockerbig">
              <span className="kx-lockerlabel">Loker</span>
              <span className="kx-lockernum sl-num">{UNIT_ID}</span>
            </div>
          </div>
        )}
      </FlowScreen>
    );
  }

  return (
    <KioskStage controls={<>
      <DevToggle on={unitFull} onClick={()=>setUnitFull(v=>!v)}>Simulasi unit penuh</DevToggle>
      <DevToggle on={fast} onClick={()=>setFast(v=>!v)}>Timeout cepat</DevToggle>
      <span className="kx-devinfo">{screen}</span>
    </>}>{view}</KioskStage>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
