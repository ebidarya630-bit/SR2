import type { Metadata } from "next";import "./globals.css";
export const metadata:Metadata={title:"SR Certification — Sunlight Readability",description:"Independent sunlight readability certification for smartphones."};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
