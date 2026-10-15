import type { Metadata } from 'next'; import './globals.css';
export const metadata:Metadata={title:'DiamondTop — Recarga Free Fire',description:'Recarga diamantes de Free Fire con validación de jugador.'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="es"><body>{children}</body></html>}
