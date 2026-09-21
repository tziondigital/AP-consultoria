import './globals.css';
import './modules.css';
import {Inter,Poppins} from 'next/font/google';

const inter=Inter({subsets:['latin'],variable:'--font-inter',display:'swap'});
const poppins=Poppins({subsets:['latin'],weight:['500','600','700','800'],variable:'--font-poppins',display:'swap'});

export const metadata={title:'AP Consultoria | RH',description:'Gestão de vagas, candidatos e entrevistas'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR" className={`${inter.variable} ${poppins.variable}`}><body>{children}</body></html>}
