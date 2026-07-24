'use client'

import { useState } from 'react'
import { AlertCircle, Eye, EyeOff, Loader2 } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { validarLogin, useGeneral } from '@/lib/use-dbf'
import { ThemeToggle } from '@/components/theme-toggle'

interface RevendedorData {
  id: number
  destino: number  // REV_DEST - depósito asignado al revendedor
  nombre: string
  direccion: string
  telefono: string
  celular: string
  email: string
}

interface LoginFormProps {
  onLoginSuccess: (revendedor: RevendedorData) => void
  isOpen: boolean
}

/** Guarda los datos del revendedor en sessionStorage (se borra al cerrar la app) */
export function guardarLogin(revendedor: RevendedorData) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('revendedor_login', JSON.stringify(revendedor))
  }
}

/** Lee los datos del revendedor de sessionStorage */
export function leerLoginRevendedor(): RevendedorData | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem('revendedor_login')
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/** Borra las credenciales de login */
export function borrarLogin() {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('revendedor_login')
  }
}

export function LoginForm({ onLoginSuccess, isOpen }: LoginFormProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [clave, setClave] = useState('')
  const [mostrarClave, setMostrarClave] = useState(false)
  const { general } = useGeneral()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validación: contraseña requerida
    if (!clave.trim()) {
      setError('La contraseña es requerida')
      return
    }

    setLoading(true)

    try {
      // Validar contra REVE.DBF (buscar por contraseña)
      const result = await validarLogin('', clave)

      if (!result.success) {
        setError(result.error || 'Credenciales inválidas')
        return
      }

      if (!result.revendedor) {
        setError('Error al obtener datos del revendedor')
        return
      }

      // Guardar datos del revendedor
      guardarLogin(result.revendedor)
      
      // Callback exitoso
      onLoginSuccess(result.revendedor)

    } catch (err) {
      setError('Error al conectar con el sistema')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      {/* Botón de tema en esquina superior derecha */}
      <div className="fixed right-6 top-6">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-14 shadow-lg">
        <div className="flex items-center justify-center gap-3 mb-2">
          <img src="/logocm250.png" alt="Centro Motos" className="h-12 w-12 rounded" />
          <h1 className="text-2xl font-semibold text-foreground">
            {general?.gen_nomb || 'Centro Motos'}
          </h1>
        </div>
        <p className="mb-6 text-center text-xs text-muted-foreground">
          Ingrese sus credenciales de revendedor
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contraseña */}
          <div>
            <label className="block text-xs font-semibold text-foreground">
              Contraseña
            </label>
            <div className="relative mt-1">
              <input
                type={mostrarClave ? 'text' : 'password'}
                value={clave}
                onChange={(e) => {
                  setClave(e.target.value)
                  setError(null)
                }}
                placeholder="Ingrese su contraseña"
                disabled={loading}
                className="w-full rounded-lg border border-input bg-background px-3 py-2 pr-10 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary disabled:opacity-50"
              />
              <button
                type="button"
                onClick={() => setMostrarClave(!mostrarClave)}
                disabled={loading}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {mostrarClave ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Botón Ingresar */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Validando...
              </>
            ) : (
              'Ingresar'
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
