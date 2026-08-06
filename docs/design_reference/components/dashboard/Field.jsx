import React from "react";

export function Field(props){
  const invalid = !!props.error;
  const base = {
    width:"100%",height:props.multiline?undefined:40,minHeight:props.multiline?96:undefined,
    padding:props.multiline?"10px 12px":"0 12px",
    font:"var(--sl-fw-medium) var(--sl-fs-14)/1.4 var(--sl-font-body)",
    color:"var(--sl-text-strong)",background:props.disabled?"var(--sl-n-50)":"#fff",
    border:"var(--sl-border-w) solid "+(invalid?"var(--sl-status-offline)":"var(--sl-border-strong)"),
    borderRadius:"var(--sl-radius-sm)",boxShadow:"var(--sl-elev-inset)",
    outline:"none",transition:"border-color var(--sl-dur-fast) var(--sl-ease-standard),box-shadow var(--sl-dur-fast) var(--sl-ease-standard)"
  };
  const focus = e=>{e.currentTarget.style.borderColor="var(--sl-secondary)";e.currentTarget.style.boxShadow="var(--sl-focus)";};
  const blur = e=>{e.currentTarget.style.borderColor=invalid?"var(--sl-status-offline)":"var(--sl-border-strong)";e.currentTarget.style.boxShadow="var(--sl-elev-inset)";};
  const common = {value:props.value,onChange:props.onChange,disabled:props.disabled,placeholder:props.placeholder,style:base,onFocus:focus,onBlur:blur};
  return (
    <label style={Object.assign({display:"block",width:"100%"},props.style)}>
      {props.label ? (
        <span style={{display:"flex",gap:4,marginBottom:6,fontSize:"var(--sl-fs-13)",fontWeight:"var(--sl-fw-semibold)",color:"var(--sl-text-body)"}}>
          {props.label}{props.required ? <span style={{color:"var(--sl-status-offline)"}}>*</span> : null}
        </span>) : null}
      {props.options
        ? <select {...common}>{props.options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}</select>
        : props.multiline
          ? <textarea {...common} rows={props.rows||3} />
          : <input {...common} type={props.type||"text"} />}
      {props.error
        ? <span style={{display:"block",marginTop:6,fontSize:"var(--sl-fs-12)",fontWeight:"var(--sl-fw-semibold)",color:"var(--sl-status-offline-strong)"}}>{props.error}</span>
        : props.hint ? <span style={{display:"block",marginTop:6,fontSize:"var(--sl-fs-12)",color:"var(--sl-text-muted)"}}>{props.hint}</span> : null}
    </label>
  );
}
