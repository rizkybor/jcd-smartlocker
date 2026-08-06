const DS = window.SewaSmartLockerDesignSystem_2be940;
const { KioskButton, Numpad, StepProgress } = DS;
const { useState, useEffect, useRef, useCallback } = React;

const DSPATH = "_ds/sewa-smart-locker-design-system-2be9406b-2f6f-4de9-8478-f371290a46a4/";

function rupiah(n){return "Rp " + n.toLocaleString("id-ID").replace(/,/g,".");}
function formatPhone(v){
  if(!v) return "";
  const a=v.slice(0,4),b=v.slice(4,8),c=v.slice(8,13);
  return [a,b,c].filter(Boolean).join(" ");
}
function clockPlus(minutes){
  const d=new Date(Date.now()+minutes*60000);
  return String(d.getHours()).padStart(2,"0")+":"+String(d.getMinutes()).padStart(2,"0");
}

/* 800x1280 portrait panel, scaled to the viewport */
function KioskStage(props){
  const [k,setK]=useState(1);
  useEffect(()=>{
    const fit=()=>{
      const vh=window.innerHeight-96, vw=window.innerWidth-64;
      setK(Math.min(vh/1348,vw/856,1));
    };
    fit(); window.addEventListener("resize",fit);
    return ()=>window.removeEventListener("resize",fit);
  },[]);
  return (
    <div className="kx-outer">
      <div className="kx-scale" style={{transform:"scale("+k+")"}}>
        <div className="kx-bezel">
          <div className="kx-panel">{props.children}</div>
        </div>
        <div className="kx-devbar">
          <span className="kx-devlabel">Prototipe</span>
          {props.controls}
        </div>
      </div>
    </div>
  );
}

function DevToggle(props){
  return (
    <button type="button" className={"kx-devtoggle"+(props.on?" on":"")} onClick={props.onClick}>
      <span className="kx-devdot"></span>{props.children}
    </button>
  );
}

/* Every flow screen: pinned step bar + session pill, one decision, one primary action */
function FlowScreen(props){
  return (
    <div className="kx-screen">
      <div className="kx-head">
        {props.steps ? <StepProgress steps={props.steps} current={props.current}/> : null}
        {typeof props.warn==="number" ? (
          <div className="kx-sesspill">Sesi berakhir dalam 0:{String(props.warn).padStart(2,"0")}</div>
        ) : null}
      </div>
      <div className="kx-body" style={props.bodyStyle}>
        {props.title ? <div className="kx-title">{props.title}</div> : null}
        {props.subtitle ? <div className="kx-sub">{props.subtitle}</div> : null}
        {props.children}
      </div>
      {props.footer ? <div className="kx-foot">{props.footer}</div> : null}
    </div>
  );
}

function DurationCard(props){
  const s=props.selected;
  return (
    <button type="button" onClick={props.onClick} className={"kx-durcard"+(s?" sel":"")}>
      {s ? <span className="kx-spark"></span> : null}
      <span className="kx-durleft">
        <span className="kx-durhours">{props.hours} Jam</span>
        <span className="kx-durnote">{props.note}</span>
      </span>
      <span className="kx-durprice sl-num">{rupiah(props.price)}</span>
    </button>
  );
}

/* Phone entry: 12-13 digit display + the design-system Numpad (its 6-cell echo row is hidden) */
function PhoneEntry(props){
  const v=props.value;
  return (
    <div className="kx-phonewrap">
      <div className={"kx-phonedisplay"+(props.error?" err":"")}>
        <span className="kx-phonelabel">Nomor HP</span>
        <span className="kx-phonevalue sl-num">{v?formatPhone(v):<span className="kx-phoneghost">08•• •••• ••••</span>}</span>
      </div>
      <div className="kx-phonehint">{props.error||props.hint}</div>
      <div className="sl-phonepad">
        <Numpad value={v} length={13} onChange={props.onChange}/>
      </div>
    </div>
  );
}

function UnitEyebrow(props){
  return (
    <div className="kx-eyebrow">
      <span className="kx-mono">JCD-KLP-002</span>
      <span className="kx-dotsep">·</span>
      <span>{props.text}</span>
    </div>
  );
}

Object.assign(window,{DS,DSPATH,KioskStage,DevToggle,FlowScreen,DurationCard,PhoneEntry,UnitEyebrow,rupiah,formatPhone,clockPlus});
