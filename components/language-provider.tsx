"use client";
import {createContext,useContext,useEffect,useMemo,useState} from "react";
import {localeNames,locales,messages,type Locale} from "@/lib/i18n";
type I18nContext={locale:Locale;setLocale:(locale:Locale)=>void;t:typeof messages.en};
const Context=createContext<I18nContext|null>(null);
export function LanguageProvider({children}:{children:React.ReactNode}){
 const [locale,setLocaleState]=useState<Locale>("en");
 useEffect(()=>{const saved=localStorage.getItem("sr2-locale") as Locale|null;if(saved&&locales.includes(saved))setLocaleState(saved);},[]);
 function setLocale(next:Locale){setLocaleState(next);localStorage.setItem("sr2-locale",next);}
 useEffect(()=>{document.documentElement.lang=locale;document.documentElement.dir=locale==="fa"||locale==="tg"?"rtl":"ltr";},[locale]);
 const value=useMemo(()=>({locale,setLocale,t:messages[locale]}),[locale]);
 return <Context.Provider value={value}>{children}</Context.Provider>;
}
export function useI18n(){const value=useContext(Context);if(!value)throw new Error("useI18n must be used inside LanguageProvider");return value;}
export function LanguageSwitcher(){const {locale,setLocale}=useI18n();return <label className="language-switcher"><span className="sr-only">Language</span><select aria-label="Language" value={locale} onChange={e=>setLocale(e.target.value as Locale)}>{locales.map(code=><option key={code} value={code}>{localeNames[code]}</option>)}</select></label>;}
