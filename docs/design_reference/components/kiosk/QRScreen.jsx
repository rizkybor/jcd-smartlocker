import React from "react";

export function QRScreen(props){
  const secs = props.secondsLeft;
  return (
    <div style={Object.assign({
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",
      gap:"var(--sl-space-8)",padding:"var(--sl-kiosk-pad)",width:"100%",
      background:"var(--sl-surface-kiosk)",fontFamily:"var(--sl-font-display)",textAlign:"center"
    },props.style)}>
      <div>
        <div style={{fontSize:"var(--sl-kiosk-fs-title)",fontWeight:"var(--sl-fw-bold)",color:"var(--sl-text-strong)"}}>{props.title || "Scan untuk Bayar"}</div>
        {props.subtitle ? <div style={{marginTop:"var(--sl-space-3)",fontSize:"var(--sl-kiosk-fs-body)",fontWeight:"var(--sl-fw-regular)",color:"var(--sl-text-muted)"}}>{props.subtitle}</div> : null}
      </div>
      <div style={{padding:"var(--sl-space-6)",background:"#fff",border:"var(--sl-border-w-kiosk) solid var(--sl-border-kiosk)",borderRadius:"var(--sl-radius-xl)"}}>
        {props.qrSrc
          ? <img src={props.qrSrc} alt="Kode QR pembayaran" style={{display:"block",width:props.qrSize||360,height:props.qrSize||360,imageRendering:"pixelated"}} />
          : <div aria-label="Tempat kode QR" style={{width:props.qrSize||360,height:props.qrSize||360,display:"grid",placeItems:"center",background:"repeating-conic-gradient(var(--sl-n-900) 0% 25%,#fff 0% 50%) 0 0/40px 40px",borderRadius:"var(--sl-radius-sm)"}}>
              <span style={{background:"#fff",padding:"var(--sl-space-3) var(--sl-space-4)",borderRadius:"var(--sl-radius-sm)",fontSize:"var(--sl-fs-14)",fontWeight:"var(--sl-fw-semibold)",color:"var(--sl-text-muted)",fontFamily:"var(--sl-font-body)"}}>QR placeholder</span>
            </div>}
      </div>
      {props.amount ? <div><div style={{fontSize:"var(--sl-kiosk-fs-caption)",color:"var(--sl-text-muted)",fontWeight:"var(--sl-fw-medium)"}}>Total</div><div style={{fontSize:"var(--sl-kiosk-fs-hero)",fontWeight:"var(--sl-fw-extrabold)",color:"var(--sl-primary)",fontVariantNumeric:"tabular-nums"}}>{props.amount}</div></div> : null}
      {typeof secs === "number" ? (
        <div style={{display:"flex",alignItems:"center",gap:"var(--sl-space-3)",padding:"var(--sl-space-3) var(--sl-space-6)",borderRadius:"var(--sl-radius-pill)",background:"var(--sl-status-occupied-tint)",color:"var(--sl-status-occupied-strong)",fontSize:"var(--sl-kiosk-fs-caption)",fontWeight:"var(--sl-fw-semibold)"}}>
          Berlaku {Math.floor(secs/60)}:{String(secs%60).padStart(2,"0")}
        </div>) : null}
      {props.footer}
    </div>
  );
}
