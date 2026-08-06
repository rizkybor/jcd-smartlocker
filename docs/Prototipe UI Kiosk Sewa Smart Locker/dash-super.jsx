const { useState } = React;
/* Agustus 2026 · dijumlahkan = 4.820.000, sesuai kartu "Pendapatan total" */
const PENDAPATAN_LOKASI = {kalibata:1850000,gbk:1020000,cipinang:1180000,sudirman:770000};

function SuperOverview(props){
  const u=props.units;
  const aktif=u.filter(x=>x.status!=="offline").length;
  const tersewa=u.filter(x=>x.status==="occupied").length;
  return (
    <div className="dsx-page">
      <PageHead title="Overview" desc="Ringkasan seluruh lokasi dan mitra, diperbarui realtime."
        actions={<Button tone="outline" size="md" onClick={()=>props.notify("Data diperbarui 03 Agu 2026 · 09:14.")}>Segarkan data</Button>}/>
      <div className="dsx-grid4">
        <StatCard label="Unit aktif" value={aktif} unit={"/ "+u.length} accent="primary" caption="4 lokasi"/>
        <StatCard label="Unit tersewa" value={tersewa} delta="8,3%" deltaDirection="up" accent="occupied" caption="Okupansi hari ini"/>
        <StatCard label="Pendapatan total" value={rpJt(4820000)} badge={<span className="dsx-phtag">Placeholder</span>} accent="available" caption="Agustus 2026 · angka contoh"/>
        <StatCard label="Mitra aktif" value={props.partners.length} accent="accent" caption="Semua kontrak berjalan"/>
      </div>
      <Panel title="Pendapatan 30 hari terakhir" description="Grafik menunggu data produksi." elevation={1}>
        <PhBox height={260} label="Grafik pendapatan harian — rasio 2,6:1" note="Sumber data dan agregasi ditentukan di tahap development."/>
      </Panel>
      <div className="dsx-grid2">
        <Panel title="Unit perlu perhatian" elevation={1} flush
          actions={<Button tone="ghost" size="sm" onClick={()=>props.go("units")}>Lihat semua unit</Button>}>
          <DataTable density="compact" rows={props.units.filter(x=>x.status==="maintenance"||x.status==="offline")}
            onRowClick={()=>props.go("units")}
            columns={[
              {key:"kode",header:"Unit"},
              {key:"lokasi",header:"Lokasi",render:r=>namaLokasi(r.lokasi)},
              {key:"status",header:"Status",render:r=><StatusBadge status={r.status}/>}
            ]}/>
        </Panel>
        <Panel title="Pendapatan per lokasi" description="Agustus 2026 · total Rp4,82jt" elevation={1} flush
          actions={<Button tone="ghost" size="sm" onClick={()=>props.go("reports")}>Buka laporan</Button>}>
          <DataTable density="compact" rows={LOKASI}
            columns={[
              {key:"nama",header:"Lokasi"},
              {key:"unit",header:"Unit",numeric:true,align:"right",render:r=>props.units.filter(u=>u.lokasi===r.id).length},
              {key:"pendapatan",header:"Pendapatan",align:"right",numeric:true,render:r=>rpJt(PENDAPATAN_LOKASI[r.id])}
            ]}/>
        </Panel>
      </div>
    </div>
  );
}

function SuperUnits(props){
  const [edit,setEdit]=useState(null);      /* unit yang sedang diubah */
  const [detail,setDetail]=useState(null);  /* unit yang riwayatnya dibuka */
  const [draft,setDraft]=useState("available");
  const buka=u=>{setEdit(u);setDraft(u.status);};
  const simpan=()=>{
    props.setUnits(us=>us.map(u=>u.kode===edit.kode?Object.assign({},u,{status:draft}):u));
    props.notify("Status "+edit.kode+" diubah ke "+(STATUS_OPTS.find(s=>s.value===draft)||{}).label+".");
    setEdit(null);
  };
  return (
    <div className="dsx-page">
      <PageHead title="Unit Locker" desc="Semua unit di seluruh lokasi. Ubah status lewat tombol di setiap baris."/>
      <Panel elevation={1} flush>
        <DataTable rows={props.units} striped
          columns={[
            {key:"kode",header:"Kode unit",render:r=><span className="dsx-mono">{r.kode}</span>},
            {key:"lokasi",header:"Lokasi",render:r=>namaLokasi(r.lokasi)},
            {key:"mitra",header:"Mitra",render:r=>namaMitra(r.mitra)},
            {key:"komp",header:"Kompartemen",numeric:true,align:"right",render:r=>r.aktif+" / "+r.komp},
            {key:"status",header:"Status",render:r=><StatusBadge status={r.status}/>},
            {key:"aksi",header:"Aksi",align:"right",width:"320px",render:r=>(
              <span className="dsx-rowactions">
                <Button tone="outline" size="sm" onClick={()=>setDetail(r)}><Icon name="eye" size={14}/>Detail</Button>
                <Button tone="outline" size="sm" onClick={()=>buka(r)}>Ubah status</Button>
                <Button tone="ghost" size="sm" onClick={()=>props.go("config",r.kode)}>Konfigurasi</Button>
              </span>)}
          ]}
          footer={<span>{props.units.length} unit · 4 lokasi</span>}/>
      </Panel>
      <Modal open={!!detail} width="960px"
        title={detail?"Riwayat transaksi "+detail.kode:""}
        desc={detail?namaLokasi(detail.lokasi)+" · "+namaMitra(detail.mitra):""}
        onClose={()=>setDetail(null)}
        footer={<Button tone="primary" size="md" onClick={()=>setDetail(null)}>Tutup</Button>}>
        {detail?<UnitTrxTable rows={TRX.filter(t=>t.unit===detail.kode)}/>:null}
      </Modal>
      <Modal open={!!edit} title={edit?"Ubah status "+edit.kode:""} desc={edit?namaLokasi(edit.lokasi)+" · "+namaMitra(edit.mitra):""}
        onClose={()=>setEdit(null)}
        footer={<><Button tone="ghost" size="md" onClick={()=>setEdit(null)}>Batal</Button>
          <Button tone="primary" size="md" onClick={simpan}>Simpan status</Button></>}>
        <div className="dsx-statuspick">
          {STATUS_OPTS.map(o=>(
            <button type="button" key={o.value} className={"dsx-statusopt"+(draft===o.value?" on":"")} onClick={()=>setDraft(o.value)}>
              <StatusBadge status={o.value}/>
              <span className="dsx-statushint">{o.value==="maintenance"?"Unit tidak dapat disewa, tetap terlihat di kiosk."
                :o.value==="offline"?"Unit terputus dari server."
                :o.value==="occupied"?"Ada penyewa aktif di unit ini."
                :"Siap disewa penyewa berikutnya."}</span>
            </button>
          ))}
        </div>
      </Modal>
    </div>
  );
}

function SuperConfig(props){
  const [sel,setSel]=useState(props.focusUnit||props.units[0].kode);
  const unit=props.units.find(u=>u.kode===sel)||props.units[0];
  const [qr,setQr]=useState(true);
  const [kartu,setKartu]=useState(false);
  const setAktif=n=>{
    const v=Math.max(0,Math.min(unit.komp,n));
    props.setUnits(us=>us.map(u=>u.kode===unit.kode?Object.assign({},u,{aktif:v}):u));
  };
  return (
    <div className="dsx-page">
      <PageHead title="Konfigurasi Unit" desc="Pengaturan per unit: kapasitas kompartemen dan metode pembayaran."
        actions={<Button tone="primary" size="md" onClick={()=>props.notify("Konfigurasi "+unit.kode+" tersimpan.")}>Simpan konfigurasi</Button>}/>
      <Panel elevation={1}>
        <div className="dsx-configtop">
          <Field label="Pilih unit" options={props.units.map(u=>({value:u.kode,label:u.kode+" · "+namaLokasi(u.lokasi)}))}
            value={sel} onChange={e=>setSel(e.target.value)} style={{maxWidth:420}}/>
          <div className="dsx-unitmeta">
            <span className="dsx-metalabel">Status unit</span>
            <StatusBadge status={unit.status}/>
            <Button tone="ghost" size="sm" onClick={()=>props.go("units")}>Ubah di Unit Locker</Button>
          </div>
        </div>
      </Panel>
      <div className="dsx-grid2">
        <Panel title="Kompartemen aktif" description="Kompartemen nonaktif tetap terlihat di kiosk, tetapi tidak dapat disewa." elevation={1}>
          <div className="dsx-stepper">
            <Button tone="outline" size="lg" onClick={()=>setAktif(unit.aktif-1)}><Icon name="minus" size={18} label="Kurangi kompartemen aktif"/></Button>
            <div className="dsx-steppernum sl-num">{unit.aktif}</div>
            <Button tone="outline" size="lg" onClick={()=>setAktif(unit.aktif+1)}><Icon name="plus" size={18} label="Tambah kompartemen aktif"/></Button>
            <span className="dsx-steppernote">dari {unit.komp} kompartemen terpasang</span>
          </div>
        </Panel>
        <Panel title="Metode pembayaran" description="Status perangkat dibaca dari unit setiap 60 detik." elevation={1}>
          <div className="dsx-togglelist">
            <div className="dsx-togglerow">
              <div>
                <div className="dsx-toggletitle">Pembayaran QRIS</div>
                <div className="dsx-hw ok"><span className="dsx-hwdot"></span>Modul QRIS terhubung · firmware 2.4.1</div>
              </div>
              <Switch on={qr} label="Aktifkan pembayaran QRIS" onClick={()=>{setQr(v=>!v);props.notify("Pembayaran QRIS "+(qr?"dinonaktifkan":"diaktifkan")+" untuk "+unit.kode+".");}}/>
            </div>
            <div className="dsx-togglerow">
              <div>
                <div className="dsx-toggletitle">Pembayaran kartu</div>
                <div className="dsx-hw bad"><span className="dsx-hwdot"></span>Pembaca kartu tidak terdeteksi · Tiket #2291</div>
              </div>
              <Switch on={kartu} label="Aktifkan pembayaran kartu" onClick={()=>{setKartu(v=>!v);props.notify("Pembayaran kartu "+(kartu?"dinonaktifkan":"diaktifkan")+" untuk "+unit.kode+".");}}/>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}

const PARTNER_KOSONG = {id:"",nama:"",pic:"",kontak:"",lokasi:[],unit:0};

function SuperPartners(props){
  const [form,setForm]=useState(null);
  const [err,setErr]=useState("");
  const set=(k,v)=>setForm(f=>Object.assign({},f,{[k]:v}));
  const simpan=()=>{
    if(!form.nama||!form.pic||!form.kontak||!form.lokasi.length){setErr("Nama mitra, PIC, kontak, dan minimal satu lokasi wajib diisi.");return;}
    props.setPartners(ps=>form.id
      ? ps.map(p=>p.id===form.id?form:p)
      : ps.concat([Object.assign({},form,{id:"mitra-"+(ps.length+1)})]));
    props.notify(form.id?"Data mitra "+form.nama+" diperbarui.":"Mitra "+form.nama+" ditambahkan.");
    setErr("");setForm(null);
  };
  return (
    <div className="dsx-page">
      <PageHead title="Partner" desc="Mitra properti yang menempatkan unit Sewa Smart Locker."
        actions={<Button tone="primary" size="md" onClick={()=>{setErr("");setForm(PARTNER_KOSONG);}}>Tambah mitra</Button>}/>
      <Panel elevation={1} flush>
        <DataTable rows={props.partners} striped
          columns={[
            {key:"nama",header:"Mitra"},
            {key:"lokasi",header:"Lokasi",wrap:true,render:r=>r.lokasi.map(namaLokasi).join(", ")},
            {key:"unit",header:"Jumlah unit",numeric:true,align:"right"},
            {key:"pic",header:"PIC"},
            {key:"kontak",header:"Kontak"},
            {key:"bagi",header:"Bagi hasil",render:()=><Ph>70 / 30</Ph>},
            {key:"aksi",header:"Aksi",align:"right",width:"120px",render:r=>(
              <span className="dsx-rowactions">
                <Button tone="outline" size="sm" onClick={()=>{setErr("");setForm(r);}}>Edit</Button>
              </span>)}
          ]}/>
      </Panel>
      <Panel title="Model bagi hasil" description="Formula belum final — angka di tabel hanya contoh." elevation={1} tone="sunken">
        <PhBox height={140} label="Formula bagi hasil per mitra" note="Menunggu keputusan bisnis: flat percentage, tiered by revenue, atau sewa tempat tetap."/>
      </Panel>
      <Modal open={!!form} title={form&&form.id?"Edit mitra":"Tambah mitra"} desc="Bagi hasil belum dapat diatur di prototipe ini."
        onClose={()=>setForm(null)}
        footer={<><Button tone="ghost" size="md" onClick={()=>setForm(null)}>Batal</Button>
          <Button tone="primary" size="md" onClick={simpan}>Simpan mitra</Button></>}>
        {form ? (
          <>
            <div className="dsx-form">
              <Field label="Nama mitra" value={form.nama} onChange={e=>set("nama",e.target.value)} placeholder="PT Contoh Properti" required/>
              <Field label="Nama PIC" value={form.pic} onChange={e=>set("pic",e.target.value)} placeholder="Nama lengkap" required/>
              <Field label="Kontak PIC" value={form.kontak} onChange={e=>set("kontak",e.target.value)} placeholder="pic@mitra.id" required/>
              <Field label="Jumlah unit" type="number" value={String(form.unit)} onChange={e=>set("unit",Number(e.target.value)||0)}/>
            </div>
            <div className="dsx-multilabel">Lokasi mitra <span className="dsx-req">wajib</span></div>
            <LokasiPicker value={form.lokasi} onChange={v=>set("lokasi",v)}/>
            {err?<div className="dsx-err">{err}</div>:<div className="dsx-hint">Bagi hasil tetap ditandai placeholder sampai model bisnis final.</div>}
          </>
        ) : null}
      </Modal>
    </div>
  );
}

function SuperReports(props){
  const [from,setFrom]=useState("2026-08-01");
  const [to,setTo]=useState("2026-08-03");
  const [busy,exportNow]=useExport(props.notify);
  const rows=TRX.filter(t=>inRange(t,from,to));
  const total=rows.reduce((a,t)=>a+t.nominal,0);
  return (
    <div className="dsx-page">
      <PageHead title="Laporan" desc="Rekap nilai transaksi seluruh lokasi per rentang tanggal."/>
      <Panel elevation={1}>
        <DateRange from={from} to={to} onFrom={setFrom} onTo={setTo}>
          <Button tone="ghost" size="md" onClick={()=>{setFrom("2026-08-01");setTo("2026-08-03");}}>Atur ulang</Button>
          <Button tone="outline" size="md" disabled={!!busy} onClick={()=>exportNow("CSV")}>{busy==="CSV"?"Menyiapkan…":"Export CSV"}</Button>
          <Button tone="secondary" size="md" disabled={!!busy} onClick={()=>exportNow("PDF")}>{busy==="PDF"?"Menyiapkan…":"Export PDF"}</Button>
        </DateRange>
      </Panel>
      <div className="dsx-grid3">
        <StatCard label="Transaksi pada rentang" value={rows.length} accent="primary" caption="Seluruh lokasi"/>
        <StatCard label="Nilai transaksi" value={rpJt(total)} accent="available" caption="Sebelum bagi hasil"/>
        <StatCard label="Rata-rata per transaksi" value={rpJt(rows.length?Math.round(total/rows.length):0)} accent="accent" caption="Pada rentang terpilih"/>
      </div>
      <div className="dsx-note">Riwayat transaksi per unit ada di halaman <strong>Unit Locker</strong> — gunakan tombol "Detail" pada baris unit. Export di atas tetap mencakup seluruh lokasi pada rentang terpilih.</div>
    </div>
  );
}

const AKUN_KOSONG = {id:"",nama:"",email:"",lokasi:[]};

function SuperUsers(props){
  const [form,setForm]=useState(null);
  const [hapus,setHapus]=useState(null);
  const [err,setErr]=useState("");
  const set=(k,v)=>setForm(f=>Object.assign({},f,{[k]:v}));
  const simpan=()=>{
    if(!form.nama||!form.email||!form.lokasi.length){setErr("Nama, email, dan minimal satu lokasi wajib diisi.");return;}
    props.setAkun(a=>form.id?a.map(x=>x.id===form.id?form:x):a.concat([Object.assign({},form,{id:"u"+(a.length+1)})]));
    props.notify(form.id?"Akun "+form.nama+" diperbarui.":"Akun mitra "+form.nama+" ditambahkan.");
    setErr("");setForm(null);
  };
  return (
    <div className="dsx-page">
      <PageHead title="Manajemen User" desc="Akun mitra dan lokasi yang ditugaskan kepada mereka."
        actions={<Button tone="primary" size="md" onClick={()=>{setErr("");setForm(AKUN_KOSONG);}}>Tambah mitra baru</Button>}/>
      <Panel elevation={1} flush>
        <DataTable rows={props.akun} striped
          columns={[
            {key:"nama",header:"Nama mitra"},
            {key:"email",header:"Email"},
            {key:"lokasi",header:"Lokasi ditugaskan",wrap:true,render:r=>(
              <span className="dsx-taglist">{r.lokasi.map(id=><span className="dsx-tag" key={id}>{namaLokasi(id)}</span>)}</span>)},
            {key:"aksi",header:"Aksi",align:"right",width:"180px",render:r=>(
              <span className="dsx-rowactions">
                <Button tone="outline" size="sm" onClick={()=>{setErr("");setForm(r);}}>Edit</Button>
                <Button tone="danger" size="sm" onClick={()=>setHapus(r)}>Hapus</Button>
              </span>)}
          ]}
          footer={<span>{props.akun.length} akun mitra terdaftar</span>}/>
      </Panel>
      <Modal open={!!form} title={form&&form.id?"Edit akun mitra":"Tambah mitra baru"}
        desc="Mitra hanya dapat melihat lokasi yang ditugaskan di sini."
        onClose={()=>setForm(null)}
        footer={<><Button tone="ghost" size="md" onClick={()=>setForm(null)}>Batal</Button>
          <Button tone="primary" size="md" onClick={simpan}>Simpan mitra</Button></>}>
        {form ? (
          <>
            <div className="dsx-form">
              <Field label="Nama mitra" value={form.nama} onChange={e=>set("nama",e.target.value)} placeholder="PT Contoh Properti" required/>
              <Field label="Email akun" type="email" value={form.email} onChange={e=>set("email",e.target.value)} placeholder="pic@mitra.id" required/>
            </div>
            <div className="dsx-multilabel">Penugasan lokasi <span className="dsx-req">wajib</span></div>
            <LokasiPicker value={form.lokasi} onChange={v=>set("lokasi",v)}/>
            {err?<div className="dsx-err">{err}</div>:<div className="dsx-hint">Bisa memilih beberapa lokasi sekaligus.</div>}
          </>
        ) : null}
      </Modal>
      <Modal open={!!hapus} width="480px" title="Hapus akun mitra?"
        desc={hapus?hapus.nama+" akan kehilangan akses ke dashboard seketika.":""}
        onClose={()=>setHapus(null)}
        footer={<><Button tone="ghost" size="md" onClick={()=>setHapus(null)}>Batal</Button>
          <Button tone="danger" size="md" onClick={()=>{props.setAkun(a=>a.filter(x=>x.id!==hapus.id));props.notify("Akun "+hapus.nama+" dihapus.");setHapus(null);}}>Hapus akun</Button></>}>
        <div className="dsx-hint">Riwayat transaksi lokasi tersebut tetap tersimpan dan hanya dapat diakses tim internal.</div>
      </Modal>
    </div>
  );
}

Object.assign(window,{SuperOverview,SuperUnits,SuperConfig,SuperPartners,SuperReports,SuperUsers});
