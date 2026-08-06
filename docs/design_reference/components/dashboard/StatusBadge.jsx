import React from "react";

const MAP = {
  online:{label:"Online",dot:"var(--sl-status-available)",bg:"var(--sl-status-available-tint)",fg:"var(--sl-status-available-strong)"},
  available:{label:"Tersedia",dot:"var(--sl-status-available)",bg:"var(--sl-status-available-tint)",fg:"var(--sl-status-available-strong)"},
  occupied:{label:"Terisi",dot:"var(--sl-status-occupied)",bg:"var(--sl-status-occupied-tint)",fg:"var(--sl-status-occupied-strong)"},
  maintenance:{label:"Maintenance",dot:"var(--sl-status-offline)",bg:"var(--sl-status-offline-tint)",fg:"var(--sl-status-offline-strong)"},
  offline:{label:"Offline",dot:"var(--sl-status-offline)",bg:"var(--sl-status-offline-tint)",fg:"var(--sl-status-offline-strong)"},
  idle:{label:"Nonaktif",dot:"var(--sl-status-neutral)",bg:"var(--sl-status-neutral-tint)",fg:"var(--sl-n-600)"}
};

export function StatusBadge(props){
  const m = MAP[props.status] || MAP.idle;
  const solid = !!props.solid;
  const big = props.size === "lg";
  return (
    <span style={Object.assign({
      display:"inline-flex",alignItems:"center",gap:big?8:6,
      height:big?32:24,padding:big?"0 12px":"0 10px",
      borderRadius:"var(--sl-radius-pill)",
      background:solid?m.dot:m.bg,
      color:solid?"#fff":m.fg,
      border:"1px solid "+(solid?m.dot:"transparent"),
      font:"var(--sl-fw-semibold) "+(big?"var(--sl-fs-14)":"var(--sl-fs-12)")+"/1 var(--sl-font-body)",
      whiteSpace:"nowrap"
    },props.style)}>
      <span aria-hidden="true" style={{width:big?10:8,height:big?10:8,borderRadius:"var(--sl-radius-pill)",background:solid?"rgba(255,255,255,.9)":m.dot,boxShadow:props.pulse?"0 0 0 4px "+(solid?"rgba(255,255,255,.25)":m.bg):"none"}}></span>
      {props.children || m.label}
    </span>
  );
}
