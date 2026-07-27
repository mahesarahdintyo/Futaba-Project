'use client'

import { useEffect, useState } from 'react'
import { Download, X, Share } from 'lucide-react'
import Image from 'next/image'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

export function PwaRegister() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstallBanner, setShowInstallBanner] = useState(false)
  const [showIosBanner, setShowIosBanner] = useState(false)

  useEffect(() => {
    // 1. Service Worker Registration
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      (window.location.protocol === 'https:' ||
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.endsWith('.local'))
    ) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/service-worker.js')
          .then((registration) => {
            console.log('PWA ServiceWorker registered with scope:', registration.scope)
          })
          .catch((err) => {
            console.error('PWA ServiceWorker registration failed:', err)
          })
      })
    }

    // 2. Listen for beforeinstallprompt (Android, Chrome, Edge, Tablet)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setShowInstallBanner(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // 3. Detect iOS Safari (iPad / iPhone)
    const isIos =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      ('standalone' in navigator && (navigator as unknown as { standalone: boolean }).standalone)

    if (isIos && !isStandalone) {
      const dismissedIos = localStorage.getItem('pwa_ios_dismissed')
      if (!dismissedIos) {
        setShowIosBanner(true)
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      console.log('User accepted PWA installation prompt')
    } else {
      console.log('User dismissed PWA installation prompt')
    }
    setDeferredPrompt(null)
    setShowInstallBanner(false)
  }

  const handleDismissBanner = () => {
    setShowInstallBanner(false)
  }

  const handleDismissIosBanner = () => {
    setShowIosBanner(false)
    localStorage.setItem('pwa_ios_dismissed', 'true')
  }

  return (
    <>
      {/* 1. Custom Install Banner for Android/Chrome/Edge/Tablet */}
      {showInstallBanner && deferredPrompt && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-center gap-3">
            <Image
              src="/icon-192.png"
              alt="PKIS Icon"
              width={48}
              height={48}
              className="rounded-xl flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-white truncate">Install Futaba PKIS</h4>
              <p className="text-xs text-slate-400">Pasang di layar utama untuk akses cepat & offline</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleInstallClick}
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-3 py-2 rounded-xl transition duration-150 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Download className="h-3.5 w-3.5" />
                <span>Install</span>
              </button>
              <button
                onClick={handleDismissBanner}
                aria-label="Tutup prompt install"
                className="text-slate-400 hover:text-white p-1 rounded-lg transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. iOS Safari Instructions Fallback */}
      {showIosBanner && (
        <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-in slide-in-from-bottom-5 duration-300">
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Share className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="flex-1 min-w-0 text-xs">
              <h4 className="font-bold text-white mb-1">Pasang Aplikasi PKIS (iOS/iPad)</h4>
              <p className="text-slate-400 leading-relaxed">
                Tekan tombol <span className="font-semibold text-emerald-400">Share</span> di browser Safari, lalu pilih <span className="font-semibold text-emerald-400">&apos;Add to Home Screen&apos;</span>.
              </p>
            </div>
            <button
              onClick={handleDismissIosBanner}
              aria-label="Tutup petunjuk iOS"
              className="text-slate-400 hover:text-white p-1 rounded-lg transition flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
