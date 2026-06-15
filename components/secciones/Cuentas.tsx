'use client'

import { useApp } from '@/components/AppProvider'
import { useState } from 'react'
import { useToast } from '@/components/Toast'
import Modal from '@/components/Modal'
import EmptyState from '@/components/EmptyState'
import { TIPOS_CUENTA, COLORES_CUENTA, Cuenta, TipoCuenta } from '@/lib/types'
import { obtenerBalanceCuenta, formatearMoneda } from '@/lib/utils'
import { useTasas } from '@/hooks/useTasas'
import { PencilSquareIcon, TrashIcon, CreditCardIcon, ChevronDownIcon } from '@heroicons/react/24/outline'

export default function Cuentas() {
  const { data, agregarCuenta, actualizarCuenta, eliminarCuenta } = useApp()
  const { mostrarToast } = useToast()
  const { cuentas, transacciones, transferencias } = data
  const tasas = useTasas()

  const [modalAbierto, setModalAbierto] = useState(false)
  const [editando, setEditando] = useState<Cuenta | null>(null)
  const [confirmarEliminar, setConfirmarEliminar] = useState<string | null>(null)
  const [formNombre, setFormNombre] = useState('')
  const [formTipo, setFormTipo] = useState<TipoCuenta>('efectivo')
  const [formSaldo, setFormSaldo] = useState('')
  const [formColor, setFormColor] = useState(COLORES_CUENTA[0])

  function abrirNueva() {
    setEditando(null); setFormNombre(''); setFormTipo('efectivo'); setFormSaldo(''); setFormColor(COLORES_CUENTA[0]); setModalAbierto(true)
  }
  function abrirEditar(c: Cuenta) {
    setEditando(c); setFormNombre(c.nombre); setFormTipo(c.tipo); setFormSaldo(String(c.saldoInicial)); setFormColor(c.color); setModalAbierto(true)
  }
  function handleGuardar() {
    if (!formNombre.trim()) return
    const saldo = parseFloat(formSaldo) || 0
    if (editando) { actualizarCuenta(editando.id, { nombre: formNombre.trim(), tipo: formTipo, saldoInicial: saldo, color: formColor }); mostrarToast('Cuenta actualizada', 'success') }
    else { agregarCuenta({ nombre: formNombre.trim(), tipo: formTipo, saldoInicial: saldo, color: formColor }); mostrarToast('Cuenta creada', 'success') }
    setModalAbierto(false)
  }
  function handleEliminar(id: string) { eliminarCuenta(id); setConfirmarEliminar(null); mostrarToast('Cuenta eliminada', 'error') }

  const tiposInfo = Object.fromEntries(TIPOS_CUENTA.map((t) => [t.value, t]))

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-800">Cuentas</h2>
        <button onClick={abrirNueva} className="px-4 py-2 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors">+ Nueva Cuenta</button>
      </div>

      {cuentas.length === 0 ? (
        <EmptyState mensaje="No has creado ninguna cuenta. Crea una para empezar a gestionar tu dinero." accion="Crear Cuenta" onAccion={abrirNueva} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {cuentas.map((c) => {
            const balance = obtenerBalanceCuenta(c.id, c.saldoInicial, transacciones, transferencias)
            const tasa = c.tipo === 'dolar' ? tasas?.usd : c.tipo === 'euro' ? tasas?.eur : null
            const balanceCup = tasa ? balance * tasa : null
            return (
              <div key={c.id} className="bg-white rounded-2xl border border-zinc-100/50 p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full flex-shrink-0" style={{ backgroundColor: c.color }} />
                    <div>
                      <p className="text-sm font-semibold text-zinc-800">{c.nombre}</p>
                      <p className="text-xs text-zinc-400">{tiposInfo[c.tipo]?.icon} {tiposInfo[c.tipo]?.label}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => abrirEditar(c)} className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-colors">
                      <PencilSquareIcon className="w-4 h-4" />
                    </button>
                    <button onClick={() => setConfirmarEliminar(c.id)} className="p-1.5 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="flex items-baseline gap-2">
                  <p className="text-2xl font-semibold text-zinc-800">{formatearMoneda(balance)}</p>
                  <p className="text-xs text-zinc-400">Saldo inicial: {formatearMoneda(c.saldoInicial)}</p>
                </div>
                {balanceCup && (
                  <p className="text-xs text-zinc-400 mt-1">
                    ≈ {formatearMoneda(balanceCup)} <span className="text-zinc-300">CUP</span>
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal abierto={modalAbierto} onCerrar={() => setModalAbierto(false)} titulo={editando ? 'Editar Cuenta' : 'Nueva Cuenta'}>
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Nombre</label>
            <input type="text" value={formNombre} onChange={(e) => setFormNombre(e.target.value)} placeholder="Ej: Efectivo diario"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">
              <CreditCardIcon className="w-3.5 h-3.5 inline-block mr-1.5 -mt-0.5 text-zinc-400" /> Tipo
            </label>
            <div className="relative">
              <select value={formTipo} onChange={(e) => setFormTipo(e.target.value as TipoCuenta)}
                className="w-full px-3.5 py-2.5 pr-10 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10 appearance-none">
                {TIPOS_CUENTA.map((t) => (<option key={t.value} value={t.value}>{t.label}</option>))}
              </select>
              <ChevronDownIcon className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 mb-1.5">Saldo Inicial</label>
            <input type="number" step="0.01" value={formSaldo} onChange={(e) => setFormSaldo(e.target.value)} placeholder="0.00"
              className="w-full px-3.5 py-2.5 text-sm bg-zinc-100 border-0 rounded-xl focus:outline-none focus:ring-2 focus:ring-zinc-900/10" />
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
          <button onClick={handleGuardar} disabled={!formNombre.trim()}
            className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            {editando ? 'Guardar Cambios' : 'Crear Cuenta'}
          </button>
        </div>
      </Modal>

      <Modal abierto={confirmarEliminar !== null} onCerrar={() => setConfirmarEliminar(null)} titulo="Eliminar Cuenta">
        <div className="space-y-4">
          <p className="text-sm text-zinc-600">¿Estás seguro? Se eliminarán también todas las transacciones asociadas a esta cuenta.</p>
          <div className="flex gap-2">
            <button onClick={() => setConfirmarEliminar(null)}
              className="flex-1 py-2.5 text-sm font-medium text-zinc-600 bg-zinc-100 rounded-xl hover:bg-zinc-200 transition-colors">Cancelar</button>
            <button onClick={() => confirmarEliminar && handleEliminar(confirmarEliminar)}
              className="flex-1 py-2.5 text-sm font-medium text-white bg-red-500 rounded-xl hover:bg-red-600 transition-colors">Eliminar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
