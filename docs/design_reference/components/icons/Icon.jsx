import React from "react";

/* Lucide SVGs live in assets/icons/. The mask technique keeps them monochrome and
   makes them inherit text colour, with no build step and no CDN. */
export const ICON_NAMES = ["activity","arrow-left","arrow-right","banknote","bell","building-2","calendar","chart-column","check","chevron-down","chevron-left","chevron-right","chevron-up","circle-alert","circle-check","circle-x","clock","cpu","credit-card","delete","door-closed","door-open","download","dumbbell","ellipsis-vertical","eye","grid-2x2","hand","house","info","key-round","layout-grid","list","lock","lock-open","log-out","map-pin","monitor","nfc","package","package-open","panel-left","plus","power","qr-code","receipt","refresh-cw","scan-line","search","settings","shield-check","shopping-bag","smartphone","table","timer","trending-down","trending-up","triangle-alert","user","users","wallet","wifi-off","wrench","x","zap"];

export function iconBase(){
  return (typeof window !== "undefined" && window.SL_ICON_BASE) || "assets/icons";
}

export function Icon(props){
  const size = props.size || 20;
  const base = props.basePath || iconBase();
  const url = base.replace(/\/$/,"") + "/" + props.name + ".svg";
  return (
    <span role={props.label?"img":"presentation"} aria-label={props.label} aria-hidden={props.label?undefined:"true"}
      style={Object.assign({
        display:"inline-block",flex:"0 0 auto",
        width:size,height:size,
        backgroundColor:props.color || "currentColor",
        WebkitMask:"url("+url+") center/contain no-repeat",
        mask:"url("+url+") center/contain no-repeat",
        verticalAlign:"middle"
      },props.style)}></span>
  );
}
