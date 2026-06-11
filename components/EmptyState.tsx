import { InboxArrowDownIcon } from '@heroicons/react/24/outline'

interface EmptyStateProps {
  mensaje: string
  accion?: string
  onAccion?: () => void
}

export default function EmptyState({ mensaje, accion, onAccion }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-14 h-14 rounded-xl bg-zinc-100 flex items-center justify-center mb-4">
        <InboxArrowDownIcon className="w-7 h-7 text-zinc-400" />
      </div>
      <p className="text-zinc-400 text-sm mb-5 max-w-xs">{mensaje}</p>
      {accion && onAccion && (
        <button onClick={onAccion}
          className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors">
          {accion}
        </button>
      )}
    </div>
  )
}
