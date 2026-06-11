'use client'

import { ReactNode, useEffect } from 'react'
import { XMarkIcon } from '@heroicons/react/24/outline'

interface ModalProps {
  abierto: boolean
  onCerrar: () => void
  titulo?: string
  children: ReactNode
  sinTitulo?: boolean
}

export default function Modal({ abierto, onCerrar, titulo, children, sinTitulo }: ModalProps) {
  useEffect(() => {
    if (abierto) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [abierto])

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ease-out ${
        abierto ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
      }`}
    >
      <div className="fixed inset-0 bg-black/20 backdrop-blur-sm" onClick={onCerrar} />
      <div
        className={`relative bg-white rounded-2xl shadow-xl w-full max-w-md max-h-[85vh] overflow-y-auto transition-all duration-200 ease-out ${
          abierto ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}
      >
        {!sinTitulo && (
          <div className="flex items-center justify-between px-5 pt-5 pb-2">
            <h2 className="text-lg font-semibold text-zinc-800">{titulo}</h2>
            <button onClick={onCerrar}
              className="text-zinc-400 hover:text-zinc-600 p-1 rounded-lg hover:bg-zinc-100 transition-colors">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className={sinTitulo ? 'p-5' : 'p-5 pt-3'}>{children}</div>
      </div>
    </div>
  )
}
