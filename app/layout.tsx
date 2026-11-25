import type { Metadata } from "next";
import "./globals.css";
import {LanguageProvider,LanguageSwitcher} from "@/components/language-provider";
export const metadata:Metadata={title:"SR Certification — Sunlight Readability",description:"Independent sunlight readability certification for smartphones."};
export default function RootLayout({children}:{children:React.ReactNode}){
 return <html lang="en"><body><LanguageProvider><div className="global-language"><LanguageSwitcher/></div>{children}</LanguageProvider></body></html>;
}
