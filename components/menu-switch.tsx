"use client";

import type { ReactNode } from "react";

/**
 * A settings row in the header menu: an icon and a label on the left, a real
 * switch on the right. The whole row is the control (`role="switch"`, named by
 * its visible label); the track and knob only show the state, `aria-checked`
 * carries it. Pass `on` / `off` labels when the state needs a word too.
 */
export function MenuSwitch({
  icon,
  label,
  checked,
  onToggle,
  hint,
}: {
  icon: ReactNode;
  label: string;
  checked: boolean;
  onToggle: () => void;
  /** A short word under the label ("Rail only", "Anywhere"). */
  hint?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      className="nav-link menu-switch"
      aria-checked={checked}
      data-on={checked ? "true" : undefined}
      onClick={onToggle}
    >
      <span className="menu-switch-icon" aria-hidden="true">
        {icon}
      </span>
      <span className="menu-switch-copy">
        <span className="menu-switch-label">{label}</span>
        {hint ? <span className="menu-switch-hint">{hint}</span> : null}
      </span>
      <span className="switch" aria-hidden="true">
        <span className="switch-knob" />
      </span>
    </button>
  );
}
