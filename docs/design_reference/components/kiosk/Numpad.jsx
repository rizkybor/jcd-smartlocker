import React from "react";
import { KioskButton } from "./KioskButton.jsx";
import { Icon } from "../icons/Icon.jsx";

export function Numpad(props){
  const value = props.value || "";
  const len = props.length || 6;
  const keys = ["1","2","3","4","5","6","7","8","9","clear","0","back"];
  const push = k => {
    if(!props.onChange) return;
    if(k==="clear") return props.onChange("");
    if(k==="back") return props.onChange(value.slice(0,-1));
    if(value.length < len) props.onChange(value + k);
  };
  return (
    <div style={Object.assign({width:"100%",maxWidth:560,fontFamily:"var(--sl-font-display)"},props.style)}>
      {props.label ? <div style={{fontSize:"var(--sl-kiosk-fs-body)",fontWeight:"var(--sl-fw-medium)",color:"var(--sl-text-muted)",marginBottom:"var(--sl-space-4)",textAlign:"center"}}>{props.label}</div> : null}
      <div style={{display:"flex",gap:"var(--sl-space-3)",justifyContent:"center",marginBottom:"var(--sl-space-8)"}}>
        {Array.from({length:len}).map((_,i)=>{
          const filled = i < value.length;
          const active = i === value.length;
          return (
            <div key={i} style={{
              width:64,height:88,borderRadius:"var(--sl-radius-md)",
              background:filled?"var(--sl-primary-tint)":"#fff",
              border:"var(--sl-border-w-kiosk) solid "+(active?"var(--sl-secondary)":"var(--sl-border-kiosk)"),
              boxShadow:active?"var(--sl-focus)":"none",
              display:"flex",alignItems:"center",justifyContent:"center",
              fontSize:"var(--sl-kiosk-fs-hero)",fontWeight:"var(--sl-fw-bold)",color:"var(--sl-primary)",
              transition:"all var(--sl-dur-fast) var(--sl-ease-standard)"
            }}>{filled ? (props.mask ? "\u2022" : value[i]) : ""}</div>
          );
        })}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"var(--sl-touch-gap)"}}>
        {keys.map(k=>(
          <KioskButton key={k} tone={k==="clear"||k==="back"?"neutral":"secondary"} size="lg" fullWidth
            ariaLabel={k==="back"?"Hapus satu angka":k==="clear"?"Hapus semua":k}
            onClick={()=>push(k)}
            style={k==="clear"||k==="back"?{fontSize:"var(--sl-kiosk-fs-body)",color:"var(--sl-text-muted)"}:{fontSize:"var(--sl-kiosk-fs-hero)"}}>
            {k==="clear"?"HAPUS":k==="back"?<Icon name="delete" size={40} label="Hapus satu angka" />:k}
          </KioskButton>
        ))}
      </div>
    </div>
  );
}
