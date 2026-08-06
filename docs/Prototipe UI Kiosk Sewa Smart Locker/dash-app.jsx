const nav = (id,label,icon) => ({id:id,label:label,icon:<Icon name={icon} size={20}/>});
const SUPER_NAV = [
  {section:"Operasional"},
  nav("overview","Overview","layout-grid"),
  nav("units","Unit Locker","package"),
  nav("config","Konfigurasi Unit","settings"),
  {section:"Bisnis"},
  nav("partners","Partner","hand"),
  nav("reports","Laporan","receipt"),
  {section:"Administrasi"},
  nav("users","Manajemen User","users")
];
const MITRA_NAV = [
  nav("overview","Overview","layout-grid"),
  nav("units","Unit Locker","package"),
  nav("reports","Laporan","receipt")
];
const AKUN_DEMO = [
  {email:"admin@sewasmartlocker.id",nama:"Dimas Prayoga",role:"super",peran:"Super Admin"},
  {email:"rina@kalibataprop.id",nama:"Rina Wijaya",role:"mitra",peran:"Mitra"}
];

function Login(props){
  const [email,setEmail]=React.useState("");
  const [pass,setPass]=React.useState("");
  const [err,setErr]=React.useState("");
  const masuk=()=>{
    const akun=AKUN_DEMO.find(a=>a.email===email.trim().toLowerCase());
    if(!email||!pass){setErr("Email dan kata sandi wajib diisi.");return;}
    if(!akun){setErr("Akun tidak ditemukan. Gunakan salah satu akun demo di bawah.");return;}
    setErr(""); props.onLogin(akun);
  };
  return (
    <div className="dsx-login">
      <div className="dsx-logincard">
        <img className="dsx-loginlogo" src="assets/logo-horizontal-2x.png" alt="Sewa Smart Locker"/>
        <h1 className="dsx-logintitle">Masuk ke Dashboard</h1>
        <p className="dsx-loginsub">Konsol admin Sewa Smart Locker · PT Jendela Cakra Digital</p>
        <div className="dsx-loginform">
          <Field label="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="nama@perusahaan.id"/>
          <Field label="Kata sandi" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••"
            error={err||undefined} hint={err?undefined:"Sesi berakhir otomatis setelah 30 menit tidak aktif."}/>
          <Button tone="primary" size="lg" fullWidth onClick={masuk}>Masuk</Button>
        </div>
        <div className="dsx-demo">
          <div className="dsx-demolabel">Akun demo prototipe</div>
          {AKUN_DEMO.map(a=>(
            <button type="button" key={a.email} className="dsx-demorow" onClick={()=>{setEmail(a.email);setPass("prototipe");setErr("");}}>
              <span className="dsx-demorole">{a.peran}</span>
              <span className="dsx-demomail">{a.email}</span>
              <span className="dsx-demogo">Isi otomatis</span>
            </button>
          ))}
        </div>
      </div>
      <div className="dsx-loginnote">Prototipe UI/UX. Autentikasi, sesi, dan isolasi data antar mitra dibangun di tahap development.</div>
    </div>
  );
}

function App(){
  const [user,setUser]=React.useState(null);
  const [page,setPage]=React.useState("overview");
  const [units,setUnits]=React.useState(UNITS_SEED);
  const [akun,setAkun]=React.useState(AKUN_SEED);
  const [partners,setPartners]=React.useState(MITRA);
  const [focusUnit,setFocusUnit]=React.useState(null);
  const [toast,setToast]=React.useState("");
  const notify=React.useCallback(m=>{setToast(m);},[]);
  React.useEffect(()=>{
    if(!toast) return;
    const t=setTimeout(()=>setToast(""),2800);
    return ()=>clearTimeout(t);
  },[toast]);

  if(!user) return <Login onLogin={u=>{setUser(u);setPage("overview");}}/>;

  const isSuper = user.role==="super";
  const menu = isSuper?SUPER_NAV:MITRA_NAV;
  const shared = {units:units,setUnits:setUnits,akun:akun,setAkun:setAkun,partners:partners,setPartners:setPartners,
    notify:notify,focusUnit:focusUnit,go:(p,unit)=>{setPage(p);if(unit)setFocusUnit(unit);}};
  const PAGES = isSuper
    ? {overview:SuperOverview,units:SuperUnits,config:SuperConfig,partners:SuperPartners,reports:SuperReports,users:SuperUsers}
    : {overview:MitraOverview,units:MitraUnits,reports:MitraReports};
  const Current = PAGES[page] || PAGES.overview;
  const label = (menu.find(n=>n.id===page)||{}).label || "Overview";

  return (
    <div className="dsx-app dsx-app--mitra">
      <Sidebar items={menu} activeId={page} onSelect={setPage}
        title="" logoSrc="assets/logo-mark.png" logoHeight={44}
        footer={<button type="button" className="dsx-logout" onClick={()=>{setUser(null);setPage("overview");}}>
          <Icon name="log-out" size={18}/>Keluar
        </button>}/>
      <div className="dsx-main">
        <header className="dsx-top">
          <div className="dsx-crumb"><span>Dashboard</span><span className="dsx-sep">/</span><strong>{label}</strong></div>
          <div className="dsx-user">
            <span className="dsx-avatar" aria-hidden="true">{user.nama.split(" ").map(w=>w[0]).join("").slice(0,2)}</span>
            <span className="dsx-userlines">
              <span className="dsx-username">{user.nama}</span>
              <span className="dsx-usermeta">{isSuper?user.peran:namaLokasi(MITRA_LOKASI)}</span>
            </span>
          </div>
        </header>
        <main className="dsx-content"><Current key={page} {...shared}/></main>
      </div>
      <Toast msg={toast}/>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App/>);
