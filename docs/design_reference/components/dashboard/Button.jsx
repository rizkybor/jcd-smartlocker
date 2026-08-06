import React from "react";

const TONE = {
  primary:{bg:"var(--sl-primary)",fg:"#fff",bd:"var(--sl-primary)",hover:"var(--sl-primary-hover)"},
  secondary:{bg:"var(--sl-secondary)",fg:"#fff",bd:"var(--sl-secondary)",hover:"var(--sl-secondary-hover)"},
  outline:{bg:"#fff",fg:"var(--sl-primary)",bd:"var(--sl-border-strong)",hover:"var(--sl-n-50)"},
  ghost:{bg:"transparent",fg:"var(--sl-text-body)",bd:"transparent",hover:"var(--sl-n-100)"},
  danger:{bg:"var(--sl-status-offline)",fg:"#fff",bd:"var(--sl-status-offline)",hover:"var(--sl-status-offline-strong)"}
};
const SIZE = {sm:{h:32,fs:"var(--sl-fs-13)",px:12},md:{h:40,fs:"var(--sl-fs-14)",px:16},lg:{h:48,fs:"var(--sl-fs-16)",px:22}};

export function Button(props){
  const t = TONE[props.tone||"primary"], s = SIZE[props.size||"md"];
  const d = !!props.disabled;
  return (
    <button type="button" disabled={d} onClick={props.onClick}
      style={Object.assign({
        display:"inline-flex",alignItems:"center",justifyContent:"center",gap:8,
        height:s.h,padding:"0 "+s.px+"px",width:props.fullWidth?"100%":undefined,
        font:"var(--sl-fw-semibold) "+s.fs+"/1 var(--sl-font-body)",
        color:d?"var(--sl-text-faint)":t.fg,background:d?"var(--sl-n-100)":t.bg,
        border:"var(--sl-border-w) solid "+(d?"var(--sl-n-200)":t.bd),
        borderRadius:"var(--sl-radius-sm)",
        boxShadow:props.tone==="ghost"||d?"none":"var(--sl-elev-1)",
        cursor:d?"not-allowed":"pointer",
        transition:"background var(--sl-dur-fast) var(--sl-ease-standard),transform var(--sl-dur-instant) var(--sl-ease-standard)"
      },props.style)}
      onMouseEnter={e=>{if(!d)e.currentTarget.style.background=t.hover;}}
      onMouseLeave={e=>{if(!d)e.currentTarget.style.background=t.bg;}}
      onPointerDown={e=>{if(!d)e.currentTarget.style.transform="scale(.98)";}}
      onPointerUp={e=>{if(!d)e.currentTarget.style.transform="scale(1)";}}>
      {props.icon ? <span aria-hidden="true" style={{display:"inline-flex"}}>{props.icon}</span> : null}
      {props.children}
    </button>
  );
}
