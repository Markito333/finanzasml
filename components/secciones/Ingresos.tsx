'use client'

import { useApp } from '@/components/AppProvider'
import { useState, useMemo } from 'react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { CATEGORIAS_INGRESO, Transaccion } from '@/lib/types'
import { formatearMoneda, formatearFecha, hoyISO, obtenerColorCategoria, inicioMesISO, finMesISO } from '@/lib/utils'
import { XMarkIcon, PencilSquareIcon, TagIcon, WalletIcon, CalendarDaysIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Ingresos() {
  const { data, agregarTransaccion, actualizarTransaccion, eliminarTransaccion } = useApp()
  const { mostrarToast } = useToast()
  const { cuentas, transacciones } = data

  const ingresos = useMemo(() => transacciones.filter((t) => t.tipo === 'ingreso').sort((a, b) => b.fecha.localeCompare(a.fecha)), [transacciones])

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Transaccion | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [filtroCuenta, setFiltroCuenta] = useState('')
  const [filtroDesde, setFiltroDesde] = useState(inicioMesISO)
  const [filtroHasta, setFiltroHasta] = useState(finMesISO)
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formMonto, setFormMonto] = useState('')
  const [formCuentaId, setFormCuentaId] = useState('')
  const [formCategoria, setFormCategoria] = useState<string>(CATEGORIAS_INGRESO[0].label)
  const [formFecha, setFormFecha] = useState(hoyISO())

  function abrirNuevo() {
    setEditando(null); setFormDescripcion(''); setFormMonto('')
    setFormCuentaId(cuentas[0]?.id || ''); setFormCategoria(CATEGORIAS_INGRESO[0].label); setFormFecha(hoyISO()); setModalAbierto(true)
  }
  function abrirEditar(g: Transaccion) {
    setEditando(g); setFormDescripcion(g.descripcion); setFormMonto(String(g.monto))
    setFormCuentaId(g.cuentaId); setFormCategoria(g.categoria); setFormFecha(g.fecha); setModalAbierto(true)
  }
  function handleGuardar() {
    if (!formDescripcion.trim() || !formMonto || !formCuentaId) return
    const monto = parseFloat(formMonto)
    const d = { descripcion: formDescripcion.trim(), monto, cuentaId: formCuentaId, categoria: formCategoria, fecha: formFecha }
    if (editando) { actualizarTransaccion(editando.id, d); mostrarToast('Ingreso actualizado', 'success') }
    else { agregarTransaccion({ ...d, tipo: 'ingreso' }); mostrarToast('Ingreso registrado', 'success') }
    setModalAbierto(false)
  }

  const hayFiltros = filtroCuenta || filtroDesde || filtroHasta
  const ingresosFiltrados = useMemo(() => {
    let f = ingresos
    if (filtroCuenta) f = f.filter((g) => g.cuentaId === filtroCuenta)
    if (filtroDesde) f = f.filter((g) => g.fecha >= filtroDesde)
    if (filtroHasta) f = f.filter((g) => g.fecha <= filtroHasta)
    return f
  }, [ingresos, filtroCuenta, filtroDesde, filtroHasta])
  const totalIngresos = useMemo(() => ingresosFiltrados.reduce((s, g) => s + g.monto, 0), [ingresosFiltrados])
  const ingresosPorCuenta = useMemo(() => {
    const mapa: Record<string, { nombre: string; color: string; total: number }> = {}
    for (const g of ingresosFiltrados) {
      const cuenta = cuentas.find(c => c.id === g.cuentaId)
      if (!cuenta) continue
      if (!mapa[cuenta.id]) mapa[cuenta.id] = { nombre: cuenta.nombre, color: cuenta.color, total: 0 }
      mapa[cuenta.id].total += g.monto
    }
    return Object.values(mapa).sort((a, b) => b.total - a.total)
  }, [ingresosFiltrados, cuentas])

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Ingresos</h2>
        <button onClick={abrirNuevo} disabled={cuentas.length === 0}
          className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">+ Nuevo Ingreso</button>
      </div>

      {cuentas.length === 0 ? (
        <EmptyState mensaje="Necesitas crear una cuenta antes de registrar ingresos." accion="Ir a Cuentas" onAccion={() => {}} />
      ) : ingresos.length === 0 ? (
        <EmptyState mensaje="No hay ingresos registrados. ¡Agrega tu primer ingreso!" accion="Nuevo Ingreso" onAccion={abrirNuevo} />
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <WalletIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
              <select value={filtroCuenta} onChange={(e) => setFiltroCuenta(e.target.value)}
                className="pl-9 pr-10 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
                <option value="">Todas las cuentas</option>
                {cuentas.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
            <span className="text-xs text-zinc-400">a</span>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
              className="px-3 py-2 text-sm border border-zinc-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
            {hayFiltros && (
              <button onClick={() => { setFiltroCuenta(''); setFiltroDesde(''); setFiltroHasta('') }}
                className="px-3 py-1.5 text-xs font-medium text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded-xl transition-colors">Limpiar</button>
            )}
            <p className="text-sm text-zinc-500 ml-auto">Total: <span className="font-semibold text-zinc-800">{formatearMoneda(totalIngresos)}</span></p>
          </div>

          {ingresosPorCuenta.length > 0 && (
            <div className="flex flex-wrap items-center gap-2">
              {ingresosPorCuenta.map((c) => (
                <div key={c.nombre} className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-100 rounded-xl text-xs">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
                  <span className="text-zinc-500">{c.nombre}</span>
                  <span className="font-semibold text-zinc-800">{formatearMoneda(c.total)}</span>
                </div>
              ))}
            </div>
          )}

          <div className="bg-white rounded-2xl border border-zinc-100/50 divide-y divide-zinc-50">
            {ingresosFiltrados.length === 0 ? (
              <div className="p-8 text-center text-sm text-zinc-400">No hay ingresos con los filtros seleccionados.</div>
            ) : (
              ingresosFiltrados.map((g) => {
                const cuenta = cuentas.find((c) => c.id === g.cuentaId)
                return (
                  <div key={g.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/50 transition-colors">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: obtenerColorCategoria(g.categoria) }} />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-zinc-700 truncate">{g.descripcion}</p>
                      <p className="text-xs text-zinc-400">{g.categoria} &middot; {cuenta?.nombre} &middot; {formatearFecha(g.fecha)}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600">+{formatearMoneda(g.monto)}</p>
                    <button onClick={() => abrirEditar(g)} className="p-1.5 text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmarEliminar(g.id)} className="p-1.5 text-zinc-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors"><XMarkIcon className="w-4 h-4" /></button>
                  </div>
                )
              })
            )}
          </div>
        </>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar Ingreso' : 'Nuevo Ingreso'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Descripción</label>
            <input type="text" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} placeholder="Ej: Salario del mes"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Monto</label>
            <input type="number" step="0.01" min="0.01" value={formMonto} onChange={(e) => setFormMonto(e.target.value)} placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5"><WalletIcon className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-zinc-400" /> Cuenta</label>
            <div className="relative">
              <select value={formCuentaId} onChange={(e) => setFormCuentaId(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
                {cuentas.map((c) => (<option key={c.id} value={c.id}>{c.nombre}</option>))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5"><TagIcon className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-zinc-400" /> Categoría</label>
            <div className="relative">
              <select value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
                {CATEGORIAS_INGRESO.map((cat) => (<option key={cat.label} value={cat.label}>{cat.label}</option>))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Fecha</label>
            <input type="date" value={formFecha} onChange={(e) => setFormFecha(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <button onClick={handleGuardar} disabled={!formDescripcion.trim() || !formMonto || !formCuentaId}
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editando ? 'Guardar Cambios' : 'Registrar Ingreso'}
          </button>
        </div>
      </Modal>

      <Modal abierto={confirmarEliminar !== null} onCerrar={() => setConfirmarEliminar(null)} titulo="Eliminar Ingreso">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">¿Estás seguro de eliminar este ingreso?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button onClick={() => { if (confirmarEliminar) { eliminarTransaccion(confirmarEliminar); mostrarToast('Ingreso eliminado', 'error') }; setConfirmarEliminar(null) }}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
