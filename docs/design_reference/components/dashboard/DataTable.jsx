import React from "react";

export function DataTable(props){
  const cols = props.columns || [];
  const rows = props.rows || [];
  return (
    <div style={Object.assign({width:"100%",overflowX:"auto"},props.style)}>
      <table style={{width:"100%",borderCollapse:"collapse",fontFamily:"var(--sl-font-body)",fontSize:"var(--sl-fs-14)"}}>
        <thead>
          <tr>
            {cols.map((c,i)=>(
              <th key={i} style={{textAlign:c.align||"left",padding:"var(--sl-space-3) var(--sl-space-5)",background:"var(--sl-n-50)",borderBottom:"var(--sl-border-w) solid var(--sl-border)",fontSize:"var(--sl-fs-12)",fontWeight:"var(--sl-fw-bold)",letterSpacing:"var(--sl-ls-caps)",textTransform:"uppercase",color:"var(--sl-text-muted)",whiteSpace:"nowrap",width:c.width}}>{c.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r,ri)=>(
            <tr key={ri} onClick={props.onRowClick?()=>props.onRowClick(r,ri):undefined}
              style={{cursor:props.onRowClick?"pointer":"default",background:props.striped&&ri%2?"var(--sl-n-25)":"transparent",transition:"background var(--sl-dur-fast) var(--sl-ease-standard)"}}
              onMouseEnter={e=>{e.currentTarget.style.background="var(--sl-primary-tint)";}}
              onMouseLeave={e=>{e.currentTarget.style.background=props.striped&&ri%2?"var(--sl-n-25)":"transparent";}}>
              {cols.map((c,ci)=>(
                <td key={ci} style={{textAlign:c.align||"left",padding:(props.density==="compact"?"var(--sl-space-2)":"var(--sl-space-4)")+" var(--sl-space-5)",borderBottom:"var(--sl-border-w) solid var(--sl-border)",color:ci===0?"var(--sl-text-strong)":"var(--sl-text-body)",fontWeight:ci===0?"var(--sl-fw-semibold)":"var(--sl-fw-regular)",fontVariantNumeric:c.numeric?"tabular-nums":"normal",fontFamily:c.numeric?"var(--sl-font-display)":"inherit",whiteSpace:c.wrap?"normal":"nowrap"}}>
                  {c.render ? c.render(r) : r[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {props.footer ? <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"var(--sl-space-4) var(--sl-space-5)",fontSize:"var(--sl-fs-13)",color:"var(--sl-text-muted)"}}>{props.footer}</div> : null}
    </div>
  );
}
