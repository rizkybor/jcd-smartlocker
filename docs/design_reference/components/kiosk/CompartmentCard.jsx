import React from "react";

const STATE = {
  available:{label:"Tersedia",bg:"var(--sl-status-available-tint)",bar:"var(--sl-status-available)",fg:"var(--sl-status-available-strong)",border:"var(--sl-status-available)"},
  occupied:{label:"Terisi",bg:"var(--sl-status-occupied-tint)",bar:"var(--sl-status-occupied)",fg:"var(--sl-status-occupied-strong)",border:"var(--sl-status-occupied)"},
  offline:{label:"Maintenance",bg:"var(--sl-status-offline-tint)",bar:"var(--sl-status-offline)",fg:"var(--sl-status-offline-strong)",border:"var(--sl-status-offline)"},
  selected:{label:"Dipilih",bg:"var(--sl-primary)",bar:"var(--sl-spark)",fg:"#fff",border:"var(--sl-ink-navy)"}
};
const SIZE_LABEL = {s:"Kecil",m:"Sedang",l:"Besar",xl:"Ekstra"};

export function CompartmentCard(props){
  const key = props.selected ? "selected" : (props.state || "available");
  const s = STATE[key];
  const clickable = !!props.onClick && props.state === "available";
  return (
    <button type="button" disabled={!clickable && !props.selected} onClick={props.onClick}
      aria-pressed={props.selected ? "true" : "false"}
      style={Object.assign({
        position:"relative",textAlign:"left",appearance:"none",
        minWidth:200,minHeight:"var(--sl-touch-comfort)",
        padding:"var(--sl-space-5) var(--sl-space-5) var(--sl-space-5) var(--sl-space-6)",
        background:s.bg,color:s.fg,
        border:(props.selected?"var(--sl-border-w-selected)":"var(--sl-border-w-kiosk)")+" solid "+s.border,
        borderRadius:"var(--sl-radius-lg)",
        fontFamily:"var(--sl-font-display)",overflow:"hidden",
        cursor:clickable?"pointer":"default",
        transition:"transform var(--sl-dur-fast) var(--sl-ease-standard),background var(--sl-dur-base) var(--sl-ease-standard)",
        transform:props.selected?"translateY(-2px)":"none"
      },props.style)}>
      <span aria-hidden="true" style={{position:"absolute",left:0,top:0,bottom:0,width:8,background:s.bar}}></span>
      <div style={{display:"flex",alignItems:"baseline",justifyContent:"space-between",gap:"var(--sl-space-4)"}}>
        <span style={{fontSize:"var(--sl-kiosk-fs-hero)",fontWeight:"var(--sl-fw-bold)",lineHeight:1,fontVariantNumeric:"tabular-nums"}}>{props.id}</span>
        <span style={{fontSize:"var(--sl-kiosk-fs-caption)",fontWeight:"var(--sl-fw-semibold)",opacity:.9}}>{SIZE_LABEL[props.size||"m"]}</span>
      </div>
      <div style={{marginTop:"var(--sl-space-3)",display:"flex",alignItems:"center",gap:"var(--sl-space-2)",fontSize:"var(--sl-kiosk-fs-caption)",fontWeight:"var(--sl-fw-semibold)"}}>
        <span aria-hidden="true" style={{width:14,height:14,borderRadius:"var(--sl-radius-pill)",background:s.bar,display:"inline-block"}}></span>
        {props.statusLabel || s.label}
      </div>
      {props.meta ? <div style={{marginTop:"var(--sl-space-2)",fontSize:"var(--sl-kiosk-fs-caption)",fontWeight:"var(--sl-fw-regular)",opacity:.85}}>{props.meta}</div> : null}
    </button>
  );
}
