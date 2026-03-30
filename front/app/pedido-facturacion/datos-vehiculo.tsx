'use client'

import { useState, useMemo, forwardRef, useImperativeHandle, useEffect } from "react"
import { Search, ChevronDown } from "lucide-react"

interface StockItem {
  codigoArticulo: string
  descripcion: string
  marca: string
  color: string
  colorNombre: string
  chassis: string
  motor: string
  certificado: string
  modelo: number | string  // Año del vehículo (numérico)
  revendedorId: number
  precioFinal?: number
}

interface DatosVehiculoProps {
  stock?: StockItem[]
  datosIniciales?: {
    POV_ARTI?: number
    ART_NOMB?: string
    POV_MODE?: number
    POV_COLO?: number
    COL_NOMB?: string
    POV_NCHA?: string
    POV_NMOT?: string
    POV_NCER?: string
  } | null
  onPrecioChange?: (precio: number) => void
}

export interface DatosVehiculoRef {
  validate: () => boolean
  getData: () => { selectedMoto: StockItem | null; formData: typeof initialFormData }
}

const initialFormData = {
  codigoArticulo: '',
  nombreArticulo: '',
  modelo: '',
  nroChasis: '',
  nroMotor: '',
  nroCertificado: '',
  color: '',
}

export const DatosVehiculo = forwardRef<DatosVehiculoRef, DatosVehiculoProps>(function DatosVehiculo({ stock = [], datosIniciales, onPrecioChange }, ref) {
  const [selectedMoto, setSelectedMoto] = useState<StockItem | null>(null)
  const [busqueda, setBusqueda] = useState('')
  const [listOpen, setListOpen] = useState(false)
  const [formData, setFormData] = useState(initialFormData)
  const [error, setError] = useState<string | null>(null)
  const [datosInicialesCargados, setDatosInicialesCargados] = useState(false)

  // Cargar datos iniciales cuando viene en modo edición
  useEffect(() => {
    if (datosIniciales && !datosInicialesCargados) {
      
      setFormData({
        codigoArticulo: datosIniciales.POV_ARTI ? String(datosIniciales.POV_ARTI) : '',
        nombreArticulo: datosIniciales.ART_NOMB || '',
        modelo: datosIniciales.POV_MODE ? String(datosIniciales.POV_MODE) : '',
        nroChasis: datosIniciales.POV_NCHA || '',
        nroMotor: datosIniciales.POV_NMOT || '',
        nroCertificado: datosIniciales.POV_NCER || '',
        color: datosIniciales.COL_NOMB || (datosIniciales.POV_COLO ? String(datosIniciales.POV_COLO) : ''),
      })

      // Buscar en stock por el chasis o artículo
      if (datosIniciales.POV_NCHA) {
        setBusqueda(datosIniciales.POV_NCHA)
      }

      setDatosInicialesCargados(true)
    }
  }, [datosIniciales, datosInicialesCargados])

  // Intentar seleccionar automáticamente el vehículo cuando cargue el stock
  useEffect(() => {
    if (datosIniciales && stock.length > 0 && !selectedMoto) {
      // Buscar por chasis primero
      if (datosIniciales.POV_NCHA) {
        const moto = stock.find(m => m.chassis === datosIniciales.POV_NCHA)
        if (moto) {
          setSelectedMoto(moto)
          return
        }
      }
      // Si no, buscar por código de artículo
      if (datosIniciales.POV_ARTI) {
        const moto = stock.find(m => m.codigoArticulo === String(datosIniciales.POV_ARTI))
        if (moto) {
          setSelectedMoto(moto)
        }
      }
    }
  }, [datosIniciales, stock, selectedMoto])

  const filteredStock = useMemo(() => {
    if (!busqueda.trim()) return stock
    const term = busqueda.trim().toLowerCase()
    return stock.filter(item =>
      (item.descripcion || '').toLowerCase().includes(term) ||
      (item.codigoArticulo || '').toString().toLowerCase().includes(term) ||
      (item.marca || '').toLowerCase().includes(term) ||
      (item.color || '').toLowerCase().includes(term) ||
      (item.chassis || '').toLowerCase().includes(term) ||
      (item.motor || '').toLowerCase().includes(term) ||
      String(item.modelo || '').toLowerCase().includes(term)
    )
  }, [stock, busqueda])

  const handleSelectMoto = (moto: StockItem) => {
    setSelectedMoto(moto)
    setListOpen(false)
    setError(null)
    setBusqueda('') // Limpiar el filtro de búsqueda
    setFormData({
      codigoArticulo: moto.codigoArticulo ? String(moto.codigoArticulo) : '',
      nombreArticulo: moto.descripcion || '',
      modelo: String(moto.modelo || ''),
      nroChasis: moto.chassis || '',
      nroMotor: moto.motor || '',
      nroCertificado: moto.certificado || '',
      color: moto.colorNombre || moto.color || '',
    })
    
    // Notificar el precio del artículo seleccionado
    if (onPrecioChange && moto.precioFinal) {
      onPrecioChange(moto.precioFinal)
    }
  }

  const validate = (): boolean => {
    if (!selectedMoto) {
      setError('Debe seleccionar una motocicleta')
      return false
    }
    setError(null)
    return true
  }

  const getData = () => ({ selectedMoto, formData })

  useImperativeHandle(ref, () => ({
    validate,
    getData
  }))

  return (
    <div className={`rounded-lg border bg-card px-4 py-3 ${error ? 'border-red-500' : 'border-border'}`}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Datos Del Vehículo</h3>
      
      {error && (
        <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700">
          ❌ {error}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-x-2.5 gap-y-2">
        {/* Selector de Motocicleta con Buscador */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Seleccionar Motocicleta</label>
          {stock.length === 0 ? (
            <div className="text-xs text-muted-foreground p-2">
              No hay motocicletas disponibles
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {/* Input de búsqueda + botón desplegar */}
              <div className="relative flex items-center gap-1.5">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <input
                    type="text"
                    value={busqueda}
                    onChange={(e) => {
                      setBusqueda(e.target.value)
                      if (!listOpen) setListOpen(true)
                    }}
                    placeholder="Buscar por descripción, marca, color, chasis, motor..."
                    className="h-9 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setListOpen(!listOpen)}
                  className="h-9 px-2.5 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center"
                  title={listOpen ? 'Cerrar lista' : 'Abrir lista'}
                >
                  <ChevronDown className={`h-4 w-4 transition-transform ${listOpen ? 'rotate-180' : ''}`} />
                </button>
              </div>

              {/* Moto seleccionada */}
              {selectedMoto && (
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground px-1">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-500 shrink-0" />
                  <span>Seleccionada:</span>
                  <span className="font-medium text-foreground truncate">{selectedMoto.descripcion || ''}</span>
                  <span>({selectedMoto.codigoArticulo || ''})</span>
                </div>
              )}

              {/* Lista de motos */}
              {listOpen && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-1.5 border-b border-border bg-muted/30 text-[11px] text-muted-foreground">
                  {filteredStock.length} motocicleta{filteredStock.length !== 1 ? 's' : ''}
                  {busqueda.trim() ? ` encontrada${filteredStock.length !== 1 ? 's' : ''}` : ` disponible${filteredStock.length !== 1 ? 's' : ''}`}
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {filteredStock.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                      No se encontraron motocicletas
                    </div>
                  ) : (
                    filteredStock.map((moto, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectMoto(moto)}
                        className={`cursor-pointer px-3 py-2 text-xs transition-colors border-b border-border/50 last:border-0 hover:bg-muted
                          ${selectedMoto === moto ? 'bg-primary/10 border-l-2 border-l-primary' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="font-medium truncate">
                              {moto.descripcion || 'Sin descripción'}
                            </span>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>Marca: {moto.marca || '-'}</span>
                              <span>·</span>
                              <span>Color: {moto.color || '-'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                              <span>Chasis: {moto.chassis || '-'}</span>
                              {moto.codigoArticulo && (
                                <>
                                  <span>·</span>
                                  <span>Cód: {moto.codigoArticulo}</span>
                                </>
                              )}
                            </div>
                          </div>
                          {selectedMoto === moto && (
                            <span className="ml-2 text-primary text-sm shrink-0">✓</span>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}
            </div>
          )}
        </div>

        {/* Campos readonly (autocompletan al seleccionar) */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Código</label>
          <input 
            type="text" 
            value={formData.codigoArticulo}
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Artículo</label>
          <input 
            type="text" 
            value={formData.nombreArticulo}
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Modelo</label>
          <input 
            type="text" 
            value={formData.modelo}
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nro Chasis</label>
          <input 
            type="text" 
            value={formData.nroChasis}
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nro Motor</label>
          <input 
            type="text" 
            value={formData.nroMotor}
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nro Certificado</label>
          <input 
            type="text" 
            value={formData.nroCertificado}
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Color</label>
          <input 
            type="text" 
            value={formData.color}
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none"
          />
        </div>
      </div>
    </div>
  )
})
