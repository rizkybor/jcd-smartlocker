import React from "react";

export function StatCard(props){
  const dir = props.deltaDirection || "flat";
  const dc = dir==="up"?"var(--sl-status-available-strong)":dir==="down"?"var(--sl-status-offline-strong)":"var(--sl-text-muted)";
  const arrow = dir==="up"?"\u2191":dir==="down"?"\u2193":"\u2192";
  const accent = props.accent || "primary";
  const accentColor = accent==="accent"?"var(--sl-accent)":accent==="available"?"var(--sl-status-available)":accent==="occupied"?"var(--sl-status-occupied)":accent==="offline"?"var(--sl-status-offline)":"var(--sl-secondary)";
  return (
    <div style={Object.assign({
      position:"relative",background:"var(--sl-surface-card)",
      border:"var(--sl-border-w) solid var(--sl-border)",borderRadius:"var(--sl-radius-md)",
      boxShadow:"var(--sl-elev-1)",padding:"var(--sl-space-5) var(--sl-space-6)",minWidth:200,overflow:"hidden"
    },props.style)}>
      <span aria-hidden="true" style={{position:"absolute",left:0,right:0,top:0,height:3,background:accentColor}}></span>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
        <span style={{fontSize:"var(--sl-fs-12)",fontWeight:"var(--sl-fw-semibold)",letterSpacing:"var(--sl-ls-caps)",textTransform:"uppercase",color:"var(--sl-text-muted)"}}>{props.label}</span>
        {props.badge}
      </div>
      <div style={{marginTop:"var(--sl-space-3)",display:"flex",alignItems:"baseline",gap:"var(--sl-space-2)"}}>
        <span style={{fontFamily:"var(--sl-font-display)",fontSize:"var(--sl-fs-30)",fontWeight:"var(--sl-fw-bold)",color:"var(--sl-text-strong)",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{props.value}</span>
        {props.unit ? <span style={{fontSize:"var(--sl-fs-14)",color:"var(--sl-text-muted)",fontWeight:"var(--sl-fw-medium)"}}>{props.unit}</span> : null}
      </div>
      {props.delta || props.caption ? (
        <div style={{marginTop:"var(--sl-space-3)",display:"flex",alignItems:"center",gap:"var(--sl-space-2)",fontSize:"var(--sl-fs-13)"}}>
          {props.delta ? <span style={{color:dc,fontWeight:"var(--sl-fw-semibold)"}}>{arrow} {props.delta}</span> : null}
          {props.caption ? <span style={{color:"var(--sl-text-faint)"}}>{props.caption}</span> : null}
        </div>) : null}
    </div>
  );
}
