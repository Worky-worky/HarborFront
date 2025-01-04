import type { Metadata } from "next";
import { Inter, Geist, Geist_Mono, IBM_Plex_Serif } from "next/font/google";


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <main>
    {children}
   </main>
  );
}
