'use client'

import { Seccion } from '@/lib/types'
import {
  ChartBarSquareIcon,
  WalletIcon,
  ArrowTrendingDownIcon,
  ArrowTrendingUpIcon,
  FlagIcon,
  ClipboardDocumentListIcon,
  ChartPieIcon,
  CalendarDaysIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline'

const NAV: { id: Seccion; label: string; Icon: React.ComponentType<React.SVGProps<SVGSVGElement>> }[] = [
  { id: 'resumen', label: 'Resumen', Icon: ChartBarSquareIcon },
  { id: 'cuentas', label: 'Cuentas', Icon: WalletIcon },
  { id: 'gastos', label: 'Gastos', Icon: ArrowTrendingDownIcon },
  { id: 'ingresos', label: 'Ingresos', Icon: ArrowTrendingUpIcon },
  { id: 'metas', label: 'Metas', Icon: FlagIcon },
  { id: 'gastos-fijos', label: 'Gastos Fijos', Icon: ClipboardDocumentListIcon },
  { id: 'ingresos-fijos', label: 'Ingresos Fijos', Icon: ArrowTrendingUpIcon },
  { id: 'estadisticas', label: 'Estadísticas', Icon: ChartPieIcon },
  { id: 'calendario', label: 'Calendario', Icon: CalendarDaysIcon },
]

interface SidebarProps {
  activa: Seccion
  onChange: (s: Seccion) => void
  abierta: boolean
  onToggle: () => void
}

export default function Sidebar({ activa, onChange, abierta, onToggle }: SidebarProps) {
  return (
    <>
      {abierta && (
        <div
          className="fixed inset-0 bg-black/20 z-20 lg:hidden"
          onClick={onToggle}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white/80 backdrop-blur-xl border-r border-zinc-200/50 transition-all duration-300 ease-out flex flex-col ${
          abierta ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-100 flex-shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-100 rounded-xl">
            <WalletIcon className="w-4 h-4 text-zinc-600" />
            <span className="text-sm font-semibold text-zinc-700">FinanzasML</span>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden text-zinc-400 hover:text-zinc-600 p-1.5 rounded-lg hover:bg-zinc-100 transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {NAV.map((item) => {
            const Icon = item.Icon
            const isActive = activa === item.id
            return (
              <button
                key={item.id}
                onClick={() => {
                  onChange(item.id)
                  if (window.innerWidth < 1024) onToggle()
                }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                  isActive
                    ? 'bg-zinc-100 text-zinc-900'
                    : 'text-zinc-500 hover:text-zinc-800 hover:bg-zinc-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-zinc-900' : 'text-zinc-400'}`} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="px-3 py-2 flex justify-center">
          <img src="/imgs/navbarimg.jpg" alt="" className="w-30 h-auto opacity-80" />
        </div>

        <div className="px-4 py-3 border-t border-zinc-100">
          <p className="text-[10px] text-zinc-400 font-medium tracking-widest uppercase">
            FinanzasML &middot; v1.0
          </p>
        </div>
      </aside>
    </>
  )
}
