'use client'

import { useApp } from '@/components/AppProvider'
import { useState, useMemo } from 'react'
import {
  obtenerBalanceGeneral,
  obtenerBalanceCuenta,
  obtenerTotalIngresos,
  obtenerTotalGastos,
  obtenerMontoActualMeta,
  obtenerProgresoMeta,
  formatearMoneda,
  formatearFecha,
  hoyISO, inicioSemanaISO,
  agruparPorCategoria,
  agruparIngresosPorCategoria,
  obtenerColorCategoria,
} from '@/lib/utils'
import Donut from '@/components/Donut'
import Modal from '@/components/Modal'
import TasasCambio from '@/components/TasasCambio'
import { useTasas } from '@/hooks/useTasas'
import { WalletIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import { Seccion } from '@/lib/types'

interface Props {
  onNavigate: (s: Seccion) => void
}

export default function Resumen({ onNavigate }: Props) {
  const { data } = useApp()
  const { cuentas, transacciones, metas } = data
  const tasas = useTasas()

  const [semanaActiva, setSemanaActiva] = useState(false)
  const [filtroMes, setFiltroMes] = useState(() => String(new Date().getMonth() + 1))
  const [filtroAnio, setFiltroAnio] = useState(() => String(new Date().getFullYear()))
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')

  function aplicarMes(m: string) {
    setFiltroMes(m); setSemanaActiva(false); setFiltroDesde(''); setFiltroHasta('')
  }

  function aplicarAnio(a: string) {
    setFiltroAnio(a); setSemanaActiva(false); setFiltroDesde(''); setFiltroHasta('')
  }

  function aplicarSemana() {
    setSemanaActiva(true); setFiltroDesde(inicioSemanaISO()); setFiltroHasta(hoyISO())
  }

  const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

  const mesesOptions = useMemo(() => [{ value: '', label: 'Todos los meses' }, ...MESES.map((label, i) => ({ value: String(i + 1), label }))], [])

  const aniosOptions = useMemo(() => {
    const now = new Date(); const anios: string[] = []
    for (let i = 2; i >= 0; i--) anios.push(String(now.getFullYear() - i))
    return anios
  }, [])

  const transaccionesFiltradas = useMemo(() => {
    let t = transacciones
    if (filtroDesde && filtroHasta) {
      t = t.filter((tx) => tx.fecha >= filtroDesde && tx.fecha <= filtroHasta)
    } else {
      if (filtroMes) t = t.filter((tx) => new Date(tx.fecha + 'T00:00:00').getMonth() + 1 === parseInt(filtroMes))
      if (filtroAnio) t = t.filter((tx) => tx.fecha.startsWith(filtroAnio))
    }
    return t
  }, [transacciones, filtroDesde, filtroHasta, filtroMes, filtroAnio])

  const hayFiltros = filtroDesde || filtroHasta

  const balanceGeneral = useMemo(() => obtenerBalanceGeneral(cuentas, transaccionesFiltradas), [cuentas, transaccionesFiltradas])
  const balanceGeneralCUP = useMemo(() => {
    if (!tasas) return null
    return cuentas.reduce((total, c) => {
      const balance = obtenerBalanceCuenta(c.id, c.saldoInicial, transaccionesFiltradas)
      if (c.tipo === 'dolar') return total + balance * tasas.usd
      if (c.tipo === 'euro') return total + balance * tasas.eur
      return total + balance
    }, 0)
  }, [cuentas, transaccionesFiltradas, tasas])
  const totalIngresos = useMemo(() => obtenerTotalIngresos(transaccionesFiltradas), [transaccionesFiltradas])
  const totalGastos = useMemo(() => obtenerTotalGastos(transaccionesFiltradas), [transaccionesFiltradas])
  const gastosPorCategoria = useMemo(() => agruparPorCategoria(transaccionesFiltradas), [transaccionesFiltradas])
  const ingresosPorCategoria = useMemo(() => agruparIngresosPorCategoria(transaccionesFiltradas), [transaccionesFiltradas])

  const donutGastos = useMemo(() =>
    gastosPorCategoria.map((g) => ({ label: g.categoria, value: g.total, color: obtenerColorCategoria(g.categoria) })),
    [gastosPorCategoria]
  )

  const donutIngresos = useMemo(() =>
    ingresosPorCategoria.map((g) => ({ label: g.categoria, value: g.total, color: obtenerColorCategoria(g.categoria) })),
    [ingresosPorCategoria]
  )

  const recientes = useMemo(() =>
    [...transaccionesFiltradas].sort((a, b) => b.fecha.localeCompare(a.fecha)).slice(0, 5),
    [transaccionesFiltradas]
  )

  const hoy = hoyISO()
  const gastosHoy = useMemo(() =>
    transaccionesFiltradas.filter((t) => t.tipo === 'gasto' && t.fecha === hoy).reduce((s, t) => s + t.monto, 0),
    [transaccionesFiltradas, hoy]
  )
  const ingresosHoy = useMemo(() =>
    transaccionesFiltradas.filter((t) => t.tipo === 'ingreso' && t.fecha === hoy).reduce((s, t) => s + t.monto, 0),
    [transaccionesFiltradas, hoy]
  )

  const [resumenAbierto, setResumenAbierto] = useState(false)

  const metasPendientes = useMemo(() =>
    metas.filter((m) => obtenerProgresoMeta(m, balanceGeneral) < 100).length,
    [metas, balanceGeneral]
  )

  const cuentasConBalance = useMemo(() =>
    cuentas.map((c) => ({ ...c, balance: obtenerBalanceCuenta(c.id, c.saldoInicial, transacciones) })),
    [cuentas, transacciones]
  )

  const totalEfectivoTarjeta = useMemo(() => {
    const nombres = ['Efectivo', 'Tarjetas']
    const ids = new Set(cuentas.filter((c) => nombres.includes(c.nombre)).map((c) => c.id))
    let total = 0
    for (const c of cuentas) if (ids.has(c.id)) total += c.saldoInicial
    for (const t of transacciones) if (ids.has(t.cuentaId)) total += t.tipo === 'ingreso' ? t.monto : -t.monto
    return total
  }, [cuentas, transacciones])

  return (
    <div className="space-y-6">
      {/* Period and date filter row */}
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={aplicarSemana}
          className={`px-2.5 py-1.5 text-xs font-medium rounded-xl transition-colors ${semanaActiva ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
          Semana
        </button>
        <div className="relative">
          <select value={filtroMes} onChange={(e) => aplicarMes(e.target.value)}
            className="pl-3 pr-8 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
            {mesesOptions.map((m) => (<option key={m.value} value={m.value}>{m.label}</option>))}
          </select>
          <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>
        <div className="relative">
          <select value={filtroAnio} onChange={(e) => aplicarAnio(e.target.value)}
            className="pl-3 pr-8 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
            {aniosOptions.map((a) => (<option key={a} value={a}>{a}</option>))}
          </select>
          <ChevronDownIcon className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-400 pointer-events-none" />
        </div>
        <CalendarDaysIcon className="w-4 h-4 text-zinc-400" />
        <input type="date" value={filtroDesde} onChange={(e) => { setFiltroDesde(e.target.value); setSemanaActiva(false) }}
          className="px-3 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        <span className="text-xs text-zinc-400">a</span>
        <input type="date" value={filtroHasta} onChange={(e) => { setFiltroHasta(e.target.value); setSemanaActiva(false) }}
          className="px-3 py-1.5 text-xs border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
        {hayFiltros && (
          <button onClick={() => { setFiltroDesde(''); setFiltroHasta(''); setSemanaActiva(false) }}
            className="px-2.5 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">
            Limpiar
          </button>
        )}
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 auto-rows-min">
        {/* Bento 1: Income Donut */}
        {donutIngresos.length > 0 && (
          <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5 flex flex-col items-center justify-center">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3 self-start">Ingresos</h3>
            <Donut data={donutIngresos} />
          </div>
        )}

        {/* Bento 2: Total + Balance General */}
        <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-4 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">Total:</p>
            <p className="text-xl font-bold text-zinc-800">{formatearMoneda(totalEfectivoTarjeta)}</p>
          </div>
          <div className="flex items-center justify-between bg-zinc-50 rounded-xl px-3 py-1.5">
            <p className="text-[9px] text-zinc-400 font-medium uppercase tracking-wider">Balance General</p>
            <p className="text-xs font-bold text-zinc-600">{formatearMoneda(balanceGeneral)}</p>
          </div>
          {balanceGeneralCUP && (
            <p className="text-[10px] text-zinc-400 -mt-1 text-right">≈ {formatearMoneda(balanceGeneralCUP)} CUP</p>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2 bg-red-50/50 rounded-xl px-3 py-2">
              <ArrowTrendingDownIcon className="w-3 h-3 text-red-400" />
              <div>
                <p className="text-[9px] text-zinc-400">Hoy gastos</p>
                <p className="text-xs font-semibold text-red-500">-{formatearMoneda(gastosHoy)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 bg-emerald-50/50 rounded-xl px-3 py-2">
              <ArrowTrendingUpIcon className="w-3 h-3 text-emerald-500" />
              <div>
                <p className="text-[9px] text-zinc-400">Hoy ingresos</p>
                <p className="text-xs font-semibold text-emerald-600">+{formatearMoneda(ingresosHoy)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Bento 3: Tasas de Cambio */}
        <TasasCambio />

        {/* Bento 3b: Resumen Modal Trigger */}
        <button onClick={() => setResumenAbierto(true)} className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5 flex flex-col items-center justify-center gap-2 hover:bg-zinc-50/80 transition-colors cursor-pointer text-left">
          <img src="/imgs/anillos.png" alt="" className="w-12 h-12 object-contain opacity-70" />
          <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Ver Detalle</p>
        </button>

        {/* Bento 4: Recent Transactions */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-zinc-100/50 p-5">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Últimas Transacciones</h3>
          {recientes.length === 0 ? (
            <p className="text-sm text-zinc-400 text-center py-6">No hay transacciones recientes</p>
          ) : (
            <div className="divide-y divide-zinc-50">
              {recientes.map((t) => {
                const cuenta = cuentas.find((c) => c.id === t.cuentaId)
                return (
                  <div key={t.id} className="flex items-center gap-3 py-2.5">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${t.tipo === 'ingreso' ? 'bg-emerald-400' : 'bg-red-400'}`} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-700 truncate">{t.descripcion}</p>
                      <p className="text-xs text-zinc-400">{cuenta?.nombre} &middot; {formatearFecha(t.fecha)}</p>
                    </div>
                    <p className={`text-sm font-semibold ${t.tipo === 'ingreso' ? 'text-emerald-600' : 'text-red-500'}`}>
                      {t.tipo === 'ingreso' ? '+' : '-'}{formatearMoneda(t.monto)}
                    </p>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bento 5: Expense Donut */}
        {donutGastos.length > 0 && (
          <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Gastos</h3>
            <Donut data={donutGastos} />
          </div>
        )}

        {/* Bento 6: Quick Accounts */}
        {cuentas.length > 0 && (
          <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Cuentas</h3>
            <div className="space-y-3">
              {cuentas.slice(0, 4).map((c) => {
                const balance = obtenerBalanceCuenta(c.id, c.saldoInicial, transacciones)
                const tasa = c.tipo === 'dolar' ? tasas?.usd : c.tipo === 'euro' ? tasas?.eur : null
                return (
                  <div key={c.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                      <span className="text-xs text-zinc-600 flex-1 truncate">{c.nombre}</span>
                      <span className="text-xs font-semibold text-zinc-800">{formatearMoneda(balance)}</span>
                    </div>
                    {tasa && (
                      <p className="text-[10px] text-zinc-400 pl-5">
                        ≈ {formatearMoneda(balance * tasa)} CUP
                      </p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Bento 7: Goals */}
        {metas.length > 0 && (
          <div className="md:col-span-1 bg-white rounded-2xl border border-zinc-100/50 p-5">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">Metas</h3>
            <div className="space-y-3">
              {metas.slice(0, 3).map((m) => {
                const progreso = obtenerProgresoMeta(m, balanceGeneral)
                return (
                  <div key={m.id}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-zinc-600 truncate">{m.nombre}</span>
                      <span className="text-[10px] font-semibold" style={{ color: m.color }}>{progreso}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-zinc-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${progreso}%`, backgroundColor: m.color }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      <Modal abierto={resumenAbierto} onCerrar={() => setResumenAbierto(false)} sinTitulo>
        <div className="flex flex-col items-center gap-4">
          <img src="/imgs/anillos.png" alt="" className="w-20 h-20 object-contain" />
          <div className="text-center">
            <p className="text-[10px] text-zinc-400 mb-0.5">Total:</p>
            <p className="text-2xl font-bold text-zinc-800">{formatearMoneda(totalEfectivoTarjeta)}</p>
          </div>
          <div className="w-full space-y-2">
            <p className="text-[10px] text-zinc-400 font-medium uppercase tracking-wider">Cuentas</p>
            {cuentasConBalance.map((c) => {
              const tasa = c.tipo === 'dolar' ? tasas?.usd : c.tipo === 'euro' ? tasas?.eur : null
              return (
                <div key={c.id}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <span className="text-xs text-zinc-600 flex-1">{c.nombre}</span>
                    <span className="text-xs font-semibold text-zinc-800">{formatearMoneda(c.balance)}</span>
                  </div>
                  {tasa && (
                    <p className="text-[10px] text-zinc-400 pl-5">
                      ≈ {formatearMoneda(c.balance * tasa)} CUP
                    </p>
                  )}
                </div>
              )
            })}
            {cuentas.length === 0 && (
              <p className="text-xs text-zinc-400 text-center">Sin cuentas registradas</p>
            )}
          </div>
          <div className="w-full pt-2 border-t border-zinc-100">
            <p className="text-[10px] text-zinc-400">
              Metas pendientes: <span className="font-semibold text-zinc-600">{metasPendientes}</span>
            </p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
