const MITRA_AKTIF = {id:"kalibata-prop",nama:"PT Kalibata Property",lokasi:["kalibata"],pic:"Rina Wijaya",kontak:"rina@kalibataprop.id"};
const MITRA_LOKASI = "kalibata";
const PINTU = 18;
const SHARE_MITRA = 30;

/* Satu sumber data dengan Super Admin: unit di lokasi mitra ini */
const mitraUnits = units => units.filter(u=>u.lokasi===MITRA_LOKASI)
  .map(u=>({kode:u.kode,pintu:u.komp,terisi:u.status==="maintenance"?null:u.terisi,status:u.status}));
const ringkas = units => {
  const list=mitraUnits(units), aktif=list.filter(u=>u.status!=="maintenance");
  const terisi=aktif.reduce((a,u)=>a+(u.terisi||0),0), pintu=aktif.reduce((a,u)=>a+u.pintu,0);
  return {list:list,aktif:aktif,terisi:terisi,pintu:pintu,pct:pintu?Math.round(terisi/pintu*100):0};
};
const MITRA_TRX = [
  {id:"TRX-4827-2291",iso:"2026-08-03",waktu:"03 Agu 2026 · 09:12",unit:"JCD-KLP-001",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2288",iso:"2026-08-03",waktu:"03 Agu 2026 · 08:44",unit:"JCD-KLP-002",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"berjalan"},
  {id:"TRX-4827-2285",iso:"2026-08-03",waktu:"03 Agu 2026 · 07:58",unit:"JCD-KLP-003",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"berjalan"},
  {id:"TRX-4827-2279",iso:"2026-08-02",waktu:"02 Agu 2026 · 19:26",unit:"JCD-KLP-001",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"selesai"},
  {id:"TRX-4827-2274",iso:"2026-08-02",waktu:"02 Agu 2026 · 16:41",unit:"JCD-KLP-003",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2268",iso:"2026-08-02",waktu:"02 Agu 2026 · 13:05",unit:"JCD-KLP-002",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"selesai"},
  {id:"TRX-4827-2261",iso:"2026-08-01",waktu:"01 Agu 2026 · 20:12",unit:"JCD-KLP-001",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2256",iso:"2026-08-01",waktu:"01 Agu 2026 · 17:33",unit:"JCD-KLP-003",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"selesai"},
  {id:"TRX-4827-2251",iso:"2026-08-01",waktu:"01 Agu 2026 · 11:47",unit:"JCD-KLP-002",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2240",iso:"2026-07-30",waktu:"30 Jul 2026 · 18:22",unit:"JCD-KLP-001",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"selesai"},
  {id:"TRX-4827-2236",iso:"2026-07-30",waktu:"30 Jul 2026 · 09:41",unit:"JCD-KLP-003",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"selesai"},
  {id:"TRX-4827-2229",iso:"2026-07-29",waktu:"29 Jul 2026 · 15:18",unit:"JCD-KLP-002",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2221",iso:"2026-07-28",waktu:"28 Jul 2026 · 12:05",unit:"JCD-KLP-001",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"selesai"},
  {id:"TRX-4827-2214",iso:"2026-07-27",waktu:"27 Jul 2026 · 19:47",unit:"JCD-KLP-003",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"selesai"},
  {id:"TRX-4827-2205",iso:"2026-07-22",waktu:"22 Jul 2026 · 16:33",unit:"JCD-KLP-001",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2198",iso:"2026-07-19",waktu:"19 Jul 2026 · 10:58",unit:"JCD-KLP-002",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"selesai"},
  {id:"TRX-4827-2190",iso:"2026-07-16",waktu:"16 Jul 2026 · 08:26",unit:"JCD-KLP-003",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2181",iso:"2026-07-12",waktu:"12 Jul 2026 · 20:04",unit:"JCD-KLP-001",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"selesai"}
];
/* Rentang dihitung dari hari ini, bukan tanggal statis */
const RENTANG_OPTS = [{value:"3",label:"3 hari terakhir"},{value:"7",label:"7 hari terakhir"},{value:"30",label:"30 hari terakhir"}];
const mundur = hari => {
  const d=new Date(); d.setHours(0,0,0,0); d.setDate(d.getDate()-(Number(hari)-1));
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
};
/* 30 hari berakhir HARI INI (4 Agu 2026). Sabtu/Minggu lebih tinggi. */
const SEWA_HARIAN = (() => {
  const akhir=new Date(2026,7,4), out=[];
  for(let i=29;i>=0;i--){
    const d=new Date(akhir.getFullYear(),akhir.getMonth(),akhir.getDate()-i);
    const wk=d.getDay()===0||d.getDay()===6;
    const pola=[0,2,-1,1,3,-2,1,0,2,-1][(29-i)%10];
    out.push({tgl:d,jumlah:Math.max(8,Math.min(22,(wk?19:12)+pola)),weekend:wk});
  }
  return out;
})();
const SEWA_HARI_INI = SEWA_HARIAN[SEWA_HARIAN.length-1].jumlah;
const SEWA_KEMARIN = SEWA_HARIAN[SEWA_HARIAN.length-2].jumlah;
const TGL_LABEL = d => d.getDate()+" "+["Jan","Feb","Mar","Apr","Mei","Jun","Jul","Agu","Sep","Okt","Nov","Des"][d.getMonth()];
const BAGI_LABEL = "Sewa Smart Locker 70% / Mitra 30%";

function ScopeBanner(){
  return (
    <div className="dsx-scope">
      <span className="dsx-scopelock"><Icon name="lock" size={20} label="Akses terbatas"/></span>
      <div>
        <div className="dsx-scopetitle">Menampilkan data untuk: {namaLokasi(MITRA_LOKASI)}</div>
        <div className="dsx-scopesub">Akun {MITRA_AKTIF.nama} hanya dapat melihat lokasi ini. Data lokasi dan mitra lain tidak tersedia di akun ini.</div>
      </div>
    </div>
  );
}

/* Overview memakai baris ringan — lokasi sudah tampil di chip header */
function ScopeLine(props){
  if(props.hidden) return null;
  return (
    <div className="dsx-scopeline">
      <Icon name="lock" size={14} label="Akses terbatas"/>
      Akses akun ini terbatas pada {namaLokasi(MITRA_LOKASI)} · data mitra lain tidak tersedia.
    </div>
  );
}

function OccBar(props){
  if(props.terisi===null) return (
    <span className="dsx-occ">
      <span className="dsx-occval dsx-occval--off">Tidak tersedia</span>
      <span className="dsx-occnote">Unit sedang maintenance</span>
    </span>
  );
  const pct=Math.round(props.terisi/props.pintu*100);
  return (
    <span className="dsx-occ">
      <span className="dsx-occval sl-num">{props.terisi} / {props.pintu} pintu</span>
      <span className="dsx-occtrack"><span className="dsx-occfill" style={{width:pct+"%"}}></span></span>
      <span className="dsx-occnote sl-num">{pct}% terisi</span>
    </span>
  );
}

function SewaChart(){
  const last=SEWA_HARIAN.length-1;
  return (
    <div className="dsx-chart">
      <div className="dsx-chartgrid">
        <span>24</span><span>12</span><span>0</span>
      </div>
      <div className="dsx-bars">
        {SEWA_HARIAN.map((d,i)=>(
          <span key={i} className={"dsx-bar"+(i===last?" peak":"")} style={{height:(d.jumlah/24*100)+"%"}}
            title={TGL_LABEL(d.tgl)+": "+d.jumlah+" sewa"+(i===last?" (hari ini)":"")}></span>
        ))}
      </div>
      <div className="dsx-chartaxis">
        <span>{TGL_LABEL(SEWA_HARIAN[0].tgl)}</span>
        <span>{TGL_LABEL(SEWA_HARIAN[14].tgl)}</span>
        <span>Hari ini</span>
      </div>
    </div>
  );
}

function MetricCard(props){
  return (
    <div className={"dsx-metric"+(props.onClick?" tappable":"")} style={{borderTopColor:props.accent}}
      onClick={props.onClick} role={props.onClick?"button":undefined} tabIndex={props.onClick?0:undefined}>
      <div className="dsx-metriclabel">{props.label}</div>
      <div className="dsx-metricvalue sl-num">{props.value}</div>
      {props.descriptor?<div className={"dsx-metricdesc"+(props.tone?" "+props.tone:"")} style={props.descStyle}>{props.descriptor}</div>:null}
      {props.footer?<div className="dsx-metricfoot">{props.footer}</div>:null}
    </div>
  );
}

/* Unit Aktif punya empat kondisi tergantung jumlah unit dan unit bermasalah */
function UnitAktifCard(props){
  const list=props.list, rusak=list.filter(u=>u.status==="maintenance"), aktif=list.length-rusak.length;
  if(list.length===1){
    const ok=!rusak.length;
    return <MetricCard label="Unit aktif" accent="var(--sl-primary-tint)"
      value={<span className="dsx-unitstate"><span className={"dsx-statedot "+(ok?"ok":"bad")}></span>{ok?"Aktif":"Maintenance"}</span>}
      descriptor="Status unit" tone="muted"/>;
  }
  const desc = !rusak.length ? "Semua unit beroperasi normal"
    : rusak.length===1 ? rusak[0].kode+" sedang maintenance"
    : rusak.length+" unit sedang maintenance";
  return <MetricCard label="Unit aktif" accent="var(--sl-primary-tint)"
    value={aktif+" dari "+list.length}
    descriptor={<span className={"dsx-unitnote "+(rusak.length?"bad":"ok")} style={rusak.length?{color:"var(--sl-status-offline)",fontWeight:400}:null}>{desc}</span>}
    footer={rusak.length>1?<button type="button" className="dsx-cardlink" onClick={props.onOpen}>Lihat detail unit →</button>:null}
    onClick={rusak.length>1?props.onOpen:undefined}/>;
}

function MitraOverview(props){
  const s=ringkas(props.units);
  return (
    <div className="dsx-page">
      <PageHead title="Overview" desc={"Ringkasan operasional "+namaLokasi(MITRA_LOKASI)+","}/>
      <ScopeLine hidden/>
      <div className="dsx-grid3">
        <MetricCard label="Pendapatan" value={rpJt(145000)} accent="var(--sl-secondary-tint)"
          footer={<><span className="dsx-periodchip" style={{backgroundColor:"var(--sl-border)"}}>Hari ini</span>
            <button type="button" className="dsx-cardlink" onClick={()=>props.go("reports")}>Lihat progres Agustus →</button></>}/>
        <MetricCard label="Penggunaan hari ini" value={SEWA_HARI_INI+" sewa"} accent="var(--sl-accent-tint)"
          descriptor={(SEWA_HARI_INI>=SEWA_KEMARIN?"↑":"↓")+" dibanding kemarin ("+SEWA_KEMARIN+" transaksi)"} tone="muted"
          descStyle={{color:"var(--sl-status-offline)"}}/>
        <UnitAktifCard list={s.list} onOpen={()=>props.go("units")}/>
      </div>
      <Panel title="Jumlah sewa per hari" description="30 hari terakhir sampai hari ini." elevation={1}
        actions={<Button tone="outline" size="sm" onClick={()=>props.go("reports")}>Lihat laporan</Button>}>
        <SewaChart/>
      </Panel>
    </div>
  );
}

function MitraUnits(props){
  const s=ringkas(props.units);
  const [detail,setDetail]=React.useState(null);
  const [rentang,setRentang]=React.useState("3");
  const bukaDetail=r=>{setRentang("3");setDetail(r);};
  const trxUnit=detail?MITRA_TRX.filter(t=>t.unit===detail.kode&&t.iso>=mundur(rentang)):[];
  return (
    <div className="dsx-page">
      <PageHead title="Unit Locker" desc="Daftar unit di lokasi Anda."/>
      <Panel elevation={1} flush>
        <DataTable rows={s.list} striped
          columns={[
            {key:"kode",header:"Kode unit",render:r=><span className="dsx-mono">{r.kode}</span>},
            {key:"lokasi",header:"Lokasi",render:()=>namaLokasi(MITRA_LOKASI)},
            {key:"okupansi",header:"Okupansi",width:"220px",render:r=><OccBar terisi={r.terisi} pintu={r.pintu}/>},
            {key:"status",header:"Status operasional",render:r=>r.status==="maintenance"
              ? <StatusBadge status="maintenance">Maintenance</StatusBadge>
              : <StatusBadge status="available">Aktif</StatusBadge>},
            {key:"aksi",header:"Aksi",align:"right",width:"120px",render:r=>(
              <span className="dsx-rowactions">
                <button type="button" className="dsx-iconbtn" onClick={()=>bukaDetail(r)} aria-label={"Lihat riwayat transaksi "+r.kode}>
                  <Icon name="eye" size={18}/>
                </button>
              </span>)}
          ]}
          footer={<div className="dsx-tfoot"><span className="sl-num">{s.terisi} / {s.pintu} pintu terisi</span></div>}/>
      </Panel>
      <div className="dsx-note">Butuh perubahan status atau perbaikan unit? Hubungi tim operasional Sewa Smart Locker.</div>
      <Modal open={!!detail} width="880px"
        title={detail?"Riwayat transaksi "+detail.kode:""}
        desc={detail?namaLokasi(MITRA_LOKASI):""}
        onClose={()=>setDetail(null)}
        footer={<Button tone="primary" size="md" onClick={()=>setDetail(null)}>Tutup</Button>}>
        {detail?(<>
          <div className="dsx-detailfilter">
            <Dropdown label="Rentang waktu" value={rentang} onChange={setRentang} options={RENTANG_OPTS} style={{width:240}}/>
          </div>
          <UnitTrxTable rows={trxUnit} bare/>
          <div className="dsx-filternote">Menampilkan {trxUnit.length} transaksi · {(RENTANG_OPTS.find(o=>o.value===rentang)||{}).label}</div>
        </>):null}
      </Modal>
    </div>
  );
}

/* Skema komersial per unit + angka per periode (data dummy final) */
const SKEMA = {
  "JCD-KLP-001":"bagi","JCD-KLP-002":"bagi","JCD-KLP-003":"penuh","JCD-KLP-004":"bagi"
};
/* Nominal disimpan sebagai angka; format ditentukan rpJt() */
const UNIT_PERIODE = {
  "JCD-KLP-001":[{periode:"Mei 2026",transaksi:118,kotor:1150000,hak:345000},{periode:"Juni 2026",transaksi:128,kotor:1250000,hak:375000},{periode:"Juli 2026",transaksi:135,kotor:1350000,hak:405000}],
  "JCD-KLP-002":[{periode:"Mei 2026",transaksi:85,kotor:950000,hak:285000},{periode:"Juni 2026",transaksi:101,kotor:1050000,hak:315000},{periode:"Juli 2026",transaksi:147,kotor:1150000,hak:345000}],
  "JCD-KLP-003":[{periode:"Mei 2026",transaksi:95,kotor:1000000},{periode:"Juni 2026",transaksi:102,kotor:1100000},{periode:"Juli 2026",transaksi:108,kotor:1150000}],
  "JCD-KLP-004":[{periode:"Mei 2026",transaksi:82,kotor:850000,hak:255000},{periode:"Juni 2026",transaksi:89,kotor:950000,hak:285000},{periode:"Juli 2026",transaksi:65,kotor:970000,hak:291000}]
};
const SEMUA_PERIODE = [
  {periode:"Mei 2026",transaksi:380,kotor:3950000,skema:"3 Bagi Hasil · 1 Sewa Penuh",hak:1885000},
  {periode:"Juni 2026",transaksi:420,kotor:4350000,skema:"3 Bagi Hasil · 1 Sewa Penuh",hak:2075000},
  {periode:"Juli 2026",transaksi:455,kotor:4620000,skema:"3 Bagi Hasil · 1 Sewa Penuh",hak:2191000}
];
const UNIT_OPTS = [{value:"all",label:"Semua Unit"}].concat(Object.keys(SKEMA).map(k=>({value:k,label:k})));
const MAINTENANCE_SEJAK = {"JCD-KLP-004":"pertengahan Juli 2026"};

function MitraReports(props){
  const [unit,setUnit]=React.useState("all");
  const [busy,exportNow]=useExport(props.notify);
  const semua = unit==="all";
  const skema = semua?null:SKEMA[unit];
  const penuh = skema==="penuh";
  const rows = semua?SEMUA_PERIODE:UNIT_PERIODE[unit];
  const juli = rows[rows.length-1];
  const totalTrx = rows.reduce((a,r)=>a+r.transaksi,0);
  const totalHak = rows.reduce((a,r)=>a+(penuh?r.kotor:r.hak),0);

  return (
    <div className="dsx-page">
      <PageHead title="Laporan Pendapatan" desc="Rekap transaksi dan bagi hasil untuk rekonsiliasi keuangan Anda."
        actions={<Button tone="secondary" size="md" disabled={!!busy}
          onClick={()=>exportNow("PDF "+(semua?"semua unit":unit))}>{busy?"Menyiapkan…":"Unduh PDF"}</Button>}/>
      <Panel elevation={1} tone="card" style={{borderTop:"3px solid var(--sl-primary)"}}>
        <div className="dsx-reporthead">
          <div>
            <div className="dsx-repeyebrow">Laporan bagi hasil</div>
            <div className="dsx-reptitle">{MITRA_AKTIF.nama}</div>
            <div className="dsx-repmeta">{namaLokasi(MITRA_LOKASI)} · Periode 1–31 Juli 2026</div>
          </div>
          <Dropdown label="Lihat data untuk" value={unit} onChange={setUnit} options={UNIT_OPTS} style={{width:220}}/>
        </div>
        {MAINTENANCE_SEJAK[unit]?(
          <div className="dsx-warnbar">
            <Icon name="wrench" size={18}/>
            <span>Unit ini sedang maintenance sejak {MAINTENANCE_SEJAK[unit]} — data di bawah mencakup histori sebelum maintenance dimulai.</span>
          </div>
        ):null}
        <div className={"dsx-repsum"+(penuh?" dsx-repsum--2":"")} style={penuh?{gap:32}:null}>
          <div className="dsx-repcell" style={{width:penuh?"100%":328}}>
            <span className="dsx-replabel">{semua?"Total pendapatan lokasi":"Total pendapatan unit "+unit}</span>
            <span className="dsx-repval">{rpJt(juli.kotor)}</span>
            <span className="dsx-repnote">Juli 2026 · {juli.transaksi} transaksi{MAINTENANCE_SEJAK[unit]?" (parsial sebelum maintenance)":""}</span>
          </div>
          <div className="dsx-repcell" style={{width:368,alignItems:"flex-start",position:"relative",left:-20}}>
            <span className="dsx-replabel">{semua?"Skema unit":"Skema"}</span>
            <span className="dsx-repval">{semua?"3 Bagi Hasil · 1 Sewa Penuh":(penuh?"Sewa Penuh":"Bagi Hasil")}</span>
            <span className="dsx-repnote">{semua?"Hak mitra dihitung per unit sesuai skemanya":(penuh?"100% pendapatan adalah hak Anda":BAGI_LABEL)}</span>
          </div>
          {penuh?null:(
            <div className="dsx-repcell dsx-repcell--total">
              <span className="dsx-replabel">{semua?"Total hak mitra":"Hak mitra"}</span>
              <span className="dsx-repval">{rpJt(juli.hak)}</span>
              <span className="dsx-repnote">{semua?"Penjumlahan hak per unit · ":SHARE_MITRA+"% dari "+rpJt(juli.kotor)+" · dibayarkan maksimal 10 hari kerja setelah periode berakhir"}</span>
            </div>
          )}
        </div>
      </Panel>
      <Panel title="Rincian per periode"
        description={semua?"Agregat seluruh unit di lokasi ini.":"Unit "+unit+" · "+(penuh?"Sewa Penuh (100% hak mitra)":BAGI_LABEL)}
        elevation={1} flush>
        <DataTable rows={rows} striped
          columns={[
            {key:"periode",header:"Periode"},
            {key:"transaksi",header:"Transaksi",numeric:true,align:"right"},
            {key:"kotor",header:semua?"Pendapatan lokasi":"Pendapatan unit",align:"right",numeric:true,render:r=>rpJt(r.kotor)}
          ].concat(semua?[{key:"skema",header:"Skema"}]:[])
           .concat(penuh?[]:[{key:"hak",header:"Hak mitra",align:"right",numeric:true,render:r=>rpJt(r.hak)}])}
          footer={<div className="dsx-tfoot">
            <span>{rows.length} periode terakhir · {totalTrx.toLocaleString("id-ID")} transaksi</span>
            <span className="sl-num">Total hak mitra {rpJt(totalHak)}</span>
          </div>}/>
      </Panel>
      <div className="dsx-note">Riwayat transaksi per unit ada di halaman <strong>Unit Locker</strong> — buka aksi detail pada unit yang ingin diperiksa.</div>
      <div className="dsx-note">Laporan ini disiapkan untuk rekonsiliasi internal mitra. Selisih data dapat diajukan maksimal 14 hari setelah laporan terbit.</div>
    </div>
  );
}

Object.assign(window,{MitraOverview,MitraUnits,MitraReports,MITRA_AKTIF,MITRA_LOKASI});
