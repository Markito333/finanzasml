'use client'

import { useState } from 'react'
import { AppProvider } from '@/components/AppProvider'
import { ToastProvider } from '@/components/Toast'
import Sidebar from '@/components/Sidebar'
import ImportExport from '@/components/ImportExport'
import Resumen from '@/components/secciones/Resumen'
import Cuentas from '@/components/secciones/Cuentas'
import Gastos from '@/components/secciones/Gastos'
import Ingresos from '@/components/secciones/Ingresos'
import Metas from '@/components/secciones/Metas'
import GastosFijos from '@/components/secciones/GastosFijos'
import IngresosFijos from '@/components/secciones/IngresosFijos'
import Estadisticas from '@/components/secciones/Estadisticas'
import Calendario from '@/components/secciones/Calendario'
import { Seccion } from '@/lib/types'
import { ReactNode } from 'react'
import { Bars3Icon } from '@heroicons/react/24/outline'

const TITULOS: Record<Seccion, string> = {
  resumen: 'Resumen',
  cuentas: 'Cuentas',
  gastos: 'Gastos',
  ingresos: 'Ingresos',
  metas: 'Metas',
  'gastos-fijos': 'Gastos Fijos',
  'ingresos-fijos': 'Ingresos Fijos',
  estadisticas: 'Estadísticas',
  calendario: 'Calendario',
}

function HomeContent() {
  const [seccion, setSeccion] = useState<Seccion>('resumen')
  const [sidebarAbierta, setSidebarAbierta] = useState(false)

  const secciones: Record<Seccion, ReactNode> = {
    resumen: <Resumen onNavigate={setSeccion} />,
    cuentas: <Cuentas />,
    gastos: <Gastos />,
    ingresos: <Ingresos />,
    metas: <Metas />,
    'gastos-fijos': <GastosFijos />,
    'ingresos-fijos': <IngresosFijos />,
    estadisticas: <Estadisticas />,
    calendario: <Calendario />,
  }

  return (
    <div className="min-h-screen bg-zinc-50 lg:pl-64">
      <Sidebar
        activa={seccion}
        onChange={setSeccion}
        abierta={sidebarAbierta}
        onToggle={() => setSidebarAbierta(!sidebarAbierta)}
      />
      <main className="flex flex-col h-screen">
        <header className="sticky top-0 z-10 bg-white/60 backdrop-blur-xl border-b border-zinc-100 px-4 lg:px-8 py-3 flex items-center gap-3 flex-shrink-0">
          <button
            onClick={() => setSidebarAbierta(true)}
            className="lg:hidden p-2 -ml-2 text-zinc-400 hover:text-zinc-700 rounded-xl hover:bg-zinc-100 transition-colors"
          >
            <Bars3Icon className="w-5 h-5" />
          </button>
          <h1 className="text-sm font-semibold text-zinc-800">{TITULOS[seccion]}</h1>
          <div className="flex-1" />
          <ImportExport />
        </header>
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">{secciones[seccion]}</div>
      </main>
    </div>
  )
}

export default function Home() {
  return (
    <AppProvider>
      <ToastProvider>
        <HomeContent />
      </ToastProvider>
    </AppProvider>
  )
}
