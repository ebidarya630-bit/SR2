"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);
  return (
    <header className="shell topbar">
      <Link className="logo" href="/" onClick={close} aria-label="SR home">SR<span>.</span></Link>
      <button className="menu-toggle" type="button" aria-label={open ? "Close navigation menu" : "Open navigation menu"} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(v => !v)}>
        <span aria-hidden="true">{open ? "×" : "☰"}</span>
      </button>
      <nav id="primary-navigation" className={open ? "nav nav-open" : "nav"} aria-label="Main navigation">
        <Link href="/phones" onClick={close}>Phone registry</Link>
        <Link href="/#standard" onClick={close}>The SR standard</Link>
        <Link href="/about" onClick={close}>About</Link>
        <Link href="/support" onClick={close}>Support</Link>
        <Link href="/brand" onClick={close}>For brands</Link>
        <Link className="btn" href="/login" onClick={close}>Sign in <span aria-hidden="true">→</span></Link>
      </nav>
    </header>
  );
}
