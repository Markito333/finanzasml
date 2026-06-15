'use client'

import { useApp } from '@/components/AppProvider'
import { useState, useMemo } from 'react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { Transferencia } from '@/lib/types'
import { formatearMoneda, formatearFecha, hoyISO, obtenerBalanceCuenta } from '@/lib/utils'
import { XMarkIcon, PencilSquareIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Transferencias() {
  const { data, agregarTransferencia, actualizarTransferencia, eliminarTransferencia } = useApp()
  const { mostrarToast } = useToast()
  const { cuentas, transacciones, transferencias } = data

  const lista = useMemo(() =>
    [...transferencias].sort((a, b) => b.fecha.localeCompare(a.fecha)),
    [transferencias]
  )

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Transferencia | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [formOrigenId, setFormOrigenId] = useState('')
  const [formDestinoId, setFormDestinoId] = useState('')
  const [formMonto, setFormMonto] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formFecha, setFormFecha] = useState(hoyISO())

  function abrirNuevo() {
    setEditando(null)
    setFormOrigenId(cuentas[0]?.id || '')
    setFormDestinoId(cuentas[1]?.id || cuentas[0]?.id || '')
    setFormMonto('')
    setFormDescripcion('')
    setFormFecha(hoyISO())
    setModalAbierto(true)
  }

  function abrirEditar(t: Transferencia) {
    setEditando(t)
    setFormOrigenId(t.cuentaOrigenId)
    setFormDestinoId(t.cuentaDestinoId)
    setFormMonto(String(t.monto))
    setFormDescripcion(t.descripcion)
    setFormFecha(t.fecha)
    setModalAbierto(true)
  }

  function handleGuardar() {
    if (!formOrigenId || !formDestinoId || !formMonto) return
    if (formOrigenId === formDestinoId) {
      mostrarToast('La cuenta origen y destino deben ser diferentes', 'error')
      return
    }
    const monto = parseFloat(formMonto)
    if (monto <= 0) { mostrarToast('El monto debe ser mayor a cero', 'error'); return }

    const cuentaOrigen = cuentas.find((c) => c.id === formOrigenId)
    if (!cuentaOrigen) return

    const balanceOrigen = obtenerBalanceCuenta(formOrigenId, cuentaOrigen.saldoInicial, transacciones, transferencias)
    const disponible = editando
      ? balanceOrigen + (editando.cuentaOrigenId === formOrigenId ? editando.monto : 0)
      : balanceOrigen

    if (monto > disponible) {
      mostrarToast(`Saldo insuficiente en origen — Disponible: ${formatearMoneda(disponible)}`, 'error')
      return
    }

    const d = {
      cuentaOrigenId: formOrigenId,
      cuentaDestinoId: formDestinoId,
      monto,
      descripcion: formDescripcion.trim(),
      fecha: formFecha,
    }

    if (editando) {
      if (editando.cuentaOrigenId !== formOrigenId || editando.cuentaDestinoId !== formDestinoId) {
        actualizarTransferencia(editando.id, { ...d, cuentaOrigenId: formOrigenId, cuentaDestinoId: formDestinoId })
      } else {
        actualizarTransferencia(editando.id, d)
      }
      mostrarToast('Transferencia actualizada', 'success')
    } else {
      agregarTransferencia(d)
      mostrarToast('Transferencia registrada', 'success')
    }
    setModalAbierto(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Transferencias</h2>
        <button onClick={abrirNuevo} disabled={cuentas.length < 2}
          className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
          + Nueva Transferencia
        </button>
      </div>

      {cuentas.length < 2 ? (
        <EmptyState mensaje="Necesitas al menos dos cuentas para transferir entre ellas." />
      ) : lista.length === 0 ? (
        <EmptyState mensaje="No hay transferencias registradas." accion="Nueva Transferencia" onAccion={abrirNuevo} />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100/50 divide-y divide-zinc-50">
          {lista.map((t) => {
            const origen = cuentas.find((c) => c.id === t.cuentaOrigenId)
            const destino = cuentas.find((c) => c.id === t.cuentaDestinoId)
            return (
              <div key={t.id} className="flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/50 transition-colors">
                <div className="w-8 h-8 rounded-full bg-zinc-100 flex items-center justify-center flex-shrink-0">
                  <svg className="w-4 h-4 text-zinc-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 12M21 7.5H7.5" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-zinc-700 truncate">
                    {origen?.nombre || '?'} → {destino?.nombre || '?'}
                  </p>
                  <p className="text-xs text-zinc-400">
                    {t.descripcion ? `${t.descripcion} · ` : ''}{formatearFecha(t.fecha)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-zinc-800">{formatearMoneda(t.monto)}</p>
                <button onClick={() => abrirEditar(t)} className="p-1.5 text-zinc-300 hover:text-zinc-500 hover:bg-zinc-100 rounded-lg transition-colors">
                  <PencilSquareIcon className="w-4 h-4" />
                </button>
                <button onClick={() => setConfirmarEliminar(t.id)} className="p-1.5 text-zinc-300 hover:text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                  <XMarkIcon className="w-4 h-4" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar Transferencia' : 'Nueva Transferencia'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Cuenta Origen</label>
            <div className="relative">
              <select value={formOrigenId} onChange={(e) => setFormOrigenId(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === formDestinoId}>{c.nombre}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Cuenta Destino</label>
            <div className="relative">
              <select value={formDestinoId} onChange={(e) => setFormDestinoId(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id} disabled={c.id === formOrigenId}>{c.nombre}</option>
                ))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Monto</label>
            <input type="number" step="0.01" min="0.01" value={formMonto} onChange={(e) => setFormMonto(e.target.value)} placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Descripción <span className="text-zinc-300 font-normal">(opcional)</span></label>
            <input type="text" value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} placeholder="Ej: Pago de renta"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Fecha</label>
            <input type="date" value={formFecha} onChange={(e) => setFormFecha(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <button onClick={handleGuardar} disabled={!formOrigenId || !formDestinoId || formOrigenId === formDestinoId || !formMonto}
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editando ? 'Guardar Cambios' : 'Transferir'}
          </button>
        </div>
      </Modal>

      <Modal abierto={confirmarEliminar !== null} onCerrar={() => setConfirmarEliminar(null)} titulo="Eliminar Transferencia">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">¿Estás seguro de eliminar esta transferencia? Esto revertirá el movimiento entre cuentas.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button onClick={() => { if (confirmarEliminar) { eliminarTransferencia(confirmarEliminar); mostrarToast('Transferencia eliminada', 'error') }; setConfirmarEliminar(null) }}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
