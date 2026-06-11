'use client'

import { useEffect, useState } from 'react'
import { InformationCircleIcon } from '@heroicons/react/24/outline'

interface TasasData {
  usd: number
  eur: number
  mlc: number
  date: string
  time: string
}

export default function TasasCambio() {
  const [data, setData] = useState<TasasData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const fetchTasas = async () => {
      try {
        const res = await fetch('/api/tasas')
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error || 'Error al obtener tasas')
        }
        const json = await res.json()
        setData(json)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido')
      } finally {
        setCargando(false)
      }
    }

    fetchTasas()
    const interval = setInterval(fetchTasas, 300000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="bg-white rounded-2xl border border-zinc-100/50 p-5">
      <div className="flex items-center gap-1.5 mb-3">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
          Tasas de Cambio
        </h3>
        <div className="relative group">
          <InformationCircleIcon className="w-3.5 h-3.5 text-zinc-300 cursor-help" />
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            Mercado informal cubano · elTOQUE
          </div>
        </div>
      </div>

      {cargando && (
        <div className="space-y-2 animate-pulse">
          <div className="h-8 bg-zinc-100 rounded-xl" />
          <div className="h-8 bg-zinc-100 rounded-xl" />
        </div>
      )}

      {error && (
        <div className="text-xs text-zinc-400 text-center py-3">
          <p>{error.includes('token') ? 'API no configurada' : 'No disponible'}</p>
          <p className="text-[10px] text-zinc-300 mt-0.5">
            {error.includes('token')
              ? 'Configura EL_TOQUE_API_TOKEN en .env.local'
              : 'Intenta de nuevo más tarde'}
          </p>
        </div>
      )}

      {data && !error && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-800">USD</span>
              <span className="text-[10px] text-zinc-400">/ CUP</span>
            </div>
            <span className="text-sm font-bold text-zinc-800">
              {data.usd.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-zinc-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-zinc-800">EUR</span>
              <span className="text-[10px] text-zinc-400">/ CUP</span>
            </div>
            <span className="text-sm font-bold text-zinc-800">
              {data.eur.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 text-center pt-1">
            {data.date} &middot; {data.time}
          </p>
        </div>
      )}
    </div>
  )
}
