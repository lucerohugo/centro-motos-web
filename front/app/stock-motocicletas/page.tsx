'use client'

import Link from "next/link"
import { ArrowLeft, Search, Plus, Trash2, Edit2, Check, X } from "lucide-react"
import { useState, useEffect } from "react"
import { AppHeader } from "@/components/app-header"
import { ROUTES } from "@/lib/routes.config"
import { useStockMotocicletas, useMarcas, useSubrubros, useFiltrosRevendedor, crearFiltroRevendedor, eliminarFiltroRevendedor, actualizarFiltroRevendedor, obtenerValoresFiltro } from "@/lib/use-dbf"
import { leerRevendedor, guardarRevendedor } from "../selector-revendedor"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export default function StockMotocicletasPage() {
  const [revendedorId, setRevendedorId] = useState<number>(0)
  const [revendedorDestino, setRevendedorDestino] = useState<number>(0)
  const [nombreRevendedor, setNombreRevendedor] = useState('')
  const [busqueda, setBusqueda] = useState('')
  const [marcaFiltro, setMarcaFiltro] = useState<number | null>(null)
  const [subrubroFiltro, setSubrubroFiltro] = useState<number | null>(null)
  const [filtrosSeleccionados, setFiltrosSeleccionados] = useState<Record<number, string>>({})
  
  // Estados para editar filtro
  const [filtroEditandoId, setFiltroEditandoId] = useState<number | null>(null)
  const [filtroEditandoNombre, setFiltroEditandoNombre] = useState('')
  const [editandoFiltro, setEditandoFiltro] = useState(false)
  
  // Estados para los valores de cada filtro
  const [valoresFiltros, setValoresFiltros] = useState<Record<number, string[]>>({})
  
  // Estados para crear filtro y seleccionar motos en la tabla
  const [mostrarCrearFiltro, setMostrarCrearFiltro] = useState(false)
  const [nuevoFiltroNombre, setNuevoFiltroNombre] = useState('')
  const [creandoFiltro, setCreandoFiltro] = useState(false)
  const [filtroEnSeleccion, setFiltroEnSeleccion] = useState<number | null>(null)
  const [motosSeleccionadas, setMotosSeleccionadas] = useState<Record<number, string>>({})
  const [filtroEditando, setFiltroEditando] = useState<any | null>(null)
  const [motosExistentesFiltro, setMotosExistentesFiltro] = useState<Record<number, string>>({})
  const [valoresExistentesIds, setValoresExistentesIds] = useState<Record<number, number>>({})
  
  // Estados para modales de confirmación
  const [modalConfirmacion, setModalConfirmacion] = useState<{
    tipo: 'eliminar-valor' | 'eliminar-filtro' | null
    datos: any
  }>({ tipo: null, datos: null })

  // Debounce de búsqueda para no hacer request en cada tecla
  const [busquedaDebounced, setBusquedaDebounced] = useState('')
  useEffect(() => {
    const timer = setTimeout(() => setBusquedaDebounced(busqueda), 400)
    return () => clearTimeout(timer)
  }, [busqueda])

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

  // Obtener filtros personalizados del revendedor
  const { filtros } = useFiltrosRevendedor(revendedorId > 0 ? revendedorId : null)

  // Stock filtrado por backend (depósito + búsqueda + marca + subrubro + filtros personalizados)
  // IMPORTANTE: cuando estamos en modo de edición de filtro (filtroEnSeleccion !== null),
  // no aplicar filtros personalizados para ver TODAS las motos disponibles
  const filtrosAplicar = filtroEnSeleccion !== null ? {} : filtrosSeleccionados
  const { stockMotocicletas, loading: stockLoading } = useStockMotocicletas({
    revendedorDestino: revendedorDestino,
    busqueda: busquedaDebounced,
    marcaCodi: marcaFiltro,
    subrubroCodi: subrubroFiltro,
    filtrosSeleccionados: filtrosAplicar,
  })

  // Listas de marcas y subrubros desde el backend (filtradas por destino del revendedor)
  const marcasDisponibles = useMarcas(revendedorDestino)
  const subrubrosDisponibles = useSubrubros(revendedorDestino)

  // Cargar valores únicos para cada filtro personalizado
  useEffect(() => {
    const cargarValores = async () => {
      const nuevosValores: Record<number, string[]> = {}
      
      for (const filtro of filtros) {
        const result = await obtenerValoresFiltro(filtro.fr_codi)
        if (result.success && result.valores) {
          nuevosValores[filtro.fr_codi] = result.valores
        }
      }
      
      setValoresFiltros(nuevosValores)
    }

    if (filtros.length > 0) {
      cargarValores()
    }
  }, [filtros])

  // Stock ya viene filtrado del backend
  const stockFiltrado = stockMotocicletas || []

  // Manejador para crear nuevo filtro
  const handleCrearFiltro = async () => {
    if (!nuevoFiltroNombre.trim() || revendedorId <= 0) {
      return
    }

    setCreandoFiltro(true)
    const result = await crearFiltroRevendedor(revendedorId, nuevoFiltroNombre.trim())
    
    if (result.success && result.filtro) {
      // Filtro creado, activar modo de selección en la tabla
      setFiltroEnSeleccion(result.filtro.fr_codi)
      setMotosSeleccionadas({})
      setNuevoFiltroNombre('')
      setMostrarCrearFiltro(false)
    } else {
      alert(`Error al crear filtro: ${result.error}`)
    }
    
    setCreandoFiltro(false)
  }

  // Manejador para guardar motos seleccionadas en el filtro
  const handleGuardarMotosDelFiltro = async () => {
    if (!filtroEnSeleccion || !hayChangesEnMotos()) {
      return
    }

    setCreandoFiltro(true)
    
    try {
      if (filtroEditando) {
        // Modo EDICIÓN: Separar motos nuevas vs existentes que cambiaron de valor vs eliminadas
        
        // Motos completamente NUEVAS (no existen en motosExistentesFiltro)
        const motosNuevas = Object.entries(motosSeleccionadas).filter(([stkCodiStr]) => {
          return !(parseInt(stkCodiStr) in motosExistentesFiltro)
        })
        
        // Motos EXISTENTES que cambiaron de valor
        const motosActualizadas = Object.entries(motosSeleccionadas).filter(([stkCodiStr, nuevoValor]) => {
          const stkCodi = parseInt(stkCodiStr)
          const valorAnterior = motosExistentesFiltro[stkCodi]
          return stkCodi in motosExistentesFiltro && valorAnterior !== nuevoValor
        })
        
        // Motos ELIMINADAS (existían pero ya no están seleccionadas)
        const motosEliminadas = Object.entries(motosExistentesFiltro).filter(([stkCodiStr]) => {
          return !(parseInt(stkCodiStr) in motosSeleccionadas)
        })
        
        // Guardar motos nuevas con POST
        for (const [stkCodiStr, vfsValor] of motosNuevas) {
          const stkCodi = parseInt(stkCodiStr)
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gestion/valores-filtro-stock/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stk_codi: stkCodi,
              fr_codi: filtroEnSeleccion,
              vfs_valor: vfsValor || 'sin asignar',
            }),
          })
        }
        
        // Actualizar motos existentes con PATCH
        for (const [stkCodiStr, nuevoValor] of motosActualizadas) {
          const stkCodi = parseInt(stkCodiStr)
          const vfsCodi = valoresExistentesIds[stkCodi]
          if (vfsCodi) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gestion/valores-filtro-stock/${vfsCodi}/`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                vfs_valor: nuevoValor || 'sin asignar',
              }),
            })
          }
        }
        
        // Eliminar motos con DELETE
        for (const [stkCodiStr] of motosEliminadas) {
          const stkCodi = parseInt(stkCodiStr)
          const vfsCodi = valoresExistentesIds[stkCodi]
          if (vfsCodi) {
            await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gestion/valores-filtro-stock/${vfsCodi}/`, {
              method: 'DELETE',
            })
          }
        }
      } else {
        // Modo CREACIÓN: Guardar todas las motos
        for (const [stkCodiStr, vfsValor] of Object.entries(motosSeleccionadas)) {
          const stkCodi = parseInt(stkCodiStr)
          await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gestion/valores-filtro-stock/`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              stk_codi: stkCodi,
              fr_codi: filtroEnSeleccion,
              vfs_valor: vfsValor || 'sin asignar',
            }),
          })
        }
      }
      
      // Limpiar estado
      setFiltroEnSeleccion(null)
      setMotosSeleccionadas({})
      setFiltroEditando(null)
      setMotosExistentesFiltro({})
      setValoresExistentesIds({})
    } catch (err) {
      alert('Error al asignar motos al filtro')
    }
    
    setCreandoFiltro(false)
  }

  // Manejador para cancelar selección de motos
  const handleCancelarSeleccion = () => {
    setFiltroEnSeleccion(null)
    setMotosSeleccionadas({})
    setFiltroEditando(null)
    setMotosExistentesFiltro({})
    setValoresExistentesIds({})
  }

  // Manejador para editar un filtro existente y agregar motos
  const handleEditarFiltroParaAgregarMotos = (filtro: any) => {
    // Cargar motos ya asignadas al filtro
    const motosAsignadas: Record<number, string> = {}
    const idsAsignados: Record<number, number> = {}
    
    // Buscar en el stock actual cuáles tienen este filtro
    stockFiltrado.forEach((item) => {
      if (item.valores_filtros) {
        const valor = item.valores_filtros.find((vf: any) => vf.fr_codi === filtro.fr_codi)
        if (valor) {
          motosAsignadas[item.stk_codi] = valor.vfs_valor
          idsAsignados[item.stk_codi] = valor.vfs_codi
        }
      }
    })
    
    // Guardar estado
    setFiltroEditando(filtro)
    setFiltroEnSeleccion(filtro.fr_codi)
    setMotosSeleccionadas(motosAsignadas)
    setMotosExistentesFiltro(motosAsignadas)
    setValoresExistentesIds(idsAsignados)
    setFiltrosSeleccionados({})  // Reset todos los dropdowns a "Todos"
  }

  // Manejador para toggle checkbox de moto
  const handleToggleMotoCheckbox = (stkCodi: number) => {
    const nuevas = { ...motosSeleccionadas }
    if (stkCodi in nuevas) {
      delete nuevas[stkCodi]
    } else {
      nuevas[stkCodi] = ''  // Valor vacío hasta que el usuario lo especifique
    }
    setMotosSeleccionadas(nuevas)
  }

  // Manejador para actualizar el valor de una moto seleccionada
  const handleActualizarValorMoto = (stkCodi: number, valor: string) => {
    setMotosSeleccionadas({
      ...motosSeleccionadas,
      [stkCodi]: valor,
    })
  }

  // Manejador para eliminar filtro


  // Manejador para editar filtro
  const handleEditarFiltro = (filtro: any) => {
    setFiltroEditandoId(filtro.fr_codi)
    setFiltroEditandoNombre(filtro.fr_nomb)
  }

  // Manejador para guardar cambios
  const handleGuardarFiltro = async () => {
    if (!filtroEditandoId || !filtroEditandoNombre.trim()) {
      return
    }

    setEditandoFiltro(true)
    const result = await actualizarFiltroRevendedor(filtroEditandoId, filtroEditandoNombre.trim())
    
    if (result.success) {
      setFiltroEditandoId(null)
      setFiltroEditandoNombre('')
      // El hook useFiltrosRevendedor se actualiza automáticamente con el polling
    } else {
      alert(`Error al actualizar filtro: ${result.error}`)
    }
    
    setEditandoFiltro(false)
  }

  // Manejador para cancelar edición
  const handleCancelarEdicion = () => {
    setFiltroEditandoId(null)
    setFiltroEditandoNombre('')
  }

  // Manejador para editar el valor del filtro (cambiar de "Sucursal 1" a "Sucursal 2")


  // Manejador para eliminar un valor de filtro por vfs_codi directo
  const handleEliminarValorDirecto = (vfsCodi: number, valorNombre: string) => {
    setModalConfirmacion({
      tipo: 'eliminar-valor',
      datos: { vfsCodi, valorNombre }
    })
  }

  const handleConfirmarEliminarValor = async (vfsCodi: number) => {
    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/gestion/valores-filtro-stock/${vfsCodi}/`,
        { method: 'DELETE' }
      )

      if (response.ok) {
        setModalConfirmacion({ tipo: null, datos: null })
        // Los datos se actualizarán automáticamente con el polling
      } else {
        alert('Error al eliminar el valor del filtro')
      }
    } catch (err) {
      alert('Error al eliminar el valor del filtro')
    }
  }

  const handleEliminarFiltro = (filtroCodi: number) => {
    setModalConfirmacion({
      tipo: 'eliminar-filtro',
      datos: { filtroCodi }
    })
  }

  const handleConfirmarEliminarFiltro = async (filtroCodi: number) => {
    const result = await eliminarFiltroRevendedor(filtroCodi)
    if (result.success) {
      setModalConfirmacion({ tipo: null, datos: null })
      setFiltroEnSeleccion(null)
      setFiltroEditando(null)
    }
  }

  // Función para detectar si hay cambios en las motos seleccionadas
  const hayChangesEnMotos = () => {
    if (!filtroEditando) {
      // En modo creación, hay cambios si hay motos seleccionadas
      return Object.keys(motosSeleccionadas).length > 0
    }
    
    // En modo edición, hay cambios si:
    // 1. Hay motos nuevas (más de las que existían)
    const hayMotosNuevas = Object.keys(motosSeleccionadas).length > Object.keys(motosExistentesFiltro).length
    
    // 2. Hay motos eliminadas (menos de las que existían)
    const hayMotosEliminadas = Object.keys(motosSeleccionadas).length < Object.keys(motosExistentesFiltro).length
    
    // 3. Hay motos con valores cambiados
    const hayValoresCambiados = Object.entries(motosSeleccionadas).some(([stkCodiStr, nuevoValor]) => {
      const stkCodi = parseInt(stkCodiStr)
      if (stkCodi in motosExistentesFiltro) {
        const valorAnterior = motosExistentesFiltro[stkCodi]
        return valorAnterior !== nuevoValor
      }
      return false
    })
    
    return hayMotosNuevas || hayMotosEliminadas || hayValoresCambiados
  }

  return (
    <main className="min-h-screen bg-background px-4 md:px-6 py-6">
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

        <div className="mb-4">
          <h2 className="text-lg md:text-xl font-semibold text-foreground">
            Consulta de Stock
          </h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Motocicletas disponibles
          </p>
        </div>

        {/* Revendedor (readonly) */}
        <div className="mb-4 rounded-lg border border-border bg-card px-3 md:px-4 py-3">
          <div className="grid grid-cols-2 gap-2 md:gap-3">
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
              <label className="text-xs font-semibold text-foreground">Revendedor</label>
              <input 
                type="text"
                value={nombreRevendedor}
                readOnly
                className="h-9 rounded-lg border border-border bg-secondary px-3 text-xs text-muted-foreground outline-none cursor-not-allowed"
              />
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="mb-4 rounded-lg border border-border bg-card px-4 md:px-6 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 md:gap-4 items-end">
            {/* Búsqueda */}
            <div className="flex flex-col gap-2 md:col-span-2">
              <label className="text-sm font-semibold text-foreground">Descripción</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input 
                  type="text"
                  value={busqueda}
                  onChange={(e) => setBusqueda(e.target.value)}
                  placeholder="Buscar por descripción, código, chasis, motor..."
                  className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>

            {/* Marca */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">Marca</label>
              <select
                value={marcaFiltro ?? ''}
                onChange={(e) => setMarcaFiltro(e.target.value ? Number(e.target.value) : null)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
              >
                <option value="">TODAS</option>
                {marcasDisponibles.map(m => (
                  <option key={m.mar_codi} value={m.mar_codi}>{m.mar_nomb}</option>
                ))}
              </select>
            </div>

            {/* SubRubro */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-semibold text-foreground">SubRubro</label>
              <select
                value={subrubroFiltro ?? ''}
                onChange={(e) => setSubrubroFiltro(e.target.value ? Number(e.target.value) : null)}
                className="h-10 rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
              >
                <option value="">TODOS</option>
                {subrubrosDisponibles.map(s => (
                  <option key={s.sru_codi} value={s.sru_codi}>{s.sru_nomb}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Filtros Personalizados */}
          {filtros.length > 0 && (
            <div className="mt-4 border-t border-border pt-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 items-end">
                {filtros.map((filtro) => (
                  <div key={filtro.fr_codi} className="flex flex-col gap-1.5 relative">
                    {/* Label o Input editable */}
                    {filtroEditandoId === filtro.fr_codi ? (
                      <input
                        type="text"
                        value={filtroEditandoNombre}
                        onChange={(e) => setFiltroEditandoNombre(e.target.value)}
                        placeholder="Nombre del filtro"
                        disabled={editandoFiltro}
                        className="h-9 rounded-lg border border-primary bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50"
                        autoFocus
                      />
                    ) : (
                      <div className="flex items-center gap-2">
                        <label className="text-xs font-semibold text-foreground">{filtro.fr_nomb}</label>
                        <button
                          onClick={() => handleEditarFiltro(filtro)}
                          className="h-6 px-1.5 rounded bg-blue-600/20 text-blue-600 hover:bg-blue-600/30 transition-colors text-xs flex items-center"
                          title="Editar nombre del filtro"
                        >
                          <Edit2 className="h-3 w-3" />
                        </button>
                      </div>
                    )}
                    
                    <div className="flex gap-1.5 items-end">
                      {filtroEditandoId === filtro.fr_codi ? (
                        <>
                          {/* Botones Guardar/Cancelar durante edición */}
                          <button
                            onClick={handleGuardarFiltro}
                            disabled={editandoFiltro || !filtroEditandoNombre.trim()}
                            className="h-9 px-2 rounded-lg bg-green-600/20 text-green-600 hover:bg-green-600/30 transition-colors text-xs flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                            title="Guardar"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={handleCancelarEdicion}
                            disabled={editandoFiltro}
                            className="h-9 px-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors text-xs flex items-center gap-1 disabled:opacity-50"
                            title="Cancelar"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          {/* Dropdown de valores para este filtro específico */}
                          <select
                            value={filtrosSeleccionados[filtro.fr_codi] || ''}
                            onChange={(e) => {
                              if (e.target.value) {
                                // Limpiar todos los demás filtros, mantener solo este
                                setFiltrosSeleccionados({
                                  [filtro.fr_codi]: e.target.value
                                })
                              } else {
                                // Si se selecciona "Todos", limpiar todos los filtros
                                setFiltrosSeleccionados({})
                              }
                            }}
                            className="h-9 flex-1 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary cursor-pointer"
                          >
                            <option value="">Todos</option>
                            {(valoresFiltros[filtro.fr_codi] || []).map((valor) => (
                              <option key={valor} value={valor}>{valor}</option>
                            ))}
                          </select>
                          {/* Botón Agregar Motos */}
                          <button
                            onClick={() => handleEditarFiltroParaAgregarMotos(filtro)}
                            className="h-9 px-2 rounded-lg bg-purple-600/20 text-purple-600 hover:bg-purple-600/30 transition-colors text-xs flex items-center gap-1"
                            title="Agregar más motos o editar valor"
                          >
                            <Plus className="h-3.5 w-3.5" />
                          </button>

                          {/* Botón Eliminar */}
                          <button
                            onClick={() => handleEliminarFiltro(filtro.fr_codi)}
                            className="h-9 px-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-xs flex items-center gap-1"
                            title="Eliminar filtro"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Botón Agregar Filtro */}
          <div className="mt-4 border-t border-border pt-4">
            {!mostrarCrearFiltro ? (
              <button
                onClick={() => setMostrarCrearFiltro(true)}
                className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold flex items-center gap-2 hover:bg-primary/90 transition-all"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar Filtro
              </button>
            ) : (
              <div className="flex gap-2 md:col-span-1">
                <input
                  type="text"
                  value={nuevoFiltroNombre}
                  onChange={(e) => setNuevoFiltroNombre(e.target.value)}
                  placeholder="Nombre del filtro (ej: Sucursal, Destino...)"
                  className="flex-1 h-9 rounded-lg border border-border bg-background px-3 text-xs text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                  disabled={creandoFiltro}
                  autoFocus
                />
                <button
                  onClick={handleCrearFiltro}
                  disabled={creandoFiltro || !nuevoFiltroNombre.trim()}
                  className="h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-semibold hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creandoFiltro ? 'Creando...' : 'Crear'}
                </button>
                <button
                  onClick={() => {
                    setMostrarCrearFiltro(false)
                    setNuevoFiltroNombre('')
                  }}
                  disabled={creandoFiltro}
                  className="h-9 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tabla de Stock */}
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {/* Barra de selección cuando filtroEnSeleccion está activo */}
          {filtroEnSeleccion !== null && (
            <div className="bg-blue-50 dark:bg-blue-950 border-b border-blue-200 dark:border-blue-800 px-3 md:px-4 py-3 flex items-center justify-between gap-3">
              <div className="text-sm text-blue-900 dark:text-blue-100 font-medium">
                {filtroEditando 
                  ? `Agregar motos al filtro "${filtroEditando.fr_nomb}" (${Object.keys(motosSeleccionadas).length - Object.keys(motosExistentesFiltro).length} nuevas)`
                  : `Selecciona las motos para asignar al filtro "${nuevoFiltroNombre}" (${Object.keys(motosSeleccionadas).length} seleccionadas)`
                }
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleGuardarMotosDelFiltro}
                  disabled={creandoFiltro || !hayChangesEnMotos()}
                  className="h-8 px-3 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {creandoFiltro ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  onClick={handleCancelarSeleccion}
                  disabled={creandoFiltro}
                  className="h-8 px-3 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancelar
                </button>
              </div>
            </div>
          )}

          <div className="px-3 md:px-4 py-3 border-b border-border">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-foreground">
                Stock de Motocicletas
              </h3>
              <span className="rounded-lg bg-secondary px-3 py-1.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                {stockFiltrado.length} registros
              </span>
            </div>
          </div>

          {stockLoading ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              Cargando stock...
            </div>
          ) : stockFiltrado.length === 0 ? (
            <div className="p-8 text-center text-sm text-muted-foreground">
              No hay motocicletas que coincidan con los filtros
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-border bg-secondary/50">
                    {filtroEnSeleccion !== null && <TableHead className="text-sm font-semibold w-14 px-3"></TableHead>}
                    <TableHead className="text-sm font-semibold px-3">Código</TableHead>
                    <TableHead className="text-sm font-semibold px-3">Descripción</TableHead>
                    <TableHead className="text-sm font-semibold px-3 hidden md:table-cell">Marca</TableHead>
                    <TableHead className="text-sm font-semibold px-3 hidden lg:table-cell">SubRubro</TableHead>
                    <TableHead className="text-sm font-semibold px-3 hidden sm:table-cell">Color</TableHead>
                    <TableHead className="text-sm font-semibold px-3">Chasis</TableHead>
                    <TableHead className="text-sm font-semibold px-3 hidden md:table-cell">Motor</TableHead>
                    <TableHead className="text-sm font-semibold px-3 hidden lg:table-cell">Certificado</TableHead>
                    <TableHead className="text-sm font-semibold px-3 hidden md:table-cell">Modelo</TableHead>
                    {filtroEnSeleccion !== null && <TableHead className="text-sm font-semibold px-3 min-w-[220px]">Valor</TableHead>}
                    {filtros.length > 0 && filtroEnSeleccion === null && <TableHead className="text-sm font-semibold px-3 min-w-[150px]">Filtro</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stockFiltrado.map((item, idx) => {
                    // Obtener el valor del filtro si existe
                    const valorFiltro = (item.valores_filtros && item.valores_filtros.length > 0)
                      ? item.valores_filtros[0]?.vfs_valor
                      : null
                    
                    // Verificar si la moto tiene un filtro asignado que NO sea el actual
                    const tieneFiltroOtro = 
                      filtroEnSeleccion !== null && 
                      item.valores_filtros && 
                      item.valores_filtros.some((vf: any) => vf.fr_codi !== filtroEnSeleccion)
                    
                    const estaSeleccionada = motosSeleccionadas.hasOwnProperty(item.stk_codi)
                    const estaExistente = motosExistentesFiltro.hasOwnProperty(item.stk_codi)
                    
                    let rowClass = 'border-b border-border hover:bg-accent/50'
                    if (tieneFiltroOtro) {
                      rowClass += ' bg-red-50 dark:bg-red-950 opacity-60'  // Motos bloqueadas por otro filtro
                    } else if (estaExistente) {
                      rowClass += ' bg-green-50 dark:bg-green-950'  // Motos ya asignadas a este filtro
                    } else if (estaSeleccionada) {
                      rowClass += ' bg-blue-50 dark:bg-blue-950'    // Motos nuevas seleccionadas
                    }
                    
                    return (
                      <TableRow key={idx} className={`${rowClass} h-12`}>
                        {filtroEnSeleccion !== null && (
                          <TableCell className="text-sm px-2 w-12">
                            <input
                              type="checkbox"
                              checked={estaSeleccionada}
                              onChange={() => handleToggleMotoCheckbox(item.stk_codi)}
                              disabled={creandoFiltro || (tieneFiltroOtro && !estaSeleccionada)}
                              title={tieneFiltroOtro && !estaSeleccionada ? 'Esta moto ya tiene otro filtro asignado' : ''}
                              className="w-4 h-4 cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
                            />
                          </TableCell>
                        )}
                        {filtroEnSeleccion !== null && (
                          <>
                            <TableCell className="text-sm font-mono px-3">
                              {item.codigoArticulo}
                            </TableCell>
                            <TableCell className="text-sm px-3">
                              <div className="flex items-center gap-2">
                                {item.descripcion}
                                {estaExistente}
                              </div>
                            </TableCell>
                            <TableCell className="text-sm px-3 hidden md:table-cell">{item.marca}</TableCell>
                            <TableCell className="text-sm px-3 hidden lg:table-cell">{item.subrubro}</TableCell>
                            <TableCell className="text-sm px-3 hidden sm:table-cell">{item.colorNombre || item.color}</TableCell>
                            <TableCell className="text-sm font-mono px-3">{item.chassis}</TableCell>
                            <TableCell className="text-sm font-mono px-3 hidden md:table-cell">{item.motor}</TableCell>
                            <TableCell className="text-sm font-mono px-3 hidden lg:table-cell">{item.certificado}</TableCell>
                            <TableCell className="text-sm px-3 hidden md:table-cell">{item.modelo}</TableCell>
                            <TableCell className="text-sm px-3 min-w-[220px]">
                              <input
                                type="text"
                                value={motosSeleccionadas[item.stk_codi] || ''}
                                onChange={(e) => handleActualizarValorMoto(item.stk_codi, e.target.value)}
                                placeholder={`Ej: ${filtroEditando?.fr_nomb || nuevoFiltroNombre} 1`}
                                disabled={!estaSeleccionada || creandoFiltro}
                                className={`w-full h-9 px-3 rounded border text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                                  estaExistente 
                                    ? 'border-green-500 bg-green-100/30 dark:bg-green-900/20' 
                                    : 'border-border bg-background'
                                }`}
                              />
                            </TableCell>
                          </>
                        )}
                        {filtroEnSeleccion === null && (
                          <>
                            <TableCell className="text-sm font-mono px-3">{item.codigoArticulo}</TableCell>
                            <TableCell className="text-sm px-3">{item.descripcion}</TableCell>
                            <TableCell className="text-sm px-3 hidden md:table-cell">{item.marca}</TableCell>
                            <TableCell className="text-sm px-3 hidden lg:table-cell">{item.subrubro}</TableCell>
                            <TableCell className="text-sm px-3 hidden sm:table-cell">{item.colorNombre || item.color}</TableCell>
                            <TableCell className="text-sm font-mono px-3">{item.chassis}</TableCell>
                            <TableCell className="text-sm font-mono px-3 hidden md:table-cell">{item.motor}</TableCell>
                            <TableCell className="text-sm font-mono px-3 hidden lg:table-cell">{item.certificado}</TableCell>
                            <TableCell className="text-sm px-3 hidden md:table-cell">{item.modelo}</TableCell>
                            {filtros.length > 0 && (
                              <TableCell className="text-sm px-3">
                                {item.valores_filtros && item.valores_filtros.length > 0 && (() => {
                                  const vf = item.valores_filtros![0];
                                  return (
                                    <div className="flex items-center gap-2">
                                      <span className="inline-block bg-primary/10 text-primary px-2 py-1 rounded text-xs font-medium">
                                        {vf?.vfs_valor}
                                      </span>
                                      <button
                                        onClick={() => handleEliminarValorDirecto(vf?.vfs_codi, vf?.vfs_valor)}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-600/10 rounded p-1 transition-colors cursor-pointer"
                                        title="Eliminar dato"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  );
                                })()}
                              </TableCell>
                            )}
                          </>
                        )}
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>



        {/* Modal de confirmación */}
        {modalConfirmacion.tipo && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-lg border border-border p-8 w-full max-w-sm shadow-lg">
              {modalConfirmacion.tipo === 'eliminar-valor' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-destructive" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                    Eliminar Valor
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    ¿Estás seguro de que quieres eliminar <span className="font-semibold text-foreground">"{modalConfirmacion.datos?.valorNombre}"</span>?
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setModalConfirmacion({ tipo: null, datos: null })}
                      className="h-9 px-4 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleConfirmarEliminarValor(modalConfirmacion.datos?.vfsCodi)}
                      className="h-9 px-4 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}

              {modalConfirmacion.tipo === 'eliminar-filtro' && (
                <>
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center">
                      <Trash2 className="w-8 h-8 text-destructive" />
                    </div>
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2 text-center">
                    Eliminar Filtro
                  </h3>
                  <p className="text-sm text-muted-foreground text-center mb-6">
                    ¿Estás seguro de que quieres eliminar este filtro? Se eliminarán todas sus asignaciones.
                  </p>
                  <div className="flex gap-3 justify-center">
                    <button
                      onClick={() => setModalConfirmacion({ tipo: null, datos: null })}
                      className="h-9 px-4 rounded-lg border border-border text-xs font-semibold hover:bg-accent transition-all"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={() => handleConfirmarEliminarFiltro(modalConfirmacion.datos?.filtroCodi)}
                      className="h-9 px-4 rounded-lg bg-destructive text-white text-xs font-semibold hover:bg-destructive/90 transition-all"
                    >
                      Eliminar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 flex items-center justify-end gap-3">
          <Link
            href={ROUTES.HOME}
            className="h-9 flex items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground transition-all hover:bg-primary/90"
          >
            Cerrar
          </Link>
        </div>
      </div>
    </main>
  )
}
