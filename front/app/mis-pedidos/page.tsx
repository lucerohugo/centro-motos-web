'use client'

import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, FileEdit, Lock, RefreshCw, AlertCircle, FileDown, FileText } from "lucide-react"
import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { ROUTES } from "@/lib/routes.config"
import { getPedidosRevendedor, PedidoResumen, generarPDFPedidoGuardado, descargarGarantia } from "@/lib/use-dbf"
import { leerRevendedor } from "../selector-revendedor"
import { Alert, AlertDescription } from "@/components/ui/alert"

export default function MisPedidosPage() {
  const router = useRouter()
  
  const [revendedorId, setRevendedorId] = useState<number>(0)
  const [nombreRevendedor, setNombreRevendedor] = useState('')
  const [pedidos, setPedidos] = useState<PedidoResumen[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [exportandoPDF, setExportandoPDF] = useState<number | null>(null)
  const [descargandoGarantia, setDescargandoGarantia] = useState<number | null>(null)

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

  const handleDescargarGarantia = async (pedido: PedidoResumen) => {
    setDescargandoGarantia(pedido.codigo)
    
    try {
      const result = await descargarGarantia(pedido.codigo)
      if (!result.success) {
        setError(result.error || 'Error al descargar la garantía')
      }
    } catch (err) {
      setError('Error al descargar la garantía')
    } finally {
      setDescargandoGarantia(null)
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 md:px-6 py-8">
      <div className="mx-auto max-w-7xl">
        <AppHeader />
        
        <Link
          href={ROUTES.HOME}
          className="mb-4 inline-flex items-center gap-2 h-9 rounded-lg bg-primary px-4 md:px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Volver al menu</span>
          <span className="sm:hidden">Volver</span>
        </Link>

        <div className="rounded-lg border border-border bg-card/90 p-4 md:p-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-foreground">
                Mis Pedidos
              </h1>
              {nombreRevendedor && (
                <p className="text-xs md:text-sm text-muted-foreground">
                  Revendedor: {nombreRevendedor}
                </p>
              )}
            </div>
            
            <button
              onClick={cargarPedidos}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 h-9 rounded-lg bg-secondary px-4 text-xs font-semibold text-secondary-foreground transition-all hover:bg-secondary/80 disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>

          {error && (
            <Alert variant="destructive" className="mb-4 bg-red-50 dark:bg-red-950 border-red-500 dark:border-red-600 text-red-900 dark:text-red-100">
              <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
              <AlertDescription className="text-red-800 dark:text-red-50">{error}</AlertDescription>
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
            <div className="overflow-x-auto -mx-4 md:mx-0">
              <table className="w-full text-xs md:text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-3 md:px-4 font-semibold text-foreground">Código</th>
                    <th className="text-left py-3 px-3 md:px-4 font-semibold text-foreground">Fecha</th>
                    <th className="text-left py-3 px-3 md:px-4 font-semibold text-foreground">Comprador</th>
                    <th className="text-left py-3 px-3 md:px-4 font-semibold text-foreground">Vehículo</th>
                    <th className="text-right py-3 px-3 md:px-4 font-semibold text-foreground whitespace-nowrap">Precio Lista</th>
                    <th className="text-right py-3 px-3 md:px-4 font-semibold text-foreground whitespace-nowrap">Importe Crédito</th>
                    <th className="text-center py-3 px-3 md:px-4 font-semibold text-foreground">Estado</th>
                    <th className="text-center py-3 px-3 md:px-4 font-semibold text-foreground">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pedidos.map((pedido) => (
                    <tr 
                      key={pedido.codigo} 
                      className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                    >
                      <td className="py-3 px-3 md:px-4 font-mono text-xs">{pedido.codigo}</td>
                      <td className="py-3 px-3 md:px-4">{formatearFecha(pedido.fecha)}</td>
                      <td className="py-3 px-3 md:px-4 text-xs">{pedido.comprador}</td>
                      <td className="py-3 px-3 md:px-4 text-xs">{pedido.vehiculo}</td>
                      <td className="py-3 px-3 md:px-4 text-right font-mono text-xs md:text-sm">
                        {formatearMonto(pedido.precioLista)}
                      </td>
                      <td className="py-3 px-3 md:px-4 text-right font-mono text-xs md:text-sm">
                        {formatearMonto(pedido.importeCredito)}
                      </td>
                      <td className="py-3 px-3 md:px-4 text-center">
                        {pedido.editable ? (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-500/20 text-green-600">
                            <FileEdit className="h-3 w-3" />
                            <span className="hidden sm:inline">Editable</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-amber-500/20 text-amber-600">
                            <Lock className="h-3 w-3" />
                            <span className="hidden sm:inline">Procesado</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 md:px-4 text-center">
                        <div className="flex items-center justify-center gap-1 md:gap-2">
                          <button
                            onClick={() => handleExportarPDF(pedido)}
                            disabled={exportandoPDF === pedido.codigo}
                            className="inline-flex items-center gap-1 h-8 px-2 md:px-3 rounded text-xs font-medium transition-all bg-secondary text-secondary-foreground hover:bg-secondary/80 disabled:opacity-50"
                            title="Exportar PDF"
                          >
                            <FileDown className={`h-3 w-3 ${exportandoPDF === pedido.codigo ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline">PDF</span>
                          </button>
                          <button
                            onClick={() => handleDescargarGarantia(pedido)}
                            disabled={descargandoGarantia === pedido.codigo}
                            className="inline-flex items-center gap-1 h-8 px-2 md:px-3 rounded text-xs font-medium transition-all bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50"
                            title="Descargar Garantía"
                          >
                            <FileText className={`h-3 w-3 ${descargandoGarantia === pedido.codigo ? 'animate-pulse' : ''}`} />
                            <span className="hidden sm:inline">Garantía</span>
                          </button>
                          <button
                            onClick={() => handleEditarPedido(pedido)}
                            disabled={!pedido.editable}
                            className={`inline-flex items-center gap-1 h-8 px-2 md:px-3 rounded text-xs font-medium transition-all ${
                              pedido.editable
                                ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                                : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }`}
                          >
                            {pedido.editable ? (
                              <>
                                <FileEdit className="h-3 w-3" />
                                <span className="hidden sm:inline">Editar</span>
                              </>
                            ) : (
                              <>
                                <Lock className="h-3 w-3" />
                                <span className="hidden sm:inline">Bloqueado</span>
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
