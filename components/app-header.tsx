"use client";

import Image from 'next/image'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface AppHeaderProps {
  children?: ReactNode
  logoAside?: ReactNode
}

export function AppHeader({ children, logoAside }: AppHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <Link
              href="/"
              aria-label="Kembali ke landing page"
              className="inline-flex w-fit"
            >
              <Image
                src="/futaba-logo.png"
                alt="FUTABA Logo"
                width={150}
                height={52}
                className="object-contain h-10 sm:h-11 lg:h-12 w-auto"
                priority
              />
            </Link>
            {logoAside}
          </div>

          {children && (
            <div className="w-full sm:w-auto flex flex-col sm:flex-row gap-2">
              {children}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
