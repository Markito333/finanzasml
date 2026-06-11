'use client'

import { useRef, useState } from 'react'
import { useApp } from './AppProvider'
import { ArrowDownOnSquareIcon, ArrowUpOnSquareIcon } from '@heroicons/react/24/outline'

export default function ImportExport() {
  const { data, importarData } = useApp()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')

  function handleExport() {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `finanzasml-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleImportClick() {
    inputRef.current?.click()
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setError('')
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string)
        if (
          !parsed ||
          typeof parsed !== 'object' ||
          !('cuentas' in parsed) ||
          !('transacciones' in parsed)
        ) {
          setError('El archivo no tiene el formato correcto.')
          return
        }
        importarData(parsed)
      } catch {
        setError('Error al leer el archivo JSON.')
      }
    }
    reader.readAsText(file)
    e.target.value = ''
  }

  return (
    <div className="flex items-center gap-2">
      {error && (
        <span className="text-xs text-red-500 hidden sm:block">{error}</span>
      )}
      <input
        ref={inputRef}
        type="file"
        accept=".json"
        onChange={handleFileChange}
        className="hidden"
      />
      <button
        onClick={handleImportClick}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
      >
        <ArrowDownOnSquareIcon className="w-3.5 h-3.5" />
        Cargar
      </button>
      <button
        onClick={handleExport}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:text-zinc-800 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
      >
        <ArrowUpOnSquareIcon className="w-3.5 h-3.5" />
        Guardar
      </button>
    </div>
  )
}
