'use client'

import { useApp } from '@/components/AppProvider'
import { useState, useMemo } from 'react'
import {
  obtenerBalanceGeneral, obtenerBalanceCuenta, obtenerTotalIngresos, obtenerTotalGastos,
  agruparPorCategoria, formatearMoneda, obtenerColorCategoria,
} from '@/lib/utils'
import Donut from '@/components/Donut'
import { CalendarDaysIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon } from '@heroicons/react/24/outline'

export default function Estadisticas() {
  const { data } = useApp()
  const { cuentas, transacciones } = data

  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  const transaccionesFiltradas = useMemo(() => {
    let t = transacciones
    if (filtroDesde) t = t.filter((tx) => tx.fecha >= filtroDesde)
    if (filtroHasta) t = t.filter((tx) => tx.fecha <= filtroHasta)
    return t
  }, [transacciones, filtroDesde, filtroHasta])

  const hayFiltros = filtroDesde || filtroHasta
  const balanceGeneral = useMemo(() => obtenerBalanceGeneral(cuentas, transaccionesFiltradas), [cuentas, transaccionesFiltradas])
  const totalIngresos = useMemo(() => obtenerTotalIngresos(transaccionesFiltradas), [transaccionesFiltradas])
  const totalGastos = useMemo(() => obtenerTotalGastos(transaccionesFiltradas), [transaccionesFiltradas])
  const gastosPorCategoria = useMemo(() => agruparPorCategoria(transaccionesFiltradas), [transaccionesFiltradas])
  const totalGastosCalc = useMemo(() => gastosPorCategoria.reduce((s, g) => s + g.total, 0), [gastosPorCategoria])

  const cuentasConBalance = useMemo(() =>
    cuentas.map((c) => ({ ...c, balance: obtenerBalanceCuenta(c.id, c.saldoInicial, transaccionesFiltradas) })), [cuentas, transaccionesFiltradas])
  const totalBalanceCuentas = useMemo(() => cuentasConBalance.reduce((s, c) => s + Math.abs(c.balance), 0), [cuentasConBalance])

  const ingresosPorMes = useMemo(() => {
    const meses: Record<string, number> = {}
    for (const t of transaccionesFiltradas) if (t.tipo === 'ingreso') { const mes = t.fecha.slice(0, 7); meses[mes] = (meses[mes] || 0) + t.monto }
    return Object.entries(meses).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, total]) => ({ mes, total }))
  }, [transaccionesFiltradas])

  const gastosPorMes = useMemo(() => {
    const meses: Record<string, number> = {}
    for (const t of transaccionesFiltradas) if (t.tipo === 'gasto') { const mes = t.fecha.slice(0, 7); meses[mes] = (meses[mes] || 0) + t.monto }
    return Object.entries(meses).sort(([a], [b]) => a.localeCompare(b)).slice(-6).map(([mes, total]) => ({ mes, total }))
  }, [transaccionesFiltradas])

  const maxMesValor = useMemo(() => Math.max(...ingresosPorMes.map((m) => m.total), ...gastosPorMes.map((m) => m.total), 1), [ingresosPorMes, gastosPorMes])

  const nombreMes = (m: string) => { const [year, month] = m.split('-'); return new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('es-ES', { month: 'short' }) }

  const donutData = useMemo(() => gastosPorCategoria.map((g) => ({ label: g.categoria, value: g.total, color: obtenerColorCategoria(g.categoria) })), [gastosPorCategoria])

  if (transacciones.length === 0) return (
    <div className="space-y-6 max-w-4xl">
      <p className="text-sm text-zinc-400">No hay datos suficientes para mostrar estadísticas.</p>
      <div className="bg-white rounded-2xl border border-zinc-100/50 p-12 text-center">
        <p className="text-sm text-zinc-400">Registra gastos e ingresos para ver tus estadísticas.</p>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <CalendarDaysIcon className="w-4 h-4 text-zinc-400" />
        <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
          className="px-3 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        <span className="text-xs text-zinc-400">a</span>
        <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
          className="px-3 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        {hayFiltros && (
          <button onClick={() => { setFiltroDesde(''); setFiltroHasta('') }}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">Limpiar</button>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <ArrowTrendingUpIcon className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400">Ingresos</p>
            <p className="text-base font-semibold text-emerald-600">+{formatearMoneda(totalIngresos)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <ArrowTrendingDownIcon className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400">Gastos</p>
            <p className="text-base font-semibold text-red-500">-{formatearMoneda(totalGastos)}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-100 flex items-center justify-center flex-shrink-0">
            <CalendarDaysIcon className="w-4 h-4 text-zinc-500" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-400">Balance</p>
            <p className={`text-base font-semibold ${balanceGeneral >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{formatearMoneda(balanceGeneral)}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min">
        {donutData.length > 0 && (
          <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Distribución</h3>
            <Donut data={donutData} size={160} strokeWidth={24} legendSize="md" />
          </div>
        )}

        {ingresosPorMes.length > 0 && (
          <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">Ingresos vs Gastos</h3>
            <div className="flex items-end gap-3 h-44">
              {ingresosPorMes.map((item) => {
                const gastoMes = gastosPorMes.find((g) => g.mes === item.mes)?.total || 0
                const alturaIngreso = (item.total / maxMesValor) * 100
                const alturaGasto = (gastoMes / maxMesValor) * 100
                return (
                  <div key={item.mes} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
                    <div className="flex gap-1.5 w-full items-end justify-center h-full">
                      <div className="w-4 bg-emerald-400/80 rounded-md transition-all" style={{ height: `${Math.max(alturaIngreso, 2)}%` }}
                        title={`Ingresos: ${formatearMoneda(item.total)}`} />
                      <div className="w-4 bg-red-400/80 rounded-md transition-all" style={{ height: `${Math.max(alturaGasto, 2)}%` }}
                        title={`Gastos: ${formatearMoneda(gastoMes)}`} />
                    </div>
                    <span className="text-[10px] text-zinc-400 mt-1">{nombreMes(item.mes)}</span>
                  </div>
                )
              })}
            </div>
            <div className="flex gap-4 mt-4 pt-3 border-t border-zinc-100/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-emerald-400" />
                <span className="text-xs text-zinc-500">Ingresos</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-red-400" />
                <span className="text-xs text-zinc-500">Gastos</span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min">
        {gastosPorCategoria.length > 0 && (
          <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Gastos por Categoría</h3>
            <div className="space-y-3">
              {gastosPorCategoria.map((g) => {
                const porcentaje = totalGastosCalc > 0 ? Math.round((g.total / totalGastosCalc) * 100) : 0
                return (
                  <div key={g.categoria}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: obtenerColorCategoria(g.categoria) }} />
                        <span className="text-sm text-zinc-700">{g.categoria}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-zinc-800">{formatearMoneda(g.total)}</span>
                        <span className="text-xs text-zinc-400 w-8 text-right">{porcentaje}%</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, backgroundColor: obtenerColorCategoria(g.categoria) }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {cuentasConBalance.length > 0 && (
          <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Por Cuenta</h3>
            <div className="space-y-3">
              {cuentasConBalance.map((c) => {
                const porcentaje = totalBalanceCuentas > 0 ? Math.round((Math.abs(c.balance) / totalBalanceCuentas) * 100) : 0
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: c.color }} />
                        <span className="text-sm text-zinc-700">{c.nombre}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-zinc-800">{formatearMoneda(c.balance)}</span>
                        <span className="text-xs text-zinc-400 w-7 text-right">{porcentaje}%</span>
                      </div>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all" style={{ width: `${porcentaje}%`, backgroundColor: c.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {totalIngresos > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-4 text-center">
          <p className="text-xs text-zinc-400">
            {totalGastos > totalIngresos
              ? `Gastas ${((totalGastos / totalIngresos) * 100 - 100).toFixed(0)}% más de lo que ingresas`
              : `Ahorras ${(((totalIngresos - totalGastos) / totalIngresos) * 100).toFixed(0)}% de tus ingresos`}
          </p>
        </div>
      )}
    </div>
  )
}
