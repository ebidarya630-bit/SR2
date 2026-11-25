"use client";
import Link from "next/link";
import {useI18n} from "@/components/language-provider";
export default function Home(){
 const {t,locale}=useI18n();
 return <><header className="shell topbar"><Link className="logo" href="/">SR<span>.</span></Link><nav className="nav"><Link href="/phones">{t.phoneDatabase}</Link><Link href="/about">{t.about}</Link><Link href="/support">{t.support}</Link><Link href="/brand">{t.forBrands}</Link><Link className="btn" href="/login">{t.signIn}</Link></nav></header><main className="shell"><section className="hero"><div className="eyebrow">{t.eyebrow}</div><h1>{t.headline1}<br/><span style={{color:"var(--orange)"}}>{t.headline2}</span></h1><p>{t.intro}</p><div className="actions"><Link className="btn" href="/phones">{t.explore}</Link><Link className="btn secondary" href="/brand">{t.brandCta}</Link></div></section><section className="section"><div className="eyebrow">{t.how}</div><h2>{t.howTitle}</h2><div className="cards"><article className="card"><h3>{t.submitTitle}</h3><p>{t.submitText}</p></article><article className="card"><h3>{t.evaluateTitle}</h3><p>{t.evaluateText}</p></article><article className="card"><h3>{t.certifyTitle}</h3><p>{t.certifyText}</p></article></div></section></main><footer className="shell footer">{t.footer.replace("{year}",String(new Date().getFullYear()))}</footer></>;
}
