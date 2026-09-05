import type {Metadata} from 'next';
import './globals.css';
export const metadata:Metadata={title:'Reprise — Payment Agent Wind Tunnel',description:'Replay payment failures. Inspect the ledger. Test your safeguards before money moves.',icons:{icon:'/favicon.svg'}};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en"><body>{children}</body></html>;}
