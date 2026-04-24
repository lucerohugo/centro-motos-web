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

    return () => {
      window.removeEventListener('storage', updateRevendedorData)
      window.removeEventListener('revendedor-updated', updateRevendedorData)
    }
  }, [])

  // Obtener logo del endpoint
  const loadLogo = async (revendedorId: number) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const logoUrl = `${API_BASE}/api/gestion/revendedores/${revendedorId}/logo/`
      
      const response = await fetch(logoUrl)
      if (response.ok) {
        const blob = await response.blob()
        const logoBase64 = URL.createObjectURL(blob)
        setLogoRevendedor(logoBase64)
      } else {
        setLogoRevendedor(null)
      }
    } catch {
      setLogoRevendedor(null)
    }
  }

  // URL para el nombre desde el backend
  const nombreEmpresa = general?.gen_nomb || "Centro Motos"

  return (
    <header className="mb-6 flex items-center justify-between border-b border-border bg-card/40 backdrop-blur-sm px-6 py-3 -mx-6 -mt-8">
      {/* Izquierda: Logo Centro Motos + Nombre de la Empresa */}
      <div className="flex items-center gap-3">
        <img src="/logocm250.png" alt={nombreEmpresa} width={36} height={36} className="rounded w-9 h-9 object-contain" />
        <h1 className="text-base font-semibold text-foreground leading-tight">
          {nombreEmpresa}
        </h1>
      </div>
      
      {/* Centro: Info del Revendedor */}
      {revendedor && (
        <div className="flex items-center gap-3 px-4 py-2 rounded-lg border border-primary/20 bg-primary/5">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center overflow-hidden">
            {logoRevendedor ? (
              <img src={logoRevendedor} alt="Logo" className="h-full w-full object-cover" />
            ) : (
              <UserCheck className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="text-sm">
            <span className="font-medium text-foreground">{revendedor.nombre}</span>
          </div>
        </div>
      )}
      
      {/* Derecha: Theme Toggle + BrixSoftware */}
      <div className="flex items-center gap-4">
        <ThemeToggle />
        <div className="flex items-center gap-2">
          <img src="/isologo.png" alt="BrixSoftware" width={18} height={18} className="rounded-sm w-5 h-5 object-contain" />
          <span className="text-xs font-medium text-muted-foreground">BrixSoftware</span>
        </div>
      </div>
    </header>
  )
}
