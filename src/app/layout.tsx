import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { XRPLProvider } from '@/components/XRPLProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CarbonLedger - Issuer Portal',
  description: 'Tokenize Real World Carbon Assets on XRPL',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <XRPLProvider>
          {children}
        </XRPLProvider>
      </body>
    </html>
  )
}
