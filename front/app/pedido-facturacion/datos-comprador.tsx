'use client'

import { inputClass } from "@/components/form-section"
import { useState, forwardRef, useImperativeHandle, useMemo, useEffect } from "react"
import { useLocalidades, useCondicionesIva } from "@/lib/use-dbf"
import { Localidad } from "@/lib/types"
import { Search, ChevronDown } from "lucide-react"

export interface DatosCompradorRef {
  validate: () => boolean
  getData: () => typeof initialFormData
}

// Props para datos iniciales (modo edición)
interface DatosCompradorProps {
  datosIniciales?: {
    CLT_NOMB?: string
    CLT_DIRE?: string
    LOC_CODI?: number
    CLT_TELE?: string
    CLT_CELU?: string
    CLT_EMAI?: string
    CLT_FNAC?: string
    CLT_TDOC?: string
    CLT_NDOC?: number
    CIV_CODI?: number
    CLT_CUIT?: string
    CLT_ESTC?: string
    CLT_OCUP?: string
  } | null
}

const initialFormData = {
  apellidoNombre: '',
  localidadCodigo: '',
  localidadNombre: '',
  codigoPostal: '',
  direccion: '',
  telefono: '',
  celular: '',
  email: '',
  fechaNacimiento: '',
  documento: 'DNI',
  nroDocumento: '',
  cuit: '',
  condicionIva: '',
  estadoCivil: '',
  ocupacion: '',
}

export const DatosComprador = forwardRef<DatosCompradorRef, DatosCompradorProps>(function DatosComprador({ datosIniciales }, ref) {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState<string[]>([])
  const [busquedaLocalidad, setBusquedaLocalidad] = useState('')
  const [localidadListOpen, setLocalidadListOpen] = useState(false)
  const { localidades } = useLocalidades()
  const { condiciones } = useCondicionesIva()

  // Cargar datos iniciales cuando viene en modo edición
  useEffect(() => {
    if (datosIniciales) {
      
      // Formatear fecha de MMDDYYYY (GeneXus) a YYYY-MM-DD (input HTML)
      let fechaNac = ''
      if (datosIniciales.CLT_FNAC) {
        const f = String(datosIniciales.CLT_FNAC)
        if (f.length === 8 && !f.includes('-')) {
          // MMDDYYYY -> YYYY-MM-DD
          fechaNac = `${f.slice(4, 8)}-${f.slice(0, 2)}-${f.slice(2, 4)}`
        } else if (f.includes('-')) {
          fechaNac = f
        }
      }

      // Formatear DNI con puntos
      const formatDNI = (num: number | string): string => {
        const nums = String(num).replace(/\D/g, '').slice(0, 8)
        if (nums.length <= 1) return nums
        return nums.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      }

      setFormData({
        apellidoNombre: datosIniciales.CLT_NOMB || '',
        direccion: datosIniciales.CLT_DIRE || '',
        localidadCodigo: datosIniciales.LOC_CODI ? String(datosIniciales.LOC_CODI) : '',
        localidadNombre: '', // Se llenará cuando carguen las localidades
        codigoPostal: '',
        telefono: datosIniciales.CLT_TELE || '',
        celular: datosIniciales.CLT_CELU || '',
        email: datosIniciales.CLT_EMAI || '',
        fechaNacimiento: fechaNac,
        documento: datosIniciales.CLT_TDOC === 'PAS' ? 'Pasaporte' : 'DNI',
        nroDocumento: datosIniciales.CLT_NDOC ? formatDNI(datosIniciales.CLT_NDOC) : '',
        cuit: datosIniciales.CLT_CUIT || '',
        condicionIva: datosIniciales.CIV_CODI ? String(datosIniciales.CIV_CODI) : '',
        estadoCivil: datosIniciales.CLT_ESTC || '',
        ocupacion: datosIniciales.CLT_OCUP || '',
      })

      // Poner el código de localidad en el campo de búsqueda
      if (datosIniciales.LOC_CODI) {
        setBusquedaLocalidad(String(datosIniciales.LOC_CODI))
      }
    }
  }, [datosIniciales])

  // Actualizar nombre de localidad cuando cargan las localidades
  useEffect(() => {
    if (formData.localidadCodigo && localidades.length > 0) {
      const loc = localidades.find(l => l.loc_codi.toString() === formData.localidadCodigo)
      if (loc && !formData.localidadNombre) {
        // Extraer código postal del nombre si existe (ej: "Rio Cuarto (5800)")
        const cpExtraido = loc.loc_cpos || loc.loc_nomb.match(/\((\d+)\)\s*$/)?.[1] || ''
        // Limpiar el nombre quitando el código postal entre paréntesis
        const nombreLimpio = loc.loc_nomb.replace(/\s*\(\d+\)\s*$/, '')
        setFormData(prev => ({
          ...prev,
          localidadNombre: nombreLimpio,
          codigoPostal: cpExtraido || prev.codigoPostal
        }))
      }
    }
  }, [localidades, formData.localidadCodigo, formData.localidadNombre])

  // Formatear DNI: 43.133.576
  const formatDNI = (value: string): string => {
    const nums = value.replace(/\D/g, '').slice(0, 8)
    if (nums.length <= 1) return nums
    return nums.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Formatear CUIT: 20-4313359-4
  const formatCUIT = (value: string): string => {
    const nums = value.replace(/\D/g, '').slice(0, 11)
    if (nums.length <= 2) return nums
    if (nums.length <= 10) return `${nums.slice(0, 2)}-${nums.slice(2)}`
    return `${nums.slice(0, 2)}-${nums.slice(2, 10)}-${nums.slice(10)}`
  }

  // Validar CUIT/CUIL con algoritmo argentino
  const validarCUIT = (cuit: string): boolean => {
    // Extraer solo números
    const nums = cuit.replace(/\D/g, '')
    if (nums.length !== 11) return false

    // Multiplicadores para cada posición (sin el dígito verificador)
    const operadores = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2]
    
    // Calcular suma de productos
    let acum = 0
    for (let i = 0; i < 10; i++) {
      acum += parseInt(nums[i]) * operadores[i]
    }

    // Calcular resto
    let resto = acum % 11
    if (resto === 0) resto = 11

    // El dígito verificador debe ser 11 - resto
    const digitoVerificador = parseInt(nums[10])
    return (11 - resto) === digitoVerificador
  }

  // Filtrar localidades por nombre o código, ordenadas por código
  const localidadesFiltradas = useMemo(() => {
    if (!busquedaLocalidad.trim()) return localidades
    const busqueda = busquedaLocalidad.trim()
    return localidades
      .filter(loc => 
        loc.loc_nomb.toLowerCase().includes(busqueda.toLowerCase()) ||
        loc.loc_codi.toString().includes(busqueda)
      )
      .sort((a, b) => a.loc_codi - b.loc_codi)
  }, [localidades, busquedaLocalidad])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Aplicar formateo especial
    if (name === 'nroDocumento') {
      setFormData(prev => ({ ...prev, [name]: formatDNI(value) }))
    } else if (name === 'cuit') {
      setFormData(prev => ({ ...prev, [name]: formatCUIT(value) }))
    } else if (name === 'telefono' || name === 'celular') {
      // Solo números para teléfono y celular
      const nums = value.replace(/\D/g, '')
      setFormData(prev => ({ ...prev, [name]: nums }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setErrors([])
  }

  const handleSelectLocalidad = (loc: Localidad) => {
    const cpExtraido = loc.loc_cpos || loc.loc_nomb.match(/\((\d+)\)\s*$/)?.[1] || ''
    setFormData(prev => ({
      ...prev,
      localidadCodigo: loc.loc_codi.toString(),
      localidadNombre: loc.loc_nomb.replace(/\s*\(\d+\)\s*$/, ''),
      codigoPostal: cpExtraido,
    }))
    // Actualizar el campo de búsqueda para mostrar solo el código
    setBusquedaLocalidad(loc.loc_codi.toString())
    setLocalidadListOpen(false)
    setErrors([])
  }

  // Campos obligatorios
  const camposObligatorios = ['apellidoNombre', 'localidadCodigo', 'direccion', 'celular', 'email', 'fechaNacimiento', 'nroDocumento', 'cuit', 'condicionIva', 'estadoCivil']
  
  const fieldLabels: Record<string, string> = {
    apellidoNombre: 'Apellido y Nombre',
    localidadCodigo: 'Localidad',
    direccion: 'Dirección',
    celular: 'Celular',
    email: 'Email',
    fechaNacimiento: 'Fecha Nacimiento',
    nroDocumento: 'Nro Documento',
    cuit: 'CUIT',
    condicionIva: 'Condición de IVA',
    estadoCivil: 'Estado Civil',
  }

  // Manejar Enter y Tab (con validación para campos obligatorios)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>, fieldName: string) => {
    if (e.key === 'Enter' || e.key === 'Tab') {
      // Validar si es campo obligatorio y está vacío
      const valor = formData[fieldName as keyof typeof formData]
      if (camposObligatorios.includes(fieldName) && !valor?.toString().trim()) {
        e.preventDefault()
        setErrors([fieldLabels[fieldName] || fieldName])
        return
      }
      
      // Validación especial para CUIT
      if (fieldName === 'cuit' && formData.cuit.trim() && !validarCUIT(formData.cuit)) {
        e.preventDefault()
        setErrors(['CUIT inválido - verificar dígito'])
        return
      }
      
      // Si es Enter, simular Tab
      if (e.key === 'Enter') {
        e.preventDefault()
        const form = (e.target as HTMLElement).closest('form') || document.body
        const inputs = Array.from(form.querySelectorAll('input:not([readonly]), select, textarea')) as HTMLElement[]
        const currentIndex = inputs.indexOf(e.target as HTMLElement)
        if (currentIndex > -1 && currentIndex < inputs.length - 1) {
          inputs[currentIndex + 1].focus()
        }
      }
      // Tab normal sigue adelante si el campo está completado o no es obligatorio
    }
  }

  const validate = (): boolean => {
    const newErrors: string[] = []
    
    if (!formData.apellidoNombre.trim()) newErrors.push('Apellido y Nombre')
    if (!formData.localidadCodigo) newErrors.push('Localidad')
    if (!formData.direccion.trim()) newErrors.push('Dirección')
    // teléfono es opcional
    if (!formData.celular.trim()) newErrors.push('Celular')
    if (!formData.email.trim()) newErrors.push('Email')
    if (!formData.fechaNacimiento) newErrors.push('Fecha Nacimiento')
    if (!formData.nroDocumento.trim()) newErrors.push('Nro Documento')
    if (!formData.cuit.trim()) {
      newErrors.push('CUIT')
    } else if (!validarCUIT(formData.cuit)) {
      newErrors.push('CUIT inválido - verificar dígito')
    }
    if (!formData.condicionIva) newErrors.push('Condición de IVA')
    if (!formData.estadoCivil) newErrors.push('Estado Civil')
    // ocupación es opcional
    
    setErrors(newErrors)
    return newErrors.length === 0
  }

  const getData = () => formData

  useImperativeHandle(ref, () => ({
    validate,
    getData
  }))

  const inputErrorClass = (field: string) => {
    const fieldNames: Record<string, string> = {
      apellidoNombre: 'Apellido y Nombre',
      localidadCodigo: 'Localidad',
      direccion: 'Dirección',
      telefono: 'Teléfono',
      celular: 'Celular',
      email: 'Email',
      fechaNacimiento: 'Fecha Nacimiento',
      nroDocumento: 'Nro Documento',
      cuit: 'CUIT',
      condicionIva: 'Condición de IVA',
      estadoCivil: 'Estado Civil',
    }
    return errors.includes(fieldNames[field]) ? `${inputClass} border-red-500` : inputClass
  }

  return (
    <div className={`rounded-lg border bg-card px-4 py-3 ${errors.length > 0 ? 'border-red-500' : 'border-border'}`}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Datos Del Comprador</h3>
      
      <div className="grid grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Apellido y Nombre</label>
          <input type="text" name="apellidoNombre" value={formData.apellidoNombre} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'apellidoNombre')} className={inputErrorClass('apellidoNombre')} />
        </div>
        
        {/* Localidad - Selector con búsqueda estilo motocicleta */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Código Localidad</label>
          <div className="flex flex-col gap-2">
            {/* Input de búsqueda + botón desplegar */}
            <div className="relative flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  value={busquedaLocalidad}
                  onChange={(e) => {
                    setBusquedaLocalidad(e.target.value)
                    if (!localidadListOpen) setLocalidadListOpen(true)
                  }}
                  placeholder="Buscar por código o nombre de localidad..."
                  className={`h-9 w-full rounded-lg border bg-background pl-9 pr-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary ${errors.includes('Localidad') ? 'border-red-500' : 'border-border'}`}
                />
              </div>
              <button
                type="button"
                onClick={() => setLocalidadListOpen(!localidadListOpen)}
                className="h-9 px-2.5 rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground transition-colors flex items-center"
                title={localidadListOpen ? 'Cerrar lista' : 'Abrir lista'}
              >
                <ChevronDown className={`h-4 w-4 transition-transform ${localidadListOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Lista de localidades */}
            {localidadListOpen && (
              <div className="rounded-lg border border-border overflow-hidden">
                <div className="px-3 py-1.5 border-b border-border bg-muted/30 text-[11px] text-muted-foreground">
                  {localidadesFiltradas.length} localidad{localidadesFiltradas.length !== 1 ? 'es' : ''}
                  {busquedaLocalidad.trim() ? ` encontrada${localidadesFiltradas.length !== 1 ? 's' : ''}` : ` disponible${localidadesFiltradas.length !== 1 ? 's' : ''}`}
                </div>
                <div className="max-h-44 overflow-y-auto">
                  {localidadesFiltradas.length === 0 ? (
                    <div className="px-3 py-3 text-center text-xs text-muted-foreground">
                      No se encontraron localidades
                    </div>
                  ) : (
                    localidadesFiltradas.slice(0, 100).map((loc) => (
                      <div
                        key={loc.loc_codi}
                        onClick={() => handleSelectLocalidad(loc)}
                        className={`cursor-pointer px-3 py-2 text-xs transition-colors border-b border-border/50 last:border-0 hover:bg-muted
                          ${formData.localidadCodigo === loc.loc_codi.toString() ? 'bg-primary/10 border-l-2 border-l-primary' : ''}
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                            <span className="font-medium">{loc.loc_codi} - {loc.loc_nomb.replace(/\s*\(\d+\)\s*$/, '')}</span>
                            <span className="text-[11px] text-muted-foreground">CP: {loc.loc_cpos || loc.loc_nomb.match(/\((\d+)\)\s*$/)?.[1] || '-'}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Nombre Localidad - readonly */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nombre Localidad</label>
          <input 
            type="text" 
            value={formData.localidadNombre} 
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
          />
        </div>
        
        {/* Código Postal - readonly */}
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Código Postal</label>
          <input 
            type="text" 
            value={formData.codigoPostal} 
            readOnly 
            className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
          />
        </div>
        
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Dirección</label>
          <input type="text" name="direccion" value={formData.direccion} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'direccion')} className={inputErrorClass('direccion')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Teléfono</label>
          <input type="tel" name="telefono" value={formData.telefono} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'telefono')} className={inputErrorClass('telefono')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Celular</label>
          <input type="tel" name="celular" value={formData.celular} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'celular')} className={inputErrorClass('celular')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Email</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'email')} className={inputErrorClass('email')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Fecha Nacimiento</label>
          <input type="date" name="fechaNacimiento" value={formData.fechaNacimiento} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'fechaNacimiento')} className={inputErrorClass('fechaNacimiento')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Documento</label>
          <select name="documento" value={formData.documento} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'documento')} className={inputClass}>
            <option>DNI</option>
            <option>Pasaporte</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nro</label>
          <input type="text" name="nroDocumento" value={formData.nroDocumento} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'nroDocumento')} className={inputErrorClass('nroDocumento')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">CUIT</label>
          <input type="text" name="cuit" value={formData.cuit} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'cuit')} className={inputErrorClass('cuit')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Condicion de IVA</label>
          <select name="condicionIva" value={formData.condicionIva} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'condicionIva')} className={inputErrorClass('condicionIva')}>
            <option value="">-- Seleccionar --</option>
            {condiciones.map(cond => (
              <option key={cond.civ_codi} value={cond.civ_codi}>
                {cond.civ_nomb}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Estado Civil</label>
          <select name="estadoCivil" value={formData.estadoCivil} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'estadoCivil')} className={inputErrorClass('estadoCivil')}>
            <option value="">-- Seleccionar --</option>
            <option>Soltero/a</option>
            <option>Casado/a</option>
            <option>Divorciado/a</option>
            <option>Viudo/a</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Ocupación</label>
          <input type="text" name="ocupacion" value={formData.ocupacion} onChange={handleChange} onKeyDown={(e) => handleKeyDown(e, 'ocupacion')} className={inputErrorClass('ocupacion')} />
        </div>
      </div>
    </div>
  )
})
