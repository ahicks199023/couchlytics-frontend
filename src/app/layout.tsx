// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import React from 'react'
import ClientLayout from '@/components/ClientLayout'
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Couchlytics',
  description: 'Madden League Management Platform',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground`}>
        <Toaster position="top-right" richColors expand={true} />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  )
}

