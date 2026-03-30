'use client'

import { useEffect, useState, useMemo } from 'react'
import { AlertCircle, Loader2, Search } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Revendedor } from '@/lib/types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
const API_URL = `${API_BASE_URL}/api/gestion`

interface SelectorRevendedorProps {
  onSelectRevendedor: (id: number, nombre: string) => void
  isOpen: boolean
}

/** Guarda el revendedor seleccionado en localStorage */
export function guardarRevendedor(id: number, nombre: string, destino: number = 0) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('revendedor', JSON.stringify({ id, nombre, destino }))
  }
}

/** Lee el revendedor seleccionado de localStorage */
export function leerRevendedor(): { id: number; nombre: string; destino: number } | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem('revendedor')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Borra el revendedor de localStorage */
export function borrarRevendedor() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('revendedor')
  }
}

export function SelectorRevendedor({ onSelectRevendedor, isOpen }: SelectorRevendedorProps) {
  const [revendedores, setRevendedores] = useState<Revendedor[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busqueda, setBusqueda] = useState('')

  useEffect(() => {
    if (!isOpen) return

    const loadRevendedores = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`${API_URL}/revendedores/`)
        if (!response.ok) throw new Error('Error al conectar con el servidor')

        const data = await response.json()
        const lista: Revendedor[] = Array.isArray(data) ? data : (data.results || [])
        setRevendedores(lista)

        if (lista.length === 0) {
          setError('No se encontraron revendedores en la base de datos')
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error desconocido'
        setError(message)
      } finally {
        setLoading(false)
      }
    }

    loadRevendedores()
  }, [isOpen])

  const filtrados = useMemo(() => {
    if (!busqueda.trim()) return revendedores
    const q = busqueda.toLowerCase()
    return revendedores.filter(
      (r) =>
        r.rev_nomb.toLowerCase().includes(q) ||
        r.rev_dire?.toLowerCase().includes(q) ||
        String(r.rev_codi).includes(q)
    )
  }, [revendedores, busqueda])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg mx-4 rounded-xl border border-border bg-card p-6 shadow-xl">
        <h2 className="mb-1 text-lg font-semibold text-foreground">
          Seleccionar Revendedor
        </h2>
        <p className="mb-4 text-xs text-muted-foreground">
          Busca y selecciona tu revendedor para continuar
        </p>

        {/* Buscador */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar por nombre, localidad o ID..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoFocus
            className="h-10 w-full rounded-lg border border-border bg-background pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
          />
        </div>

        {loading && (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            <span className="text-sm text-muted-foreground">Cargando revendedores...</span>
          </div>
        )}

        {error && (
          <Alert className="mb-4 border-red-600 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {!loading && revendedores.length > 0 && (
          <>
            <div className="mb-2 text-xs text-muted-foreground">
              {filtrados.length} de {revendedores.length} revendedores
            </div>
            <div className="flex flex-col gap-1.5 max-h-80 overflow-y-auto pr-1">
              {filtrados.map((rev) => (
                <button
                  key={rev.rev_codi}
                  onClick={() => {
                    const destino = Number(rev.rev_dest) || 0
                    guardarRevendedor(rev.rev_codi, rev.rev_nomb, destino)
                    onSelectRevendedor(rev.rev_codi, rev.rev_nomb)
                  }}
                  className="rounded-lg border border-border bg-background px-4 py-3 text-left hover:border-primary hover:bg-accent transition-all group"
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-sm text-foreground truncate">
                        {rev.rev_nomb}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        ID: {rev.rev_codi} · {rev.rev_dire || ''} · Tel: {rev.rev_tele || ''}
                      </div>
                    </div>
                    <div className="ml-3 text-primary opacity-0 group-hover:opacity-100 transition-opacity font-semibold">
                      →
                    </div>
                  </div>
                </button>
              ))}
              {filtrados.length === 0 && (
                <div className="py-6 text-center text-sm text-muted-foreground">
                  No se encontraron resultados para "{busqueda}"
                </div>
              )}
            </div>
          </>
        )}

        {!loading && revendedores.length === 0 && !error && (
          <div className="py-8 text-center text-muted-foreground">
            No hay revendedores disponibles
          </div>
        )}
      </div>
    </div>
  )
}
