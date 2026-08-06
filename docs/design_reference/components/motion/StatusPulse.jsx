import React from "react";

export function StatusPulse(props){
  const c = props.status==="occupied"?"var(--sl-status-occupied)":props.status==="offline"?"var(--sl-status-offline)":"var(--sl-status-available)";
  const size = props.size || 14;
  return (
    <span style={Object.assign({display:"inline-flex",alignItems:"center",gap:"var(--sl-space-2)",fontFamily:"var(--sl-font-body)",fontSize:"var(--sl-fs-13)",fontWeight:"var(--sl-fw-semibold)",color:"var(--sl-text-body)"},props.style)}>
      <span aria-hidden="true" style={{position:"relative",width:size,height:size,display:"inline-block"}}>
        <span style={{position:"absolute",inset:0,borderRadius:"var(--sl-radius-pill)",background:c}}></span>
        {props.live!==false ? <span style={{position:"absolute",inset:0,borderRadius:"var(--sl-radius-pill)",background:c,animation:"sl-ring-out 1.8s var(--sl-ease-out) infinite"}}></span> : null}
      </span>
      {props.children}
    </span>
  );
}
