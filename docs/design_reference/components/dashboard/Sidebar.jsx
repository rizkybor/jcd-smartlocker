import React from "react";

export function Sidebar(props){
  const items = props.items || [];
  const collapsed = !!props.collapsed;
  return (
    <nav style={Object.assign({
      width:collapsed?"var(--sl-sidebar-w-collapsed)":"var(--sl-sidebar-w)",
      flex:"0 0 auto",height:"100%",minHeight:480,
      display:"flex",flexDirection:"column",
      background:"var(--sl-surface-inverse)",color:"var(--sl-text-on-dark)",
      fontFamily:"var(--sl-font-body)",
      transition:"width var(--sl-dur-base) var(--sl-ease-standard)"
    },props.style)}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"var(--sl-space-5) var(--sl-space-5)",borderBottom:"1px solid rgba(255,255,255,.1)",minHeight:72}}>
        {props.logoSrc ? <img src={props.logoSrc} alt="Sewa Smart Locker" style={{height:28,flex:"0 0 auto"}} /> : null}
        {!collapsed ? <span style={{fontFamily:"var(--sl-font-display)",fontSize:"var(--sl-fs-14)",fontWeight:"var(--sl-fw-semibold)",color:"#fff",whiteSpace:"nowrap"}}>{props.title||"Admin Console"}</span> : null}
      </div>
      <div style={{flex:1,padding:"var(--sl-space-4) var(--sl-space-3)",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
        {items.map((it,i)=> it.section
          ? (collapsed ? <div key={i} style={{height:1,background:"rgba(255,255,255,.1)",margin:"var(--sl-space-3) var(--sl-space-2)"}}></div>
             : <div key={i} style={{padding:"var(--sl-space-4) var(--sl-space-3) var(--sl-space-2)",fontSize:"var(--sl-fs-11)",fontWeight:"var(--sl-fw-bold)",letterSpacing:"var(--sl-ls-caps)",textTransform:"uppercase",color:"rgba(234,240,255,.45)"}}>{it.section}</div>)
          : (
            <button key={i} type="button" onClick={()=>props.onSelect&&props.onSelect(it.id)} title={it.label}
              style={{display:"flex",alignItems:"center",gap:12,width:"100%",height:44,padding:"0 var(--sl-space-3)",appearance:"none",textAlign:"left",
                background:props.activeId===it.id?"var(--sl-secondary)":"transparent",
                color:props.activeId===it.id?"#fff":"rgba(234,240,255,.78)",
                border:"none",borderRadius:"var(--sl-radius-sm)",cursor:"pointer",
                font:"var(--sl-fw-"+(props.activeId===it.id?"semibold":"medium")+") var(--sl-fs-14)/1 var(--sl-font-body)",
                transition:"background var(--sl-dur-fast) var(--sl-ease-standard)"}}
              onMouseEnter={e=>{if(props.activeId!==it.id)e.currentTarget.style.background="rgba(255,255,255,.08)";}}
              onMouseLeave={e=>{if(props.activeId!==it.id)e.currentTarget.style.background="transparent";}}>
              <span aria-hidden="true" style={{width:20,textAlign:"center",flex:"0 0 auto",fontSize:"var(--sl-fs-16)"}}>{it.icon}</span>
              {!collapsed ? <span style={{flex:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{it.label}</span> : null}
              {!collapsed && it.badge ? <span style={{padding:"2px 8px",borderRadius:"var(--sl-radius-pill)",background:"var(--sl-status-offline)",color:"#fff",fontSize:"var(--sl-fs-11)",fontWeight:"var(--sl-fw-bold)"}}>{it.badge}</span> : null}
            </button>)
        )}
      </div>
      {props.footer ? <div style={{padding:"var(--sl-space-4) var(--sl-space-5)",borderTop:"1px solid rgba(255,255,255,.1)",fontSize:"var(--sl-fs-12)",color:"rgba(234,240,255,.6)"}}>{props.footer}</div> : null}
    </nav>
  );
}
