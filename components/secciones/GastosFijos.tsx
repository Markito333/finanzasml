'use client'

import { useApp } from '@/components/AppProvider'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { CATEGORIAS_GASTO_FIJO, GastoFijo, GastoFijoItem, calcularTotalGastoFijo } from '@/lib/types'
import { formatearMoneda, generarId } from '@/lib/utils'
import { PencilSquareIcon, TrashIcon, CheckIcon, TagIcon, ChevronDownIcon, PlusIcon, ChevronUpIcon } from '@heroicons/react/24/outline'

export default function GastosFijos() {
  const { data, agregarGastoFijo, actualizarGastoFijo, eliminarGastoFijo } = useApp()
  const { mostrarToast } = useToast()
  const { gastosFijos } = data

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<GastoFijo | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [expandidos, setExpandidos] = useState<Set<string>>(new Set())
  const [formNombre, setFormNombre] = useState('')
  const [formDescripcion, setFormDescripcion] = useState('')
  const [formCategoria, setFormCategoria] = useState<string>(CATEGORIAS_GASTO_FIJO[0].label)
  const [formDia, setFormDia] = useState('1')
  const [formActivo, setFormActivo] = useState(true)
  const [formItems, setFormItems] = useState<{ id: string; nombre: string; cantidad: string; precio: string }[]>([])

  function abrirNuevo() {
    setEditando(null)
    setFormNombre('')
    setFormDescripcion('')
    setFormCategoria(CATEGORIAS_GASTO_FIJO[0].label)
    setFormDia('1')
    setFormActivo(true)
    setFormItems([{ id: generarId(), nombre: '', cantidad: '1', precio: '' }])
    setModalAbierto(true)
  }

  function abrirEditar(g: GastoFijo) {
    setEditando(g)
    setFormNombre(g.nombre)
    setFormDescripcion(g.descripcion)
    setFormCategoria(g.categoria)
    setFormDia(String(g.diaVencimiento))
    setFormActivo(g.activo)
    setFormItems(g.items.map(item => ({
      id: item.id,
      nombre: item.nombre,
      cantidad: String(item.cantidad),
      precio: String(item.precioUnitario),
    })))
    setModalAbierto(true)
  }

  function agregarItem() {
    setFormItems(prev => [...prev, { id: generarId(), nombre: '', cantidad: '1', precio: '' }])
  }

  function actualizarItem(id: string, campo: 'nombre' | 'cantidad' | 'precio', valor: string) {
    setFormItems(prev => prev.map(item => item.id === id ? { ...item, [campo]: valor } : item))
  }

  function eliminarItem(id: string) {
    setFormItems(prev => prev.filter(item => item.id !== id))
  }

  function handleGuardar() {
    if (!formNombre.trim()) return
    const itemsValidos = formItems.filter(item => item.nombre.trim() && parseFloat(item.precio) > 0)
    if (itemsValidos.length === 0) return
    const dia = Math.min(31, Math.max(1, parseInt(formDia) || 1))
    const items: GastoFijoItem[] = itemsValidos.map(item => ({
      id: item.id,
      nombre: item.nombre.trim(),
      cantidad: parseInt(item.cantidad) || 1,
      precioUnitario: parseFloat(item.precio),
    }))
    const d = { nombre: formNombre.trim(), descripcion: formDescripcion.trim(), categoria: formCategoria, diaVencimiento: dia, activo: formActivo, items }
    if (editando) { actualizarGastoFijo(editando.id, d); mostrarToast('Gasto fijo actualizado', 'success') }
    else { agregarGastoFijo(d); mostrarToast('Gasto fijo creado', 'success') }
    setModalAbierto(false)
  }

  function toggleActivo(g: GastoFijo) { actualizarGastoFijo(g.id, { activo: !g.activo }); mostrarToast(g.activo ? 'Gasto fijo desactivado' : 'Gasto fijo activado', 'info') }

  function toggleExpandido(id: string) {
    setExpandidos(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const ordenados = [...gastosFijos].sort((a, b) => a.diaVencimiento - b.diaVencimiento)
  const totalActivos = gastosFijos.filter((g) => g.activo).reduce((s, g) => s + calcularTotalGastoFijo(g), 0)

  const itemsValidosCount = formItems.filter(item => item.nombre.trim() && parseFloat(item.precio) > 0).length
  const totalForm = formItems.reduce((s, item) => s + (parseInt(item.cantidad) || 1) * (parseFloat(item.precio) || 0), 0)

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Gastos Fijos</h2>
        <button onClick={abrirNuevo} className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors">+ Nuevo Gasto Fijo</button>
      </div>

      {gastosFijos.length > 0 && (
        <div className="bg-white rounded-2xl border border-zinc-100/50 p-4">
          <p className="text-xs text-zinc-400 mb-1">Total gastos fijos mensuales</p>
          <p className="text-2xl font-semibold text-zinc-800">{formatearMoneda(totalActivos)}</p>
        </div>
      )}

      {gastosFijos.length === 0 ? (
        <EmptyState mensaje="No has definido gastos fijos. Agrega tus gastos recurrentes como renta, suscripciones, etc."
          accion="Nuevo Gasto Fijo" onAccion={abrirNuevo} />
      ) : (
        <div className="bg-white rounded-2xl border border-zinc-100/50 divide-y divide-zinc-50">
          {ordenados.map((g) => {
            const total = calcularTotalGastoFijo(g)
            const expandido = expandidos.has(g.id)
            return (
              <div key={g.id}>
                <div className={`flex items-center gap-3 px-4 py-3 hover:bg-zinc-50/50 transition-colors ${!g.activo ? 'opacity-50' : ''}`}>
                  <button onClick={() => toggleActivo(g)}
                    className={`w-5 h-5 rounded-md border-2 flex items-center justify-center transition-colors flex-shrink-0 ${g.activo ? 'bg-zinc-900 border-zinc-900' : 'border-zinc-300 hover:border-zinc-400'}`}>
                    {g.activo && <CheckIcon className="w-3 h-3 text-white" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm font-medium truncate ${g.activo ? 'text-zinc-700' : 'text-zinc-400'}`}>{g.nombre}</p>
                    <p className="text-xs text-zinc-400">{g.categoria} &middot; Día {g.diaVencimiento}{g.descripcion && ` &middot; ${g.descripcion}`}</p>
                  </div>
                  <p className={`text-sm font-semibold ${g.activo ? 'text-zinc-800' : 'text-zinc-400'}`}>{formatearMoneda(total)}</p>
                  {g.items.length > 1 && (
                    <button onClick={() => toggleExpandido(g.id)} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                      {expandido ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
                    </button>
                  )}
                  <button onClick={() => abrirEditar(g)} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors"><PencilSquareIcon className="w-4 h-4" /></button>
                  <button onClick={() => setConfirmarEliminar(g.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"><TrashIcon className="w-4 h-4" /></button>
                </div>
                {expandido && g.items.length > 0 && (
                  <div className="px-4 pb-3 pl-14 space-y-1.5">
                    {g.items.map(item => (
                      <div key={item.id} className="flex items-center gap-2 text-xs text-zinc-500">
                        <span className="text-zinc-400">•</span>
                        <span className="flex-1 truncate">{item.nombre}</span>
                        {item.cantidad > 1 && <span className="text-zinc-400">x{item.cantidad}</span>}
                        <span className="font-medium text-zinc-600">{formatearMoneda(item.precioUnitario)}</span>
                        <span className="text-zinc-300">c/u</span>
                        <span className="font-semibold text-zinc-700">{formatearMoneda(item.cantidad * item.precioUnitario)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar Gasto Fijo' : 'Nuevo Gasto Fijo'}>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nombre</label>
            <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej: Comida Mensual"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Descripción (opcional)</label>
            <textarea value={formDescripcion} onChange={(e) => setFormDescripcion(e.target.value)} placeholder="Descripción..." rows={2}
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 resize-none" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-medium text-zinc-500">Items del Carrito</label>
              <button type="button" onClick={agregarItem} className="text-xs font-medium text-zinc-600 hover:text-zinc-900 flex items-center gap-1">
                <PlusIcon className="w-3.5 h-3.5" /> Agregar Item
              </button>
            </div>
            <div className="space-y-2">
              {formItems.map((item, idx) => (
                <div key={item.id} className="flex items-center gap-2 bg-zinc-50 rounded-xl p-2.5">
                  <span className="text-[10px] text-zinc-400 font-mono w-4">{idx + 1}</span>
                  <input type="text" value={item.nombre} onChange={(e) => actualizarItem(item.id, 'nombre', e.target.value)}
                    placeholder="Producto" className="flex-1 min-w-0 px-2.5 py-1.5 text-xs bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <input type="number" min="1" value={item.cantidad} onChange={(e) => actualizarItem(item.id, 'cantidad', e.target.value)}
                      className="w-14 px-2 py-1.5 text-xs bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10 text-center" placeholder="Cant" />
                    <span className="text-[10px] text-zinc-400">x</span>
                    <input type="number" step="0.01" min="0" value={item.precio} onChange={(e) => actualizarItem(item.id, 'precio', e.target.value)}
                      className="w-20 px-2 py-1.5 text-xs bg-white border-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-zinc-900/10" placeholder="0.00" />
                  </div>
                  <span className="text-xs font-medium text-zinc-600 w-16 text-right">
                    {item.nombre && parseFloat(item.precio) > 0 ? formatearMoneda((parseInt(item.cantidad) || 1) * parseFloat(item.precio)) : '-'}
                  </span>
                  <button onClick={() => eliminarItem(item.id)} className="p-1 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {formItems.length > 0 && (
              <p className="text-xs font-semibold text-zinc-700 text-right mt-2">
                Total: {formatearMoneda(totalForm)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5"><TagIcon className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-zinc-400" /> Categoría</label>
            <div className="relative">
              <select value={formCategoria} onChange={(e) => setFormCategoria(e.target.value)}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
                {CATEGORIAS_GASTO_FIJO.map((cat) => (<option key={cat.label} value={cat.label}>{cat.label}</option>))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Día de Vencimiento</label>
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
          <button onClick={handleGuardar} disabled={!formNombre.trim() || itemsValidosCount === 0}
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editando ? 'Guardar Cambios' : 'Crear Gasto Fijo'}
          </button>
        </div>
      </Modal>

      <Modal abierto={confirmarEliminar !== null} onCerrar={() => setConfirmarEliminar(null)} titulo="Eliminar Gasto Fijo">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">¿Estás seguro de eliminar este gasto fijo con todos sus items?</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button onClick={() => { if (confirmarEliminar) { eliminarGastoFijo(confirmarEliminar); mostrarToast('Gasto fijo eliminado', 'error') }; setConfirmarEliminar(null) }}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
