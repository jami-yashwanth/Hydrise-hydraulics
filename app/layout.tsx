import React from "react"
import type { Metadata } from 'next'
import { Instrument_Sans, Instrument_Serif, JetBrains_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const instrumentSans = Instrument_Sans({ 
  subsets: ["latin"],
  variable: '--font-instrument'
});

const instrumentSerif = Instrument_Serif({ 
  subsets: ["latin"],
  weight: "400",
  variable: '--font-instrument-serif'
});

const jetbrainsMono = JetBrains_Mono({ 
  subsets: ["latin"],
  variable: '--font-jetbrains'
});

export const metadata: Metadata = {
  title: 'Hydrise Hydraulics',
  description: 'Hard chrome plating for hydraulic piston rods, cylinder shafts, valve spools, and industrial components. Autonagar, Visakhapatnam. Based in Autonagar, Visakhapatnam.',
  generator: 'v0.app',
  openGraph: {
    title: 'Hydrise Hydraulics',
    description: 'Hard chrome plating for hydraulic piston rods, cylinder shafts, valve spools, and industrial components. Autonagar, Visakhapatnam. Autonagar, Visakhapatnam. Call: +91 77022 03575',
    url: 'https://www.hydrisehydraulics.com',
    siteName: 'Hydrise Hydraulics',
    images: [
      {
        url: '/logo.png',
        width: 1024,
        height: 1024,
        alt: 'Hydrise Hydraulics',
      },
    ],
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${instrumentSans.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable} font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
