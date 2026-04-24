'use client'

import Image from "next/image"
import { ThemeToggle } from "./theme-toggle"
import { useState, useEffect } from "react"
import { UserCheck } from "lucide-react"
import { useGeneral } from "@/lib/use-dbf"

interface RevendedorData {
  id: number
  nombre: string
  destino: number
}

export function AppHeader() {
  const [revendedor, setRevendedor] = useState<RevendedorData | null>(null)
  const [logoRevendedor, setLogoRevendedor] = useState<string | null>(null)
  const { general } = useGeneral()

  useEffect(() => {
    const updateRevendedorData = () => {
      try {
        const raw = sessionStorage.getItem('revendedor_login')
        if (raw) {
          const data = JSON.parse(raw)
          setRevendedor(data)
          
          // Obtener logo del endpoint si existe revendedor
          if (data.id) {
            loadLogo(data.id)
          }
        }
      } catch {
        // ignorar
      }
    }

    // Cargar datos iniciales
    updateRevendedorData()

    // Escuchar cambios en sessionStorage desde otras pestañas/iframes
    window.addEventListener('storage', updateRevendedorData)

    // También escuchar evento personalizado para cambios en la misma pestaña
    window.addEventListener('revendedor-updated', updateRevendedorData)
    
    // Escuchar cambios específicos de logo
    window.addEventListener('logo-updated', updateRevendedorData)

    return () => {
      window.removeEventListener('storage', updateRevendedorData)
      window.removeEventListener('revendedor-updated', updateRevendedorData)
      window.removeEventListener('logo-updated', updateRevendedorData)
    }
  }, [])

  // Obtener logo del endpoint (silenciosamente si no existe)
  const loadLogo = async (revendedorId: number) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      // Agregar timestamp para forzar que no cachee
      const logoUrl = `${API_BASE}/api/gestion/revendedores/${revendedorId}/logo/?t=${Date.now()}`
      
      const response = await fetch(logoUrl, { signal: AbortSignal.timeout(5000) })
      if (response.ok) {
        const blob = await response.blob()
        const logoBase64 = URL.createObjectURL(blob)
        setLogoRevendedor(logoBase64)
      } else {
        // 404 o error significa que no tiene logo - es normal, no mostrar error
        setLogoRevendedor(null)
      }
    } catch (err) {
      // Errores de red o timeout - no mostrar, solo dejar sin logo
      setLogoRevendedor(null)
    }
  }

  // URL para el nombre desde el backend
  const nombreEmpresa = general?.gen_nomb || "Centro Motos"

  return (
    <header className="mb-6 flex flex-col border-b border-border bg-card/40 backdrop-blur-sm px-4 md:px-6 py-3 -mx-4 md:-mx-6 md:-mt-8 gap-3">
      {/* Fila Superior: Logo Centro Motos + Nombre | Theme Toggle + BrixSoftware */}
      <div className="flex items-center justify-between">
        {/* Izquierda: Logo Centro Motos + Nombre de la Empresa */}
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <img src="/logocm250.png" alt={nombreEmpresa} width={36} height={36} className="rounded w-8 h-8 md:w-9 md:h-9 object-contain flex-shrink-0" />
          <h1 className="text-sm md:text-base font-semibold text-foreground leading-tight truncate">
            {nombreEmpresa}
          </h1>
        </div>
        
        {/* Derecha: Theme Toggle + BrixSoftware */}
        <div className="flex items-center gap-3 md:gap-4">
          <ThemeToggle />
          <div className="flex items-center gap-1 md:gap-2">
            <img src="/isologo.png" alt="BrixSoftware" width={18} height={18} className="rounded-sm w-4 h-4 md:w-5 md:h-5 object-contain flex-shrink-0" />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">BrixSoftware</span>
          </div>
        </div>
      </div>
      
      {/* Fila Inferior: Info del Revendedor */}
      {revendedor && (
        <div className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 rounded-lg border border-primary/20 bg-primary/5 min-w-0">
          <div className="h-8 w-8 md:h-10 md:w-10 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden flex-shrink-0">
            {logoRevendedor ? (
              <img src={logoRevendedor} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-primary" />
            )}
          </div>
          <div className="text-xs md:text-sm min-w-0">
            <span className="font-medium text-foreground truncate block">{revendedor.nombre}</span>
          </div>
        </div>
      )}
    </header>
  )
}
