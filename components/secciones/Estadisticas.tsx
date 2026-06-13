'use client'

import { useApp } from '@/components/AppProvider'
import { useState, useMemo } from 'react'
import {
  obtenerBalanceGeneral, obtenerBalanceCuenta, obtenerTotalIngresos, obtenerTotalGastos,
  agruparPorCategoria, formatearMoneda, formatearFecha, obtenerColorCategoria,
  hoyISO, inicioSemanaISO,
} from '@/lib/utils'
import Donut from '@/components/Donut'
import { CalendarDaysIcon, ArrowTrendingUpIcon, ArrowTrendingDownIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Estadisticas() {
  const { data } = useApp()
  const { cuentas, transacciones } = data

  const [semanaActiva, setSemanaActiva] = useState(false)
  const [filtroMes, setFiltroMes] = useState(() => String(new Date().getMonth() + 1))
  const [filtroAnio, setFiltroAnio] = useState(() => String(new Date().getFullYear()))
  const [filtroDesde, setFiltroDesde] = useState('')
  const [filtroHasta, setFiltroHasta] = useState('')
  const [scatterFiltro, setScatterFiltro] = useState<'todos' | 'gasto' | 'ingreso'>('todos')

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

  const balanceInicial = useMemo(() => {
    if (!filtroDesde && !filtroHasta && !semanaActiva) {
      const inicio = `${filtroAnio}-${String(parseInt(filtroMes)).padStart(2, '0')}-01`
      const antes = transacciones.filter((t) => t.fecha < inicio)
      return cuentas.reduce((total, c) => total + obtenerBalanceCuenta(c.id, c.saldoInicial, antes), 0)
    }
    if (filtroDesde) {
      const antes = transacciones.filter((t) => t.fecha < filtroDesde)
      return cuentas.reduce((total, c) => total + obtenerBalanceCuenta(c.id, c.saldoInicial, antes), 0)
    }
    return cuentas.reduce((total, c) => total + obtenerBalanceCuenta(c.id, c.saldoInicial, transacciones), 0)
  }, [cuentas, transacciones, filtroDesde, filtroHasta, filtroMes, filtroAnio, semanaActiva])

  const puntosEvolucion = useMemo(() => {
    let txs = transaccionesFiltradas
    if (scatterFiltro !== 'todos') txs = txs.filter(t => t.tipo === scatterFiltro)
    txs = [...txs].sort((a, b) => a.fecha.localeCompare(b.fecha))
    if (txs.length === 0) return []
    let cum = balanceInicial
    const pts: { fecha: string; valor: number; id: string; desc: string; cat: string; tipo: string }[] = []
    pts.push({ fecha: txs[0].fecha, valor: cum, id: 'start', desc: 'Inicio del período', cat: '', tipo: '' })
    for (const t of txs) {
      cum += t.tipo === 'ingreso' ? t.monto : -t.monto
      pts.push({ fecha: t.fecha, valor: cum, id: t.id, desc: t.descripcion, cat: t.categoria, tipo: t.tipo })
    }
    return pts
  }, [transaccionesFiltradas, scatterFiltro, balanceInicial])

  const valorMin = useMemo(() => Math.min(...puntosEvolucion.map(p => p.valor), 0), [puntosEvolucion])
  const valorMax = useMemo(() => Math.max(...puntosEvolucion.map(p => p.valor), 1), [puntosEvolucion])
  const rangoValor = useMemo(() => Math.max(valorMax - valorMin, 1), [valorMax, valorMin])

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

      {puntosEvolucion.length > 1 && (
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Evolución del Balance</h3>
            <div className="flex gap-1">
              {(['todos', 'gasto', 'ingreso'] as const).map((opcion) => (
                <button key={opcion} onClick={() => setScatterFiltro(opcion)}
                  className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${scatterFiltro === opcion ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-500 hover:bg-zinc-200'}`}>
                  {opcion === 'todos' ? 'Ambos' : opcion === 'gasto' ? 'Gastos' : 'Ingresos'}
                </button>
              ))}
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <svg viewBox="0 0 600 260" className="w-full min-w-[500px]" style={{ fontFamily: 'inherit' }}>
              {(() => {
                const PAD = { top: 24, right: 20, bottom: 36, left: 56 }
                const W = 600, H = 260
                const plotW = W - PAD.left - PAD.right
                const plotH = H - PAD.top - PAD.bottom
                const minDate = puntosEvolucion[0].fecha
                const maxDate = puntosEvolucion[puntosEvolucion.length - 1].fecha
                const minTime = new Date(minDate).getTime()
                const maxTime = new Date(maxDate).getTime()
                const timeRange = maxTime - minTime || 1
                const ySteps = 5
                const xMarks = Math.min(6, puntosEvolucion.length)

                const px = (f: string) => PAD.left + ((new Date(f).getTime() - minTime) / timeRange) * plotW
                const py = (v: number) => PAD.top + plotH - ((v - valorMin) / rangoValor) * plotH

                const linePath = puntosEvolucion.map((p, i) => `${i === 0 ? 'M' : 'L'}${px(p.fecha)},${py(p.valor)}`).join(' ')

                return (
                  <g>
                    {Array.from({ length: ySteps }, (_, i) => {
                      const y = PAD.top + (plotH / (ySteps - 1)) * i
                      const val = valorMin + (rangoValor / (ySteps - 1)) * (ySteps - 1 - i)
                      return (
                        <g key={`grid-${i}`}>
                          <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#e4e4e7" strokeWidth="1" />
                          <text x={PAD.left - 8} y={y + 4} textAnchor="end" fill="#a1a1aa" fontSize="10">{formatearMoneda(Math.round(val))}</text>
                        </g>
                      )
                    })}
                    {Array.from({ length: xMarks }, (_, i) => {
                      const idx = Math.round((puntosEvolucion.length - 1) / (xMarks - 1) * i)
                      const p = puntosEvolucion[idx]
                      const x = px(p.fecha)
                      const d = new Date(p.fecha)
                      return (
                        <text key={`x-${i}`} x={x} y={H - 8} textAnchor="middle" fill="#a1a1aa" fontSize="10">
                          {d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                        </text>
                      )
                    })}
                    <line x1={PAD.left} y1={PAD.top} x2={PAD.left} y2={PAD.top + plotH} stroke="#d4d4d8" strokeWidth="1" />
                    <line x1={PAD.left} y1={PAD.top + plotH} x2={W - PAD.right} y2={PAD.top + plotH} stroke="#d4d4d8" strokeWidth="1" />
                    <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
                    <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="6" opacity={0.15} strokeLinejoin="round" strokeLinecap="round" />
                    {puntosEvolucion.map((p, i) => (
                      <circle key={p.id} cx={px(p.fecha)} cy={py(p.valor)} r={i === 0 || i === puntosEvolucion.length - 1 ? 5 : 3.5}
                        fill={i === puntosEvolucion.length - 1 ? '#3b82f6' : '#fff'} stroke="#3b82f6" strokeWidth={2}
                        opacity={0.9} className="cursor-pointer">
                        <title>{`${p.desc} — ${formatearMoneda(p.valor)}${p.fecha ? '\n' + formatearFecha(p.fecha) : ''}`}</title>
                      </circle>
                    ))}
                  </g>
                )
              })()}
            </svg>
          </div>
          <div className="flex gap-4 mt-3 pt-3 border-t border-zinc-100/50">
            <div className="flex items-center gap-1.5">
              <div className="w-8 h-0.5 rounded bg-blue-500" />
              <span className="text-xs text-zinc-500">Evolución del balance</span>
            </div>
            <span className="text-xs text-zinc-400 ml-auto">
              Inicio: {formatearMoneda(balanceInicial)} · Final: {formatearMoneda(puntosEvolucion[puntosEvolucion.length - 1].valor)}
            </span>
          </div>
        </div>
      )}

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
