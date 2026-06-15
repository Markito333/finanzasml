'use client'

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react'
import { AppData, Cuenta, Transaccion, Meta, GastoFijo, IngresoFijo, Transferencia } from '@/lib/types'
import { generarId } from '@/lib/utils'

const STORAGE_KEY = 'finanzasml-data'

const DATA_VACIA: AppData = {
  cuentas: [],
  transacciones: [],
  metas: [],
  gastosFijos: [],
  ingresosFijos: [],
  transferencias: [],
}

interface AppContextType {
  data: AppData
  cargando: boolean
  agregarCuenta: (c: Omit<Cuenta, 'id'>) => void
  actualizarCuenta: (id: string, c: Partial<Cuenta>) => void
  eliminarCuenta: (id: string) => void
  agregarTransaccion: (t: Omit<Transaccion, 'id' | 'createdAt'>) => void
  actualizarTransaccion: (id: string, t: Partial<Transaccion>) => void
  eliminarTransaccion: (id: string) => void
  agregarMeta: (m: Omit<Meta, 'id' | 'createdAt'>) => void
  actualizarMeta: (id: string, m: Partial<Meta>) => void
  eliminarMeta: (id: string) => void
  agregarGastoFijo: (g: Omit<GastoFijo, 'id'>) => void
  actualizarGastoFijo: (id: string, g: Partial<GastoFijo>) => void
  eliminarGastoFijo: (id: string) => void
  agregarIngresoFijo: (g: Omit<IngresoFijo, 'id'>) => void
  actualizarIngresoFijo: (id: string, g: Partial<IngresoFijo>) => void
  eliminarIngresoFijo: (id: string) => void
  agregarTransferencia: (t: Omit<Transferencia, 'id' | 'createdAt'>) => void
  actualizarTransferencia: (id: string, t: Partial<Transferencia>) => void
  eliminarTransferencia: (id: string) => void
  importarData: (d: AppData) => void
}

const AppContext = createContext<AppContextType | null>(null)

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(DATA_VACIA)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (
          parsed &&
          typeof parsed === 'object' &&
          'cuentas' in parsed &&
          'transacciones' in parsed
        ) {
          if (!('ingresosFijos' in parsed)) {
            parsed.ingresosFijos = []
          }
          if (!('transferencias' in parsed)) {
            parsed.transferencias = []
          }
          if (parsed.gastosFijos) {
            parsed.gastosFijos = parsed.gastosFijos.map((g: any) => {
              if (!g.items) {
                const itemId = generarId()
                return {
                  ...g,
                  items: [{
                    id: itemId,
                    nombre: g.nombre || 'Item',
                    cantidad: 1,
                    precioUnitario: g.monto || 0,
                  }],
                }
              }
              return g
            })
          }
          setData(parsed)
        }
      }
    } catch {
      /* ignorar */
    }
    setCargando(false)
  }, [])

  const guardar = useCallback((nueva: AppData) => {
    setData(nueva)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva))
    } catch {
      /* ignorar */
    }
  }, [])

  const mutar = useCallback(
    (fn: (prev: AppData) => AppData) => {
      setData((prev) => {
        const nueva = fn(prev)
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(nueva))
        } catch {
          /* ignorar */
        }
        return nueva
      })
    },
    []
  )

  const agregarCuenta = useCallback(
    (c: Omit<Cuenta, 'id'>) => {
      mutar((d) => ({
        ...d,
        cuentas: [...d.cuentas, { ...c, id: generarId() }],
      }))
    },
    [mutar]
  )

  const actualizarCuenta = useCallback(
    (id: string, c: Partial<Cuenta>) => {
      mutar((d) => ({
        ...d,
        cuentas: d.cuentas.map((cu) => (cu.id === id ? { ...cu, ...c } : cu)),
      }))
    },
    [mutar]
  )

  const eliminarCuenta = useCallback(
    (id: string) => {
      mutar((d) => ({
        ...d,
        cuentas: d.cuentas.filter((c) => c.id !== id),
        transacciones: d.transacciones.filter((t) => t.cuentaId !== id),
      }))
    },
    [mutar]
  )

  const agregarTransaccion = useCallback(
    (t: Omit<Transaccion, 'id' | 'createdAt'>) => {
      mutar((d) => ({
        ...d,
        transacciones: [
          ...d.transacciones,
          {
            ...t,
            id: generarId(),
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    },
    [mutar]
  )

  const eliminarTransaccion = useCallback(
    (id: string) => {
      mutar((d) => ({
        ...d,
        transacciones: d.transacciones.filter((t) => t.id !== id),
      }))
    },
    [mutar]
  )

  const actualizarTransaccion = useCallback(
    (id: string, t: Partial<Transaccion>) => {
      mutar((d) => ({
        ...d,
        transacciones: d.transacciones.map((tx) =>
          tx.id === id ? { ...tx, ...t } : tx
        ),
      }))
    },
    [mutar]
  )

  const agregarMeta = useCallback(
    (m: Omit<Meta, 'id' | 'createdAt'>) => {
      mutar((d) => ({
        ...d,
        metas: [
          ...d.metas,
          {
            ...m,
            id: generarId(),
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    },
    [mutar]
  )

  const actualizarMeta = useCallback(
    (id: string, m: Partial<Meta>) => {
      mutar((d) => ({
        ...d,
        metas: d.metas.map((meta) =>
          meta.id === id ? { ...meta, ...m } : meta
        ),
      }))
    },
    [mutar]
  )

  const eliminarMeta = useCallback(
    (id: string) => {
      mutar((d) => ({ ...d, metas: d.metas.filter((m) => m.id !== id) }))
    },
    [mutar]
  )

  const agregarGastoFijo = useCallback(
    (g: Omit<GastoFijo, 'id'>) => {
      mutar((d) => ({
        ...d,
        gastosFijos: [...d.gastosFijos, { ...g, id: generarId() }],
      }))
    },
    [mutar]
  )

  const actualizarGastoFijo = useCallback(
    (id: string, g: Partial<GastoFijo>) => {
      mutar((d) => ({
        ...d,
        gastosFijos: d.gastosFijos.map((gf) =>
          gf.id === id ? { ...gf, ...g } : gf
        ),
      }))
    },
    [mutar]
  )

  const eliminarGastoFijo = useCallback(
    (id: string) => {
      mutar((d) => ({
        ...d,
        gastosFijos: d.gastosFijos.filter((g) => g.id !== id),
      }))
    },
    [mutar]
  )

  const agregarIngresoFijo = useCallback(
    (g: Omit<IngresoFijo, 'id'>) => {
      mutar((d) => ({
        ...d,
        ingresosFijos: [...d.ingresosFijos, { ...g, id: generarId() }],
      }))
    },
    [mutar]
  )

  const actualizarIngresoFijo = useCallback(
    (id: string, g: Partial<IngresoFijo>) => {
      mutar((d) => ({
        ...d,
        ingresosFijos: d.ingresosFijos.map((ig) =>
          ig.id === id ? { ...ig, ...g } : ig
        ),
      }))
    },
    [mutar]
  )

  const eliminarIngresoFijo = useCallback(
    (id: string) => {
      mutar((d) => ({
        ...d,
        ingresosFijos: d.ingresosFijos.filter((g) => g.id !== id),
      }))
    },
    [mutar]
  )

  const agregarTransferencia = useCallback(
    (t: Omit<Transferencia, 'id' | 'createdAt'>) => {
      mutar((d) => ({
        ...d,
        transferencias: [
          ...d.transferencias,
          {
            ...t,
            id: generarId(),
            createdAt: new Date().toISOString(),
          },
        ],
      }))
    },
    [mutar]
  )

  const actualizarTransferencia = useCallback(
    (id: string, t: Partial<Transferencia>) => {
      mutar((d) => ({
        ...d,
        transferencias: d.transferencias.map((tx) =>
          tx.id === id ? { ...tx, ...t } : tx
        ),
      }))
    },
    [mutar]
  )

  const eliminarTransferencia = useCallback(
    (id: string) => {
      mutar((d) => ({
        ...d,
        transferencias: d.transferencias.filter((t) => t.id !== id),
      }))
    },
    [mutar]
  )

  const importarData = useCallback(
    (nueva: AppData) => {
      guardar(nueva)
    },
    [guardar]
  )

  return (
    <AppContext.Provider
      value={{
        data,
        cargando,
        agregarCuenta,
        actualizarCuenta,
        eliminarCuenta,
        agregarTransaccion,
        actualizarTransaccion,
        eliminarTransaccion,
        agregarMeta,
        actualizarMeta,
        eliminarMeta,
        agregarGastoFijo,
        actualizarGastoFijo,
        eliminarGastoFijo,
        agregarIngresoFijo,
        actualizarIngresoFijo,
        eliminarIngresoFijo,
        agregarTransferencia,
        actualizarTransferencia,
        eliminarTransferencia,
        importarData,
      }}
    >
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp debe usarse dentro de AppProvider')
  return ctx
}
