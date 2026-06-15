import { Transaccion, Cuenta, Meta, Transferencia } from './types'

export function generarId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`
}

export function formatearMoneda(valor: number): string {
  return new Intl.NumberFormat('es-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(valor)
}

export function formatearFecha(fecha: string): string {
  const d = new Date(fecha + 'T00:00:00')
  return d.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function hoyISO(): string {
  return new Date().toISOString().split('T')[0]
}

export function inicioMesISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
}

export function finMesISO(): string {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
}

export function inicioAnioISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-01-01`
}

export function finAnioISO(): string {
  const d = new Date()
  return `${d.getFullYear()}-12-31`
}

export function inicioSemanaISO(): string {
  const d = new Date()
  d.setDate(d.getDate() - 7)
  return d.toISOString().split('T')[0]
}

export function obtenerBalanceCuenta(
  cuentaId: string,
  saldoInicial: number,
  transacciones: Transaccion[],
  transferencias: Transferencia[] = []
): number {
  const movimientos = transacciones.filter((t) => t.cuentaId === cuentaId)
  const ingresos = movimientos
    .filter((t) => t.tipo === 'ingreso')
    .reduce((s, t) => s + t.monto, 0)
  const gastos = movimientos
    .filter((t) => t.tipo === 'gasto')
    .reduce((s, t) => s + t.monto, 0)
  const enviado = transferencias
    .filter((t) => t.cuentaOrigenId === cuentaId)
    .reduce((s, t) => s + t.monto, 0)
  const recibido = transferencias
    .filter((t) => t.cuentaDestinoId === cuentaId)
    .reduce((s, t) => s + t.monto, 0)
  return saldoInicial + ingresos - gastos + recibido - enviado
}

export function obtenerBalanceGeneral(
  cuentas: Cuenta[],
  transacciones: Transaccion[],
  transferencias: Transferencia[] = []
): number {
  return cuentas.reduce((total, c) => {
    return total + obtenerBalanceCuenta(c.id, c.saldoInicial, transacciones, transferencias)
  }, 0)
}

export function obtenerTotalIngresos(transacciones: Transaccion[]): number {
  return transacciones
    .filter((t) => t.tipo === 'ingreso')
    .reduce((s, t) => s + t.monto, 0)
}

export function obtenerTotalGastos(transacciones: Transaccion[]): number {
  return transacciones
    .filter((t) => t.tipo === 'gasto')
    .reduce((s, t) => s + t.monto, 0)
}

export function obtenerMontoActualMeta(
  meta: Meta,
  totalBalance: number
): number {
  return (totalBalance * meta.porcentajeAsignado) / 100
}

export function obtenerProgresoMeta(
  meta: Meta,
  totalBalance: number
): number {
  const actual = obtenerMontoActualMeta(meta, totalBalance)
  if (meta.montoObjetivo <= 0) return 0
  return Math.min(100, Math.round((actual / meta.montoObjetivo) * 100))
}

export function agruparPorCategoria(
  transacciones: Transaccion[]
): { categoria: string; total: number }[] {
  const grupos: Record<string, number> = {}
  for (const t of transacciones) {
    if (t.tipo === 'gasto') {
      grupos[t.categoria] = (grupos[t.categoria] || 0) + t.monto
    }
  }
  return Object.entries(grupos)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
}

export function agruparIngresosPorCategoria(
  transacciones: Transaccion[]
): { categoria: string; total: number }[] {
  const grupos: Record<string, number> = {}
  for (const t of transacciones) {
    if (t.tipo === 'ingreso') {
      grupos[t.categoria] = (grupos[t.categoria] || 0) + t.monto
    }
  }
  return Object.entries(grupos)
    .map(([categoria, total]) => ({ categoria, total }))
    .sort((a, b) => b.total - a.total)
}

export function obtenerColorCategoria(categoria: string): string {
  const colores: Record<string, string> = {
    Comida: '#fca5a5',
    Transporte: '#fdba74',
    Vivienda: '#c4b5fd',
    Servicios: '#67e8f9',
    Salud: '#86efac',
    Entretenimiento: '#f9a8d4',
    Ropa: '#93c5fd',
    Educación: '#fde68a',
    Viajes: '#5eead4',
    Salario: '#6ee7b7',
    Freelance: '#a5b4fc',
    Inversiones: '#d8b4fe',
    Regalo: '#fda4af',
    Venta: '#fcd34d',
    Suscripciones: '#7dd3fc',
    Seguros: '#bfdbfe',
    Otros: '#d1d5db',
  }
  return colores[categoria] || '#d1d5db'
}

export function obtenerIconoCategoria(categoria: string): string {
  const iconos: Record<string, string> = {
    Comida: '🍽️',
    Transporte: '🚗',
    Vivienda: '🏠',
    Servicios: '💡',
    Salud: '🏥',
    Entretenimiento: '🎬',
    Ropa: '👕',
    Educación: '📚',
    Viajes: '✈️',
    Salario: '💼',
    Freelance: '💻',
    Inversiones: '📈',
    Regalo: '🎁',
    Venta: '🛒',
    Suscripciones: '📺',
    Seguros: '🛡️',
    Otros: '📦',
  }
  return iconos[categoria] || '📦'
}
