'use client'

import { useEffect, useState } from 'react'

interface TasasData {
  usd: number
  eur: number
  mlc: number
}

export function useTasas() {
  const [tasas, setTasas] = useState<TasasData | null>(null)

  useEffect(() => {
    const fetchTasas = async () => {
      try {
        const res = await fetch('/api/tasas')
        if (!res.ok) return
        const json = await res.json()
        setTasas({ usd: json.usd, eur: json.eur, mlc: json.mlc })
      } catch {
        /* ignorar */
      }
    }

    fetchTasas()
    const interval = setInterval(fetchTasas, 300000)
    return () => clearInterval(interval)
  }, [])

  return tasas
}
