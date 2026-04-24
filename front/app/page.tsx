'use client'

import Link from "next/link"
import { FileText, Package, CreditCard, ChevronRight, UserCheck, LogOut, Loader2, ClipboardList, Settings, Upload, X, Trash2 } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { ROUTES } from "@/lib/routes.config"
import { useState, useEffect } from "react"
import { LoginForm, leerLoginRevendedor, borrarLogin, guardarLogin } from "./login-form"
import { guardarRevendedor, borrarRevendedor } from "./selector-revendedor"
import { abrirCuentaCorriente, useGeneral } from "@/lib/use-dbf"

interface RevendedorData {
  id: number
  destino: number  // REV_DEST - depósito asignado al revendedor
  nombre: string
  direccion: string
  telefono: string
  celular: string
  email: string
}

const menuItems = [
  {
    label: "Pedido de Facturacion",
    href: ROUTES.PEDIDO_FACTURACION,
    description: "Nuevo pedido de facturacion",
    icon: FileText,
  },
  {
    label: "Mis Pedidos",
    href: ROUTES.MIS_PEDIDOS,
    description: "Ver y editar pedidos existentes",
    icon: ClipboardList,
  },
  {
    label: "Ver Stock de Motocicletas",
    href: ROUTES.STOCK_MOTOCICLETAS,
    description: "Consultar stock disponible",
    icon: Package,
  },
]

export default function Page() {
  const [revendedor, setRevendedor] = useState<RevendedorData | null>(null)
  const [showLoginForm, setShowLoginForm] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [loadingCC, setLoadingCC] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [logoRevendedor, setLogoRevendedor] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoTimestamp, setLogoTimestamp] = useState(Date.now())
  const { general } = useGeneral()

  // Cargar logo fresco del backend
  const loadLogoFromBackend = async (revendedorId: number) => {
    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const logoUrl = `${API_BASE}/api/gestion/revendedores/${revendedorId}/logo/?t=${Date.now()}`
      const response = await fetch(logoUrl)
      if (response.ok) {
        const blob = await response.blob()
        const logoBase64 = URL.createObjectURL(blob)
        setLogoRevendedor(logoBase64)
      }
    } catch (err) {
      console.error('Error loading logo:', err)
      setLogoRevendedor(null)
    }
  }

  // Verificar si existe logo del revendedor
  const checkLogoRevendedor = (revendedorData: RevendedorData, forceRefresh = false) => {
    // Usar el logo del backend si está disponible
    if (revendedorData.rev_logo_url) {
      if (forceRefresh) {
        setLogoRevendedor(revendedorData.rev_logo_url + '?t=' + Date.now())
      } else {
        setLogoRevendedor(revendedorData.rev_logo_url)
      }
    } else {
      // No hay logo - dejar en null (no mostrar nada)
      setLogoRevendedor(null)
    }
  }

  const handleUploadLogo = async () => {
    if (!revendedor) return

    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]
      if (!file) return

      setUploadingLogo(true)
      try {
        const formData = new FormData()
        formData.append('archivo', file)

        const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
        const response = await fetch(`${API_BASE}/api/gestion/revendedores/${revendedor.id}/upload-logo/`, {
          method: 'POST',
          body: formData
        })

        if (response.ok) {
          const revendedorData = await response.json()
          // El POST devuelve el serializer completo con rev_logo_url
          const updatedRevendedor = {
            id: revendedorData.rev_codi,
            destino: revendedorData.rev_dest || 0,
            nombre: revendedorData.rev_nomb,
            direccion: revendedorData.rev_dire || '',
            telefono: revendedorData.rev_tele || '',
            celular: '',
            email: revendedorData.rev_emai || '',
          }
          setRevendedor(updatedRevendedor)
          guardarLogin(updatedRevendedor)
          // Notificar al header de cambios de logo
          window.dispatchEvent(new Event('logo-updated'))
          window.dispatchEvent(new Event('revendedor-updated'))
          checkLogoRevendedor(updatedRevendedor, true)
          setShowSettings(false)
        } else {
          const errorData = await response.json()
          alert(`Error al guardar el logo: ${errorData.error || 'Error desconocido'}`)
        }
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err)
        alert('Error al subir el logo: ' + errorMsg)
      } finally {
        setUploadingLogo(false)
      }
    }
    input.click()
  }

  const handleDeleteLogo = async () => {
    if (!revendedor || !logoRevendedor) return
    
    if (!confirm('¿Está seguro de que desea eliminar el logo?')) return

    try {
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_BASE}/api/gestion/revendedores/${revendedor.id}/delete-logo/`, {
        method: 'DELETE'
      })

      if (response.ok) {
        const updatedRevendedor = {
          ...revendedor
        }
        setRevendedor(updatedRevendedor)
        guardarLogin(updatedRevendedor)
        // Notificar al header de cambios de logo
        window.dispatchEvent(new Event('logo-updated'))
        window.dispatchEvent(new Event('revendedor-updated'))
        setLogoRevendedor(null)
      } else {
        const errorData = await response.json()
        alert(`Error al eliminar el logo: ${errorData.error || 'Error desconocido'}`)
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      alert('Error al eliminar el logo: ' + errorMsg)
    }
  }

  const handleAbrirCuentaCorriente = async () => {
    setLoadingCC(true)
    try {
      const result = await abrirCuentaCorriente(revendedor?.id || 0)
      if (!result.success) {
        alert(result.error || 'Error al abrir Cuenta Corriente')
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err)
      alert('Error al abrir Cuenta Corriente: ' + errorMsg)
    } finally {
      setLoadingCC(false)
    }
  }

  useEffect(() => {
    setMounted(true)
    // Leer sessionStorage (persiste durante la sesión, se borra al cerrar la app)
    const savedRevendedor = leerLoginRevendedor()
    if (savedRevendedor) {
      setRevendedor(savedRevendedor)
      guardarRevendedor(savedRevendedor.id, savedRevendedor.nombre, savedRevendedor.destino)
      checkLogoRevendedor(savedRevendedor)
    } else {
      setShowLoginForm(true)
    }

    // Listener para recargar el logo cuando se actualiza
    const handleLogoUpdate = () => {
      if (savedRevendedor) {
        loadLogoFromBackend(savedRevendedor.id)
      }
    }

    window.addEventListener('logo-updated', handleLogoUpdate)
    return () => {
      window.removeEventListener('logo-updated', handleLogoUpdate)
    }
  }, [])

  const handleLoginSuccess = (revendedorData: RevendedorData) => {
    setRevendedor(revendedorData)
    setShowLoginForm(false)
    // Guardar en sessionStorage para mantener sesión durante navegación
    guardarLogin(revendedorData)
    // También guardar en selector-revendedor para compatibilidad
    guardarRevendedor(revendedorData.id, revendedorData.nombre, revendedorData.destino)
    // Verificar si tiene logo
    checkLogoRevendedor(revendedorData)
  }

  const handleLogout = () => {
    borrarLogin()
    borrarRevendedor()
    setRevendedor(null)
    setShowLoginForm(true)
  }

  if (!mounted) return null

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <LoginForm
        isOpen={showLoginForm}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Modal de Ajustes */}
      {showSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Ajustes</h2>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-1 hover:bg-accent"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Logo del Revendedor</label>
                <p className="text-xs text-muted-foreground mb-3">
                  Seleccione una imagen PNG para usar como logo de su negocio.
                </p>
                
                <div className="flex items-center gap-4">
                  {logoRevendedor ? (
                    <div className="relative h-16 w-16 rounded-lg border border-border overflow-hidden group">
                      <img src={logoRevendedor} alt="Logo actual" className="h-full w-full object-cover" />
                      <button
                        onClick={handleDeleteLogo}
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/80"
                        title="Eliminar logo"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="h-16 w-16 rounded-lg border border-dashed border-border flex items-center justify-center">
                      <UserCheck className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <button
                      onClick={handleUploadLogo}
                      disabled={uploadingLogo}
                      className={`flex items-center justify-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium cursor-pointer hover:bg-accent transition-all ${uploadingLogo ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {uploadingLogo ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Upload className="h-4 w-4" />
                      )}
                      {logoRevendedor ? 'Cambiar Logo' : 'Subir Logo'}
                    </button>
                    {logoRevendedor && (
                      <button
                        onClick={handleDeleteLogo}
                        className="flex items-center justify-center gap-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-sm font-medium text-destructive cursor-pointer hover:bg-destructive/20 transition-all"
                      >
                        <Trash2 className="h-4 w-4" />
                        Eliminar Logo
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="fixed right-6 top-6 flex gap-2">
        {revendedor && (
          <>
            <button
              onClick={() => setShowSettings(true)}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all"
              title="Ajustes"
            >
              <Settings className="h-4 w-4" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-primary transition-all"
            >
              <LogOut className="h-4 w-4" />
              Cerrar Sesión
            </button>
          </>
        )}
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        <header className="mb-6 text-center">
          <div className="flex items-center justify-center gap-3 mb-1">
            <img src="/logocm250.png" alt="Centro Motos" className="h-14 w-14 rounded" />
            <h1 className="text-balance text-2xl font-semibold tracking-tight text-foreground">
              {general?.gen_nomb || 'Centro Motos'}
            </h1>
          </div>
          {revendedor && (
            <p className="mt-3 text-xs text-muted-foreground">
              Bienvenido, {revendedor.nombre}
            </p>
          )}
        </header>

        {/* Badge revendedor seleccionado */}
        {revendedor && (
          <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 overflow-hidden">
                {logoRevendedor ? (
                  <img src={logoRevendedor} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <UserCheck className="h-4 w-4 text-primary" />
                )}
              </div>
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Revendedor #{revendedor.id}</div>
                <div className="text-sm font-semibold text-foreground truncate">
                  {revendedor.nombre}
                </div>
              </div>
            </div>
          </div>
        )}

        <nav className="flex flex-col gap-3">
          {menuItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-all hover:border-primary hover:bg-accent"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
                <item.icon className="h-5 w-5 text-primary" strokeWidth={2} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-foreground">
                  {item.label}
                </span>
                <span className="block text-xs text-muted-foreground">
                  {item.description}
                </span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1" strokeWidth={2} />
            </Link>
          ))}
          
          {/* Botón Cuenta Corriente - COMENTADO
          <button
            onClick={handleAbrirCuentaCorriente}
            disabled={loadingCC}
            className="group flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-all hover:border-primary hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed text-left"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent">
              {loadingCC ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" strokeWidth={2} />
              ) : (
                <CreditCard className="h-5 w-5 text-primary" strokeWidth={2} />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <span className="block text-sm font-semibold text-foreground">
                Cuenta Corriente
              </span>
              <span className="block text-xs text-muted-foreground">
                Gestión de cuentas
              </span>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground transition-all group-hover:text-primary group-hover:translate-x-1" strokeWidth={2} />
          </button>
          */}
        </nav>

        <footer className="mt-12 flex flex-col items-center gap-2">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <img src="/isologo.png" alt="BrixSoftware" className="h-5 w-5" />
            BrixSoftware
          </p>
        </footer>
      </div>
    </main>
  )
}
