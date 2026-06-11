'use client'

import { useApp } from '@/components/AppProvider'
import { useState, useMemo } from 'react'
import { formatearMoneda, formatearFecha, obtenerColorCategoria } from '@/lib/utils'
import { ChevronLeftIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/24/outline'

const DIAS_SEMANA = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']
const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

export default function Calendario() {
  const { data } = useApp()
  const { transacciones, cuentas } = data

  const [fecha, setFecha] = useState(() => new Date())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  const anio = fecha.getFullYear()
  const mes = fecha.getMonth()

  const diasDelMes = useMemo(() => {
    const dias: (number | null)[] = []
    const primerDia = new Date(anio, mes, 1).getDay()
    const totalDias = new Date(anio, mes + 1, 0).getDate()
    for (let i = 0; i < primerDia; i++) dias.push(null)
    for (let i = 1; i <= totalDias; i++) dias.push(i)
    return dias
  }, [anio, mes])

  const transaccionesPorDia = useMemo(() => {
    const mapa: Record<string, typeof transacciones> = {}
    for (const t of transacciones) {
      if (!mapa[t.fecha]) mapa[t.fecha] = []
      mapa[t.fecha].push(t)
    }
    return mapa
  }, [transacciones])

  const transaccionesDelDia = diaSeleccionado ? (transaccionesPorDia[diaSeleccionado] || []) : []

  const transaccionesDelDiaOrdenadas = useMemo(() =>
    [...transaccionesDelDia].sort((a, b) => (a.tipo === 'gasto' ? -1 : 1)),
    [transaccionesDelDia]
  )

  const totalGastosDia = useMemo(() =>
    transaccionesDelDia.filter((t) => t.tipo === 'gasto').reduce((s, t) => s + t.monto, 0),
    [transaccionesDelDia]
  )

  const totalIngresosDia = useMemo(() =>
    transaccionesDelDia.filter((t) => t.tipo === 'ingreso').reduce((s, t) => s + t.monto, 0),
    [transaccionesDelDia]
  )

  const ingresosDelMes = useMemo(() =>
    transacciones.filter((t) => {
      const d = new Date(t.fecha + 'T00:00:00')
      return d.getMonth() === mes && d.getFullYear() === anio && t.tipo === 'ingreso'
    }).reduce((s, t) => s + t.monto, 0)
  , [transacciones, mes, anio])

  const gastosDelMes = useMemo(() =>
    transacciones.filter((t) => {
      const d = new Date(t.fecha + 'T00:00:00')
      return d.getMonth() === mes && d.getFullYear() === anio && t.tipo === 'gasto'
    }).reduce((s, t) => s + t.monto, 0)
  , [transacciones, mes, anio])

  function cambiarMes(delta: number) {
    setFecha(new Date(anio, mes + delta, 1))
    setDiaSeleccionado(null)
  }

  function formatearFechaKey(anio: number, mes: number, dia: number): string {
    return `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`
  }

  const hoyStr = new Date().toISOString().split('T')[0]

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min">
        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100/50 p-5">
          <div className="flex items-center justify-between mb-5">
            <button onClick={() => cambiarMes(-1)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
              <ChevronLeftIcon className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-semibold text-zinc-800">
              {MESES[mes]} {anio}
            </h3>
            <button onClick={() => cambiarMes(1)}
              className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
              <ChevronRightIcon className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-7 mb-1">
            {DIAS_SEMANA.map((d) => (
              <div key={d} className="text-center text-[10px] text-zinc-400 font-medium py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7">
            {diasDelMes.map((dia, i) => {
              if (dia === null) return <div key={`e-${i}`} />
              const fechaKey = formatearFechaKey(anio, mes, dia)
              const txns = transaccionesPorDia[fechaKey]
              const tieneGastos = txns?.some((t) => t.tipo === 'gasto')
              const tieneIngresos = txns?.some((t) => t.tipo === 'ingreso')
              const esHoy = fechaKey === hoyStr
              const esSeleccionado = fechaKey === diaSeleccionado

              return (
                <button
                  key={fechaKey}
                  onClick={() => setDiaSeleccionado(fechaKey === diaSeleccionado ? null : fechaKey)}
                  className={`flex flex-col items-center py-1.5 rounded-xl transition-colors text-sm ${
                    esSeleccionado
                      ? 'bg-zinc-100'
                      : esHoy
                        ? 'bg-zinc-50'
                        : 'hover:bg-zinc-50'
                  }`}
                >
                  <span className={`font-medium ${esHoy ? 'text-zinc-900' : 'text-zinc-600'}`}>{dia}</span>
                  {(tieneGastos || tieneIngresos) && (
                    <div className="flex gap-0.5 mt-0.5">
                      {tieneGastos && <div className="w-1 h-1 rounded-full bg-red-400" />}
                      {tieneIngresos && <div className="w-1 h-1 rounded-full bg-emerald-400" />}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Resumen del Mes</h3>
          </div>
          <div className="space-y-3">
            <div>
              <p className="text-[10px] text-zinc-400 mb-0.5">Ingresos</p>
              <p className="text-sm font-semibold text-emerald-600">+{formatearMoneda(ingresosDelMes)}</p>
            </div>
            <div>
              <p className="text-[10px] text-zinc-400 mb-0.5">Gastos</p>
              <p className="text-sm font-semibold text-red-500">-{formatearMoneda(gastosDelMes)}</p>
            </div>
            <div className="pt-2 border-t border-zinc-100">
              <p className="text-[10px] text-zinc-400 mb-0.5">Balance del Mes</p>
              <p className={`text-sm font-semibold ${ingresosDelMes - gastosDelMes >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                {formatearMoneda(ingresosDelMes - gastosDelMes)}
              </p>
            </div>
            <div className="pt-2 border-t border-zinc-100">
              <p className="text-[10px] text-zinc-400 mb-0.5">Transacciones</p>
              <p className="text-sm font-semibold text-zinc-800">{transacciones.filter((t) => {
                const d = new Date(t.fecha + 'T00:00:00')
                return d.getMonth() === mes && d.getFullYear() === anio
              }).length}</p>
            </div>
          </div>
        </div>
      </div>

      {diaSeleccionado && (
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
              {formatearFecha(diaSeleccionado)}
            </h3>
            <button onClick={() => setDiaSeleccionado(null)}
              className="p-1 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
          {transaccionesDelDiaOrdenadas.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-4">Sin transacciones este día</p>
          ) : (
            <div className="space-y-1">
              {totalGastosDia > 0 && (
                <>
                  <p className="text-[10px] text-zinc-400 font-medium mt-2 mb-1">Gastos</p>
                  {transaccionesDelDiaOrdenadas.filter((t) => t.tipo === 'gasto').map((t) => {
                    const cuenta = cuentas.find((c) => c.id === t.cuentaId)
                    return (
                      <div key={t.id} className="flex items-center gap-3 py-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: obtenerColorCategoria(t.categoria) }} />
                        <span className="text-xs text-zinc-600 flex-1 truncate">{t.descripcion}</span>
                        <span className="text-xs text-zinc-400">{cuenta?.nombre}</span>
                        <span className="text-xs font-semibold text-red-500">-{formatearMoneda(t.monto)}</span>
                      </div>
                    )
                  })}
                </>
              )}
              {totalIngresosDia > 0 && (
                <>
                  <p className="text-[10px] text-zinc-400 font-medium mt-2 mb-1">Ingresos</p>
                  {transaccionesDelDiaOrdenadas.filter((t) => t.tipo === 'ingreso').map((t) => {
                    const cuenta = cuentas.find((c) => c.id === t.cuentaId)
                    return (
                      <div key={t.id} className="flex items-center gap-3 py-1.5">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: obtenerColorCategoria(t.categoria) }} />
                        <span className="text-xs text-zinc-600 flex-1 truncate">{t.descripcion}</span>
                        <span className="text-xs text-zinc-400">{cuenta?.nombre}</span>
                        <span className="text-xs font-semibold text-emerald-600">+{formatearMoneda(t.monto)}</span>
                      </div>
                    )
                  })}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
