import React from "react";

const TONE = {
  primary:{bg:"var(--sl-primary)",fg:"#fff",border:"var(--sl-primary)",lift:"var(--sl-primary-press)"},
  secondary:{bg:"var(--sl-secondary)",fg:"#fff",border:"var(--sl-secondary)",lift:"var(--sl-secondary-press)"},
  neutral:{bg:"#fff",fg:"var(--sl-text-strong)",border:"var(--sl-border-kiosk)",lift:"var(--sl-n-200)"},
  danger:{bg:"var(--sl-status-offline)",fg:"#fff",border:"var(--sl-status-offline)",lift:"var(--sl-status-offline-strong)"},
  success:{bg:"var(--sl-status-available)",fg:"#fff",border:"var(--sl-status-available)",lift:"var(--sl-status-available-strong)"}
};
const SIZE = {
  md:{h:"var(--sl-touch-min)",fs:"var(--sl-kiosk-fs-label)",px:"var(--sl-space-8)"},
  lg:{h:"var(--sl-touch-comfort)",fs:"var(--sl-kiosk-fs-label)",px:"var(--sl-space-10)"},
  xl:{h:"var(--sl-touch-cta)",fs:"var(--sl-kiosk-fs-title)",px:"var(--sl-space-12)"}
};

export function KioskButton(props){
  const tone = TONE[props.tone || "primary"];
  const size = SIZE[props.size || "lg"];
  const disabled = !!props.disabled;
  const lifted = props.lifted !== false && (props.tone || "primary") !== "neutral";
  return (
    <button type="button" disabled={disabled} onClick={props.onClick} aria-label={props.ariaLabel}
      style={Object.assign({
        display:"inline-flex",alignItems:"center",justifyContent:"center",gap:"var(--sl-space-4)",
        minHeight:size.h,minWidth:props.fullWidth?"100%":"var(--sl-touch-comfort)",
        width:props.fullWidth?"100%":undefined,
        padding:"0 "+size.px,
        font:"var(--sl-fw-semibold) "+size.fs+"/1 var(--sl-font-display)",
        letterSpacing:"var(--sl-ls-normal)",
        color:disabled?"var(--sl-text-faint)":tone.fg,
        background:disabled?"var(--sl-n-100)":tone.bg,
        border:"var(--sl-border-w-kiosk) solid "+(disabled?"var(--sl-n-200)":tone.border),
        borderRadius:"var(--sl-radius-lg)",
        boxShadow:disabled||!lifted?"none":"0 8px 0 "+tone.lift,
        transform:"translateY(0)",
        transition:"transform var(--sl-dur-instant) var(--sl-ease-standard),box-shadow var(--sl-dur-instant) var(--sl-ease-standard),background var(--sl-dur-fast) var(--sl-ease-standard)",
        cursor:disabled?"not-allowed":"pointer",WebkitTapHighlightColor:"transparent",touchAction:"manipulation"
      }, props.style)}
      onPointerDown={e=>{if(disabled)return;e.currentTarget.style.transform="translateY(6px)";e.currentTarget.style.boxShadow=lifted?"0 2px 0 "+tone.lift:"none";}}
      onPointerUp={e=>{if(disabled)return;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=lifted?"0 8px 0 "+tone.lift:"none";}}
      onPointerLeave={e=>{if(disabled)return;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow=lifted?"0 8px 0 "+tone.lift:"none";}}>
      {props.icon ? <span aria-hidden="true" style={{fontSize:"1.1em",lineHeight:1,display:"inline-flex"}}>{props.icon}</span> : null}
      <span>{props.children}</span>
    </button>
  );
}
