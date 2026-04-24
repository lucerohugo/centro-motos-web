'use client'

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, CheckCircle } from "lucide-react"
import { useState, useEffect, useRef, Suspense } from "react"
import { AppHeader } from "@/components/app-header"
import { inputClass } from "@/components/form-section"
import { ROUTES } from "@/lib/routes.config"
import { useStockMotocicletas, exportarPedido, registrarPedidoPOVT, actualizarPedidoPOVT } from "@/lib/use-dbf"
import { leerRevendedor, guardarRevendedor } from "../selector-revendedor"
import { DatosComprador, DatosCompradorRef } from "./datos-comprador"
import { DatosConyuge, DatosConyugeRef } from "./datos-conyuge"
import { DatosVehiculo, DatosVehiculoRef } from "./datos-vehiculo"
import { FormaDePago, FormaDePagoRef } from "./forma-de-pago"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { VistaPrevia } from "./vista-previa"

// Wrapper con Suspense para useSearchParams
export default function PedidoFacturacionPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><span className="text-muted-foreground">Cargando...</span></div>}>
      <PedidoFacturacionContent />
    </Suspense>
  )
}

function PedidoFacturacionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [revendedorId, setRevendedorId] = useState<number>(0)
  const [revendedorDestino, setRevendedorDestino] = useState<number>(0)
  const [nombreRevendedor, setNombreRevendedor] = useState('')
  const [exportSuccess, setExportSuccess] = useState<string | null>(null)
  const [exportError, setExportError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [codigoPedido, setCodigoPedido] = useState<number | null>(null)
  
  // Estado para vista previa
  const [showVistaPrevia, setShowVistaPrevia] = useState(false)
  const [pedidoDataPreview, setPedidoDataPreview] = useState<any>(null)
  
  // Estado para modo edición (cuando se edita un pedido existente)
  // Se guarda en REFS para que no se pierdan en re-renders
  const modoEdicionRef = useRef(false)
  const codigoEditandoRef = useRef<number | null>(null)
  const [modoEdicion, setModoEdicion] = useState(false)
  const [codigoEditando, setCodigoEditando] = useState<number | null>(null)
  
  // Datos iniciales para edición
  const [datosIniciales, setDatosIniciales] = useState<any>(null)
  
  // Precio del artículo seleccionado (para autocompletar forma de pago)
  const [precioArticuloSeleccionado, setPrecioArticuloSeleccionado] = useState<number>(0)

  // Stock filtrado por ART_DEST = REV_DEST del revendedor (depósito asignado)
  const { stockMotocicletas: stock } = useStockMotocicletas({ revendedorDestino })

  // Refs para validación
  const datosCompradorRef = useRef<DatosCompradorRef>(null)
  const datosConyugeRef = useRef<DatosConyugeRef>(null)
  const datosVehiculoRef = useRef<DatosVehiculoRef>(null)
  const formaDePagoRef = useRef<FormaDePagoRef>(null)

  // Usar todo el stock (ya viene filtrado por depósito desde el backend)
  const stockFiltrado = stock

  useEffect(() => {
    const saved = leerRevendedor()
    if (saved) {
      setRevendedorId(saved.id)
      const destino = Number(saved.destino) || 0
      setRevendedorDestino(destino)
      setNombreRevendedor(saved.nombre)
      
      // Si no tenemos destino válido, obtenerlo del backend
      if (destino === 0 && saved.id > 0) {
        fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gestion/revendedores/${saved.id}/`)
          .then(r => r.json())
          .then(data => {
            if (data.rev_dest) {
              const dest = Number(data.rev_dest) || 0
              setRevendedorDestino(dest)
              guardarRevendedor(saved.id, saved.nombre, dest)
            }
          })
          .catch(err => {})
      }
    }
  }, [])

  // Función para mapear datos del backend al formato que esperan los componentes
  const mapearDatosBackendAComponentes = (datos: any) => {
    return {
      // Datos del comprador (cli_ -> CLT_)
      CLT_NOMB: datos.cli_nomb || '',
      CLT_DIRE: datos.cli_dire || '',
      LOC_CODI: datos.loc_codi || null,
      CLT_TELE: datos.cli_tele || '',
      CLT_CELU: datos.cli_celu || '',
      CLT_EMAI: datos.cli_emai || '',
      CLT_FNAC: datos.cli_fnac || '',
      CLT_TDOC: datos.cli_tdoc || 'DNI',
      CLT_NDOC: datos.cli_ndoc || null,
      CIV_CODI: datos.civ_codi || null,
      CLT_CUIT: datos.cli_cuit || '',
      CLT_ESTC: datos.cli_estc || '',
      CLT_OCUP: datos.cli_ocup || '',
      // Datos del cónyuge
      CLT_NOMBC: datos.cli_nombc || '',
      CLT_TDOCC: datos.cli_tdocc || 'DNI',
      CLT_NDOCC: datos.cli_ndocc || null,
      CLT_CUITC: datos.cli_cuitc || '',
      // Datos del vehículo (pov_ -> POV_)
      POV_ARTI: datos.pov_arti || null,
      ART_NOMB: datos.art_nomb || '',
      POV_MODE: datos.pov_mode || null,
      POV_COLO: datos.pov_colo || null,
      COL_NOMB: datos.col_nomb || '',
      POV_NCHA: datos.pov_ncha || '',
      POV_NMOT: datos.pov_nmot || '',
      POV_NCER: datos.pov_ncer || '',
      // Forma de pago
      COM_CODI: datos.com_codi || null,
      COM_NOMB: datos.com_nomb || '',
      COM_LETR: datos.com_letr || '',
      POV_FLIS: datos.pov_flis || '',
      POV_PLIS: datos.pov_plis || 0,
      POV_FINU: datos.pov_finu || '',
      POV_NUMC: datos.pov_numc || '',
      POV_IMPC: datos.pov_impc || 0,
      POV_NOMC: datos.pov_nomc || '',
      POV_TARC: datos.pov_tarc || 0,
      POV_PPAG: datos.pov_ppag || 0,
      POV_CHEQ: datos.pov_cheq || 0,
      POV_TRAN: datos.pov_tran || 0,
      POV_CONT: datos.pov_cont || 0,
      POV_MONF: datos.pov_monf || 0,
    }
  }

  // Función para obtener pedido del backend
  const obtenerPedidoDelBackend = async (codigo: number) => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
      const response = await fetch(`${API_URL}/api/gestion/pedidos/${codigo}/`)
      if (!response.ok) {
        throw new Error('Error al obtener pedido')
      }
      const datos = await response.json()
      return datos
    } catch (err) {
      return null
    }
  }

  // Detectar modo edición desde parámetro URL
  useEffect(() => {
    const codigoEditar = searchParams.get('editar')
    if (codigoEditar) {
      const codigo = parseInt(codigoEditar, 10)
      if (!isNaN(codigo)) {
        modoEdicionRef.current = true
        codigoEditandoRef.current = codigo
        setModoEdicion(true)
        setCodigoEditando(codigo)
        
        // Cargar datos del pedido directamente del backend
        const cargarDatos = async () => {
          const datosRaw = await obtenerPedidoDelBackend(codigo)
          
          if (datosRaw) {
            const datosMapeados = mapearDatosBackendAComponentes(datosRaw)
            setDatosIniciales(datosMapeados)
          } else {
            setExportError('Error al cargar los datos del pedido')
          }
        }
        
        cargarDatos()
      }
    }
  }, [searchParams])

  // Mostrar vista previa antes de confirmar
  const handleConfirmar = async () => {
    try {
      setExportSuccess(null)
      setExportError(null)

      if (!revendedorId) {
        setExportError('Debes seleccionar un revendedor')
        return
      }

      // Validar todos los formularios
      const validComprador = datosCompradorRef.current?.validate() ?? false
      const validConyuge = datosConyugeRef.current?.validate() ?? false
      const validVehiculo = datosVehiculoRef.current?.validate() ?? false
      const validPago = formaDePagoRef.current?.validate() ?? false

      if (!validComprador || !validConyuge || !validVehiculo || !validPago) {
        setExportError('Por favor complete todos los campos obligatorios y corrija los errores')
        
        // Scroll al primer formulario con error
        if (!validComprador) {
          document.getElementById('seccion-comprador')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (!validConyuge) {
          document.getElementById('seccion-conyuge')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (!validVehiculo) {
          document.getElementById('seccion-vehiculo')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        } else if (!validPago) {
          document.getElementById('seccion-pago')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }

      const pedidoData = {
        fecha: new Date().toISOString(),
        revendedor: {
          id: revendedorId,
          nombre: nombreRevendedor,
        },
        detalles: {
          datosComprador: datosCompradorRef.current?.getData(),
          datosConyuge: datosConyugeRef.current?.getData(),
          datosVehiculo: datosVehiculoRef.current?.getData(),
          formaPago: formaDePagoRef.current?.getData(),
        },
      }

      // Guardar datos y mostrar vista previa
      setPedidoDataPreview(pedidoData)
      setShowVistaPrevia(true)
      
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Error desconocido')
    }
  }

  // Confirmar definitivamente el pedido (desde vista previa)
  const handleConfirmarFinal = async () => {
    try {
      setIsSubmitting(true)
      setExportError(null)

      if (!pedidoDataPreview) {
        setExportError('Error: No hay datos del pedido')
        return
      }

      // Usar refs como fallback si los estados se perdieron
      const esModoEdicion = modoEdicionRef.current || modoEdicion
      const codigoAEditar = codigoEditandoRef.current || codigoEditando
      
      let resultPOVT

      if (esModoEdicion && codigoAEditar) {
        // Actualizar pedido existente
        resultPOVT = await actualizarPedidoPOVT(codigoAEditar, pedidoDataPreview)
      } else {
        // Registrar nuevo pedido en POVT.DBF
        resultPOVT = await registrarPedidoPOVT(pedidoDataPreview)
      }
      
      if (!resultPOVT.success) {
        setExportError(`Error registrando en base de datos: ${resultPOVT.error}`)
        return
      }

      setShowVistaPrevia(false)
      setCodigoPedido(resultPOVT.codigo ?? null)
      setShowSuccessModal(true)
      
      // Redirigir al menú después de 2 segundos
      setTimeout(() => {
        router.push(ROUTES.HOME)
      }, 2000)
      
    } catch (error) {
      setExportError(error instanceof Error ? error.message : 'Error desconocido')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Volver al formulario para editar desde la vista previa
  const handleEditarPrevia = () => {
    setShowVistaPrevia(false)
    setExportError(null)
  }

  return (
    <main className="min-h-screen bg-background px-4 md:px-6 py-8">
      {/* Vista Previa del Pedido */}
      {showVistaPrevia && pedidoDataPreview && (
        <VistaPrevia
          pedidoData={pedidoDataPreview}
          onConfirmar={handleConfirmarFinal}
          onEditar={handleEditarPrevia}
          isSubmitting={isSubmitting}
          codigoExistente={modoEdicion ? codigoEditando : undefined}
        />
      )}

      {/* Modal de éxito */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
            <h2 className="text-lg md:text-xl font-semibold text-foreground mb-2">
              {modoEdicion ? '¡Pedido Actualizado Exitosamente!' : '¡Pedido Registrado Exitosamente!'}
            </h2>
            <p className="text-xs md:text-sm text-muted-foreground mb-4">
              El pedido fue guardado correctamente.
            </p>
            {codigoPedido && (
              <p className="text-base md:text-lg font-mono font-semibold text-primary mb-4">
                Código: {codigoPedido}
              </p>
            )}
            <p className="text-xs text-muted-foreground">
              Redirigiendo al menú...
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-6xl">
        <AppHeader />
        
        <Link
          href={ROUTES.HOME}
          className="mb-4 inline-flex items-center gap-2 h-9 rounded-lg bg-primary px-4 md:px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
        >
          <ArrowLeft className="h-3.5 w-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Volver al menu</span>
          <span className="sm:hidden">Volver</span>
        </Link>

        <div className="mb-4 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-foreground">
              {modoEdicion ? `Editar Pedido #${codigoEditando}` : 'Pedido de Facturacion'}
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {modoEdicion ? 'Modificar datos del pedido existente' : 'Completar datos del pedido'}
            </p>
          </div>
          {modoEdicion ? (
            <span className="rounded-lg bg-amber-500/20 px-3 py-1.5 font-mono text-xs text-amber-600 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse"></span>
              Modo Edición
            </span>
          ) : (
            <span className="rounded-lg bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground">
              Nuevo Pedido
            </span>
          )}
        </div>

        {/* Mensajes */}
        {exportSuccess && (
          <Alert className="mb-4 border-green-600 bg-green-50">
            <AlertDescription className="text-green-800">
               {exportSuccess}
            </AlertDescription>
          </Alert>
        )}
        {exportError && (
          <Alert className="mb-4 border-red-600 bg-red-50">
            <AlertDescription className="text-red-800">
               {exportError}
            </AlertDescription>
          </Alert>
        )}

        {/* Seleccionar Revendedor */}
        <>
            {/* Header fields */}
            <div className="mb-3 rounded-lg border border-border bg-card px-4 py-3">
              <div className="grid grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Fecha</label>
                  <input 
                    type="date" 
                    defaultValue={new Date().toISOString().split('T')[0]}
                    className={inputClass} 
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">ID Revendedor</label>
                  <input 
                    type="number" 
                    value={revendedorId}
                    readOnly
                    className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-foreground">Nombre Revendedor</label>
                  <input 
                    type="text" 
                    value={nombreRevendedor}
                    readOnly
                    className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Formulario */}
            <form className="flex flex-col gap-3">
              <div id="seccion-comprador">
                <DatosComprador ref={datosCompradorRef} datosIniciales={datosIniciales} />
              </div>
              <div id="seccion-conyuge">
                <DatosConyuge ref={datosConyugeRef} datosIniciales={datosIniciales} />
              </div>
              <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div id="seccion-vehiculo">
                  <DatosVehiculo 
                    ref={datosVehiculoRef} 
                    stock={stockFiltrado as any}
                    datosIniciales={datosIniciales as any}
                    onPrecioChange={setPrecioArticuloSeleccionado}
                  />
                </div>
                <div id="seccion-pago">
                  <FormaDePago 
                    ref={formaDePagoRef} 
                    datosIniciales={datosIniciales} 
                    precioArticulo={precioArticuloSeleccionado}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleConfirmar}
                  disabled={isSubmitting || !revendedorId}
                  className="h-9 rounded-lg bg-primary px-5 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Guardando...' : (modoEdicion ? 'Vista Previa y Actualizar' : 'Vista Previa y Confirmar')}
                </button>
                <Link
                  href={modoEdicion ? ROUTES.MIS_PEDIDOS : ROUTES.HOME}
                  className="flex h-9 items-center rounded-lg border border-border bg-card px-5 text-xs font-medium text-muted-foreground transition-all hover:border-primary hover:text-foreground hover:bg-accent"
                >
                  Cancelar
                </Link>
              </div>
            </form>
          </>
      </div>
    </main>
  )
}
