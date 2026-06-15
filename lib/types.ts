export type TipoCuenta = 'efectivo' | 'tarjeta' | 'dolar' | 'euro' | 'cup' | 'otro'

export type TipoTransaccion = 'gasto' | 'ingreso'

export interface Transferencia {
  id: string
  cuentaOrigenId: string
  cuentaDestinoId: string
  monto: number
  descripcion: string
  fecha: string
  createdAt: string
}

export interface Cuenta {
  id: string
  nombre: string
  tipo: TipoCuenta
  saldoInicial: number
  color: string
}

export interface Transaccion {
  id: string
  tipo: TipoTransaccion
  monto: number
  descripcion: string
  categoria: string
  cuentaId: string
  fecha: string
  createdAt: string
}

export interface Meta {
  id: string
  nombre: string
  descripcion: string
  montoObjetivo: number
  porcentajeAsignado: number
  color: string
  createdAt: string
}

export interface GastoFijoItem {
  id: string
  nombre: string
  cantidad: number
  precioUnitario: number
}

export function calcularTotalGastoFijo(g: GastoFijo): number {
  return g.items.reduce((sum, item) => sum + item.cantidad * item.precioUnitario, 0)
}

export interface GastoFijo {
  id: string
  nombre: string
  descripcion: string
  categoria: string
  diaVencimiento: number
  activo: boolean
  items: GastoFijoItem[]
}

export interface IngresoFijo {
  id: string
  nombre: string
  descripcion: string
  monto: number
  categoria: string
  diaIngreso: number
  activo: boolean
}

export interface AppData {
  cuentas: Cuenta[]
  transacciones: Transaccion[]
  metas: Meta[]
  gastosFijos: GastoFijo[]
  ingresosFijos: IngresoFijo[]
  transferencias: Transferencia[]
}

export type Seccion = 'resumen' | 'cuentas' | 'gastos' | 'ingresos' | 'metas' | 'gastos-fijos' | 'estadisticas' | 'calendario' | 'ingresos-fijos' | 'transferencias'

export const CATEGORIAS_GASTO: { label: string; icon: string }[] = [
  { label: 'Comida', icon: '🍽️' },
  { label: 'Transporte', icon: '🚗' },
  { label: 'Vivienda', icon: '🏠' },
  { label: 'Servicios', icon: '💡' },
  { label: 'Salud', icon: '🏥' },
  { label: 'Entretenimiento', icon: '🎬' },
  { label: 'Ropa', icon: '👕' },
  { label: 'Educación', icon: '📚' },
  { label: 'Viajes', icon: '✈️' },
  { label: 'Otros', icon: '📦' },
]

export const CATEGORIAS_INGRESO: { label: string; icon: string }[] = [
  { label: 'Salario', icon: '💼' },
  { label: 'Freelance', icon: '💻' },
  { label: 'Inversiones', icon: '📈' },
  { label: 'Regalo', icon: '🎁' },
  { label: 'Venta', icon: '🛒' },
  { label: 'Otros', icon: '📦' },
]

export const TIPOS_CUENTA: { value: TipoCuenta; label: string; icon: string }[] = [
  { value: 'efectivo', label: 'Efectivo', icon: '💵' },
  { value: 'tarjeta', label: 'Tarjeta', icon: '💳' },
  { value: 'dolar', label: 'Dólar', icon: '💲' },
  { value: 'euro', label: 'Euro', icon: '💶' },
  { value: 'cup', label: 'CUP', icon: '🇨🇺' },
  { value: 'otro', label: 'Otro', icon: '🏦' },
]

export const COLORES_CUENTA = [
  '#93c5fd',
  '#86efac',
  '#fde68a',
  '#fca5a5',
  '#c4b5fd',
  '#f9a8d4',
  '#67e8f9',
  '#fdba74',
]

export const CATEGORIAS_GASTO_FIJO: { label: string; icon: string }[] = [
  { label: 'Comida', icon: '🍽️' },
  { label: 'Transporte', icon: '🚗' },
  { label: 'Vivienda', icon: '🏠' },
  { label: 'Servicios', icon: '💡' },
  { label: 'Salud', icon: '🏥' },
  { label: 'Entretenimiento', icon: '🎬' },
  { label: 'Suscripciones', icon: '📺' },
  { label: 'Seguros', icon: '🛡️' },
  { label: 'Otros', icon: '📦' },
]
