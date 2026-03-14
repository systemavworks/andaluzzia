import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import './globals.css';
import Script from 'next/script';

const inter    = Inter({ subsets: ['latin'], variable: '--font-inter' });
const playfair = Playfair_Display({ subsets: ['latin'], variable: '--font-playfair' });

export const viewport: Viewport = {
  width:            'device-width',
  initialScale:     1,
  themeColor:       '#7C2D12',
};

export const metadata: Metadata = {
  title:       'Andaluzzia - Restaurante Sevillano Auténtico | Triana',
  description: 'Tapas tradicionales, Cruzcampo y el mejor ambiente sevillano. Reserva tu mesa en Andaluzzia.es',
  keywords:    ['restaurante sevilla', 'tapas', 'triana', 'andaluzzia', 'cruzcampo'],
  openGraph: {
    title:       'Andaluzzia - Sabor de Sevilla',
    description: 'Restaurante tradicional sevillano en Triana',
    images:      ['/images/andaluzzia-og.jpg'],
    url:         'https://andaluzzia.es',
    type:        'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={`${inter.variable} ${playfair.variable} font-sans`}>
        {children}
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');`}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
