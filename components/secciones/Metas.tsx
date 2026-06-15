'use client'

import { useApp } from '@/components/AppProvider'
import { useState, useMemo } from 'react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { COLORES_CUENTA, Meta } from '@/lib/types'
import { obtenerBalanceGeneral, obtenerMontoActualMeta, obtenerProgresoMeta, formatearMoneda } from '@/lib/utils'
import { PencilSquareIcon, TrashIcon } from '@heroicons/react/24/outline'

export default function Metas() {
  const { data, agregarMeta, actualizarMeta, eliminarMeta } = useApp()
  const { mostrarToast } = useToast()
  const { cuentas, transacciones, metas, transferencias } = data
  const totalBalance = useMemo(() => obtenerBalanceGeneral(cuentas, transacciones, transferencias), [cuentas, transacciones, transferencias])

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Meta | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formMontoMeta, setFormMontoMeta] = useState('')
  const [formPorcentaje, setFormPorcentaje] = useState('10')
  const [formColor, setFormColor] = useState(COLORES_CUENTA[1])

  function abrirNueva() {
    setEditando(null); setFormNombre(''); setFormDescripcion(''); setFormMontoMeta('')
    setFormPorcentaje('10'); setFormColor(COLORES_CUENTA[1]); setModalAbierto(true)
  }
  function abrirEditar(m: Meta) {
    setEditando(m); setFormNombre(m.nombre); setFormDescripcion(m.descripcion)
    setFormMontoMeta(String(m.montoObjetivo)); setFormPorcentaje(String(m.porcentajeAsignado)); setFormColor(m.color); setModalAbierto(true)
  }
  function handleGuardar() {
    if (!formNombre.trim() || !formMontoMeta) return
    const montoObjetivo = parseFloat(formMontoMeta); const porcentaje = Math.min(100, Math.max(0, parseFloat(formPorcentaje) || 0))
    const d = { nombre: formNombre.trim(), descripcion: formDescripcion.trim(), montoObjetivo, porcentajeAsignado: porcentaje, color: formColor }
    if (editando) { actualizarMeta(editando.id, d); mostrarToast('Meta actualizada', 'success') }
    else { agregarMeta(d); mostrarToast('Meta creada', 'success') }
    setModalAbierto(false)
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Metas</h2>
        <button onClick={abrirNueva} className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors">+ Nueva Meta</button>
      </div>

      {metas.length === 0 ? (
        <EmptyState mensaje="No has creado ninguna meta. Define una meta de ahorro para empezar." accion="Crear Meta" onAccion={abrirNueva} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {metas.map((m) => {
            const progreso = obtenerProgresoMeta(m, totalBalance)
            const montoActual = obtenerMontoActualMeta(m, totalBalance)
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-zinc-100 p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{m.nombre}</p>
                      {m.descripcion && <p className="text-xs text-zinc-400">{m.descripcion}</p>}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditar(m)} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                    <button onClick={() => setConfirmarEliminar(m.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex items-baseline justify-between mb-2">
                  <span className="text-xs text-zinc-400">{formatearMoneda(montoActual)} / {formatearMoneda(m.montoObjetivo)}</span>
                  <span className="text-xs font-bold" style={{ color: m.color }}>{progreso}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500 ease-out" style={{ width: `${progreso}%`, backgroundColor: m.color }} />
                </div>
                <p className="text-xs text-zinc-400 mt-2">Asignando el {m.porcentajeAsignado}% de tu balance total</p>
              </div>
            )
          })}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar Meta' : 'Nueva Meta'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nombre</label>
            <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej: Comprar un reloj"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Descripción (opcional)</label>
            <textarea value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} placeholder="Describe tu meta..." rows={2}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Monto Objetivo</label>
            <input type="number" step="0.01" min="0.01" value={formMontoMeta} onChange={(e) => setFormMontoMeta(e.target.value)} placeholder="Ej: 500.00"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">% de tu dinero a destinar</label>
            <input type="number" min="0" max="100" value={formPorcentaje} onChange={(e) => setFormPorcentaje(e.target.value)} placeholder="10"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
            <p className="text-xs text-zinc-400 mt-1">
              {totalBalance > 0 ? `Equivale a ~${formatearMoneda((totalBalance * (parseFloat(formPorcentaje) || 0)) / 100)}` : 'Agrega dinero a tus cuentas para ver la equivalencia'}
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Color</label>
            <div className="flex gap-2">
              {COLORES_CUENTA.map((color) => (
                <button key={color} onClick={() => setFormColor(color)}
                  className={`w-8 h-8 rounded-full transition-all ${formColor === color ? 'ring-2 ring-offset-2 ring-zinc-900 scale-110' : ''}`}
                  style={{ backgroundColor: color }} />
              ))}
            </div>
          </div>
          <button onClick={handleGuardar} disabled={!formNombre.trim() || !formMontoMeta}
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editando ? 'Guardar Cambios' : 'Crear Meta'}
          </button>
        </div>
      </Modal>

      <Modal abierto={confirmarEliminar !== null} onCerrar={() => setConfirmarEliminar(null)} titulo="Eliminar Meta">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">¿Estás seguro de eliminar esta meta?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button onClick={() => { if (confirmarEliminar) { eliminarMeta(confirmarEliminar); mostrarToast('Meta eliminada', 'error') }; setConfirmarEliminar(null) }}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
