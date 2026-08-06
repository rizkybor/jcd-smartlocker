import React from "react";

export function IdleScreen(props){
  return (
    <div onClick={props.onWake} style={Object.assign({
      position:"relative",width:"100%",minHeight:520,overflow:"hidden",
      background:"radial-gradient(120% 90% at 50% 0%,#1E3A8A 0%,var(--sl-ink-navy) 62%,#060F2B 100%)",
      color:"var(--sl-text-on-dark)",fontFamily:"var(--sl-font-display)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      gap:"var(--sl-space-8)",padding:"var(--sl-kiosk-pad)",textAlign:"center",cursor:"pointer"
    },props.style)}>
      <span aria-hidden="true" style={{position:"absolute",inset:0,background:"repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,transparent 1px 88px),repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 88px)"}}></span>
      {props.logoSrc ? <img src={props.logoSrc} alt="Sewa Smart Locker" style={{height:props.logoHeight||96,position:"relative"}} /> : null}
      <div style={{position:"relative"}}>
        <div style={{fontSize:"var(--sl-kiosk-fs-hero)",fontWeight:"var(--sl-fw-extrabold)",lineHeight:"var(--sl-lh-tight)",letterSpacing:"var(--sl-ls-tight)",color:"#fff"}}>{props.headline || "Sentuh untuk Sewa Loker"}</div>
        <div style={{marginTop:"var(--sl-space-4)",fontSize:"var(--sl-kiosk-fs-body)",fontWeight:"var(--sl-fw-regular)",color:"rgba(234,240,255,.78)",fontFamily:"var(--sl-font-body)"}}>{props.subline || "Tanpa aplikasi. Tanpa kunci. Bayar dengan QRIS."}</div>
      </div>
      <div style={{position:"relative",display:"flex",gap:"var(--sl-space-4)",flexWrap:"wrap",justifyContent:"center"}}>
        {(props.stats||[]).map((s,i)=>(
          <div key={i} style={{minWidth:180,padding:"var(--sl-space-5) var(--sl-space-6)",borderRadius:"var(--sl-radius-lg)",background:"rgba(255,255,255,.08)",border:"1px solid rgba(255,255,255,.16)",backdropFilter:"blur(8px)"}}>
            <div style={{fontSize:"var(--sl-kiosk-fs-title)",fontWeight:"var(--sl-fw-bold)",color:"#fff",fontVariantNumeric:"tabular-nums"}}>{s.value}</div>
            <div style={{marginTop:4,fontSize:"var(--sl-kiosk-fs-caption)",color:"rgba(234,240,255,.7)",fontFamily:"var(--sl-font-body)"}}>{s.label}</div>
          </div>
        ))}
      </div>
      <div style={{position:"relative",display:"inline-flex",alignItems:"center",gap:"var(--sl-space-3)",fontSize:"var(--sl-kiosk-fs-caption)",color:"rgba(234,240,255,.6)",fontFamily:"var(--sl-font-body)"}}>
        <span aria-hidden="true" style={{width:12,height:12,borderRadius:"var(--sl-radius-pill)",background:"var(--sl-status-available)",boxShadow:"0 0 0 6px rgba(22,163,74,.22)"}}></span>
        {props.footnote || "Unit aktif \u00b7 PT Jendela Cakra Digital"}
      </div>
    </div>
  );
}
