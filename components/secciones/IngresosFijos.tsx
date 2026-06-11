'use client'

import { useApp } from '@/components/AppProvider'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { CATEGORIAS_INGRESO, IngresoFijo } from '@/lib/types'
import { formatearMoneda } from '@/lib/utils'
import { PencilSquareIcon, TrashIcon, CheckIcon, TagIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function IngresosFijos() {
  const { data, agregarIngresoFijo, actualizarIngresoFijo, eliminarIngresoFijo } = useApp()
  const { mostrarToast } = useToast()
  const { ingresosFijos } = data

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<IngresoFijo | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formMonto, setFormMonto] = useState('')
  const [formCategoria, setFormCategoria] = useState<string>(CATEGORIAS_INGRESO[0].label)
  const [formDia, setFormDia] = useState('1')
  const [formActivo, setFormActivo] = useState(true)

  function abrirNuevo() {
    setEditando(null); setFormNombre(''); setFormDescripcion(''); setFormMonto('')
    setFormCategoria(CATEGORIAS_INGRESO[0].label); setFormDia('1'); setFormActivo(true); setModalAbierto(true)
  }
  function abrirEditar(g: IngresoFijo) {
    setEditando(g); setFormNombre(g.nombre); setFormDescripcion(g.descripcion); setFormMonto(String(g.monto))
    setFormCategoria(g.categoria); setFormDia(String(g.diaIngreso)); setFormActivo(g.activo); setModalAbierto(true)
  }
  function handleGuardar() {
    if (!formNombre.trim() || !formMonto) return
    const monto = parseFloat(formMonto); const dia = Math.min(31, Math.max(1, parseInt(formDia) || 1))
    const d = { nombre: formNombre.trim(), descripcion: formDescripcion.trim(), monto, categoria: formCategoria, diaIngreso: dia, activo: formActivo }
    if (editando) { actualizarIngresoFijo(editando.id, d); mostrarToast('Ingreso fijo actualizado', 'success') }
    else { agregarIngresoFijo(d); mostrarToast('Ingreso fijo creado', 'success') }
    setModalAbierto(false)
  }
  function toggleActivo(g: IngresoFijo) { actualizarIngresoFijo(g.id, { activo: !g.activo }); mostrarToast(g.activo ? 'Ingreso fijo desactivado' : 'Ingreso fijo activado', 'info') }

  const ordenados = [...ingresosFijos].sort((a, b) => a.diaIngreso - b.diaIngreso)
  const totalActivos = ingresosFijos.filter((g) => g.activo).reduce((s, g) => s + g.monto, 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Ingresos Fijos</h2>
        <button onClick={abrirNuevo} className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors">+ Nuevo Ingreso Fijo</button>
      </div>

      {ingresosFijos.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-4">
          <p className="text-xs text-zinc-400 mb-1">Total ingresos fijos mensuales</p>
          <p className="text-2xl font-semibold text-emerald-600">{formatearMoneda(totalActivos)}</p>
        </div>
      )}

      {ingresosFijos.length === 0 ? (
        <EmptyState mensaje="No has definido ingresos fijos. Agrega tus ingresos recurrentes como salario, freelance, etc."
          accion="Nuevo Ingreso Fijo" onAccion={abrirNuevo} />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100/50 divide-y divide-zinc-50">
          {ordenados.map((g) => (
            <div key={g.id} className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/50 transition-colors ${!g.activo ? 'opacity-50' : ''}`}>
              <button onClick={() => toggleActivo(g)}
                className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${g.activo ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300 hover:border-zinc-400'}`}>
                {g.activo && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
              </button>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-medium truncate ${g.activo ? 'text-zinc-700' : 'text-zinc-400'}`}>{g.nombre}</p>
                <p className="text-xs text-zinc-400">{g.categoria} &middot; Día {g.diaIngreso}{g.descripcion && ` &middot; ${g.descripcion}`}</p>
              </div>
              <p className={`text-sm font-semibold ${g.activo ? 'text-emerald-600' : 'text-zinc-400'}`}>+{formatearMoneda(g.monto)}</p>
              <button onClick={() => abrirEditar(g)} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
              <button onClick={() => setConfirmarEliminar(g.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
            </div>
          ))}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar Ingreso Fijo' : 'Nuevo Ingreso Fijo'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nombre</label>
            <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej: Salario"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Descripción (opcional)</label>
            <textarea value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} placeholder="Descripción..." rows={2}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Monto Mensual</label>
            <input type="number" step="0.01" min="0.01" value={formMonto} onChange={(e) => setFormMonto(e.target.value)} placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
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
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Día de Ingreso</label>
            <input type="number" min="1" max="31" value={formDia} onChange={(e) => setFormDia(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <label className="flex items-center gap-3 cursor-pointer">
            <div onClick={() => setFormActivo(!formActivo)}
              className={`w-10 h-6 rounded-full transition-colors relative ${formActivo ? 'bg-zinc-900' : 'bg-zinc-200'}`}>
              <div className={`w-4 h-4 bg-white rounded-full absolute top-1 transition-transform ${formActivo ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm text-zinc-600">Activo</span>
          </label>
          <button onClick={handleGuardar} disabled={!formNombre.trim() || !formMonto}
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editando ? 'Guardar Cambios' : 'Crear Ingreso Fijo'}
          </button>
        </div>
      </Modal>

      <Modal abierto={confirmarEliminar !== null} onCerrar={() => setConfirmarEliminar(null)} titulo="Eliminar Ingreso Fijo">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">¿Estás seguro de eliminar este ingreso fijo?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button onClick={() => { if (confirmarEliminar) { eliminarIngresoFijo(confirmarEliminar); mostrarToast('Ingreso fijo eliminado', 'error') }; setConfirmarEliminar(null) }}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
