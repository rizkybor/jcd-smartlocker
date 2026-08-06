import React from "react";

const ELEV = {0:"var(--sl-elev-0)",1:"var(--sl-elev-1)",2:"var(--sl-elev-2)",3:"var(--sl-elev-3)",4:"var(--sl-elev-4)",5:"var(--sl-elev-5)"};

export function Panel(props){
  const e = props.elevation === undefined ? 1 : props.elevation;
  const pad = props.padding === undefined ? "var(--sl-space-6)" : props.padding;
  return (
    <section style={Object.assign({
      background:props.tone==="sunken"?"var(--sl-surface-sunken)":"var(--sl-surface-card)",
      border:"var(--sl-border-w) solid var(--sl-border)",
      borderRadius:"var(--sl-radius-md)",
      boxShadow:ELEV[e],
      overflow:"hidden"
    },props.style)}>
      {props.title || props.actions ? (
        <header style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:"var(--sl-space-4)",padding:"var(--sl-space-5) var(--sl-space-6)",borderBottom:"var(--sl-border-w) solid var(--sl-border)"}}>
          <div>
            <h3 style={{fontSize:"var(--sl-fs-16)",fontWeight:"var(--sl-fw-semibold)"}}>{props.title}</h3>
            {props.description ? <p style={{margin:"4px 0 0",fontSize:"var(--sl-fs-13)",color:"var(--sl-text-muted)"}}>{props.description}</p> : null}
          </div>
          {props.actions}
        </header>) : null}
      <div style={{padding:props.flush?0:pad}}>{props.children}</div>
    </section>
  );
}
