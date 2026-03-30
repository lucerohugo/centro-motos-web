'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileEdit, Lock, RefreshCw, AlertCircle, FileDown } from "lucide-react"
import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { ROUTES } from "@/lib/routes.config"
import { getPedidosRevendedor, PedidoResumen, generarPDFPedidoGuardado } from "@/lib/use-dbf"
import { leerRevendedor } from "../selector-revendedor"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MisPedidosPage() {
  const router = useRouter()
  
  const [revendedorId, setRevendedorId] = useState<number>(0)
  const [nombreRevendedor, setNombreRevendedor] = useState('')
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const saved = leerRevendedor()
    if (saved) {
      setRevendedorId(saved.id)
      setNombreRevendedor(saved.nombre)
    }
  }, [])

  useEffect(() => {
    if (revendedorId > 0) {
      cargarPedidos()
    }
  }, [revendedorId])

  const cargarPedidos = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const result = await getPedidosRevendedor(revendedorId)
      
      if (result.success) {
        setPedidos(result.pedidos)
      } else {
        setError(result.error || 'Error al cargar pedidos')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }

  const handleEditarPedido = (pedido: PedidoResumen) => {
    if (!pedido.editable) {
      return
    }
    
    // Redirigir directamente - los datos se cargan desde el backend
    router.push(ROUTES.PEDIDO_FACTURACION + '?editar=' + pedido.codigo)
  }

  const formatearFecha = (fechaStr: string) => {
    // Convertir fechas a DD/MM/YYYY para mostrar
    if (!fechaStr) return '-'
    
    // Formato YYYY-MM-DD (ISO/DBF nativo) -> DD/MM/YYYY
    if (fechaStr.includes('-') && fechaStr.length === 10) {
      const [anio, mes, dia] = fechaStr.split('-')
      return `${dia}/${mes}/${anio}`
    }
    
    // Formato MMDDYYYY (GeneXus texto) -> DD/MM/YYYY
    if (fechaStr.length === 8 && !fechaStr.includes('-') && !fechaStr.includes('/')) {
      const mes = fechaStr.substring(0, 2)
      const dia = fechaStr.substring(2, 4)
      const anio = fechaStr.substring(4, 8)
      return `${dia}/${mes}/${anio}`
    }
    
    return fechaStr
  }

  const formatearMonto = (monto: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(monto)
  }

  const [exportandoPDF, setExportandoPDF] = useState<number | null>(null)

  const handleExportarPDF = async (pedido: PedidoResumen) => {
    setExportandoPDF(pedido.codigo)
    
    try {
      await generarPDFPedidoGuardado(
        pedido.datosCompletos,
        pedido.codigo,
        nombreRevendedor,
        revendedorId
      )
    } catch (err) {
      setError('Error al exportar el PDF')
    } finally {
      setExportandoPDF(null)
    }
  }

  return (
    <main className="min-h-screen bg-background px-6 py-8">
      <div className="mx-auto max-w-6xl">
        <AppHeader />
        
        <Link
          href={ROUTES.HOME}
          className="mb-4 inline-flex items-center gap-2 h-9 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          Volver al menu
        </Link>

        <div className="rounded-lg border border-border bg-card/90 p-6 backdrop-blur-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Mis Pedidos
              </h1>
              {nombreRevendedor && (
                <p className="text-sm text-muted-foreground">
                  Revendedor: {nombreRevendedor}
                </p>
              )}
            </div>
            
            <button
              onClick={cargarPedidos}
              disabled={loading}
              className="inline-flex items-center gap-2 h-9 rounded-lg bg-secondary px-4 text-xs font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!revendedorId ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>Debe seleccionar un revendedor primero</p>
              <Link
                href={ROUTES.HOME}
                className="mt-4 inline-block text-primary hover:underline"
              >
                Ir al menú principal
              </Link>
            </div>
          ) : loading ? (
            <div className="text-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary mb-2" />
              <p className="text-muted-foreground">Cargando pedidos...</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p>No hay pedidos registrados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Código</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Fecha</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Comprador</th>
                    <th className="text-left py-3 px-4 font-semibold text-foreground">Vehículo</th>
                    <th className="text-right py-3 px-4 font-semibold text-foreground">Monto</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr 
                      key={pedido.codigo} 
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-mono">{pedido.codigo}</td>
                      <td className="py-3 px-4">{formatearFecha(pedido.fecha)}</td>
                      <td className="py-3 px-4">{pedido.comprador}</td>
                      <td className="py-3 px-4">{pedido.vehiculo}</td>
                      <td className="py-3 px-4 text-right font-mono">
                        {formatearMonto(pedido.monto)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        {pedido.editable ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-600">
                            <FileEdit className="h-3 w-3" />
                            Editable
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-600">
                            <Lock className="h-3 w-3" />
                            Procesado
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleExportarPDF(pedido)}
                            disabled={exportandoPDF === pedido.codigo}
                            className="inline-flex items-center gap-1 h-8 px-3 rounded text-xs font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                            title="Exportar PDF"
                          >
                            <FileDown className={`h-3 w-3 ${exportandoPDF === pedido.codigo ? 'animate-pulse' : ''}`} />
                            PDF
                          </button>
                          <button
                            onClick={() => handleEditarPedido(pedido)}
                            disabled={!pedido.editable}
                            className={`inline-flex items-center gap-1 h-8 px-3 rounded text-xs font-medium transition-all ${
                              pedido.editable
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            {pedido.editable ? (
                              <>
                                <FileEdit className="h-3 w-3" />
                                Editar
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                Bloqueado
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          <div className="mt-6 flex items-center justify-between border-t border-border pt-4">
            <p className="text-xs text-muted-foreground">
              Los pedidos con estado "Procesado" ya fueron sincronizados y no pueden editarse.
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
