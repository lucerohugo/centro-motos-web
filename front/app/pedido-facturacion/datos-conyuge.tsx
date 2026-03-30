'use client'

import { inputClass } from "@/components/form-section"
import { useState, forwardRef, useImperativeHandle, useEffect } from "react"

export interface DatosConyugeRef {
  validate: () => boolean
  getData: () => typeof initialFormData
}

// Props para datos iniciales (modo edición)
interface DatosConyugeProps {
  datosIniciales?: {
    CLT_NOMBC?: string
    CLT_TDOCC?: string
    CLT_NDOCC?: number
    CLT_CUITC?: string
  } | null
}

const initialFormData = {
  apellidoNombre: '',
  documento: 'DNI',
  nroDocumento: '',
  cuit: '',
}

export const DatosConyuge = forwardRef<DatosConyugeRef, DatosConyugeProps>(function DatosConyuge({ datosIniciales }, ref) {
  const [formData, setFormData] = useState(initialFormData)
  const [errors, setErrors] = useState<string[]>([])

  // Cargar datos iniciales cuando viene en modo edición
  useEffect(() => {
    if (datosIniciales) {

      // Formatear DNI con puntos
      const formatDNI = (num: number | string): string => {
        const nums = String(num).replace(/\D/g, '').slice(0, 8)
        if (nums.length <= 1) return nums
        return nums.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
      }

      setFormData({
        apellidoNombre: datosIniciales.CLT_NOMBC || '',
        documento: datosIniciales.CLT_TDOCC === 'PAS' ? 'Pasaporte' : 'DNI',
        nroDocumento: datosIniciales.CLT_NDOCC ? formatDNI(datosIniciales.CLT_NDOCC) : '',
        cuit: datosIniciales.CLT_CUITC || '',
      })
    }
  }, [datosIniciales])

  // Formatear DNI: 43.133.576
  const formatDNI = (value: string): string => {
    const nums = value.replace(/\D/g, '').slice(0, 8)
    if (nums.length <= 1) return nums
    return nums.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  }

  // Formatear CUIT: 20-4313359-4
  const formatCUIT = (value: string): string => {
    const nums = value.replace(/\D/g, '').slice(0, 10)
    if (nums.length <= 2) return nums
    if (nums.length <= 9) return `${nums.slice(0, 2)}-${nums.slice(2)}`
    return `${nums.slice(0, 2)}-${nums.slice(2, 9)}-${nums.slice(9)}`
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    
    // Aplicar formateo especial
    if (name === 'nroDocumento') {
      setFormData(prev => ({ ...prev, [name]: formatDNI(value) }))
    } else if (name === 'cuit') {
      setFormData(prev => ({ ...prev, [name]: formatCUIT(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
    setErrors([])
  }

  // Manejar Enter como Tab (todos los campos son opcionales)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      const form = (e.target as HTMLElement).closest('form') || document.body
      const inputs = Array.from(form.querySelectorAll('input:not([readonly]), select, textarea')) as HTMLElement[]
      const currentIndex = inputs.indexOf(e.target as HTMLElement)
      if (currentIndex > -1 && currentIndex < inputs.length - 1) {
        inputs[currentIndex + 1].focus()
      }
    }
  }

  const validate = (): boolean => {
    // Todos los campos del cónyuge son opcionales
    setErrors([])
    return true
  }

  const getData = () => formData

  useImperativeHandle(ref, () => ({
    validate,
    getData
  }))

  const inputErrorClass = (field: string) => {
    const fieldNames: Record<string, string> = {
      apellidoNombre: 'Apellido y Nombre',
      nroDocumento: 'Nro Documento',
      cuit: 'CUIT',
    }
    return errors.includes(fieldNames[field]) ? `${inputClass} border-red-500` : inputClass
  }

  return (
    <div className={`rounded-lg border bg-card px-4 py-3 ${errors.length > 0 ? 'border-red-500' : 'border-border'}`}>
      <h3 className="mb-3 text-sm font-semibold text-foreground">Datos Del Cónyuge</h3>
      
      {errors.length > 0 && (
        <div className="mb-3 p-2 rounded bg-red-50 border border-red-200 text-xs text-red-700">
           Campos obligatorios vacíos: {errors.join(', ')}
        </div>
      )}
      
      <div className="grid grid-cols-1 gap-x-2.5 gap-y-2 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Apellido y Nombre</label>
          <input type="text" name="apellidoNombre" value={formData.apellidoNombre} onChange={handleChange} onKeyDown={handleKeyDown} className={inputErrorClass('apellidoNombre')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Documento</label>
          <select name="documento" value={formData.documento} onChange={handleChange} onKeyDown={handleKeyDown} className={inputClass}>
            <option>DNI</option>
            <option>Pasaporte</option>
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">Nro</label>
          <input type="text" name="nroDocumento" value={formData.nroDocumento} onChange={handleChange} onKeyDown={handleKeyDown} className={inputErrorClass('nroDocumento')} />
        </div>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-semibold text-foreground">CUIT</label>
          <input type="text" name="cuit" value={formData.cuit} onChange={handleChange} onKeyDown={handleKeyDown} className={inputErrorClass('cuit')} />
        </div>
      </div>
    </div>
  )
})
