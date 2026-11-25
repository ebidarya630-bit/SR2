import type { Metadata } from "next";
import "./globals.css";
import {LanguageSystem} from "@/components/language-system";
export const metadata:Metadata={title:"SR Certification — Sunlight Readability",description:"Independent sunlight readability certification for smartphones."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body><LanguageSystem/>{children}</body></html>;}
