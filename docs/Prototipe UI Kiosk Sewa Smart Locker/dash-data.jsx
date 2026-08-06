const D = window.SewaSmartLockerDesignSystem_2be940;
const { Button, DataTable, Field, Panel, Sidebar, StatCard, StatusBadge } = D;
window.SL_ICON_BASE = "assets/icons";

/* Renderer ikon design system (bundle belum meng-export Icon) — mask SVG Lucide
   yang di-vendor lokal supaya mewarisi currentColor, tanpa CDN. */
function Icon(props){
  const size = props.size || 20;
  const base = (props.basePath || window.SL_ICON_BASE || "assets/icons").replace(/\/$/,"");
  const url = base + "/" + props.name + ".svg";
  return (
    <span role={props.label?"img":"presentation"} aria-label={props.label} aria-hidden={props.label?undefined:"true"}
      className="dsx-icon" style={Object.assign({
        display:"inline-block",flex:"0 0 auto",width:size,height:size,
        backgroundColor:props.color||"currentColor",
        WebkitMask:"url("+url+") center/contain no-repeat",
        mask:"url("+url+") center/contain no-repeat",
        verticalAlign:"middle"
      },props.style)}></span>
  );
}

const LOKASI = [
  {id:"kalibata",nama:"Apartemen Kalibata City",kota:"Jakarta Selatan"},
  {id:"gbk",nama:"Kolam Renang GBK",kota:"Jakarta Pusat"},
  {id:"cipinang",nama:"Mall Cipinang Indah",kota:"Jakarta Timur"},
  {id:"sudirman",nama:"Kantor Sudirman 21",kota:"Jakarta Pusat"}
];
const MITRA = [
  {id:"kalibata-prop",nama:"PT Kalibata Property",lokasi:["kalibata"],unit:12,pic:"Rina Wijaya",kontak:"rina@kalibataprop.id"},
  {id:"sarana",nama:"PT Sarana Olahraga Jaya",lokasi:["gbk"],unit:8,pic:"Bagus Prakoso",kontak:"bagus@saranaolahraga.id"},
  {id:"cipinang-retail",nama:"Cipinang Retail Group",lokasi:["cipinang"],unit:16,pic:"Melati Sari",kontak:"melati@cipinangretail.co.id"},
  {id:"sudirman21",nama:"PT Graha Sudirman",lokasi:["sudirman"],unit:12,pic:"Andi Nugraha",kontak:"andi@grahasudirman.id"}
];
const STATUS_OPTS = [
  {value:"available",label:"Tersedia"},
  {value:"occupied",label:"Terisi"},
  {value:"maintenance",label:"Maintenance"},
  {value:"offline",label:"Offline"}
];
const UNITS_SEED = [
  {kode:"JCD-KLP-001",lokasi:"kalibata",mitra:"kalibata-prop",komp:18,aktif:18,terisi:14,status:"occupied"},
  {kode:"JCD-KLP-002",lokasi:"kalibata",mitra:"kalibata-prop",komp:18,aktif:18,terisi:9,status:"available"},
  {kode:"JCD-KLP-003",lokasi:"kalibata",mitra:"kalibata-prop",komp:18,aktif:18,terisi:11,status:"available"},
  {kode:"JCD-KLP-004",lokasi:"kalibata",mitra:"kalibata-prop",komp:18,aktif:0,terisi:null,status:"maintenance"},
  {kode:"JCD-GBK-001",lokasi:"gbk",mitra:"sarana",komp:16,aktif:16,status:"occupied"},
  {kode:"JCD-GBK-002",lokasi:"gbk",mitra:"sarana",komp:16,aktif:14,status:"available"},
  {kode:"JCD-CPI-001",lokasi:"cipinang",mitra:"cipinang-retail",komp:12,aktif:12,status:"available"},
  {kode:"JCD-CPI-002",lokasi:"cipinang",mitra:"cipinang-retail",komp:12,aktif:12,status:"occupied"},
  {kode:"JCD-CPI-003",lokasi:"cipinang",mitra:"cipinang-retail",komp:8,aktif:0,status:"offline"},
  {kode:"JCD-SDR-001",lokasi:"sudirman",mitra:"sudirman21",komp:12,aktif:12,status:"occupied"},
  {kode:"JCD-SDR-002",lokasi:"sudirman",mitra:"sudirman21",komp:12,aktif:11,status:"available"},
  {kode:"JCD-SDR-003",lokasi:"sudirman",mitra:"sudirman21",komp:8,aktif:8,status:"maintenance"}
];
const TRX = [
  {id:"TRX-4827-2291",iso:"2026-08-03",waktu:"03 Agu 2026 · 09:12",unit:"JCD-KLP-001",lokasi:"kalibata",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2288",iso:"2026-08-03",waktu:"03 Agu 2026 · 08:44",unit:"JCD-KLP-002",lokasi:"kalibata",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"berjalan"},
  {id:"TRX-4827-2284",iso:"2026-08-03",waktu:"03 Agu 2026 · 08:20",unit:"JCD-GBK-001",lokasi:"gbk",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"berjalan"},
  {id:"TRX-4827-2280",iso:"2026-08-02",waktu:"02 Agu 2026 · 19:05",unit:"JCD-CPI-002",lokasi:"cipinang",durasi:"3 jam",metode:"Kartu",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2276",iso:"2026-08-02",waktu:"02 Agu 2026 · 17:38",unit:"JCD-KLP-001",lokasi:"kalibata",durasi:"1 jam",metode:"QRIS",nominal:5000,status:"selesai"},
  {id:"TRX-4827-2271",iso:"2026-08-02",waktu:"02 Agu 2026 · 16:02",unit:"JCD-SDR-001",lokasi:"sudirman",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"selesai"},
  {id:"TRX-4827-2265",iso:"2026-08-02",waktu:"02 Agu 2026 · 12:47",unit:"JCD-KLP-003",lokasi:"kalibata",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"},
  {id:"TRX-4827-2259",iso:"2026-08-01",waktu:"01 Agu 2026 · 20:15",unit:"JCD-GBK-002",lokasi:"gbk",durasi:"1 jam",metode:"Kartu",nominal:5000,status:"selesai"},
  {id:"TRX-4827-2254",iso:"2026-08-01",waktu:"01 Agu 2026 · 18:31",unit:"JCD-KLP-002",lokasi:"kalibata",durasi:"6 jam",metode:"QRIS",nominal:25000,status:"selesai"},
  {id:"TRX-4827-2250",iso:"2026-08-01",waktu:"01 Agu 2026 · 11:09",unit:"JCD-CPI-001",lokasi:"cipinang",durasi:"3 jam",metode:"QRIS",nominal:12000,status:"selesai"}
];
const AKUN_SEED = [
  {id:"u1",nama:"PT Kalibata Property",email:"rina@kalibataprop.id",lokasi:["kalibata"]},
  {id:"u2",nama:"PT Sarana Olahraga Jaya",email:"bagus@saranaolahraga.id",lokasi:["gbk"]},
  {id:"u3",nama:"Cipinang Retail Group",email:"melati@cipinangretail.co.id",lokasi:["cipinang","sudirman"]}
];

/* ≥ 1 juta → "Rp1,15jt"; di bawah itu selalu angka penuh "Rp345.000" */
const rp = n => "Rp" + Number(n).toLocaleString("id-ID").replace(/,/g,".");
const rpJt = n => Number(n) >= 1000000
  ? "Rp" + (Number(n)/1000000).toFixed(2).replace(".",",") + "jt"
  : rp(Math.round(n));
const namaLokasi = id => (LOKASI.find(l=>l.id===id)||{}).nama || id;
const namaMitra = id => (MITRA.find(m=>m.id===id)||{}).nama || id;

/* [PLACEHOLDER] wrapper — every unconfirmed number/model is marked, never faked silently */
function Ph(props){
  return <span className={"dsx-ph"+(props.block?" dsx-ph--block":"")}>
    <span className="dsx-phtag">Placeholder</span>{props.children}
  </span>;
}
function PhBox(props){
  return (
    <div className="dsx-phbox" style={{height:props.height||220}}>
      <span className="dsx-phtag">Placeholder</span>
      <span className="dsx-phlabel">{props.label}</span>
      {props.note?<span className="dsx-phnote">{props.note}</span>:null}
    </div>
  );
}
function PageHead(props){
  return (
    <div className="dsx-pagehead">
      <div>
        <h1 className="dsx-h1">{props.title}</h1>
        {props.desc?<p className="dsx-desc">{props.desc}</p>:null}
      </div>
      {props.actions?<div className="dsx-actions">{props.actions}</div>:null}
    </div>
  );
}
function DateRange(props){
  return (
    <div className="dsx-range">
      <div className="dsx-rangefields">
        <Field label="Dari tanggal" type="date" value={props.from} onChange={e=>props.onFrom(e.target.value)} style={{minWidth:180}}/>
        <Field label="Sampai tanggal" type="date" value={props.to} onChange={e=>props.onTo(e.target.value)} style={{minWidth:180}}/>
      </div>
      <div className="dsx-rangebtn">{props.children}</div>
    </div>
  );
}
function Toast(props){
  if(!props.msg) return null;
  return <div className="dsx-toast" role="status">{props.msg}</div>;
}
function Switch(props){
  return (
    <button type="button" role="switch" aria-checked={props.on} aria-label={props.label}
      className={"dsx-switch"+(props.on?" on":"")} onClick={props.onClick}>
      <span className="dsx-knob"></span>
    </button>
  );
}
function trxStatus(s){
  return s==="berjalan"
    ? <StatusBadge status="occupied">Berjalan</StatusBadge>
    : <StatusBadge status="available">Selesai</StatusBadge>;
}
const inRange = (t,from,to) => (!from||t.iso>=from) && (!to||t.iso<=to);

/* Modal: dialog surface on the elevation-4 step */
function Modal(props){
  if(!props.open) return null;
  return (
    <div className="dsx-overlay" role="dialog" aria-modal="true" onClick={props.onClose}>
      <div className="dsx-modal" style={props.width?{maxWidth:props.width}:null} onClick={e=>e.stopPropagation()}>
        <Panel title={props.title} description={props.desc} elevation={4}>
          {props.children}
          <div className="dsx-formfoot">{props.footer}</div>
        </Panel>
      </div>
    </div>
  );
}

/* Multi-select penugasan lokasi */
function LokasiPicker(props){
  return (
    <div className="dsx-multi">
      {LOKASI.map(l=>(
        <button type="button" key={l.id} className={"dsx-chip"+(props.value.includes(l.id)?" on":"")}
          onClick={()=>props.onChange(props.value.includes(l.id)?props.value.filter(x=>x!==l.id):props.value.concat(l.id))}>
          <span className="dsx-check">{props.value.includes(l.id)?<Icon name="check" size={14}/>:null}</span>{l.nama}
        </button>
      ))}
    </div>
  );
}

/* Dropdown anchored — chevron rapat ke tepi, panel opsi menempel di bawah input */
function Dropdown(props){
  const [open,setOpen]=React.useState(false);
  const box=React.useRef(null);
  React.useEffect(()=>{
    if(!open) return;
    const away=e=>{if(box.current&&!box.current.contains(e.target))setOpen(false);};
    document.addEventListener("pointerdown",away);
    return ()=>document.removeEventListener("pointerdown",away);
  },[open]);
  const aktif=(props.options.find(o=>o.value===props.value)||props.options[0]);
  return (
    <div className="dsx-dd" ref={box} style={props.style}>
      {props.label?<span className="dsx-ddlabel">{props.label}</span>:null}
      <button type="button" className={"dsx-ddbtn"+(open?" open":"")} onClick={()=>setOpen(v=>!v)}
        aria-haspopup="listbox" aria-expanded={open}>
        <span>{aktif.label}</span>
        <Icon name="chevron-down" size={16}/>
      </button>
      {open?(
        <div className="dsx-ddmenu" role="listbox">
          {props.options.map(o=>(
            <button type="button" key={o.value} role="option" aria-selected={o.value===props.value}
              className={"dsx-ddopt"+(o.value===props.value?" on":"")}
              onClick={()=>{props.onChange(o.value);setOpen(false);}}>{o.label}</button>
          ))}
        </div>
      ):null}
    </div>
  );
}

/* Riwayat transaksi satu unit — dipakai di panel detail Unit Locker */
function UnitTrxTable(props){
  const rows=props.rows||[];
  const total=rows.reduce((a,t)=>a+t.nominal,0);
  if(!rows.length) return <div className="dsx-empty">Tidak ada transaksi pada rentang waktu ini.</div>;
  const cols=[
    {key:"id",header:"ID transaksi",render:r=><span className="dsx-mono">{r.id}</span>},
    {key:"waktu",header:"Waktu"},
    {key:"durasi",header:"Durasi",align:"right",numeric:true},
    {key:"nominal",header:"Nominal",align:"right",numeric:true,render:r=>rpJt(r.nominal)},
    {key:"status",header:"Status",render:r=>trxStatus(r.status)}
  ];
  if(props.lokasi) cols.splice(2,0,{key:"lokasi",header:"Lokasi",render:r=>namaLokasi(r.lokasi)});
  if(props.bare) return <DataTable rows={rows} striped density="compact" columns={cols}/>;
  return <DataTable rows={rows} striped density="compact" columns={cols}
    footer={<div className="dsx-tfoot"><span>{rows.length} transaksi terakhir</span><span className="sl-num">Total {rpJt(total)}</span></div>}/>;
}

/* Export: busy state, then confirmation toast — no real file in a prototype */
function useExport(notify){
  const [busy,setBusy]=React.useState("");
  const run=kind=>{
    if(busy) return;
    setBusy(kind);
    setTimeout(()=>{setBusy("");notify("Laporan "+kind+" selesai disiapkan.");},1200);
  };
  return [busy,run];
}

Object.assign(window,{D,Button,DataTable,Field,Panel,Sidebar,StatCard,StatusBadge,
  LOKASI,MITRA,UNITS_SEED,TRX,AKUN_SEED,STATUS_OPTS,rp,namaLokasi,namaMitra,
  rpJt,Icon,Dropdown,Ph,PhBox,PageHead,DateRange,Toast,Switch,trxStatus,inRange,Modal,LokasiPicker,useExport,UnitTrxTable});
