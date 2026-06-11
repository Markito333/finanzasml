'use client'

import { createContext, useContext, useState, useCallback, ReactNode } from 'react'
import { XMarkIcon, CheckCircleIcon, ExclamationCircleIcon, InformationCircleIcon } from '@heroicons/react/24/outline'

type TipoToast = 'success' | 'error' | 'info'

interface Toast {
  id: string
  mensaje: string
  tipo: TipoToast
}

interface ToastContextType {
  mostrarToast: (mensaje: string, tipo?: TipoToast) => void
}

const ToastContext = createContext<ToastContextType | null>(null)

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider')
  return ctx
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const mostrarToast = useCallback((mensaje: string, tipo: TipoToast = 'info') => {
    const id = crypto.randomUUID?.() ?? Date.now().toString()
    setToasts((prev) => [...prev, { id, mensaje, tipo }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 3000)
  }, [])

  const eliminarToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const iconos: Record<TipoToast, ReactNode> = {
    success: <CheckCircleIcon className="w-5 h-5 text-emerald-500" />,
    error: <ExclamationCircleIcon className="w-5 h-5 text-red-400" />,
    info: <InformationCircleIcon className="w-5 h-5 text-zinc-500" />,
  }

  return (
    <ToastContext.Provider value={{ mostrarToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto flex items-center gap-3 px-4 py-3 bg-white/90 backdrop-blur-xl border border-zinc-100/50 rounded-xl shadow-sm animate-slide-up"
          >
            {iconos[t.tipo]}
            <p className="text-sm text-zinc-700 flex-1">{t.mensaje}</p>
            <button onClick={() => eliminarToast(t.id)}
              className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-lg hover:bg-zinc-100 transition-colors flex-shrink-0">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
