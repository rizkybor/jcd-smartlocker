import React from "react";

export function DoorTransition(props){
  const open = !!props.open;
  const size = props.size || 260;
  return (
    <div style={Object.assign({fontFamily:"var(--sl-font-display)",textAlign:"center"},props.style)}>
      <div style={{position:"relative",width:size,height:size,margin:"0 auto",perspective:900}}>
        <div style={{position:"absolute",inset:0,borderRadius:"var(--sl-radius-lg)",background:"var(--sl-ink-navy)",display:"grid",placeItems:"center",overflow:"hidden"}}>
          <span style={{fontSize:size*0.22,fontWeight:"var(--sl-fw-bold)",color:open?"var(--sl-status-available)":"rgba(255,255,255,.25)",transition:"color var(--sl-dur-base) var(--sl-ease-standard)"}}>{props.contentLabel||"AMBIL"}</span>
        </div>
        <div style={{position:"absolute",inset:0,transformOrigin:"left center",transformStyle:"preserve-3d",
          borderRadius:"var(--sl-radius-lg)",
          background:"linear-gradient(135deg,var(--sl-secondary) 0%,var(--sl-primary) 100%)",
          border:"var(--sl-border-w-selected) solid var(--sl-ink-navy)",
          boxShadow:"var(--sl-elev-3)",
          animation:(open?"sl-door-open":"sl-door-close")+" var(--sl-dur-door) var(--sl-ease-door) forwards",
          display:"grid",placeItems:"center"}}>
          <span style={{fontSize:size*0.18,fontWeight:"var(--sl-fw-extrabold)",color:"#fff",fontVariantNumeric:"tabular-nums"}}>{props.id||"A-04"}</span>
          <span aria-hidden="true" style={{position:"absolute",right:14,top:"50%",width:10,height:44,marginTop:-22,borderRadius:"var(--sl-radius-pill)",background:"rgba(255,255,255,.5)"}}></span>
        </div>
      </div>
      {props.label ? <div style={{marginTop:"var(--sl-space-6)",fontSize:"var(--sl-kiosk-fs-body)",fontWeight:"var(--sl-fw-semibold)",color:open?"var(--sl-status-available-strong)":"var(--sl-text-muted)",transition:"color var(--sl-dur-base) var(--sl-ease-standard)"}}>{props.label}</div> : null}
    </div>
  );
}
