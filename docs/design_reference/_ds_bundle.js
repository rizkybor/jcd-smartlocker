/* @ds-bundle: {"format":4,"namespace":"SewaSmartLockerDesignSystem_2be940","components":[{"name":"Button","sourcePath":"components/dashboard/Button.jsx"},{"name":"DataTable","sourcePath":"components/dashboard/DataTable.jsx"},{"name":"Field","sourcePath":"components/dashboard/Field.jsx"},{"name":"Panel","sourcePath":"components/dashboard/Panel.jsx"},{"name":"Sidebar","sourcePath":"components/dashboard/Sidebar.jsx"},{"name":"StatCard","sourcePath":"components/dashboard/StatCard.jsx"},{"name":"StatusBadge","sourcePath":"components/dashboard/StatusBadge.jsx"},{"name":"ICON_NAMES","sourcePath":"components/icons/Icon.jsx"},{"name":"Icon","sourcePath":"components/icons/Icon.jsx"},{"name":"CompartmentCard","sourcePath":"components/kiosk/CompartmentCard.jsx"},{"name":"IdleScreen","sourcePath":"components/kiosk/IdleScreen.jsx"},{"name":"KioskButton","sourcePath":"components/kiosk/KioskButton.jsx"},{"name":"Numpad","sourcePath":"components/kiosk/Numpad.jsx"},{"name":"QRScreen","sourcePath":"components/kiosk/QRScreen.jsx"},{"name":"StepProgress","sourcePath":"components/kiosk/StepProgress.jsx"},{"name":"DoorTransition","sourcePath":"components/motion/DoorTransition.jsx"},{"name":"StatusPulse","sourcePath":"components/motion/StatusPulse.jsx"},{"name":"SuccessBurst","sourcePath":"components/motion/SuccessBurst.jsx"}],"sourceHashes":{"components/dashboard/Button.jsx":"b8bd7ce6109a","components/dashboard/DataTable.jsx":"946261eed1ef","components/dashboard/Field.jsx":"f827a047d34e","components/dashboard/Panel.jsx":"3dd4133fd496","components/dashboard/Sidebar.jsx":"be2e4c44c78c","components/dashboard/StatCard.jsx":"2d3a15a874ae","components/dashboard/StatusBadge.jsx":"f3303e5e881f","components/icons/Icon.jsx":"5673a6cb8e70","components/kiosk/CompartmentCard.jsx":"fb7f117140cf","components/kiosk/IdleScreen.jsx":"27e413c4e3b3","components/kiosk/KioskButton.jsx":"b34716a7ae43","components/kiosk/Numpad.jsx":"a6bc253040aa","components/kiosk/QRScreen.jsx":"14df2eb18d2d","components/kiosk/StepProgress.jsx":"40842f4bc843","components/motion/DoorTransition.jsx":"ce50dfd94463","components/motion/StatusPulse.jsx":"6d2c0960dda6","components/motion/SuccessBurst.jsx":"1a9e7a34f5d1"},"inlinedExternals":[],"unexposedExports":[{"name":"iconBase","sourcePath":"components/icons/Icon.jsx"}]} */

(() => {

const __ds_ns = (window.SewaSmartLockerDesignSystem_2be940 = window.SewaSmartLockerDesignSystem_2be940 || {});

const __ds_scope = {};

(__ds_ns.__errors = __ds_ns.__errors || []);

// components/dashboard/Button.jsx
try { (() => {
const TONE = {
  primary: {
    bg: "var(--sl-primary)",
    fg: "#fff",
    bd: "var(--sl-primary)",
    hover: "var(--sl-primary-hover)"
  },
  secondary: {
    bg: "var(--sl-secondary)",
    fg: "#fff",
    bd: "var(--sl-secondary)",
    hover: "var(--sl-secondary-hover)"
  },
  outline: {
    bg: "#fff",
    fg: "var(--sl-primary)",
    bd: "var(--sl-border-strong)",
    hover: "var(--sl-n-50)"
  },
  ghost: {
    bg: "transparent",
    fg: "var(--sl-text-body)",
    bd: "transparent",
    hover: "var(--sl-n-100)"
  },
  danger: {
    bg: "var(--sl-status-offline)",
    fg: "#fff",
    bd: "var(--sl-status-offline)",
    hover: "var(--sl-status-offline-strong)"
  }
};
const SIZE = {
  sm: {
    h: 32,
    fs: "var(--sl-fs-13)",
    px: 12
  },
  md: {
    h: 40,
    fs: "var(--sl-fs-14)",
    px: 16
  },
  lg: {
    h: 48,
    fs: "var(--sl-fs-16)",
    px: 22
  }
};
function Button(props) {
  const t = TONE[props.tone || "primary"],
    s = SIZE[props.size || "md"];
  const d = !!props.disabled;
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: d,
    onClick: props.onClick,
    style: Object.assign({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: s.h,
      padding: "0 " + s.px + "px",
      width: props.fullWidth ? "100%" : undefined,
      font: "var(--sl-fw-semibold) " + s.fs + "/1 var(--sl-font-body)",
      color: d ? "var(--sl-text-faint)" : t.fg,
      background: d ? "var(--sl-n-100)" : t.bg,
      border: "var(--sl-border-w) solid " + (d ? "var(--sl-n-200)" : t.bd),
      borderRadius: "var(--sl-radius-sm)",
      boxShadow: props.tone === "ghost" || d ? "none" : "var(--sl-elev-1)",
      cursor: d ? "not-allowed" : "pointer",
      transition: "background var(--sl-dur-fast) var(--sl-ease-standard),transform var(--sl-dur-instant) var(--sl-ease-standard)"
    }, props.style),
    onMouseEnter: e => {
      if (!d) e.currentTarget.style.background = t.hover;
    },
    onMouseLeave: e => {
      if (!d) e.currentTarget.style.background = t.bg;
    },
    onPointerDown: e => {
      if (!d) e.currentTarget.style.transform = "scale(.98)";
    },
    onPointerUp: e => {
      if (!d) e.currentTarget.style.transform = "scale(1)";
    }
  }, props.icon ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      display: "inline-flex"
    }
  }, props.icon) : null, props.children);
}
Object.assign(__ds_scope, { Button });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/Button.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/DataTable.jsx
try { (() => {
function DataTable(props) {
  const cols = props.columns || [];
  const rows = props.rows || [];
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({
      width: "100%",
      overflowX: "auto"
    }, props.style)
  }, /*#__PURE__*/React.createElement("table", {
    style: {
      width: "100%",
      borderCollapse: "collapse",
      fontFamily: "var(--sl-font-body)",
      fontSize: "var(--sl-fs-14)"
    }
  }, /*#__PURE__*/React.createElement("thead", null, /*#__PURE__*/React.createElement("tr", null, cols.map((c, i) => /*#__PURE__*/React.createElement("th", {
    key: i,
    style: {
      textAlign: c.align || "left",
      padding: "var(--sl-space-3) var(--sl-space-5)",
      background: "var(--sl-n-50)",
      borderBottom: "var(--sl-border-w) solid var(--sl-border)",
      fontSize: "var(--sl-fs-12)",
      fontWeight: "var(--sl-fw-bold)",
      letterSpacing: "var(--sl-ls-caps)",
      textTransform: "uppercase",
      color: "var(--sl-text-muted)",
      whiteSpace: "nowrap",
      width: c.width
    }
  }, c.header)))), /*#__PURE__*/React.createElement("tbody", null, rows.map((r, ri) => /*#__PURE__*/React.createElement("tr", {
    key: ri,
    onClick: props.onRowClick ? () => props.onRowClick(r, ri) : undefined,
    style: {
      cursor: props.onRowClick ? "pointer" : "default",
      background: props.striped && ri % 2 ? "var(--sl-n-25)" : "transparent",
      transition: "background var(--sl-dur-fast) var(--sl-ease-standard)"
    },
    onMouseEnter: e => {
      e.currentTarget.style.background = "var(--sl-primary-tint)";
    },
    onMouseLeave: e => {
      e.currentTarget.style.background = props.striped && ri % 2 ? "var(--sl-n-25)" : "transparent";
    }
  }, cols.map((c, ci) => /*#__PURE__*/React.createElement("td", {
    key: ci,
    style: {
      textAlign: c.align || "left",
      padding: (props.density === "compact" ? "var(--sl-space-2)" : "var(--sl-space-4)") + " var(--sl-space-5)",
      borderBottom: "var(--sl-border-w) solid var(--sl-border)",
      color: ci === 0 ? "var(--sl-text-strong)" : "var(--sl-text-body)",
      fontWeight: ci === 0 ? "var(--sl-fw-semibold)" : "var(--sl-fw-regular)",
      fontVariantNumeric: c.numeric ? "tabular-nums" : "normal",
      fontFamily: c.numeric ? "var(--sl-font-display)" : "inherit",
      whiteSpace: c.wrap ? "normal" : "nowrap"
    }
  }, c.render ? c.render(r) : r[c.key])))))), props.footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "var(--sl-space-4) var(--sl-space-5)",
      fontSize: "var(--sl-fs-13)",
      color: "var(--sl-text-muted)"
    }
  }, props.footer) : null);
}
Object.assign(__ds_scope, { DataTable });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/DataTable.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/Field.jsx
try { (() => {
function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function Field(props) {
  const invalid = !!props.error;
  const base = {
    width: "100%",
    height: props.multiline ? undefined : 40,
    minHeight: props.multiline ? 96 : undefined,
    padding: props.multiline ? "10px 12px" : "0 12px",
    font: "var(--sl-fw-medium) var(--sl-fs-14)/1.4 var(--sl-font-body)",
    color: "var(--sl-text-strong)",
    background: props.disabled ? "var(--sl-n-50)" : "#fff",
    border: "var(--sl-border-w) solid " + (invalid ? "var(--sl-status-offline)" : "var(--sl-border-strong)"),
    borderRadius: "var(--sl-radius-sm)",
    boxShadow: "var(--sl-elev-inset)",
    outline: "none",
    transition: "border-color var(--sl-dur-fast) var(--sl-ease-standard),box-shadow var(--sl-dur-fast) var(--sl-ease-standard)"
  };
  const focus = e => {
    e.currentTarget.style.borderColor = "var(--sl-secondary)";
    e.currentTarget.style.boxShadow = "var(--sl-focus)";
  };
  const blur = e => {
    e.currentTarget.style.borderColor = invalid ? "var(--sl-status-offline)" : "var(--sl-border-strong)";
    e.currentTarget.style.boxShadow = "var(--sl-elev-inset)";
  };
  const common = {
    value: props.value,
    onChange: props.onChange,
    disabled: props.disabled,
    placeholder: props.placeholder,
    style: base,
    onFocus: focus,
    onBlur: blur
  };
  return /*#__PURE__*/React.createElement("label", {
    style: Object.assign({
      display: "block",
      width: "100%"
    }, props.style)
  }, props.label ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "flex",
      gap: 4,
      marginBottom: 6,
      fontSize: "var(--sl-fs-13)",
      fontWeight: "var(--sl-fw-semibold)",
      color: "var(--sl-text-body)"
    }
  }, props.label, props.required ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--sl-status-offline)"
    }
  }, "*") : null) : null, props.options ? /*#__PURE__*/React.createElement("select", common, props.options.map(o => /*#__PURE__*/React.createElement("option", {
    key: o.value,
    value: o.value
  }, o.label))) : props.multiline ? /*#__PURE__*/React.createElement("textarea", _extends({}, common, {
    rows: props.rows || 3
  })) : /*#__PURE__*/React.createElement("input", _extends({}, common, {
    type: props.type || "text"
  })), props.error ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 6,
      fontSize: "var(--sl-fs-12)",
      fontWeight: "var(--sl-fw-semibold)",
      color: "var(--sl-status-offline-strong)"
    }
  }, props.error) : props.hint ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "block",
      marginTop: 6,
      fontSize: "var(--sl-fs-12)",
      color: "var(--sl-text-muted)"
    }
  }, props.hint) : null);
}
Object.assign(__ds_scope, { Field });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/Field.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/Panel.jsx
try { (() => {
const ELEV = {
  0: "var(--sl-elev-0)",
  1: "var(--sl-elev-1)",
  2: "var(--sl-elev-2)",
  3: "var(--sl-elev-3)",
  4: "var(--sl-elev-4)",
  5: "var(--sl-elev-5)"
};
function Panel(props) {
  const e = props.elevation === undefined ? 1 : props.elevation;
  const pad = props.padding === undefined ? "var(--sl-space-6)" : props.padding;
  return /*#__PURE__*/React.createElement("section", {
    style: Object.assign({
      background: props.tone === "sunken" ? "var(--sl-surface-sunken)" : "var(--sl-surface-card)",
      border: "var(--sl-border-w) solid var(--sl-border)",
      borderRadius: "var(--sl-radius-md)",
      boxShadow: ELEV[e],
      overflow: "hidden"
    }, props.style)
  }, props.title || props.actions ? /*#__PURE__*/React.createElement("header", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: "var(--sl-space-4)",
      padding: "var(--sl-space-5) var(--sl-space-6)",
      borderBottom: "var(--sl-border-w) solid var(--sl-border)"
    }
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("h3", {
    style: {
      fontSize: "var(--sl-fs-16)",
      fontWeight: "var(--sl-fw-semibold)"
    }
  }, props.title), props.description ? /*#__PURE__*/React.createElement("p", {
    style: {
      margin: "4px 0 0",
      fontSize: "var(--sl-fs-13)",
      color: "var(--sl-text-muted)"
    }
  }, props.description) : null), props.actions) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      padding: props.flush ? 0 : pad
    }
  }, props.children));
}
Object.assign(__ds_scope, { Panel });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/Panel.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/Sidebar.jsx
try { (() => {
function Sidebar(props) {
  const items = props.items || [];
  const collapsed = !!props.collapsed;
  return /*#__PURE__*/React.createElement("nav", {
    style: Object.assign({
      width: collapsed ? "var(--sl-sidebar-w-collapsed)" : "var(--sl-sidebar-w)",
      flex: "0 0 auto",
      height: "100%",
      minHeight: 480,
      display: "flex",
      flexDirection: "column",
      background: "var(--sl-surface-inverse)",
      color: "var(--sl-text-on-dark)",
      fontFamily: "var(--sl-font-body)",
      transition: "width var(--sl-dur-base) var(--sl-ease-standard)"
    }, props.style)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: 10,
      padding: "var(--sl-space-5) var(--sl-space-5)",
      borderBottom: "1px solid rgba(255,255,255,.1)",
      minHeight: 72
    }
  }, props.logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: props.logoSrc,
    alt: "Sewa Smart Locker",
    style: {
      height: 28,
      flex: "0 0 auto"
    }
  }) : null, !collapsed ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--sl-font-display)",
      fontSize: "var(--sl-fs-14)",
      fontWeight: "var(--sl-fw-semibold)",
      color: "#fff",
      whiteSpace: "nowrap"
    }
  }, props.title || "Admin Console") : null), /*#__PURE__*/React.createElement("div", {
    style: {
      flex: 1,
      padding: "var(--sl-space-4) var(--sl-space-3)",
      display: "flex",
      flexDirection: "column",
      gap: 2,
      overflowY: "auto"
    }
  }, items.map((it, i) => it.section ? collapsed ? /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      height: 1,
      background: "rgba(255,255,255,.1)",
      margin: "var(--sl-space-3) var(--sl-space-2)"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      padding: "var(--sl-space-4) var(--sl-space-3) var(--sl-space-2)",
      fontSize: "var(--sl-fs-11)",
      fontWeight: "var(--sl-fw-bold)",
      letterSpacing: "var(--sl-ls-caps)",
      textTransform: "uppercase",
      color: "rgba(234,240,255,.45)"
    }
  }, it.section) : /*#__PURE__*/React.createElement("button", {
    key: i,
    type: "button",
    onClick: () => props.onSelect && props.onSelect(it.id),
    title: it.label,
    style: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      width: "100%",
      height: 44,
      padding: "0 var(--sl-space-3)",
      appearance: "none",
      textAlign: "left",
      background: props.activeId === it.id ? "var(--sl-secondary)" : "transparent",
      color: props.activeId === it.id ? "#fff" : "rgba(234,240,255,.78)",
      border: "none",
      borderRadius: "var(--sl-radius-sm)",
      cursor: "pointer",
      font: "var(--sl-fw-" + (props.activeId === it.id ? "semibold" : "medium") + ") var(--sl-fs-14)/1 var(--sl-font-body)",
      transition: "background var(--sl-dur-fast) var(--sl-ease-standard)"
    },
    onMouseEnter: e => {
      if (props.activeId !== it.id) e.currentTarget.style.background = "rgba(255,255,255,.08)";
    },
    onMouseLeave: e => {
      if (props.activeId !== it.id) e.currentTarget.style.background = "transparent";
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 20,
      textAlign: "center",
      flex: "0 0 auto",
      fontSize: "var(--sl-fs-16)"
    }
  }, it.icon), !collapsed ? /*#__PURE__*/React.createElement("span", {
    style: {
      flex: 1,
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
    }
  }, it.label) : null, !collapsed && it.badge ? /*#__PURE__*/React.createElement("span", {
    style: {
      padding: "2px 8px",
      borderRadius: "var(--sl-radius-pill)",
      background: "var(--sl-status-offline)",
      color: "#fff",
      fontSize: "var(--sl-fs-11)",
      fontWeight: "var(--sl-fw-bold)"
    }
  }, it.badge) : null))), props.footer ? /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--sl-space-4) var(--sl-space-5)",
      borderTop: "1px solid rgba(255,255,255,.1)",
      fontSize: "var(--sl-fs-12)",
      color: "rgba(234,240,255,.6)"
    }
  }, props.footer) : null);
}
Object.assign(__ds_scope, { Sidebar });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/Sidebar.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/StatCard.jsx
try { (() => {
function StatCard(props) {
  const dir = props.deltaDirection || "flat";
  const dc = dir === "up" ? "var(--sl-status-available-strong)" : dir === "down" ? "var(--sl-status-offline-strong)" : "var(--sl-text-muted)";
  const arrow = dir === "up" ? "\u2191" : dir === "down" ? "\u2193" : "\u2192";
  const accent = props.accent || "primary";
  const accentColor = accent === "accent" ? "var(--sl-accent)" : accent === "available" ? "var(--sl-status-available)" : accent === "occupied" ? "var(--sl-status-occupied)" : accent === "offline" ? "var(--sl-status-offline)" : "var(--sl-secondary)";
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({
      position: "relative",
      background: "var(--sl-surface-card)",
      border: "var(--sl-border-w) solid var(--sl-border)",
      borderRadius: "var(--sl-radius-md)",
      boxShadow: "var(--sl-elev-1)",
      padding: "var(--sl-space-5) var(--sl-space-6)",
      minWidth: 200,
      overflow: "hidden"
    }, props.style)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 0,
      right: 0,
      top: 0,
      height: 3,
      background: accentColor
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 8
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--sl-fs-12)",
      fontWeight: "var(--sl-fw-semibold)",
      letterSpacing: "var(--sl-ls-caps)",
      textTransform: "uppercase",
      color: "var(--sl-text-muted)"
    }
  }, props.label), props.badge), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-3)",
      display: "flex",
      alignItems: "baseline",
      gap: "var(--sl-space-2)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontFamily: "var(--sl-font-display)",
      fontSize: "var(--sl-fs-30)",
      fontWeight: "var(--sl-fw-bold)",
      color: "var(--sl-text-strong)",
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums"
    }
  }, props.value), props.unit ? /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--sl-fs-14)",
      color: "var(--sl-text-muted)",
      fontWeight: "var(--sl-fw-medium)"
    }
  }, props.unit) : null), props.delta || props.caption ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-3)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sl-space-2)",
      fontSize: "var(--sl-fs-13)"
    }
  }, props.delta ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: dc,
      fontWeight: "var(--sl-fw-semibold)"
    }
  }, arrow, " ", props.delta) : null, props.caption ? /*#__PURE__*/React.createElement("span", {
    style: {
      color: "var(--sl-text-faint)"
    }
  }, props.caption) : null) : null);
}
Object.assign(__ds_scope, { StatCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/StatCard.jsx", error: String((e && e.message) || e) }); }

// components/dashboard/StatusBadge.jsx
try { (() => {
const MAP = {
  online: {
    label: "Online",
    dot: "var(--sl-status-available)",
    bg: "var(--sl-status-available-tint)",
    fg: "var(--sl-status-available-strong)"
  },
  available: {
    label: "Tersedia",
    dot: "var(--sl-status-available)",
    bg: "var(--sl-status-available-tint)",
    fg: "var(--sl-status-available-strong)"
  },
  occupied: {
    label: "Terisi",
    dot: "var(--sl-status-occupied)",
    bg: "var(--sl-status-occupied-tint)",
    fg: "var(--sl-status-occupied-strong)"
  },
  maintenance: {
    label: "Maintenance",
    dot: "var(--sl-status-offline)",
    bg: "var(--sl-status-offline-tint)",
    fg: "var(--sl-status-offline-strong)"
  },
  offline: {
    label: "Offline",
    dot: "var(--sl-status-offline)",
    bg: "var(--sl-status-offline-tint)",
    fg: "var(--sl-status-offline-strong)"
  },
  idle: {
    label: "Nonaktif",
    dot: "var(--sl-status-neutral)",
    bg: "var(--sl-status-neutral-tint)",
    fg: "var(--sl-n-600)"
  }
};
function StatusBadge(props) {
  const m = MAP[props.status] || MAP.idle;
  const solid = !!props.solid;
  const big = props.size === "lg";
  return /*#__PURE__*/React.createElement("span", {
    style: Object.assign({
      display: "inline-flex",
      alignItems: "center",
      gap: big ? 8 : 6,
      height: big ? 32 : 24,
      padding: big ? "0 12px" : "0 10px",
      borderRadius: "var(--sl-radius-pill)",
      background: solid ? m.dot : m.bg,
      color: solid ? "#fff" : m.fg,
      border: "1px solid " + (solid ? m.dot : "transparent"),
      font: "var(--sl-fw-semibold) " + (big ? "var(--sl-fs-14)" : "var(--sl-fs-12)") + "/1 var(--sl-font-body)",
      whiteSpace: "nowrap"
    }, props.style)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: big ? 10 : 8,
      height: big ? 10 : 8,
      borderRadius: "var(--sl-radius-pill)",
      background: solid ? "rgba(255,255,255,.9)" : m.dot,
      boxShadow: props.pulse ? "0 0 0 4px " + (solid ? "rgba(255,255,255,.25)" : m.bg) : "none"
    }
  }), props.children || m.label);
}
Object.assign(__ds_scope, { StatusBadge });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/dashboard/StatusBadge.jsx", error: String((e && e.message) || e) }); }

// components/icons/Icon.jsx
try { (() => {
/* Lucide SVGs live in assets/icons/. The mask technique keeps them monochrome and
   makes them inherit text colour, with no build step and no CDN. */
const ICON_NAMES = ["activity", "arrow-left", "arrow-right", "banknote", "bell", "building-2", "calendar", "chart-column", "check", "chevron-down", "chevron-left", "chevron-right", "chevron-up", "circle-alert", "circle-check", "circle-x", "clock", "cpu", "credit-card", "delete", "door-closed", "door-open", "download", "dumbbell", "ellipsis-vertical", "eye", "grid-2x2", "hand", "house", "info", "key-round", "layout-grid", "list", "lock", "lock-open", "log-out", "map-pin", "monitor", "nfc", "package", "package-open", "panel-left", "plus", "power", "qr-code", "receipt", "refresh-cw", "scan-line", "search", "settings", "shield-check", "shopping-bag", "smartphone", "table", "timer", "trending-down", "trending-up", "triangle-alert", "user", "users", "wallet", "wifi-off", "wrench", "x", "zap"];
function iconBase() {
  return typeof window !== "undefined" && window.SL_ICON_BASE || "assets/icons";
}
function Icon(props) {
  const size = props.size || 20;
  const base = props.basePath || iconBase();
  const url = base.replace(/\/$/, "") + "/" + props.name + ".svg";
  return /*#__PURE__*/React.createElement("span", {
    role: props.label ? "img" : "presentation",
    "aria-label": props.label,
    "aria-hidden": props.label ? undefined : "true",
    style: Object.assign({
      display: "inline-block",
      flex: "0 0 auto",
      width: size,
      height: size,
      backgroundColor: props.color || "currentColor",
      WebkitMask: "url(" + url + ") center/contain no-repeat",
      mask: "url(" + url + ") center/contain no-repeat",
      verticalAlign: "middle"
    }, props.style)
  });
}
Object.assign(__ds_scope, { ICON_NAMES, iconBase, Icon });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/icons/Icon.jsx", error: String((e && e.message) || e) }); }

// components/kiosk/CompartmentCard.jsx
try { (() => {
const STATE = {
  available: {
    label: "Tersedia",
    bg: "var(--sl-status-available-tint)",
    bar: "var(--sl-status-available)",
    fg: "var(--sl-status-available-strong)",
    border: "var(--sl-status-available)"
  },
  occupied: {
    label: "Terisi",
    bg: "var(--sl-status-occupied-tint)",
    bar: "var(--sl-status-occupied)",
    fg: "var(--sl-status-occupied-strong)",
    border: "var(--sl-status-occupied)"
  },
  offline: {
    label: "Maintenance",
    bg: "var(--sl-status-offline-tint)",
    bar: "var(--sl-status-offline)",
    fg: "var(--sl-status-offline-strong)",
    border: "var(--sl-status-offline)"
  },
  selected: {
    label: "Dipilih",
    bg: "var(--sl-primary)",
    bar: "var(--sl-spark)",
    fg: "#fff",
    border: "var(--sl-ink-navy)"
  }
};
const SIZE_LABEL = {
  s: "Kecil",
  m: "Sedang",
  l: "Besar",
  xl: "Ekstra"
};
function CompartmentCard(props) {
  const key = props.selected ? "selected" : props.state || "available";
  const s = STATE[key];
  const clickable = !!props.onClick && props.state === "available";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: !clickable && !props.selected,
    onClick: props.onClick,
    "aria-pressed": props.selected ? "true" : "false",
    style: Object.assign({
      position: "relative",
      textAlign: "left",
      appearance: "none",
      minWidth: 200,
      minHeight: "var(--sl-touch-comfort)",
      padding: "var(--sl-space-5) var(--sl-space-5) var(--sl-space-5) var(--sl-space-6)",
      background: s.bg,
      color: s.fg,
      border: (props.selected ? "var(--sl-border-w-selected)" : "var(--sl-border-w-kiosk)") + " solid " + s.border,
      borderRadius: "var(--sl-radius-lg)",
      fontFamily: "var(--sl-font-display)",
      overflow: "hidden",
      cursor: clickable ? "pointer" : "default",
      transition: "transform var(--sl-dur-fast) var(--sl-ease-standard),background var(--sl-dur-base) var(--sl-ease-standard)",
      transform: props.selected ? "translateY(-2px)" : "none"
    }, props.style)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      left: 0,
      top: 0,
      bottom: 0,
      width: 8,
      background: s.bar
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "baseline",
      justifyContent: "space-between",
      gap: "var(--sl-space-4)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--sl-kiosk-fs-hero)",
      fontWeight: "var(--sl-fw-bold)",
      lineHeight: 1,
      fontVariantNumeric: "tabular-nums"
    }
  }, props.id), /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: "var(--sl-kiosk-fs-caption)",
      fontWeight: "var(--sl-fw-semibold)",
      opacity: .9
    }
  }, SIZE_LABEL[props.size || "m"])), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-3)",
      display: "flex",
      alignItems: "center",
      gap: "var(--sl-space-2)",
      fontSize: "var(--sl-kiosk-fs-caption)",
      fontWeight: "var(--sl-fw-semibold)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 14,
      height: 14,
      borderRadius: "var(--sl-radius-pill)",
      background: s.bar,
      display: "inline-block"
    }
  }), props.statusLabel || s.label), props.meta ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-2)",
      fontSize: "var(--sl-kiosk-fs-caption)",
      fontWeight: "var(--sl-fw-regular)",
      opacity: .85
    }
  }, props.meta) : null);
}
Object.assign(__ds_scope, { CompartmentCard });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kiosk/CompartmentCard.jsx", error: String((e && e.message) || e) }); }

// components/kiosk/IdleScreen.jsx
try { (() => {
function IdleScreen(props) {
  return /*#__PURE__*/React.createElement("div", {
    onClick: props.onWake,
    style: Object.assign({
      position: "relative",
      width: "100%",
      minHeight: 520,
      overflow: "hidden",
      background: "radial-gradient(120% 90% at 50% 0%,#1E3A8A 0%,var(--sl-ink-navy) 62%,#060F2B 100%)",
      color: "var(--sl-text-on-dark)",
      fontFamily: "var(--sl-font-display)",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--sl-space-8)",
      padding: "var(--sl-kiosk-pad)",
      textAlign: "center",
      cursor: "pointer"
    }, props.style)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      background: "repeating-linear-gradient(90deg,rgba(255,255,255,.05) 0 1px,transparent 1px 88px),repeating-linear-gradient(0deg,rgba(255,255,255,.05) 0 1px,transparent 1px 88px)"
    }
  }), props.logoSrc ? /*#__PURE__*/React.createElement("img", {
    src: props.logoSrc,
    alt: "Sewa Smart Locker",
    style: {
      height: props.logoHeight || 96,
      position: "relative"
    }
  }) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--sl-kiosk-fs-hero)",
      fontWeight: "var(--sl-fw-extrabold)",
      lineHeight: "var(--sl-lh-tight)",
      letterSpacing: "var(--sl-ls-tight)",
      color: "#fff"
    }
  }, props.headline || "Sentuh untuk Sewa Loker"), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-4)",
      fontSize: "var(--sl-kiosk-fs-body)",
      fontWeight: "var(--sl-fw-regular)",
      color: "rgba(234,240,255,.78)",
      fontFamily: "var(--sl-font-body)"
    }
  }, props.subline || "Tanpa aplikasi. Tanpa kunci. Bayar dengan QRIS.")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "flex",
      gap: "var(--sl-space-4)",
      flexWrap: "wrap",
      justifyContent: "center"
    }
  }, (props.stats || []).map((s, i) => /*#__PURE__*/React.createElement("div", {
    key: i,
    style: {
      minWidth: 180,
      padding: "var(--sl-space-5) var(--sl-space-6)",
      borderRadius: "var(--sl-radius-lg)",
      background: "rgba(255,255,255,.08)",
      border: "1px solid rgba(255,255,255,.16)",
      backdropFilter: "blur(8px)"
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--sl-kiosk-fs-title)",
      fontWeight: "var(--sl-fw-bold)",
      color: "#fff",
      fontVariantNumeric: "tabular-nums"
    }
  }, s.value), /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: 4,
      fontSize: "var(--sl-kiosk-fs-caption)",
      color: "rgba(234,240,255,.7)",
      fontFamily: "var(--sl-font-body)"
    }
  }, s.label)))), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--sl-space-3)",
      fontSize: "var(--sl-kiosk-fs-caption)",
      color: "rgba(234,240,255,.6)",
      fontFamily: "var(--sl-font-body)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      width: 12,
      height: 12,
      borderRadius: "var(--sl-radius-pill)",
      background: "var(--sl-status-available)",
      boxShadow: "0 0 0 6px rgba(22,163,74,.22)"
    }
  }), props.footnote || "Unit aktif \u00b7 PT Jendela Cakra Digital"));
}
Object.assign(__ds_scope, { IdleScreen });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kiosk/IdleScreen.jsx", error: String((e && e.message) || e) }); }

// components/kiosk/KioskButton.jsx
try { (() => {
const TONE = {
  primary: {
    bg: "var(--sl-primary)",
    fg: "#fff",
    border: "var(--sl-primary)",
    lift: "var(--sl-primary-press)"
  },
  secondary: {
    bg: "var(--sl-secondary)",
    fg: "#fff",
    border: "var(--sl-secondary)",
    lift: "var(--sl-secondary-press)"
  },
  neutral: {
    bg: "#fff",
    fg: "var(--sl-text-strong)",
    border: "var(--sl-border-kiosk)",
    lift: "var(--sl-n-200)"
  },
  danger: {
    bg: "var(--sl-status-offline)",
    fg: "#fff",
    border: "var(--sl-status-offline)",
    lift: "var(--sl-status-offline-strong)"
  },
  success: {
    bg: "var(--sl-status-available)",
    fg: "#fff",
    border: "var(--sl-status-available)",
    lift: "var(--sl-status-available-strong)"
  }
};
const SIZE = {
  md: {
    h: "var(--sl-touch-min)",
    fs: "var(--sl-kiosk-fs-label)",
    px: "var(--sl-space-8)"
  },
  lg: {
    h: "var(--sl-touch-comfort)",
    fs: "var(--sl-kiosk-fs-label)",
    px: "var(--sl-space-10)"
  },
  xl: {
    h: "var(--sl-touch-cta)",
    fs: "var(--sl-kiosk-fs-title)",
    px: "var(--sl-space-12)"
  }
};
function KioskButton(props) {
  const tone = TONE[props.tone || "primary"];
  const size = SIZE[props.size || "lg"];
  const disabled = !!props.disabled;
  const lifted = props.lifted !== false && (props.tone || "primary") !== "neutral";
  return /*#__PURE__*/React.createElement("button", {
    type: "button",
    disabled: disabled,
    onClick: props.onClick,
    "aria-label": props.ariaLabel,
    style: Object.assign({
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--sl-space-4)",
      minHeight: size.h,
      minWidth: props.fullWidth ? "100%" : "var(--sl-touch-comfort)",
      width: props.fullWidth ? "100%" : undefined,
      padding: "0 " + size.px,
      font: "var(--sl-fw-semibold) " + size.fs + "/1 var(--sl-font-display)",
      letterSpacing: "var(--sl-ls-normal)",
      color: disabled ? "var(--sl-text-faint)" : tone.fg,
      background: disabled ? "var(--sl-n-100)" : tone.bg,
      border: "var(--sl-border-w-kiosk) solid " + (disabled ? "var(--sl-n-200)" : tone.border),
      borderRadius: "var(--sl-radius-lg)",
      boxShadow: disabled || !lifted ? "none" : "0 8px 0 " + tone.lift,
      transform: "translateY(0)",
      transition: "transform var(--sl-dur-instant) var(--sl-ease-standard),box-shadow var(--sl-dur-instant) var(--sl-ease-standard),background var(--sl-dur-fast) var(--sl-ease-standard)",
      cursor: disabled ? "not-allowed" : "pointer",
      WebkitTapHighlightColor: "transparent",
      touchAction: "manipulation"
    }, props.style),
    onPointerDown: e => {
      if (disabled) return;
      e.currentTarget.style.transform = "translateY(6px)";
      e.currentTarget.style.boxShadow = lifted ? "0 2px 0 " + tone.lift : "none";
    },
    onPointerUp: e => {
      if (disabled) return;
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = lifted ? "0 8px 0 " + tone.lift : "none";
    },
    onPointerLeave: e => {
      if (disabled) return;
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = lifted ? "0 8px 0 " + tone.lift : "none";
    }
  }, props.icon ? /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      fontSize: "1.1em",
      lineHeight: 1,
      display: "inline-flex"
    }
  }, props.icon) : null, /*#__PURE__*/React.createElement("span", null, props.children));
}
Object.assign(__ds_scope, { KioskButton });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kiosk/KioskButton.jsx", error: String((e && e.message) || e) }); }

// components/kiosk/Numpad.jsx
try { (() => {
function Numpad(props) {
  const value = props.value || "";
  const len = props.length || 6;
  const keys = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "clear", "0", "back"];
  const push = k => {
    if (!props.onChange) return;
    if (k === "clear") return props.onChange("");
    if (k === "back") return props.onChange(value.slice(0, -1));
    if (value.length < len) props.onChange(value + k);
  };
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({
      width: "100%",
      maxWidth: 560,
      fontFamily: "var(--sl-font-display)"
    }, props.style)
  }, props.label ? /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--sl-kiosk-fs-body)",
      fontWeight: "var(--sl-fw-medium)",
      color: "var(--sl-text-muted)",
      marginBottom: "var(--sl-space-4)",
      textAlign: "center"
    }
  }, props.label) : null, /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      gap: "var(--sl-space-3)",
      justifyContent: "center",
      marginBottom: "var(--sl-space-8)"
    }
  }, Array.from({
    length: len
  }).map((_, i) => {
    const filled = i < value.length;
    const active = i === value.length;
    return /*#__PURE__*/React.createElement("div", {
      key: i,
      style: {
        width: 64,
        height: 88,
        borderRadius: "var(--sl-radius-md)",
        background: filled ? "var(--sl-primary-tint)" : "#fff",
        border: "var(--sl-border-w-kiosk) solid " + (active ? "var(--sl-secondary)" : "var(--sl-border-kiosk)"),
        boxShadow: active ? "var(--sl-focus)" : "none",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "var(--sl-kiosk-fs-hero)",
        fontWeight: "var(--sl-fw-bold)",
        color: "var(--sl-primary)",
        transition: "all var(--sl-dur-fast) var(--sl-ease-standard)"
      }
    }, filled ? props.mask ? "\u2022" : value[i] : "");
  })), /*#__PURE__*/React.createElement("div", {
    style: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: "var(--sl-touch-gap)"
    }
  }, keys.map(k => /*#__PURE__*/React.createElement(__ds_scope.KioskButton, {
    key: k,
    tone: k === "clear" || k === "back" ? "neutral" : "secondary",
    size: "lg",
    fullWidth: true,
    ariaLabel: k === "back" ? "Hapus satu angka" : k === "clear" ? "Hapus semua" : k,
    onClick: () => push(k),
    style: k === "clear" || k === "back" ? {
      fontSize: "var(--sl-kiosk-fs-body)",
      color: "var(--sl-text-muted)"
    } : {
      fontSize: "var(--sl-kiosk-fs-hero)"
    }
  }, k === "clear" ? "HAPUS" : k === "back" ? /*#__PURE__*/React.createElement(__ds_scope.Icon, {
    name: "delete",
    size: 40,
    label: "Hapus satu angka"
  }) : k))));
}
Object.assign(__ds_scope, { Numpad });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kiosk/Numpad.jsx", error: String((e && e.message) || e) }); }

// components/kiosk/QRScreen.jsx
try { (() => {
function QRScreen(props) {
  const secs = props.secondsLeft;
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      gap: "var(--sl-space-8)",
      padding: "var(--sl-kiosk-pad)",
      width: "100%",
      background: "var(--sl-surface-kiosk)",
      fontFamily: "var(--sl-font-display)",
      textAlign: "center"
    }, props.style)
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--sl-kiosk-fs-title)",
      fontWeight: "var(--sl-fw-bold)",
      color: "var(--sl-text-strong)"
    }
  }, props.title || "Scan untuk Bayar"), props.subtitle ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-3)",
      fontSize: "var(--sl-kiosk-fs-body)",
      fontWeight: "var(--sl-fw-regular)",
      color: "var(--sl-text-muted)"
    }
  }, props.subtitle) : null), /*#__PURE__*/React.createElement("div", {
    style: {
      padding: "var(--sl-space-6)",
      background: "#fff",
      border: "var(--sl-border-w-kiosk) solid var(--sl-border-kiosk)",
      borderRadius: "var(--sl-radius-xl)"
    }
  }, props.qrSrc ? /*#__PURE__*/React.createElement("img", {
    src: props.qrSrc,
    alt: "Kode QR pembayaran",
    style: {
      display: "block",
      width: props.qrSize || 360,
      height: props.qrSize || 360,
      imageRendering: "pixelated"
    }
  }) : /*#__PURE__*/React.createElement("div", {
    "aria-label": "Tempat kode QR",
    style: {
      width: props.qrSize || 360,
      height: props.qrSize || 360,
      display: "grid",
      placeItems: "center",
      background: "repeating-conic-gradient(var(--sl-n-900) 0% 25%,#fff 0% 50%) 0 0/40px 40px",
      borderRadius: "var(--sl-radius-sm)"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      background: "#fff",
      padding: "var(--sl-space-3) var(--sl-space-4)",
      borderRadius: "var(--sl-radius-sm)",
      fontSize: "var(--sl-fs-14)",
      fontWeight: "var(--sl-fw-semibold)",
      color: "var(--sl-text-muted)",
      fontFamily: "var(--sl-font-body)"
    }
  }, "QR placeholder"))), props.amount ? /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--sl-kiosk-fs-caption)",
      color: "var(--sl-text-muted)",
      fontWeight: "var(--sl-fw-medium)"
    }
  }, "Total"), /*#__PURE__*/React.createElement("div", {
    style: {
      fontSize: "var(--sl-kiosk-fs-hero)",
      fontWeight: "var(--sl-fw-extrabold)",
      color: "var(--sl-primary)",
      fontVariantNumeric: "tabular-nums"
    }
  }, props.amount)) : null, typeof secs === "number" ? /*#__PURE__*/React.createElement("div", {
    style: {
      display: "flex",
      alignItems: "center",
      gap: "var(--sl-space-3)",
      padding: "var(--sl-space-3) var(--sl-space-6)",
      borderRadius: "var(--sl-radius-pill)",
      background: "var(--sl-status-occupied-tint)",
      color: "var(--sl-status-occupied-strong)",
      fontSize: "var(--sl-kiosk-fs-caption)",
      fontWeight: "var(--sl-fw-semibold)"
    }
  }, "Berlaku ", Math.floor(secs / 60), ":", String(secs % 60).padStart(2, "0")) : null, props.footer);
}
Object.assign(__ds_scope, { QRScreen });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kiosk/QRScreen.jsx", error: String((e && e.message) || e) }); }

// components/kiosk/StepProgress.jsx
try { (() => {
function StepProgress(props) {
  const steps = props.steps || [];
  const current = props.current || 0;
  const compact = !!props.compact;
  return /*#__PURE__*/React.createElement("ol", {
    style: Object.assign({
      display: "flex",
      alignItems: "flex-start",
      gap: 0,
      listStyle: "none",
      margin: 0,
      padding: 0,
      width: "100%",
      fontFamily: "var(--sl-font-display)"
    }, props.style)
  }, steps.map((label, i) => {
    const done = i < current,
      active = i === current;
    const dotBg = done ? "var(--sl-status-available)" : active ? "var(--sl-primary)" : "#fff";
    const dotFg = done || active ? "#fff" : "var(--sl-text-faint)";
    return /*#__PURE__*/React.createElement("li", {
      key: i,
      style: {
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        position: "relative"
      }
    }, i > 0 ? /*#__PURE__*/React.createElement("span", {
      "aria-hidden": "true",
      style: {
        position: "absolute",
        top: compact ? 18 : 26,
        right: "50%",
        width: "100%",
        height: compact ? 4 : 6,
        background: done || active ? "var(--sl-status-available)" : "var(--sl-n-200)",
        borderRadius: "var(--sl-radius-pill)",
        transition: "background var(--sl-dur-base) var(--sl-ease-standard)"
      }
    }) : null, /*#__PURE__*/React.createElement("span", {
      style: {
        position: "relative",
        zIndex: 1,
        width: compact ? 40 : 56,
        height: compact ? 40 : 56,
        borderRadius: "var(--sl-radius-pill)",
        background: dotBg,
        color: dotFg,
        border: "var(--sl-border-w-kiosk) solid " + (done ? "var(--sl-status-available)" : active ? "var(--sl-primary)" : "var(--sl-border-kiosk)"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: compact ? "var(--sl-fs-18)" : "var(--sl-kiosk-fs-body)",
        fontWeight: "var(--sl-fw-bold)",
        transition: "all var(--sl-dur-base) var(--sl-ease-standard)"
      }
    }, done ? "\u2713" : i + 1), /*#__PURE__*/React.createElement("span", {
      style: {
        marginTop: "var(--sl-space-3)",
        fontSize: compact ? "var(--sl-fs-14)" : "var(--sl-kiosk-fs-caption)",
        fontWeight: active ? "var(--sl-fw-semibold)" : "var(--sl-fw-medium)",
        color: active ? "var(--sl-text-strong)" : "var(--sl-text-muted)",
        textAlign: "center",
        maxWidth: 180
      }
    }, label));
  }));
}
Object.assign(__ds_scope, { StepProgress });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/kiosk/StepProgress.jsx", error: String((e && e.message) || e) }); }

// components/motion/DoorTransition.jsx
try { (() => {
function DoorTransition(props) {
  const open = !!props.open;
  const size = props.size || 260;
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({
      fontFamily: "var(--sl-font-display)",
      textAlign: "center"
    }, props.style)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      margin: "0 auto",
      perspective: 900
    }
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--sl-radius-lg)",
      background: "var(--sl-ink-navy)",
      display: "grid",
      placeItems: "center",
      overflow: "hidden"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * 0.22,
      fontWeight: "var(--sl-fw-bold)",
      color: open ? "var(--sl-status-available)" : "rgba(255,255,255,.25)",
      transition: "color var(--sl-dur-base) var(--sl-ease-standard)"
    }
  }, props.contentLabel || "AMBIL")), /*#__PURE__*/React.createElement("div", {
    style: {
      position: "absolute",
      inset: 0,
      transformOrigin: "left center",
      transformStyle: "preserve-3d",
      borderRadius: "var(--sl-radius-lg)",
      background: "linear-gradient(135deg,var(--sl-secondary) 0%,var(--sl-primary) 100%)",
      border: "var(--sl-border-w-selected) solid var(--sl-ink-navy)",
      boxShadow: "var(--sl-elev-3)",
      animation: (open ? "sl-door-open" : "sl-door-close") + " var(--sl-dur-door) var(--sl-ease-door) forwards",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      fontSize: size * 0.18,
      fontWeight: "var(--sl-fw-extrabold)",
      color: "#fff",
      fontVariantNumeric: "tabular-nums"
    }
  }, props.id || "A-04"), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      right: 14,
      top: "50%",
      width: 10,
      height: 44,
      marginTop: -22,
      borderRadius: "var(--sl-radius-pill)",
      background: "rgba(255,255,255,.5)"
    }
  }))), props.label ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-6)",
      fontSize: "var(--sl-kiosk-fs-body)",
      fontWeight: "var(--sl-fw-semibold)",
      color: open ? "var(--sl-status-available-strong)" : "var(--sl-text-muted)",
      transition: "color var(--sl-dur-base) var(--sl-ease-standard)"
    }
  }, props.label) : null);
}
Object.assign(__ds_scope, { DoorTransition });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motion/DoorTransition.jsx", error: String((e && e.message) || e) }); }

// components/motion/StatusPulse.jsx
try { (() => {
function StatusPulse(props) {
  const c = props.status === "occupied" ? "var(--sl-status-occupied)" : props.status === "offline" ? "var(--sl-status-offline)" : "var(--sl-status-available)";
  const size = props.size || 14;
  return /*#__PURE__*/React.createElement("span", {
    style: Object.assign({
      display: "inline-flex",
      alignItems: "center",
      gap: "var(--sl-space-2)",
      fontFamily: "var(--sl-font-body)",
      fontSize: "var(--sl-fs-13)",
      fontWeight: "var(--sl-fw-semibold)",
      color: "var(--sl-text-body)"
    }, props.style)
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "relative",
      width: size,
      height: size,
      display: "inline-block"
    }
  }, /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--sl-radius-pill)",
      background: c
    }
  }), props.live !== false ? /*#__PURE__*/React.createElement("span", {
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--sl-radius-pill)",
      background: c,
      animation: "sl-ring-out 1.8s var(--sl-ease-out) infinite"
    }
  }) : null), props.children);
}
Object.assign(__ds_scope, { StatusPulse });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motion/StatusPulse.jsx", error: String((e && e.message) || e) }); }

// components/motion/SuccessBurst.jsx
try { (() => {
function SuccessBurst(props) {
  const size = props.size || 180;
  const tone = props.tone === "brand" ? "var(--sl-primary)" : "var(--sl-status-available)";
  return /*#__PURE__*/React.createElement("div", {
    style: Object.assign({
      fontFamily: "var(--sl-font-display)",
      textAlign: "center"
    }, props.style)
  }, /*#__PURE__*/React.createElement("div", {
    style: {
      position: "relative",
      width: size,
      height: size,
      margin: "0 auto",
      display: "grid",
      placeItems: "center"
    }
  }, /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--sl-radius-pill)",
      border: "3px solid " + tone,
      animation: "sl-ring-out var(--sl-dur-celebrate) var(--sl-ease-out) forwards"
    }
  }), /*#__PURE__*/React.createElement("span", {
    "aria-hidden": "true",
    style: {
      position: "absolute",
      inset: 0,
      borderRadius: "var(--sl-radius-pill)",
      border: "3px solid " + tone,
      animation: "sl-ring-out var(--sl-dur-celebrate) var(--sl-ease-out) 160ms forwards"
    }
  }), /*#__PURE__*/React.createElement("div", {
    style: {
      width: size * 0.66,
      height: size * 0.66,
      borderRadius: "var(--sl-radius-pill)",
      background: tone,
      display: "grid",
      placeItems: "center",
      animation: "sl-success-pop var(--sl-dur-slow) var(--sl-ease-door) forwards",
      boxShadow: "var(--sl-elev-3)"
    }
  }, /*#__PURE__*/React.createElement("svg", {
    width: size * 0.34,
    height: size * 0.34,
    viewBox: "0 0 32 32",
    "aria-hidden": "true"
  }, /*#__PURE__*/React.createElement("path", {
    d: "M7 17l6 6 12-14",
    fill: "none",
    stroke: "#fff",
    strokeWidth: "4",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    style: {
      strokeDasharray: 64,
      animation: "sl-check-draw var(--sl-dur-slow) var(--sl-ease-out) 180ms forwards"
    }
  })))), props.title ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-6)",
      fontSize: "var(--sl-kiosk-fs-title)",
      fontWeight: "var(--sl-fw-bold)",
      color: "var(--sl-text-strong)",
      animation: "sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) 220ms both"
    }
  }, props.title) : null, props.detail ? /*#__PURE__*/React.createElement("div", {
    style: {
      marginTop: "var(--sl-space-3)",
      fontFamily: "var(--sl-font-body)",
      fontSize: "var(--sl-kiosk-fs-body)",
      color: "var(--sl-text-muted)",
      animation: "sl-fade-up var(--sl-dur-slow) var(--sl-ease-out) 320ms both"
    }
  }, props.detail) : null);
}
Object.assign(__ds_scope, { SuccessBurst });
})(); } catch (e) { __ds_ns.__errors.push({ path: "components/motion/SuccessBurst.jsx", error: String((e && e.message) || e) }); }

__ds_ns.Button = __ds_scope.Button;

__ds_ns.DataTable = __ds_scope.DataTable;

__ds_ns.Field = __ds_scope.Field;

__ds_ns.Panel = __ds_scope.Panel;

__ds_ns.Sidebar = __ds_scope.Sidebar;

__ds_ns.StatCard = __ds_scope.StatCard;

__ds_ns.StatusBadge = __ds_scope.StatusBadge;

__ds_ns.ICON_NAMES = __ds_scope.ICON_NAMES;

__ds_ns.Icon = __ds_scope.Icon;

__ds_ns.CompartmentCard = __ds_scope.CompartmentCard;

__ds_ns.IdleScreen = __ds_scope.IdleScreen;

__ds_ns.KioskButton = __ds_scope.KioskButton;

__ds_ns.Numpad = __ds_scope.Numpad;

__ds_ns.QRScreen = __ds_scope.QRScreen;

__ds_ns.StepProgress = __ds_scope.StepProgress;

__ds_ns.DoorTransition = __ds_scope.DoorTransition;

__ds_ns.StatusPulse = __ds_scope.StatusPulse;

__ds_ns.SuccessBurst = __ds_scope.SuccessBurst;

})();
